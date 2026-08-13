# JRS Pilot Programs and Validation Methodology: Summary

*Prepared 2026-07-28. Figures are as verified in the study database (`bench_outcomes` for real-case pilots; `pilot_progress` for the reviewer panel). JRS is in an operational validation phase: nothing here asserts proven effectiveness, legal sufficiency, or guaranteed outcomes. Self-reported additions are labeled as such. Real-case criterion claims are gated until each pilot reaches its pre-registered target (20 to 30 cases with a spread of outcomes).*

---

## Part 1. The real-case pilot programs (Rung 3: criterion validity)

The pilots test JRS against reality. For each real record, a reviewer records the JRS read (Ready, Needs work, or Gap) blind to what actually happened, and that read is later paired with the record's documented outcome (challenged, appealed, upheld, overturned). The question each pilot answers: does a JRS read predict how a real record holds up when it is later contested? This is the highest-value rung of the evidence program and a named lever for the standard's commercial value. Three domain pilots are running.

### Pilot 1. Public Records / FOIL
- **Lead and co-author:** Stacy Young (reviewer ID E-08), Records Governance Advisor and Public-Records Domain Lead (Deputy Records Access Officer, NYC HPD). Co-authorship confirmed 2026-07-09.
- **Mission:** assemble real public-records determinations (Freedom of Information requests and responses) paired with their documented outcomes, and test whether the JRS read anticipates which records withstand challenge.
- **Verified evidence (study database):** 7 real cases from 7 distinct public sources, collected 2026-06-26 to 2026-07-06. JRS reads: 5 Ready, 2 Needs work, 0 Gap. Recorded outcomes to date include challenged and failed appeal.
- **Status and home:** in progress, preliminary. Feeds the journal article "Documentation as a Governance Layer" (target: *Journal of Civic Information*). Target sample 20 to 30 cases by 31 August 2026; not submittable as a criterion claim until the target and outcome spread are met.

### Pilot 2. Human Resources / Employment
- **Lead:** Tanvi Pokhriyal (reviewer ID V-HR-01), HR and employment practitioner (UAE).
- **Mission:** assemble real HR and employment records (investigations, adverse-action and termination files) paired with their documented outcomes (challenged, appealed, upheld, overturned), and test whether the JRS read predicts how each holds up under challenge or litigation.
- **Verified evidence (study database):** 5 cases recorded (last confirmed 2026-06-22), spanning the key outcomes (challenged, failed appeal, held up), including one Gap-read record that nonetheless held up, a useful counter-example. Approximately 5 additional cases are self-reported (2026-07-18) and are not yet independently verified in the database; do not cite a number above 5 until verified.
- **Status and home:** in progress, preliminary. Supplies the real-case evidence for the empirical paper "Documentation Governance in AI-Assisted Decision-Making: A Multi-Domain Validation of a Record-Level Review Standard" (confirmed target: *Journal of Business Ethics*), where Kyle McMullan contributes the compliance and investigations perspective and Ubayet Hossain is the methodology co-author.

### Pilot 3. Healthcare Compliance
- **WITHDRAWN 2026-08-13** at the owner's instruction. Accepted 2026-07, never started, zero cases contributed across its whole life, so no published figure changes with its removal.
- **Lead:** Keith Carrington, EJD, MBA (reviewer ID V-HC-01).
- **Mission:** extend the criterion test into healthcare compliance records, the third regulated domain, to show the pattern is not specific to one field.
- **Verified evidence:** 0 cases. The pilot is accepted but not yet started.
- **Status:** the standing action is to nudge Keith and open case collection; this pilot is the thinnest of the three and is the clearest near-term recruiting need.

### Portfolio status
- **Total verified: 12 real cases across two active pilots** (FOIL 7, HR 5); the healthcare pilot was accepted, never started, and was withdrawn on 2026-08-13.
- **What maturing these pilots unlocks:** real-case criterion evidence is the strongest form of validation in the program and the one a prospective buyer weighs most. Reaching target in even one domain converts the criterion claim from "in progress" to demonstrated.

---

## Part 2. Ubayet Hossain's methodology (the validation framework)

**Who.** Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India; 9-plus years in credit and market-risk model development and validation. He is a co-author on each paper that uses his framework, for the reliability and validation methodology he designed. (His co-authorship on any given manuscript is finalized only after he reviews and signs off on that specific paper, which keeps it earned rather than courtesy.)

**What his methodology is.** In plain terms, Ubayet designed the part of the program that makes the results trustworthy rather than just favorable. It has four components.

1. **Reference-panel design.** Independent reviewers, split into an expert panel and a trained-reviewer panel, each rate the same records without conferring and without seeing an answer key. Analyzing the two panels separately shows whether the standard works only for experts or also for trained non-experts. This is what lets the study claim independent, reproducible application rather than one person's judgment.

2. **Chance-corrected agreement statistics.** Raw agreement can look high just because most records fall into one category. Ubayet's framework measures agreement with **Gwet's AC1** as the primary coefficient, chosen because it is robust to the well-documented "kappa paradox" that deflates other coefficients when the categories are skewed. **Krippendorff's alpha** and **Fleiss' kappa** are reported alongside for transparency, so the skew is visible rather than hidden. On the current data this choice is doing real work: the expert AC1 is 0.74 while the skew-sensitive coefficients sit lower, exactly the pattern AC1 was selected to handle.

3. **Pre-registered decision floors.** Before any data were examined, the framework fixed the thresholds a result must clear to count as support: for reliability, Gwet's AC1 of at least 0.61 with the lower bound of its 95 percent confidence interval at least 0.41; for detection, agreement with the verified key above chance with the lower confidence bound above 0.50 and a point estimate of at least 0.70; and for the randomized comparison, a pre-set margin by which the JRS condition must beat the baseline. A result that fails a floor is reported plainly as a null or weak result and is not reinterpreted after the fact.

4. **Pre-registered analysis plan and interval estimation.** The hypotheses, measures, rater targets, and statistics were fixed in a dated analysis plan (6 July 2026) before the confirmatory data were labeled, so the findings are confirmatory rather than chosen after seeing the numbers. Confidence intervals are computed with a linearization variance and corroborated by a subject-level bootstrap. Analysis runs only after data lock.

**Why it matters for the standard's value.** This methodology is the credibility spine of the whole evidence program. It is the difference between "we think JRS is applied consistently" and "independent reviewers, judged against thresholds set in advance, applied it consistently, and here are the intervals." That pre-registered, chance-corrected discipline is what a peer reviewer looks for and what a buyer's technical diligence will test. Ubayet's name and KPMG model-validation credential also lend the reliability claims outside authority they would not have if the creator had validated his own standard alone.

---

## Part 3. Note on the Compliance & Ethics Professional (CEP) placement

Separate from the pilots and the empirical papers, a compliance-audience article by Phillip Wikes, "When the Record Cannot Speak for Itself," is **accepted for the Society of Corporate Compliance and Ethics (SCCE) Compliance & Ethics Professional (CEP) Magazine** (scheduled, November). Two accuracy rules apply whenever it is referenced: describe it as **forthcoming or scheduled, never as "published,"** until it actually runs; and it is a **solo-authored** piece (no co-author is added there). It provides a compliance-professional credential that complements the peer-reviewed validation papers and the legal-audience article, but it is an explanatory article, not a validation result, and it carries no effectiveness claim.

---

*© 2026 Phillip Wikes · JRS. Verified figures from the study database; pilots preliminary and observational; no proven-effectiveness claim.*
