# Reproduction

**Every command is offline.** Each Node tool installs the network guard before anything else and refuses to start when a provider variable (for example `ANTHROPIC_BASE_URL` or `ANTHROPIC_API_KEY`) is present; no command reads a credential. Unset `ANTHROPIC_BASE_URL` in the shell first. Each tool refuses to overwrite an existing output, so rerun into a copy of the package or remove `out/` first (keep the originals).

Recorded environment: Node v22.22.0, linux x64, time zone UTC, locale en-US; run-3 uses `TZ=Pacific/Kiritimati` and `tr_TR.UTF-8`, as the study's run-3 did. Evaluation clock: 2026-10-27T12:00:00Z (the runners' default).

## 1. Before the freeze (already done; recorded for completeness)

```bash
unset ANTHROPIC_BASE_URL
S=<a scratch folder>
node tools/reproduce-0.3.3.mjs $S/repro            # documented 0.3.3 failures, study tools (also rerun after the freeze)
node tools/sign-rule-packs.mjs                       # RPK-SRP 2.0.0 and the seven default packs, re-signed
node tools/build-mocks-v2.mjs $S/mocks               # mocks-v2/ (refuses if it exists)
node tools/build-variants-v2.mjs $S/variants         # variants-v2/, mocks-variants-v2/ (refuses if they exist)
node tools/mutation-tests-v2.mjs $S/mut              # runs 1 and 2 are in history/
```

## 2. The freeze

```bash
node tools/freeze.mjs $S/freeze                      # writes CANDIDATE_0.3.4_MANIFEST_SHA256.txt and seals/freeze; refuses to run twice
node tools/verify-seal.mjs freeze                    # exit 0 only if every sealed file, root and pin matches
```

The freeze and every post-freeze run were rehearsed first, twice, on a scratch copy of the working tree (no `.git`). The first rehearsal stopped at its first run: `tools/post-freeze-runs.sh` did not create the per-tool scratch folders. The second ran to the end and showed two presentation defects in `tools/analyze-v2.mjs` (its summary did not count AC-37's "NOT MET", and compound thresholds printed "null"). All three were fixed before the real freeze, together with two descriptions in the candidate that still mentioned shared terms as an inferred link (a comment in `research-profile.mjs` and the RP-SRP-09 text in `RPK-SRP.json`, re-signed); no behaviour changed, which was checked before the freeze (77 of 77 regression probes, 41 of 41 wording probes). Rehearsal outputs were discarded and are not used anywhere.

## 3. After the freeze: every run, then the analysis

```bash
bash tools/post-freeze-runs.sh $S/runs
```

That script runs, in order: `run-scored.mjs` run-1, run-2 (replay) and run-3 (other time zone and locale); `run-variants-v2.mjs` vrun-1 and vrun-2; `corrected-v5-0.3.3.mjs`; on both 0.3.4 and 0.3.3, regression probes 2.0 and the four repair suites; the study's suites 1.0 unchanged on 0.3.4; the default-path differential for 0.3.4 and, as a check of the copy, 0.3.3; the transport tests; the two tool-correction checks; the reproduction of the 0.3.3 failures; mutation tests 2.0 (run 3); recovery tests 2.0; and `analyze-v2.mjs`, which writes `reports/ANALYSIS_V2.json` and `reports/ANALYSIS_TABLES_V2.md`.

## 4. Outputs

| Output | Produced by |
|---|---|
| `out/run-1`, `out/run-2`, `out/run-3` | `tools/run-scored.mjs` |
| `out/vrun-1`, `out/vrun-2` | `tools/run-variants-v2.mjs` |
| `out/corrected-v5-0.3.3` | `tools/corrected-v5-0.3.3.mjs` (corrected analysis) |
| `out/regression-probes-v2-<version>` | `tools/regression-probes-v2.mjs` |
| `out/paired-<version>`, `out/injection-<version>`, `out/wording-<version>`, `out/controls-<version>` | `tests/*.mjs` |
| `out/study-suites-0.3.4-research-candidate` | `tools/run-study-suites.mjs` |
| `out/differential-<version>` | `tools/run-differential-v2.mjs` |
| `out/transport` | `tools/transport/test-transport.mjs` |
| `out/variant-spec-v2-check`, `out/compile-row-v2-check` | tool-correction checks |
| `out/reproduction-0.3.3` | `tools/reproduce-0.3.3.mjs` |
| `out/mutations-v2` | `tools/mutation-tests-v2.mjs` |
| `out/recovery-v2` | `tools/recovery-tests-v2.mjs` |

## 5. What these runs do not do

They do not call a model, read a credential, retrieve the 32 public cases, run the 20 excluded-domain originals beyond the refusal check, use any fresh evaluation record (none exists), or run any reviewer session. Live dispatch is disabled in the transport (`LIVE_DISPATCH_ENABLED = false`).
