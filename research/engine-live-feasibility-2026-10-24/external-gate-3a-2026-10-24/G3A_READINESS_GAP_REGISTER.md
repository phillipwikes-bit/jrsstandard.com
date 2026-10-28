# G3A Readiness Gap Register

**NON-OPERATIVE. Prepared 2026-10-24. Records gaps only; closes none.** Independent
evaluation is not authorized and has not occurred. B-018 remains OPEN. Release status
remains NO_GO_NOT_VERIFIED.

**Status values.** PRESENT: the evidence exists and was verified or located. PARTIAL: some
of the evidence exists. ABSENT: no evidence exists. DECISION REQUIRED: the gap closes only
by a recorded decision of the named authority.

**Blocks.** B, C or B and C: the gap must close before that option may begin. "None"
means it does not block either option. Option A has no blocking gaps.

**Stop rules.** SR-01 to SR-10 are defined in
`external-gate-3-2026-10-23/EVALUATION_STOP_AND_RESTART_RULES.md`.

## 1. Engineering integrity evidence

| ID | Requirement | Current evidence | Status | Authority | What would close the gap | Blocks | Stop rules |
|---|---|---|---|---|---|---|---|
| ENG-01 | Candidate identifiable by hash | Manifest SHA-256 `815c5d56...25c3` equals the registry value; 147 of 147 files match (2026-10-24) | PRESENT | None needed | None | None | SR-02 |
| ENG-02 | Rule packs identifiable | Six rule-pack hashes match the handoff freeze (2026-10-24) | PRESENT | None needed | None | None | SR-02 |
| ENG-03 | Governance and human-review packages intact | Phase 8 manifest 83 of 83; Phase 9 manifest 99 of 99 (2026-10-24) | PRESENT | None needed | None | None | SR-02 |
| ENG-04 | Whole-worktree composition | Exit 0, declared conditions only; fingerprints unchanged (2026-10-24) | PRESENT | None needed | Must be re-run at freeze | None | SR-02 |
| ENG-05 | Known limitations disclosed | Fourteen active items P7B-001 to P7B-014; P6-RT-07 routes the Phase 6 replay to human review | PRESENT (as disclosure) | Owner | Owner states at G2 whether the candidate is frozen with these limitations | B and C | SR-08 |
| ENG-06 | Execution environment record | The Phase 8 protocol defines the rule (package hash, environment, clock recorded at freeze and execution); no record for an actual run | ABSENT | Owner | Environment record sealed at G2 | B and C | SR-07 |

## 2. Preservation evidence

| ID | Requirement | Current evidence | Status | Authority | What would close the gap | Blocks | Stop rules |
|---|---|---|---|---|---|---|---|
| PRV-01 | Local archive exists and recovers | Gate 4B archive `3a1e2f26...b62e`, 502 files; Gate 4C drill PASSED | PRESENT | None needed | None | None | SR-02 |
| PRV-02 | Owner durable copy verified (Gate 1) | Not returned; INPUT NOT AVAILABLE | ABSENT | Owner | Owner uploads the copy or supplies its hash; the hash matches | B and C if PRV-03 decides evaluator access is external use | SR-02 |
| PRV-03 | Whether evaluator access is "external use" for Gate 1 | No record decides this | DECISION REQUIRED | Owner | Recorded owner decision | B and C until decided | SR-09 |
| PRV-04 | B-018 governance record preserved | Preservation package matches its manifest (5 files) | PRESENT | None needed | None | None | SR-01 |

## 3. Governance evidence

| ID | Requirement | Current evidence | Status | Authority | What would close the gap | Blocks | Stop rules |
|---|---|---|---|---|---|---|---|
| GOV-01 | G1 B-018 dependency statement | Gate 2 readiness register; B-018 OPEN | DECISION REQUIRED | Owner | Written statement: whether any B-018 item must resolve first, and which representations stay prohibited | B and C | SR-01 |
| GOV-02 | Designated human-review protocol | Two protocols exist (2026-09-20 adjudication protocol; Phase 9 dual-review protocol, execution-disabled); B018-OD-02 and P9-OD-01 open | DECISION REQUIRED | Owner | Designation record (B018-OD-02) and P9-OD-01 disposition | B and C | SR-08 |
| GOV-03 | Candidate version freeze (G2) | Handoff freeze exists with execution disabled; no evaluation freeze sealed | PARTIAL | Owner | Sealed G2 freeze of package, rule packs, environment, clock rule, measures and adjudication rule | B and C | SR-02 |
| GOV-04 | Version lineage wording (B018-OD-03) | Registries describe local packages only | DECISION REQUIRED | Owner | OD-03 disposition, or a G1 statement limiting how the candidate is described | C (B only if results are described beyond process findings) | SR-10 |
| GOV-05 | Measurement plan (G8) | Measures defined (EM-01 to EM-09 in the Gate 3 package; eight measures in the Phase 8 protocol); no statistic named at freeze; no threshold set (P9-OD-03 open) | PARTIAL | Owner | Approved measure set reconciled between the two lists; statistic per measure; thresholds or explicit "none set" | C | SR-08 |
| GOV-06 | Stop, incident and escalation rules | SR-01 to SR-10 drafted | PARTIAL | Owner | Owner approval of the rules | B and C | All |
| GOV-07 | Results review and claims control (G10) | Gate defined; no reviewer or plan | ABSENT | Owner and counsel, with results reviewer | Named results reviewer and written review plan | C | SR-10 |

## 4. Evaluator-independence evidence

