# Irrelevant-basis investigation and 0.3.6-research-candidate

Dated 2026-10-28. **STATUS: NON-ADOPTED RESEARCH CHECKPOINT. 0.3.6 IS A PARTIAL SAFEGUARD, NOT A REPAIR** (owner classification, 2026-10-28): it stops a stated link from supporting a finding or producing a clean result, but it cannot tell relevant evidence from irrelevant evidence, and the 28 weakened findings stay INDETERMINATE. Offline; no provider request sent. 0.3.1-candidate stays the engine of record; B-018 OPEN; NO_GO_NOT_VERIFIED. Disposition as first recorded: BOUNDED_REPAIR_IMPLEMENTED_OFFLINE; reclassified by the owner as a partial safeguard.

| What | Where |
|---|---|
| Root cause, repair, cost, residual limits, reproduction | `reports/ROOT_CAUSE_AND_REPAIR.md` |
| 42-pair comparison (machine-readable; summary table) | `out/PAIR_COMPARISON.json`, `reports/PAIR_COMPARISON.md` |
| Behavioural tests, failing before and passing after, with mutants | `out/REPAIR_TESTS.json` |
| Cost on the same proposals (401 live replays, 624 scripted) | `out/COST_COMPARISON.json`, `reports/COST_COMPARISON.md` |
| Frozen 0.3.4 suites on 0.3.5 and 0.3.6 | `out/FROZEN_SUITES.json` |
| Candidate 0.3.6 and its exact changes | `candidate/`, `CANDIDATE_0.3.6_MANIFEST_SHA256.txt`, `CHANGES_FROM_0.3.5.md` |
| All offline steps | `bash tools/run-all.sh <scratch> <private run dir>` |

No record text, quotation text or capture is stored here; the inserted sentences are the frozen synthetic pool. The original live run, its captures and its results are unchanged.
