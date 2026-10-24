# Remediation Backlog

**LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.**

Source of record: `backlog/REMEDIATION_BACKLOG.jsonl`, append-only and hash-chained (each entry carries the previous entry hash). This page is a reading copy. P6-RT-07 and each of P6K-001 to P6K-008 has its own non-rejected entry.

| Entry | Defect | Decision | Reason | Regression tests | Independent evaluation before stronger claim | Owner decision |
|---|---|---|---|---|---|---|
| P7B-001 | P6-RT-07 (P6K-009) | `included` | RP-STR-01 renames one label; the root cause (a forbidden word in the compiler's own reason text) is removed for this pattern. A general catch was rejected separately (P7B-012). | P6-RT-07, P7-R07-01 to P7-R07-06; tests/engine-remediation-phase7/run.mjs (scenarios, qualification, mutation) | no | Whether to test the discrimination label (outside Phase 7 scope by instruction). |
| P7B-002 | P6K-001 presence without semantic support | `included` | RP-EVL-01 abstains (review_required) when no cited quotation sits in a linked section. It never raises a status. Semantic matching was rejected (P7B-013). | P6-SP-02, P6-SP-04, P6-SP-06, P7-EVL-01 to 08, Phase 4 ST-06 | yes | Whether the ST-06 degradation (rationale moved into the residual-risk section) is acceptable over-review. |
| P7B-003 | P6K-002 negated rationale | `included` | RP-NEG-01 stops a negated rationale counting unless a separate non-negated rationale or source is cited. | P6-SP-07, P7-NEG-01 to 08 | yes | Whether "Not because of cost, ..." style sentences should stay routed to review. |
| P7B-004 | P6K-003 assessment after decision | `included` | RP-CHR-01, limited to "risk assessment" events outside action sections. | P6-CH-06, GC-004, AR-010, LB-02, P7-CHR-01 to 04 | no | None for retention; widening needs a decision. |
| P7B-005 | P6K-004 two expiry dates | `included` | RP-CHR-02. | P6-CH-07, AR-011, P7-CHR-05 to 08 | no | How records that legitimately state an original and an extended expiry should be treated. |
| P7B-006 | P6K-005 missing decision date | `included` | RP-CHR-03. | P6-CH-09, P6-ST-12, P7-CHR-09 to 12 | no | None for retention. |
| P7B-007 | P6K-006 duration inconsistent with dates | `included` | RP-CHR-04. | P6-CH-10, AR-009, P6-CH-02, P6-ST-14, P7-CHR-13 to 16 | no | Whether other duration units should be read. |
| P7B-008 | P6K-007 paraphrased control conflict | `included` | RP-CON-01, only when no other control conflict is found. | P6-SU-07, AR-025, P7-CON-01 to 06 | no | Which further control families, if any, to add. |
| P7B-009 | P6K-008 reworded employment language | `included` | RP-SCO-01 refuses "keep/lose their job" phrasing (P6-XD-03, P6-ST-17, Phase 4 ST-14). | P6-XD-03, P6-ST-17, ST-14, P7-SCO-01 to 06 | yes | Which further employment rewordings to cover. |
| P7B-010 | Phase 4 AR-040 (contract non-renewal for a person, P6K-008 family) | `DEFERRED_PENDING_OWNER_DECISION` | The wording cannot be separated lexically from supplier-contract non-renewal, which is in scope. A rule would refuse or degrade benign supplier records. | AR-040 plus new benign supplier-contract scenarios | yes | Scope boundary for person-directed contract language. |
| P7B-011 | Invalid calendar dates (for example 2026-02-30) | `deferred` | Not in the Phase 7 remediation set. Today such dates are ignored by the date reader; a cited quotation containing one can still carry a stated-date assertion. | probe d.invalid_dates_ignored | no | Whether to add this to a later remediation set. |
| P7B-012 | P6-RT-07 general form: any graph self-validation failure | `rejected` | A general catch would hide unrelated defects behind a refusal. The narrow repair keeps self-validation failures visible as errors. | n/a | no | None unless the trade-off is revisited. |
| P7B-013 | P6K-001 general form: semantic support | `rejected` | Would need a live model or an unbounded semantic system, which Phase 7 prohibits; abstention (P7B-002) is used instead. | n/a | yes | Whether semantic support is ever in scope. |
| P7B-014 | Phase 4 AR-035 (candidate note "acted lawfully") | `deferred` | Not in the Phase 7 remediation set named by the assignment; the v0.2 claim guard is shared with earlier packages. | AR-035 | no | Whether to include it in a later set. |
