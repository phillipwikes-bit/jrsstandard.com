# Reliability Knowledge Base Specification

Local ID: ARC-DOC-02 (NON-CANONICAL). Code: `lib/engine-change-control/knowledge-base.mjs`. Data: `knowledge-base/KNOWLEDGE_BASE.jsonl`; source `knowledge-base/kb-entries.mjs`.

## Local engineering claim
An append-only, hash-chained local log. Each entry records an observation and the expected safe behaviour; every entry requires a human decision.

## Local evidence
- 60 entries, RKB-001 to RKB-060 (RKB-051 to RKB-060 record the read-only audit findings and their local repairs). Chain and entry validation: 0 problems.
- Statuses: regression_protected 31, implemented_locally 17, proposed_control 7, observed 2, under_analysis 1, rejected 1, blocked 1.
- Classes: quote_verification 10, test_contamination 10, scope_refusal 8, graph_integrity 7, contradiction_handling 6, prohibited_claim_detection 6, chronology_conflict 5, cognitive_controls_neutrality 4, version_mismatch 4.
- Probes `kb.*` (13); mutations MA-01 to MA-07.

## Rules
Fixed vocabularies for `source_type`, `status`, `failure_class`, `evidence_level`. No field may contain a status word from the forbidden list (strict here, with no negation allowance). Undeclared fields and duplicate IDs are rejected. Editing a line breaks the hash chain; reordering breaks the `prev_hash` link. An entry is never rewritten; a later entry may name an earlier one in `supersedes` (RKB-049 supersedes RKB-034).

## Interpretation
Local knowledge is durable and tamper-evident within the repository.

## Limitation
The chain shows that the file changed, not who changed it; regenerating the whole chain is not detectable locally.

## External evidence still required
An external timestamp or signature if the log is relied on outside the repository; owner review of entries marked observed, proposed_control or blocked.
