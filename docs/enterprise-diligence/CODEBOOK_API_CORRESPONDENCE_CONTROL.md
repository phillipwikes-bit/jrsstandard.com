# Codebook / API Correspondence Control

> **SUPERSEDED IN PART BY BOARD DECISION BD-04, 2026-09-16. STAMPED 2026-09-20.**
> **Nothing below was rewritten.** The rows marked Open / OWNER for
> **Reconstructability**, **Chronology** and **Decision-Process Traceability** were correct on
> this document's own date and are **no longer current**. BD-04 **DECLARED** all three:
> `reasoning_traceability`, `temporal_reconstructability` and **`accountability_support`**
> respectively. **Declared is not upgraded** — all three remain SEMANTIC / INFERRED, and the
> prohibition on describing the engine as a restatement of the Codebook stands.
>
> **One row is still genuinely unresolved and it is not D-3's.** Evidentiary Sufficiency /
> `cold_reviewer_clarity` is **D-2, INTENTIONALLY UNRESOLVED**, which BD-04 declined to decide
> because it is a question about what the engine computes, not about what a field is called.
>
> **AUTHORITATIVE:** `JRS_BOARD_DECISION_REGISTER_2026-09-16.md` (BD-04) and the BD-04 section
> of `METHODOLOGY_TO_API_MAPPING.md`. **D-3 is CLOSED. Do not route it to the owner again.**

**Date:** 2026-09-15 · ~~**Status: OWNER ACTION REQUIRED (unchanged)**~~ **Status as at 2026-09-20: D-3 CLOSED BY BD-04; the one remaining unresolved row is D-2, which is closed as INTENTIONALLY UNRESOLVED. No owner action outstanding here.**

**Controlling rule.** *Different taxonomies must not be presumed to be one-to-one
equivalents.* Where a Codebook condition and an engine key do not correspond exactly, that is
recorded as an open issue and **not resolved by assumption, by convenience, or by software
design pressure.**

**This document is subordinate to `METHODOLOGY_TO_API_MAPPING.md`**, which is the
authoritative mapping record. It adds the vocabulary inventory and the control rules. It does
not restate the mapping table, and it **resolves nothing**.

---

## 1. Four vocabularies exist, not two

**FACT.** Re-verified 2026-09-15 against the primary files.

| # | Vocabulary | Source | Values |
|---|---|---|---|
| 1 | **JRS Codebook conditions** | `codebook.html` (version `1.0`) | Basis Identification · Reconstructability · Decision-Process Traceability · Chronology · Evidentiary Sufficiency |
| 2 | **Review Engine condition keys** | `api/v1/review-engine.js`, both OpenAPI files | `basis_identification` · `reasoning_traceability` · `cold_reviewer_clarity` · `accountability_support` · `temporal_reconstructability` |
| 3 | **Published record-level routing** | `openapi.json` `ReviewResponse.routing` | `Ready` · `Needs work` · `Gap` |
| 4 | **Implemented record-level determination** | `api/v1/review-engine.js` `deriveDetermination()`; declared in `openapi.json` | `ready` · `review_required` · `gap_identified` |

Vocabularies 1 and 2 both contain five items and **exactly one name appears in both**.
Vocabularies 3 and 4 describe the same record-level idea in **different words, different
values and different case**, and **vocabulary 3 is absent from the implementation entirely**.

**Per-condition status is the one place everything agrees.** `pass` · `review` · `gap`,
identical in both specifications and in the implementation.

## 2. Classification, preserved from the authoritative record

| Codebook condition | Engine key | Relationship |
|---|---|---|
| Basis Identification | `basis_identification` | **EXACT** |
| Reconstructability | `reasoning_traceability` | **SEMANTIC / INFERRED** |
| Chronology | `temporal_reconstructability` | **SEMANTIC / INFERRED** |
| Decision-Process Traceability | `accountability_support` | **UNRESOLVED** |
| Evidentiary Sufficiency | `cold_reviewer_clarity` | **UNRESOLVED** |

**These classifications are carried forward unchanged.** Nothing in this cycle's evidence
upgrades any of them.

## 3. `cold_reviewer_clarity` — INSUFFICIENTLY ESTABLISHED

**Status unchanged, and deliberately so.**

The Codebook calls **Evidentiary Sufficiency** the *aggregate* condition: whether the record
stands on its own for an independent reviewer with no prior knowledge. The engine treats
`cold_reviewer_clarity` as **one of five peers**, weighted no differently from the others in
`deriveDetermination()`.

**If it is the aggregate, the engine is averaging a summary in with its own inputs.** If it is
a distinct fifth dimension, the Codebook's aggregate has no engine representation at all.
**The evidence does not establish which**, and the difference is methodological, not cosmetic.

**PROHIBITED without owner input:** promoting it to an official JRS condition; renaming it to
Evidentiary Sufficiency; making it an aggregate in code; dropping it; treating the engine's
five keys as a restatement of the Codebook's five conditions.

## 4. Two keys, two conditions, no evidence for the assignment

`reasoning_traceability` and `accountability_support` are both plausible renderings of
**Reconstructability** and **Decision-Process Traceability**, which both contain the word
traceability. **The assignment between them is not evidenced in either direction.** Swapping
them would produce a mapping equally consistent with the available evidence, which is the
definition of UNRESOLVED.

## 5. Control rules

1. The Review Engine condition vocabulary **must not** be represented, in public material,
   documentation, contracts or buyer material, as a one-to-one restatement of the JRS
   Codebook unless the correspondence is formally established by the owner.
2. A SEMANTIC relationship is **never** upgraded to EXACT to simplify software.
3. A new vocabulary must not be introduced by implementation choice. **Emitting `Needs work`
   to satisfy the published contract would introduce a fourth record-level vocabulary into
   production**, and that is an owner decision, not an engineering one.
4. Any change to condition semantics is a **methodology** change and is out of scope for
   engineering remediation.

## 6. Owner input required, unchanged

> Declare the intended Codebook-to-API correspondence for the four non-exact pairs, in
> particular whether `cold_reviewer_clarity` is the aggregate condition (Evidentiary
> Sufficiency) or a distinct dimension.

This request originates in `METHODOLOGY_TO_API_MAPPING.md` and is **repeated, not reopened**.
