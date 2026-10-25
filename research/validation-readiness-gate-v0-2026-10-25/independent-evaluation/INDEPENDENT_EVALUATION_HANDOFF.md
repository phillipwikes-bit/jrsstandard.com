# Independent Evaluation Handoff (execution-disabled)

**Gate V0, 2026-10-25. Planning material only.** No reviewer has been recruited or contacted, no real record has been used, and no evaluation has been run. Nothing here authorizes any of these. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Purpose

This package lets a future independent evaluator start from a fixed, verifiable description of what exists, what was tested and what was not. It does not start that evaluation.

## 2. What a future evaluator would receive

| Item | Location | Hash or identity |
|---|---|---|
| Frozen Engine candidate | `lib/engine-evidence-graph-v0.3.1-candidate` and dependencies | Phase 7 manifest `815c5d56...25c3` (147 files) |
| Prompt | `research/evidence-graph-compiler-2026-10-10/prompt-contract/PROMPT_v0.3.0.txt` | `0ceda888...eec2` |
| Adapter | `tools/harness/adapter.mjs` (copy of adapter 0.2.0) | `aa2b9779...1fb6` |
| Engineering evidence | `MECHANICAL_EVALUATION_*`, `DETERMINISM_COMPARISON.json`, `MUTATION_*` | Package manifest |
| Engineering corpus | `corpus/` (sealed; owner-authored; **not** usable as a holdout) | Seal manifest `1103d11d...dfe6` |
| Open questions | `FAILURE_AND_UNCERTAINTY_REGISTER.md` | Package manifest |

The engineering corpus was built by the same side that wrote the expectations. It has been run and is known to the builders. **It must not be used as evaluation material.** It may serve as an example of format only.

## 3. Status of every precondition

Every condition in `INDEPENDENT_EVALUATION_PROTOCOL_DRAFT.md` section 2 is **NOT SATISFIED**. In particular:

- B-018 is OPEN;
- no independent evaluator exists;
- no protected holdout exists;
- no rights or data admission has been made;
- no counsel review of any real-data question has occurred;
- no live-model configuration has been exercised.

## 4. Documents in this handoff

- `INDEPENDENT_EVALUATION_PROTOCOL_DRAFT.md`: what would be required before any credible independent validation claim.
- `ROLE_SEPARATION_AND_CONTAMINATION_PLAN.md`: who may do what, and how contamination is prevented and recorded.
- `EVALUATOR_BLINDING_PLAN.md`: what evaluators must not see, and when.
- `DATA_AND_RIGHTS_ADMISSION_GATE.md`: the gate any record must pass before it enters an evaluation.
- `FUTURE_HOLDOUT_ADMISSION_CRITERIA.md`: what a protected holdout must satisfy.
- `MEASUREMENT_PLAN.md`: the measures to fix before any run.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
