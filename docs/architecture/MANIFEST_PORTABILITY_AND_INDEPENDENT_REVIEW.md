# Manifest Portability and Independent Review

**What a holder of a JRS manifest can establish, and what they cannot.** This separation is
the artifact's commercial and evidentiary value, so it is stated exactly.

## From the manifest alone, offline

- That an evaluation occurred, and when
- Which JRS Standard version, Codebook version, engine version, API version and **model**
- Which **condition vocabulary** the keys belong to, and therefore whether the Codebook
  correspondence has been declared or is still open
- Which **routing vocabulary** the record-level value came from
- The five condition statuses and, where present, the model's note on each
- Whether the evaluation saw the whole record (`input.truncated`)
- What class of record-related content the manifest carries (`content_class`)
- That the manifest has not been altered since it was hashed
- That human review was recorded as required, and the stated reason

## Requires the original record

- That this manifest corresponds to **that** record. Recompute the hash and compare
- Whether the note is a fair characterisation
- Anything about content the evaluation did not see, where `truncated` is true

## Requires the JRS implementation

- Why a particular status was assigned
- The routing logic that turned five statuses into one determination, **which is declared
  in no contract**
- The prompt, the model configuration, and the evaluation infrastructure

## Requires human judgment

- Whether the record is adequate for its purpose
- Whether the evaluation should be acted on
- Anything consequential. **`human_review.required` defaults to true and says why**

## Remains unestablished, by anyone, from this artifact

- **Accuracy.** No accuracy claim is made or supported
- **Validation.** The engine is empirically unvalidated
- **Legal sufficiency, admissibility, compliance, certification.** The schema forbids these
  fields and the validator refuses them
- **Authenticity**, unless signed and verified. Signature verification is not implemented
- **Evaluation reproducibility.** A deterministic manifest hash is not evidence of it

## Why this matters to a transaction

A buyer or licensee can hand a manifest to their own reviewer with two small files and no
access to this project. That is the difference between an asset whose claims can be
interrogated and one that must be taken on trust, and it is what the §53 design requirement
was for.
