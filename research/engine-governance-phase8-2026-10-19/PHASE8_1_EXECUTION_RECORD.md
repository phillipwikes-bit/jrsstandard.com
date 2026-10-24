# Phase 8.1 Execution Record

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Phase 8.1, 2026-10-20. Local working tree on branch `claude/engine-reliability-phase6-local` at `428c307`. Local, synthetic, offline. Every command ran with `ANTHROPIC_BASE_URL` unset.

## Scope

Changes only in the existing Phase 8 locations. No earlier package, earlier test suite, tracked file, public route, deployment file, B-018 record, tracker, ledger, PR or branch was changed. No Phase 9 directory was created.

## Pre-checks

- Owner-decision references: no formal decision record exists for creating Phase 6, 7 or 8. Each registry entry cites recorded assignment evidence (Phase 6 owner decision register row of 2026-10-17; Phase 7 remediation contract "Stop conditions (from the assignment)"; Phase 8 owner decision register). No reference was invented; ratification is P8-OD-08.
- Isolated replay: confirmed feasible without writing into the repository (temporary `git clone` outside the repository).

## Sequence

1. Modules added in `lib/engine-governance-phase8/`: `later-packages.mjs`, `admission.mjs`, `isolated-replay.mjs`, `handoff-freeze.mjs`; two owner decisions added to `decisions.mjs` (P8-OD-08, P8-OD-09).
2. `governance/build-later-registry.mjs` writes `governance/LATER_PACKAGE_REGISTRY.json`; the registry is excluded from the Phase 8 file manifest and binds its hash.
3. `tools/engine-governance-phase8-replay.mjs` gained `--isolated` and a registry-derived composition with a dual-context record.
4. Isolated replays: phase4-change-control 269/269, phase6-reliability 316/316, phase7-candidate 328/328.
5. Whole-worktree run (2026-10-20T06:03:58.487Z): composition verdict `declared_composition_conditions_only`, 6 registry-derived conditions covering CPC-01 to CPC-04.
6. `build-records.mjs` also writes the handoff freeze; `build-documents-81.mjs` writes the Phase 8.1 records.
7. Final suite: 474 of 474 checks passed (246 direct, 130 negative or adversarial, 98 mutation).

## Corrections during Phase 8.1 (disclosed)

| Finding | Correction |
|---|---|
| The first recorded suite run reported 367 of 369: the whole-worktree record was bound to the registry content hash, which changes whenever the Phase 8 manifest binding does, so a recorded run always cited a stale registry. | The registry now carries a governance hash over only the fields that drive classification (earlier-check catalogue, package identifiers, approved paths, affected checks, statuses, permissions). The whole-worktree record binds that hash; the registry validator recomputes it. The whole-worktree run was repeated. |
| The same run flagged three Phase 8 records under the B-018 check. None claimed resolution: two described the check itself and one was the area label of a mutation that targets that check. | The detector treats wording that describes the check as a mention rather than a claim; probe `r81.b018_claim_detector_bounds` confirms it still catches statements that B-018 has been settled. The mutation area label was renamed. |

Neither correction touched an earlier package, an earlier test, or a sealed record.

## What did not happen

No commit, push, merge, pull-request action, deployment, provider call, network request, B-018 action, tracker or ledger update, public change or branch change. No real record, sealed evaluation material, label, source file or credential was used.
