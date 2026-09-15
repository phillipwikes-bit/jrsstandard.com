# Codebook-to-API Correspondence Review

**Date:** 2026-09-14 · **Revised:** 2026-09-15 · **Status: DECIDED IN PART by Phillip Wikes**

## Owner decisions recorded (2026-09-15)

**D-3 — THE JRS CODEBOOK IS THE METHODOLOGICAL AUTHORITY.** The Review Engine is an *implementation representation* of the methodology. That relationship is not to be reversed. **The JRS methodology will not be modified to conform to the current API**, and correspondence will not be invented to achieve schema consistency.

**D-2 — `cold_reviewer_clarity` is INSUFFICIENTLY ESTABLISHED.** It is **not** an additional JRS condition, **not** an aggregate condition, **not** a sixth condition, and **not** equivalent to another JRS condition. It is treated as an **implementation-level construct whose formal correspondence to the Codebook is unresolved**. The five JRS conditions are **not** modified to accommodate it.

**This does not replace `METHODOLOGY_TO_API_MAPPING.md`, which is authoritative.** That document already establishes the mapping question and already asked the owner to resolve it. This review re-checks it against the current implementation and classifies each pair.

## Re-verification against current code

`api/v1/review-engine.js` `CONDITION_KEYS` and the schema in both OpenAPI documents still use the five engine keys. The five Codebook conditions are unchanged in `codebook.html` and in `api/review.js` lines 6-10. **The mapping question is unchanged by anything in Phase 1 or this remediation.**

## Classification

| Codebook condition | Engine key | Classification | Basis |
|---|---|---|---|
| Basis Identification | `basis_identification` | **EXACT** | Name and sense both correspond |
| Reconstructability | `reasoning_traceability` | **SEMANTIC** | Plausible rendering; correspondence not declared anywhere |
| Chronology | `temporal_reconstructability` | **SEMANTIC** | "Temporal" corresponds in sense; not the Codebook name |
| Decision-Process Traceability | `accountability_support` | **UNRESOLVED** | Two engine keys contain a traceability sense and two Codebook conditions do; the assignment is not evidenced |
| Evidentiary Sufficiency | `cold_reviewer_clarity` | **CORRESPONDENCE NOT YET FORMALLY ESTABLISHED** | Owner decision D-2, 2026-09-15: insufficiently established; implementation-level construct |

**IMPLEMENTED** is not used for any pair: no pair is verified against engine behaviour, because that requires an authorised call with a partner token (conformance tests CT-1 to CT-6 in the authoritative document, all NOT RUN).

## `cold_reviewer_clarity` — evidence, and the decision taken

**DECIDED 2026-09-15: INSUFFICIENTLY ESTABLISHED.** The evidence that led there is preserved below, because the decision was that the evidence does not resolve it, not that the evidence is unimportant.

**For "it is the aggregate condition":** `codebook.html` defines Evidentiary Sufficiency as *"**The aggregate condition**: whether the record stands on its own…"*. `api/review.js` condition 5 begins *"Could a reviewer with **no prior knowledge** evaluate…"*, and the engine key literally names a cold reviewer. The wording is close.

**For "it is a distinct dimension":** the engine treats all five keys as peers. `deriveDetermination()` at lines 108-113 applies one flat rule across all five — any `gap` yields `gap_identified`, any `review` yields `review_required`. **An aggregate condition that is computed as a peer of its own constituents is a design contradiction**, so either the key is not the aggregate, or the engine does not implement the Codebook's aggregate structure.

**NOT ESTABLISHED.** Choosing would invent substantive JRS content.

**RESOLVED (D-2).** `cold_reviewer_clarity`: insufficiently established. Recorded as **correspondence not yet formally established**.

> **STILL OPEN.** The correspondence for the three non-exact pairs, in particular which engine key corresponds to Decision-Process Traceability. D-3 sets the *rule* for recording them (exact retained, semantic qualified, unresolved stated plainly) but does not supply the assignments themselves.

**Consequence, unchanged:** a benchmark result expressed in engine keys cannot be restated in Codebook language without an undocumented assumption. Under D-3 that gap is recorded, not closed by inference.
