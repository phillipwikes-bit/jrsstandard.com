# Reviewer decision model

**LOCAL ENGINEERING MATERIAL ONLY.** Independent evaluation not authorized or conducted. No release, deployment, or commercial readiness determination. Release status remains NO_GO_NOT_VERIFIED. Blocker B-018 remains OPEN.

Package: `phase9-human-evidence-adjudication` (admitted `local_construction_only`, 2026-10-20). Material: synthetic only, derived from the fictional GC-001 record; holdout-ineligible.

Seven outcomes. No function in the package selects, infers or fills one in; `deriveOutcome` always refuses.

## Five layers kept separate

| Layer | Determined by | Meaning |
|---|---|---|
| `quote_presence` | Engine (exact text match) | The quoted characters occur in the record. |
| `quote_accuracy` | Engine (offsets and uniqueness) | The quotation is reproduced exactly and located unambiguously. |
| `section_linkage` | Engine (section role) | The quotation sits in a section whose role relates to the condition. |
| `semantic_support` | Human reviewer only | What the quoted words actually say bears on and supports the finding. |
| `decision_validity` | Out of scope for this package | Whether the underlying decision was right. Not assessed by the Engine or by this review. |

## Outcomes

### `supports_finding`

- Meaning: The quoted words, read in their section and in the record, bear on the condition and support the finding.
- Minimum basis: At least one verified quotation whose actual words, not an inferred meaning, carry the support, with the reviewer naming those words.
- Prohibited reasoning: Support inferred from the presence of a quotation, from the Engine status, from the outcome of the decision, or from what the author probably meant.
- Escalation rule: None, unless a conflict indicator or missing information remains unresolved; then escalate instead.
- Relationship to the Engine: Independent of the Engine status. Agreement with a supported Engine status is recorded, never assumed.

### `does_not_support_finding`

- Meaning: The quoted words are present but do not bear on the condition, or bear on it without supporting the finding.
- Minimum basis: The reviewer states what the quoted words actually say and why that does not support the finding.
- Prohibited reasoning: Rejecting support because the decision seems wrong, because of the outcome, or because of a guessed motive.
- Escalation rule: Escalate if other record text might carry the support but is not cited.
- Relationship to the Engine: Where the Engine status is supported, the difference goes to the disagreement protocol; the Engine output is not changed.

### `insufficient_context`

- Meaning: The record does not contain enough to decide whether the quotation supports the finding.
- Minimum basis: The reviewer names the specific missing information.
- Prohibited reasoning: Filling the gap with assumptions or with knowledge outside the record.
- Escalation rule: Always escalates.
- Relationship to the Engine: Consistent with any Engine route to review; recorded as a disagreement if the Engine status is supported.

### `ambiguous`

- Meaning: The quoted words admit more than one reasonable reading and the record does not settle which applies.
- Minimum basis: The reviewer states at least two readings and why the record does not decide between them.
- Prohibited reasoning: Choosing the reading that fits the outcome.
- Escalation rule: Always escalates.
- Relationship to the Engine: Recorded as a disagreement if the Engine status is supported.

### `record_conflict`

- Meaning: Parts of the record contradict each other on a point the condition depends on.
- Minimum basis: The reviewer cites the conflicting passages.
- Prohibited reasoning: Deciding which passage is true.
- Escalation rule: Always escalates.
- Relationship to the Engine: Consistent with an Engine conflict indicator; a conflict the Engine did not flag is recorded as a reviewer-identified risk.

### `outside_authorized_scope`

- Meaning: The material falls outside the authorized review scope (for example employment matters or a legal question).
- Minimum basis: The reviewer names the scope boundary that applies.
- Prohibited reasoning: Reviewing the material anyway, or deciding the excluded question.
- Escalation rule: Always escalates; the item is not reviewed further.
- Relationship to the Engine: Consistent with an Engine refusal; if the Engine did not refuse, recorded as a reviewer-identified risk.

### `abstain_and_escalate`

- Meaning: The reviewer cannot responsibly reach any of the other outcomes.
- Minimum basis: The reviewer states why no other outcome can be reached.
- Prohibited reasoning: Abstaining to avoid recording a disagreement with the Engine.
- Escalation rule: Always escalates to the adjudicator.
- Relationship to the Engine: No inference about the Engine result.

## Questions reviewers are never asked

- legal liability
- discrimination
- policy compliance
- whether an employment decision was correct

## Future reviewer entry

A future entry must come from a human (`source: "human"`), use an admissible outcome, give a rationale, use a placeholder identity (`REVIEWER-PLACEHOLDER-n`), cite words for `supports_finding`, and be escalated for every escalating outcome. Entries whose source is the Engine, a model, the system or an automatic fill are rejected.
