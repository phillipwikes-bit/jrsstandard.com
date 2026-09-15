# Gate 1 Remediation Control Plan

**Date:** 2026-09-14 · **Revised:** 2026-09-15 after owner decisions · **Authoritative blocker registry: `.jrs/state/BLOCKERS.json`**
(`docs/enterprise-diligence/BLOCKERS.json` does not exist and was deliberately **not** created; no second registry.)

Statuses: `OPEN` · `INVESTIGATING` · `REMEDIATED` · `RESOLVED` · `PREPARED_FOR_HUMAN_REVIEW` · `HUMAN_DECISION_REQUIRED` · `BLOCKED` · `ACCEPTED_RISK`

| ID | Subject | Status | Basis |
|---|---|---|---|
| **B-001** | Exposed Vercel token | **OPEN / HUMAN ACTION REQUIRED** | Owner rotates externally. Old token not tested, recovered or reproduced; **no replacement requested**. Repository evidence cannot establish rotation |
| **B-002** | Two OpenAPI documents disagree | **PREPARED_FOR_HUMAN_REVIEW** | Identity preserved separately from B-007. Evidence in `API_OPENAPI_RECONCILIATION_REPORT.md` |
| **B-003** | Subprocessor list unpublished | **PREPARED_FOR_HUMAN_REVIEW** | Disclosure **approved in principle** (D-4). Publication not yet performed |
| **B-004** | No Level A evidence anywhere | **BLOCKED** | `RIGHTS_EVIDENCE_GAP_MEMO.md`. Legal review. Rule 8 |
| **B-005** | Model pinned at six sites | **REMEDIATED — DEPLOYMENT BLOCKED** | Code complete and tested. D-9 condition 1 (completed rotation) **not met**, so not deployed |
| **B-006** | 13 Sep silent-skip root cause | **BLOCKED** | Requires a rotated credential. Evidence needed to close is specified below |
| **B-007** | Contract does not describe the endpoint | **PREPARED — COUNSEL REVIEW REQUIRED** | Distribution **established**: the spec is published and buyer-linked. Nothing modified |
| **B-008** | Validation statement | **PREPARED_FOR_HUMAN_REVIEW** | Narrowed: `review-engine.html` and `index.html` already carry statements; **`training.html` carries none** while rendering engine output |
| **B-009** | Processor disclosure | **PREPARED_FOR_HUMAN_REVIEW** | Approved in principle incl. Google Fonts. **Self-hosting not authorized, not performed** |
| **B-010** | Buyer-facing surfaces | **RESOLVED** | Both classified **CONFIDENTIAL BUYER**; CLAUDE.md 36.3 now separates owner from buyer surfaces |
| **B-011** | Snapshot blanking | **RESOLVED** | Per-key merge, proven against empty live data; data restored byte-identical |
| **B-012** | Duplicate Master Tracker | **RESOLVED** | Notice applied and accepted; no further modification |
| **Codebook-to-API** | Correspondence | **DECIDED IN PART** | `CODEBOOK_API_CORRESPONDENCE_REVIEW.md`. Evidence presented both ways; no decision taken |

## Evidence required to close B-006

A rotated `VERCEL_TOKEN` exported in the owner's own shell, then `bash scripts/vercel_f4_diagnose.sh`. The script reads the credential from the environment, contains no secret and prints none. What it would establish: whether a deployment record for `c08b48a` was ever created, and the project's `commandForIgnoringBuildStep`, `paused` and `live` values.

**Until then the root cause is NOT ESTABLISHED and will not be guessed.** The failure mode is prevented (`ignoreCommand: exit 1`) and detected (`deploy-verify.yml`) regardless of cause.

## Nothing marked PASS on the strength of a proposal

Two items are `REMEDIATED` because a change was made and tested. No item is `RESOLVED` on the strength of a recommendation.


## Prepared, not inserted — B-008 wording (D-5)

For `training.html`, which renders engine output to a learner and currently carries no statement. Proposed, bounded, using only language already published elsewhere on the site:

> **This assessment is produced by an unvalidated, single-model engine in operational validation.** It is an operational implementation of the JRS review conditions, not an empirically validated measurement. Reproducibility is disclosed rather than hidden, and reproducibility is not accuracy.

Claims deliberately **absent**: validated, proven, certified, accredited, independently validated, accuracy guaranteed.

**Not inserted.** It changes an external representation; insertion and deployment need authorization beyond D-9, which covers only B-005.
