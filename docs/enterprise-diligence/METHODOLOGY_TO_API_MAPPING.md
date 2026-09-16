# Methodology-to-API Mapping

**Controlling rule for this document: names are compared, never normalised.** Where a
Codebook condition and an API key do not correspond exactly, that is recorded as an
open issue rather than resolved by assumption.

**Sources.** Codebook: `codebook.html` (version string located: `1.0`). API contract:
`openapi.json` (OpenAPI 3.1.0, `info.version` 1.0.0). Implementation:
`api/v1/review-engine.js` (model `claude-haiku-4-5-20251001`).

## The two name sets, as they actually exist

| Codebook condition (canonical) | API key (`Conditions` schema) |
|---|---|
| Reconstructability | `basis_identification` |
| Basis Identification | `reasoning_traceability` |
| Chronology | `cold_reviewer_clarity` |
| Decision-Process Traceability | `accountability_support` |
| Evidentiary Sufficiency | `temporal_reconstructability` |

The two columns above are **not** aligned rows. They are two independent lists printed
side by side, because aligning them is precisely the thing that requires evidence.
Both lists contain five items, and **exactly one name appears in both**.

## Mapping table

| Methodology condition | Public definition (source: `codebook.html`) | API field | Semantic relationship | Verification method | Open issue |
|---|---|---|---|---|---|
| **Basis Identification** | Whether the source of each characterization is visible and traceable, rather than implied or summarized without attribution | `basis_identification` | **Exact** (name and sense both correspond) | Source review | None |
| **Reconstructability** | Whether the conclusion can be reconstructed from the record itself: a future reviewer can trace the path from documented evidence to the conclusion | `reasoning_traceability` | **Partial (inferred)** | Source review only | Name differs. "Reasoning traceability" is a plausible rendering of reconstructability, but the mapping is not declared anywhere in the repository |
| **Decision-Process Traceability** | Whether a future reviewer can determine how the conclusion was reached: who reviewed it, what criteria or threshold triggered it | `accountability_support` | **Unresolved** | Source review only | Two candidate API keys (`reasoning_traceability`, `accountability_support`) plausibly correspond to two Codebook conditions containing the word "traceability". The assignment is **not evidenced** |
| **Chronology** | Whether the sequence of events is followable from the record alone, including timing of prior interventions and the period under review | `temporal_reconstructability` | **Partial (inferred)** | Source review only | "Temporal" corresponds to chronology in sense; the name is not the Codebook name |
| **Evidentiary Sufficiency** | The aggregate condition: whether the record stands on its own as an evidentiary document for an independent reviewer with no prior knowledge | `cold_reviewer_clarity` | **Partial (inferred)** | Source review only | The Codebook calls this the **aggregate** condition. Whether the API key is the aggregate or a distinct fifth dimension is **not evidenced** |

## Why this matters to an evaluator

**INFERENCE, from A-10 and the table above.** A partner integrating against the API
receives five keys, none of which except one carries the name used in the published
methodology. Nothing in the repository declares the correspondence. An integrator must
therefore either guess the mapping or ask. Both outcomes are avoidable, and the fix is
documentation rather than code.

**This document does not resolve the mapping.** Resolving it requires the owner to
state the intended correspondence, after which it can be verified against engine
behaviour and promoted from INFERENCE to VERIFIED.

> **OWNER INPUT REQUIRED: declare the intended Codebook-to-API correspondence for the
> four non-exact pairs, in particular whether `cold_reviewer_clarity` is the aggregate
> condition (Evidentiary Sufficiency) or a distinct dimension.**

## Output contract

| Field | Value | Classification |
|---|---|---|
| Per-condition status enum | `pass`, `review`, `gap` | **VERIFIED** (`openapi.json`, `ConditionResult.status`) |
| Routing enum | `Ready`, `Needs work`, `Gap` | **VERIFIED** (`openapi.json`, `ReviewResponse.routing`) |
| Routing logic (how conditions produce routing) | not declared in the contract | **GAP** |
| Request fields | `text`, `runs` | **VERIFIED** (`ReviewRequest`) |
| Variance behaviour when `runs > 1` | `variance` object present in the response schema | **VERIFIED as contract**, effect **NOT AUDITABLE** without an authorized call |
| Response envelope | `request_id`, `api_version`, `engine`, `engine_version`, `model`, `routing`, `runs`, `conditions`, `variance`, `disclosure` | **VERIFIED** |

## Conformance test plan (not executed)

These tests are **specified, not run.** No result is claimed for any of them.

| # | Test | Requires | Status |
|---|---|---|---|
| CT-1 | Authorized call returns 200 with all five condition keys present | Partner token | **NOT RUN** (no token; authentication not bypassed) |
| CT-2 | Unauthenticated call returns 401 | none | **NOT RUN** (would be a live call against production; deferred to the approval gate) |
| CT-3 | Body under 40 characters returns 400 `record_too_short` | Partner token | **NOT RUN** |
| CT-4 | `runs > 1` populates `variance` | Partner token | **NOT RUN** |
| CT-5 | Response `model` matches the deployed constant | Partner token | **NOT RUN** |
| CT-6 | Record text does not appear in any stored row after a call | Partner token **and** database read | **NOT RUN** |

CT-6 is the test that would move row A-5 of the register from source-verified to
independently verified. It is the highest-value single test in this package.

---

# BOARD DECISION BD-04 — 2026-09-16

**Three of the four non-exact pairs are now DECLARED as the intended mapping. The fourth is
not, and the reason matters.**

| Codebook condition | API key | Relationship |
|---|---|---|
| Basis Identification | `basis_identification` | **EXACT** (unchanged) |
| Reconstructability | `reasoning_traceability` | **SEMANTIC / INFERRED — DECLARED** |
| Chronology | `temporal_reconstructability` | **SEMANTIC / INFERRED — DECLARED** |
| Decision-Process Traceability | `accountability_support` | **SEMANTIC / INFERRED — DECLARED** |
| Evidentiary Sufficiency | `cold_reviewer_clarity` | **UNRESOLVED. NOT DECLARED** |

**These three are DECLARED, not UPGRADED.** They remain SEMANTIC / INFERRED. The declaration
settles *which* engine key corresponds to *which* Codebook condition; it does not assert that
the two names mean the same thing, and the prohibition on describing the engine as a
restatement of the Codebook stands.

**Why the fourth is different, and why the Board did not decide it.** The Codebook calls
Evidentiary Sufficiency **the aggregate** condition. `deriveDetermination()` weights
`cold_reviewer_clarity` **identically to the other four**. That is not a question about what the
field is called; it is a question about **what the engine computes**. If it is the aggregate,
the engine averages a summary of the other four in alongside them. If it is a fifth dimension,
the Codebook's aggregate has no engine representation at all. **Deciding it by preference would
change the methodology, not document it.** It remains **D-2, INTENTIONALLY UNRESOLVED**.

**`openapi.json` was not modified.** sha256 verified identical before and after this cycle. The
declaration above is a methodology record, not a contract change, and **option D of the API
reconciliation still cannot proceed**, because it requires emitting `Needs work`, which appears
nowhere in the Codebook and would be a fourth record-level vocabulary.

**OWNER INPUT still requested for the fourth pair.** Unchanged, and now the only one outstanding.
