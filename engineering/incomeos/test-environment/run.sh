#!/usr/bin/env bash
# IncomeOS free test environment. One command, no account, no cost.
# Starts a throwaway Supabase stack on this machine with Docker, installs the
# staged workspace-revision database design, runs the checks with made-up
# accounts, prints a plain-English report, then deletes the stack.
# It never contacts the live IncomeOS project.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../../.." && pwd)"
cli=(npx --yes supabase@2.122.1)
work="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/incomeos-test-env-$$"

command -v docker >/dev/null || { echo "Docker is needed to run this on your own computer. On GitHub it runs by itself."; exit 2; }
docker info >/dev/null 2>&1 || { echo "Docker is installed but not running. Start Docker and run this again."; exit 2; }
command -v psql >/dev/null || { echo "The psql program is needed (package: postgresql-client)."; exit 2; }

mkdir -p "$work"
cleanup() {
  "${cli[@]}" stop --workdir "$work" --no-backup >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

echo "Starting a throwaway Supabase stack. The first run downloads it and takes a few minutes."
"${cli[@]}" init --workdir "$work" </dev/null >/dev/null
"${cli[@]}" start --workdir "$work" -x studio,imgproxy,edge-runtime,logflare,vector,realtime,storage-api >/dev/null

settings="$("${cli[@]}" status --workdir "$work" -o env 2>/dev/null)"
value() { printf '%s\n' "$settings" | sed -n "s/^$1=\"\{0,1\}\([^\"]*\)\"\{0,1\}$/\1/p" | head -n 1; }
export API_URL ANON_KEY SERVICE_ROLE_KEY DB_URL
API_URL="$(value API_URL)"; ANON_KEY="$(value ANON_KEY)"
SERVICE_ROLE_KEY="$(value SERVICE_ROLE_KEY)"; DB_URL="$(value DB_URL)"
case "$API_URL" in http://127.0.0.1:*|http://localhost:*) ;; *) echo "Refused: the stack did not report a local address."; exit 2;; esac

echo "Installing the staged database design into the throwaway database."
psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 \
  -f "$repo/engineering/incomeos/workspace-revision-staging.sql" \
  -f "$repo/engineering/incomeos/workspace-revision-rpc-staging.sql" \
  -c "notify pgrst, 'reload schema'"

node "$here/check.cjs"
