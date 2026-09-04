# Reliability and Reproducibility of a Record-Level Review Standard: Rungs 1 and 2 of a Staged Evidence Program

*Anonymized manuscript for double-blind peer review. Author names, affiliations, funding, and acknowledgments appear only on the separate title page.*

## Abstract

Consequential administrative decisions are increasingly documented with AI-assisted drafting, which can make a record fluent without ensuring that the basis for its conclusion is actually present. The Justification Review Standard (JRS) is a record-level review method that asks a single question of a document: can a later, independent reviewer reconstruct the documented basis for the decision from the record alone? A record that fails this test carries what we term Decision Reconstruction Risk (DRR). This paper reports the first two stages of a pre-registered evidence program for JRS. Reproducibility was assessed by having three AI models from different vendors apply JRS to the same constructed records; mean pairwise agreement on the determination was 84 percent across 15 records. Inter-rater reliability among independent reviewers is preliminary and is not reported here: the reviewer sample is still being collected and has not reached the pre-registered pooled target, so no reliability coefficient is claimed at this stage; this analysis will be reported when the sample is complete. A preliminary accuracy stage is under way against an independently verified answer key. We interpret the reproducibility result as evidence that JRS is applied consistently by independent machines rather than idiosyncratically. They do not, and are not offered to, establish the method's accuracy, practical value, or real-world effectiveness, which are the subject of later stages.

**Keywords:** documentation quality; inter-rater reliability; Gwet's AC1; AI-assisted decision-making; accountability; responsible technology

## 1. Background

A growing share of the records that justify consequential decisions, in employment, compliance, public administration, and beyond, is now drafted with the help of generative AI. Fluency is the easy part for these tools; a well-formed paragraph can state a conclusion cleanly while omitting the reasoning, the sequence of events, or the evidence that would let anyone else stand behind it. The risk is not that the decision was wrong. It is that the record, read later and on its own, can no longer show why the decision was made.

JRS addresses that gap directly. It evaluates a record against five conditions: reconstructability, basis identification, chronology, decision-process traceability, and evidentiary sufficiency. Each record is then assigned one of three determinations, Ready, Needs work, or Gap. The organizing idea behind all five conditions is reconstructability by a stranger: whether a reviewer with no access to the author, and no memory of the matter, can recover the documented basis for the decision from what the file contains. We name the failure of that property Decision Reconstruction Risk. DRR is the condition in which a record cannot, on its own terms, let an independent reviewer reconstruct the basis for a consequential decision.

Before such a method can be argued to improve anything, it has to clear a more basic bar. Different reviewers, and different automated implementations, must apply it the same way. This paper reports the evidence for that bar.

## 2. The evidence program and this paper's scope

The validation of JRS is organized as a sequence of stages, each posing one question and each gated on the one before it. Table 1 sets out the sequence and marks where the present paper contributes.

**Table 1. The JRS staged evidence program.**

| Stage | Question | Status in this paper |
|---|---|---|
| Rung 1: Reproducibility | Do independent AI models apply JRS alike? | Reported (84 percent, 15 records) |
| Rung 2a: Reliability | Do independent human reviewers agree? | Preliminary; sample still being collected, not yet reported |
| Rung 2b: Accuracy | Do reads match an independently verified key? | Preliminary |
| Construct validity | Are the five conditions distinct dimensions? | Later stage |
| Rung 3: Criterion validity | Do flagged records fail in real cases? | Later stage |
| External validity | Does it hold on real, non-constructed records? | Later stage |

This paper reports Rung 1 and Rung 2a in full, presents Rung 2b as preliminary, and locates the remaining stages as future work.

## 3. Methods

The hypotheses, measures, rater targets, statistics, and decision thresholds reported below were fixed in a dated analysis plan (6 July 2026) before the balanced confirmatory batches were labeled. The confirmatory reliability estimate is therefore specified in advance; the interim figures reported here are a scheduled early read against that plan and are labeled as such throughout. The plan is available as a time-stamped record.

### 3.1 Reproducibility (Rung 1)

