---
description: Initialize or audit the JRS repository control architecture. Inspect only; never rewrite substantive assets.
---
Inspect the repository and establish controlled state. Do NOT build software.

1. `pwd`, `git rev-parse --show-toplevel`, `git status --short --branch`, `git log -1 --oneline`.
2. Inventory without modifying.
3. Locate the authoritative baseline: `docs/enterprise-diligence/EVIDENCE_LEDGER.md` and `.../JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md`. Read them; do not rebuild from memory.
4. Ensure `.jrs/` exists with state, registries, gates, decisions, changes, reports, templates.
5. Create only MISSING control structures. Existing structure is preserved and mapped, not reorganized (CLAUDE.md Section 4).
6. Produce `.jrs/reports/INITIALIZATION_REPORT.md`.
7. Evaluate Gate 0 and STOP.

Never mark a gate passed because files exist.
