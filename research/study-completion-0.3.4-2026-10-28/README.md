# Records study completion: 0.3.4 research candidate

**2026-10-28. Status: offline preparation complete; the live model run is NOT AUTHORIZED and has not started.** The frozen `0.3.4-research-candidate` is used for the remaining study work and is not adopted; `0.3.1-candidate` remains the engine of record. Release status `NO_GO_NOT_VERIFIED`; B-018 OPEN. No request was sent, no credential was read and no network access was attempted in this work.

This directory continues the existing records study (`research/study-156-2026-10-27/`) with the frozen 0.3.4 package (`research/engine-repair-0.3.4-2026-10-27/`). Both are read only here; their seals verify and nothing in them was changed.

## Start here

| For | Read |
|---|---|
| What the owner needs to decide before the live run | `reports/EXECUTION_CHECKPOINT.md` |
| Where the study stands (the eight questions) | `reports/STUDY_STATUS_REPORT.md` |
| Continue, narrow or stop | `reports/DECISION_REPORT.md` |
| Human review (four batches of 11, fillable) | `human-review/batches/BATCH_01.html` to `BATCH_04.html` (also `.csv`, `.md`) |
| Every check and its count | `reports/VERIFICATION_SUMMARY.md` |
| Corrections to earlier records | `reports/CORRECTIONS_2026-10-28.md` |

## Contents

| Folder | What |
|---|---|
| `state/` | Starting state verified from the repository |
| `accounting/` | All 156 records, by machine |
| `reconciliation/` | Existing evidence reconciled from raw rows and executable tools; fail-closed check of the frozen outputs |
| `results/` | Per-record offline results (scripted proposals, not model output) and the two known weaknesses; `LIVE_RESULTS.json` will appear only after an authorized run |
| `records/` | The frozen live request set (401 requests) and the constructed texts of the targeted phase |
| `protocol/` | Live study protocol, generated run plan, verified provider facts, transport binding and DEC-T1, sender diff |
| `authorization/` | Unsigned authorization draft (refused as written) |
| `human-review/` | Review batches, their manifest; `HUMAN_LABELS.json` appears only when completed answers are imported |
| `tools/` | Every tool; `tools/live/` the live machinery; `tools/human-review/` the batches and importer |
| `out/` | Test outputs (mock captures are labelled MOCK and are not model output) |

## Reproduce

```
unset ANTHROPIC_BASE_URL
bash research/study-completion-0.3.4-2026-10-28/tools/run-all.sh <scratch folder>
```

Every step installs the network guard, refuses provider variables, and exits non-zero on any failed check. Captures of a live run would be written only to a private location outside the repository; none exist.

## Boundaries

- Nothing here is merged, deployed, tagged or pushed. `.vercelignore` excludes `research/`; the repository is public, so anything pushed is visible on GitHub.
- Every record is exposed development material; every reference is AI-proposed. Agreement figures are agreement, not accuracy.
- No human judgement was recorded or invented. The importer's tests use fixtures marked TEST in a scratch folder.
