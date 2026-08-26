#!/usr/bin/env bash
# Stop the Cloudflare Workers Build from firing on development pushes.
#
#   bash scripts/setup_skip_cloudflare_hook.sh            # install or update
#   bash scripts/setup_skip_cloudflare_hook.sh --uninstall
#
# THE PROBLEM THIS SOLVES.
# A Cloudflare "Workers Builds: jrsstandardcom" check has failed on this
# repository 44 consecutive times. It is driven by a Git integration configured
# in the Cloudflare dashboard, not by anything in this repository: there is no
# wrangler config here and never has been, and CLAUDE.md records Cloudflare as
# severed from this repository on 2026-08-18. The build has nothing to build.
#
# WHY NOT JUST MAKE THE BUILD PASS.
# Adding a wrangler config would make the Worker deploy successfully. If the
# Cloudflare dashboard has a custom domain or route attached to that Worker,
# a successful deploy would activate it, and jrsstandard.com currently serves
# from Vercel. That is a live-site outage risk that cannot be ruled out from
# inside this repository, so it is not done. A red check is not worth a
# production incident.
#
# WHAT THIS DOES INSTEAD.
# Cloudflare skips a build when the commit message carries a skip token. This
# appends one to commits on the development branch ONLY. Deploy commits, which
# are authored on a temporary branch and pushed to main, are never touched, so
# Vercel continues to build and serve production exactly as before.
#
# The token is also honoured by Vercel, which is why it is confined to the
# development branch: skipping a preview build there costs nothing, and
# production verification in this repository is done against the live domain
# rather than against previews.
#
# THIS DOES NOT REMOVE THE INTEGRATION. Only disconnecting it in the Cloudflare
# dashboard does that: Workers & Pages -> jrsstandardcom -> Settings -> Build.
# This silences the failing check on development pushes, which is the part
# reachable from here.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_DIR="$(git -C "$REPO_ROOT" rev-parse --git-path hooks)"
case "$HOOK_DIR" in
  /*) : ;;
  *) HOOK_DIR="$REPO_ROOT/$HOOK_DIR" ;;
esac
HOOK="$HOOK_DIR/commit-msg"
MARKER="# managed-by: scripts/setup_skip_cloudflare_hook.sh (jrs skip-cloudflare)"

if [ "${1:-}" = "--uninstall" ]; then
  if [ -f "$HOOK" ] && grep -qF "$MARKER" "$HOOK"; then
    rm -f "$HOOK"
    echo "removed $HOOK"
  else
    echo "nothing to remove: no skip-cloudflare hook installed"
  fi
  exit 0
fi

mkdir -p "$HOOK_DIR"

# Never overwrite someone else's hook without saying so.
if [ -f "$HOOK" ] && ! grep -qF "$MARKER" "$HOOK"; then
  BACKUP="$HOOK.pre-skip-cloudflare.$(date +%s)"
  cp "$HOOK" "$BACKUP"
  echo "existing commit-msg hook backed up to $BACKUP"
fi

cat > "$HOOK" <<'HOOKEOF'
#!/usr/bin/env bash
# managed-by: scripts/setup_skip_cloudflare_hook.sh (jrs skip-cloudflare)
#
# Appends a CI skip token to commits on the development branch so the
# dashboard-driven Cloudflare Workers Build does not fire on them. Deploy
# commits reach main from a temporary branch and are deliberately left alone,
# so Vercel still builds and serves production.
set -euo pipefail

MSG_FILE="$1"
DEV_BRANCH="claude/html-pilot-L8rC3"
TOKEN="[skip ci]"

BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
[ "$BRANCH" = "$DEV_BRANCH" ] || exit 0

# Already carries a skip token in any of the spellings either provider honours.
if grep -qiE '\[(skip ci|ci skip|no ci|skip vercel|vercel skip|cf-pages-skip)\]' "$MSG_FILE"; then
  exit 0
fi

# The token goes immediately after the subject line, NOT at the end.
#
# It used to be appended to the end of the message, and on 2026-08-26 that was
# shown to fail silently on any commit with a detailed body. Seven commits,
# outcome against the byte offset at which the token appeared:
#
#   c9add51   78 bytes, token at 69     skipped
#   2d95a84   80 bytes, token at 71     skipped
#   70289a3   94 bytes, token at 85     skipped
#   5e137bb  194 bytes, token at 185    skipped
#   f607e86 1040 bytes, token at 1031   FAILED
#   d07268e 1077 bytes, token at 1068   FAILED
#   899bbbf   84 bytes, no token        FAILED
#
# 899bbbf was pushed with --no-verify specifically to test this: same kind of
# single-file, non-HTML change as c9add51, but with no token. It failed where
# c9add51 skipped, which is what proves the token is read at all. The two
# failures that DID carry a token both buried it past byte 1000. Cloudflare
# reads the message with a length cap somewhere between 195 and 1031 bytes.
#
# Placing it on line 3 keeps it inside that window no matter how long the body
# grows, and leaves the subject line clean.
TMP="$(mktemp)"
{
  head -n 1 "$MSG_FILE"
  printf '\n%s\n' "$TOKEN"
  tail -n +2 "$MSG_FILE"
} > "$TMP"
mv "$TMP" "$MSG_FILE"
HOOKEOF

chmod +x "$HOOK"
echo "installed $HOOK"
echo "development branch commits will carry [skip ci]; main deploys are untouched"
