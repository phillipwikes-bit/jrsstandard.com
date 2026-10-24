#!/bin/bash
# External Gate 4C recovery drill. Writes only under $T and $O. Never writes to the live repository.
set -u
LIVE=/home/user/jrsstandard.com
SP=/tmp/claude-0/-home-user-jrsstandard-com/2ef9dc98-85d0-521a-aea1-a739f5ce030f/scratchpad
ARC=$SP/g4b/JRS_CONTROLLED_LOCAL_ARCHIVE_2026-10-24.tar.gz
N=JRS_CONTROLLED_LOCAL_ARCHIVE_2026-10-24
O=$SP/g4c/out; mkdir -p $O; : > $O/log.txt
T=$(mktemp -d /tmp/g4c-drill-XXXXXX); echo "TMP $T" >> $O/log.txt
L() { echo "$*" >> $O/log.txt; }
FAIL() { L "STOP: $*"; L "RESULT FAILED"; exit 1; }
E="env -u ANTHROPIC_BASE_URL -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN"
fp() { (cd "$1" && git ls-files | xargs sha256sum | sha256sum | cut -c1-64; git ls-files --others --exclude-standard | sort | xargs sha256sum | sha256sum | cut -c1-64; git rev-parse HEAD) | tr '\n' ' '; }
L "LIVE_PRE $(fp $LIVE)"
(cd $SP/g4b && sha256sum -c --quiet $N.tar.gz.sha256) && L "ARCHIVE_HASH OK" || FAIL "archive hash"
mkdir $T/x && tar -C $T/x -xzf $ARC || FAIL "extract"
(cd $T/x/$N && sha256sum -c --quiet ARCHIVE_MANIFEST_SHA256.txt) && L "ARCHIVE_MANIFEST OK ($(wc -l < $T/x/$N/ARCHIVE_MANIFEST_SHA256.txt) entries)" || FAIL "archive manifest"
L "TOPLEVEL $(ls $T/x/$N | tr '\n' ' ')"
X=$(cd $T/x/$N && find . -type f | sed 's#^\./##' | grep -vcE "^(ARCHIVE_MANIFEST_SHA256\.txt|RESTORATION_NOTE\.md|OUTSIDE_REPOSITORY_B018/[^/]+|gate-records/external-gate-(2|3|4a)/[^/]+|local-packages/(lib|tests|tools|research)/.+)$"); [ "$X" = 0 ] && L "STRUCTURE OK" || FAIL "unexpected paths: $X"
Y=$(cd $T/x/$N && find . | grep -ciE "(\.git/|project_sources|(^|/)\.env|node_modules|Source_Aligned|Blueprint_Aligned)"); [ "$Y" = 0 ] && L "EXCLUSIONS OK" || FAIL "excluded material: $Y"
git clone --quiet --no-hardlinks $LIVE $T/clone 2>>$O/log.txt || FAIL "clone"
C=$T/clone; cd $C
[ "$(git rev-parse HEAD)" = 428c307af510ff7378615777251fe252dab2dac7 ] || FAIL "clone HEAD"
git branch --quiet claude/engine-assurance-2026-10-10 origin/claude/engine-assurance-2026-10-10 2>>$O/log.txt
L "CLONE HEAD $(git rev-parse HEAD) branch $(git rev-parse --abbrev-ref HEAD) pr40branch $(git rev-parse claude/engine-assurance-2026-10-10 2>/dev/null)"
L "CLONE_TRACKED_FP $(git ls-files | xargs sha256sum | sha256sum | cut -c1-64) untracked $(git ls-files --others --exclude-standard | wc -l)"
tar -C $T/x/$N/local-packages -cf - . | tar -C $C -xpf - || FAIL "restore"
[ -e $C/OUTSIDE_REPOSITORY_B018 ] && FAIL "B018 material in clone"
(cd $C && git ls-files --others --exclude-standard | LC_ALL=C sort) > $T/restored.txt
(sed -n 's#^[0-9a-f]\{64\}  local-packages/##p' $T/x/$N/ARCHIVE_MANIFEST_SHA256.txt | LC_ALL=C sort) > $T/archived.txt
cmp -s $T/restored.txt $T/archived.txt && L "RESTORED_PATHS EQUAL ARCHIVE ($(wc -l < $T/restored.txt))" || FAIL "restored path set differs"
(cd $T/x/$N && sed -n 's#^\([0-9a-f]\{64\}\)  local-packages/\(.*\)$#\1  \2#p' ARCHIVE_MANIFEST_SHA256.txt) > $T/restored-manifest.txt
(cd $C && sha256sum -c --quiet $T/restored-manifest.txt) && L "RESTORED_BYTES OK" || FAIL "restored bytes"
for p in lib/engine-reliability lib/engine-evidence-graph-v0.3.1-candidate lib/engine-governance-phase8 lib/engine-human-review-phase9 research/engine-reliability-phase6-2026-10-17 research/engine-remediation-phase7-2026-10-19 research/engine-governance-phase8-2026-10-19 research/engine-human-review-phase9-2026-10-20 tests tools; do L "COUNT $p $(grep -c "^$p/" $T/restored.txt)"; done
L "UNTRACKED_FP_CLONE $(git ls-files --others --exclude-standard | sort | xargs sha256sum | sha256sum | cut -c1-64)"
cd $C
for m in research/engine-governance-phase8-2026-10-19/registry/manifests/{v1-historical,v0.1-assurance,v0.2-evidence-contract,v0.3-evidence-graph,phase4-change-control,phase6-reliability,phase7-candidate}.sha256; do grep -v "^#" $m | sha256sum -c --quiet && L "MANIFEST OK $(basename $m)" || FAIL "manifest $m"; done
grep -v "^#" research/engine-governance-phase8-2026-10-19/PHASE8_FILE_MANIFEST_SHA256.txt | sha256sum -c --quiet && L "MANIFEST OK PHASE8_FILE_MANIFEST" || FAIL "phase8 manifest"
grep -v "^#" research/engine-human-review-phase9-2026-10-20/PHASE9_FILE_MANIFEST_SHA256.txt | sha256sum -c --quiet && L "MANIFEST OK PHASE9 v2 ($(head -1 research/engine-human-review-phase9-2026-10-20/PHASE9_FILE_MANIFEST_SHA256.txt))" || FAIL "phase9 manifest"
L "PHASE9 v1 preserved $(sha256sum research/engine-human-review-phase9-2026-10-20/manifest-history/v1.sha256 | cut -c1-64) $(head -1 research/engine-human-review-phase9-2026-10-20/manifest-history/v1.sha256)"
$E node research/engine-remediation-phase7-2026-10-19/tooling/verify-seal.mjs > $O/p7-seal.txt 2>&1; L "P7_SEAL exit=$? $(tail -1 $O/p7-seal.txt | cut -c1-160)"
CF() { git ls-files | xargs sha256sum | sha256sum | cut -c1-64; git ls-files --others --exclude-standard | sort | xargs sha256sum | sha256sum | cut -c1-64; }
CF > $T/clone-pre.txt
$E node tools/engine-reliability-replay.mjs > $O/p6-replay.txt 2>&1; L "P6_REPLAY exit=$? $(tail -2 $O/p6-replay.txt | tr '\n' ' ' | cut -c1-200)"
$E node tools/engine-governance-phase8-replay.mjs > $O/composition.txt 2>&1; L "COMPOSITION exit=$? $(grep -E '^verdict|^registry-derived' $O/composition.txt | tr '\n' ' ')"
$E node tests/engine-governance-phase8/run.mjs > $O/p8.txt 2>&1; L "P8 exit=$? $(grep 'checks:' $O/p8.txt)"
$E node tests/engine-human-review-phase9/run.mjs > $O/p9.txt 2>&1; L "P9 exit=$? $(tail -1 $O/p9.txt)"
$E node tools/engine-human-review-phase9-replay.mjs > $O/p9-replay.txt 2>&1; L "P9_REPLAY exit=$? $(tr -d '\n ' < $O/p9-replay.txt | grep -oE '"as_sealed":[0-9]+|"results_identical_to_first_run":[a-z]+|"more_favourable":[0-9]+|"network_attempts":[0-9]+' | tr '\n' ' ')"
CF > $T/clone-post.txt
cmp -s $T/clone-pre.txt $T/clone-post.txt && L "CLONE_UNCHANGED_BY_CHECKS" || L "CLONE_CHANGED_BY_CHECKS"
cd /
L "LIVE_POST $(fp $LIVE)"
rm -rf $T && [ ! -e $T ] && L "CLEANUP OK ($T removed)"
L "DONE"
