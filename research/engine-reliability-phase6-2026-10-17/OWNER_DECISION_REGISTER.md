# Owner Decision Register

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

Questions only. No decision is recorded or implied here. Source: `workbench/decisions.mjs`, also shown on `workbench/decisions.html`.

## Decisions taken during Phase 6 (by the owner, in session)

| Date | Decision |
|---|---|
| 2026-10-17 | Phase 6 assignment: local, uncommitted work on `claude/engine-reliability-phase6-local` |
| 2026-10-19 | Resume after the MU-51 stop. Add one duplicated-limitation probe, re-run the mutation group, then finish the remaining work. Keep P6-RT-07 open with no fix. Keep the tool path and report the Phase 4 conflict. |

## Open decisions

| ID | Question | Basis |
|---|---|---|
| OD-01 | Authorize, or decline, a separately scoped Engine change for P6-RT-07 | P6K-009 |
| OD-02 | How to treat the Phase 4 preservation check that fails because Phase 6 required a new file under `tools/` (declared cross-package compatibility conflict) | `PRIOR_SUITE_RESULTS.json` |
| OD-03 | Whether the router should keep failing closed when a new intake refusal supersedes earlier quotation refusals | P6K-011, P6-ST-18 |
| OD-04 | For each reproduced open failure P6K-001 to P6K-008: propose an Engine change, document a permanent boundary, or leave open | Library results |
| OD-05 | Whether the baseline should obtain the intake gate for v0.2 long-record cases (requires a v0.2 replay change) | P6K-012 |
| OD-06 | Whether, when and where to commit Phase 6 material in a public repository | Assignment boundary |
| OD-07 | Which future independent evaluation, if any, should examine P6K-001, P6K-002 and P6K-008 | Register flags |
