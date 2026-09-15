# API / OpenAPI Reconciliation Report

**Blockers:** B-007 (HIGH, commercial) and B-002 (MEDIUM, technical), preserved as distinct identities
**Date:** 2026-09-14 · **Status: HUMAN APPROVAL REQUIRED** · **No production behaviour, contract, licensing language or public documentation was changed.**

---

## 1. The finding is narrower and sharper than first recorded

The earlier framing was "specification versus implementation". That was incomplete.

**FACT.** There are **two OpenAPI documents describing the same path**, `/api/v1/review-engine`, and **one of them matches the implementation while the other does not.**

| | `openapi.json` | `openapi-review-engine.json` |
|---|---|---|
| OpenAPI version | 3.1.0 | 3.0.3 |
| `info.version` | **1.0.0** | **0.1.0-validation** |
| `info.license` | **Commercial licence**, linking `terms.html` | none |
| Server | `https://www.jrsstandard.com` | `https://www.jrsstandard.com` |
| Path described | `/api/v1/review-engine` | `/api/v1/review-engine` |

## 2. What the specification says

**`openapi.json`** declares `ReviewResponse.required` as:

`request_id`, `api_version`, `engine`, `engine_version`, `model`, **`routing`**, **`conditions`**

with properties also including `variance` and **`disclosure`**, and `routing` constrained to the enum **`["Ready", "Needs work", "Gap"]`**.

**`openapi-review-engine.json`** declares `ReviewResponse` properties as:

`request_id`, `api_version`, `engine`, `engine_version`, `model`, **`evidence_stage`**, **`disclaimer`**, `reviewed_at`, `runs`

with no `required` array, no `routing`, no top-level `conditions`, no `disclosure`, and a separate `determination` enum **`["ready", "review_required", "gap_identified"]`**.

## 3. What the implementation does

`api/v1/review-engine.js` returns a `meta` object of exactly:

`engine`, `engine_version`, `model`, **`evidence_stage: 'operational_validation'`**, **`disclaimer`**, `reviewed_at`, `runs`

merged with `result` (and `variance` when `runs > 1`). Conditions are nested at `result.conditions`. The routing value is produced by `deriveDetermination()` at lines 108-113 and named **`determination`**, returning `gap_identified` / `review_required` / `ready`.

**The implementation contains zero occurrences of `routing`.**

Status codes emitted: 200, 400, 401, 405, 429, 502, 503 — which `openapi.json` documents correctly. Error keys: `record_too_short`, `invalid_json`, `unauthorized`, `rate_limited`, `method_not_allowed`, `engine_not_configured`, `review_failed`.

## 4. Where they disagree

| Dimension | `openapi.json` | Implementation | `openapi-review-engine.json` |
|---|---|---|---|
| Response envelope | flat, `routing` + `conditions` at top level | `meta` + nested `result` | flat meta, matches implementation |
| Routing field | `routing`, required | **absent**; `result.determination` | `determination` |
| Routing vocabulary | `Ready` / `Needs work` / `Gap` | `ready` / `review_required` / `gap_identified` | same as implementation |
| Conditions location | top level, required | `result.conditions` | not declared at top level |
| Disclosure field | `disclosure` | **`disclaimer`** | `disclaimer` |
| `evidence_stage` | **absent** | present | present |
| Condition status enum | `pass` / `review` / `gap` | `pass` / `review` / `gap` | `pass` / `review` / `gap` |
| Request schema | `{text, runs}`, `text` required | matches | matches |
| Status codes | 200/400/401/405/429/502/503 | matches | — |
| Auth | `bearerAuth` | Bearer token, 401 | — |

**Agreement:** request schema, condition status enum, status codes and auth model all agree across all three. **The divergence is confined to the response envelope.**

## 5. Which artifact governs which surface

**NOT ESTABLISHED, and this is the question that matters commercially.**

- `openapi.json` carries the **Commercial licence** and is therefore the document a licensee would be handed. It does **not** describe the deployed endpoint.
- `openapi-review-engine.json` is versioned `0.1.0-validation`, carries no licence, and **does** describe the deployed endpoint.
- Neither document is referenced from a public page under a path that discloses which is canonical.

A partner integrating from the licensed document would parse for `routing` and `conditions` at the top level and find neither.

## 6. Reconciliation options

### OPTION A — change the implementation to conform to `openapi.json`

**Change:** add top-level `routing` mapped from `determination`, lift `conditions` to top level, rename `disclaimer` to `disclosure`.
**Files:** `api/v1/review-engine.js`, tests.
**Production consequence:** live response shape changes. Any existing consumer of `result.conditions` breaks.
**Commercial consequence:** the licensed contract becomes true without amending a licensed document.
**Backward compatibility:** **breaking**, unless both shapes are emitted.
**Reversibility:** high (one file).
**Testing:** schema conformance against `openapi.json`; regression on `review-engine.html`.
**Risk:** MEDIUM. Changes production behaviour. Also silently adopts `Ready|Needs work|Gap` as the routing vocabulary, which is a methodology-adjacent decision.

### OPTION B — change `openapi.json` to conform to the implementation

