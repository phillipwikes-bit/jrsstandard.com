# API Contract Reconciliation — B-007 / D-1

**Date:** 2026-09-15 · **Status: COUNSEL REVIEW REQUIRED · OWNER DECISION REQUIRED**

**Nothing was modified.** `openapi.json` was not edited. `api/v1/review-engine.js` was not
edited. No deployment occurred. **No reconciliation is declared.**

**This builds on, and does not rediscover, `METHODOLOGY_TO_API_MAPPING.md` and
`.jrs/contradictions/CONTRADICTION_001.md`**, which already established the core finding on
2026-09-14. Every fact below was re-verified against the primary files.

---

## 1. Published contract — `openapi.json`

| Property | Value |
|---|---|
| OpenAPI | 3.1.0 · **`info.version` 1.0.0** |
| **Licence** | **Commercial licence**, url `https://www.jrsstandard.com/terms.html` |
| Server | `https://www.jrsstandard.com` (Production) |
| Path | `POST /api/v1/review-engine` |
| **`ReviewResponse.required`** | **`request_id, api_version, engine, engine_version, model, routing, conditions`** |
| Optional | `runs`, `variance`, `disclosure` |
| **`routing` enum** | **`Ready` · `Needs work` · `Gap`** (top level) |
| `conditions` | **top level**, five keys |
| `ConditionResult` | required `status`, `note`; `status` enum `pass` · `review` · `gap`; `note` maxLength 400 |

**Distribution FACT.** Served at `/openapi.json`, with `/openapi` redirecting to it, and
linked from `security.html`, `enterprise.html`, `review-engine.html` and the confidential
buyer surface `vp-7c1f9a4e8d2b6035.html`. It is **published**, not merely supplied.

## 2. Validation specification — `openapi-review-engine.json`

`info.version` **`0.1.0-validation`**, **no licence block**. `ReviewResponse` declares **no
`required` array** and carries `request_id, api_version, engine, engine_version, model,
evidence_stage, disclaimer, reviewed_at, runs, result, variance`. It declares
`determination` with enum `ready` · `review_required` · `gap_identified`.

## 3. Implemented contract — `api/v1/review-engine.js`

Derived from source, not from a live call.

`ENGINE_VERSION = '0.1.0-validation'`, `API_VERSION = 'v1'`. The response is
`Object.assign({request_id, api_version}, meta, {result: results[0]})`, plus `variance` when
`runs > 1`, giving:

```
{ request_id, api_version, engine, engine_version, model,
  evidence_stage, disclaimer, reviewed_at, runs,
  result: { conditions: {...five keys...}, determination }, variance? }
```

**FACT: `routing` appears 0 times in the implementation. `disclosure` appears 0 times.**
`deriveDetermination()` returns `gap_identified` / `review_required` / `ready`. Per-condition
`status` is coerced to `pass` / `review` / `gap`.

**The implementation matches the validation specification, not the published licensed one.**

## 4. Exact schema difference

| # | Published `openapi.json` | Implementation | Severity |
|---|---|---|---|
| 1 | `routing` **required**, top level | **absent** | **Breaking.** A conforming consumer reading `routing` gets `undefined` |
| 2 | `conditions` **required**, top level | nested at **`result.conditions`** | **Breaking.** Path differs |
| 3 | `routing` enum `Ready` / `Needs work` / `Gap` | `determination` enum `ready` / `review_required` / `gap_identified` | **Breaking.** Different field, different values, different case |
| 4 | `disclosure` (optional) | `disclaimer` | Non-breaking, name differs |
| 5 | not declared | `evidence_stage`, `reviewed_at`, `result`, `determination` | Additive |
| 6 | `request_id`, `api_version`, `engine`, `engine_version`, `model` | **present and matching** | **None** |
| 7 | `ConditionResult.status` enum | **matching** (`pass`/`review`/`gap`) | **None** |
| 8 | five condition key names | **matching exactly** | **None** |
| 9 | `info.version` 1.0.0, Commercial licence | `0.1.0-validation`, no licence | **Version and licence mismatch** |

**Three breaking differences, all in the record-level result.** The condition-level payload,
which is the substantive JRS output, agrees exactly.

## 5. Consumer impact

**INFERENCE.** A consumer built strictly against `openapi.json` fails on the first response:
`routing` is missing and `conditions` is not where the contract says. Both fields are declared
**required**, so a generated client with schema validation rejects the response outright; a
hand-written client silently reads `undefined` and routes every record as unknown.

**NOT ESTABLISHED, and not asserted: that any external party has built against it.** No
evidence of reliance was located. Publication is established; reliance is not.

## 6. Version and compatibility implications

The published document claims `1.0.0`, a stability signal, while the implementation announces
`0.1.0-validation` in its own `engine_version` field **in every response**. A consumer
therefore receives, in the same payload, a version string contradicting the contract it was
given. **No version negotiation, no `Accept` header handling and no deprecation mechanism
exists in the route.**

## 7–10. Options

### Option A — change the implementation to match the published contract
Emit top-level `routing` and `conditions`, map `ready`→`Ready`, `review_required`→`Needs work`,
`gap_identified`→`Gap`, rename `disclaimer`→`disclosure`.
**Files:** `api/v1/review-engine.js`, `api/review-engine.js`, `openapi-review-engine.json`,
`engine-activity.html` (reads `determination`), `scripts/check_zero_drift.py`.
**Cost:** breaks every current internal consumer at once. **Risk:** the published vocabulary
`Needs work` is not the vocabulary the methodology uses anywhere else, so this propagates a
third taxonomy into the engine. **It also silently resolves the D-2 question by fiat.**

### Option B — change the published contract to match the implementation
**Files:** `openapi.json` only.
**Cost:** editing a published document carrying a Commercial licence. **COUNSEL REVIEW
REQUIRED before any edit.** This is the option the directive expressly prohibits acting on.

### Option C — version the contracts
Keep `openapi.json` as the frozen `v1` description; publish `v2` describing actual behaviour;
route by path or header.
**Files:** new `openapi-v2.json`, new route or header handling, buyer-surface links.
**Cost:** two contracts to maintain. **Benefit:** no published document is rewritten.

### Option D — dual emission, then deprecation
Emit **both** shapes: add top-level `routing` and `conditions` alongside the existing
`result` envelope, with `disclosure` mirroring `disclaimer`. Announce a deprecation date for
the nested form.
**Files:** `api/v1/review-engine.js` (additive), `openapi-review-engine.json`, a deprecation
note.
**Cost:** a larger payload and a dated commitment. **Benefit:** a consumer built against the
published contract starts working **without any published document being modified**, and
nothing currently working breaks.

## 11. Engineering recommendation

**D, then C.** D makes the published contract true without touching it, which removes the
commercial exposure without creating a counsel dependency; C then formalises the difference.

**This is an ENGINEERING RECOMMENDATION. It is not a Board decision, not an owner decision
and not counsel clearance.** It is recorded for decision, not acted on.

**One caveat that belongs with the recommendation:** D requires choosing the `Ready` /
`Needs work` / `Gap` mapping, and `Needs work` appears nowhere in the Codebook. Emitting it
would put a fourth vocabulary into production. **That mapping is owner input, not an
engineering detail**, and D should not proceed until it is given.

## 12–14. Dependencies

| | |
|---|---|
| **Counsel** | Any edit to `openapi.json`: it is published, linked from a buyer surface, and carries a Commercial licence |
| **Owner** | Choice of option; and for A or D, the routing-vocabulary mapping |
| **Engineering, unblocked** | None. Every path needs a decision above it first |
