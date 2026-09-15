# JRS Evidence & Decision Reconstruction Manifest — Specification v1.0

**Date:** 2026-09-15 · **Status: SPECIFICATION — NOT IMPLEMENTED, NOT DEPLOYED**

**This is a specification only.** No production implementation was created. Nothing in this
document changes JRS methodology, the five review conditions, or the Review Engine's
behaviour.

---

## 1. Purpose

The Manifest converts a JRS evaluation from a transient API response into a **portable,
verifiable evidence artifact** that a later reviewer can use to reconstruct what was
evaluated, under which versions, and with what result, **without needing access to the
original record and without relying on this project's infrastructure still existing.**

That last clause is the design constraint that matters. A manifest that can only be
interpreted by a live JRS service is not evidence; it is a receipt.

## 2. Intended architecture

```
Customer Record
  → Minimum Necessary Representation
    → JRS Review Engine
      → Evaluation
        → Decision Reconstruction Manifest
          → Customer-Controlled Evidence Store
```

**This is an architectural objective, not a description of the current implementation.**
The present engine does not emit a manifest, and `logReview()` writes evaluation output to a
**JRS-controlled** store rather than a customer-controlled one. The gap is recorded in §9.

## 3. The central privacy property

**The manifest does not necessarily contain the underlying sensitive record, and by default
it does not contain it at all.**

The manifest carries an `input.hash` and an optional `input.identifier`. A holder of the
original record can prove correspondence by recomputing the hash. A holder of the manifest
alone learns the evaluation, not the record.

**Consequence, stated rather than left implicit:** a manifest is not a redaction of a record
and must not be described as one. It is a statement *about* a record.

**Warning carried into the schema:** the per-condition `note` and any remediation text are
model output *derived from* the record and can paraphrase it. A manifest that includes them
is **not** record-free. `content_class` (§5.9) exists to make that distinction explicit
rather than leave a reader to discover it.

## 4. Versioning

Three versions are carried separately and must never be collapsed:

| Field | What it pins |
|---|---|
| `manifest_version` | This specification's version. `1.0` |
| `jrs_version` | The JRS Standard version the conditions come from |
| `codebook_version` | The Codebook / rule version used to interpret them |
| `engine.version` | The Review Engine build that produced the evaluation |
| `engine.model` | The model identifier, which is versioned infrastructure and not methodology |

A manifest whose `jrs_version` differs from a reader's is still readable; a manifest that
conflated them would not be.

## 5. Required content

### 5.1 Identity
`manifest_id` (UUID), `created_at` (RFC 3339, UTC).

### 5.2 Versions
`manifest_version`, `jrs_version`, `codebook_version`, `engine.name`, `engine.version`,
`engine.model`, `engine.api_version`.

### 5.3 Input
`input.hash` (algorithm-prefixed, e.g. `sha256:...`), `input.hash_algorithm`,
`input.identifier` (optional, customer-assigned), `input.length_chars` (optional),
`input.truncated` (boolean; the engine truncates at 8,000 characters and a manifest that hid
that would misrepresent what was evaluated).

### 5.4 Decision context
`context.identifier` (optional, customer-assigned), `context.decision_type` (optional),
`context.evaluated_by` (optional).

### 5.5 Condition results — **methodology vocabulary, not engine keys**

Five entries, each `{ status, note?, note_content_class? }`, `status` one of
`pass` · `review` · `gap`:

`basis_identification` · `decision_process_traceability` · `reconstructability` ·
`evidentiary_sufficiency` · `chronology`

**CONTROL, and it is the most important rule in this specification.** These names are the
**Codebook** conditions. The engine's keys are `basis_identification`,
`reasoning_traceability`, `cold_reviewer_clarity`, `accountability_support`,
`temporal_reconstructability`, and **the correspondence between the two sets is UNRESOLVED
for three of the five** (see `CODEBOOK_API_CORRESPONDENCE_CONTROL.md`).

**Therefore a v1.0 manifest MUST carry `condition_vocabulary`**, declaring which set the keys
belong to: `"jrs_codebook_1.0"` or `"review_engine_keys"`. A generator that has not been given
an owner-declared mapping **MUST** emit `"review_engine_keys"` and **MUST NOT** silently
relabel engine keys as Codebook conditions.

**This specification does not resolve the mapping and must not be read as resolving it.**

### 5.6 Record-level outcome
`routing.value` and `routing.vocabulary`. **Two record-level vocabularies exist** (`Ready` /
`Needs work` / `Gap` published; `ready` / `review_required` / `gap_identified` implemented),
so the vocabulary is named alongside the value rather than assumed. See
`API_CONTRACT_RECONCILIATION_2026-09-15.md`.

### 5.7 Warnings and human review
`warnings[]` (structured `{code, message}`), and `human_review.required` (boolean) with
`human_review.reason`.

**`human_review.required` defaults to `true` and the specification says why:** the engine is
empirically unvalidated, and a manifest that defaulted to "no human review needed" would make
an evidentiary claim the research does not support.

### 5.8 Evaluation metadata
`evaluation.runs`, `evaluation.variance` (optional), `evaluation.reproducibility_note`.

**Required wording constraint:** `reproducibility_note` must not describe reproducibility as
accuracy or as validation. Repeated agreement across runs is a statement about stability.

### 5.9 Integrity metadata
`integrity.manifest_hash` (over the canonical form excluding `integrity` itself),
`integrity.canonicalization` (e.g. `JCS/RFC8785`), `integrity.signature` (optional),
`integrity.signature_alg`, `integrity.signed_by`.

`content_class`, one of `no_record_content` · `derived_record_content` · `contains_record`,
declaring at the top level what class of content the manifest carries.

**Unsigned manifests are self-consistent, not authenticated.** `manifest_hash` detects
accidental alteration. It does not establish who produced the manifest. The specification
states this so that an unsigned manifest is never described as tamper-proof.

## 6. What the manifest must NOT contain

The raw record by default; credentials; the provider API key; internal prompt text; internal
infrastructure identifiers; any field asserting legal sufficiency, admissibility,
compliance or certification.

## 7. Conformance

A conforming manifest validates against
`schemas/jrs-decision-reconstruction-manifest.schema.json`, carries all §5.1–5.2 and 5.5–5.7
fields, and declares `condition_vocabulary`, `routing.vocabulary` and `content_class`.

## 8. What this specification deliberately does not do

It does not define routing logic, resolve the Codebook mapping, resolve the published API
contract, mandate signing, or require a JRS-hosted store. It also does not claim the current
engine can produce a conforming manifest.

## 9. Implementation gap, stated rather than closed

**FACT.** The current engine returns `{request_id, api_version, engine, engine_version,
model, evidence_stage, disclaimer, reviewed_at, runs, result:{conditions, determination}}`.

**Available today:** engine name, version, model, api_version, runs, timestamp, five
condition statuses and notes, determination, variance.

**Absent today:** `input.hash` (the engine never hashes the input), `jrs_version`,
`codebook_version`, `context.*`, `warnings[]`, `human_review.*`, all `integrity.*`.

**Assessment.** A conforming manifest **cannot** be produced by the current implementation
without additions. The additions are mechanical rather than methodological: hashing the input,
carrying two version constants, and computing a canonical hash. **None of them requires
changing what the engine decides.**

**Not implemented in this cycle.** §11 of the governing directive forbids forcing
implementation to claim progress, and generation should not be built before the mapping in
§5.5 is owner-declared, or the generator will have to guess the vocabulary on every call.