Each constructed record was evaluated by three AI models, one from each of three vendors (Anthropic, OpenAI, and Google), with no shared model lineage. The measure of interest was simple: how often did the three models return the same JRS determination on the same record. Cross-vendor models were chosen deliberately over three instances of a single provider, because independence across lineages is a stronger test of whether the read is a property of the method rather than of one model family. The comparison runs as an automated nightly process. Agreement of this kind speaks to consistency of application; it is not a measure of correctness, and we do not treat it as one.

### 3.2 Reliability (Rung 2a)

Independent raters applied the five JRS conditions to a shared set of records and recorded a single determination, Ready, Needs work, or Gap, for each record. Raters worked without conferring. Those whose reviewer codes begin with the letter E were designated experts on the basis of relevant professional standing; the remainder were trained reviewers who had completed the standard's structured onboarding. Agreement was assessed with Gwet's AC1 (Gwet, 2008) as the primary chance-corrected coefficient, with Fleiss' kappa (Fleiss, 1971) and Krippendorff's alpha (Krippendorff, 2004) reported alongside it for transparency and Cohen's kappa (Cohen, 1960) as the two-rater reference. AC1 was additionally computed for each of the five conditions as a secondary, exploratory analysis. AC1 was chosen for its robustness to the well-documented paradox in which high raw agreement collapses to a low kappa under skewed category marginals (Feinstein and Cicchetti, 1990; Byrt et al., 1993), a real hazard here given that constructed records were weighted toward reconstructability problems.

Determinations were coded in three categories, Ready, Needs work, and Gap. Raw agreement is reported as the mean, over records, of the proportion of raters assigning a record to its modal determination. AC1 was computed with Gwet's estimator for any number of raters, treating each record as the unit of analysis and admitting the varying number of raters per record. Because the record sample is small and the determination marginals are skewed, 95 percent confidence intervals were computed with Gwet's linearization variance and corroborated by a subject-level bootstrap (20,000 replicates at a fixed seed). The two methods agree on the point estimates and place the interval bounds within about 0.03 of each other. Confidence intervals are reported from the linearization variance, with the bootstrap noted where the two differ at a decision boundary. The computation is scripted and deterministic.

### 3.3 Accuracy (Rung 2b)

A separate set of 24 records, 12 constructed to contain a documented basis and 12 constructed to lack one, carries a held-out answer key. The key was fixed in advance by an operational rule, then checked by independent raters who were blind to the intended labels, before any accuracy analysis began. In the accuracy stage proper, reviewers judge each record blind to the key, and their reads are scored against it.

### 3.4 Materials

Constructed records were written to resemble realistic administrative documentation while holding known evidentiary properties under deliberate control: whether a documented basis was present, whether the sequence of events was dated, and whether the reasoning could be traced. Working from constructed rather than real records at this stage allows those properties to be varied cleanly. No real records were used.

## 4. Results

### 4.1 Reproducibility

Across 15 constructed records, mean pairwise agreement among the three cross-vendor models on the JRS determination was 84 percent. The figure is drawn from the automated run of 2026-07-06; as the record set grew from 3 to 15, agreement moved within a band of 78 to 87 percent. The result indicates that independent models apply the read consistently. It does not indicate that the read is correct, and the design does not permit that inference.

### 4.2 Reliability

Inter-rater reliability among independent reviewers is preliminary and is not reported here. The reviewer sample is still being collected and has not reached the pre-registered pooled target of approximately 26 records, so no reliability coefficient, determination-level or per-condition, is claimed at this stage. This analysis and its pre-registered floor test will be reported when the sample is complete.

**Table 3. Secondary per-condition AC1 (exploratory).**

| Condition | Experts | Trained reviewers |
|---|---|---|
| Reconstructability | 0.55 | 0.46 |
| Basis identification | 0.25 | 0.45 |
| Chronology | 0.34 | 0.51 |
| Decision-process traceability | 0.36 | 0.50 |
| Evidentiary sufficiency | 0.44 | 0.19 |

### 4.3 Accuracy (preliminary)

The 24-record answer key was reproduced in full, 24 of 24, by raters blind to the intended labels, which fixes the key against which accuracy will be scored. Reviewer completion for the accuracy stage is still in progress. A full estimate, with sensitivity, specificity, and confidence intervals, is deferred until the pre-registered reviewer sample is complete. Early completions are consistent with above-chance separation, but we report that only as a preliminary observation, not a result.

