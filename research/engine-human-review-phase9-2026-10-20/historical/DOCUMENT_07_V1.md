# Dual review and adjudication protocol

**LOCAL ENGINEERING MATERIAL ONLY.** Independent evaluation not authorized or conducted. No release, deployment, or commercial readiness determination. Release status remains NO_GO_NOT_VERIFIED. Blocker B-018 remains OPEN.

Package: `phase9-human-evidence-adjudication` (admitted `local_construction_only`, 2026-10-20). Material: synthetic only, derived from the fictional GC-001 record; holdout-ineligible.

**Execution disabled** (`EXECUTION_ENABLED = false`; `runDualReview` refuses). No reviewer has been recruited, no review run, no label or outcome collected.

## Roles

| Role | Duties | Prohibited |
|---|---|---|
| `corpus_custodian` | Holds the sealed packets and expectations; issues blinded packets; never reviews. | Revealing expectations, categories or another reviewer's entry to a reviewer. |
| `coordinator` | Schedules reviews, checks that entries are complete, routes pairs to adjudication by the fixed rule. | Commenting on the content of any entry or suggesting an outcome. |
| `reviewer` | Reviews one blinded packet at a time and records an outcome, rationale and cited words. | Seeing the other reviewer's entry, the expectation, the category or the Engine-human agreement history. |
| `adjudicator` | Reviews a packet only on disagreement or escalation and records an adjudicated outcome with reasons. | Deciding legal liability, discrimination, policy compliance or whether an employment decision was correct. |
| `analyst` | Calculates the planned measures after the ledger is closed, under a separate authorization. | Calculating measures before the ledger is closed, or altering any entry. |

## Procedure

- Reviewers per packet: 2, blinded. Each reviewer sees the dossier only: no category, no expectation, no other entry, no packet order shared with the other reviewer. Packets are presented in an order drawn independently for each reviewer.
- Adjudication: A third adjudicator reviews the packet only when the two outcomes differ or either outcome is escalating. The routing rule (`needsAdjudication`) compares outcome labels only and refuses an entry that is not a complete human entry.
- Training: Limited to this protocol, the decision model, the Cognitive Controls and the synthetic calibration packets. No real records, no expected answers for packets under review.
- Abstention: abstain_and_escalate is always available and is never treated as an error.
- Conflict: record_conflict is recorded with the conflicting passages; no reviewer decides which passage is true.
- Missing information: insufficient_context names the missing information; no reviewer fills it in.
- Identities: Placeholders only (REVIEWER-PLACEHOLDER-n). No real identity, label or outcome is held in this package.

## Contamination controls

- Calibration packets and review packets are disjoint.
- Reviewers do not discuss packets before both entries are locked.
- Expectations stay sealed with the custodian until the ledger is closed.
- A reviewer who sees an expectation or another entry is withdrawn from that packet and the exposure is logged.

## Versioning and re-review

- Each entry records the dossier format, dossier hash, decision model and controls version it was made under.
- An entry made under a superseded version is kept and marked superseded, never rewritten.

Re-review triggers:

- The dossier hash changes.
- The decision model or Cognitive Controls change.
- The Engine version or a rule pack hash changes.
- A contamination event is logged for the packet.

## Future decision ledger

Fields: `ledger_row_id`, `packet_id`, `dossier_sha256`, `dossier_format`, `decision_model_version`, `controls_version`, `engine_compiler_version`, `engine_graph_sha256`, `reviewer_placeholder`, `role`, `source`, `outcome`, `rationale`, `cited_evidence`, `escalated`, `locked_at`, `supersedes`, `contamination_events`. The ledger is defined, not populated.
