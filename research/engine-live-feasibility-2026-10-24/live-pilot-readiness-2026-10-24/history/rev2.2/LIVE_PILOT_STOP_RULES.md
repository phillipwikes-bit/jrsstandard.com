# Live Pilot Stop-Rule Register

**NON-OPERATIVE. Prepared 2026-10-24. Applies only if a pilot is later authorized.**
B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

**Revision 2 (2026-10-24, on owner direction).** Two-part provenance labeling outside the
frozen graph; mandatory graph and execution-record pairing; narrowed pilot question;
counts and observed failure modes only. Revision 1 is preserved unchanged in
`history/rev1/`. Still non-operative; nothing is authorized.

On any stop: execution halts immediately; no further request is sent; the minimal
evidence needed to explain the event is preserved (execution record, raw response if
any, adapter log, authorization hash); the owner is informed; **restart is never
automatic** and needs a new written owner decision stating what changed.

| ID | Trigger | Detection | Evidence preserved |
|---|---|---|---|
| SR-LP-01 | A record is not demonstrably synthetic | Owner confirmation absent, or the "SYNTHETIC" mark or origin label missing | Record hash; set register |
| SR-LP-02 | Personal, confidential, source-controlled or holdout material included | Owner check at P1; any later discovery | Record hash; description of the material (not the material) |
| SR-LP-03 | Provider, model, endpoint, credential source or budget differs from the authorization | Adapter pre-request comparison | Authorization hash; observed configuration (no credential) |
| SR-LP-04 | A provider request occurs before authorization | Adapter log; provider usage record | Log entries; timestamps |
| SR-LP-05 | An unexpected network destination is contacted or attempted | Network guard | Guard log |
| SR-LP-06 | A response contains material outside the approved test boundaries (for example, content about real people, legal conclusions, or anything other than the contract) | Adapter validation; owner review at P6 | Response hash; classification |
| SR-LP-07 | The adapter accepts a response that violates the declared contract | Part A acceptance tests; any live discrepancy | Response; adapter version and hash |
| SR-LP-08 | Custody, logging or output retention cannot be demonstrated | Missing execution-record field; storage outside the approved location | What is present; what is missing |
| SR-LP-09 | Cost ceiling or request limit exceeded, or would be exceeded by the next request | Adapter counter | Counter state; usage record |
| SR-LP-10 | Any result is described as validation, release evidence, production evidence, or evidence transferable to the source-era Engine or the v1 lineage; or the model or Engine is characterized as reliable, validated, performing, or in similar evaluative terms | Owner review of every draft | The statement |
| SR-LP-11 | Prompt or candidate package hash differs from the frozen tuple | Adapter pre-request check | Observed hashes |
| SR-LP-12 | Authorization expired, Gate 1 not cleared, or a Gate 3 prerequisite unrecorded | Adapter and P0 checks | Status record |
| SR-LP-13 | A provider-routing or base-URL override is present in the environment | Adapter pre-request check | Variable names only (no values) |
| SR-LP-14 | A credential value appears in any log, file, record or conversation | Scan before archiving | Location of the exposure; the credential is treated as compromised and rotated by the owner |
| SR-LP-15 | A graph is unpaired, a graph and execution record have any mismatched binding field or digest, or either was altered after capture | Pair check before review (adapter contract section 8A) | The pair as found; the mismatch description |

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
