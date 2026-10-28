# Shared Engine Handoff

Updated: 2026-10-28 (Claude Code run session `session_01GpJJWjNFRHDLvDBadw8Rxn`, publishing the 0.3.5 and 0.3.6 research checkpoints)
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
| Latest candidates (published here as **non-adopted research checkpoints**) | `0.3.5-research-candidate`, `research/study-continuation-0.3.5-2026-10-28/`, candidate manifest SHA-256 `9f96dd487fe968b7589124116ce7218f1c010ad8a3a482559212ebbc49020e92` (prompt fix; live run L2 finished). `0.3.6-research-candidate`, `research/irrelevant-basis-0.3.6-2026-10-28/`, candidate manifest SHA-256 `99e0cae827f3fb64c5e6f5d6b411be8dee92b9ed45a2121e289af51548cd780c`: a **partial safeguard, not a repair** (owner classification). |
| Repair in progress | Expanded irrelevant-evidence repair (owner instruction, 2026-10-28), started offline in run session `session_01GpJJWjNFRHDLvDBadw8Rxn`. Not yet published. |
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
  - `0.3.5-research-candidate`: `research/study-continuation-0.3.5-2026-10-28/candidate/` (0.3.4 compiler, corrected prompt; live tooling, scorer v2, plan and results in the same package).
  - `0.3.6-research-candidate`: `research/irrelevant-basis-0.3.6-2026-10-28/candidate/` (partial safeguard; investigation, 42-pair comparison, tests and cost report in the same package).
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
   - 0.3.5 live run L2: 42 originals flagged in all three repeats. With an irrelevant basis inserted (one run each), 14 stayed FLAG and 28 became INDETERMINATE.
   - **Cause established offline (28 of 28, controlled replays):** compiler linkage RP-SRP-09 counts a stated link ("The decision rests on ...", read as a decision sentence, 8; "This outcome was based on ...", 20) as decision-linked evidence regardless of relevance, which switches off the absence gaps. Not the model's proposal. `research/irrelevant-basis-0.3.6-2026-10-28/reports/ROOT_CAUSE_AND_REPAIR.md`.
   - **0.3.6 partial safeguard:** a stated link supports nothing unless a named person has assessed its relevance; no flag lost or added on the same proposals, but supported findings and CLEAR fall to zero without human assessments, and the 28 stay INDETERMINATE. It does not distinguish relevant from irrelevant evidence. Open.
2. **Contract-format failures:** in live run L1 (0.3.4 prompt, `claude-haiku-5-5`), 17 of 66 responses were `candidate_response_invalid` (16: an identifier limit the prompt never stated; 1: an unlisted condition name), and stop rule SR-10 halted the run. Corrected by the 0.3.5 prompt: L2 had 401 of 401 usable responses. Closed for L2.
3. **Over-caution on sound records:**
   - 0.3.4 offline: false alarms on clean records rose from 2 to 10 of 62.
   - L1: of 27 records marked sound, none was cleared; 21 were unresolved and 6 flagged.
4. **Scorer quotation totals did not reconcile** in L1 output (PRE: 12 in total against 18 by status): two counting units and fenced responses counted as 0. Corrected in scorer v2 (`research/study-continuation-0.3.5-2026-10-28/tools/live/score-live-v2.mjs`); dated correction in `research/study-completion-0.3.4-2026-10-28/reports/LIVE_RESULTS_CORRECTION_2026-10-28.md`. Closed.
5. **Live protocol defects:** the run tool requires `retention_location` to equal the run folder, and the post-enable offline re-check cannot pass (TL-30 and ER-08 assert dispatch is off).
6. **Indirect instructions:** 18 of 22 developer-written phrasings detected in 0.3.4 offline; real-model behaviour untested.

## Engine test commands

No provider calls. Run with `ANTHROPIC_BASE_URL` unset. Do not regenerate or overwrite frozen outputs to make checks pass. No single command covers the unpublished 0.3.5 candidate; its package README gives its commands once it is published.

