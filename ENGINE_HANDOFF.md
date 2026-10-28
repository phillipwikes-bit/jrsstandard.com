# ENGINE HANDOFF

Shared handoff for the JRS Review Engine between Claude Code and ChatGPT. One repository: `phillipwikes-bit/jrsstandard.com`. Update this file at every completed, tested checkpoint.

**Last updated:** 2026-10-28 21:10 UTC by Claude Code (session `session_01C2VvunVHW3n8JJeZKqdXSV`).

## Status

| Item | Value |
|---|---|
| Repository visibility | **Public** (checked 2026-10-28 21:05 UTC). Engine material is not pushed until the owner decides (see Next action). |
| Shared working branch | `engine/shared-working`. **Local only; not pushed yet.** |
| Engine of record | `0.3.1-candidate`, `lib/engine-evidence-graph-v0.3.1-candidate/`. Unchanged. |
| Latest candidate on GitHub | `0.3.4-research-candidate`, `research/engine-repair-0.3.4-2026-10-27/candidate/`; manifest `CANDIDATE_0.3.4_MANIFEST_SHA256.txt` (SHA-256 `b454d4b8…`). Frozen. Branch `claude/engine-reliability-phase6-local` (draft PR #42). |
| Latest candidate overall | `0.3.5` study continuation, `research/study-continuation-0.3.5-2026-10-28/`; candidate manifest SHA-256 `9f96dd48…`. **Not on GitHub:** local commits `cc40006` to `c59e118` in run session `session_01GpJJWjNFRHDLvDBadw8Rxn` only. |
| Repair in progress | Irrelevant-evidence weakness. The next unused version is being built in the run session, local only. |
| Release status | `NO_GO_NOT_VERIFIED`. B-018 OPEN. No candidate adopted. Live dispatch off. No provider requests authorized. |

## Where things are

- **Engine of record:** `lib/engine-evidence-graph-v0.3.1-candidate/` (compiler, conditions, contract, quote resolution, graph validation).
- **Frozen candidates (never edit; new work goes in a new versioned directory):**
  - `0.3.2-candidate`: `research/engine-correction-v0-02-ev32-2026-10-25/candidate/`
  - `0.3.3-research-candidate`: `research/study-156-2026-10-27/candidate/`
  - `0.3.4-research-candidate`: `research/engine-repair-0.3.4-2026-10-27/candidate/`
  - `0.3.5`: `research/study-continuation-0.3.5-2026-10-28/`. Run session only; path as it will appear once pushed.
- **Studies:** `research/study-156-2026-10-27/` (0.3.3 offline study), `research/study-completion-0.3.4-2026-10-28/` (offline completion and the first live run tooling; branch `claude/study-completion-0.3.4-local`, draft PR #44).
- **Public boundary:** `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md` governs Engine and public-site work. Public review routes refuse submissions.
- **Records of state:** `research/MASTER_TRACKER.md`, `research/IP_SALE_TRACKER.md`, `.jrs/state/BLOCKERS.json`.

## Known defects (open)

1. **Irrelevant evidence weakens or erases a gap finding.**
   - 0.3.4 offline (scripted proposals): an irrelevant item that the record states as its basis gave CLEAR to over-claiming candidates in 64 of 126 cases. The flaw signal was lost in 132 of 210 ungrounded rows (`research/study-completion-0.3.4-2026-10-28/reports/CORRECTIONS_2026-10-28.md`, C-06).
   - 0.3.5 live run L2 (reported by the run session): 42 original records flagged in all three repeats; with an irrelevant basis inserted (one run each), 14 stayed FLAG and 28 became INDETERMINATE. The cause is under investigation in the run session; not yet established.
2. **Contract-format failures:** in live run L1 (0.3.4 prompt, `claude-haiku-5-5`), 17 of 66 responses were `candidate_response_invalid`, and stop rule SR-10 halted the run. L2 (0.3.5) reported no stop.
3. **Over-caution on sound records:** 0.3.4 offline false alarms on clean records rose from 2 to 10 of 62 (rule-aligned arm). In L1, of 27 records the AI references mark as sound, none cleared: 21 unresolved, 6 flagged.
4. **Scorer quotation totals do not add up** in L1 output (PRE: 12 in total against 18 by status). Not yet examined.
5. **Live protocol defects:** the run tool requires the authorization's `retention_location` to equal the run folder, and the post-enable offline re-check cannot pass (TL-30 and ER-08 assert dispatch is off).
6. **Indirect instructions:** 18 of 22 developer-written phrasings detected in 0.3.4 offline; real-model behaviour untested.

All agreement figures are against AI-proposed references, not human labels; they are not accuracy.

## Offline test commands

No provider calls. Run with `ANTHROPIC_BASE_URL` unset.

| Command (from the repository root unless noted) | Result at this checkpoint |
|---|---|
| `node tests/engine/auth-matrix.mjs` | pass, 10 of 10 |
| `node scripts/test_review_incomplete.mjs` | pass |
| `node tests/public-route-alignment.mjs` | pass, 17 of 17 |
| `git diff --check` | clean |
| `python3 scripts/check_zero_drift.py --offline` | 160 checks, 36 failed, 2 skipped. The 36 failures predate this work and are unchanged; exit 1 because of them. |
| `node tools/verify-seal.mjs` (in `research/engine-repair-0.3.4-2026-10-27/`) | 0.3.4 freeze seal ok: 1,083 files, 5 pins |
| `bash research/study-completion-0.3.4-2026-10-28/tools/run-all.sh <scratch>` | all steps passed at `2f4ec69`; not re-run here |
| 0.3.5 continuation suites | run session only; commands are in that package's README once pushed |

## Working rules for both assistants

1. At the start of each task, run `git fetch origin engine/shared-working`, read this file, and check `git log` for the other assistant's changes before editing.
2. Never edit a frozen candidate, its manifests or seals. New engine work goes in the next unused version, in a new directory.
3. Keep credentials, private records, captured model responses, journals and signed authorizations out of GitHub.
4. At each completed, tested checkpoint:
   - update this file (engine location, changes, test results, open defects, next action);
   - commit, check repository visibility, and push to `engine/shared-working` within the owner's authorization;
   - report the pushed commit SHA and list anything still local.
5. No merge, deploy, live dispatch, provider calls or candidate adoption without the owner's explicit authorization.
6. Resolve conflicting edits explicitly in a merge commit. Keep both assistants' work.

## Still local (not on GitHub)

- **This session (Claude Code):**
  - 24 commits on `claude/study-completion-0.3.4-local` beyond `4f26d4c1`: tracker lines, B-019 updates and correction C-11.
  - This branch, which adds this file.
- **Run session `session_01GpJJWjNFRHDLvDBadw8Rxn`:** the 0.3.5 package, the L1 and L2 result commits, and the repair in progress.
- **Private, never to GitHub:** captures and journals in both sessions' scratch folders. The owner holds private copies, to be deleted after 2026-11-27.

## Next action

- **Owner:** decide where engine material goes. Either make the repository private (then both assistants push engine work to this branch), or approve publishing it on this public repository. Until then nothing new is pushed.
- **Run session:** finish the irrelevant-evidence investigation and repair offline, then push to this branch only after the owner's decision. After that, Claude Code merges its local records into the branch and pushes.

## Checkpoint log

| When (UTC) | Who | Checkpoint | Pushed SHA |
|---|---|---|---|
| 2026-10-28 21:10 | Claude Code | Handoff created; repository found public; minimum checks pass; drift guard unchanged | not pushed (repository public) |
