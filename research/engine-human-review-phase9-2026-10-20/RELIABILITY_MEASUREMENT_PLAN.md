# Reliability measurement plan

**LOCAL ENGINEERING MATERIAL ONLY.** Independent evaluation not authorized or conducted. No release, deployment, or commercial readiness determination. Release status remains NO_GO_NOT_VERIFIED. Blocker B-018 remains OPEN.

Package: `phase9-human-evidence-adjudication` (admitted `local_construction_only`, 2026-10-20). Material: synthetic only, derived from the fictional GC-001 record; holdout-ineligible.

Every measure is defined and none is calculated. `computeMeasure` refuses. Each measure is **not measurable locally**: it needs completed human entries from an authorized review, and Phase 9 has synthetic packets and no reviewer entries. No threshold is set.

| Id | Measure | Definition | Requires | Status |
|---|---|---|---|---|
| RM-01 | Quote-presence agreement | Agreement between reviewers on whether the cited quotation occurs in the record as stated (expected near-complete, since presence is machine-checked). | two locked reviewer entries per packet | not measurable locally |
| RM-02 | Semantic-support agreement | Chance-corrected agreement between the two reviewers on the seven-outcome label, reported per condition. | two locked reviewer entries per packet | not measurable locally |
| RM-03 | Escalation agreement | Agreement between reviewers on whether a packet is escalated. | two locked reviewer entries per packet | not measurable locally |
| RM-04 | Post-adjudication agreement | Agreement between each reviewer and the adjudicated outcome on adjudicated packets. | adjudicated outcomes | not measurable locally |
| RM-05 | Disagreement by condition | Distribution of reviewer disagreement across the five conditions. | two locked reviewer entries per packet | not measurable locally |
| RM-06 | Abstention rate | Share of entries recording abstain_and_escalate, per reviewer and per condition. | locked reviewer entries | not measurable locally |
| RM-07 | Calibration drift | Change in agreement with the sealed calibration expectations across review sessions. | repeated calibration sessions | not measurable locally |
| RM-08 | False-confidence risk | Share of packets where a reviewer records supports_finding and the adjudicated outcome is non-supporting or escalating. | adjudicated outcomes | not measurable locally |
