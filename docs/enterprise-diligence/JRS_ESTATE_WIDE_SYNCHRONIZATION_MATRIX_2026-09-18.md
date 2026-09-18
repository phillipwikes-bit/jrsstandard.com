# JRS Estate-Wide Synchronization Matrix — 2026-09-18

**One proposition, one current state, one authoritative current representation, preserved
history.** This matrix records, for every proposition corrected by an authoritative act, which
downstream records carried the old state and what was done to each.

**Method.** `scripts/estate_state_sweep.py`, re-runnable. **25 records in scope** — the 7
mandatory current-state records plus 18 discovered by inspection. Classification is at
**sentence or table-row scope**, never by proximity. Superseded wording is **masked** before
matching, so text retained under Rule 10 is not read back as a live claim.

---

## 1 · Proposition baseline

| # | Proposition | Authoritative current state | Source |
|---|---|---|---|
| P-1 | S-1 — de-identification review of the 54 records | **CLOSED** | E-031, owner attestation |
| P-2 | S-6 / T-6 — superseded figures distribution | **CLOSED** | E-032 |
| P-3 | Section 2.1 — origin and character | **CLOSED** | E-033, E-036 |
| P-4 | V-AI-08 / Gabriela Cortez | **Participation PRESERVED; Section 2.1 characterisation corrected** | E-033, E-036 |
| P-5 | X-15 | **CLOSED — raised in error on a superseded premise** | Owner directive |
| P-6 | CT-1 / Ubayet Hossain | **Factual limb answered; legal limb with B-004; CT-UBAYET deferred by owner sequence** | E-034 |
| P-7 | Domain registrar control | **OWNER-CONFIRMED** | E-035 |
| P-8 | B-001 — external credential rotation | **OWNER-CONFIRMED / EXTERNAL ACTION COMPLETED** | E-030 |
| P-9 | CT-2 | **CLOSED AS FRAMED** | Prior cycle |
| P-10 | CT-5 | **ACCOUNT SUPPLIED** | E-029 |

---

## 2 · Downstream corrections applied this cycle

| # | Record | Proposition | Old representation | Action |
|---|---|---|---|---|
| 1 | `.jrs/state/BLOCKERS.json` — B-017 | P-8 | revocation "queued behind B-001" | Corrected in place; prior wording quoted, not deleted |
| 2 | `JRS_BOARD_DECISION_REGISTER_2026-09-16.md` | P-8 | dependencies line "queued behind **B-001**" | Struck; replaced with the owner-action statement |
| 3 | `JRS_QUESTION_RESOLUTION_MATRIX_2026-09-16.md` — W-10 | P-8 | "both queued behind B-001" | Struck; corrected |
| 4 | `JRS_QUESTION_RESOLUTION_MATRIX_2026-09-16.md` — S-1 row | P-1 | "OWNER FACTUAL CONFIRMATION REQUIRED" | Struck; CLOSED (E-031) |
| 5 | `JRS_QUESTION_RESOLUTION_MATRIX_2026-09-16.md` — T-6 row | P-2 | "OWNER FACTUAL CONFIRMATION REQUIRED" | Struck; CLOSED (E-032) |
| 6 | `JRS_QUESTION_RESOLUTION_MATRIX_2026-09-16.md` — V-10 row | P-8 | "which waits on B-001" | Struck; corrected to owner authorization |
| 7 | `JRS_BOARD_DECISION_REGISTER_2026-09-16.md` — BD-01 | P-1 | both residual questions "remain OWNER FACTUAL CONFIRMATION REQUIRED" | **One limb only.** De-identification limb closed; readability limb expressly NOT closed |
| 8 | `JRS_CURRENT_DEPENDENCY_GRAPH_2026-09-16.md` | P-8 | `B-001 → B-013A revocation` edge | Edge removed and recorded |
| 9 | `JRS_CURRENT_DEPENDENCY_GRAPH_2026-09-16.md` | P-8 | `B-001 → B-014`, "deployment waits on B-001" | Edge removed; B-014 urgency expressly unchanged |
| 10 | `JRS_CURRENT_DEPENDENCY_GRAPH_2026-09-16.md` | P-8 | **the whole graph was rooted at B-001** | New controlling section: `RECALCULATED — 2026-09-18`. Earlier calculations stamped historical |
| 11 | `CHAIN_OF_TITLE_STATUS.md` §3 | P-3, P-4 | Section 2.1 as an open OWNER FACTUAL matter, then "credit only" | Both paragraphs struck; premise-corrected note added; participation expressly preserved |
| 12 | `JRS_MASTER_ASSET_..._REGISTER.md` — Ubayet row | P-6 | open question, no E-034 reference | E-034 recorded, with the grant/absence distinction stated and the "Not located" cells expressly unchanged |
| 13 | `FINAL_PRE_GATE_1_READINESS_AUDIT_2026-09-16.md` | P-8 | "four production operations still queue behind B-001" | Struck; corrected |
| 14 | `FINAL_PRE_GATE_1_READINESS_AUDIT_2026-09-16.md` | P-8 | "B-017 adds a sixth item to the production queue behind B-001" | Struck; corrected |
| 15 | `FINAL_PRE_GATE_1_READINESS_AUDIT_2026-09-16.md` | P-8 | "deployment waits on B-001" (Revision 3) | Struck; corrected |
| 16 | `FINAL_PRE_GATE_1_READINESS_AUDIT_2026-09-16.md` | — | **two revisions each claimed "This revision controls"** | Round E/F stamped superseded by Round G; Revisions 2 and 3 stamped historical |

