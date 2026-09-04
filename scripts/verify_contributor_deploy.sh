#!/usr/bin/env bash
# Verify the contributor form deploy against any host.
#
#   ./scripts/verify_contributor_deploy.sh                       # production
#   ./scripts/verify_contributor_deploy.sh http://localhost:3000 # local vercel dev
#
# Exits 0 only if every check passes. Checks the rendered page and the live
# endpoint, not the repository, so it tells you what a contributor would
# actually receive.
set -u
HOST="${1:-https://www.jrsstandard.com}"
PAGE="$(curl -sL --max-time 25 "$HOST/contributor.html")"
API="$(curl -s  --max-time 25 "$HOST/api/contributor?k=selftest00")"
FAIL=0

chk() { # label  expected  actual
  if [ "$2" = "$3" ]; then printf "  PASS  %-44s %s\n" "$1" "$3"
  else printf "  FAIL  %-44s expected %s, got %s\n" "$1" "$2" "$3"; FAIL=1; fi
}

echo "HOST: $HOST"
echo "--- form markup ---"
chk "single consent control present"      1 "$( [ "$(grep -c 'name="c-all"' <<<"$PAGE")" -gt 0 ] && echo 1 || echo 0 )"
chk "three consent options"               3 "$(grep -o 'value="named"\|value="anon"\|value="none"' <<<"$PAGE" | wc -l | tr -d ' ')"
chk "shortened on-file sentence"          1 "$(grep -c 'If I do not hear back from you by' <<<"$PAGE")"
chk "initiative checkboxes removed"       0 "$(grep -c 's-rtkw\|s-defend' <<<"$PAGE")"
chk "initiative payload removed"          0 "$(grep -c 'support_rtkw\|support_defend' <<<"$PAGE")"
chk "old yes/no blocks removed"           0 "$(grep -c 'name="c-named"\|name="c-use"\|name="c-transfer"' <<<"$PAGE")"
chk "consent still sent as three values"  1 "$(grep -c 'consent_named: cNamed, consent_use: cUse, consent_transfer: cTransfer' <<<"$PAGE")"
chk "no synthetic honor key on the page"  0 "$(grep -c 'H-TEST-00' <<<"$PAGE")"

echo "--- live endpoint ---"
DATE="$(python3 -c "import sys,json;print(json.load(sys.stdin).get('person',{}).get('fallback_date',''))" <<<"$API" 2>/dev/null)"
chk "deadline served by the API"          "Saturday, 5 September 2026" "$DATE"

echo "--- synthetic honor key must not exist ---"
HC="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$HOST/api/honor?k=selftest00")"
chk "H-TEST-00 absent from the roster"    404 "$HC"

echo
[ "$FAIL" -eq 0 ] && echo "RESULT: PASS" || echo "RESULT: FAIL"
exit "$FAIL"
