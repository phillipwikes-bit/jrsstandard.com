#!/usr/bin/env bash
# F-4 DIAGNOSTIC: why did the production build for c08b48a never run?
#
# WHY THIS SCRIPT EXISTS RATHER THAN AN INLINE COMMAND.
# The token must not travel through a chat transcript, a commit, or a shell
# history line. This script reads it from the environment, never prints it, and
# contains no secret of its own, so it is safe to commit and safe to re-run.
#
# USAGE
#   export VERCEL_TOKEN="<your token>"     # never paste this into a chat
#   bash scripts/vercel_f4_diagnose.sh > f4-output.txt 2>&1
#
# Then hand over f4-output.txt. It contains deployment metadata and build logs,
# no credentials. Skim it before sharing if you want to be certain.

set -u
TEAM="team_Q2KvghlnRA3ePBm4zAiYzbIf"
PROJ="prj_vSlMqS2nMaOUzTS6MpAAo4qYxbIR"
TARGET_SHA="c08b48a7cdca98b0ff3311c3b22b7d3bce84d7ac"   # PR #28 merge commit
API="https://api.vercel.com"

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "VERCEL_TOKEN is not set. export it first, then re-run."
  exit 2
fi
AUTH=(-H "Authorization: Bearer ${VERCEL_TOKEN}")

echo "=== 1. identity and project ==="
curl -s "${AUTH[@]}" "$API/v2/user" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); u=d.get('user',d); print('  user:', u.get('username') or u.get('email'))" 2>/dev/null \
  || echo "  could not authenticate"
curl -s "${AUTH[@]}" "$API/v9/projects/$PROJ?teamId=$TEAM" \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('  project:', d.get('name'))
print('  productionBranch:', (d.get('link') or {}).get('productionBranch'))
print('  autoExposeSystemEnvs:', d.get('autoExposeSystemEnvs'))
print('  gitForkProtection:', d.get('gitForkProtection'))
# THE MOST LIKELY CAUSE. A non-empty ignoreCommand or a paused project makes
# Vercel skip a build while GitHub still reports the merge green.
print('  *** ignoreCommand:', repr(d.get('commandForIgnoringBuildStep')))
print('  *** paused:', d.get('paused'))
print('  *** live:', d.get('live'))
" 2>/dev/null || echo "  could not read project"

echo
echo "=== 2. production deployments around 13 September 2026 ==="
curl -s "${AUTH[@]}" "$API/v6/deployments?projectId=$PROJ&teamId=$TEAM&limit=100&target=production" \
  | python3 -c "
import json,sys,datetime
d=json.load(sys.stdin)
for x in d.get('deployments',[]):
    t=datetime.datetime.utcfromtimestamp(x['created']/1000)
    if t.strftime('%Y-%m-%d') not in ('2026-09-12','2026-09-13','2026-09-14'): continue
    m=x.get('meta',{}) or {}
    print(' ', t.strftime('%m-%d %H:%M'), x.get('uid'), x.get('state'),
          'sha=' + (m.get('githubCommitSha','') or '')[:8],
          'branch=' + (m.get('githubCommitRef','') or ''),
          'msg=' + (m.get('githubCommitMessage','') or '')[:48].replace(chr(10),' '))
" 2>/dev/null || echo "  could not list deployments"

echo
echo "=== 3. is there ANY deployment for the merge commit that did not deploy? ==="
curl -s "${AUTH[@]}" "$API/v6/deployments?projectId=$PROJ&teamId=$TEAM&limit=100" \
  | python3 -c "
import json,sys,datetime
d=json.load(sys.stdin); sha='$TARGET_SHA'
hits=[x for x in d.get('deployments',[]) if (x.get('meta',{}) or {}).get('githubCommitSha','')==sha]
if not hits:
    print('  NO DEPLOYMENT EXISTS for', sha[:8], '-> the build was never created at all.')
    print('  That points at the Git integration or an ignored build step, not a failed build.')
for x in hits:
    t=datetime.datetime.utcfromtimestamp(x['created']/1000)
    print(' ', t, x.get('uid'), 'state=' + str(x.get('state')), 'target=' + str(x.get('target')))
    print('    inspect: https://vercel.com/$TEAM/jrsstandard-com/' + str(x.get('uid','')))
" 2>/dev/null || echo "  could not query"

echo
echo "=== 4. build logs for the newest production deployment ==="
UID=$(curl -s "${AUTH[@]}" "$API/v6/deployments?projectId=$PROJ&teamId=$TEAM&limit=1&target=production" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['deployments'][0]['uid'])" 2>/dev/null)
if [ -n "${UID:-}" ]; then
  echo "  deployment $UID"
  curl -s "${AUTH[@]}" "$API/v2/deployments/$UID/events?builds=1&limit=200" \
    | python3 -c "
import json,sys
try:
    ev=json.load(sys.stdin)
except Exception:
    print('  no parsable events'); raise SystemExit
for e in (ev if isinstance(ev,list) else ev.get('events',[])):
    txt=e.get('text') or (e.get('payload',{}) or {}).get('text') or ''
    if txt.strip(): print('   ', txt.rstrip()[:200])
" 2>/dev/null || echo "  could not read events"
fi

echo
echo "=== done. This output contains no credentials. ==="
