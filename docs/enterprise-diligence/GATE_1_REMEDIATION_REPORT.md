# Gate 1 Remediation Report

> **HISTORICAL EXECUTION RECORD — STAMPED 2026-09-18.**
> Evidence of work performed on its date. **Not current-state authority.**
> `.jrs/state/BLOCKERS.json` is the authoritative registry (CLAUDE.md §15) and controls
> where the two disagree. Retained in full; nothing here states what is true now.

**Date:** 2026-09-14 · **Cycle 2:** 2026-09-15 · **Authority:** Phillip Wikes, technical Gate 1 remediation
**Gate 1 status: FAILED, unchanged. `/jrs-gate 1` was NOT run. Phase 2 remains LOCKED.**

## Executive status

Four technical items were remediated and tested. Eight items remain reserved to human authority and **none was resolved by inference**. Two blockers were found to be materially larger than recorded, and both are recorded larger rather than quietly re-scoped.

**No production deployment occurred. No public privacy or legal representation changed. No historical evidence was deleted, merged or rewritten.**

## Blocker status

| ID | Status | What happened |
|---|---|---|
| B-001 | HUMAN_DECISION_REQUIRED | Old token not tested, reproduced or recovered. Secret scan clean: no literal secret in the tracked tree, 8 credentials all read via `process.env`, none in HTML |
| B-002 | PREPARED_FOR_HUMAN_REVIEW | Identity preserved distinct from B-007 |
| B-003 | HUMAN_DECISION_REQUIRED | Superseded in scope by B-009; count corrected |
| B-004 | BLOCKED | `RIGHTS_EVIDENCE_GAP_MEMO.md`. Legal review |
| **B-005** | **REMEDIATED** | `api/_model.js`. Six literals across five files → zero outside that module |
| B-006 | BLOCKED | Needs a rotated credential; evidence required to close is specified |
| B-007 | PREPARED_FOR_HUMAN_REVIEW | Four options costed; **nothing implemented** |
| B-008 | HUMAN_DECISION_REQUIRED | Verified absent in any case |
| B-009 | PREPARED_FOR_HUMAN_REVIEW | **Expanded from 4 to 7 active processors** |
| B-010 | HUMAN_DECISION_REQUIRED | CLAUDE.md 36.3 deliberately unmodified |
| B-011 | RESOLVED | Fixed at cause, proven |
| **B-012** | **REMEDIATED** | Additive notice, **+28 / −0** |

## The two findings that grew

**B-007 is sharper than recorded.** It is not "spec versus code". There are **two specs for the same path**, and `openapi-review-engine.json` (0.1.0-validation) **matches** the implementation while `openapi.json` (1.0.0, **Commercial licence**) does not. The licensed document is the one that is wrong.

**B-009 is larger than recorded.** Not four processors but **seven active**. `api/run-study.js` runs nightly at `0 6 * * *` and calls **OpenAI** and **Google Generative Language**; the recovered 2026-08-21 run record names `openai:gpt-5` and `google:gemini-flash-latest`, so this is evidenced, not inferred. Resend and SendGrid are recorded **DORMANT**, because `api/_notify.js` returns before reading any key.

## Codebook-to-API correspondence

One pair EXACT, two SEMANTIC, one UNRESOLVED, and `cold_reviewer_clarity` left undecided with the evidence presented both ways. `METHODOLOGY_TO_API_MAPPING.md` remains authoritative and was not replaced.

## Research integrity

**Unchanged and re-verified:** 755 tracked, 0 missing, 0 zero-byte, all JSON parses, snapshot `realcase=2 / runs=1`, cross-vendor **2026-08-21 present**. No research file was regenerated, rewritten or overwritten.

## Security · Claim integrity · API contract · Rights

**Security:** no literal secret anywhere in the tracked tree; `JRS_MODEL_ID` is server-side only and cannot be set by a caller. **Claims:** the flagged terms are used in bounding or negating form and **were not rewritten**. **API:** both documents valid; divergence documented, not resolved. **Rights:** unchanged, bounded, LEGAL REVIEW REQUIRED.

## Tests performed

