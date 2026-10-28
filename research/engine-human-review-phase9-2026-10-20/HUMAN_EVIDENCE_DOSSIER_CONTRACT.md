# Human evidence dossier contract

**LOCAL ENGINEERING MATERIAL ONLY.** Independent evaluation not authorized or conducted. No release, deployment, or commercial readiness determination. Release status remains NO_GO_NOT_VERIFIED. Blocker B-018 remains OPEN.

Package: `phase9-human-evidence-adjudication` (admitted `local_construction_only`, 2026-10-20). Material: synthetic only, derived from the fictional GC-001 record; holdout-ineligible.

## Purpose

A quotation can be present in the record, reproduced exactly, and linked to the right section without supporting the finding. The Engine checks the first three properties. Whether the quoted words support the finding is a semantic judgment that only a human reviewer makes. The dossier gives that reviewer a bounded packet for one condition and leaves the judgment open.

Format: `jrs-phase9-human-evidence-dossier/1.0.0`. Source: `lib/engine-human-review-phase9/dossier.mjs`.

## Contents of one dossier

| Field | Content |
|---|---|
| `record` | Synthetic record identifier, record hash, material marker `synthetic_engineering_fixture` |
| `engine` | Compiler version, graph hash, rule-pack identifiers, versions and content hashes |
| `condition` | Condition identifier and name |
| `engine_result` | Engine status, reasons, whether routed to review, and the statement that the result is a routing aid |
| `quotations` | Each quotation with verification state, assertion acceptance, section and character offsets |
| `conflict_indicators` | Engine conflict kinds and summaries that affect the condition |
| `refusal` | Refusal codes, when the record was refused |
| `engine_limitation` | The Engine limitation text for the condition, copied unchanged |
| `review_route` | The Engine human-review route |
| `presence_statement` | "Textual presence is not semantic support. The quotation below occurs in the record at the stated offsets; whether it supports the finding is for the human reviewer to determine." |
| `reviewer_question` | One bounded question per condition (below) |
| `admissible_outcomes` | The seven outcomes of the decision model |
| `reviewer_response` | Every field null; `completed_by: "human reviewer only"` |
| `escalation` | Triggers derived from the Engine output, and `abstention_available: true` |
| `cognitive_controls` | The eight control identifiers |
| `dossier_sha256` | Canonical hash of everything above |

## Bounded reviewer questions

- **Reconstructability** (`reconstructability`): Does the quoted text, read in its section, show what was decided and on what stated basis, or does it leave the decision unreconstructable from the record?
- **Identifiable basis** (`identifiable_basis`): Does the quoted text identify the authority or source the record relies on, or does it only mention one without showing that it was the basis?
- **Chronology integrity** (`chronology_integrity`): Do the quoted dates, read with their roles (event, document, decision), give a consistent sequence, or is the sequence uncertain or conflicting?
- **Reasoning traceability** (`reasoning_traceability`): Can the stated reasoning be followed from the quoted text to the decision, or is a step missing, negated or only implied?
- **Sufficiency** (`sufficiency`): Is the quoted material enough for a reviewer to reconstruct the decision without information outside the record, or is material information missing?

## Escalation triggers

Derived from the Engine output only, never from an expected answer.

- `ET1`: No verified quotation is cited for this condition.
- `ET2`: A conflict indicator applies to this condition.
- `ET3`: The condition was not assessed or the record was refused.

## Rules the contract enforces (`validateDossier`)

- Every finding carries a known condition, its limitation, the presence statement and its unaltered question.
- The reviewer response is empty. A pre-filled outcome, rationale, citation, confidence or identity is rejected.
- A verified quotation carries a section and offsets. An assertion cannot be marked accepted on an unverified quotation.
- The escalation block equals the triggers recomputed from the Engine output; abstention is always available.
- Text authored by this package may not say that a quotation proves, establishes or confirms the finding. Copied Engine text is excluded from that scan, because the Engine limitation itself says what the text does not prove.
- No field may convert the Engine result into an approval, recommendation or legal conclusion.
- The dossier may not be more favourable than the Engine result it copies (`dossierNotMoreFavourable`).
- Dossiers are built only from material marked synthetic; any other input is refused.

## Limits

The dossier is deterministic for a given graph. It does not interpret the record, resolve conflicts, or weigh evidence. It does not show expected classes or categories; blinding is applied when a packet is built (see the rehearsal protocol).
