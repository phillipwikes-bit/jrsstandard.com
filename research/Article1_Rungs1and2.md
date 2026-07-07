# Reliability and Accuracy of a Record-Level Review Standard (JRS)

### Rungs 1 and 2 of the JRS Evidence Development Program

*Draft. Reliability results below are computed from collected data. Accuracy results are preliminary (data collection ongoing). Reproducibility (Rung 1) is described as method; data not yet collected. Numbers verified against the study database.*

---

## Abstract

The Justification Review Standard (JRS) is a record-level review method that asks one question of a record: can a later reviewer reconstruct how a conclusion was reached from the record alone? A record that cannot carries what we term Decision Reconstruction Risk (DRR). This paper reports the first two rungs of a staged validation program. **Reliability (Rung 2a):** across 10 records, independent experts applying JRS reached substantial agreement (Gwet's AC1 = 0.74; 88% raw agreement, mean 3.6 experts per record), and a larger reviewer pool also reached substantial agreement (AC1 = 0.63; 83% raw agreement, mean 7.2 reviewers per record). **Accuracy (Rung 2b, preliminary):** on a 24-record set with an independently verified answer key, early reviewers separated grounded from ungrounded records; full accuracy analysis awaits completion of the reviewer sample. **Reproducibility (Rung 1)** is defined and its procedure specified; data collection is pending. Results are reported against pre-registered thresholds.

## 1. Background

Records increasingly justify consequential decisions, and increasingly they are drafted with AI assistance that makes them fluent without guaranteeing that the basis for a conclusion is present. JRS evaluates a record on whether its reasoning is reconstructable from the record itself, across five conditions: record self-sufficiency, evidentiary anchoring, chronological integrity, decision-process traceability, and evidentiary sufficiency. Each record receives one of three determinations: Ready, Needs work, or Gap. The property JRS targets, and DRR names, is whether a later reviewer could rebuild the reasoning without the original author present.

## 2. The evidence program and this paper's scope

Validation proceeds in rungs. Rung 1 asks whether the standard is applied reproducibly (including across independent AI models). Rung 2 asks whether it is applied reliably by independent human raters (2a) and whether those judgments are accurate against a known key (2b). This paper reports Rung 2a in full, Rung 2b as preliminary, and specifies the Rung 1 procedure.

## 3. Methods

### 3.1 Reliability (Rung 2a)
Independent raters applied the five JRS conditions to a shared set of records, recording a determination (Ready / Needs work / Gap) for each. Raters worked independently. Raters whose codes begin with E are designated experts; the remainder are trained reviewers. Agreement was assessed with Gwet's AC1 as the primary chance-corrected coefficient, chosen for its robustness to the kappa paradox under skewed category marginals, with raw percent agreement reported alongside.

### 3.2 Accuracy (Rung 2b)
A separate 24-record set (12 constructed grounded, 12 constructed ungrounded) carries a held-out answer key. The key was fixed by an operational rule and verified by independent raters blind to the intended labels before any accuracy analysis. Reviewers judge each record blind to the key; accuracy is scored against the verified key.

### 3.3 Reproducibility (Rung 1)
Multiple independent AI models apply the five conditions to the same records; cross-model agreement is measured with the same coefficients as Section 3.1. This procedure is specified here; data are not yet collected.

## 4. Results

### 4.1 Reliability (Rung 2a) — collected data
Across **10 records**:

| Rater group | Records | Mean raters/record | Raw agreement | Gwet's AC1 |
|---|---|---|---|---|
| Experts | 10 | 3.6 | 88% | **0.74** |
| Trained reviewers | 10 | 7.2 | 83% | **0.63** |

Both coefficients fall in the "substantial" range. The reviewer coefficient (0.63) clears the pre-registered reliability floor (AC1 ≥ 0.61). Across all JRS-mode determinations, the distribution was Gap 63%, Needs work 21%, Ready 18%, consistent with a record set weighted toward reconstructability problems.

### 4.2 Accuracy (Rung 2b) — preliminary
The 24-record answer key was independently reproduced by raters blind to the intended labels, 24 of 24, fixing the key against which accuracy is scored. Reviewer completion is in progress; a full accuracy estimate (with sensitivity, specificity, and confidence intervals) is deferred until the pre-registered reviewer sample completes. Early completions are consistent with above-chance separation, reported here as preliminary and not as a confirmed result.

### 4.3 Reproducibility (Rung 1)
Not yet collected. Reported in a later revision once cross-model data exist.

## 5. Discussion

The reliability result is the substantive finding of this stage: independent raters, expert and trained, apply JRS to real records with substantial, chance-corrected agreement, and the reviewer coefficient meets the threshold set in advance. This supports the claim that JRS is applied consistently, not idiosyncratically. It does not by itself establish accuracy (that a JRS determination is correct) or value (that JRS improves on unaided judgment); those are Rung 2b and the standard-versus-baseline comparison, respectively.

## 6. Limitations

- Reliability rests on 10 records; a larger set would tighten the estimate.
- Accuracy is preliminary pending reviewer completion; no confirmed accuracy claim is made here.
- Reproducibility (Rung 1) has no data yet.
- Construct validity (whether the five conditions are distinct dimensions) is a separate analysis requiring an organizational-psychology contributor, not addressed here.
- Records are constructed; external validity on real-world records is a later rung.

## 7. Pre-registered thresholds

Reliability is considered supported only if Gwet's AC1 meets 0.61 with an adequate lower bound; the reviewer result meets this, the expert result exceeds it. Accuracy and value thresholds are pre-registered and evaluated only after data lock. Failing a threshold is reported as a null or weak result and not reinterpreted.

## 8. Attribution

The reference-panel design and the chance-corrected reliability framework (joint use of Gwet's AC1, Krippendorff's alpha, and Fleiss' kappa; treatment of the kappa paradox; pre-registered agreement floors) are methodological contributions of **Ubayet Hossain (Model Validation)**. The proportionality principle referenced in the standard was surfaced by pilot reviewer **Saurabh Nanda** and is credited with permission. Responsibility for the framework as presented rests with the author.

*© 2026 Phillip Wikes · JRS™. Reliability figures computed from collected data; accuracy preliminary; reproducibility pending. Preliminary and observational until all rungs clear their pre-set thresholds.*
