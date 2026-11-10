# Evaluation Contamination Controls

Local ID: EGC-DOC-09 (NON-CANONICAL).

## Claim
Six contamination paths are checked before any package could be considered.

## Local engineering evidence
`checkEvaluationPackage`; packages P-01 to P-04, P-10, P-11; suite section F.

| Path | Control | Example package |
|---|---|---|
| Synthetic fixtures presented as holdout | `synthetic_presented_as_holdout` | P-01 |
| Development material in the sealed set | SHA-256 overlap against all v0.1, v0.2 and v0.3 fixture records (`development_sealed_overlap`) | P-02 |
| Labels from the engineering process claimed as independent | `label_independence_not_supported` | P-03 |
| Raw records in a tracked repository directory | `raw_records_in_tracked_directory` | P-04 |
| Component changed after freeze | prompt, codebook and compiler hashes compared to the freeze record | P-10 |
| Template presented as a completed evaluation | `status_claim_not_permitted`, `template_only_material` | P-11 |

## Interpretation
Each path that would let local work pass as independent evidence produces a refusal.

## Limitation
Overlap is exact-hash only; a lightly edited development record would not match. The checks cannot detect labels that were influenced informally.

## External evidence still required
A sealed set held outside the repository by an independent custodian; near-duplicate screening by that custodian.
