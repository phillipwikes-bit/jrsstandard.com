# Evaluator Blinding Plan (draft)

**Gate V0, 2026-10-25. Draft; not in use.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

| Blinded from | Who | Until |
|---|---|---|
| Engine findings, graphs, refusals and cognitive controls | Adjudicators | Their independent labels are locked and hashed by the custodian |
| Each other's labels | Adjudicators | Both label sets are locked |
| The corpus constructor's intended feature for each record (for example, "chronology conflict") | Adjudicators | Labels locked |
| Holdout content | Builders and owner | The frozen run is complete and the results are recorded |
| Which records are adversarial or benign | Adjudicators | Labels locked |

**Mechanics.** Records carry opaque identifiers assigned by the custodian, and record order is randomized per adjudicator. Engine version labels are removed from any material adjudicators see. Disagreements are resolved under the approved review protocol, after both independent label sets are recorded, and both the original and the resolved labels are kept.

**Breach.** A blinding breach is recorded. The affected labels are excluded and the exclusion is reported, never silently dropped.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
