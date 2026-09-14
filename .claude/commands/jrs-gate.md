---
description: Evaluate a gate. Usage: /jrs-gate 0
---
Read `.jrs/gates/GATE_<n>_*.md` and the registries it depends on.

Return PASS, PASS WITH CONDITIONS, BLOCKED or NOT READY, with the evidence for each criterion.

Never mark a gate passed solely because files exist. A criterion with no evidence is NOT ESTABLISHED, not a pass.
