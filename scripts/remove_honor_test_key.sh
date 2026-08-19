#!/usr/bin/env bash
# ONE COMMAND TO TAKE THE SYNTHETIC HONOR KEY BACK OUT OF PRODUCTION.
#
#   ./scripts/remove_honor_test_key.sh
#
# Strips the 'selftest00' / H-TEST-00 row from api/honor.js, commits it to the
# dev branch, and deploys ONLY api/honor.js to main using the selective
# pattern, so research/ can never ride along. Verifies live afterwards.
set -euo pipefail
cd "$(dirname "$0")/.."
DEV="claude/html-pilot-L8rC3"

python3 - <<'PY'
import io, re, sys
p = 'api/honor.js'
s = io.open(p, encoding='utf-8').read()
if 'selftest00' not in s:
    print('already absent; nothing to strip'); sys.exit(0)
pat = re.compile(r"  // SYNTHETIC\. Deploy and demonstration key.*?\n  'selftest00': \{.*?\n  \},\n", re.S)
assert len(pat.findall(s)) == 1, 'expected exactly one synthetic block'
s = pat.sub('', s, count=1)
assert 'selftest00' not in s and 'H-TEST-00' not in s, 'residual reference'
io.open(p, 'w', encoding='utf-8').write(s)
print('stripped')
PY

node --check api/honor.js
python3 scripts/check_zero_drift.py >/dev/null

git add api/honor.js
git commit -q -m "Remove synthetic honor key H-TEST-00 from production" || true
git push -q -u origin "$DEV"

git fetch -q origin main
git checkout -q -B deploy-tmp origin/main
git checkout "$DEV" -- api/honor.js
test "$(git diff --cached --name-only | grep -c '^research/')" -eq 0
git commit -q -m "Remove synthetic honor key H-TEST-00 from production"
git push -q origin deploy-tmp:main
git checkout -q "$DEV"
git branch -q -D deploy-tmp

echo "pushed. verifying live..."
for i in 1 2 3 4 5 6 7 8; do
  c=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://www.jrsstandard.com/api/honor?k=selftest00")
  [ "$c" = "404" ] && { echo "REMOVED: /api/honor?k=selftest00 -> 404"; exit 0; }
  curl -s -o /dev/null --max-time 8 https://www.jrsstandard.com/ >/dev/null 2>&1
done
echo "still resolving; check again shortly"; exit 1
