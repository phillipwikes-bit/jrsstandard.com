# Blinded synthetic rehearsal protocol

**LOCAL ENGINEERING MATERIAL ONLY.** Independent evaluation not authorized or conducted. No release, deployment, or commercial readiness determination. Release status remains NO_GO_NOT_VERIFIED. Blocker B-018 remains OPEN.

Package: `phase9-human-evidence-adjudication` (admitted `local_construction_only`, 2026-10-20). Material: synthetic only, derived from the fictional GC-001 record; holdout-ineligible.

## Set

50 packets in `rehearsal/cases/`, each one edit of the fictional GC-001 record with a crafted candidate response, marked `synthetic: true` and `holdout_eligible: false`.

| Category | Minimum | Authored |
|---|---|---|
| `quote_present_not_supportive` | 10 | 10 |
| `supportive_but_incomplete` | 6 | 6 |
| `negation_or_conditional_language` | 6 | 6 |
| `chronology_ambiguity` | 6 | 6 |
| `conflicting_evidence` | 5 | 6 |
| `reasoning_gaps` | 5 | 6 |
| `sufficiency_and_escalation` | 5 | 5 |
| `cognitive_control_pressure` | 5 | 5 |

Expected adjudication classes:

| Class | Packets |
|---|---|
| `does_not_support_finding` | 17 |
| `supports_finding` | 9 |
| `insufficient_context` | 9 |
| `ambiguous` | 4 |
| `record_conflict` | 8 |
| `abstain_and_escalate` | 2 |
| `outside_authorized_scope` | 1 |

## Expectations and seal

Each packet has an expected adjudication class, an explanation, a relevant Cognitive Control, a predicted Engine status, expected escalation triggers and an expected appropriateness of the Engine route (`appropriate`, `conservative_over_review`, `favourable_status_reliant_on_human_review`, `inappropriate_not_routed`). The route appropriateness follows a fixed rule from the expected class and the Engine status.

The class, explanation and control were written from the record text. The predicted Engine status and escalation were written from reading the v0.3.1 candidate source. No Engine run of any Phase 9 case preceded the seal. The authoring and sealing scripts import no compiler.

Seal: `sha256:be2cda74ff82d58844c6ebe4e335ea2be8c4d55e076b635e36d19a3e09e9fcc8`, sealed 2026-10-20T12:42:38.354Z. The first evaluator run followed at 2026-10-20T12:42:39.711Z. `verifySeal` rejects any change to a case, an expectation, the case set or the seal record.

## Blinding

A reviewer packet carries an opaque identifier (`PKT-` plus a hash), the statements, the material marker and the dossier. It carries no category, expectation, explanation or the unblinded identifier. `checkBlinding` rejects a packet that exposes any of these.

## Evaluator

The evaluator never produces a human outcome. Per packet it checks: valid dossier, blinding, empty outcome, not more favourable than the Engine, Engine status as predicted, escalation as sealed, route appropriateness as sealed, and the relevant control listed.

## First run

49 of 50 packets as sealed. 1 difference, disclosed in `rehearsal/DISCLOSED_DIFFERENCES.json` and in the execution record. Route appropriateness observed:

| Route appropriateness | Packets |
|---|---|
| `appropriate` | 28 |
| `favourable_status_reliant_on_human_review` | 20 |
| `conservative_over_review` | 2 |

The 20 packets marked `favourable_status_reliant_on_human_review` are the point of this layer: the Engine status is `supported` because a quotation is present, verified and linked, while the words do not support the finding. Every one of them is still routed to human review.

## Limits

The packets and expectations were written by the team that built the layer. They are a rehearsal aid, not labels, not a benchmark and not evidence of reviewer or Engine performance.
