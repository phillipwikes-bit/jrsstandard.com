# Construct-Validity Data Package — for the organizational psychologist

*Purpose: give an organizational psychologist everything needed to test whether the five JRS conditions behave as distinct, coherent dimensions (dimensionality / factor structure / inter-condition correlation).*

## What is in this package
- **`construct_validity_data.csv`** — the analysis-ready dataset. One row per (record × rater). Columns: `record_id`, `labeler_code`, `role`, the five condition ratings, and the overall `determination`.
- Coverage: **10 records, 21 raters, 108 rated rows.** Each condition rated on a 3-level scale: `pass`, `review`, `gap`.

## The five conditions AS STORED IN THE DATA
`basis_identification` · `cold_reviewer_clarity` · `accountability_support` · `reasoning_traceability` · `temporal_reconstructability`

## ⚠️ NAMING MISMATCH TO RESOLVE BEFORE ANALYSIS
The condition names in the data are **not** the same as the five conditions named in the JRS standard and in Article 1. They must be reconciled so the psychologist knows what each column measures. Below is a **proposed** mapping — it needs your confirmation; do not treat it as authoritative yet.

| Data column | Proposed standard condition (CONFIRM) |
|---|---|
| `basis_identification` | Evidentiary Anchoring |
| `cold_reviewer_clarity` | Record Self-Sufficiency |
| `reasoning_traceability` | Decision-Process Traceability |
| `temporal_reconstructability` | Chronological Integrity |
| `accountability_support` | Evidentiary Sufficiency |

If this mapping is wrong, the construct-validity interpretation will be wrong. This is the single thing to fix before the psychologist runs anything.

## What the psychologist can do with this
1. **Dimensionality:** exploratory/confirmatory factor analysis or PCA on the five condition ratings — do they load on one factor (one underlying "reconstructability") or several distinct dimensions?
2. **Inter-condition correlation matrix:** are any two conditions so highly correlated they are effectively redundant?
3. **Item–total behavior:** does each condition contribute distinctly to the overall `determination`?
4. **Internal consistency:** ordinal reliability (e.g., ordinal alpha / omega) across the five conditions.

## Honest limitations to hand them
- 10 records is small for factor analysis; results are exploratory, not confirmatory. More records would be needed for a stable factor solution.
- Ratings are ordinal (pass/review/gap), so ordinal methods apply.
- Raters mix experts and trained reviewers (`role` column lets them split or model this).
- This addresses construct validity only; it is separate from reliability (Rung 2a) and accuracy (Rung 2b).

## Status
- Data: **ready and exported.**
- Naming reconciliation: **pending your confirmation.**
- Organizational psychologist: **not yet recruited.**
