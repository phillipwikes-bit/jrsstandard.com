# Change Log

## 2026-09-14 — Control architecture established (`/jrs-init`)

**Created:** `CLAUDE.md` (replaced), `docs/repository-operations/OPERATIONS_ANNEX.md`,
`.claude/commands/` (15), `.claude/agents/` (10), `.jrs/` (state 4, registries 13,
gates 6, decisions, changes, reports, templates).

**Modified:** `.vercelignore` (exclude `.jrs/`).

**Not modified:** every substantive JRS asset. No HTML page, no `api/` endpoint, no
research file, no PDF and no script was touched.

## 2026-09-14 — Phase 1 (Gate 1 FAILED)

**Created:** `standard/jrs-conditions.json`, `.jrs/contradictions/CONTRADICTION_001.md`,
`.jrs/reports/REVIEW_ENGINE_BOUNDARY.md`, `.jrs/reports/GATE_1_REPORT.md`.

**Modified:** six registries, `.vercelignore` (exclude `standard/`),
`scripts/preflight_deploy_check.py` (read `.vercelignore`; honour negations),
`research/build_participant_inventory.py` (per-key merge),
`research/MASTER_TRACKER.md` (Rule 10 correction of a false guarantee),
`.jrs/state/CURRENT_PHASE.json`, `.jrs/state/BLOCKERS.json`.

**Damaged and restored:** `research/_inventory_live_snapshot.json` lost 118 lines and its
only `runs` record in commit `a48dbb7`. Restored from `11f48bb`. Root cause fixed.

**Not modified:** every substantive public asset. No HTML page, no `api/` endpoint, no PDF.
