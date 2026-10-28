# Shared Engine Handoff

Updated: 2026-10-28 21:25 UTC (Claude Code, reconciling two concurrent drafts)
Repository: phillipwikes-bit/jrsstandard.com (verified **public** on 2026-10-28)
Shared working branch: `claude/study-completion-0.3.4-local`

## Read this first

This is the shared entry point for Claude Code and ChatGPT/Codex.
- Use this repository and branch for engine checkpoints. Do not create a second repository, and do not make the owner carry instructions between assistants.
- Read `AGENTS.md`, `CLAUDE.md` and the operative architecture handoff (`docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`).

This file sets up a checkpoint workflow. It is not an always-running connection, an automatic session launcher, or proof that another assistant has received a change. A running session must fetch before it sees new commits.

**Reconciliation note (2026-10-28).** Two drafts of this file were written at the same time:
- ChatGPT/Codex published one in `b11a487a`.
- Claude Code drafted one locally, on a branch named `engine/shared-working`.

This file merges both. That branch name is retired, so use the shared working branch above. Nothing in either draft was dropped: ChatGPT/Codex's procedure and limits are kept as written, and Claude Code's status, locations, defects and test results are added.

## Status

| Item | Value |
|---|---|
| Engine of record | `0.3.1-candidate`, `lib/engine-evidence-graph-v0.3.1-candidate/`. Unchanged. |
| Latest candidate on GitHub | `0.3.4-research-candidate`, `research/engine-repair-0.3.4-2026-10-27/candidate/`; manifest SHA-256 `b454d4b858c81655b6ff56bde27a68c1ead9639305e2600a6fcf1746c8c304ad`. Frozen. |
| Latest candidate overall | `0.3.5` study continuation, `research/study-continuation-0.3.5-2026-10-28/`; candidate manifest SHA-256 `9f96dd48…`. **Not on GitHub:** local commits `cc40006`, `e87fca0`, `46139d2`, `c59e118` in Claude Code run session `session_01GpJJWjNFRHDLvDBadw8Rxn` only. |
| Repair in progress | Irrelevant-evidence weakness. The next unused version is being built and tested offline in that run session; local only. |
| Release status | `NO_GO_NOT_VERIFIED`. B-018 OPEN. No candidate adopted. Live dispatch off. No provider requests authorized. |

## Verified shared source at setup (ChatGPT/Codex, `b11a487a`)

- Inspected parent commit: `4f26d4c1b5293c0bada60630d5ec69e2fc58705c`
- Published frozen candidate: `research/engine-repair-0.3.4-2026-10-27/candidate/`
- Published study machinery: `research/study-completion-0.3.4-2026-10-28/`
- Candidate manifest SHA-256: `b454d4b858c81655b6ff56bde27a68c1ead9639305e2600a6fcf1746c8c304ad`

The owner reports a later local 0.3.5 continuation and results. Those files are not in the shared commit, so do not mistake the published 0.3.4 source for the latest candidate. The assistant holding that checkout must reconcile this branch without discarding local changes, publish the authorized source checkpoint, and update this file.

## Where things are

- **Engine of record:** `lib/engine-evidence-graph-v0.3.1-candidate/`.
- **Frozen candidates (never edit; new work goes in a new versioned directory):**
  - `0.3.2-candidate`: `research/engine-correction-v0-02-ev32-2026-10-25/candidate/`
  - `0.3.3-research-candidate`: `research/study-156-2026-10-27/candidate/`
  - `0.3.4-research-candidate`: `research/engine-repair-0.3.4-2026-10-27/candidate/`
  - `0.3.5`: `research/study-continuation-0.3.5-2026-10-28/`. Path as it will appear once published.
- **Studies:**
  - `research/study-156-2026-10-27/`: the 0.3.3 offline study.
  - `research/study-completion-0.3.4-2026-10-28/`: the offline completion, and the tooling for the first live run (L1).
- **Records of state:** `research/MASTER_TRACKER.md`, `research/IP_SALE_TRACKER.md`, `.jrs/state/BLOCKERS.json`.

## Current task

Investigate and repair the irrelevant-evidence weakness on the actual latest candidate.
- Separate quotation presence, claimed linkage and substantive support.
- Human review is paused by owner direction while the repair is assessed.
- Do not treat a universal INDETERMINATE result as a completed relevance repair.

The work is under way in run session `session_01GpJJWjNFRHDLvDBadw8Rxn`, which holds the 0.3.5 package and the private captures.

Engine of record remains `0.3.1-candidate`; B-018 stays open; `NO_GO_NOT_VERIFIED` remains in effect. Verify current tracker evidence before changing these statuses. Frozen candidates and original results are preserved.

## Known defects (open)

All agreement figures below are against AI-proposed references, not human labels, so they are not accuracy.

1. **Irrelevant evidence weakens or erases a gap finding.**
   - 0.3.4 offline (scripted proposals): an irrelevant item the record states as its basis gave CLEAR to over-claiming candidates in 64 of 126 cases. The flaw signal was lost in 132 of 210 ungrounded rows (`research/study-completion-0.3.4-2026-10-28/reports/CORRECTIONS_2026-10-28.md`, C-06).
   - 0.3.5 live run L2, as reported by the run session: 42 originals flagged in all three repeats. With an irrelevant basis inserted (one run each), 14 stayed FLAG and 28 became INDETERMINATE. The cause is not yet established.
2. **Contract-format failures:** in live run L1 (0.3.4 prompt, `claude-haiku-5-5`), 17 of 66 responses were `candidate_response_invalid`, and stop rule SR-10 halted the run. L2 (0.3.5) reported no stop.
3. **Over-caution on sound records:**
   - 0.3.4 offline: false alarms on clean records rose from 2 to 10 of 62.
   - L1: of 27 records marked sound, none was cleared; 21 were unresolved and 6 flagged.
