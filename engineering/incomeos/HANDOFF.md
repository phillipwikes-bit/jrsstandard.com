# IncomeOS engineering handoff (agent-neutral)

For any engineering agent: ChatGPT, Codex, Claude Code or a person. Read this before acting. It is a recovery record, not an authorization. Whoever stops work updates the "Current checkpoint" section in the same pull request as the work.

Last updated: 2026-11-11, at the head of draft pull request #190.

## 1. Where things are

| Item | Location |
| --- | --- |
| Controlling directive, Version 10.3 | `docs/INCOMEOS_MASTER_DIRECTIVE.md` on branch `main` only. It is not on the IncomeOS branches. |
| IncomeOS source | Not on `main`. It lives on a stack of draft branches. |
| Integration head | `verification/incomeos-accounting-ci-20261108` (draft pull request #180), commit `f23caa77`. |
| Newest work | `claude/incomeos-directive-review-l6uofh` (draft pull request #190 into the integration head). |
| Owner Desk and ledger | `owner/incomeos/` |
| DS-N1 reviewer | `lib/ds-n1/`, bridge `owner/incomeos/ds-runtime-bridge.mjs`, CLI `owner/incomeos/ds-local-review.mjs`, programme `owner/incomeos/ds-program.js` |
| Tests | `tests/incomeos-*.mjs`, `tests/incomeos-*.test.cjs`, `tests/ds-n1/` |
| Dated evidence records | `engineering/incomeos/EXECUTION-EVIDENCE-YYYY-MM-DD.md` |
| Accounting acceptance register | `owner/incomeos/ACCOUNTING-EDITOR-ACCEPTANCE.json` |

The directive's "Current source recovery" section names branch `chatgpt/incomeos-v25-synthetic-review-sequence-20261106` and commit `5ec925aa`. Both are ancestors of the integration head. Start from the integration head, not from them.

Branch stack, oldest first: `main`, `feature/incomeos-owner-prototype-2026-11-01` (#91), `chatgpt/incomeos-v25-synthetic-review-sequence-20261106`, `chatgpt/incomeos-vault-envelope-validation-20261107` (#176), `verification/incomeos-accounting-ci-20261108` (#180), then #190.

Not in this stack: `chatgpt/incomeos-contact-first-vercel-20261110` (#187) forks from the older prototype base, and `claude/decision-spellchecker-ds-n1-2026-11-03` (#119) carries 60 DS-N1 commits that the stack does not contain. Neither has been reconciled with the integration head.

## 2. Working rules for two agents on one repository

1. Fetch first. Confirm the integration head and the open pull requests before trusting this file. If they differ from section 1, the repository is right and this file is stale.
2. One branch per agent per task, created from the integration head or from the newest merged work: `chatgpt/...`, `codex/...` or `claude/...`. Open a draft pull request into the integration head.
3. Do not push to, rebase or force-push another agent's branch. To build on unmerged work from another agent, branch from it and say so in the pull request.
4. Do not merge, mark ready, deploy or release. Those are owner decisions.
5. Do not merge IncomeOS branches into `main`, and do not merge `main` into them. The public JRS site and IncomeOS are separate.
6. Pushing an IncomeOS branch makes Vercel build a preview of the `incomeos-opportunity-desk` project automatically. Treat that as an effect of the push and report it.
7. Fictional records only for DS-N1. No real records, credentials or owner financial data in the repository, in tests or in a conversation.
8. Record what was executed, on which commit, with which tool versions, in a dated evidence record. State what was not run.

## 3. How to verify locally

Node 22. No install step for the source suites.

```bash
# DS-N1 workflow commands
node --test tests/incomeos-ds-runtime-bridge.mjs tests/incomeos-ds-local-server-boundary.mjs tests/incomeos-ds-evidence-export.mjs
node --test tests/ds-n1/ds-n1.test.mjs tests/ds-n1/cognitive-controls.test.mjs tests/ds-n1/cognitive-source-trace.test.mjs tests/ds-n1/reflective-guidance.test.mjs
node tests/incomeos-ds-program.mjs
node tests/incomeos-ds-original-verification.mjs
node tests/incomeos-source-boundary.mjs
node tests/incomeos-release-gate.mjs
```

Browser suites need `playwright-core` (the workflows pin 1.63.0) and a Chromium binary named in `INCOMEOS_BROWSER`:

```bash
INCOMEOS_BROWSER=/path/to/chromium node tests/incomeos-ds-panel-browser.mjs
INCOMEOS_BROWSER=/path/to/chromium node tests/incomeos-ds-program-browser.mjs
```

An agent that cannot run Node or a browser must say so and must not report those suites as passed. GitHub Actions on a draft pull request is the alternative source of executed results: `incomeos-dsn1-validation.yml` runs on pull requests that touch DS-N1 paths.

DS-N1 CLI, fictional input only:

```bash
node owner/incomeos/ds-local-review.mjs fictional-input.json ds-program.json [human-actions.json] [export-path.json]
```

`human-actions.json` is an array of actions, or `{"opened_at": "...Z", "actions": [...]}` to replay actions a human reviewer already recorded.

## 4. Current checkpoint

Assignment: DS-N1 Synthetic Reviewer integration. Status: INTEGRATION_IN_PROGRESS.

Done in #190, with executed evidence in `EXECUTION-EVIDENCE-2026-11-11.md`:

- The CLI now replays recorded reviewer actions into a verifiable evidence export. Before, it refused every action dated before the run.
- A CLI regression covers action and disposition retention, export tamper detection and ten refusal cases.
- The DS-N1 workflow runs on pull requests. GitHub Actions passed on `1b42e630`.
- Draft #179's four commits are carried into the stack. #179 can be closed by the owner once #190 is merged.

DS-N1 acceptance criteria, by state:

| Criterion | State |
| --- | --- |
| Actual DS-N1 engine invocation | Source tested (bridge and CLI) |
| Fictional-input enforcement | Source tested |
| Human reviewer actions, disposition retention | Source tested through bridge and CLI. Not yet inside the Owner Desk view. |
| Controlled evidence export | Source tested through the CLI. Unsigned internal hash check only. |
| Cognitive controls, human decision authority | Source tested |
| Financial-record isolation | Source tested (`incomeos-source-boundary`) |
| Development-only Owner Desk access | Not met. No browser route is registered, by design. |
| No customer or production access | Holds. Release and customer access are not authorized. |

Original SP-01 to SP-18 acceptance: 0 of 18. DS-A source: not recovered.

Accounting editor: eleven requirements SOURCE TESTED, A02 and A15 PROTECTED PREVIEW VERIFIED, A01 OWNER ACCEPTANCE PENDING, A14 and A16 BLOCKED. See `EXECUTION-EVIDENCE-2026-11-09.md`.

## 5. Blocked on the owner

These stop both the remaining DS-N1 criteria and accounting A14:

1. An approved nonproduction Supabase project for the staged revision editor.
2. Scoped migration access to that project.
3. Two operator-provisioned synthetic identities.
4. A decision on merging #190 into #180, and on the order in which the draft stack is merged.

Owner-only, later: physical iPhone and separate-session recovery acceptance, original-source custody and rights attestation, and the release decision.

## 6. Next executable action

With the items in section 5 still missing, the eligible source-level work is:

1. Reconcile `claude/decision-spellchecker-ds-n1-2026-11-03` (#119) against the stack: list which of its 60 commits change `lib/ds-n1/` behaviour that the stack lacks, and report before porting anything.
2. Reconcile `chatgpt/incomeos-contact-first-vercel-20261110` (#187) the same way.

Once section 5 items 1 to 3 exist: scoped migration preflight, two-identity hosted denial and append tests, interruption recovery, non-destructive rollback rehearsal, then the Owner Desk reviewer view behind that backend.
