# IncomeOS engineering handoff (agent-neutral)

For any engineering agent: ChatGPT, Codex, Claude Code or a person. Read this before acting. It is a recovery record, not an authorization. Whoever stops work updates the "Current checkpoint" section in the same pull request as the work.

Last updated: 2026-11-11, with pull request #190.

## 1. Where things are

| Item | Location |
| --- | --- |
| Controlling directive, Version 10.3 | `docs/INCOMEOS_MASTER_DIRECTIVE.md` on branch `main` only. It is not on the IncomeOS branches. |
| IncomeOS source | Not on `main`. It lives on a stack of draft branches. |
| Integration branch | `verification/incomeos-accounting-ci-20261108`. This is the one branch every agent starts from and opens pull requests into. Confirm its head with `git fetch`. |
| Owner Desk and ledger | `owner/incomeos/` |
| DS-N1 reviewer | `lib/ds-n1/`, bridge `owner/incomeos/ds-runtime-bridge.mjs`, CLI `owner/incomeos/ds-local-review.mjs`, programme `owner/incomeos/ds-program.js` |
| Tests | `tests/incomeos-*.mjs`, `tests/incomeos-*.test.cjs`, `tests/ds-n1/` |
| Dated evidence records | `engineering/incomeos/EXECUTION-EVIDENCE-YYYY-MM-DD.md` |
| Accounting acceptance register | `owner/incomeos/ACCOUNTING-EDITOR-ACCEPTANCE.json` |

The directive's "Current source recovery" section names branch `chatgpt/incomeos-v25-synthetic-review-sequence-20261106` and commit `5ec925aa`. Both are ancestors of the integration head. Start from the integration head, not from them.

### Branches measured against the integration branch on 2026-11-11

