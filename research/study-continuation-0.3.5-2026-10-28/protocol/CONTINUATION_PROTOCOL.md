# Continuation protocol: arm L2 (0.3.5), after run RUN-LIVE-AUTH-20261028-01 stopped on SR-10

Dated 2026-10-28. Status: **PROPOSED; not authorized. Live dispatch is disabled** (`tools/live/sender-bound.mjs`, `LIVE_DISPATCH_ENABLED = false`). 0.3.1-candidate stays the engine of record; B-018 OPEN; NO_GO_NOT_VERIFIED; nothing is adopted.

## 1. Relation to the stopped run

- **Original run unchanged.** Arm L1 (0.3.4, run RUN-LIVE-AUTH-20261028-01) keeps its journal, 69 captures and `research/study-completion-0.3.4-2026-10-28/results/LIVE_RESULTS.json`, with the dated correction beside them. Nothing here rewrites or reclassifies them.
- **Separate arm.** L2 uses a changed prompt (0.3.5), so it is a separate study arm, with its own record set (same 401 requests, new bodies), plan, journal and results (`results/LIVE_RESULTS.json` in this package).
- **No pooling.** L1 and L2 results are reported side by side and never combined into one run.
- **The old authorization does not apply.** RUN-LIVE-AUTH-20261028-01 names the 0.3.4 study, candidate, prompt, plan and record set. `tools/live/authorization-bound.mjs` refuses it by study name, by every hash, and by identifier (it is listed as never valid).

## 2. Sequence

1. **PRE (3 requests: S-001, S-003, S-008) is repeated first.** The PRE gate (`protocol/LIVE_RUN_PLAN.md`) must pass before any RUN or TGT request.
2. **RUN (312 requests)** runs only if the PRE gate passes: 104 eligible records, three repeats, repeat-major order.
3. **TGT (86 requests)** runs after RUN: 42 stated-irrelevant-basis constructions and 44 instruction cases.
4. **Scoring** uses `tools/live/score-live-v2.mjs` (real mode writes `results/LIVE_RESULTS.json`), against AI-proposed references only. Agreement is not accuracy. Human labels are not needed to run or score, and human agreement stays unmeasured until labels are imported.

## 3. Caps and stop conditions (all retained from the 0.3.4 plan)

| | PRE only | PRE, then RUN and TGT |
|---|---|---|
| Requests | 3 | 401 |
| Attempts | 9 | 450 |
| Spend cap | USD 0.05 | USD 1.00 |
| Typical estimate | USD 0.0015 | USD 0.19 (0.3.4 run measured USD 0.000477 per request) |

Stop rules SR-01 to SR-18 are unchanged (`protocol/LIVE_RUN_PLAN.md`), including **SR-10**: in RUN or TGT, ten or more quote-only contract failures that are also more than 25% of completed requests. The spend, request and attempt caps stop the run (SR-12). Retries, pacing, the destination allow-list, the hash-chained write-through journal, private capture storage outside git and the child-process compile without the credential are the 0.3.4 controls, ported unchanged and re-tested (`out/` test outputs).

## 4. Enabling (only after a signed authorization exists)

1. The owner completes `authorization/LIVE_AUTHORIZATION_DRAFT.json` with a new identifier and keeps the signed file outside the repository. It needs the phases and caps, expiry, retention location (equal to the run directory), retention deletion rule, provider retention, `stop_rules_approved: true`, signature and date.
2. The key is in the environment variable the authorization names (never pasted into a conversation).
3. One change, in its own commit: `LIVE_DISPATCH_ENABLED = false` becomes `true` in `tools/live/sender-bound.mjs`. The plan hashes the sender with that line normalized; any other change voids the plan.
4. With `ANTHROPIC_BASE_URL` unset: `node tools/live/run-live.mjs --authorization <signed file> --run-dir <retention location> --scratch <scratch>`.
5. Afterwards the flag goes back to `false` in its own commit. Then score with `node tools/live/score-live-v2.mjs <run dir> <scratch>`.

Known from the 0.3.4 run: the offline pipeline's flag-is-false check (`tools/build-plan.mjs`) fails while dispatch is enabled. Run `bash tools/run-all.sh` before step 3, not after it.
