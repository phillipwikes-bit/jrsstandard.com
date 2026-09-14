# CONTRADICTION 001 — Condition vocabularies and the published API contract

**Opened:** 2026-09-14 · **Corrected:** 2026-09-14 after adversarial review · **Status:** OPEN

---

## CORRECTION NOTICE (Rule 10)

**OLD FINDING.** The first version of this record stated as FACT that the mapping between the two condition vocabularies "is not documented anywhere in the repository."

**NEW EVIDENCE.** `docs/enterprise-diligence/METHODOLOGY_TO_API_MAPPING.md` is a pre-existing 76-line document devoted to exactly this question. It contains the five-row mapping table, per-pair semantic classifications (Exact / Partial (inferred) / Unresolved), an explicit OWNER INPUT REQUIRED box, an output-contract table and a six-test conformance plan.

**CORRECTED STATUS.** That document is the authoritative record of the mapping question. This record is **subordinate to it** and adds only what it does not contain.

**EXPLANATION.** The document sits in `docs/enterprise-diligence/`, the directory CLAUDE.md Section 2 names as the authoritative baseline and instructs be read before modifying the repository. It was not read. This is a Rule 1 failure, and it produced a rediscovery presented as a discovery. The prior version also reached materially the same inference about `cold_reviewer_clarity` and the two traceability keys **without citing the document that had already reached it**.

---

## What this record still adds

Three findings are **not** in `METHODOLOGY_TO_API_MAPPING.md` and were established here.

### 1. There is a THIRD vocabulary, not two

**FACT.** `openapi-review-engine.json:80` declares `"determination": {"enum": ["ready", "review_required", "gap_identified"]}`, and `api/v1/review-engine.js:108-113` implements `deriveDetermination()` returning exactly those three values.

The prior version of this record stated as FACT that `openapi-review-engine.json` "carries only pass|review|gap" and that vocabulary B has "no routing vocabulary of its own." **Both statements were false.** Corrected here.

### 2. The published contract does not describe the deployed endpoint

**FACT, and this is the commercially material one.** `openapi.json` documents `POST /api/v1/review-engine` and declares `ReviewResponse.required` as `[request_id, api_version, engine, engine_version, model, routing, conditions]`, with `routing` enum `["Ready","Needs work","Gap"]`.

**FACT.** `api/v1/review-engine.js` contains **zero** occurrences of `routing`. It returns `{engine, engine_version, model, evidence_stage, disclaimer, reviewed_at, runs, result:{conditions, determination, ...}}`. There is no top-level `routing`, no top-level `conditions`, and `disclaimer` rather than `disclosure`.

**This corrects the baseline document as well.** `METHODOLOGY_TO_API_MAPPING.md` records the response envelope including `routing` and `disclosure` as **VERIFIED** on the strength of `openapi.json` alone. It was verified against the specification, not against the code.

`openapi.json` carries `"license": {"name": "Commercial licence"}`. It is the contract a partner would build against, and a partner building against it would fail on the first response.

### 3. `Ready` was recorded as the whole routing enum when it is one of three

**FACT.** `openapi.json` routing enum is `["Ready", "Needs work", "Gap"]`. The prior version recorded `values_seen: ["Ready"]`, which presented an incomplete extraction as an observation. Corrected in `standard/jrs-conditions.json`.

---

## Required action

**HUMAN, unchanged and already requested in `METHODOLOGY_TO_API_MAPPING.md`:** declare the intended correspondence for the four non-exact pairs, in particular whether `cold_reviewer_clarity` is the aggregate condition or a distinct dimension.

**NEW, and it should not wait for the above:** reconcile `openapi.json` with the deployed `api/v1/review-engine.js`. One of the two is wrong about a commercially licensed interface. Recorded as blocker **B-007**.
