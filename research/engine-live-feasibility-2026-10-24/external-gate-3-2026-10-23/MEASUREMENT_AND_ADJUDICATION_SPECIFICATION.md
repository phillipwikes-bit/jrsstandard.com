# Measurement and Adjudication Specification

**NON-OPERATIVE. Prepared 2026-10-23. Definitions only. No measure has been calculated, and
none may be calculated before an approved evaluation reaches adjudication.** Independent
evaluation is not authorized. B-018 remains OPEN. Release status remains
NO_GO_NOT_VERIFIED.

**Thresholds.** No current approved protocol sets a threshold for any measure (the sealed
protocol JRS-IEP-0.1-draft records none, and the Phase 9 measurement plan sets none). Every
threshold requires owner approval at gate G8 before labeling begins.

**Source of truth.** For every measure the source of truth is the adjudicated label
produced under the protocol approved at G7. Candidate output is never a source of truth.

| ID | Measure | Construct | Unit of analysis | Labelling or adjudication role | Minimum reporting fields | Known limitation | Prohibited interpretation before an approved evaluation |
|---|---|---|---|---|---|---|---|
| EM-01 | Agreement between independent reviewers | Consistency of human judgment before adjudication | One item, one condition, two labels | Labelers one and two | Statistic named at freeze; count of items; per-condition values; confidence interval | Depends on the labeling form and the material; not a measure of the candidate | Any statement that human review is reliable |
| EM-02 | Disagreement rate by JRS condition | Where human judgment diverges | One condition across items | Labelers; adjudicator records outcome | Count and share per condition; adjudication outcome distribution | Small counts per condition limit interpretation | Any ranking of conditions by difficulty |
| EM-03 | Escalation or abstention rate | How often reviewers or the candidate decline to decide | One item, one condition | Labelers; candidate output recorded separately | Separate rates for reviewers and candidate; reasons recorded | High rates may reflect material choice, not quality | Any statement that abstention is correct or incorrect |
| EM-04 | Engine-to-reviewer routing agreement | Whether the candidate route matches the adjudicated route | One item, one condition | Adjudicator | Confusion table of candidate route against adjudicated route; counts | Route categories differ between protocols; mapping must be fixed at freeze | Any accuracy or performance statement |
| EM-05 | False-support risk | Cases where candidate text presence indicates support but the adjudicated semantic assessment does not | One item, one condition with a verified quotation | Labelers; adjudicator | Count and share; example item identifiers (no record content); condition | Depends on the share of such cases in the material | Any statement that the candidate establishes semantic support |
| EM-06 | Chronology, scope and conflict-routing error categories | Types of routing error by category | One labelled error | Adjudicator | Count per category; category definitions fixed at freeze | Category assignment is itself a judgment | Any claim that an error category is absent or rare |
| EM-07 | Missing-evidence detection | Whether the candidate identifies information the record lacks | One item, one condition labelled as missing information | Labelers; adjudicator | Count labelled missing; share identified by the candidate; share not identified | Depends on how missing information is labelled | Any statement of completeness |
| EM-08 | Stability across equivalent record transformations | Whether presentation-only changes alter the candidate route | One original and transformed pair | Labelers confirm equivalence; candidate outputs compared | Transform list fixed at freeze; count changed; direction of change | Equivalence is a human judgment; transforms are a limited set | Any robustness statement |
| EM-09 | Quote-verification accuracy | Whether quotations the candidate marks verified occur at the recorded offsets (protocol M1 and M2) | One quotation | Labelers | Precision and recall counts; offsets checked | Measures text presence only, not support | Any statement about semantic support |

## Adjudication specification

- First-pass labels are locked before any adjudication and are never overwritten.
- Adjudication is triggered by disagreement between labelers, by any escalating outcome,
  or by a labeler flagging ambiguity.
- The adjudicator records the controlling record text, the reason for the outcome, and
  whether the divergence arose from record ambiguity, protocol ambiguity or reviewer
  error.
- Adjudicated outcomes are reported alongside, not in place of, first-pass agreement.
- The adjudication rule is fixed at G7; any change requires a new protocol version and
  re-labeling of affected items.
