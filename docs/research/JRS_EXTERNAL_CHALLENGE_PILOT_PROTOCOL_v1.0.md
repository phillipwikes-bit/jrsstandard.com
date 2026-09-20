# JRS External Challenge Pilot Protocol v1.0

**Status:** READY FOR EXTERNAL EXECUTION — no external results claimed  
**Date:** 2026-09-20  
**Objective:** Test whether qualified external practitioners, without founder participation in rating or adjudication, can apply the JRS Codebook to masked consequential case records and identify where the Codebook or record creates ambiguity.

## 1. Design

Use 3 to 5 masked consequential case records. Each record must be suitable for review under the existing five JRS conditions and must contain enough documentary structure to permit evidence locators. No case is included merely because it produces a dramatic result.

The founder may perform administrative preparation before launch: remove direct identifiers, assign record IDs, hash the final masked files, freeze the packet, and transmit identical materials. The founder must not serve as a rater, adjudicator, tie-breaker, or live interpreter of an individual record.

## 2. Practitioner eligibility

A practitioner is qualified when the project can document current or prior professional responsibility involving at least one of: investigations, compliance review, audit, employment decision review, housing/administrative decision review, records governance, legal review, risk/governance review, or another role requiring evidence-based review of consequential records.

Record the qualification basis factually. Do not convert professional title into a claim of JRS expertise.

## 3. Materials

Every practitioner receives exactly:
1. the same frozen JRS Codebook version;
2. JRS Adjudication Protocol v1.0;
3. the same 3 to 5 masked case records;
4. the same reviewer response template;
5. a short written instruction that ratings must be based only on the supplied corpus;
6. the same deadline and clarification channel.

No participant receives another participant's first-pass response before submitting their own.

## 4. Masking and case integrity

Before distribution:
- remove direct personal identifiers not necessary to the review question;
- preserve substantive chronology and evidentiary relationships;
- assign a stable CASE-### identifier;
- calculate and record a cryptographic hash for the exact distributed file;
- record the masking actions without retaining unnecessary identifiers in the pilot packet;
- freeze the packet version.

Masking must not silently repair a documentary defect being tested. If masking itself removes information material to a JRS condition, record that limitation and either replace the case or mark the affected condition not assessable for the pilot.

## 5. First-pass collection

For every case and every condition collect:
- PASS / REVIEW / GAP;
- evidence locator;
- rationale;
- ambiguity flag;
- confidence;
- optional MISSING / UNSUPPORTED descriptive subcategory where relevant.

Collect submission timestamp and reviewer pseudonymous ID. Do not collect a founder rating.

## 6. Mandatory escalation

Apply JRS Adjudication Protocol v1.0. Secondary review is mandatory for every non-unanimous condition code, MISSING/UNSUPPORTED divergence, Codebook ambiguity flag, LOW-confidence code, material evidence-locator divergence, external-information dependency, or routing disagreement.

## 7. Metrics

The pilot must report, without collapsing distinct measures:
- number of practitioners invited;
- number completing;
- number of cases;
- number of condition-level first-pass decisions;
- raw exact agreement by condition and overall;
- number and proportion of condition decisions requiring secondary review;
- count of MISSING/UNSUPPORTED divergences;
- count of Codebook-ambiguity flags;
- count of record-ambiguity flags;
- count of unresolved external-information dependencies;
- failure-mode counts using FM-01 through FM-15;
- candidate and confirmed false positives;
- candidate and confirmed false negatives if the protocol supports establishing them;
- adjudication changes, reported separately from first-pass agreement.

A chance-corrected inter-rater statistic may be calculated only with an explicitly recorded method appropriate to the collected design. Its sample, denominator, uncertainty method, and criterion must travel with the result. No result may be described as real-world effectiveness merely because practitioners reviewed consequential records.

## 8. Ambiguity threshold

For this pilot, an item enters the formal ambiguity register when any practitioner marks CODEBOOK AMBIGUITY or BOTH, or when secondary review attributes a divergence to the Codebook. A Codebook provision becomes a **clarification candidate** when the same provision generates Codebook-attributed divergence in at least two independent case-condition events.

This threshold triggers review; it does not automatically authorize changing the Codebook. A change requires controlled versioning and preservation of the original wording.

## 9. Failure-mode register

Maintain one row per event with:
- event ID;
- case ID;
- condition;
- first-pass codes;
- divergence type;
- controlling evidence locators;
- Codebook provision;
- secondary-review outcome;
- failure-mode code(s);
- false-positive/false-negative status;
- clarification candidate yes/no;
- unresolved dependency;
- reviewer notes stripped of direct identifiers.

## 10. Interpretation limits

The pilot can establish observed challengeability, reviewer divergence, recurring ambiguity, and failure modes within this small masked case set. It does not by itself establish population-level accuracy, generalizability, operational effectiveness, legal sufficiency, regulatory compliance, prevention of historical harm, or prospective risk reduction.

## 11. Completion gate

The pilot is complete only when the frozen packet, first-pass responses, secondary-review records, metric calculation record, ambiguity register, failure-mode register, and limitations statement are preserved. Until external practitioners actually complete the work, status remains READY FOR EXTERNAL EXECUTION and all result fields remain NOT MEASURED.
