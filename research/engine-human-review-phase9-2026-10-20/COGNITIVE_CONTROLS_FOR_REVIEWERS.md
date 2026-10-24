# Cognitive Controls for reviewers

**LOCAL ENGINEERING MATERIAL ONLY.** Independent evaluation not authorized or conducted. No release, deployment, or commercial readiness determination. Release status remains NO_GO_NOT_VERIFIED. Blocker B-018 remains OPEN.

Package: `phase9-human-evidence-adjudication` (admitted `local_construction_only`, 2026-10-20). Material: synthetic only, derived from the fictional GC-001 record; holdout-ineligible.

Cognitive Controls are structured review safeguards. Each names one predictable review risk and asks one neutral, operational question. None tells a reviewer what to conclude. They make no clinical or diagnostic claim.

| Control | Name | Review risk | Question |
|---|---|---|---|
| `CC-INTENT` | Intent inference | Inferring why someone acted from the outcome alone. | Which words in the record state a reason, and which reasons are being supplied from the outcome rather than from the record? |
| `CC-PLAUSIBLE` | Plausible explanation is not evidence | Treating a reasonable-sounding explanation as if the record established it. | Is this explanation stated in the record, or is it one possible reading that the record does not state? |
| `CC-NEGATION` | Negation, qualification and condition | Missing "not", "unless", "only if" or similar words that change what the text says. | Does the quoted text contain a negation, qualification or condition, and how does it change what the text says? |
| `CC-DATES` | Event, document and decision dates | Merging the date something happened, the date it was written and the date it was decided. | For each date in the quotation, is it an event date, a document date or a decision date, and does the sequence hold? |
| `CC-WORDS` | Actual words versus assumed meaning | Reading meaning into a quotation that its words do not carry. | What does the quotation literally say, without adding meaning that is not in its words? |
| `CC-MISSING` | Missing information | Completing gaps in the record with assumptions. | What information would be needed to answer the reviewer question that the record does not contain? |
| `CC-BASIS` | Stated basis versus conclusion | Treating a stated conclusion as if it were its own basis. | Which text is the conclusion, and which text, if any, is the stated basis for it? |
| `CC-ESCALATE` | Escalation when reconstruction is not possible | Completing a review that the record cannot support instead of escalating. | Can this condition be reviewed from the record as it stands, or does the review need to be escalated? |

## Checks

`validateControls` reports a missing, disabled, incomplete, directive or non-question control, and an unexpected set size. Each control can be disabled independently and the disablement is detected (direct probe `controls_disable_detected`). Directive wording ("the answer is", "clearly supports", "mark it as") and clinical wording are rejected.

## Limits

Neutrality is checked lexically. A control can still be read with a bias the wording does not show; that is a matter for reviewer training under a future authorized protocol.
