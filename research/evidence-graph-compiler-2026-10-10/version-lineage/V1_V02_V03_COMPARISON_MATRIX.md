# Comparison Matrix: v1, v0.1, v0.2, v0.3

Local ID: VL-003-MATRIX (NON-CANONICAL).

## Claim
The table states what each version does, the evidence status of its output, and the inference that output does not permit.

## Local engineering evidence
Version code paths listed in `VERSION_BOUNDARY_MANIFEST.json`; test suites for v0.1, v0.2, v0.3.

| Version | Function | Evidence status | Prohibited inference |
|---|---|---|---|
| v1 `0.1.0-validation` | Model returns per-condition pass, review or gap with free-text notes and a routing determination | Historical output only; no citation; truncates records over 8000 characters | That a v1 pass meant the record was sufficient or the decision was justified |
| v0.1 `0.1.0-local` | Envelope, network trap and replay around v1 logic on synthetic fixtures | Local replay characterisation of v1 behaviour | That replay agreement is accuracy, or that v1 passed any independent check |
| v0.2 `0.2.0` | Candidate supplies offset-cited evidence; contract verifies offsets and caps statuses | Local verification that cited text exists at the stated offsets | That `supported` means the condition is met, or that v0.2 findings carry into v0.3 |
| v0.3 `0.3.0-evidence-graph` | Candidate supplies quotes only; compiler resolves quotes, builds a typed graph, detects record conflicts, attaches limitations and review routes | Local verification that quoted text is present and associated with a bounded assertion type | That TEXTUALLY_SUPPORTS proves the finding, that a conflict reveals the true state, or that any finding is semantically correct |

## Interpretation
Rows describe mechanism, not quality.

## Limitation
Synthetic fixtures authored in the same engineering process as the code. No independence.

## External evidence still required
Independent labels and adjudication for any accuracy statement about any row.
