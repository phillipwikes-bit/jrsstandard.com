#!/usr/bin/env bash
# Vercel CLI inspection and manual production deploy for jrsstandard.com.
#
# WHY THIS EXISTS. On 2026-09-02 the selective deploy d3a3631 landed on main
# and Vercel produced no production build for it in 30 minutes while building
# every dev-branch preview within seconds. The dashboard is not reachable from
# the session environment, so this script does the CLI equivalent: reports the
# production deployment state, and can force a production deploy.
#
# IT DEPLOYS A CLEAN CHECKOUT OF origin/main, NOT THE WORKING TREE.
# `vercel --prod` from the repository root would publish whatever is checked
# out, which on the development branch includes files never authorised for
# production. The authorised deploy is exactly what is on main, so the script
# builds a detached worktree at origin/main and deploys that. .vercelignore is
# defence in depth, not the control: the control is deploying only main.
#
#   VERCEL_TOKEN=xxx ./scripts/vercel_production_deploy.sh          # inspect
#   VERCEL_TOKEN=xxx ./scripts/vercel_production_deploy.sh --deploy # inspect+deploy
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECT_SHA="${EXPECT_SHA:-d3a3631}"
PROD_HOST="https://www.jrsstandard.com"
MARKER="Study status"
PDFS=(
  "JRS_Operational_Evaluation_Study_Twenty_Record_Ledger.pdf"
  "JRS_Practitioner_Self_Review_Final.pdf"
)
DO_DEPLOY=0
[ "${1:-}" = "--deploy" ] && DO_DEPLOY=1

fail() { printf '[REQUIRED_ENV_PARAM] %s\n' "$1" >&2; exit 2; }

if [ -z "${VERCEL_TOKEN:-}" ]; then
  fail "VERCEL_TOKEN is not set. The Vercel CLI is not installed in this
  environment, there is no ~/.vercel or ~/.local/share/com.vercel.cli
  credential store, no .vercel project link in the repository, and no VERCEL_*
  variable is exported. Tasks 1 and 2 cannot run without a token.
  Create one at https://vercel.com/account/tokens with scope over the
  phillip-wikes-projects team, then re-run:
      VERCEL_TOKEN=<token> $0 --deploy"
fi

VC="npx --yes vercel@latest"
AUTH=(--token "$VERCEL_TOKEN")

echo "=== TASK 1a: identity ==="
$VC whoami "${AUTH[@]}"

echo
echo "=== TASK 1b: projects ==="
$VC project ls "${AUTH[@]}" 2>&1 | head -20

echo
echo "=== TASK 1c: production deployments, newest first ==="
$VC ls jrsstandard-com --prod "${AUTH[@]}" 2>&1 | head -20 \
  || $VC deployments ls jrsstandard-com "${AUTH[@]}" 2>&1 | head -20

echo
echo "=== TASK 1d: is there a build for $EXPECT_SHA ==="
if $VC ls jrsstandard-com --prod "${AUTH[@]}" 2>/dev/null | grep -q "$EXPECT_SHA"; then
  echo "  a production deployment referencing $EXPECT_SHA EXISTS"
else
  echo "  NO production deployment references $EXPECT_SHA"
fi

if [ "$DO_DEPLOY" -eq 0 ]; then
  echo
  echo "inspection only. re-run with --deploy to force a production deploy."
  exit 0
fi

echo
echo "=== TASK 2: deploy a clean checkout of origin/main ==="
git -C "$REPO_ROOT" fetch origin main --quiet
WT="$(mktemp -d)/main"
git -C "$REPO_ROOT" worktree add --detach "$WT" origin/main --quiet
cleanup() { git -C "$REPO_ROOT" worktree remove --force "$WT" >/dev/null 2>&1 || true; }
trap cleanup EXIT
echo "  worktree at origin/main: $(git -C "$WT" rev-parse --short HEAD)"

# The deploy must carry nothing private. Assert before the upload, not after.
for p in research scripts cep-article-prep .claude; do
  if [ -e "$WT/$p" ] && ! grep -qx "$p/" "$WT/.vercelignore" 2>/dev/null; then
    fail "$p/ is present in the main tree and not excluded by .vercelignore;
  refusing to deploy"
  fi
done
if ls "$WT"/*.md >/dev/null 2>&1 && ! grep -qx '\*\.md' "$WT/.vercelignore"; then
  fail "markdown at the tree root is not excluded by .vercelignore; refusing"
fi
echo "  pre-upload exclusion assertions passed"

( cd "$WT" && $VC deploy --prod --yes "${AUTH[@]}" )

echo
echo "=== TASK 3: production verification ==="
for i in $(seq 1 60); do
  body="$(curl -fsSL --max-time 30 "$PROD_HOST/?cb=$(date +%s)" || true)"
  case "$body" in *"$MARKER"*) break;; esac
  sleep 10
done

ok=0; bad=0
printf '  %-56s ' "$MARKER in index.html"
if printf '%s' "$body" | grep -qF "$MARKER"; then echo "PRESENT"; ok=$((ok+1)); else echo "MISSING"; bad=$((bad+1)); fi
printf '  %-56s ' "pre-line on the card body"
if printf '%s' "$body" | grep -qF "white-space:pre-line"; then echo "PRESENT"; ok=$((ok+1)); else echo "MISSING"; bad=$((bad+1)); fi
for f in "${PDFS[@]}"; do
  code_type="$(curl -sL -o /dev/null -w '%{http_code} %{content_type}' --max-time 40 "$PROD_HOST/$f?cb=$(date +%s)")"
  printf '  %-56s %s\n' "$f" "$code_type"
  case "$code_type" in "200 application/pdf"*) ok=$((ok+1));; *) bad=$((bad+1));; esac
done

echo
echo "  passed $ok, failed $bad"
[ "$bad" -eq 0 ] || exit 1
