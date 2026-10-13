# Contradiction Handling Protocol

Local ID: EGC-DOC-04 (NON-CANONICAL). Code: `lib/engine-evidence-graph/contradictions.mjs`.

## Claim
Six conflict kinds are detected locally. Each produces a conflict node linking the conflicting items, carries the fixed statement "The Engine identified a record conflict, not the true state of events. It does not say which statement is correct.", is routed to review, and lowers every affected condition to review_required.

## Local engineering evidence
Fixtures GC-004, GC-005, GC-017, GC-031, GC-032, GC-034; validator rule GV-09; probes `c.*`.

| Kind | Code | Affects |
|---|---|---|
| K1 | decision_date_conflict | chronology_integrity, reconstructability |
| K2 | impossible_sequence | chronology_integrity |
| K3 | authority_state_conflict | identifiable_basis, reasoning_traceability |
| K4 | control_state_conflict | sufficiency |
| K5 | risk_state_conflict | sufficiency, reasoning_traceability |
| K6 | cited_evidence_conflict | the condition the conflicting quotations were cited for |

## Rules
No voting, weighting, recency preference or source ranking. The compiler never picks a side.

## Interpretation
A conflict is a reason for a person to look, not a finding about events.

## Limitation
Detection is pattern-based on explicit dates and state words. Implicit or paraphrased conflicts are missed.

## External evidence still required
Independent measurement of missed and spurious conflicts on authorised records.
