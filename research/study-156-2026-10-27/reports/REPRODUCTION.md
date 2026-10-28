# Reproduction Commands (156-record study)

All commands are offline. Run them from the repository root unless a step says otherwise.
- Keep `ANTHROPIC_BASE_URL` unset.
- Never set a provider credential.
- Every runner and test installs a network guard that counts and blocks outbound attempts.
- Every output file is write-once: a tool refuses to overwrite an existing result.

Recorded environment: Node v22.22.0, linux x64, time zone UTC, locale en-US; run-3 used Pacific/Kiritimati and tr-TR. Evaluation clock: 2026-10-27T12:00:00Z (the runners' default).

## 0. Verify

```sh
unset ANTHROPIC_BASE_URL
cd research/study-156-2026-10-27
node tools/verify-seal.mjs                      # corpus 131 files, freeze 2,215 files, ok:true
sha256sum -c PACKAGE_MANIFEST_SHA256.txt | grep -v ': OK$'   # prints nothing when every file matches
```

## 1. Fresh copy (for tools that write to fixed paths)

The probe, mutation, transport and recovery tools write to fixed paths under `out/` and refuse if a result exists. To rerun them, work in a copy. Keep `history/`, because the freeze seal lists it.

```sh
R=$(mktemp -d)
mkdir -p $R/research/validation-readiness-gate-v0-2026-10-25 $R/research/engine-correction-v0-02-ev32-2026-10-25
cp -r research/study-156-2026-10-27 $R/research/ && rm -rf $R/research/study-156-2026-10-27/out
cp -r research/validation-readiness-gate-v0-2026-10-25/tools $R/research/validation-readiness-gate-v0-2026-10-25/
cp -r research/engine-correction-v0-02-ev32-2026-10-25/candidate research/engine-correction-v0-02-ev32-2026-10-25/CANDIDATE_0.3.2_MANIFEST_SHA256.txt $R/research/engine-correction-v0-02-ev32-2026-10-25/
cd $R/research/study-156-2026-10-27 && S=$(mktemp -d)
```

The 0.3.1 engine of record is read from the repository at `/home/user/jrsstandard.com`, read-only and manifest-checked. On another machine, edit `REPO` in `research/validation-readiness-gate-v0-2026-10-25/tools/harness/isolate.mjs` in the copy, and record that edit.

## 2. Test suites (inside the copy)

```sh
node tools/research-probes.mjs $S                       # 89 of 89
node tools/regression-probes.mjs $S                     # 32 of 32
for v in 0.3.1-candidate 0.3.2-candidate 0.3.3-research-candidate; do node tools/feature-probes.mjs $v $S; done   # 343 of 343 each
node tools/run-differential.mjs $S                      # 310 identical
node tools/transport/test-transport.mjs                 # 49 of 49
node tools/score-control-templates.mjs $S               # 8 of 9 research templates meet all four rubric checks
node tools/mutation-tests.mjs $S                        # 30 of 32 non-equivalent killed by probes
node tools/recovery-tests.mjs $S                        # 9 of 10 (HF-01)
node post-freeze/recovery-tests-v1.1.mjs $S             # 10 of 10
```

## 3. Scored runs (in place or in the copy; use new labels)

Each runner needs its scratch directory to exist (it creates isolated engine copies inside it):

```sh
mkdir -p $S/r4 $S/r5 $S/r6 $S/v3 $S/v4
node tools/run-study.mjs run-4 $S/r4
node tools/run-study.mjs run-5 $S/r5
TZ=Pacific/Kiritimati LANG=tr_TR.UTF-8 LC_ALL=tr_TR.UTF-8 node tools/run-study.mjs run-6 $S/r6
node tools/run-variants.mjs vrun-3 $S/v3
node tools/run-variants.mjs vrun-4 $S/v4
node tools/analyze.mjs --r1=run-4 --r2=run-5 --r3=run-6 --v1=vrun-3 --v2=vrun-4 --out=$S/analysis
```

A `run-N` label refuses to start unless the corpus and freeze seals and the candidate manifest verify.

Compare a reproduced run with the recorded one:

```sh
node -e 'const f=(p)=>new Map(JSON.parse(require("fs").readFileSync(p,"utf8")).rows.filter(r=>r.graph_digest).map(r=>[r.arm+"/"+r.id,r.graph_digest]));
const a=f("out/run-1/RESULTS.json"), b=f("out/run-4/RESULTS.json"); let s=0; for (const [k,v] of a) if (b.get(k)===v) s++; console.log(s+"/"+a.size+" identical")'
```

Expected: `1120/1120 identical`.

## 4. Builders (already run; each refuses to overwrite)

```sh
node tools/generate-synthetic.mjs          # records/synthetic (sealed in seals/corpus)
node tools/build-inventory.mjs             # inventory v1 (sealed)
node tools/build-inventory-v2.mjs
node tools/build-feature-matrix.mjs pre
node tools/build-feature-matrix.mjs post research/study-156-2026-10-27
node tools/sign-rule-packs.mjs
node tools/build-mocks.mjs
node tools/build-variants.mjs
node tools/build-forms.mjs
node tools/build-contamination-register.mjs
node tools/build-benefit-allocation.mjs
node tools/build-request-plan.mjs
node post-freeze/build-authorization-draft.mjs
```

To check that a builder reproduces its output, run it in a copy with that output removed, then compare hashes with the original.
- Fixed seeds: forms 20261027; benefit allocation 1561027; bootstrap 156.
- Timestamps inside the files differ.

## 5. Development runs (history)

`node tools/run-study.mjs dev-N <scratch>` and `node tools/run-variants.mjs vdev-N <scratch>` run the development partition only, with no freeze requirement. Earlier development outputs are listed with their hashes in `PRE_FREEZE_EVIDENCE_SHA256.txt`.
