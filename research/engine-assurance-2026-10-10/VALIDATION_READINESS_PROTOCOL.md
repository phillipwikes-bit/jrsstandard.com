# Validation Readiness Protocol (future-facing)

**Date:** 2026-10-10 · **Status:** DRAFT for owner and independent-evaluator review. Not executed. Not approved. Nothing here sets an acceptance threshold.

## 1. What the synthetic pack cannot do

The 31 fixtures in `fixtures/` are **synthetic, engineering-authored, and not an independent holdout**. The records, the mock candidate outputs and the expected results were written in one session by the author of the controls. Agreement between them measures internal consistency of the code with its author's intent. **It cannot establish accuracy, sensitivity, specificity, agreement with human reviewers, or generalisation.** No figure derived from this pack may be cited as performance evidence.

## 2. Separation rules for any future evaluation

1. **No overlap.** No fixture, fixture paraphrase, or record derived from a fixture may appear in an evaluation set. Record the SHA-256 of every evaluation record and check for collision with `fixtures/records/*` before scoring.
2. **Lock before run.** The evaluation set, reference labels, protocol and acceptance criteria are locked with a dated hash (`protocol_id`, `locked_at`, as `tools/score-engine-holdout.mjs` already requires) **before** any candidate output is generated on it.
3. **Independent authorship.** Records are authored or selected by someone other than the developers of the controls. Labels are assigned by at least two qualified reviewers working independently, with a recorded adjudication procedure (`docs/architecture/JRS_ADJUDICATION_PROTOCOL_v1.0.md` is the existing starting point).
4. **No tuning on the holdout.** Development, debugging and prompt work never touch the holdout (handoff: "Use of development, training, or debugging data in sealed holdouts" is prohibited).
5. **Authorised material only.** Records must be within the authorised scope (completed, non-HR supplier-access exception drafts) and their use authorised in writing. No customer record without counsel review (release gate 3).

## 3. What must be decided before an evaluation (owner decisions)

| Decision | Why it blocks |
|---|---|
| Whether to add an `evidence` quotation request to the prompt (CD-001 section 5) | Without it, v1 output yields `review_required` everywhere under this layer |
| New `ENGINE_VERSION` for any prompt change | A prompt change changes the system under test |
| Model identifier (review date 2026-10-15 in `api/_model.js`) | A model change changes the system under test |
| Reference-label vocabulary: v1 (`pass/review/gap`) or envelope (`supported/gap/review_required/not_assessed`) | The scorer currently accepts v1 vocabulary only |
| Primary error of concern and its acceptance criterion | Must be fixed before data are seen |
| Engine-to-Codebook mapping | Without it, results speak to Engine keys only |

## 4. Measures to pre-register (candidates, no thresholds set)

- Per condition: three- or four-class confusion matrix; one-versus-rest sensitivity, specificity, precision with intervals (the existing scorer reports Wilson 95% intervals).
- **Unsupported favourable rate:** proportion of `supported`/`gap` findings whose cited span an adjudicator judges does not support the finding (the FM-09 rate).
- **Quotation fidelity:** proportion of candidate quotations found verbatim.
- **Refusal correctness:** gate miss rate and false-refusal rate on records seeded by an independent party.
- **Repeatability:** agreement across repeated runs on the same record, reported separately from accuracy.
- **Record-control usefulness:** reviewer judgment of each CC detection (useful, neutral, wrong), with no claim about authors.

## 5. Readiness checklist (all currently open)

- [ ] Source-aligned files (B-018) supplied and reconciled with this package.
- [ ] Owner decision on CD-001.
- [ ] Prompt and model fixed and versioned for the evaluation.
- [ ] Independent evaluation set authored, authorised, hashed and locked.
- [ ] Labels assigned independently and adjudicated; agreement reported.
- [ ] Protocol, measures and acceptance criteria locked before any run.
- [ ] Authorisation for a live provider call recorded, with data-flow review.
- [ ] Results reported with limitations, including failures, under Claim, Evidence, Interpretation, Limitation.

Completing this checklist would address release gate 1 only. Gates 2 to 4 and independent production QA remain separate.