All JSON and both OpenAPI documents parse · `api/_model.js` returns the prior literal byte-identically with no override, and honours an override · all five import paths resolve · all six touched JS files parse · secret scan across changed and untracked files · guard suite **128 checks, 0 failed, 1 skipped** · research integrity re-verified · `git diff` reviewed.

**An exit code of zero is not proof that a substantive issue is resolved**, and none of the above is empirical validation of the Review Engine.

## Files changed

`api/_model.js` (new) · `api/review.js` · `api/review-engine.js` · `api/v1/review-engine.js` · `api/sandbox.js` · `api/bench-admin.js` · `MASTER_TRACKER.md` (additive notice) · `.jrs/state/BLOCKERS.json` · `.jrs/registries/{DEPENDENCY,ASSET}_REGISTER.json` · `research/MASTER_TRACKER.md` (append) · six new documents under `docs/enterprise-diligence/`

## Files deliberately NOT changed

`openapi.json` · `openapi-review-engine.json` · `privacy.html` · `security.html` · `terms.html` · `CLAUDE.md` Section 36.3 · every public HTML page · every research artifact · `docs/enterprise-diligence/METHODOLOGY_TO_API_MAPPING.md`

## Remaining uncertainty

Root cause of the 13 September silent skip (**NOT ESTABLISHED**, needs a credential) · whether live outbound payloads to OpenAI and Gemini match the source-reviewed synthetic corpus (source review only) · whether the two condition vocabularies denote the same five constructs · the rights position.

## Gate recommendation

**Gate 1 remains FAILED and is not re-run in this cycle.** Four items were remediated; the blocking items are human and legal decisions that no technical work can close. `/jrs-gate 1` should be run only after D-1, D-4, D-6 and D-7 are answered.


---

# Cycle 2 — 2026-09-15, owner decision authorization

## The finding that matters most

**`openapi.json` is PUBLISHED.** The gating question was whether it had ever been supplied externally. It is served at `/openapi.json` and `/openapi` (**HTTP 200, the real specification**) and linked from `security.html`, `review-engine.html` and **both confidential buyer surfaces**. `research/IP_SALE_TRACKER.md` independently calls it *"the OpenAPI spec the owner already publishes"*.

Per the owner's own instruction: **COUNSEL REVIEW REQUIRED BEFORE CONTRACT MODIFICATION.**

Whether a *named party* relied on it is **NOT ESTABLISHED** and was not guessed. This strengthens the prior recommendation rather than changing it: Option D leaves the published licensed document untouched; Option B now edits one.

**Nothing was implemented.** No document modified, no compatibility field emitted, no routing vocabulary chosen, and **`routing` is expressly not asserted equal to `determination`**.

## B-008 narrowed by investigation

The gap is **not** "the engine carries no declaration". `review-engine.html` already states *"unvalidated, single-model engine in operational validation"*, and `index.html` carries three such mentions. **`training.html` carries none**, while POSTing to `/api/review` and rendering the result to a learner.

That one page is the target. Wording is prepared in the control plan and **not inserted**, because it changes an external representation.

## Decisions recorded

**D-2** `cold_reviewer_clarity` insufficiently established; implementation-level construct; five conditions unchanged. **D-3** Codebook is the methodological authority; assignments for three pairs still open. **D-7** both buyer surfaces **CONFIDENTIAL BUYER**, recorded in CLAUDE.md 36.3, which now separates owner from buyer surfaces. **D-4** disclosure approved in principle including Google Fonts; **self-hosting not authorized and not performed**.

## B-005 deployment

**NOT DEPLOYED.** D-9 condition 1 is completed B-001 rotation, which has not occurred. The change is code-complete, tested, and remains on the development branch. No deployment was attempted, so no preflight was run and no rollback condition arose.

## Cycle 2 status

| | |
|---|---|
| Resolved this cycle | B-010, B-012 |
| Prepared for review | B-002, B-003, B-007, B-008, B-009 |
| Blocked | B-004 (counsel), B-006 (credential) |
| ~~Open, human action~~ **OWNER-CONFIRMED 2026-09-18 (E-030)** | B-001 |
| Remediated, undeployed | B-005 |

**Gate 1 remains FAILED. `/jrs-gate 1` was not run. Phase 2 remains LOCKED.**