| Command (from the repository root unless noted) | Result at the 2026-10-28 21:15 UTC checkpoint (`87186653`) |
|---|---|
| `node tests/engine/auth-matrix.mjs` | pass, 10 of 10 |
| `node scripts/test_review_incomplete.mjs` | pass |
| `node tests/public-route-alignment.mjs` | pass, 17 of 17 |
| `git diff --check` | clean |
| `python3 scripts/check_zero_drift.py --offline` | 160 checks, 36 failed, 2 skipped. The 36 failures predate this work; exit 1 because of them. |
| `node tools/verify-seal.mjs` (run in `research/engine-repair-0.3.4-2026-10-27/`) | 0.3.4 freeze seal ok: 1,083 files, 5 pins |
| `bash research/study-completion-0.3.4-2026-10-28/tools/run-all.sh <scratch>` | all steps passed at `2f4ec69`; not re-run at this checkpoint |
| `node tools/freeze-continuation.mjs` (in `research/study-continuation-0.3.5-2026-10-28/`) | 17 of 17 checks; freeze `d5533a07…`, plan `5273c4db…` (this checkpoint) |
| `bash tools/run-all.sh <scratch> [<private L1 run dir>]` (in `research/study-continuation-0.3.5-2026-10-28/`) | all steps passed at `cc40006` (machinery 42/42, rehearsal 9/9, mutation 26/26, corrections 16/16) |
| `node tools/test-repair.mjs <scratch>` (in `research/irrelevant-basis-0.3.6-2026-10-28/`) | 12 of 12 as expected; 8 of 8 mutants killed; exit-code self-check 1/0 (this checkpoint) |
| `bash tools/run-all.sh <scratch> <private L2 run dir>` (in `research/irrelevant-basis-0.3.6-2026-10-28/`) | all steps passed at `58eaa46`; needs the private captures, so other assistants can run only `test-repair.mjs` |

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
- The unpublished engine material (the 0.3.5 source and the repair) therefore stayed local until the owner decided.
- **Owner decision (2026-10-28):** the repository stays public; publish the reviewed 0.3.5 and 0.3.6 materials as non-adopted research checkpoints, label 0.3.6 a partial safeguard, exclude credentials, private records, raw captures, journals and signed authorizations (given in the parent session at 21:24, 21:31 and 21:40 UTC, and typed by the owner in the run session).
- Checkpoints of coordination documents and records continue meanwhile.

Do not commit credentials, private records, model captures, journals, signed authorizations, private archives or excluded human answers. Inspect both the staged diff and outgoing local commits before publishing further checkpoints. The owner has requested shared engine access, but private data remains excluded.

This workflow does not authorize dispatch, live inference, merge to `main`, deployment, adoption, or a change to repository visibility. `[skip ci]` is a precaution, not proof of external hosting configuration. Do not modify hosting settings. Markdown files are excluded from deployment by `.vercelignore` (`*.md`).

## Still local (not on GitHub)

- **Run session `session_01GpJJWjNFRHDLvDBadw8Rxn`:** the expanded irrelevant-evidence repair (started; not yet published).
- **Private, never to GitHub:** captures and journals of L1 (69) and L2 (401), both signed authorizations and the owner's verbatim approvals, in the run session's scratch folders. The owner holds private copies, to be deleted after 2026-11-27.

## Next action

- **Run session:** carry out the expanded irrelevant-evidence repair offline (reserved challenge set before tuning; relevance-specific support; mutation tests); publish it as its own checkpoint once verified.
- **ChatGPT/Codex:** fetch this branch and read this file. The 0.3.5 and 0.3.6 sources are now here.
- **Owner:** blinded human review stays paused by owner direction while the repair is assessed.

## Latest completed checkpoint

- **Author:** Claude Code (run session `session_01GpJJWjNFRHDLvDBadw8Rxn`).
- **Change:** published the 0.3.4 completion live-run records (L1), the 0.3.5 continuation (candidate, live tooling, scorer v2, plan, L2 results) and the 0.3.6 partial safeguard with its investigation, as non-adopted research checkpoints; merged shared head `0fcf042` first (tracker kept both sides; this file, `AGENTS.md` and `CLAUDE.md` from origin).
- **Validation:** auth matrix 10/10; review-incomplete pass; route alignment 17/17; `git diff --check` clean; zero-drift 160 checks, the same 36 pre-existing failures as the shared head, 2 skipped; 0.3.4 seal ok; 0.3.5 freeze 17/17; 0.3.6 repair tests 12/12 and 8/8 mutants. Every sender has `LIVE_DISPATCH_ENABLED = false`. The frozen 0.3.1, 0.3.2, 0.3.3 and 0.3.4 directories are unchanged against the shared head.
- **Exclusion review of every outgoing commit and message:** configured key value 0 occurrences; generic credential patterns 2 matches, both code (a header builder taking a variable, a fake test fixture); no capture, journal, signed authorization, verbatim approval, private-run file, archive or completed human-review file.
- **Engine behavior changed:** none on the engine of record. New research candidates only.
- **Next action:** see above.

## Checkpoint log

| When (UTC) | Who | Checkpoint | Commit |
|---|---|---|---|
| 2026-10-28 21:08 | ChatGPT/Codex | Shared handoff, `AGENTS.md`, `CLAUDE.md` pointer, tracker section | `b11a487a` |
| 2026-10-28 21:11 | Claude Code | Local handoff draft on `engine/shared-working` | `4f63c1de`, published as part of the history of `87186653` |
| 2026-10-28 21:15 | Claude Code | Reconciled the two handoff drafts; published local records (tracker entries, B-019 updates, correction C-11 to the live-run key instructions) | `87186653` |
| 2026-10-28 21:21 | Claude Code | Corrected checkpoint times | `3583fe3a` |
| 2026-10-28 | Claude Code (run session) | Published 0.3.5 and 0.3.6 as non-adopted research checkpoints (0.3.6: partial safeguard) | the commit carrying this file |

**Correction (2026-10-28 21:21 UTC).** The `87186653` version of this file gave 21:25 for the reconciliation and 21:10 for the local draft, and called the draft unpublished. The commit timestamps are 21:15:39 and 21:11:36 UTC, and the draft commit is in the published history. The times had been estimated instead of read from the record.
