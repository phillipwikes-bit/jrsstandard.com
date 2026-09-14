---
description: Operate on the Review Engine under specification control.
---
Before any change: inspect the implementation in `api/`; inspect ALL OpenAPI specifications and identify conflicts; inspect tests; inspect model and version configuration; inspect telemetry; inspect data flow.

If specifications conflict, STOP before implementing a potentially incompatible change and raise a blocker.

Never represent functional operation as validation. Record model, model version, code version and schemas with every material evaluation (CLAUDE.md 21).
