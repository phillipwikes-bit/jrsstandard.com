# Role Separation and Contamination Plan (draft)

**Gate V0, 2026-10-25. Draft; no roles are filled.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Roles

| Role | Does | Must not |
|---|---|---|
| Owner | Approves gates, admission and release decisions | Construct, adjudicate or see holdout content before the run |
| Builder (engineering, including Claude Code sessions) | Maintains the Engine, adapter and engineering corpus | Construct, see, adjudicate or analyse holdout material; tune on any evaluation result before the frozen run |
| Corpus constructor | Selects or writes holdout records under the admission gate | Build or tune the Engine; adjudicate the records they constructed |
| Adjudicators (at least two, independent of each other) | Label records against the codebook, blind | See Engine output before labels are locked; confer before independent labels are recorded |
| Custodian | Holds the holdout, the measures and the sealed labels; releases them only on the protocol schedule | Build, construct or adjudicate |
| Analyst | Runs the pre-specified analysis | Change measures after results are known |

No person or session may hold two roles from {Builder, Corpus constructor, Adjudicator} for the same evaluation. **The builders of this package, including Claude Code, are excluded from every evaluation role.**

## 2. Contamination sources and controls

| Source | Control |
|---|---|
| Builders seeing holdout content | Custodian holds it; access is logged; a builder exposed to it is recorded, and the exposed records are retired |
| Tuning to evaluation results | Configuration frozen and hashed before selection; any later change voids the run |
| Reuse of engineering material | The V0 corpus, Phase 6 to 9 scenarios and Stage A records are ineligible as holdout |
| Adjudicators seeing Engine output | Labels locked and hashed before any Engine output is released |
| Model-assisted construction | Recorded as provenance; AI-assisted holdout records need owner approval and disclosure in any report |
| Prompt or record leakage into model context | Only the frozen prompt and the admitted record are sent; no other material |

## 3. Recording

Each contamination event is recorded with date, role, material affected and disposition. A contaminated record is retired, never relabelled.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
