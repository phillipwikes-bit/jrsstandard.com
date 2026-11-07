#!/usr/bin/env bash
set -euo pipefail
# Concurrent synthetic owner writes against disposable CI PostgreSQL only.
# Runs after tests/incomeos-revision-rpc-db.sql has installed the fixture.
payload='{"format":"incomeos-workspace","version":1,"kdf":"PBKDF2-SHA256","iterations":600000,"cipher":"AES-256-GCM","salt":"AAAAAAAAAAAAAAAAAAAAAA==","iv":"AAAAAAAAAAAAAAAA","data":"AAAAAAAAAAAAAAAAAAAAAA=="}'
sha='7cca319d5a7ae502c4b7fcbb5313aa2b5912b523750d543c2c54ce10d8b706ec'
owner='33333333-3333-4333-8333-333333333333'
psql -X -v ON_ERROR_STOP=1 -qAt -c "INSERT INTO auth.users(id) VALUES ('${owner}'); INSERT INTO incomeos_private.allowed_owners(user_id) VALUES ('${owner}');"
one=$(mktemp)
two=$(mktemp)
trap 'rm -f "$one" "$two"' EXIT
# Session A holds the transaction-level advisory lock while session B
# tries to append with the same expected revision.
(
  psql -X -v ON_ERROR_STOP=1 -qAt <<SQL
BEGIN;
SET ROLE authenticated;
SET request.jwt.claim.sub = '${owner}';
SELECT public.incomeos_append_workspace_revision(0,'${payload}','${sha}');
SELECT pg_catalog.pg_sleep(1);
COMMIT;
SQL
) >"$one" 2>&1 &
first=$!
sleep 0.15
(
  psql -X -v ON_ERROR_STOP=1 -qAt <<SQL
BEGIN;
SET ROLE authenticated;
SET request.jwt.claim.sub = '${owner}';
SELECT public.incomeos_append_workspace_revision(0,'${payload}','${sha}');
COMMIT;
SQL
) >"$two" 2>&1 &
second=$!
set +e
wait "$first"; a=$?
wait "$second"; b=$?
set -e
if [[ "$a" -ne 0 || "$b" -eq 0 ]]; then
  echo "Unexpected concurrent outcomes: first=$a second=$b" >&2
  cat "$one" "$two" >&2
  exit 1
fi
if ! grep -q 'Stale workspace revision' "$two"; then
  echo "Second concurrent writer did not fail due to CAS conflict" >&2
  cat "$two" >&2
  exit 1
fi
count=$(psql -X -v ON_ERROR_STOP=1 -qAt -c "SELECT count(*) FROM incomeos_private.workspace_revisions WHERE owner_id='${owner}' AND revision=1")
if [[ "$count" != "1" ]]; then
  echo "Expected exactly one durable revision after competing writes, got $count" >&2
  exit 1
fi
echo "PASS: concurrent synthetic writes serialize and only one owner revision commits"
