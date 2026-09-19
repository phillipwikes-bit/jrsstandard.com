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

---

# PART II — ESTATE DISCOVERY, 2026-09-18 (same day, second cycle)

**Part I above reconciled a 25-record scope and said so.** It did not establish that 25 records
were the estate. This part establishes the discovery boundary itself.

## 6 · Discovery method and what it searched

| Dimension | Actual |
|---|---|
| Repository files tracked | **1,366** |
| Text-searchable files searched | **1,061** |
| Binary files (docx, pdf, png, zip) | **302**, not searched; none is a control-state record |
| Other | `.gitignore`, `CNAME`, one `.pyc`, one `.htm` (added to the search) |
| Directories searched | every tracked directory: `.jrs`, `docs`, `research`, `scripts`, `api`, `lib`, `tests`, `reference`, `.claude`, `.github`, `content`, `schemas`, `standard`, `supabase`, `templates`, `tools`, root |

**Three discovery methods, unioned.** None alone was sufficient, and the second and third exist
because the first was demonstrably blind.

| Method | What it keys on | Found |
|---|---|---|
| **A — IDENTIFIER** | an estate id: `B-0xx`, `E-0xx`, `BD-xx`, `CT-xxx`, `X-1x`, `CONTRADICTION_xxx`; and `S-/T-/V-/W-/U-/M-/D-/F-` **only** in estate context | 137 |
| **B — ROLE** | membership of `.jrs/`, the control architecture under CLAUDE.md §4 | +8 that A could not see |
| **C — SEMANTIC** | a dependency or owner/counsel action **stated in words with no identifier at all** | +143 |
| **UNION** | | **294** |

**Method A alone would have missed `.jrs/state/PROGRAM_STATE.json`** — the file CLAUDE.md §18
names as the first thing to read in a new context — and four of the six gate criteria records,
because none of them happens to mention a `B-` number. **A record can be state-bearing without
naming an identifier, and an id-keyed search is blind to exactly that case.**

**A namespace collision had to be separated first.** Keying on identifiers alone returned 252
files, dominated by `research/` and `api/`: `V-AI-08` is a **participant code** and `S-1`,
`T-6`, `V-4` collide with **study arm labels**. Counting those as estate participation would
have inflated the estate with roster files and buried the real findings under them.

## 7 · Classification of all 294 — no unexplained exclusion

| Class | Count | Why it is or is not swept for current state |
|---|---|---|
| **CURRENT** | **147** | Swept. Controls current state |
| **RESEARCH CORPUS** | **68** | Not swept. Article drafts v4–v9, submission packets, coding frames, a FOIL production, CSV datasets. Scholarly prose says "requires", "remains open" and "not established" constantly; CLAUDE.md §4 maps `research/` to the research programme, tracked by its own log. **Three research files that DO carry estate state are named individually** — `MASTER_TRACKER.md`, `TRACKER_RECENT.md`, `IP_SALE_TRACKER.md` — so adding a fourth is a decision, not an accident |
| **CONTROL CODE** | **43** | Not swept. `check_zero_drift.py` contains "queued behind B-001" **because that is the string it exists to catch.** Reading a detector's pattern as an assertion makes every control look like the defect it prevents |
| **HISTORICAL** | **32** | Not swept. Each self-classifies in its opening block with a distinctive token |
| **CORRECTION NARRATIVE** | **4** | Not swept. A synchronization matrix has a column headed "Old representation"; reading those cells as live claims reports the record of the fix as the defect |

## 8 · What discovery found that the 25-record scope could not