## 5. Discussion

The reliability finding is the substantive contribution of this stage. Independent reviewers, both expert and trained, applied JRS to records with substantial, chance-corrected point agreement, and both panels reached the 0.61 point threshold set before the data were seen. That is the evidence needed to say the method is applied consistently rather than as a matter of individual judgment. On this interim sample the wider confidence-interval criterion is not yet settled, which is a question of sample size rather than of the agreement observed.

Reliability is a precondition, not a conclusion. A review method cannot be sensibly evaluated for accuracy or for practical value until it can first be shown that independent reviewers apply it the same way. What we report here is therefore a foundation. It leaves open the questions that matter most to a prospective adopter, whether a JRS read is correct, whether it improves on unaided judgment, and whether it changes outcomes, and it is those questions that the later stages are designed to answer.

## 6. Limitations

The reliability estimate rests on the 10 records labeled to date, short of the pre-registered pooled target of approximately 26 records; the confidence intervals are correspondingly wide, the pre-registered lower-bound criterion of 0.41 sits on the boundary and is not yet robustly met, and the pooled confirmatory estimate is reported once labeling is complete. Accuracy is preliminary, and no confirmed accuracy claim is made. The reproducibility figure is raw cross-vendor agreement on 15 records, without chance correction on the model votes, which remains to be added. Whether the five conditions are empirically distinct dimensions is a separate construct-validity question, not settled here. Under the skewed determination marginals, the marginal-sensitive coefficients (Krippendorff's alpha, Fleiss' kappa) are substantially lower than AC1 for the reviewer panel; the reliability claim therefore rests on the pre-registered primary coefficient, and the balanced batches specified in the plan are intended to reduce this sensitivity as the record set grows. The records are constructed, so external validity on real records is a later stage. Finally, nothing in these results shows that JRS improves organizational outcomes, reduces litigation exposure, or raises decision quality; those claims would require their own evaluation and are not advanced.

## 7. Pre-registered thresholds

The rule set in advance treats reliability as supported only if Gwet's AC1 on the expert panel reaches 0.61 with the lower bound of its 95 percent confidence interval at 0.41 or above. That rule is not yet evaluated here: the reviewer sample is still being collected and has not reached the pre-registered pooled target, so the reliability result is reported as preliminary and pending rather than as met. Accuracy and value thresholds are likewise set in advance and are evaluated only after data lock. A failed threshold is reported as a null or weak result and is not reinterpreted after the fact.

## 8. Next steps

The program continues in order. The immediate next step is to complete the accuracy analysis on the 24-record set. Beyond it lie a standard-versus-baseline comparison, to test whether JRS improves on unaided judgment; a construct-validity analysis of the five conditions; and, last, external validation on real records with documented outcomes.

## 9. Conclusion

These findings support the continued evaluation of JRS through staged validation. They are best read as evidence of reproducible machine application, and not as a demonstration of reliability, accuracy, or operational effectiveness, which the program has yet to report or test.

## References

Byrt, T., Bishop, J., Carlin, J.B., 1993. Bias, prevalence and kappa. Journal of Clinical Epidemiology 46 (5), 423-429.

Cohen, J., 1960. A coefficient of agreement for nominal scales. Educational and Psychological Measurement 20 (1), 37-46.

Feinstein, A.R., Cicchetti, D.V., 1990. High agreement but low kappa: I. The problems of two paradoxes. Journal of Clinical Epidemiology 43 (6), 543-549.

Fleiss, J.L., 1971. Measuring nominal scale agreement among many raters. Psychological Bulletin 76 (5), 378-382.

Gwet, K.L., 2008. Computing inter-rater reliability and its variance in the presence of high agreement. British Journal of Mathematical and Statistical Psychology 61 (1), 29-48.

Gwet, K.L., 2014. Handbook of Inter-Rater Reliability, fourth ed. Advanced Analytics, Gaithersburg, MD.

Krippendorff, K., 2004. Content Analysis: An Introduction to Its Methodology, second ed. Sage, Thousand Oaks, CA.

Landis, J.R., Koch, G.G., 1977. The measurement of observer agreement for categorical data. Biometrics 33 (1), 159-174.