| ID | Requirement | Current evidence | Status | Authority | What would close the gap | Blocks | Stop rules |
|---|---|---|---|---|---|---|---|
| IND-01 | Role definitions | Eight roles (Gate 3 plan) and six roles (Phase 8 freeze) defined | PRESENT | None needed | Reconcile the two role lists in the appointment record | None | SR-05 |
| IND-02 | Named people in roles (G5) | None | ABSENT | Owner | Appointment record naming each role holder | B and C | SR-05 |
| IND-03 | Independence declarations and conflict checks | None | ABSENT | Owner, coordinator records | Signed declarations; conflict check record | B and C | SR-05, SR-06 |
| IND-04 | Evaluation coordinator | None | ABSENT | Owner | Appointment | B and C | SR-05 |
| IND-05 | Engineering-author separation | Rule defined; the same process authored the candidate and all current synthetic material | PARTIAL | Owner | For B: record that rehearsal material is engineering-authored, or commission new material; for C: material from outside engineering | B and C | SR-06 |

## 5. Operational-control evidence

| ID | Requirement | Current evidence | Status | Authority | What would close the gap | Blocks | Stop rules |
|---|---|---|---|---|---|---|---|
| OPS-01 | Material classes (G3) | Four classes defined in the Phase 8 freeze; real records prohibited by default | PARTIAL | Owner and counsel | Written approval of permitted classes for the chosen option | B (synthetic class only, owner) and C (owner and counsel) | SR-03 |
| OPS-02 | Calibration material use | Phase 9 packets exist, engineering-authored, holdout-ineligible; P9-OD-04 open | DECISION REQUIRED | Owner | P9-OD-04 disposition | B and C | SR-06 |
| OPS-03 | Custody plan outside the repository | Separation rules drafted; no custodian, storage or access log | ABSENT | Owner and data custodian | Named custodian; storage location; access log | B and C | SR-09 |
| OPS-04 | Retention and deletion procedure | None | ABSENT | Owner and counsel | Written schedule and procedure | C (B if material leaves the workspace) | SR-04 |
| OPS-05 | Holdout custody (G6) | Rules drafted; no holdout exists | ABSENT | Owner and data custodian | Custody chain plan, after G3 to G5 | C | SR-09 |
| OPS-06 | Labeling form and adjudication rule (G7) | Adjudication specification drafted; no labeling form | PARTIAL | Owner, adjudicator acknowledgement | Written form and rule fixed before labeling | B and C | SR-08 |
| OPS-07 | Provider and environment (G9) | Not proposed; execution local and mocked | PRESENT (as "not proposed") | Owner and counsel | Only if a provider is ever proposed | None unless proposed | SR-07 |

## 6. Rights and counsel dependencies

| ID | Requirement | Current evidence | Status | Authority | What would close the gap | Blocks | Stop rules |
|---|---|---|---|---|---|---|---|
| RTS-01 | Counsel engaged | None; this workspace may not contact counsel | ABSENT | Owner | Owner engages counsel | C | SR-04 |
| RTS-02 | Disclosure of JRS material to evaluators | Publication and disclosure policies require review; P9-OD-05 open; no confidentiality instrument located | DECISION REQUIRED | Owner, with counsel where applicable | P9-OD-05 disposition; owner decision on whether counsel review is needed for B | B and C | SR-09 |
| RTS-03 | Data-flow, privacy and consent review (G4) | No data-flow description for an actual proposal | ABSENT | Counsel | Written counsel review | C | SR-03, SR-04 |
| RTS-04 | Rights questions B018-CQ-05 | Counsel brief prepared; no disposition | ABSENT | Counsel, with owner | Counsel disposition, or a G1 statement that C proceeds with the rights questions open and stated limits | C | SR-04, SR-10 |

## 7. Decision and authorization dependencies

| ID | Requirement | Current evidence | Status | Authority | What would close the gap | Blocks | Stop rules |
|---|---|---|---|---|---|---|---|
| DEC-01 | Owner selects A, B or C | None | DECISION REQUIRED | Owner | Completed decision record | B and C | None |
| DEC-02 | P8-OD-04 (independent evaluation authorized) | OPEN | DECISION REQUIRED | Owner | Disposition consistent with DEC-01 | B and C | None |
| DEC-03 | Bounded scope: purpose, duration, material classes | None | DECISION REQUIRED | Owner | Scope section of the decision record | B and C | SR-08 |
| DEC-04 | Authorization expiry or review date | None | DECISION REQUIRED | Owner | Date in the decision record | B and C | None |
| DEC-05 | Separate start direction for Gate 4 execution | Gate 4 BLOCKED pending a recorded Gate 3 authorization | DECISION REQUIRED | Owner | Recorded Gate 3 authorization, then a separate start direction | B and C | All |

## 8. Summary of blocking gaps

**Block Option B (and C):** ENG-05, ENG-06, PRV-03, GOV-01, GOV-02, GOV-03,
GOV-06, IND-02, IND-03, IND-04, IND-05, OPS-01 (synthetic class), OPS-02, OPS-03, OPS-06,
RTS-02, DEC-01 to DEC-05.

**Additionally block Option C:** GOV-04, GOV-05, GOV-07, OPS-01 (counsel approval of
classes), OPS-04, OPS-05, RTS-01, RTS-03, RTS-04.

**Conditional:** PRV-02 blocks B and C if PRV-03 decides evaluator access is external use; OPS-04 blocks B if material leaves the workspace; GOV-04 blocks B if
results are described beyond process findings; OPS-07 blocks either option only if a
provider is proposed.
