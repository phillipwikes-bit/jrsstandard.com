# Codebook-to-API Correspondence Review

**Date:** 2026-09-14 · **Status: HUMAN DECISION REQUIRED**

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
| Evidentiary Sufficiency | `cold_reviewer_clarity` | **UNRESOLVED** | See below |

**IMPLEMENTED** is not used for any pair: no pair is verified against engine behaviour, because that requires an authorised call with a partner token (conformance tests CT-1 to CT-6 in the authoritative document, all NOT RUN).

## `cold_reviewer_clarity` — the evidence, not a decision

**I am not deciding this.** The evidence on each side:

**For "it is the aggregate condition":** `codebook.html` defines Evidentiary Sufficiency as *"**The aggregate condition**: whether the record stands on its own…"*. `api/review.js` condition 5 begins *"Could a reviewer with **no prior knowledge** evaluate…"*, and the engine key literally names a cold reviewer. The wording is close.

**For "it is a distinct dimension":** the engine treats all five keys as peers. `deriveDetermination()` at lines 108-113 applies one flat rule across all five — any `gap` yields `gap_identified`, any `review` yields `review_required`. **An aggregate condition that is computed as a peer of its own constituents is a design contradiction**, so either the key is not the aggregate, or the engine does not implement the Codebook's aggregate structure.

**NOT ESTABLISHED.** Choosing would invent substantive JRS content.

> **HUMAN DECISION REQUIRED 1.** Is `cold_reviewer_clarity` the aggregate condition (Evidentiary Sufficiency), a distinct fifth dimension, or insufficiently established to state?
>
> **HUMAN DECISION REQUIRED 2.** Declare the correspondence for the three non-exact pairs, in particular which engine key corresponds to Decision-Process Traceability.

Until answered, a benchmark result expressed in engine keys cannot be restated in Codebook language without an undocumented assumption.