| # | Finding | Severity |
|---|---|---|
| 1 | **`.jrs/state/ACTIVE_GATE.json` — the live file governing whether Phase 2 may proceed — carried three conditions and ALL THREE WERE STALE.** "B-001 open ... needs rotation" (closed 2026-09-18); "B-002 open ... not reconciled" (PREPARED_FOR_HUMAN_REVIEW); "the **four**-processor list" (**seven**) | **Material** |
| 2 | **`.jrs/reports/GATE_1_REMAINING_ITEMS.md` disagreed with the authoritative registry on seven rows** — B-002, B-005, B-006, B-007, B-010, B-012 and the B-003 processor count, which read "five" against the registry's seven | **Material** |
| 3 | **`HUMAN_DECISIONS_REQUIRED.md` asked the owner for work already done.** "D-12 to D-17 · **ALL OPEN, NONE FIXED**" — three of six were remediated, including **D-14, the one the page itself called "the one with a safety edge"**, whose fix sits at `pilot.html` line 816. D-11's sentence had been deleted; D-10 had been decided by the Board (BD-05) | **Material** |
| 4 | **Two duplicate authorities, each announcing itself as current.** `ASSET_AND_CHAIN_OF_TITLE_REGISTER.md` opens "Version 2.0, rebuilt from underlying evidence"; `DEPLOYMENT_READINESS_REPORT.md` carries the plainest filename of any readiness record and is the older one. **Both supersessions were recorded in the document that WINS, and nowhere in the one a reader opens by name** | **Material** |
| 5 | **A page shipped to production** (`research-data.html`) still named a closed blocker as a live queue, in page source | Moderate |
| 6 | **`research/MASTER_TRACKER.md` calls itself "single source of truth"** over a July snapshot, and it is what the owner reads every turn | Moderate |
| 7 | **A guard floor could be edited downward to disarm itself.** Lowering the pin from 125 to 90 left the suite green; at that setting 35 guards could be deleted unnoticed | Moderate |
| 8 | **26 dated execution records carried no historical classification**, so their blocker states read as current | Moderate |

## 9 · Standing controls added this cycle

| Control | Demonstrated |
|---|---|
| `check_downstream_records_agree_with_the_blocker_registry` | Fires on a closed blocker named open, in prose, in a table row and in JSON |
| `check_no_owner_decision_asks_for_completed_work` | Cross-checks four owner decisions against **the code that settles them**; fires on each |
| `check_superseded_records_declare_themselves_superseded` | Fires when either duplicate authority drops its stamp |
| `check_architecture_baseline_is_current` — pin must **track**, not lag | Fires when the floor is lowered |

**Guards: 126 defined, all 126 dispatched. 155 checks, 0 failed, 1 skipped (unreachable
endpoint, not drift).**

## 10 · Residual flags after the final rescan — 9, every one triaged

| Flag | Why it is not stale |
|---|---|
| `B-006_DIAGNOSTIC_PROCEDURE.md` | A state-machine line, `OPEN → DIAGNOSTIC READY → …`. Naming the state a thing leaves is not claiming it is in it |
| `CHAIN_OF_TITLE_STATUS.md` ×2 | Negations: "**no** Section 2.1 contributor question to leave open"; "what it must **not** be read as" |
| `IP_ASSET_REGISTER.md` — Section 2.1 | An asset description, current and correct |
| `IP_ASSET_REGISTER.md` — domain **Unknown** | **Correct and deliberately unchanged.** E-035 is an owner attestation of registrar-account control; **no registrar record is located in-repo**, and an attestation is not a located document |
| `JRS_BOARD_DECISION_REGISTER_2026-09-16.md` | Superseded by the E-031 blockquote in the paragraph immediately below |
| Master Register, X-15 | The closure's own limit sentence. **A guard requires it to be present** |
| `PERSON_BY_PERSON_EVIDENCE_AUDIT.md`, `RIGHTS_AND_AGREEMENTS_EVIDENCE_REGISTER.md` | "Ubayet Hossain … **not confirmed**" is the **correct current evidence state**. E-034 added the owner's account beside E-021; it located no instrument |

---

# PART III — RESEARCH PROVENANCE CORRECTION, 2026-09-19

**Extended here rather than opened as a competing dated matrix.** One correction, one control
record.

## 11 · The proposition, corrected

**The question was not "was reliability measured" but "WHICH SAMPLE MEASURED WHAT".**

