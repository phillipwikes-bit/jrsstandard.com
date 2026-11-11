# IncomeOS execution evidence, 11 November 2026

Controlling directive: IncomeOS Master Directive Version 10.3, Mode D (Recovery) then Mode A (Engineering Execution). Assignment: DS-N1 Synthetic Reviewer integration. Status stays INTEGRATION_IN_PROGRESS.

## Recovered checkpoint

Starting source: `f23caa774fc4e652d678bc4f0ab5f41b38279bed`, head of `verification/incomeos-accounting-ci-20261108` (draft pull request #180). It contains `chatgpt/incomeos-vault-envelope-validation-20261107` and `chatgpt/incomeos-v25-synthetic-review-sequence-20261106`. The directive's historical commit `5ec925aa` is an ancestor of this head. `main` contains the directive and no IncomeOS source.

Draft pull request #179 (`verification/incomeos-dsn1-cli-20261108`, four commits) was based on the v25 branch and was absent from this head. Its commits are carried here by `git cherry-pick -x`.

At the starting source, before any change, 76 tests passed and none failed across the bridge, local server boundary, evidence export, programme, original verification, native DS-N1, cognitive control, source trace and reflective guidance suites. Node v22.23.4, Linux, local execution.

## Reproduced defect: recorded reviewer actions refused by the CLI

Operation: run `owner/incomeos/ds-local-review.mjs` with fixture `tests/ds-n1/fixtures/D06.json`, a new programme, and a human-actions file holding one `request_evidence` action dated `2026-11-05T13:31:00Z`.

Observed at the starting source: exit 1, `Local synthetic review refused: TIMESTAMP_REGRESSION: action timestamp precedes the previous event`, no export written.

Cause: the CLI opened every review at the wall-clock time of the run. The DS-N1 engine correctly refuses an action dated before the opening event. A reviewer action recorded before the run could therefore never be replayed, and only a future-dated action would have been accepted. The prior CLI test supplied no actions, so the reviewer-action and disposition-retention path through the CLI had no executed evidence.

Classification: implementation defect in the integration entry point. The DS-N1 engine, its timestamp rule and its thresholds are unchanged.

## Change

`owner/incomeos/ds-local-review.mjs` only.

- The human-actions file may be an array, as before, or `{"opened_at": "...Z", "actions": [...]}`. `opened_at` is the operator's statement of when the review was opened. It is not derived from the actions. No action is created, reordered or re-dated.
- `opened_at` and every action timestamp must not be later than the run. Unknown fields are refused.
- The report and export are generated at run time.
- The stdout summary reports the disposition value only. Reviewer identity and note stay in the export file.

`.github/workflows/incomeos-dsn1-validation.yml` now runs on pull requests that touch the DS-N1 paths. Before this, neither DS workflow was triggered for pull requests on this lineage. Checkout no longer persists credentials.

## Executed verification (local)

- New regression in `tests/incomeos-ds-evidence-export.mjs`: the CLI process replays two recorded actions (`request_evidence`, then `final_disposition` `returned_to_author`) into an export that `verifyExport` reports as internally consistent. Events keep their order, times, reviewer and wording. Changing the retained disposition in the file makes verification fail. Ten refusal cases leave no export file: array form with earlier actions, `opened_at` after the first action, future `opened_at`, future action, malformed or missing `opened_at`, unknown field, non-array actions, action without a reviewer, and acceptance while the record is on HOLD.
- The regression fails against the starting CLI and passes with the change.
- Workflow commands: 20 of 20 and 56 of 56 passed. `incomeos-ds-original-verification`, `incomeos-ds-program`, `incomeos-source-boundary`, `incomeos-release-gate` and `incomeos-staging-privacy` passed.

These are local results on constructed fictional fixtures. They are not independent CI evidence, an effectiveness evaluation or acceptance of any original SP check. Export consistency is an unsigned internal hash check. It does not authenticate the reviewer.

## Not executed

Hosted, Supabase and Vercel operations were not attempted.

## Browser suites (run after the change, at `1b42e630`)

`tests/incomeos-ds-panel-browser.mjs` passed: imported product source and fail-closed reviewer boundary at 320, 375 and 430 px. `tests/incomeos-ds-program-browser.mjs` passed. Both ran locally against the container's preinstalled Chromium and Playwright, which is a different Playwright version from the 1.63.0 the workflows pin. The change does not touch any file these suites load.

## Outstanding for DS-N1 acceptance

Development-only Owner Desk access behind a verified private owner backend. The bridge still states that no browser route is registered. Reviewer actions and disposition retention inside the Owner Desk view. Independent CI results for this revision. Original SP-01 to SP-18 acceptance remains 0 of 18. Release and customer access remain not authorized.


## ChatGPT accounting lane: encrypted contact profile reapplication (2026-11-11)

Task: recover the existing P0 encrypted research-application contact profile from draft #187 without importing the obsolete prototype branch into the authoritative IncomeOS integration branch.

Verified starting source: integration branch `verification/incomeos-accounting-ci-20261108` at `c6a65fff02b0ca09414b72455b49dc32a9813898`; original contact branch `chatgpt/incomeos-contact-first-vercel-20261110` at `2c841abd65de657988f3447e5a3aa9de21cf1f99`. GitHub comparison reported 15 original-branch commits not contained in integration and 407 integration commits not contained in the original branch. The existing profile is not yet in the integration branch.

Bounded change: carry over `owner/incomeos/contact-profile.js`, two synthetic tests, its script reference in `owner/incomeos/index.html`, responsive CSS and a PR-scoped test workflow. No existing accounting, DS-N1, ledger, security boundary, pricing, commercial integration or public JRS source was changed. Reused the existing research workspace. A dedicated PR-scoped workflow replaces the two original feature-branch-only workflows; it tests encryption, persistence on browser refresh, incorrect-passphrase denial, deletion, source isolation and iPhone-width browser emulation.

Execution evidence in this session: GitHub repository metadata, full master directive, current handoff, source files and PR metadata were fetched; branch comparison and exact starting revision were verified. Node 22.16.0 exists in the local execution environment, but a complete source checkout was not possible because direct GitHub DNS resolution failed. No local Node unit or browser test was executed. GitHub Actions on the new draft PR are the independent shared execution record; their outcome must be checked and recorded separately. Chromium emulation does not establish physical iPhone acceptance.

Source status: integration proposed, not owner accepted, not merged, not deployed. No real owner contact information, credentials, commercial outreach, financial transactions, customer release or external recruiter submission was used. The contact profile is passphrase-encrypted local browser persistence only, not a server-backed identity service. Pushing the task branch can cause an automatically triggered protected IncomeOS preview build, which is not a production-release authorization.

### CI failure and targeted test correction, 2026-11-11

At source head `e03e813d525f474f9fc4c1412a5ed37c0ebc6778`, PR #193 workflow run [42991776640](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42991776640) failed during the browser test. Six of six encrypted-contact unit tests and the public-source boundary test passed. Chromium was installed and launched. The browser test timed out after 30 seconds waiting for `#research-cards article.card` at line 63. The local source server does not supply external study opportunities, so the prior test incorrectly relied on a nonempty live study feed. This is a test fixture/environment assumption, not evidence that encryption failed.

Correction: add one constructed, fictional research card within the browser test and wait for the real contact-preparation button to be added to that card by the existing MutationObserver. The live contact module, application URLs, encryption and release boundaries are unchanged. The corrected test and other suites require a new exact-head GitHub Actions run; no pass is claimed before that result.
