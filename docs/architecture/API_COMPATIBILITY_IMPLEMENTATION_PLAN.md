# API Compatibility Implementation Plan — NOT AUTHORIZED FOR IMPLEMENTATION

**Design only.** `openapi.json` is not modified. `api/v1/review-engine.js` is not modified.
Nothing here is implemented. Full evidence: `API_CONTRACT_RECONCILIATION_2026-09-15.md`.

## Current published vs implemented

**Published** (`openapi.json` 1.0.0, Commercial licence): `routing` and `conditions`
**required at the top level**; `routing` enum `Ready` / `Needs work` / `Gap`.

**Implemented**: **zero** occurrences of `routing`; conditions at `result.conditions`;
`determination` enum `ready` / `review_required` / `gap_identified`; `disclaimer` not
`disclosure`.

Three breaking differences, all record-level. The condition-level payload agrees exactly.

## Options

| | Change | Files | Blocks on |
|---|---|---|---|
| **A** | Implementation matches the published contract | `api/v1/review-engine.js`, `api/review-engine.js`, `openapi-review-engine.json`, `engine-activity.html`, guards | Owner: routing mapping. Breaks internal consumers at once |
| **B** | Published contract matches the implementation | `openapi.json` only | **COUNSEL.** Editing a published licensed document |
| **C** | Version the contracts | new `openapi-v2.json`, route or header handling, buyer-surface links | Owner |
| **D** | Dual emission, then deprecation | `api/v1/review-engine.js` (additive), `openapi-review-engine.json` | Owner: routing mapping |

## Recommendation, and it is only that

**D then C.** D makes the published contract true **without editing it**, which removes the
commercial exposure without creating a counsel dependency; C then formalises the difference.

**ENGINEERING RECOMMENDATION. Not a Board decision, not an owner decision, not counsel
clearance. Not authorized for implementation.**

## The blocker inside D, stated because it is easy to miss

D requires emitting `Ready` / `Needs work` / `Gap`. **`Needs work` appears nowhere in the JRS
Codebook.** Emitting it would put a **fourth** record-level vocabulary into production and
would resolve by code a correspondence nobody has declared.

**§27 of the governing directive forbids exactly that.** D therefore cannot proceed until the
owner declares the mapping. Until then the correct state is: package prepared, nothing built.

## D-2 and D-3 remain untouched

`cold_reviewer_clarity` stays **INSUFFICIENTLY ESTABLISHED**. The three unresolved
Codebook-to-engine mappings stay unresolved. The manifest builder enforces this in code by
refusing to relabel engine keys.
