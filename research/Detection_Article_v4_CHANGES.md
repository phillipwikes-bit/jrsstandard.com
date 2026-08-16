# v4 change record: what the senior editor asked for and what was done

Internal. **This file exists so the change log is not in the manuscript**, which was the editor's item 20 and is non-negotiable for a submission draft. `research/Detection_Article_v4_2026-08-16.md` carries no status line, no target journal, no progress log, no internal commentary.

Source: senior-editor pre-submission review, 2026-08-16. Disposition: major revision before submission. Acceptance estimate as-is 8 to 15 percent; after manuscript-level revision on the existing dataset 25 to 40 percent.

No figure changed. Every number in v4 reproduces from `research/closed_aggregates_2026-08-15.json`, `bench_labels` and `study_runs`, verified by `python3 scripts/verify_manuscript_figures.py` at **44 assertions, 0 failed, 1 skipped**.

---

## Tier 1, essential. All ten applied.

**1. Establish DRR against existing constructs.** New Section 2.2 with a nine-row comparison table: explainability, auditability, traceability, provenance, contestability, technological due process, documentation compliance, reviewability, and DRR. Each row states the object, the question it asks, and what is left over. The novelty claim is narrowed in the same section to the one thing defensible: reconstructability of the individual record has not been operationalised as a measurable property with a stated instrument and reported statistics. Cobbe, Lee and Singh (2021) on reviewable automated decision-making is named as the closest adjacent work rather than left for a reviewer to find.

**2. Clarify how the answer key was established.** Section 4.4 is now a full methodological treatment: author-side classification fixed and time-stamped before recruitment, with the evidentiary defect and implicated conditions recorded per record; blind reproduction by raters who did not see the hypotheses, the author-side classification, or the fact that a key existed; 24 of 24 with no disagreements and therefore no adjudication. It also states the limit that unanimity does not remove, that the raters were briefed by the authors and the key is therefore independent of the results but not fully independent of the construct, and reads the 24 of 24 as a second indication of the spectrum problem. Full disclosure of the key and rater instructions is committed in Data availability.

**3. Circularity between the conditions and the outcome.** Section 5.4 became **Appendix B**, opening with the circularity stated in terms: the conditions are the components the composite is built from, so testing them against it is close to testing whether reviewers followed instructions. What independent discriminating validity would require is stated.

**4. Reframe as construct and detection validation.** Title changed. Abstract restructured with a "what this establishes and what it does not" paragraph. New Section 4.1 lays out the whole validation architecture as a table with each stage marked supplied or not attempted.

**5. Remove the Section 5.4 inferential claims.** All five Fisher exact p-values removed from the manuscript. "None of the five conditions is decorative" removed. The table is descriptive only. `verify_manuscript_figures.py` now **fails if the p-values come back**, and still verifies the association against the database so the decision to report descriptively is made on a known result.

**6. Reliability lower bound treated as failed.** Section 6.5 states: *"The pre-registered reliability criterion was not met."* The analytic interval was pre-specified; expert lower bound 0.402 against a required 0.41, trained 0.253. The bootstrap 0.427 is reported as a sensitivity analysis with *"We do not treat that as satisfying the pre-registration."* Landis and Koch bands dropped entirely (editor item 14).

**7. Conflict of interest.** New Section 9. Lists the seven roles the authors hold across the study, the five mitigations actually in place, and states that they are not sufficient. Names an independent validation adjudicator as the single highest-value addition and records that it has not been done.

**8. Progress log removed.** No status line, target journal, alternative journals, database-close instructions, or internal commentary anywhere in v4. This file holds them instead.

**9. Ethics review status.** Section 4.8 states that no IRB reviewed the study, why (independent researcher, no institution holding an IRB), what protects participants (adult professionals, synthetic documents, minimal personal data, no vulnerable population, no deception beyond the disclosed blinding), and that review would be sought for any successor study using real records.

**10. AI-specific theoretical contribution.** New Section 2.3. The argument is not that AI produces bad records. It is that generative assistance raises apparent completeness, standardisation, and register without guaranteeing the evidentiary chain, so the reader's surface heuristics lose diagnosticity. Positioned as a fourth variety of opacity alongside Burrell's three, at the documentation layer rather than the model layer.

## Tier 2, strongly recommended. All eight applied.

**11. Hierarchical reviewer and item analysis.** New Appendix C specifies `correct ~ 1 + (1 | reviewer) + (1 | record)` and `scripts/analyze_item_and_reviewer_variance.py` computes it. **The figures are not in the manuscript because they have not been computed:** the per-read table is behind row-level security and the service key is not available in the authoring environment. The appendix says so and states the two questions the analysis will bear on, in advance, so the result cannot be read selectively afterwards.

**12. Item-level accuracy and error patterns.** Same script, same appendix. Emits a by-record accuracy table sorted hardest first and a by-reviewer table, both keyed to study codes with no names.

**13. Spectrum bias from the 12/12 construction.** Section 4.3 states it and accepts the consequence in terms: **the reported accuracy is an upper bound and not an estimate of field performance.** Ransohoff and Feinstein (1978) and QUADAS-2 cited. A three-level or continuous-severity corpus is specified as Study 1b.

