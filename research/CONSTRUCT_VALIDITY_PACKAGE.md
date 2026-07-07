# Construct-Validity Data Package — for the organizational psychologist

*Purpose: give an organizational psychologist everything needed to test whether the five JRS conditions behave as distinct, coherent dimensions (dimensionality / factor structure / inter-condition correlation).*

## What is in this package
- **`construct_validity_data.csv`** — the analysis-ready dataset. One row per (record × rater). Columns: `record_id`, `labeler_code`, `role`, the five condition ratings, and the overall `determination`.
- Coverage: **10 records, 21 raters, 108 rated rows.** Each condition rated on a 3-level scale: `pass`, `review`, `gap`.

## The five conditions AS STORED IN THE DATA
`basis_identification` · `cold_reviewer_clarity` · `accountability_support` · `reasoning_traceability` · `temporal_reconstructability`

## Condition crosswalk (authoritative — derived from the codebook definitions)
The data stores the five conditions under working keys. The mapping below to the canonical standard names is derived from the **codebook definitions** (`codebook.html`, RC1–RC5), not from surface names, so it is authoritative. Two mappings are deliberately counter-intuitive by name and correct by definition: `reasoning_traceability` is RC1 (tracing evidence→conclusion), and `accountability_support` is RC4 (who decided, criteria, mitigating information).

| Data column | Codebook (RC) | Canonical standard name | Definition basis |
|---|---|---|---|
| `reasoning_traceability` | RC1 Reconstructability | **Record Self-Sufficiency** | conclusion reconstructable from the record itself |
| `basis_identification` | RC2 Basis Identification | **Evidentiary Anchoring** | source of each characterization is identified |
| `temporal_reconstructability` | RC3 Chronology | **Chronological Integrity** | sequence of events followable from dates |
| `accountability_support` | RC4 Decision-Process Traceability | **Decision-Process Traceability** | who decided, criteria/threshold, mitigating info |
| `cold_reviewer_clarity` | RC5 Evidentiary Sufficiency | **Evidentiary Sufficiency** | a cold reviewer could assess it unaided |

The raw column names are kept as-collected (renaming mid-study would break continuity with the existing data); use this crosswalk to label factors in the write-up.

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
- Naming reconciliation: **resolved** (authoritative crosswalk above, derived from codebook definitions).
- Organizational psychologist: **not yet recruited.**
