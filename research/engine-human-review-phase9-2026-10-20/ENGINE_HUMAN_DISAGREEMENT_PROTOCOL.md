# Engine-human disagreement protocol

**LOCAL ENGINEERING MATERIAL ONLY.** Independent evaluation not authorized or conducted. No release, deployment, or commercial readiness determination. Release status remains NO_GO_NOT_VERIFIED. Blocker B-018 remains OPEN.

Package: `phase9-human-evidence-adjudication` (admitted `local_construction_only`, 2026-10-20). Material: synthetic only, derived from the fictional GC-001 record; holdout-ineligible.

- Preserve: The Engine output is preserved byte for byte and referenced by its graph hash.
- Produces: A candidate learning record only.
- Change path: Any Engine change requires a separately authorized governance proposal through the Phase 8 change-impact and admission process.

Prohibited:

- Automatic modification of the Engine output, rule packs, compiler or thresholds.
- Treating the human outcome as a label for training, tuning or scoring.
- Using the disagreement to reverse a refusal or raise a status.

## Mechanism

`createLearningRecord(dossier, entry, graph)` refuses unless the graph is the exact Engine output the dossier was built from and the entry is a complete human entry. It returns a record with `status: candidate_only`, `applied: false`, the Engine graph hash and an output hash, the dossier hash, the Engine status and the human outcome, and whether they disagree. It does not touch the graph (direct probe `disagreement_preserves_engine`). `applyToEngine` always refuses.

## Engine detection gap found in Phase 9

R9-CON-04 (see the execution record) is recorded as a candidate learning item only. It is not applied, and no Engine file was changed.