**Change:** replace the `ReviewResponse` schema with the deployed envelope; `disclosure` → `disclaimer`; add `evidence_stage`; replace `routing` with `determination` and its enum.
**Files:** `openapi.json`.
**Production consequence:** **none.** No code changes.
**Commercial consequence:** amends a document carrying a Commercial licence. If it has been supplied to anyone, that is a contract-adjacent act.
**Backward compatibility:** no runtime break; a consumer who built to the old document is already broken today.
**Reversibility:** high.
**Testing:** OpenAPI validation; field-by-field diff against a live authorised response.
**Risk:** LOW technically, **NON-TECHNICAL commercially** — it is the option most likely to need Phillip's, and possibly counsel's, sign-off.

### OPTION C — explicit versioned contracts

**Change:** declare `openapi-review-engine.json` (0.1.0-validation) the contract for the current endpoint, and either retire `openapi.json` or re-scope it to a future `v2` that does not yet exist. Add a machine-readable pointer stating which document governs.
**Files:** both documents, plus a pointer.
**Production consequence:** none.
**Commercial consequence:** honest and defensible: it says the licensed 1.0.0 contract is not yet implemented.
**Backward compatibility:** unaffected.
**Reversibility:** high.
**Testing:** validation of both documents.
**Risk:** LOW. Requires accepting publicly that a 1.0.0 document describes an unbuilt interface.

### OPTION D — dual emission with deprecation

**Change:** emit **both** shapes: keep `result` and add top-level `routing`/`conditions` as aliases, with a documented deprecation date for one.
**Files:** `api/v1/review-engine.js`, both documents.
**Production consequence:** additive only; nothing breaks.
**Commercial consequence:** the licensed contract becomes true immediately, with no amendment.
**Backward compatibility:** **fully preserved**.
**Reversibility:** high.
**Testing:** both schemas validate against one live response.
**Risk:** LOW-MEDIUM. Cost is a permanently larger payload and two shapes to maintain until deprecation.

## 7. Engineering recommendation

**OPTION D, then OPTION C as the follow-up.** Offered as an engineering recommendation only.

Reasoning: it is the only option that makes the licensed document true **without breaking any existing consumer and without amending a document that carries a Commercial licence**. Option A breaks consumers; Option B edits a licensed artifact; Option C is the most honest but concedes that a 1.0.0 contract is unimplemented.

**This recommendation does not choose the routing vocabulary.** Option D would emit `Ready|Needs work|Gap` alongside `determination`, and whether those two vocabularies mean the same thing is **NOT ESTABLISHED** and overlaps the Codebook-to-API question.

## 8. What would change / what would not

**Would change under D:** `api/v1/review-engine.js` response payload (additive), both OpenAPI documents, tests.
**Would NOT change under any option:** the five Review Conditions, the condition status enum, the request schema, status codes, the auth model, the engine's self-declaration, any research finding, any published figure.

## 9a. EXTERNAL DISTRIBUTION STATUS — INVESTIGATED 2026-09-15

The owner directed that no implementation decision be authorized until one factual question was answered: **has `openapi.json` ever been supplied to an external party?**

**FINDING: IT IS PUBLISHED. Distribution is established, and it is broader than supply to a single party.**

| Evidence | Result |
|---|---|
| `https://www.jrsstandard.com/openapi.json` | **HTTP 200, 10,488 bytes, the real specification** |
| `https://www.jrsstandard.com/openapi` | **HTTP 200**, routed by `vercel.json` |
| Linked from | `security.html`, `review-engine.html` (public), plus **both CONFIDENTIAL BUYER surfaces** |
| `research/IP_SALE_TRACKER.md` | refers to *"the OpenAPI spec the owner already publishes"* |
| `research/IP_SALE_TRACKER.md` | records the buyer page linking *"the guides, training, vendor preview, **OpenAPI**, Standard PDF and simulations"* |

**What is established:** the document carrying the **Commercial licence** is published on the production domain, reachable without authentication, and linked from buyer-facing material.

**What is NOT established:** whether any *specific named party* received it under that licence, or relied on it. The repository cannot answer that, and it was not guessed.

**DISPOSITION, per the owner's own instruction:**

> **COUNSEL REVIEW REQUIRED BEFORE CONTRACT MODIFICATION.**

This materially changes the option weighting. **Option B (amend `openapi.json`) now edits a published document carrying a Commercial licence** and is a counsel matter, not an engineering one. **Option D (additive dual emission) does not modify the published document at all**, which strengthens the prior engineering recommendation rather than changing it.

## 9b. SEMANTIC SAFEGUARD (owner instruction, 2026-09-15)

**`routing` is NOT asserted to equal `determination`.** The owner directed that no semantic equivalence be inferred, and D-2 records `cold_reviewer_clarity` as insufficiently established, so the vocabularies cannot be equated on the available evidence.

If compatibility aliases are ever implemented, **their semantic relationship must be explicitly documented**, not assumed from position in the payload.

**No routing vocabulary has been chosen. No field has been emitted. Neither document was modified.**

## 10. HUMAN APPROVAL REQUIRED

> **DECISION:** select Option A, B, C, D, or another. **Nothing will be implemented until you choose.** If `openapi.json` has been supplied to any external party under its Commercial licence, say so, because that converts the choice from an engineering matter into one for counsel.
