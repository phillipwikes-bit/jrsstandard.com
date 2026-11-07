# Assertion Boundary

Local ID: EGC-DOC-03 (NON-CANONICAL). Code: `lib/engine-evidence-graph/assertions.mjs`; types in `contract.mjs`.

## Claim
A verified quotation can only be associated with one of ten bounded assertion types, and only with a condition that the type is permitted to stand for. Every assertion requires human interpretation.

## Local engineering evidence
Probes `k.*`; fixtures GC-014 (wrong condition) and GC-035 (prohibited inference); mutations covering the permission map and inference guards.

## Types
stated_authority, stated_decision, stated_date, stated_rationale, stated_risk, stated_control, stated_expiry, stated_renewal_condition, stated_source_reference, stated_unresolved_issue. Each means only that the record states something of that kind.

## Rejections
- The quotation lacks a marker for the claimed type.
- The type is not permitted for the condition (`CONDITION_ASSERTIONS`).
- The candidate note contains a prohibited claim (legal, compliance, rightness, credibility, intent, emotion, fairness, recommendation), discrimination or motive inference, or causal language absent from the quotation.

## Interpretation
The compiler narrows what a quotation can be said to show to "the record states an X".

## Limitation
Marker checks are lexical. A record can state a rationale that is false; the assertion would still be produced.

## External evidence still required
Independent labelling of assertion-type correctness.
