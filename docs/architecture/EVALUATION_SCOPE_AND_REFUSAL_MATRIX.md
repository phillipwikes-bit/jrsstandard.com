# Evaluation scope and refusal matrix (internal)

**Package `JRS-EVAL-READINESS-20261007-PR39`. Status `PLANNING_ONLY`.** The scope is completed, non-HR internal compliance records, initially `supplier_access_exception` only. Everything else is refused.

## Current implementation, target and absent evidence
- **Current implementation:** `lib/intake.js` (INT-04, INT-05) and `lib/registry.js` (REG-04) enforce the scope below, and each refusal is exercised by a probe in `lib/probes.js`.
- **Target:** any widening of scope is a future owner decision with counsel review. Nothing here anticipates one.
- **Absent:** no owner or counsel decision on scope beyond supplier-access exceptions exists.

## Scope
| Record | Treatment | Control |
|---|---|---|
| Completed supplier-access exception, declared non-HR | In scope. Still not admitted: intake is closed. | INT-00 |
| `employment`, `hr`, or any record declared `hr_related` other than false | Refused | INT-04, REG-04 |
| `housing`, `tenancy` | Refused | INT-04 |
| `lending`, `credit` | Refused | INT-04 |
| `insurance` | Refused | INT-04, REG-04 |
| `medical`, `healthcare` | Refused | INT-04 |
| `legal_outcome`, `criminal_justice` | Refused | INT-04 |
| `education`, `benefits`, `immigration` | Refused | INT-04 |
| Any other category | Refused as not in scope | INT-04 |
| A record not completed, or partial (fewer pages present than total) | Refused | INT-05 |

## Other refusals
| Attempt | Control |
|---|---|
| Record content in a declaration, binding, workspace item or package artifact | INT-02, REG-02, WS-02, SCAN-04 |
| Missing completion, authority, rights or custody attestation | INT-05, INT-06 |
| Missing version binding or codebook revision | INT-07 |
| Missing independent-reviewer role declaration | INT-08 |
| Digest equal to registered development or frozen-demonstration material | INT-09 |
| A synthetic item labelled independent evaluation evidence | INT-10, REG-06, WS-03 |
| Model review, provider call or external transmission | INT-11, REG-05 |
| A DRR score, agreement statistic or classification | INT-11, WS-10, WS-11 |
