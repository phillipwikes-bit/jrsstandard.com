# Frozen demonstration evidence record (internal)

**Package `JRS-FROZEN-DEMO-20261007-PR39` version 0.1.0. Status: `DEMO_PREPARATION_COMPLETE_NOT_RELEASED`.** Recorded 2026-10-07 by a Claude Code session on draft PR #39, prepared for the owner (Phillip Wikes). Nobody independent has reviewed it. The machine-readable form is `tools/frozen-demo/demo-evidence-record.json`, and `tools/frozen-demo/lib/verify.js` (section J) fails if either says more than is stated here.

## Statements
| Statement | Recorded value |
|---|---|
| All cases are synthetic | Yes. Five fictional records, FD-01 to FD-05, with invented organisations, people, dates and facts. |
| All output is mocked or local | Yes. Every candidate output comes from the deterministic mock adapter scripted with the response frozen in each record. No live model was run. |
| Repeatable | Only within its fixed local configuration: the bound module hashes, versions, prompt, adapter, corpus and fixed time stamp. |
| Independent evaluation | No. One author wrote the records, the scripted responses, the expectations and the disposition examples. |
| Sealed holdout | No. The texts are registered development material and are refused by any future holdout builder. |
| Release gates advanced | None. RG-1 to RG-5 remain open. |
| Owner release decision recorded | No. |
| Public or customer demonstration | None has occurred. |
| Real records processed | None. |
| Provider calls made | None. |

## What the replay shows
Exact replay of the fixed local package. The five frozen synthetic records, run through candidate 0.5.0-local.1 with the scripted mock adapter, reproduce the frozen results byte for byte: input findings, candidate findings, refusals, packet digests and disposition-example exports.

| Case | Shows | Result status | Packet digest (first 16) |
|---|---|---|---|
| FD-01 | complete, reconstructable record | examined | `4a8fccaa4872bcb9` |
| FD-02 | missing identifiable basis | examined | `33d045cf9d294683` |
| FD-03 | chronology gap | examined | `e3bf3463e3024262` |
| FD-04 | missing logical bridge | examined | `8b629713cdbb21d5` |
| FD-05 | partial record refused before model review | refused | `8c883ff37cf8d2c2` |

## What it does not show
- No semantic correctness: an exact quotation shows where text sits in the record, not that a finding is right.
- No real-provider behavior: nothing here says what any real model would return.
- No real-record performance: five constructed records show software behaviour, not accuracy, reliability or validity.
- No independent labeling.
- No operational-control verification.
- No production or commercial readiness of any kind, and no licensing, sale or pilot pathway.
- No release gate is advanced. The independent holdout, operator-control, counsel, owner-authorization and independent production-QA gates remain open.

## Next step
None is required by this package. It is recorded as prepared and not released.