**Corrections carried forward from earlier in this cycle** (Human decisions register, gate
remaining items, counsel packet, rights register, deployment readiness report, gate remediation
report, next-steps instructions) are recorded in the reconciliation report.

---

## 3 · Residual flags, each triaged

**Five flags remain. Every one is a false positive, and each is stated so that the next reader
can disagree with the triage rather than inherit it.**

| Flag | Why it is not stale |
|---|---|
| `BLOCKERS.json` B-006 `effect` | Describes a TRANSITION — "B-006 moves OPEN → DIAGNOSTIC READY". Naming the state left is not asserting it |
| `JRS_BOARD_DECISION_REGISTER` BD-01 "ALSO NOT ESTABLISHED" | Superseded by the E-031 blockquote in the paragraph immediately below, retained deliberately under Rule 10 |
| Master Register, X-15 | The closure's own limit sentence — "does not support keeping X-15 open". A **guard requires this sentence to be present**; removing it would be the defect |
| `CHAIN_OF_TITLE_STATUS` §3 | "**no** Section 2.1 contributor question to leave open" — a negation of the old state |
| `CHAIN_OF_TITLE_STATUS` Ubayet | "what it must **not** be read as is an open consent gap … or a reason to contact Ubayet" — a negation |

**Why the sweep is not tuned until these disappear.** Each would need a negation rule, and a
negation rule was tried and withdrawn: at window scope it excused three live claims. Five
flags a person reads cost less than one live claim a rule hides.

---

## 4 · Standing controls added

| Control | Proposition | Demonstrated |
|---|---|---|
| `check_no_stale_current_state_representation` — new proposition | A **closed blocker named as a live dependency** | Fires at all **6** sites |
| `check_no_stale_current_state_representation` — unit scope | Replaces a 260-character window | Window had excused 3 live claims |
| `check_section_2_1_resolution_holds` — limb 6 | `RIGHTS_REGISTER.json` `CT-SEC-2.1` must read CLOSED | Fires on reopening |
| `check_section_2_1_resolution_holds` — limb 7 | Chain-of-title §3 must stay struck and cite E-036 | Fires on un-striking |
| `check_no_stale_owner_action_survives_its_confirmation` | Covers `HUMAN_DECISIONS_REQUIRED.md`; matches the **state claim**, not only the instruction | Fires on reassertion |
| `check_architecture_baseline_is_current` | Every defined guard must be **dispatched** | Fires when a guard is dropped from the call list |

**Guard suite: 152 checks, 0 failed, 1 skipped. 123 guards defined, all 123 dispatched.**
