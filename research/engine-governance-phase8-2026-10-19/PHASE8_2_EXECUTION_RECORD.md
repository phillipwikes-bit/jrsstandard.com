# Phase 8.2 Execution Record

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

**Phase 8.2 is an amendment to local governance. It does not alter any Engine conclusion, any external evaluation status (no independent evaluation is authorized or conducted) or the release status.**

Phase 8.2, 2026-10-20. Local working tree on branch `claude/engine-reliability-phase6-local` at `428c307`. Local, synthetic, offline; `ANTHROPIC_BASE_URL` unset.

## Preconditions

1. All earlier package manifests and the Phase 8 manifest verified.
2. No Phase 9 file or directory existed.
3. Phase 8 isolated historical replay: 370/370. temporary git clone outside the repository at 428c307 plus the recorded Phase 6, Phase 7 and Phase 8 (8.1) files only; 354 files, each matched to its recorded hash; clone untracked set equal to the planned set. First attempt: 369/370. The single failing check was "no isolated replay temporary directory remains": the replay clone had been created with the same p8-iso- prefix that check looks for, so the suite saw its own working directory. The clone was renamed (p82-histreplay-) and the replay rerun; no package file differed.
4. Historical result preserved: 370/370 recorded 2026-10-20T03:38:10.929Z (`execution-record/PHASE8_HISTORICAL_RECORD.json`), with the 8.1-scope manifest `registry/manifests/phase8-governance-8.1-historical.sha256`.

## Changes (Phase 8 locations only)

- `lib/engine-governance-phase8/later-packages.mjs`: entry classes, seed set, status-claim rule, derived summary, Phase 8 scope classifier, EC-P8-SCOPE, Phase 8 dual context.
- `lib/engine-governance-phase8/decisions.mjs`: recorded owner authorization and its scope validator.
- `lib/engine-governance-phase8/handoff-freeze.mjs`: freeze lists retroactive seeds only.
- `tools/engine-governance-phase8-replay.mjs`: runs the Phase 8 suite in the current composition after recording the six earlier suites, classifies Phase 8 scope, adds Phase 8 to the dual context.
- `tests/engine-governance-phase8/`: registry-derived forms of the pinned Phase 8 checks, a Phase 8.2 record group, 29 probes and 18 mutations (`probes-82.mjs`).
- Records: registry 1.1.0, owner authorization, documents, Phase 8 manifest and registry binding.

## Results

| Item | Result |
|---|---|
| Whole-worktree run | 2026-10-20T06:03:58.487Z; six earlier suites with registry-derived composition `declared_composition_conditions_only` |
| Phase 8 in the current composition | 474/474, `declared_composition_conditions_only`, Phase 8 scope conditions: none |
| Phase 8 suite | 474 of 474 checks passed (246 direct, 130 negative or adversarial, 98 mutation) |
| Mutations | 98 of 98 caught directly; 0 load failures |

## Disclosures

- The Phase 8 suite's Phase 8.2 group reads the whole-worktree record. The replay tool runs that suite after recording the six earlier suites and before adding the Phase 8 part, so during that one self-run (flagged `JRS_PHASE8_SELF_RUN=1`) the two checks about the Phase 8 part cannot yet see it; every other run asserts them.
- Three Phase 8.1 probe expectations were updated for the new catalogue entry (EC-P8-SCOPE): the CPC-mapping probe now checks the four CPC entries and the one new entry separately, and the admission fixture lists EC-P8-SCOPE. The incomplete-analysis probe still omits a required check.
- The tautological form of the Phase 8 location check was removed; its detection is carried by the registry-derived check.

## What did not happen

No Phase 9 reservation, file or directory. No commit, push, merge, pull-request action, deployment, provider call, network request, B-018 action, tracker or ledger update, public change or branch change. No earlier package or earlier test changed.

## Admission correction (2026-10-20)

A narrow correction to the Phase 8.2 governance design before Phase 9 admission. Not a new phase. It does not alter any Engine conclusion, evaluation status or release status, and it does not describe the earlier Phase 8.2 result as invalid.

The Phase 8.2 checks "recording the authorization created no registry reservation", "no Phase 9 file or directory exists" and probe p82.authorization_created_no_reservation were framed as permanent absence checks. They were true when Phase 8.2 completed and are now historical-scope checks against this record. The earlier result is not invalid.

| Item | Was | Now |
|---|---|---|
| run.mjs "recording the authorization created no registry reservation" | permanent absence check | historical-scope check against phase8_2_historical_state, plus a current check that any reservation under the authorization exists only through a valid admission made after Phase 8.2 completed |
| run.mjs "no Phase 9 file or directory exists" | permanent absence check | historical-scope check (no Phase 9 path at Phase 8.2 completion), plus a current check that every Phase 9 path is owned by an admitted registry entry |
| p82.authorization_created_no_reservation | no registry entry may reference the authorization | p82.authorization_reservations_only_through_admission: reservations exist only as admitted entries tied to the authorization, admitted after Phase 8.2 completed |
| p82.fourth_entry_valid | assumed a three-entry registry | p82.additional_entry_valid: any added valid entry validates |
| p82.counts_derived_from_entries | fixed totals (4 entries, 1 admitted) | totals relative to the current registry |
| p82.seed_and_admitted_distinguishable | exactly one admitted entry | admitted count relative to the current registry; seeds fixed to Phase 6, 7, 8 |
| p82.current_registry_has_three_seeds_only | zero admitted packages | p82.current_registry_seeds_and_admissions_valid: three seeds; every admitted entry tied to a recorded decision and admitted after Phase 8.2 completed |
| p82.future_admission_representable | used the Phase 9 paths, which become registered on admission | uses a synthetic unregistered four-location package; a new adversarial probe confirms a registered package cannot be readmitted |
| p82.phase8_scope_current_worktree_clean | zero Phase 8 scope conditions | p82.phase8_scope_current_worktree_derived: one condition per admitted package with files present |
| Phase 8.1 check "recorded composition has six registry-derived conditions" | total fixed at six | seed-derived conditions are six and cover CPC-01 to CPC-04; the total is derived from the registry |
| manifest binding for admitted packages | only Phase 6, 7, 8 manifest hashes known, so a present admitted package could never validate | each admitted package declares its own manifest inside an approved research path; nothing is required before files exist; package state derived as no_files, incomplete_construction, manifest_verified or integrity_failure; regeneration requires a manifest_version header and preserved prior versions under manifest-history/ |

Temporary-copy simulation of every package state: admitted, no files (0 Phase 8 failures); files present, no package manifest (0 Phase 8 failures); files present, valid package manifest (0 Phase 8 failures); files changed after manifest (2 Phase 8 failures; expected); path without valid admission (2 Phase 8 failures; expected). The first simulation run exposed two probe defects introduced in this correction, fixed before the recorded runs: synthetic-entry probes replaced the recorded decided references with a test-only set, and three synthetic-state probes classified the live worktree together with their synthetic files.