**14. International-validity claim reduced.** Section 8.4: the panel composition reduces the chance of a shared blind spot; it does not establish measurement invariance; with one to three participants per country there is no power to estimate jurisdictional effects and none was tested. Every stronger reading removed from the Abstract, Introduction, Results and Conclusion.

**15. Reconstructability, auditability and comprehensibility separated.** New Section 2.5. Three properties, stated to overlap and to dissociate in both directions, with only the first operationalised here. The earlier claim that accessibility is intrinsically part of DRR is withdrawn.

**16. Why five conditions.** Section 3 states that the five were derived from observed casework failure modes and not from a factor-analytic procedure, lists the five open psychometric questions, names record self-sufficiency, basis identification and evidentiary sufficiency as the first candidates for collapse, and instructs the reader to treat them as a checklist with face validity rather than a validated scale.

**17. Corpus provenance.** Section 4.3 commits generation model and version, generation date, prompt, and extent of human editing, per record, to the released materials.

**18. Three-model analysis moved and documented.** Now **Appendix A**, out of the Abstract and the Discussion. Documents vendors, the deterministic output-to-determination mapping, the run schedule, access dates, and the absence of cross-run contamination. States that agreement is not accuracy and that three models trained on overlapping corpora can be wrong together. Keeps the 41-run fixed-denominator series and the reason a single run is unusable.

## Also applied

- **Item 8, DRR is relational.** Section 2.4 defines DRR relative to a stated reviewer standpoint and abandons the intrinsic-property formulation.
- **Item 11 of the review, workflow independence.** Section 3 and Section 8.5: author-blindness is a design intention, all 24 records are AI-generated, and the workflow-independence claim is withdrawn until a human-authored corpus is run (Study 1d).
- **Item 16, proportionality.** Section 3 states it is untested, that no experiment varied stakes, and that it must not be cited as a validated feature.
- **Item 17, reviewer heterogeneity.** Promoted out of Limitations into its own **Section 6.3** with the practice implication (calibration, sampled double review, adjudication) and an explicit statement that no subgroup analysis is interpretable at n=16.
- **Item 18, direction of error.** The normative claim that higher sensitivity is preferable is withdrawn. Replaced with the cost-framework formulation the editor supplied.
- **Item 19, defensiveness.** The scope boundary is stated once, in Section 5, and not repeated. Six repetitions removed.
- **Item 24, title.** Now *Detectability of Decision Reconstruction Risk in AI-Generated Decision Records: An International Expert Study*.
- **Item 25, two accountability layers.** Discussion, third emphasis.
- **Item 26, ethical contribution.** New Section 2.6 enumerating contestability, procedural fairness, institutional accountability, epistemic responsibility, and institutional memory, and noting the asymmetry: the organisation discovers the defect when challenged, by which time the affected person has already lived with the decision.
- **Item 27, the research programme.** New Section 10, an eight-row table from construct detection to intervention effectiveness, marking three rows not begun.
- **Item 23, literature.** References grew from 8 statistical sources to 30, adding accountability, contestability, due process, opacity, measurement validity, generative-AI documentation, regulatory and diagnostic-accuracy literature.

## Tier 3, next-stage research. Not applied, and cannot be.

Items 19 through 24 of the review require new data collection: ambiguous and mid-range records, human-authored records, independent external adjudication, validation against real documentation, a test of incremental value over unaided judgment, and a reviewer-calibration study. None can be done by editing a manuscript. All six are entered in **Section 10** as named studies with their status, so the paper states the programme rather than implying the programme is complete.

## Contributor withdrawal, same day

V-AI-08 was withdrawn as a contributor across the whole programme on 2026-08-16 at the owner's instruction, separately from this revision. The **Contributor** statement and the Acknowledgments paragraph crediting her are removed from v2, v3 and v4. **Section 2.1 and Section 2.5 are unchanged in substance:** the argument was rewritten into the paper's voice on 2026-08-02b and carries no attribution. Her graded reads remain counted, unnamed, in the panel of 16 and the 384 graded reads, so no figure moves. See `scripts/withdraw_contributor.py`.

## Guards added or changed with this revision

| Guard | What it now catches |
|---|---|
| `verify_manuscript_figures.py` | retargeted to v4; 44 assertions, 0 failed |
| condition p-values stay out | the circular inferential claim being restored |
| failed reliability criterion is reported as failed | "was not met" softened, or the bootstrap claimed as satisfying the pre-registration |
| the scope limits survive | the upper-bound admission, the workflow-independence limit, or the abstract's "does not establish" being deleted |
| superseded values, explained-exemption | `87.8` surviving after the sentence that retires it is deleted |
| `FIGURE_COUNTS` | re-locked for v4 with a written reason for every count that moved |
| `check_zero_drift.py` PROGRAMME_SCOPE_FILES | v4 added; must credit all 58 |

Adversarially tested with nine injected regressions. **The first pass caught four of five; softening the failed reliability criterion got through, because every figure was still correct and no guard was watching the sentence around them.** The two claim-level guards were added for that, and the second pass caught all nine.