Already contained in it, so nothing further to take from them: `chatgpt/incomeos-v23-product-integration-20261105`, `chatgpt/incomeos-v25-synthetic-review-sequence-20261106`, `chatgpt/incomeos-vault-envelope-validation-20261107` (#176), and the four commits of #179.

Not contained. None of these has been ported. Porting any of them is a separate task with its own pull request.

| Branch | What it holds that the integration branch lacks | Trial merge |
| --- | --- | --- |
| `feature/incomeos-owner-prototype-2026-11-01` (#91) | 100 non-merge commits, all from `main` merged into it (public-site work). No IncomeOS work is missing. The integration branch is 396 commits ahead of it. | Clean |
| `chatgpt/incomeos-contact-first-vercel-20261110` (#187) | 15 commits: encrypted contact profile (`owner/incomeos/contact-profile.js`), two tests, two workflows. Forked from the 5 November base. | Conflicts in `incomeos.css` and `incomeos-mobile-browser-audit.yml` |
| `claude/decision-spellchecker-ds-n1-2026-11-03` (#119) | `lib/ds-n1/cognitive-observations.mjs` with its test, UI changes in `lib/ds-n1/ui/`, an older `serve.mjs`, and four documents under `docs/decision-spellchecker/`. 113 of its 127 changed files are already identical in the integration branch. | Conflicts in 7 files |
| `chatgpt/ds-n1-sp07-contained-20261105` | 115 of its 125 changed files are already identical in the integration branch. | Conflicts in 5 files |
| `chatgpt/incomeos-ds-source-contract-20261106` (#172) | 6 commits, 5 files. | Conflict in 1 file |
| `chatgpt/incomeos-v24-evidence-dedup-20261106` (#173) | 7 commits, 5 files. | Conflict in 1 file |

## 2. Lanes

Adopted on 2026-11-11, when the owner instructed that the recommended split be implemented. One assignment has one agent at a time. The owner may swap lanes; record the swap here.

| Lane | Agent | Scope |
| --- | --- | --- |
| Accounting editor (first production milestone) | ChatGPT | `owner/incomeos/` accounting, vault, revision and workspace files, their tests and workflows, `ACCOUNTING-EDITOR-ACCEPTANCE.json` |
| DS-N1 Synthetic Reviewer (immediate bounded assignment) | Claude Code | `lib/ds-n1/`, `owner/incomeos/ds-*`, `tests/ds-n1/`, `tests/incomeos-ds-*`, the two DS workflows |

Shared files (`owner/incomeos/index.html`, `incomeos.css`, `incomeos.js`, this handoff) are changed in the smallest possible diff, and the pull request says so. A security or integrity defect may be fixed by whichever agent finds it, in its own pull request.

## 3. Working rules for two agents on one repository

1. Fetch first. Confirm the integration head and the open pull requests before trusting this file. If they differ from section 1, the repository is right and this file is stale.
2. One branch per agent per task, created from the integration branch: `chatgpt/...`, `codex/...` or `claude/...`. Open a draft pull request into the integration branch.
3. Do not push to, rebase or force-push another agent's branch. To build on unmerged work from another agent, branch from it and say so in the pull request.
4. Do not merge, mark ready, deploy or release. Those are owner decisions.
5. Do not merge IncomeOS branches into `main`, and do not merge `main` into them. The public JRS site and IncomeOS are separate.
6. Pushing an IncomeOS branch makes Vercel build a preview of the `incomeos-opportunity-desk` project automatically. Treat that as an effect of the push and report it.
7. Fictional records only for DS-N1. No real records, credentials or owner financial data in the repository, in tests or in a conversation.
8. GitHub Actions on the pull request decides what passed. An agent's own report of a local run is supporting detail, not acceptance evidence for the other agent. Three workflows (`incomeos-accounting-validation`, `incomeos-accounting-browser-validation`, `incomeos-ds-p0-integration`) filter pull requests by base branch: if the integration branch is ever renamed, add the new name to them in the same pull request.
9. Record what was executed, on which commit, with which tool versions, in a dated evidence record. State what was not run.

## 4. How to verify locally

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

## 5. Current checkpoint

Assignment: DS-N1 Synthetic Reviewer integration. Status: INTEGRATION_IN_PROGRESS.

Done in #190, with executed evidence in `EXECUTION-EVIDENCE-2026-11-11.md`:

- The CLI now replays recorded reviewer actions into a verifiable evidence export. Before, it refused every action dated before the run.
- A CLI regression covers action and disposition retention, export tamper detection and ten refusal cases.
- The DS-N1 workflow runs on pull requests. GitHub Actions passed on `1b42e630`.
- Draft #179's four commits are carried into the integration branch. #179 can be closed by the owner.
- All ten IncomeOS workflows now run for pull requests into the integration branch. Three of them did not before.

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


### Accounting-lane contact-profile source reapplication, 2026-11-11

The original encrypted contact-profile implementation is in draft #187, whose branch diverged from the integration branch by 407 commits as of the recovery check. The bounded reapplication is prepared on `chatgpt/incomeos-contact-integration-20261111`, branched from integration commit `c6a65fff02b0ca09414b72455b49dc32a9813898`. It carries the existing contact module, the synthetic Node and browser tests, one existing Owner Desk script reference, scoped phone-width CSS and a dedicated PR-scoped CI workflow. The two older, feature-branch-only workflows from #187 are not copied because the new workflow supplies both unit and browser checks on integration pull requests. No unrelated prototype branch history is ported.

Status: IN PROGRESS, SOURCE REAPPLIED; draft PR #193. Initial exact-head CI on `e03e813d` passed six contact unit tests and source isolation, but its contact browser test failed waiting for an absent external study card. A fictional-card test fixture has been added for a second exact-head CI run; the final result must be inspected before any acceptance claim. This does not establish protected preview behavior, physical iPhone acceptance, cloud synchronization, release authorization or production persistence. No real owner contact details are committed. GitHub branch publication can trigger an IncomeOS protected preview build; a build is not an authorized release.

## 6. Blocked on the owner

These stop both the remaining DS-N1 criteria and accounting A14:

1. An approved nonproduction Supabase project for the staged revision editor.
2. Scoped migration access to that project.
3. Two operator-provisioned synthetic identities.
4. Whether to close draft #179 (its commits are carried), how drafts #180 and #176 should eventually reach the prototype branch, and what to do with #172, #173, #119 and #187 (see the table in section 1).

Owner-only, later: physical iPhone and separate-session recovery acceptance, original-source custody and rights attestation, and the release decision.

## 7. Next executable action

With the items in section 6 still missing, the eligible source-level work is:

1. DS-N1 lane: decide with the owner whether `cognitive-observations.mjs` from #119 belongs in the integration branch, then port it with its test in one pull request.
2. Accounting lane: verify the bounded contact-profile port on `chatgpt/incomeos-contact-integration-20261111` using the exact-head GitHub Actions, correct any observed failures in that branch, and obtain the owner-controlled merge decision. Protected browser/device acceptance and production release remain separately gated.

Once section 6 items 1 to 3 exist: scoped migration preflight, two-identity hosted denial and append tests, interruption recovery, non-destructive rollback rehearsal, then the Owner Desk reviewer view behind that backend.
