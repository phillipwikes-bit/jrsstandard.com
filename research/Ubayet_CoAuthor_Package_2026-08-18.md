# Co-author package: Ubayet Hossain, FRM

**Detection paper, v4, ready for your sign-off.** Data locked 15 August 2026. Nothing in it is pending.

---

## What changed since you last saw it, and why

A senior editor reviewed v3 as an unsolicited *AI and Ethics* submission and returned **major revision before submission**, with acceptance estimated at 8 to 15 percent as it stood and 25 to 40 percent after a manuscript-level revision on the existing dataset. All ten Tier 1 items and all eight Tier 2 items are applied. No figure changed. Six Tier 3 items need new data and are now named studies in a programme table rather than implied gaps.

The four changes that alter what the paper claims:

**1. The reliability criterion is reported as failed.** Your pre-registered floor had two parts: AC1 at or above 0.61, and the lower confidence bound at or above 0.41. The point estimates clear the first. **The analytic lower bounds are 0.402 and 0.253 and do not clear the second.** The bootstrap puts the expert bound at 0.427; v3 presented that as clearing. Section 6.5 now states *"The pre-registered reliability criterion was not met"* and *"We do not treat that as satisfying the pre-registration"*, and reports the bootstrap as a sensitivity analysis.

This is your criterion and your interval choice. **If you specified the analytic interval as primary, the current text is right. If you specified the bootstrap, tell me and it changes.** That is the single question in this package that only you can answer.

**2. The per-condition analysis is now descriptive and lives in Appendix B.** The five conditions are the components the composite determination is built from, so testing them against that composite is close to testing whether reviewers followed instructions. All five Fisher p-values are removed and the circularity is stated in terms.

**3. Spectrum bias is conceded.** Twelve clearly grounded and twelve clearly unsupported records is a corpus of easy cases. Section 4.3 states the 83.9 percent is **an upper bound, not an estimate of field performance**, and reads the answer key's 24-of-24 blind unanimity as a second symptom of it.

**4. Three claims withdrawn.** Workflow independence (all 24 records are AI-generated). Proportionality as a validated feature (no experiment varied stakes). Higher sensitivity as the preferable error direction (no cost model exists).

Landis and Koch verbal bands are dropped throughout. The progress log, status line and target journal are out of the manuscript and in `Detection_Article_v4_CHANGES.md`.

---

## Appendix C: the analysis the editor asked for, now run

The editor's sharpest methodological point was that the participant-level analysis models reviewers and not records, so the 83.9 percent could be high simply because this draw of 24 records was easy.

Fitted over all 384 graded reads:

```
correct ~ 1 + (1 | reviewer) + (1 | record)
```

| Component | Estimate | Profile 95% |
|---|---|---|
| Reviewer SD | **1.769** | 1.292 to 3.000 |
| Record SD | **0.011** (boundary) | 0.001 to 0.556 |
| Intraclass correlation, reviewer | **0.488** | |
| Intraclass correlation, record | 0.0000 | |

**Close to half the variance in whether a read is correct is attributable to which reviewer read it.** Record accuracy spans 62.5 to 93.8 percent; reviewer accuracy spans 37.5 to 100. Every record was classified correctly by at least ten of the sixteen reviewers.

No record in this corpus was hard. Several reviewers were.

Both consequences are stated: **Section 8.3 claimed a larger limitation than the data supports and is corrected in the paper's favour**, and Section 6.3's reviewer-heterogeneity finding now has a number behind it rather than a raw spread.

**The record component is a singular fit and is reported as one.** The profile interval does not exclude a moderate effect, and the appendix says so rather than claiming item difficulty is zero. The one-in-six boundary rate at this sample size was measured by simulation on data of this exact shape before the real fit was run.

### How it was computed, since you will ask

Server-side at `api/variance-6b1d90fa2c47e8b3`, reading the per-read table directly. Laplace-approximated maximum likelihood, exact crossed Hessian via Schur complement and Cholesky. A diagonal approximation was tried first and rejected: on simulated data with a true record SD of 0.600 it returned 0.000, which would have supported the opposite conclusion.

Two independent implementations, one Python and one JavaScript, agree to four decimal places on identical data. The endpoint also **rescores the raw reads from scratch and reproduces the published 83.9 percent, the 37.5 to 100 range and the six perfect scorers exactly**, which is the primary analysis independently recomputed.

---

## What is deliberately not in the paper

**The grounded/unsupported class beside item-level accuracy.** Printing accuracy next to the class publishes the answer key. The class is released under the data-availability terms on request, not in the body.

**A per-reviewer table keyed to study codes.** The contributor roster maps those codes to named unpaid volunteers. A code-labelled ranking would identify the lowest-scoring named professional on the panel, which is not a result and was never a condition of anyone's participation. Section 6.2 gives the distribution instead.

---

## Your attribution, as it currently stands

**Author contributions.** *"U.H. designed the reliability and validation framework: the reference-panel design, the chance-corrected agreement statistics, and the pre-registered decision floors and analysis plan. Neither author took part in the blind reproduction of the answer key, and neither author graded any record in the detection panel."*

**Acknowledgments.** *"The reliability and validation methodology, including the pre-registered analysis plan, the choice of coefficient, and the acceptance floors applied in Section 6.5, was designed by Ubayet Hossain, FRM. Specifying those criteria before any data were examined is what allows the results in this paper to be read as tests rather than as descriptions, and it is why Section 6.5 can report a criterion as failed."*

**Competing interests, Section 9**, names you: you designed the validation framework and would benefit reputationally from its use. The section states that the mitigations in place are real and not sufficient, and names an independent validation adjudicator as the highest-value addition not yet made.

Change any of it and it changes.

---

## Verification state at handover

| Check | Result |
|---|---|
| `verify_manuscript_figures.py` | **45 assertions, 0 failed** |
| `check_zero_drift.py` | **23 checks, 0 failed** |
| Adversarial injections against the figure verifier | 9 of 9 caught |
| Deployment lock | set 2026-08-18, 17 files hashed, 15 live probes passing |

The figure verifier checks every numeric claim in the manuscript against `closed_aggregates_2026-08-15.json`, `bench_labels`, `study_runs` and the live endpoints. It also **fails if the Fisher p-values return to Appendix B, if the failed reliability criterion is softened, if the bootstrap is claimed as satisfying the pre-registration, or if any of the three scope limits is deleted.** Those four guards exist because an earlier adversarial pass caught only eight of nine injected regressions: softening *"the criterion was not met"* to *"was substantially met"* passed everything, because every figure was still correct and nothing was watching the sentence around them.

---

## Files in this package

| File | What it is |
|---|---|
| `research/Detection_Article_v4_2026-08-16.docx` | The manuscript |
| `research/Detection_Article_v4_CHANGES.docx` | Every editor item, what was done, what could not be |
| `research/Ubayet_CoAuthor_Package_2026-08-18.md` | This brief |

---

## The one thing I need back from you

**Which confidence-interval construction did the analysis plan specify as primary for the reliability floor, the analytic or the bootstrap?**

The paper currently says the analytic, and therefore reports the criterion as failed. That is the conservative reading and the one that survives a methodologist. If the plan actually specified the bootstrap, the expert panel clears at 0.427 and Section 6.5 is rewritten accordingly.

Everything else is ready to submit.
