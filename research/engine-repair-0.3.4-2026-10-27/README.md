# JRS Review Engine 0.3.4 Repair and Offline Evaluation Package

**2026-10-28. Research candidate only. Not adopted.** The engine of record is `0.3.1-candidate`. `0.3.2-candidate`, `0.3.3-research-candidate` and `0.3.4-research-candidate` are not adopted. B-018 stays OPEN and release status stays `NO_GO_NOT_VERIFIED`. No model was called, no credential was read and no network was reached in any step of this package.

This package repairs, as a separate candidate (`0.3.4-research-candidate`), the failures documented by the October 27 offline study (`research/study-156-2026-10-27/`, unchanged), and verifies the repairs offline with scripted candidates. Every study record, variant and test construction is **exposed development material** for 0.3.4: nothing here is a holdout, and no rate here is accuracy, evaluation or validation evidence.

## Start here

| Question | File |
|---|---|
| What was found, in plain English, and what is the smallest next decision? | `reports/OFFLINE_EVALUATION_REPORT.md` (section 1: ten answers) |
| What does the owner need to decide? | `reports/OWNER_DECISION_SHEET_V2.md` |
| Which failure was repaired how, and what tests it? | `reports/FAILURE_TO_REPAIR_MATRIX.md` |
| What changed in the source? | `reports/SOURCE_CHANGES.md`, `reports/SOURCE_DIFF_0.3.3_TO_0.3.4.patch` |
| Which tools were corrected? | `reports/TOOL_CORRECTIONS.md`, `registers/TOOL_CORRECTIONS.json` |
| How do I rerun everything? | `reports/REPRODUCTION.md` |
| What was the baseline? | `BASELINE_VERIFICATION.md`, `PARENT.json` |

## Layout

| Path | Contents | Sealed in `seals/freeze` |
|---|---|---|
| `candidate/` | The 0.3.4 research candidate (46 files), rule packs, prompts | yes, and `CANDIDATE_0.3.4_MANIFEST_SHA256.txt` |
| `tools/` | Harness 2.0, runners, analysis, builders, mutation, recovery, transport (offline, dispatch disabled), seal tools | yes |
| `tests/` | Repair suites: paired irrelevant-evidence tests, indirect instructions, wording, controls | yes |
| `mocks-v2/`, `variants-v2/`, `mocks-variants-v2/` | Scripted candidates (not model output) and variant set 2.0 | yes |
| `protocol/` | Criteria S156-AC-2.0 (owner approval NOT GIVEN), criteria review, fresh-record authoring specification, protected evaluation procedure, live preflight proposal | yes |
| `registers/` | Exposure, label status, tool corrections | yes |
| `forms/` | Blinded human reference form 2.0 (nothing filled in) | yes |
| `authorization/` | Unsigned live-preflight authorization draft (refused as written) | yes |
| `history/` | Mutation runs 1 and 2, pre-freeze development results | yes |
| `out/` | Post-freeze results (written once) | no |
| `reports/` | Reports and generated analysis | no |

## Status words used in the reports

**Completed**, **Failed**, **Partially completed**, **Blocked**, **Not tested**. A result on exposed material is reported as development evidence. "Met" for a mechanical criterion means met on development material.
