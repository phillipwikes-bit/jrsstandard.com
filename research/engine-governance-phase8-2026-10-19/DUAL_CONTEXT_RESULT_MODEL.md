# Dual-Context Result Model

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

**Language rule.** Earlier package results remain historically recorded results for their sealed package scope. A later whole-worktree run may show a declared compatibility condition without establishing a defect in the earlier package.

Each earlier package result is reported in separate contexts that are never merged into one pass or fail number: the historical result recorded for its sealed scope, an isolated replay of that scope, and the current whole-worktree composition result with its declared composition conditions.

| Package | Historical (sealed scope) | Isolated replay | Whole-worktree composition | Composition conditions | Earlier protected file changed |
|---|---|---|---|---|---|
| v0.1-assurance | 148/148 (2026-10-17) | not replayed in isolation | 148/148 | none | no |
| v0.2-evidence-contract | 123/123 (2026-10-17) | not replayed in isolation | 123/123 | none | no |
| v0.3-evidence-graph | 140/140 (2026-10-17) | not replayed in isolation | 140/140 | none | no |
| phase4-change-control | 269/269 (2026-10-17) | 269/269 | 268/269 | DCC-EC-P4-TOOLS-phase8-governance [CPC-01]; DCC-EC-P4-TOOLS-phase6-reliability [CPC-01] | no |
| phase6-reliability | 316/316 (2026-10-19T11:13:53.182Z) | 316/316 | 315/316 | DCC-EC-P6-OWNERSHIP-phase7-candidate [CPC-02]; DCC-EC-P6-OWNERSHIP-phase8-governance [CPC-02] | no |
| phase7-candidate | 328/328 (2026-10-19T13:57:52.546Z) | 328/328 | 326/328 | DCC-EC-P7-OWNERSHIP-phase8-governance [CPC-03]; DCC-EC-P7-TOOLS-phase8-governance [CPC-04] | no |
| phase8-governance | 370/370 (2026-10-20T03:38:10.929Z) | 370/370 | 474/474 | none | no |

## Registry-derived composition conditions

Source: `execution-record/WORKTREE_RUN_RECORD.json`, run 2026-10-20T06:03:58.487Z, bound to registry governance hash `sha256:9a3cc35ea99a1dda063d368a6ab6468c27e38ce35025a3c1ca2e71cfe8ce6fd4`. Verdict: `declared_composition_conditions_only`; fail-closed items: 0.

| Condition | Affected historical package | Exact check | Later package (governing registry entry) | Paths | Earlier protected file changed | Historical example | Reported as |
|---|---|---|---|---|---|---|---|
| DCC-EC-P4-TOOLS-phase8-governance | phase4-change-control | tools unchanged since 5d5374b | phase8-governance | 1 files | no | CPC-01 | declared composition condition, not a historical-package defect |
| DCC-EC-P4-TOOLS-phase6-reliability | phase4-change-control | tools unchanged since 5d5374b | phase6-reliability | 1 files | no | CPC-01 | declared composition condition, not a historical-package defect |
| DCC-EC-P6-OWNERSHIP-phase7-candidate | phase6-reliability | every new file is inside the four Phase 6 locations | phase7-candidate | 147 files | no | CPC-02 | declared composition condition, not a historical-package defect |
| DCC-EC-P6-OWNERSHIP-phase8-governance | phase6-reliability | every new file is inside the four Phase 6 locations | phase8-governance | 83 files | no | CPC-02 | declared composition condition, not a historical-package defect |
| DCC-EC-P7-OWNERSHIP-phase8-governance | phase7-candidate | every new file is a Phase 6 file or inside the three Phase 7 locations | phase8-governance | 83 files | no | CPC-03 | declared composition condition, not a historical-package defect |
| DCC-EC-P7-TOOLS-phase8-governance | phase7-candidate | no Phase 7 file under tools/, api/, docs/, .jrs/ or a public page | phase8-governance | 1 files | no | CPC-04 | declared composition condition, not a historical-package defect |

CPC-01 to CPC-04 remain in `governance/COMPATIBILITY_MANIFEST.json` as the historical record of how Phase 8 first declared these conditions. They are now derived from the registry: CPC-01 splits into one condition per later package that causes it (Phase 6 and Phase 8), as does CPC-02 (Phase 7 and Phase 8).

## Phase 8 as a governed historical package (Phase 8.2)

Phase 8 suite in the current composition: 474/474, verdict `declared_composition_conditions_only`. Phase 8 scope conditions: none (no admitted later package exists). Historical result 370/370 (8.1 scope, `execution-record/PHASE8_HISTORICAL_RECORD.json`); isolated replay 370/370. A declared later package can add a Phase 8 scope condition; it cannot change the historical result. An undeclared path, an invalid reservation, files created before admission, or a changed Phase 8 protected file fail.

## Failures that remain failures

An undeclared later path, a missing manifest, a missing owner reference, a stale manifest binding, an undeclared affected check, a changed protected earlier file, an incomplete test record or an uncatalogued failing check each make the composition verdict `fail_closed`.
