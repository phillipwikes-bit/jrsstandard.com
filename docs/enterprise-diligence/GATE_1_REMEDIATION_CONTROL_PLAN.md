# Gate 1 Remediation Control Plan

**Date:** 2026-09-14 · **Authoritative blocker registry: `.jrs/state/BLOCKERS.json`**
(`docs/enterprise-diligence/BLOCKERS.json` does not exist and was deliberately **not** created; no second registry.)

Statuses: `OPEN` · `INVESTIGATING` · `REMEDIATED` · `RESOLVED` · `PREPARED_FOR_HUMAN_REVIEW` · `HUMAN_DECISION_REQUIRED` · `BLOCKED` · `ACCEPTED_RISK`

| ID | Subject | Status | Basis |
|---|---|---|---|
| **B-001** | Exposed Vercel token | **HUMAN_DECISION_REQUIRED** | Rotation is external. Old token not tested, not reproduced, not recovered. Secret scan of the tracked tree: **no literal secret**; all 8 credentials read via `process.env`; none in HTML |
| **B-002** | Two OpenAPI documents disagree | **PREPARED_FOR_HUMAN_REVIEW** | Identity preserved separately from B-007. Evidence in `API_OPENAPI_RECONCILIATION_REPORT.md` |
| **B-003** | Subprocessor list unpublished | **HUMAN_DECISION_REQUIRED** | Superseded in scope by B-009. Count corrected from four |
| **B-004** | No Level A evidence anywhere | **BLOCKED** | `RIGHTS_EVIDENCE_GAP_MEMO.md`. Legal review. Rule 8 |
| **B-005** | Model pinned at six sites | **REMEDIATED** | `api/_model.js`; six literals → zero outside that module; default byte-identical to the prior literal; override verified; all five imports resolve |
| **B-006** | 13 Sep silent-skip root cause | **BLOCKED** | Requires a rotated credential. Evidence needed to close is specified below |
| **B-007** | Contract does not describe the endpoint | **PREPARED_FOR_HUMAN_REVIEW** | Four options costed. **Nothing implemented** |
| **B-008** | `api/review.js` carries no declaration | **HUMAN_DECISION_REQUIRED** | Verified: zero occurrences in any case; prompt instructs against disclaimers. Serves `index.html`, `training.html`, `review-engine.html` |
| **B-009** | Google absent from disclosure | **PREPARED_FOR_HUMAN_REVIEW** | Expanded: **7 active processors**, not four. `SUBPROCESSOR_DISCLOSURE_REVIEW.md` |
| **B-010** | Buyer-facing surfaces | **HUMAN_DECISION_REQUIRED** | Registered. CLAUDE.md 36.3 **not** modified pending classification |
| **B-011** | Snapshot blanking | **RESOLVED** | Per-key merge, proven against empty live data; data restored byte-identical |
| **B-012** | Duplicate Master Tracker | **REMEDIATED** | Additive historical notice, **+28 / −0**. Nothing deleted, merged or reinterpreted |
| **Codebook-to-API** | Correspondence | **HUMAN_DECISION_REQUIRED** | `CODEBOOK_API_CORRESPONDENCE_REVIEW.md`. Evidence presented both ways; no decision taken |

## Evidence required to close B-006

A rotated `VERCEL_TOKEN` exported in the owner's own shell, then `bash scripts/vercel_f4_diagnose.sh`. The script reads the credential from the environment, contains no secret and prints none. What it would establish: whether a deployment record for `c08b48a` was ever created, and the project's `commandForIgnoringBuildStep`, `paused` and `live` values.

**Until then the root cause is NOT ESTABLISHED and will not be guessed.** The failure mode is prevented (`ignoreCommand: exit 1`) and detected (`deploy-verify.yml`) regardless of cause.

## Nothing marked PASS on the strength of a proposal

Two items are `REMEDIATED` because a change was made and tested. No item is `RESOLVED` on the strength of a recommendation.
