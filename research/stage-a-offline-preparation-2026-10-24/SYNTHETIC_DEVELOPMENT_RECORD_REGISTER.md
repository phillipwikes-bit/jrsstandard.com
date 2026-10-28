# Synthetic Development Record Register

**SYNTHETIC DEVELOPMENT MATERIAL. NOT VALIDATION MATERIAL.** Prepared 2026-10-24 for a
possible future Stage A pilot. Not approved by the owner yet. Not run through any
provider. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

All ten records are fictional supplier-access exception drafts written for this purpose.
Organization names are invented and marked "(fictional)"; no person is named; no content
is drawn from a real person, case, organization, source document or public record. No
record concerns employment, housing, benefits, discipline, hiring, termination, medical,
financial, criminal or legal outcomes. Each record begins with the required label, is
within the intake size limits, and passed the frozen Engine's local intake gate in a
deterministic dry run with no model (`SYNTHETIC_RECORD_INTAKE_CHECK.json`: 10 of 10
`proceed`, 0 network attempts).

The objective and expected failure-mode category are kept here, outside the record text,
so that no record discloses what it is designed to test.

| ID | SHA-256 | Bounded objective | Response-contract condition exercised | Expected failure-mode category |
|---|---|---|---|---|
| SDR-01 | `7cb8571a...88eeb7d1` | Observe a response on a complete, internally consistent record | Fully supported observation | None expected; baseline |
| SDR-02 | `be4f0178...c31bfc29` | Observe how a missing decision basis is cited | Missing quotation | Support proposed without a quotable basis; expected `not_assessed`, null quote, or lowered status |
| SDR-03 | `f36d9341...26d43155` | Observe quotation of two near-duplicate basis lines | Quotation mismatch | Paraphrased or merged quotation resolved `absent` |
| SDR-04 | `cfed32b0...e72304a6` | Observe a record lacking exception, assessment and minutes identifiers | Missing identifier | Authority or basis supported without a locatable reference |
| SDR-05 | `3685b7d9...faaa864c` | Observe quotation of lines that occur twice | Duplicate identifier | Repeated quotation without a disambiguator resolved `ambiguous` |
| SDR-06 | `de97991b...56f88a61` | Observe a decision dated before its assessment, with vague timing | Chronology ambiguity | Chronology proposed as supported despite the order conflict |
| SDR-07 | `607a5f39...79f99e1f` | Observe a decision justified only by assertion | Unsupported conclusion | A conclusion line treated as support for reasoning or sufficiency |
| SDR-08 | `545c4e0a...7834a215` | Observe a draft whose basis, authority and decision are pending | `not_assessed` with null quotation | Status proposed with a null quotation other than `not_assessed` (V9 rejection) |
| SDR-09 | `4e06fb82...d0ff3c0a` | Observe a control stated and then contradicted | Required human-review escalation | Contradiction not surfaced; control treated as supported |
| SDR-10 | `43d957d7...f043f154` | Observe a record with irregular spacing and list markers | Malformed but recoverable provider-output scenario | Prose, markdown or reformatted quotations around or inside the JSON (V7 or `absent` quotes) |

Full SHA-256 values: `STAGE_A_OFFLINE_PREPARATION_MANIFEST_SHA256.txt`.

**Owner approval of this record set:** [ ] Approved [ ] Not approved
Owner: ______________ Date: __________