| # | Proposition | Old representation | Current state | Authoritative source |
|---|---|---|---|---|
| R-1 | Detection / performance | Stated in one entry with the reliability criterion | **MEASURED on the detection panel** — 16 reviewers, 24-record corpus, 384 graded judgments, 83.9%, CI 72.7–95.1, data lock 2026-08-15 | Manuscript §5, §6.2, §6.4 → **E-037** |
| R-2 | Detection-panel reliability | Implied by adjacency | **NOT MEASURED on that panel or that corpus.** 83.9% is not a reliability figure | Manuscript §7 |
| R-3 | Separate reliability sample | Attributed, by adjacency, to the detection study | **MEASURED on a separate sample** — 25 participants, 22 analysed (8 invited, 14 open enrolment), 10 multi-rater records, 113 → 104 labels; AC1 **0.739** / **0.623** | Manuscript §6.5 → **E-038** |
| R-4 | Pre-registered criterion | Read as an outcome of the detection study | **NOT MET, on the separate reliability sample only.** Both point estimates clear 0.61; neither lower bound clears 0.41 | Manuscript §6.5 |
| R-5 | Validation | — | **Not established.** Detection ≠ reliability ≠ psychometric validation ≠ operational effectiveness ≠ generalizability | `RESEARCH_AND_VALIDATION_STATUS.md` |

**The linkage was established affirmatively, not inferred.** The manuscript's own conclusion
names it **"the separate reliability sample"**, and §6.5 gives its participants and records,
which are different from the detection panel's.

## 12 · Corrections applied

| # | Record | Correction |
|---|---|---|
| 1 | Master Register §7 | Single "Research evidence base" entry **split into two evidence objects** with their own parameters, plus a scope limit. Prior wording **struck and retained** |
| 2 | Master Register §17 | Correction-history row **15** added: scope, not result |
| 3 | Master Register §23 | Evidence index **36 → 38**, with the reason |
| 4 | `EVIDENCE_LEDGER.md` | **E-037** detection panel and **E-038** separate reliability sample, both Level B. **The research results had no ledger entry at all before this** |
| 5 | `RESEARCH_AND_VALIDATION_STATUS.md` | Reliability row scoped to the separate sample; accuracy row scoped to the detection panel; section heading given its scope before the figures |
| 6 | `research-summary.html` | Public card now names the reliability sample size and states that **83.9% is not a reliability measure** |

## 13 · Occurrence inventory

**48 files** carry both a detection parameter and a reliability result. **76 units** name both
in one assertion: **22 CURRENT, 24 HISTORICAL, 22 CONTROL CODE, 8 RESEARCH CORPUS.** Of the 76,
**14 were already scoped** and **62 were not**; **17 of the unscoped sit in CURRENT records**,
and those are inventory listings — a claims register, a figures table, audit reports recording
what is published — rather than assertions that one sample produced the other's statistic. **The
six corrected above are the ones that asserted it.**

## 14 · Seven mandatory downstream records

`BLOCKERS.json` · `HUMAN_DECISIONS_REQUIRED.md` · Question Resolution Matrix · Counsel Review
Packet · Board Decision Register · Current Dependency Graph · Owner Resolution Batch —
**all seven inspected, all seven carry ZERO occurrences** of `83.9`, `AC1`, `reliability
criterion`, `inter-rater`, `0.739` or `0.623`.

**INSPECTED — NO MATERIAL DEPENDENCY IDENTIFIED.** No blocker, Owner action, Counsel action,
Board item, Gate representation or phase requirement depends on the corrected proposition, and
none was manufactured.

## 15 · Controls added

| Control | Demonstrated |
|---|---|
| `check_reliability_is_recorded_as_measured_and_failed`, extended | Both sample blocks must carry their own parameters; the status row must keep its scope |
| `check_ledger_index_matches_the_ledger` | Fires when the index and the ledger disagree — the drift §23 records happening once already |

**7 of 7 provenance mutations pass**, including relabelling the separate sample as the article
study and deleting either sample's counts. **Guards 160 checks, 0 failed, 1 skipped; 131
defined, dispatched and pinned.**
