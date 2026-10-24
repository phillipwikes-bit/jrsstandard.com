# Later-Package Registry

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Source of record: `governance/LATER_PACKAGE_REGISTRY.json`, version 1.1.0, governance hash `sha256:9a3cc35ea99a1dda063d368a6ab6468c27e38ce35025a3c1ca2e71cfe8ce6fd4` (the content hash inside the file changes whenever the Phase 8 manifest binding does). Records which local packages were added after each earlier package and which earlier checks they affect. A registry status is not a validation, release, ownership, commercial or deployment status. B-018 remains OPEN and is not addressed by this registry.

Statuses: `reserved_not_present`, `present_local_only`, `preserved_local_only`, `retired`, `local_construction_only`. No status is a validation, release, ownership, commercial or deployment status.

Counts (derived from entries, never fixed): entries 3, retroactive seeds 3, admitted future packages 0, reserved not present 0, local construction only 0, present 3, retired 0. Entry classes: `retroactive_seed` (Phase 6, Phase 7, Phase 8 only) and `admitted_future_package` (admitted by the gate before any file exists). Phase 8.2 amendment: see `PHASE8_2_GOVERNANCE_AMENDMENT.md`.

| Package | Entry class | Version | Status | Created | Approved paths | Affected earlier checks | Owner reference | Evidence |
|---|---|---|---|---|---|---|---|---|
| phase6-reliability | retroactive_seed | 1.0.0 | preserved_local_only | 2026-10-17 | lib/engine-reliability/, tests/engine-reliability/, tools/engine-reliability-replay.mjs, research/engine-reliability-phase6-2026-10-17/ | EC-P4-TOOLS | Phase 6 assignment (owner, 2026-10-17) | research/engine-reliability-phase6-2026-10-17/OWNER_DECISION_REGISTER.md |
| phase7-candidate | retroactive_seed | 0.3.1 | preserved_local_only | 2026-10-19 | lib/engine-evidence-graph-v0.3.1-candidate/, tests/engine-remediation-phase7/, research/engine-remediation-phase7-2026-10-19/ | EC-P6-OWNERSHIP | Phase 7 assignment (owner, 2026-10-19) | research/engine-remediation-phase7-2026-10-19/REMEDIATION_CONTRACT.md |
| phase8-governance | retroactive_seed | 1.1.0 | present_local_only | 2026-10-19 | lib/engine-governance-phase8/, tests/engine-governance-phase8/, tools/engine-governance-phase8-replay.mjs, research/engine-governance-phase8-2026-10-19/ | EC-P4-TOOLS, EC-P6-OWNERSHIP, EC-P7-OWNERSHIP, EC-P7-TOOLS | Phase 8 assignment (owner, 2026-10-19) and Phase 8.1 assignment (owner, 2026-10-20) | research/engine-governance-phase8-2026-10-19/OWNER_DECISION_REGISTER.md |

## Permissions (all entries)

| Permission | Value |
|---|---|
| May affect historical recorded results | no |
| May affect whole-worktree composition results | yes (visible, declared) |
| May affect public or deployment surfaces | no |

## Manifest binding

Phase 6 and Phase 7 entries bind the package hashes recorded in `registry/VERSION_REGISTRY.json`. The Phase 8 entry binds the hash of the rows of `PHASE8_FILE_MANIFEST_SHA256.txt`; the registry file is excluded from that manifest so the binding is not circular, and carries its own content hash instead.

## Retroactive seeds

All three entries are retroactive seeds: the packages existed before the registry. No formal owner-decision record authorizing each package exists; each entry cites the recorded assignment evidence instead, with `formal_decision_record: false`. Ratifying the seeds is owner decision P8-OD-08. A future package cannot be seeded this way; it must pass the admission gate before any of its files exist.

## Earlier-check catalogue

| Check | Originating package | Exact check | Source | Historical example | Reported as |
|---|---|---|---|---|---|
| EC-P4-TOOLS | phase4-change-control | tools unchanged since 5d5374b | tests/engine-adaptive-reliability/run.mjs:51 | CPC-01 | failing earlier check, classified from the registry |
| EC-P6-OWNERSHIP | phase6-reliability | every new file is inside the four Phase 6 locations | tests/engine-reliability/run.mjs:64 | CPC-02 | failing earlier check, classified from the registry |
| EC-P7-OWNERSHIP | phase7-candidate | every new file is a Phase 6 file or inside the three Phase 7 locations | tests/engine-remediation-phase7/run.mjs:58 | CPC-03 | failing earlier check, classified from the registry |
| EC-P7-TOOLS | phase7-candidate | no Phase 7 file under tools/, api/, docs/, .jrs/ or a public page | tests/engine-remediation-phase7/run.mjs:59 | CPC-04 | failing earlier check, classified from the registry |
| EC-P8-SCOPE | phase8-governance | every untracked file belongs to a registered package or a declared later package | tests/engine-governance-phase8/run.mjs (safety group) | none (Phase 8.2) | composition condition from the Phase 8 scope classifier; never a failing Phase 8 check |

B-018 is recorded as `OPEN` and is not addressed by this registry.
