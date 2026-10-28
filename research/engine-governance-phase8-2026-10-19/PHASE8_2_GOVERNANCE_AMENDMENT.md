# Phase 8.2 Governance Amendment

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

**Phase 8.2 is an amendment to local governance. It does not alter any Engine conclusion, any external evaluation status (no independent evaluation is authorized or conducted) or the release status.**

**Language rule.** Earlier package results remain historically recorded results for their sealed package scope. A later whole-worktree run may show a declared compatibility condition without establishing a defect in the earlier package.

## Why

The Phase 8.1 registry and the Phase 8 suite assumed exactly three retroactive seed entries and treated any file outside Phase 8 scope as undeclared. A future package could therefore not be admitted without Phase 8 appearing defective. A simulation before Phase 9 showed 5 Phase 8 checks failing on a registry reservation alone and 15 with one placeholder file present. Phase 9 was stopped before any file was created.

## Amendment

| Area | Before | After |
|---|---|---|
| Registry membership | Exactly three entries assumed by tests | Entry classes `retroactive_seed` and `admitted_future_package`; statuses as before; counts derived from entries (`summary`). Retroactive seeds are limited to phase6-reliability, phase7-candidate, phase8-governance. |
| Admitted future packages | Not representable | Require an admission record tied to a recorded owner decision, gate result admissible, zero files at admission |
| Status claims | Claim guard only | An entry using a status word such as `deployed`, `validated`, `licensed` or `ready` is rejected |
| Phase 8 itself | Not in the dual-context model | Governed historical package: historical 370/370 (8.1 scope), isolated replay 370/370, current composition reported separately |
| Phase 8 location check | "every Phase 8 file is inside the four Phase 8 locations" (any other file failed) | "every untracked file belongs to a registered package or a declared later package", classified from the registry |
| Phase 8 scope classes | none | declared future path (composition condition, "declared composition condition, not a historical-package defect"); undeclared future path; missing or invalid reservation; files before admission; changed Phase 8 protected file (all but the first fail) |
| Earlier-check catalogue | Four checks (CPC-01 to CPC-04) | Adds EC-P8-SCOPE, reported by the Phase 8 scope classifier and included in the admission analysis of any future package |
| Legacy CPC classification | Over every untracked file | Over Phase 8 scope; later packages are governed by the registry-derived classification |
| Evaluation handoff freeze | Listed every registry entry | Lists retroactive seeds only; admitted future packages never alter the freeze |
| Owner authorization | none recorded | `OWNER_WORK_ASSIGNMENT_2026-10-20_PHASE9_HUMAN_ADJUDICATION_LAYER` recorded as decided, local package construction only; no reservation created |
| Phase 8 manifest | Covered the whole-worktree run record | Excludes the whole-worktree run record and its suite outputs, which every run regenerates and the suite recomputes |

## Detection kept

An undeclared later path, a changed protected file (earlier packages and Phase 8), a missing owner reference, a package with files before admission and a stale manifest binding all still fail closed; each is covered by a direct adversarial probe and by a mutation that a named probe catches.

## Owner authorization

| Scope item | Authorized |
|---|---|
| local package construction | yes |
| independent evaluation | no |
| provider calls | no |
| deployment | no |
| public use | no |
| commercial licensing or release | no |
| real record processing | no |

Reservation created: no. The authorization is a reference the admission gate can accept; it does not admit Phase 9.

## Phase 9 representability

With the reference recorded, a Phase 9 proposal for the four approved paths is admissible to the gate (probe `p82.future_admission_representable`), with computed affected checks EC-P4-TOOLS, EC-P6-OWNERSHIP, EC-P7-OWNERSHIP, EC-P7-TOOLS and EC-P8-SCOPE. Once admitted and present, its files would be declared composition conditions for Phase 4, Phase 6, Phase 7 and Phase 8, never historical defects (probe `p82.phase8_scope_declared_condition`). No Phase 9 reservation or file was created.
