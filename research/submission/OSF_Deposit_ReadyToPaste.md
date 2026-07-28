# OSF deposit: ready-to-paste payload for the Rung 1-2 analysis plan

*Purpose: give the "pre-registered" claim in the manuscript a public, citable, timestamped anchor. This is an enhancement, not a blocker: the analysis plan is already git-timestamped 2026-07-06 20:52 UTC, about 7.5 hours before the label data entered the repository (2026-07-07 04:34 UTC), which is itself strong provenance. HONESTY RULE: do not present the OSF deposit date as the pre-registration date. Use an Open-Ended Registration and state the plan's original 6 July 2026 date plainly. Nothing here is backdated.*

## Exact steps (about 15 minutes)

1. Sign in at osf.io (free). Click **Create new project**. Title: `JRS Evidence Development Program - Rungs 1 and 2`. Leave storage as OSF Storage.
2. On the project's **Files** page, upload `research/JRS_PreRegistered_Analysis_Plan.md` (or a PDF export of it).
3. Left menu: **Registrations** -> **New registration** -> choose the **Open-Ended Registration** template (the honest choice, since some data collection has begun; it does not assert a pre-data-collection guarantee).
4. Paste the field text in section "Field-by-field text" below.
5. **Register** -> choose **Make public immediately** (or a short embargo if you prefer, up to 4 years; public is better for a paper citation).
6. Copy the resulting registration URL and DOI (OSF issues a DOI of the form `10.17605/OSF.IO/XXXXX`).
7. Send me the DOI; I will insert one sentence in the manuscript Methods ("The analysis plan is publicly registered at [DOI].") and rebuild the Word file. Until then the manuscript truthfully says the plan is "available as a time-stamped record."

## Field-by-field text (copy-paste)

**Title**
JRS Evidence Development Program - Pre-Registered Analysis Plan for Rung 1 (Reproducibility) and Rung 2 (Reliability and Accuracy)

**Description / Summary**
This registration deposits the analysis plan for the reproducibility and reliability stages of an evidence program for the Justification Review Standard (JRS), a record-level documentation review method. The plan fixes the hypotheses, measures, rater targets, statistics, and decision thresholds in advance of the confirmatory (balanced batch 3 and 4) data collection. The plan was authored and version-controlled on 6 July 2026; this date is independently verifiable from the project repository commit history, where the plan file predates the labeled reliability data by several hours. This is an open-ended registration used to make the dated plan public; it does not claim that all data collection post-dates the deposit timestamp.

**Hypotheses**
H1 (reproducibility): three independent large language models from three different vendors agree on JRS determinations for constructed records above chance. H2 (reliability): expert reviewers apply the five JRS conditions with chance-corrected agreement (Gwet's AC1) in the substantial range. H3 (detection/accuracy): on a 24-record set with a held-out key, reviewer reads match the key above chance on the Ready-versus-not-Ready distinction. H4 (secondary): trained non-expert reviewers achieve above-chance reliability, and their agreement with the expert consensus is measured and reported.

**Design and materials**
Constructed administrative records in five-record batches (batches 1 to 4; batches 3 and 4 balanced across determinations to reduce skew), plus a separate 24-record detection set with a held-out ground-truth key. Determination scale: Ready, Needs work, Gap, with a binary Ready-versus-not-Ready collapse for detection. Five JRS conditions coded per record.

**Sampling plan and raters**
Rung 1: three vendor models on the constructed records. Rung 2a reliability: at least 3 experts per record plus a target of about 5 trained reviewers per batch; the primary reliability estimate is pooled across batches 1 to 4 (approximately 26 records), not per batch. Rung 2b detection: 4 to 5 reviewers on the 24-record set. Expert and non-expert raters analyzed separately.

**Measures and analysis**
Primary reliability statistic: Gwet's AC1, for robustness to the kappa paradox under skewed marginals; Krippendorff's alpha and Fleiss' kappa reported alongside. All coefficients reported with 95 percent confidence intervals. Accuracy: percent agreement with the reference key (three-category and binary), with confidence intervals. Rung 1: pairwise percent agreement and AC1 across the three models.

**Decision thresholds (pre-set)**
Floor 1 (reliability): expert-panel Gwet's AC1 on the pooled record set at least 0.61, with the lower bound of its 95 percent confidence interval at least 0.41. Floor 2 (detection): agreement with the key on the binary distinction exceeds 0.50 with the lower 95 percent bound above 0.50 and a point estimate at least 0.70. Rung 1: a reproducibility claim requires AC1 at least 0.61. Meeting a floor supports the stated claim; failing a floor is reported as a null or weak result and is not reinterpreted.

**Blinding, exclusions, integrity**
Reviewers rate independently, without access to other ratings or the key; records are shown unlabeled. Incomplete ratings handled pairwise; preflight and test rows excluded; a reviewer completing fewer than 3 of 5 records in a batch is excluded from that batch. Confirmatory analyses run only after data lock for batches 3 and 4.

**Other / notes**
Constructed records only; no criterion-validity, effectiveness, or real-record claim follows. The reference-panel design and chance-corrected reliability framework are methodological contributions of a named co-author.

## After you get the DOI

Tell me the DOI and I will (1) add "The analysis plan is publicly registered (OSF, DOI ...)." to the manuscript Methods, (2) rebuild the Word file, and (3) tick this item in `00_SUBMISSION_PACKET.md`. If you decide not to deposit, the manuscript already stands on the git-timestamped plan and reads "pre-specified/dated 6 July 2026," which is accurate.
