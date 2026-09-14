---
description: Report current JRS program state from persistent files, not memory.
---
Read `.jrs/state/PROGRAM_STATE.json`, `CURRENT_PHASE.json`, `ACTIVE_GATE.json`, `BLOCKERS.json`, then `git status`.

Return: Current Phase · Current Gate · Gate Status · Assets · Evidence · Rights Gaps · Claims · Validation · Security · Commercial Readiness · Blockers · Deferred Architecture · Next Required Action.

Report what the files say. If state is stale relative to Git, say so rather than reconciling silently.
