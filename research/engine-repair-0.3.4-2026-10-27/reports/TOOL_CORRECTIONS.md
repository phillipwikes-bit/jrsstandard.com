# Tool Corrections and Their Impact

**2026-10-28.** The register is `registers/TOOL_CORRECTIONS.json` (sealed in the freeze). Rule followed: a defective tool is never edited where it was frozen. The original stays unchanged, the corrected copy is a new version in this package, a regression check shows the copy gives the original's results wherever the original was right, and any rerun with a corrected tool is labelled a **corrected analysis**, not a reproduction.

| ID | Defect | Original (kept, unchanged) | Corrected version | Regression check | Impact |
|---|---|---|---|---|---|
| TC-01 | HF-05: the V5 evidence-removal transform kept text that still states evidence, so some V5 variants carried a wrong UNGROUNDED label | `research/study-156-2026-10-27/tools/variant-spec.mjs` | `tools/variant-spec-v2.mjs` (V5 only) | `out/variant-spec-v2-check/RESULTS.json` | See section 1 |
| TC-02 | HF-01: recovery tests 1.0 read error text from the end of stderr (stack frames) and left `history/` out of their copies | `research/study-156-2026-10-27/tools/recovery-tests.mjs` (and the study's own v1.1 correction) | `tools/recovery-tests-v2.mjs` | `out/recovery-v2/RESULTS.json` | Fail-closed tests only; no scored result |
| TC-03 | Regression probes 1.0 replay stored mocks labelled with the 0.3.3 prompt version, which 0.3.4 correctly rejects | `research/study-156-2026-10-27/tools/regression-probes.mjs` | `tools/regression-probes-v2.mjs` (Part 1 relabels the prompt version only) | `out/regression-probes-v2-0.3.3-research-candidate/RESULTS.json` (Part 1 on 0.3.3) | The 1.0 result on 0.3.4 is kept as run (`out/study-suites-0.3.4-research-candidate/`) |
| TC-04 | Compile-row 1.0 passes the study's research profile, so 0.3.4 graphs would record the study's authorization reference | `research/study-156-2026-10-27/tools/compile-row.mjs` | `tools/compile-row-v2.mjs` (profile is a parameter) | `out/compile-row-v2-check/RESULTS.json` | Graph digests only; no scored field |

Results of each check are filled in from the post-freeze runs in `reports/OFFLINE_EVALUATION_REPORT.md` section 6.

## 1. TC-01 in detail

Generator 2.0 audits every V5 text: a kept decision clause that still states evidence (an evidential verb, a basis cue, a count of a total, a measure, a time, "on file", an evidence document) is cut back to the clause holding the decision verb, and checked again. Evidence before the decision verb, or evidence left after the cut, makes the variant **not constructible**, with the reason recorded. A not-constructible variant is excluded from the denominator and counted separately; it is never a pass.

Against 1.0: the 728 non-V5 variants are byte-identical; of the 92 V5 variants 1.0 built, 4 have changed text and 3 are no longer constructible (7 changes; 89 constructible in 2.0).

Two analyses use it, both labelled:

- **Corrected analysis of 0.3.3** (`tools/corrected-v5-0.3.3.mjs`): the frozen 0.3.3 copy, the study's own scoring and profile, the study's stored base mocks, and V5 mocks built exactly as the study built them (byte-identical for the 85 unchanged texts). Only the transform differs. The study's own V5 result stands as recorded in `research/study-156-2026-10-27/out/vrun-1`.
- **0.3.4 variant runs** use the 2.0 V5 texts from the start.

## 2. New tool versions that are not corrections

These are recorded so that no change to a tool is silent: harness 2.0 (adds the 0.3.4 copy), differential 2.0 (the candidate is an argument; its normalization moved unchanged into `tools/compile-row-v2.mjs`), mutation tests 2.0 (the study's mutants ported, plus repair mutants), mocks 2.0 (heuristic mocks regenerated with identical observations; rule-aligned mocks rebuilt on 0.3.4 units), variant set 2.0, the scored runners and analysis 2.0, the seal tools (adds pins), and the four repair suites in `tests/`.
