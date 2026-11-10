# Regression Selection Policy

Local ID: ARC-DOC-08 (NON-CANONICAL). Code: `lib/engine-change-control/regression-selector.mjs`. Output: `proposals/REGRESSION_PLANS.json`.

## Local engineering claim
For any proposal, the selector deterministically names the minimum local test set, why each test is included, what each protects against, which classes are excluded and why, and any coverage gap. It never decides that a change is safe.

## Local evidence
Probes `rs.*` (6); mutations MA-29 to MA-32. Plans for all 32 requests. A behavioural proposal whose impact is `not_assessed` (no verified observed change) is treated as behavioural: the full suite is mandatory.

## Test classes
| Class | Command | Protects against |
|---|---|---|
| baseline_fixtures | `node tools/engine-evidence-graph-replay.mjs --no-write` | unintended change to any v0.3 fixture outcome |
| v0.1_compatibility | `node tests/engine-assurance/run.mjs` | edits to the frozen v0.1 package |
| v0.2_contract | `node tests/engine-evidence-contract/run.mjs` | edits to the frozen v0.2 contract |
| v0.3_graph | `node tests/engine-evidence-graph/run.mjs` | graph rule and traversal regressions |
| refusal | `run.mjs --only refusal` | an excluded record no longer refused |
| mutation | `run.mjs --only mutation` | a guard removable without a failing test |
| stability | `run.mjs --only stability` | irrelevant edits moving outcomes |
| drift | `run.mjs --only drift` | unexplained or unsafe output change |
| claim_guard | `run.mjs --only claims` | proof, validation or readiness language |
| workbench_rendering | `run.mjs --only console` | static pages gaining controls or network access |
| evaluation_separation | `tests/engine-evidence-graph/run.mjs` section F | synthetic material passing a separation check |

(`run.mjs` here is `tests/engine-adaptive-reliability/run.mjs`, run with `env -u ANTHROPIC_BASE_URL`.)

## Rules
- Behavioural changes make the full suite mandatory.
- A behavioural change with no new synthetic fixture or no mutation test is reported as insufficient coverage.
- A refusal change always selects the refusal class; a possible favourable change selects drift and stability; a possible limitation change selects the claim guard.
- The output carries the statement: "This output identifies required evidence before a human decision. It does not decide that a change is safe, correct, or authorised." No field names safety, approval or readiness.

## Interpretation
The plan is a list of evidence a reviewer should see, not a verdict.

## Limitation
Selection depends on the hand-authored component map; an interaction it does not list will not select an extra test. That is why behavioural changes still require the full suite.

## External evidence still required
None for local selection.
