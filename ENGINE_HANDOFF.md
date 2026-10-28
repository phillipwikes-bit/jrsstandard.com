# Shared Engine Handoff

Updated: 2026-10-28
Repository: phillipwikes-bit/jrsstandard.com
Shared working branch: claude/study-completion-0.3.4-local

## Read this first

This is the shared entry point for Claude Code and ChatGPT/Codex.
Use this repository and branch for engine checkpoints; do not create a second
repository or make the owner transfer instructions between assistants.
Read AGENTS.md, CLAUDE.md and the operative architecture handoff.

This file establishes a checkpoint workflow. It is not an always-running
connection, automatic session launcher, or proof that another assistant has
received a change. A running session must fetch before it sees new commits.

## Verified shared source at setup

Inspected parent commit: 4f26d4c1b5293c0bada60630d5ec69e2fc58705c
Published frozen candidate: research/engine-repair-0.3.4-2026-10-27/candidate/
Published study machinery: research/study-completion-0.3.4-2026-10-28/
Candidate manifest SHA-256:
b454d4b858c81655b6ff56bde27a68c1ead9639305e2600a6fcf1746c8c304ad

The owner reports a later local 0.3.5 continuation and results. Those files are
not present in the inspected shared commit. Do not mistake the published 0.3.4
source for the latest local candidate. The assistant holding that checkout
must reconcile this documentation commit without discarding local changes,
then publish the authorized source checkpoint and update this file.

## Current task

Investigate and repair the irrelevant-evidence weakness on the actual latest
candidate. Separate quotation presence, claimed linkage and substantive support.
Human review is paused by owner direction while the repair is assessed.
Do not treat a universal INDETERMINATE result as a completed relevance repair.

Engine of record remains 0.3.1-candidate; B-018 stays open;
NO_GO_NOT_VERIFIED remains in effect. Verify current tracker evidence before
changing these statuses. Frozen candidates and original results are preserved.

## Shared checkpoint procedure

At task start:
1. Inspect local status and read existing work before changing files.
2. Fetch origin and inspect this shared branch. Preserve local-only work.
3. If clean, integrate only by fast-forward. If diverged or dirty, inspect both
   sides and reconcile deliberately. Never reset or overwrite unfamiliar work.
4. Read the latest handoff and tracker. Retrieve missing shared artifacts yourself.

At completion:
1. Run checks appropriate to the actual change; record commands and results.
2. Inspect the exact outgoing diff and explicitly stage reviewed files.
3. Update this handoff and append the tracker entry.
4. Commit with [skip ci] near the top of the message and push only this shared
   working branch under the owner's authorization. Never force-push.
5. Confirm the remote commit and changed-file contents by reading them back.
6. Report what was shared and anything still local. Do not claim another
   assistant has loaded a checkpoint until there is evidence.

Concurrent work: fetch immediately before a push. If the branch advanced,
inspect and reconcile it; do not overwrite it. Prefer one active engine editor
at a time. Do not launch another assistant or spend provider credits.

## Confidentiality and operational limits

The repository was verified PUBLIC at setup. Owner authorized proceeding with
the shared handoff despite public visibility. This checkpoint publishes only
coordination documents, not additional engine implementation or private data.

Do not commit credentials, private records, model captures, signed
authorizations, private archives, or excluded human answers. Inspect both the
staged diff and outgoing local commits before publishing further checkpoints.
The owner has requested shared engine access, but private data remains excluded.

No dispatch, live inference, merge to main, deployment, adoption, or change to
repository visibility is authorized by this workflow. [skip ci] is a precaution,
not proof of external hosting configuration. Do not modify hosting settings.

## Latest completed checkpoint

Author: ChatGPT/Codex
Change: shared handoff and standing instructions for both assistants.
Validation: preserved CLAUDE.md content, append-only tracker update, documentation
links and source paths checked; remote readback required before claiming success.
Engine behavior changed: none.
Next action: holder of the latest local candidate fetches this branch, preserves
and reconciles local work, then publishes its reviewed source and current test
commands. ChatGPT retrieves that checkpoint directly without owner file transfer.

## Engine test commands

No single command is asserted to cover the unavailable latest candidate.
Use its package README and applicable frozen manifests once synchronized.
Document exact offline commands and results here at that checkpoint.
Do not regenerate or overwrite frozen outputs to make checks pass.
