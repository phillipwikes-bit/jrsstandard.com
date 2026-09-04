#!/usr/bin/env bash
# Install the zero-drift pre-commit hook.
#
#   bash scripts/setup_hooks.sh            # install or update
#   bash scripts/setup_hooks.sh --uninstall
#
# NON-DESTRUCTIVE. If a pre-commit hook already exists and was not written by
# this script, it is backed up to pre-commit.pre-zero-drift.<timestamp> and the
# path is printed. Nothing is overwritten silently.
#
# The hook runs `python3 scripts/check_zero_drift.py --offline`, which needs no
# network and completes in about a quarter of a second. Network checks stay out
# of the hook on purpose: a commit must never fail because an endpoint blipped.
#
# To commit anyway when the guard is wrong, or when you are deliberately mid-fix:
#   git commit --no-verify
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_DIR="$(git -C "$REPO_ROOT" rev-parse --git-path hooks)"
HOOK_DIR="$REPO_ROOT/$HOOK_DIR"
HOOK="$HOOK_DIR/pre-commit"
MARKER="# managed-by: scripts/setup_hooks.sh (jrs zero-drift)"

if [ "${1:-}" = "--uninstall" ]; then
  if [ -f "$HOOK" ] && grep -qF "$MARKER" "$HOOK"; then
    rm -f "$HOOK"
    echo "removed $HOOK"
  else
    echo "nothing to remove: no zero-drift hook installed"
  fi
  exit 0
fi

mkdir -p "$HOOK_DIR"

if [ -f "$HOOK" ] && ! grep -qF "$MARKER" "$HOOK"; then
  BACKUP="$HOOK.pre-zero-drift.$(date +%Y%m%d%H%M%S)"
  cp "$HOOK" "$BACKUP"
  echo "existing pre-commit hook backed up to:"
  echo "  $BACKUP"
fi

cat > "$HOOK" <<'HOOK_BODY'
#!/usr/bin/env bash
# managed-by: scripts/setup_hooks.sh (jrs zero-drift)
#
# Blocks a commit that would introduce drift: a duplicated constant, a masking
# fallback, an event source nothing reads, a completer missing from the country
# map, or a generated document edited by hand.
#
# Offline only. A commit must never fail because an endpoint was slow.
# Bypass with: git commit --no-verify
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
GUARD="$REPO_ROOT/scripts/check_zero_drift.py"

[ -f "$GUARD" ] || exit 0          # guard removed: do not block the commit

if ! command -v python3 >/dev/null 2>&1; then
  echo "zero-drift: python3 not found, skipping" >&2
  exit 0
fi

OUT="$(python3 "$GUARD" --offline 2>&1)"
STATUS=$?

if [ $STATUS -ne 0 ]; then
  echo "$OUT" >&2
  echo >&2
  echo "COMMIT BLOCKED by scripts/check_zero_drift.py" >&2
  echo "Fix the FAIL lines above, or bypass with: git commit --no-verify" >&2
  exit 1
fi

echo "zero-drift: $(echo "$OUT" | tail -n 1)"
exit 0
HOOK_BODY

chmod +x "$HOOK"

echo "installed $HOOK"
echo
echo "verifying it runs..."
if bash "$HOOK"; then
  echo
  echo "OK. The hook passes on the current tree."
else
  echo
  echo "The hook FAILS on the current tree. That is the guard doing its job:"
  echo "fix the reported lines, or bypass a single commit with --no-verify."
  exit 1
fi
