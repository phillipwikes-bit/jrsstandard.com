# Operator Review Console Guide

Local ID: ARC-DOC-10 (NON-CANONICAL). Builder: `operator-console/build-console.mjs`. Screenshots: `operator-console/screenshot.mjs`.

## Local engineering claim
Eight static examples (R-01, R-02, R-04, Y-03, X-02, Y-04, Y-06, Y-08) plus an index bring the Phase 4 records together for a reviewer, with no approval control, deployment action, file intake, network activity or authentication.

## Local evidence
- `operator-console/rendered/` (9 pages) and `screenshots/` (16 PNG, desktop 1280 and mobile 390), `SCREENSHOT_RECORD.json`: 0 non-file requests, 0 pages with horizontal overflow.
- Suite section I: no script, form, input, button, iframe, storage, analytics or external URL; ten sections in order; the four required statements; no unsupported claim.

## Page layout
Banner (non-authorising), then four statements: what the Engine can do locally; what changed; why; what remains unresolved and needs a human decision. Then ten sections: 1 Reliability Knowledge Base entries; 2 Change proposal; 3 Change Impact Analyzer output; 4 Selected regression plan; 5 Behavioral Drift Ledger; 6 Mutation status; 7 Stability test results; 8 Fixture expansion register; 9 Unresolved failure modes; 10 Local Release Candidate Gate Simulator.

## Commands
```
env -u ANTHROPIC_BASE_URL node research/adaptive-reliability-2026-10-13/operator-console/build-console.mjs
NODE_PATH=$(npm root -g) node research/adaptive-reliability-2026-10-13/operator-console/screenshot.mjs
```

## 0.4.1-local changes
Each page shows the proposal state (including the two blocked states), the observed-change summary or why none was verified, and `Human disposition: not_recorded`. Drift tables show material rows with their observed change. In the gate table, `present_local_artifact` is shown as "local file present (not a gate result)" in a neutral italic treatment instead of the ready colour.

## Correction made during the build (disclosed)
The first console text read "Whether to authorise this proposal", which the console guard rejects as control wording. The text was reworded; the guard was not changed. On mobile, wide tables now scroll inside their own container rather than wrapping identifiers letter by letter.

## Interpretation
A reviewer can see what changed, why, and what is left to decide, without running code.

## Limitation
Pages are not deployed, carry `noindex,nofollow`, and show synthetic material only.

## External evidence still required
Usability review by the intended reviewers.
