# JRS Adjudication Protocol v1.0

**Status:** OPERATIONAL PROTOCOL — controlled challenge/testing use  
**Date:** 2026-09-20  
**Scope:** Human review of masked consequential case records under the JRS Codebook.  
**Authority boundary:** This protocol resolves coding divergence for research and evaluation records. It does not make the underlying consequential employment, housing, administrative, compliance, legal, or regulatory decision.

## 1. Purpose

The protocol makes disagreement observable instead of allowing a founder, facilitator, or software output to silently collapse it. The primary unit is one reviewer × one record × one JRS condition. The five conditions remain Basis Identification, Decision-Process Traceability, Reconstructability, Evidentiary Sufficiency, and Chronology.

## 2. Required independent first pass

Each reviewer receives the same masked record packet, the same Codebook version, the same written task, and the same response form. Reviewers code independently before seeing another reviewer's labels or rationale. The founder does not participate as a rater, does not explain an individual record during first-pass coding, and does not resolve a disagreement.

For every condition the reviewer records:
- status: PASS, REVIEW, or GAP;
- evidence locator: the page, paragraph, field, timestamp, exhibit, or other reproducible location relied upon;
- concise rationale;
- ambiguity flag: NONE, RECORD AMBIGUITY, CODEBOOK AMBIGUITY, or BOTH;
- confidence: HIGH, MODERATE, or LOW.

Confidence is descriptive metadata. It does not override the status and is not a substitute for agreement measurement.

## 3. Unsupported versus Missing

**MISSING** means the record does not contain an identifiable proposition, item, event, source, chronology element, or evidentiary component required to evaluate the condition.

**UNSUPPORTED** means the record contains the proposition, item, event, source, chronology element, or conclusion, but the supplied corpus does not provide traceable support sufficient for an independent reviewer to connect that proposition to its stated basis.

A reviewer must not code MISSING merely because support is weak. A reviewer must not code UNSUPPORTED when the thing requiring support is absent from the supplied corpus.

Mandatory reference rule:
- if one reviewer codes MISSING and another codes UNSUPPORTED for the same condition, secondary review is mandatory;
- the secondary reviewer must match each rationale to the Codebook definition and inspect the cited record locations;
- if the corpus contains the proposition but not adequate support, the adjudicated descriptive category is UNSUPPORTED;
- if the corpus does not contain the proposition or required component, the adjudicated descriptive category is MISSING;
- if the distinction cannot be resolved without information outside the masked packet, the result is UNRESOLVED — EXTERNAL INFORMATION REQUIRED. No missing fact may be invented.

## 4. Convergence rule

A condition converges on first pass only when all assigned reviewers select the same PASS/REVIEW/GAP status.

Secondary review is mandatory when any one of the following occurs:
1. the reviewers do not unanimously converge on PASS/REVIEW/GAP for a condition;
2. any MISSING versus UNSUPPORTED divergence occurs;
3. any reviewer marks CODEBOOK AMBIGUITY or BOTH;
4. any reviewer marks LOW confidence;
5. reviewers cite materially different portions of the record as the basis for the same status and the difference could change the interpretation;
6. a reviewer identifies information outside the supplied packet as necessary to decide the code;
7. a record-level routing result would differ depending on which first-pass code is used.

This threshold is deliberately conservative for the challenge pilot. It is an escalation rule, not a claim that unanimity is the correct statistical reliability criterion for later studies.

## 5. Secondary review

The secondary reviewer must be qualified under the pilot eligibility rule and must not be the founder. The secondary reviewer receives:
- the masked record;
- the applicable Codebook version;
- the divergent codes;
- the first-pass rationales and evidence locators;
- no reviewer identities.

The secondary reviewer performs standard-reference matching and records:
- which Codebook text controls;
- which record evidence controls;
- whether the divergence arose from record ambiguity, Codebook ambiguity, reviewer error, or an unresolved external-information dependency;
- the resulting adjudicated research code, if one can be supported;
- whether a Codebook clarification is recommended.

Adjudication never erases first-pass data. Original codes, rationales, timestamps, and disagreement remain immutable research observations. The adjudicated code is stored as an additional field.

## 6. Failure-mode taxonomy

Every escalated item receives one or more of these codes:
- FM-01 MISSING/UNSUPPORTED boundary confusion;
- FM-02 condition-definition ambiguity;
- FM-03 evidence-locator disagreement;
- FM-04 chronology interpretation disagreement;
- FM-05 inference beyond the supplied record;
- FM-06 insufficient record context;
- FM-07 status-threshold disagreement;
- FM-08 record-level routing disagreement;
- FM-09 false positive: a weakness was coded where the supplied record supports the condition;
- FM-10 false negative: a weakness present under the Codebook was not coded;
- FM-11 terminology or jurisdictional interpretation;
- FM-12 duplicate/overlapping evidence interpreted inconsistently;
- FM-13 external information required;
- FM-14 protocol deviation;
- FM-15 other, with a mandatory written description.

## 7. False-positive rule

A first-pass finding is registered as a candidate false positive when secondary review identifies specific supplied evidence satisfying the applicable Codebook requirement that the first-pass reviewer overlooked or interpreted incorrectly. It becomes a confirmed pilot false positive only after the secondary reviewer records the controlling Codebook text and evidence locator. The founder cannot unilaterally label a reviewer's finding false positive.

## 8. Outputs

For every record preserve:
- masked record ID;
- record hash;
- Codebook version;
- reviewer pseudonymous IDs;
- independent first-pass codes;
- rationales and evidence locators;
- ambiguity and confidence metadata;
- divergence flags;
- secondary-review record;
- adjudicated research code where supported;
- failure-mode codes;
- candidate/confirmed false-positive status;
- unresolved dependencies.

## 9. Reporting

Report raw first-pass agreement separately from adjudicated outcomes. Do not replace the former with the latter. Report the number of records, reviewers, condition-level decisions, divergence events, secondary reviews, unresolved items, false positives, and failure modes. Any chance-corrected agreement statistic must identify the statistic, analytic unit, sample, denominator, confidence interval method where applicable, and pre-specified criterion. Do not call raw agreement reproducibility, accuracy, reliability, or validation.

## 10. Change control

Any change to a condition definition, escalation threshold, failure-mode taxonomy, or adjudication rule requires a new protocol version. Data collected under an earlier version remains attributed to that version. Historical observations are never rewritten to conform to a later protocol.
