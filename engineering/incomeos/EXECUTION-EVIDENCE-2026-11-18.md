# IncomeOS execution evidence, 18 November 2026

Controlling directive: IncomeOS Master Directive Version 10.3, Mode A (Engineering Execution). Lane: DS-N1 Synthetic Reviewer (Claude Code). Status stays INTEGRATION_IN_PROGRESS.

## Authority

Handoff section 7, item 1 asked for an owner decision on whether `cognitive-observations.mjs` from draft #119 belongs in the integration branch. On 18 November 2026 the owner answered "Yes, port it" and approved a new `claude/...` branch from the integration branch with a draft pull request into it.

## Starting source

`c6a65fff`, head of `verification/incomeos-accounting-ci-20261108` (merge of #190). Source of the port: commit `f9cb3ccb` on `claude/decision-spellchecker-ds-n1-2026-11-03` (#119). `lib/ds-n1/cognitive-controls.mjs` and `lib/ds-n1/session.mjs` are byte-identical on both branches, so the module depends on nothing the integration branch lacks.

## Change

- `lib/ds-n1/cognitive-observations.mjs` and `tests/ds-n1/cognitive-observations.test.mjs`: taken unchanged from #119. Two read-only wording checks. Unsupported certainty: a claim worded categorically ("clearly", "proves", "definitely" and similar) while a finding on it is unresolved, or while it cites no source. Premature closure: record wording such as "can proceed" or "no further review" while a critical or blocking finding is unresolved. Neither changes a finding, the review status, the event log or the report.
- `lib/ds-n1/ui/app.mjs`: the #119 hunk that lists the wording checks under the cognitive prompts, applied unchanged. The other #119 UI and `serve.mjs` changes were not taken.
- `owner/incomeos/ds-runtime-bridge.mjs`: `reviewerSnapshot` adds `cognitiveObservations` and `cognitiveObservationVersion`. Contract version `1.0.1-dev` to `1.0.2-dev`, additive only.
- `tests/incomeos-ds-runtime-bridge.mjs`: D06 snapshot carries exactly one premature-closure observation, its related findings exist, status stays HOLD; P01 carries none.
- `tests/ds-n1/ui.browser.mjs`: new check, desktop and emulated iPhone. D06 shows the premature-closure item, following it leaves status HOLD, P01 shows none.
- `.github/workflows/incomeos-dsn1-validation.yml`: adds `tests/ds-n1/cognitive-observations.test.mjs` to the native DS-N1 step. Without this CI would not run the new test.

## Executed verification (local)

Node v22.23.5, Linux. Chromium from `/opt/pw-browsers/chromium-1243`, Playwright 1.63.0, playwright-core 1.63.0 installed with `--no-save` for the panel suite only.

- Bridge, local server boundary, evidence export: 20 of 20 passed.
- Native DS-N1, cognitive controls, source trace, reflective guidance, cognitive observations: 62 of 62 passed (56 before, plus 6 ported).
- `incomeos-ds-program`, `incomeos-ds-original-verification`, `incomeos-source-boundary`, `incomeos-release-gate`: passed.
- `tests/ds-n1/ui.browser.mjs`: 26 of 26 passed (24 before, plus 2 new).
- `incomeos-ds-panel-browser` at 320, 375 and 430 px, and `incomeos-ds-program-browser`: passed.
- Guards shown to fire first: the new bridge assertions fail against the starting bridge (TypeError on the missing field, 1 failure); the new browser check fails against the starting `app.mjs` on both viewports (24 of 26).

Fixture sweep: premature closure fires on D01 to D07, D09, D10, D13 and D14, each a record stating "can proceed" with a critical finding open. It does not fire on P01 to P05 or on D08, D11 and D12, whose open findings are review-level only. No fixture uses certainty wording; that path is covered by the ported unit tests on constructed states only.

Not run: `incomeos-accounting-*`, `incomeos-staging-privacy` and other accounting-lane suites (no accounting file changed). No real device. No effectiveness evaluation: whether these prompts improve review has not been tested. These are local results on constructed fictional fixtures; GitHub Actions on the pull request is the acceptance evidence.
