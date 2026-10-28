# 156-Record Study of the JRS Review Engine

**2026-10-27. Offline research package; untracked and uncommitted (owner Decision 1).**
- No model was called. No credential was read. No network attempt was made.
- B-018 OPEN. NO_GO_NOT_VERIFIED in effect.
- The engine of record (0.3.1-candidate) is unchanged.
- The research candidate 0.3.3 is not adopted.

## Start here

| Read | For |
|---|---|
| `reports/FINAL_REPORT.md` | Results, recommendations and the six plain-English answers |
| `reports/OWNER_DECISION_SHEET.md` | The ten decisions that are Phillip's to make |
| `reports/FAILURE_REGISTER.md` | Every failure, preserved, with its evidence |
| `reports/INDEPENDENT_EVALUATION_HANDOFF.md` | How someone else should check and attack this work |
| `reports/REPRODUCTION.md` | Exact commands |

## Package map

| Path | Contents |
|---|---|
| `records/` | 24 original texts and 100 disclosed synthetic records (sealed in `seals/corpus`) |
| `inventory/`, `registers/` | Inventory v1 (sealed) and v2; label, contamination and feature-coverage registers |
| `candidate/` | 0.3.3-research-candidate (manifest `CANDIDATE_0.3.3_MANIFEST_SHA256.txt`) |
| `protocol/` | Codebook, proposed acceptance criteria (owner approval NOT GIVEN), request and cost plan, provider compatibility record, reviewer-benefit protocol |
| `forms/`, `sealed/` | Blinded reference forms and benefit session sheet; the blind key, allocation and AI-proposed references, kept apart |
| `mocks/`, `mocks-variants/`, `variants/` | Scripted mock candidates (not model output) and the eight predefined variants |
| `tools/` | Runners, scoring, analysis, builders, probes, regression, mutation, recovery and offline transport |
| `out/` | Results: `run-1` to `run-3`, `vrun-1`, `vrun-2`, probe and test results; development outputs and history |
| `reports/` | Analysis, assessments, registers of failures and capabilities, handoff, decision sheet, reproduction, baseline evidence |
| `authorization/` | Unsigned live-run authorization draft (authorizes nothing) |
| `post-freeze/` | Tools written after the freeze: the corrected recovery test (1.1) and the authorization-draft builder |
| `seals/` | `corpus` (131 files) and `freeze` (2,215 files) |
| `DEVELOPMENT_LOG.md`, `history/` | Every defect found during development and every superseded output |
| `PACKAGE_MANIFEST_SHA256.txt` | Hash of every file in the package at completion |
