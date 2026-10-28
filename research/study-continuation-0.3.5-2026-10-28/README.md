# Study continuation 0.3.5 (arm L2): corrected prompt and corrected scorer

Dated 2026-10-28. **Frozen for review; not authorized; live dispatch disabled; nothing adopted.** 0.3.1-candidate stays the engine of record; B-018 OPEN; NO_GO_NOT_VERIFIED.

This package continues the existing JRS records study after run RUN-LIVE-AUTH-20261028-01 (0.3.4, arm L1) stopped on SR-10. It is not a new study and not a rebuild: the records, requests, compiler, rules, stop rules and safety controls are the 0.3.4 ones.

| What | Where |
|---|---|
| Exact changes from 0.3.4 (prompt states the validator's identifier rule; prompt version constant) | `CHANGES_FROM_0.3.4.md` |
| Candidate 0.3.5 (0.3.4 compiler, 0.3.5 prompt) and its manifest | `candidate/`, `CANDIDATE_0.3.5_MANIFEST_SHA256.txt` |
| Corrected scorer, version 2 (version 1 preserved in the completion package) | `tools/live/score-live-v2.mjs` |
| Frozen identities, with the checks behind them | `CONTINUATION_FREEZE.json` |
| Continuation protocol (separate arm, no pooling, PRE first, caps, enabling) | `protocol/CONTINUATION_PROTOCOL.md` |
| Plan (generated; hashes every executed file) and unsigned authorization draft | `protocol/LIVE_RUN_PLAN.json`, `protocol/LIVE_RUN_PLAN.md`, `authorization/LIVE_AUTHORIZATION_DRAFT.json` |
| Tests of the corrections; ported machinery tests, rehearsal and mutation tests | `out/CORRECTION_TESTS.json`, `out/LIVE_MACHINERY_TESTS.json`, `out/ENABLE_REHEARSAL.json`, `out/LIVE_MUTATION_TESTS.json` |
| Every offline step | `bash tools/run-all.sh <scratch> [<private run dir of the 0.3.4 run>]` |

The live tooling under `tools/` is ported from `research/study-completion-0.3.4-2026-10-28/tools/`. The changes are paths, the candidate identity, the study name, the sender version, the authorizations that are never valid, the harness, and scorer version 2. The original files are unchanged.
