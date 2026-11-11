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

# Repeat real PostgreSQL transaction races at successive server revisions.
# Both processes start with the same expected revision; either may win.
# A nonzero exit is counted only if PostgreSQL reports the exact CAS refusal.
soak_cycles=24
committed=0
conflicts=0
started_at=$(date +%s)
for ((cycle=1; cycle<=soak_cycles; cycle++)); do
  for log in "$one" "$two"; do
    (
      psql -X -v ON_ERROR_STOP=1 -qAt <<SQL
BEGIN;
SET ROLE authenticated;
SET request.jwt.claim.sub = '${owner}';
SELECT public.incomeos_append_workspace_revision(${cycle},'${payload}','${sha}');
SELECT pg_catalog.pg_sleep(0.03);
COMMIT;
SQL
    ) >"$log" 2>&1 &
    if [[ "$log" == "$one" ]]; then first=$!; else second=$!; fi
  done
  set +e
  wait "$first"; a=$?
  wait "$second"; b=$?
  set -e
  if [[ "$a" -eq 0 && "$b" -ne 0 ]]; then
    rejected_log=$two
  elif [[ "$b" -eq 0 && "$a" -ne 0 ]]; then
    rejected_log=$one
  else
    echo "Unexpected soak outcomes at cycle $cycle: first=$a second=$b" >&2
    cat "$one" "$two" >&2
    exit 1
  fi
  if ! grep -q 'Stale workspace revision' "$rejected_log"; then
    echo "Soak failure was not an expected CAS conflict at cycle $cycle" >&2
    cat "$rejected_log" >&2
    exit 1
  fi
  committed=$((committed+1))
  conflicts=$((conflicts+1))
done
current_revision=$((soak_cycles+1))
summary=$(psql -X -v ON_ERROR_STOP=1 -qAt -c "SELECT count(*)||':'||max(revision)||':'||count(DISTINCT revision) FROM incomeos_private.workspace_revisions WHERE owner_id='${owner}'")
if [[ "$summary" != "${current_revision}:${current_revision}:${current_revision}" ]]; then
  echo "Soak did not retain one contiguous owner history: $summary" >&2
  exit 1
fi

# A rolled-back transaction must neither consume a revision nor authorize a
# stale writer. The next separately requested append uses the verified head.
psql -X -v ON_ERROR_STOP=1 -qAt <<SQL >/dev/null
BEGIN;
SET ROLE authenticated;
SET request.jwt.claim.sub = '${owner}';
SELECT public.incomeos_append_workspace_revision(${current_revision},'${payload}','${sha}');
ROLLBACK;
SQL
after_rollback=$(psql -X -v ON_ERROR_STOP=1 -qAt -c "SELECT max(revision) FROM incomeos_private.workspace_revisions WHERE owner_id='${owner}'")
if [[ "$after_rollback" != "$current_revision" ]]; then
  echo "Rolled-back append changed durable owner history" >&2
  exit 1
fi
recovered_revision=$(psql -X -v ON_ERROR_STOP=1 -qAt <<SQL
BEGIN;
SET ROLE authenticated;
SET request.jwt.claim.sub = '${owner}';
SELECT public.incomeos_append_workspace_revision(${current_revision},'${payload}','${sha}');
COMMIT;
SQL
)
if [[ "$recovered_revision" != "$((current_revision+1))" ]]; then
  echo "Explicit recovery append did not advance the exact current revision" >&2
  exit 1
fi
other_owners=$(psql -X -v ON_ERROR_STOP=1 -qAt -c "SELECT count(*) FROM incomeos_private.workspace_revisions WHERE owner_id IN ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222') AND revision=1")
if [[ "$other_owners" != "2" ]]; then
  echo "Concurrent owner exercise affected another owner's records" >&2
  exit 1
fi
elapsed=$(( $(date +%s)-started_at ))
printf '{"scope":"disposable-postgresql-synthetic","raceCycles":%d,"attemptedRaceWrites":%d,"committedRaceWrites":%d,"rejectedStaleWrites":%d,"rollbackChecks":1,"explicitRecoveryAppends":1,"elapsedSeconds":%d,"unexpectedFailures":0}\n' \
  "$soak_cycles" "$((soak_cycles*2))" "$committed" "$conflicts" "$elapsed"
echo "PASS: PostgreSQL sustained CAS races, contiguous history, transaction rollback and explicit recovery"
