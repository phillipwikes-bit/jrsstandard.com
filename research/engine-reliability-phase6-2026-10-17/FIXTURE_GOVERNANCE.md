# Fixture Governance and Knowledge Register

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

## Rules

- Earlier fixtures, expectations and execution records are read only. Phase 6 changed none of them.
- New scenarios are admitted only with the synthetic marker, category, kind, expected safe behaviour, limitation and the fixed provenance note.
- Expectations, inputs and evaluator code are sealed by hash before the first run. A seal is never reissued silently.
- No real record, holdout, label, adjudication, customer data, personal data or contributor information may enter the library or the register. Admission and register checks refuse personal-data-like text, external links and forbidden fields.

## Knowledge register

`knowledge-register/KNOWLEDGE_REGISTER.jsonl` has one JSON object per line. Each line carries:
- the previous entry's hash and its own hash;
- its identifier and date;
- its origin, Engine layer and risk category;
- the scenarios it concerns, the expected behaviour and its limitation;
- its state (open, reproduced, mitigated or deferred);
- the regression suite it requires, and whether a future independent evaluation is needed.

Any edit, deletion, insertion or reordering breaks the chain. The build appends only new identifiers and refuses any result that does not begin with every byte of the earlier register.

| Entry | State | Subject |
|---|---|---|
| P6K-001 | reproduced | Presence without semantic support (SP-02, SP-04, SP-06) |
| P6K-002 | reproduced | Negated rationale (SP-07) |
| P6K-003 | reproduced | Assessment after decision (CH-06; Phase 4 RKB-041) |
| P6K-004 | reproduced | Two expiry dates (CH-07; RKB-042) |
| P6K-005 | reproduced | No decision date (CH-09, ST-12) |
| P6K-006 | reproduced | Grant duration against dates (CH-10) |
| P6K-007 | reproduced | Paraphrased control conflict (SU-07; RKB-044) |
| P6K-008 | reproduced | Reworded employment language (XD-03, ST-17; RKB-046) |
| P6K-009 | open | P6-RT-07: compiler self-validation failure on a motive note |
| P6K-010 | mitigated | Router trusted stored hashes (framework defect, found while building) |
| P6K-011 | deferred | Router fails closed on superseding intake refusal |
| P6K-012 | deferred | v0.2 long-record gate absent from baseline |
| P6K-013 | mitigated | Register append did not check dangling supersedes (found by probe) |
| P6K-014 | mitigated | Post-stop, owner-authorized duplicated-limitation probe (MU-51) |
