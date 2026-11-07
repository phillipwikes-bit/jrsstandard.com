# Condition Rulebook

Local ID: EGC-DOC-05 (NON-CANONICAL). Code: `lib/engine-evidence-graph/conditions.mjs`; status combination in `compiler.mjs`.

## Claim
Five conditions are evaluated against visible record structure. The compiler keeps or lowers a candidate's proposed status; it never raises one.

## Local engineering evidence
Fixtures GC-001 to GC-035 (status column in `fixtures/FIXTURE_REGISTER.md`); validator rule GV-07; mutations on status combination.

## Rules
| Rule | Effect |
|---|---|
| supported | Allowed only with a verified evidence path and no conflict, instruction risk, refusal or unusable quotation for the condition |
| gap | Allowed only with a visible rule gap (no_locatable_conclusion, no_authority_section, authority_source_not_identified, no_explicit_dates, no_stated_expiry_date, no_compensating_control_stated) and verified evidence or a compiler section anchor |
| review_required | Any conflict, instruction risk, review reason (conclusion without basis, basis without conclusion, basis with no reason or source), or an unmet condition for supported or gap |
| not_assessed | Refused intake, stopped run, invalid candidate response |
| sufficiency | Never supported. Limitation: "This result identifies visible documentation gaps only. It does not determine whether the underlying decision had sufficient substantive support." |

## Interpretation
Status reflects what the record visibly contains, under fixed rules.

## Limitation
The rules are engineering choices. They are not the Codebook's RC1 to RC5 conditions; that correspondence is NOT ESTABLISHED.

## External evidence still required
Owner and independent-reviewer agreement that these rules are an acceptable operationalisation.
