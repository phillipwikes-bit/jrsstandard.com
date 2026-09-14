# CONTRADICTION 001 — Two parallel five-condition vocabularies

**Opened:** 2026-09-14 (Phase 1, Step 6F/6G) · **Status:** OPEN · **Severity:** MEDIUM
**Rule:** CLAUDE.md Section 5. Two sources at the same level conflict, so this is recorded rather than resolved by guessing.

## The two vocabularies

**A. Methodology-facing.** Published on **13 public pages**, defined verbatim in `api/review.js` and matching `codebook.html`:

`Reconstructability` · `Basis Identification` · `Chronology` · `Decision-Process Traceability` · `Evidentiary Sufficiency`

Condition states `Pass / Needs Attention / Fail`. Routing `Low / Moderate / High / Critical`.

**B. Engine-facing.** Used by `api/review-engine.js` and `api/v1/review-engine.js`, and surfaced on **6 benchmark and research pages** (`bench-admin`, `bench-results`, `bench-review`, `engine-activity`, `research-data`, and one owner surface):

`basis_identification` · `reasoning_traceability` · `cold_reviewer_clarity` · `accountability_support` · `temporal_reconstructability`

Condition states `pass / review / gap`. No routing vocabulary of its own.

## What is established

**FACT.** Both vocabularies exist, are in live code, and appear on public pages.
**FACT.** `openapi.json` carries `pass|review|gap` plus `Ready`; `openapi-review-engine.json` carries only `pass|review|gap`. The two specification documents therefore do not agree with each other either.
**FACT.** Only one of the five names is common to both sets: `Basis Identification` / `basis_identification`.

## What is NOT established

**The mapping between the two sets is NOT ESTABLISHED.** It is not documented anywhere in the repository, and it cannot be derived with confidence:

- `reasoning_traceability` could correspond to `Reconstructability` or to `Decision-Process Traceability`.
- `temporal_reconstructability` could correspond to `Chronology` or to `Reconstructability`.
- `cold_reviewer_clarity` most closely resembles `Evidentiary Sufficiency`, whose published definition begins "Could a reviewer with no prior knowledge…", but that is a resemblance, not a documented equivalence.
- **`accountability_support` has no evident counterpart among the published five at all.**

## Why this was not resolved here

Choosing a mapping would invent substantive JRS content, which Section 6F prohibits, and would convert INFERENCE into FACT, which Rule 2 prohibits. The resemblance above is offered as INFERENCE and is explicitly not recorded as the answer.

## Impact

- `standard/jrs-conditions.json` records `engine_key_mapping: NOT ESTABLISHED` for all five conditions.
- A benchmark result expressed in vocabulary B cannot presently be stated in vocabulary A without an undocumented assumption. This matters because the detection-study figures are published in methodology-facing language while the bench tooling stores engine-facing keys.
- Blocker **B-002** (conflicting OpenAPI documents) is a symptom of the same divergence and should be resolved together with it.

## Required action

**HUMAN.** Phillip confirms which five conditions are canonical and supplies the mapping, or states that the two sets are deliberately distinct constructs serving different purposes. Either answer closes this record; neither can be supplied from inside the repository.
