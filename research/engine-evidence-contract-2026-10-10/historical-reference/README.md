# Historical Reference: v1 Review Engine Candidate (0.1.0-validation)

**Reference ID (local, non-canonical):** `HREF-v1-0.1.0-validation-baebb512`

This directory exists **for controlled comparison only.** It is not a deployed artifact, not a public route, and not evidence of current Engine behaviour. The public routes in `api/` are 503 refusal stubs and are not affected by anything here.

| Item | Value |
|---|---|
| Source | `api/v1/review-engine.js` at commit `0177c5184182b5b1f51ff18c80da29f668996e49` |
| Git blob | `baebb512e5f296e1b41da138b7868aae4b6098fc` (the copy here hashes to the same blob ID) |
| Removed from working tree by | `0fb5c07` on 2026-10-04 |
| Copy | `v1-review-engine.0177c51.js.txt`, stored as `.txt` so it cannot be imported or executed |
| Element hashes | `HISTORICAL_REFERENCE_MANIFEST.json`: prompt, parser, condition keys, status values, determination logic, version labels |

**Do not modify this directory.** Any change requires a new reference ID and a new directory. `tests/engine-evidence-contract/run.mjs` recomputes the git blob ID and every element hash and fails on any difference. It also confirms that `lib/engine-assurance/candidate-core.mjs` still carries the same elements.

The presence of this file in git history does **not** reconcile blocker B-018: the three controlling source-aligned files remain unavailable.
