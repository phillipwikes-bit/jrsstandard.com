# Input contamination and development-material exclusion protocol (internal)

**Package `JRS-EVAL-READINESS-20261007-PR39`. Status `PLANNING_ONLY`.** Enforcement: `lib/intake.js` (INT-02, INT-09, INT-10) and `lib/scan.js` (SCAN-01 to SCAN-04).

## Current implementation, target and absent evidence
- **Current implementation:** exact digest matching against the 94 registered development texts in `lib/engine-candidate/dev-material.js`, including the five frozen demonstration records, plus a repository scan.
- **Target:** a custodian computes each record's digest outside the repository and declares it at intake, and an independent party attests provenance and independence.
- **Absent:** no evaluation record, digest, provenance attestation or independence attestation exists.

## Digest rule
Each record is declared by `input_digest` under `jrs-material-sha256/1`: the SHA-256 of the record's whitespace-normalised text, computed exactly as `materialHash()` in `dev-material.js`. Intake refuses a digest equal to registered development material (INT-09 `development_material`) or to a frozen demonstration record (INT-09 `frozen_demo_material`).

Digest matching does not establish independence. It is a contamination control: it catches exact and whitespace-only copies of development texts. It cannot catch an edited, shortened or paraphrased copy (the separate shingle screen in `contamination.js` flags some of those for a person to judge), and a digest that matches nothing says nothing about who wrote a record or why. Independence rests on the custodian's provenance and the reviewers' own attestations.

## What can never be evaluation material
- The 89 engine-candidate development texts, the five frozen demonstration records and every probe in `lib/probes.js`.
- Public case records, participant or pilot material, and any sealed-holdout material.
- Anything labelled synthetic, which is refused if it is also labelled independent evidence (INT-10).

## Repository scan
| Control | Fails when |
|---|---|
| SCAN-01 | a file sits in a location reserved for evaluation inputs or holdouts |
| SCAN-02 | a file carries the evaluation-source marker defined in `lib/scan.js` |
| SCAN-03 | a paragraph's digest equals a declared evaluation input digest |
| SCAN-04 | a package artifact carries a record-text field |

A clean scan shows only that none of these signs is present. A pasted record without the marker and without a declared digest cannot be detected by it.