4. **Scorer quotation totals do not reconcile** in L1 output (PRE: 12 in total against 18 by status). Not yet examined.
5. **Live protocol defects:** the run tool requires `retention_location` to equal the run folder, and the post-enable offline re-check cannot pass (TL-30 and ER-08 assert dispatch is off).
6. **Indirect instructions:** 18 of 22 developer-written phrasings detected in 0.3.4 offline; real-model behaviour untested.

## Engine test commands

No provider calls. Run with `ANTHROPIC_BASE_URL` unset. Do not regenerate or overwrite frozen outputs to make checks pass. No single command covers the unpublished 0.3.5 candidate; its package README gives its commands once it is published.

| Command (from the repository root unless noted) | Result at the 2026-10-28 21:25 UTC checkpoint |
|---|---|
| `node tests/engine/auth-matrix.mjs` | pass, 10 of 10 |
| `node scripts/test_review_incomplete.mjs` | pass |
| `node tests/public-route-alignment.mjs` | pass, 17 of 17 |
| `git diff --check` | clean |
| `python3 scripts/check_zero_drift.py --offline` | 160 checks, 36 failed, 2 skipped. The 36 failures predate this work; exit 1 because of them. |
| `node tools/verify-seal.mjs` (run in `research/engine-repair-0.3.4-2026-10-27/`) | 0.3.4 freeze seal ok: 1,083 files, 5 pins |
| `bash research/study-completion-0.3.4-2026-10-28/tools/run-all.sh <scratch>` | all steps passed at `2f4ec69`; not re-run at this checkpoint |

## Shared checkpoint procedure

At task start:
1. Inspect local status and read existing work before changing files.
2. Fetch origin and inspect this shared branch. Preserve local-only work.
3. If clean, integrate only by fast-forward. If diverged or dirty, inspect both sides and reconcile deliberately. Never reset or overwrite unfamiliar work.
4. Read the latest handoff and tracker. Retrieve missing shared artifacts yourself.

At completion:
1. Run checks appropriate to the actual change; record commands and results.
2. Inspect the exact outgoing diff and explicitly stage reviewed files.
3. Update this handoff and append the tracker entry.
4. Commit with `[skip ci]` near the top of the message, and push only this shared working branch under the owner's authorization. Never force-push.
5. Confirm the remote commit and changed-file contents by reading them back.
6. Report what was shared and anything still local. Do not claim another assistant has loaded a checkpoint until there is evidence.

**Concurrent work:** fetch immediately before a push. If the branch advanced, inspect and reconcile it; do not overwrite it. Prefer one active engine editor at a time. Do not launch another assistant or spend provider credits.

## Confidentiality and operational limits

**As recorded by ChatGPT/Codex:** "The repository was verified PUBLIC at setup. Owner authorized proceeding with the shared handoff despite public visibility. This checkpoint publishes only coordination documents, not additional engine implementation or private data."

**Claude Code addition:**
- The owner's instruction to Claude Code (2026-10-28) is to report public visibility before publishing engine material. Claude Code made that report at 21:12 UTC.
- The unpublished engine material (the 0.3.5 source and the repair) therefore stays local until the owner decides, either by making the repository private or by approving publication here.
- Checkpoints of coordination documents and records continue meanwhile.

Do not commit credentials, private records, model captures, journals, signed authorizations, private archives or excluded human answers. Inspect both the staged diff and outgoing local commits before publishing further checkpoints. The owner has requested shared engine access, but private data remains excluded.

This workflow does not authorize dispatch, live inference, merge to `main`, deployment, adoption, or a change to repository visibility. `[skip ci]` is a precaution, not proof of external hosting configuration. Do not modify hosting settings. Markdown files are excluded from deployment by `.vercelignore` (`*.md`).

## Still local (not on GitHub)

- **Run session `session_01GpJJWjNFRHDLvDBadw8Rxn`:** the 0.3.5 package, the L1 and L2 result commits, and the repair in progress.
- **Private, never to GitHub:** captures and journals in the Claude Code sessions' scratch folders. The owner holds private copies, to be deleted after 2026-11-27.

## Next action

- **Owner:** decide where engine material goes. Either make the repository private, or approve publishing the 0.3.5 source and the repair here.
- **Run session:** finish the irrelevant-evidence investigation and repair offline. Then fetch this branch, reconcile, and publish its reviewed source here once the owner has decided.
- **ChatGPT/Codex:** fetch this branch and read this file. The latest engine source is not here yet.

## Latest completed checkpoint

- **Author:** Claude Code (session `session_01C2VvunVHW3n8JJeZKqdXSV`).
- **Change:**
  - reconciled the two handoff drafts;
  - published Claude Code's local records: tracker entries, B-019 updates, correction C-11 to the live-run key instructions, and this file.
- **Validation:** the commands above; drift guard verdicts unchanged; outgoing diff inspected; a secret-pattern scan of the added lines found none.
- **Engine behavior changed:** none.
- **Next action:** see above.

## Checkpoint log

| When (UTC) | Who | Checkpoint | Commit |
|---|---|---|---|
| 2026-10-28 21:08 | ChatGPT/Codex | Shared handoff, `AGENTS.md`, `CLAUDE.md` pointer, tracker section | `b11a487a` |
| 2026-10-28 21:10 | Claude Code | Local handoff draft on `engine/shared-working` | not published; merged here |
| 2026-10-28 21:25 | Claude Code | Reconciled handoff; published local records | the merge commit carrying this file |
