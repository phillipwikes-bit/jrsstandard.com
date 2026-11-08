# SEC-0111-2026 | Original-data reanalysis and source-version audit
**Audit date:** 2026-11-08. **Status:** independent reproduction of accessible original score vectors and the historical 99-label source snapshot only. Not a claim to have recovered the full later 104-label original export, individual response matrix, a journal-approved revision or a data-deposit DOI.

## Controlling source files
- [Original reviewer-level accuracy vector, 2026-08-04](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/analysis_2026-08-04.py), blob SHA `369f5962b44b73fabfdbfedc38b2103f1a4227d9`
- [Original 24-item Appendix C](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/aie_submission_2026-09-01/01_Blinded_Manuscript.md), blob SHA `f97ca113fcb3a0ff11e34dd02252aa00ae2db196`
- [Original historical 99-row reliability CSV](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/construct_validity_data.csv), blob SHA `b780a90a38338dd0d998b6c2b29ebe2ba7096109`
- [Later frozen 104-label summary, 2026-08-18](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/current_reliability_2026-08-18.json), blob SHA `ae1485be906831f3358c3c7440acdf346a6bcd7f`
- [Original reference key and disclosure](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/Verified_Key.md), blob SHA `0b5eda5ed58c9d080f70dd3ca96c5e5918b1e7ee`
- [Agreement estimator](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/compute_ac1_ci.py).

## Recomputed detection estimates
The original 16 reviewer score vector, each out of 24, yields **322 matching classifications out of 384**, or **83.8541667%**; reviewer SD **21.02 percentage points**. Reviewer-level Student-t 95% CI, df=15: **72.6534%–95.0549%**. A supplementary, **retrospective** percentile bootstrap across the original **16 reviewer totals**, with **100,000 resamples**, replacement and seed **20261108**, yields **73.1771%–92.9688%**. The bootstrap is a sensitivity check, not the initial registered analysis. The original 24 record-specific numerators independently sum to **322**. By intended class, original item counts yield **167/192=86.9792%** agreement on unsupported records, and **155/192=80.7292%** agreement on grounded records. Sources: original [reviewer vector](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/analysis_2026-08-04.py), original [item table](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/aie_submission_2026-09-01/01_Blinded_Manuscript.md) and [key](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/Verified_Key.md). This is operational-reference agreement, not independently adjudicated human-ground-truth accuracy.

## Recomputed reliability from earlier source
The historical original CSV contains **99 unique record–rater labels**, **21 raters** and **10 multiply rated records**: invited 8 raters / 36 labels; open-enrollment 13 raters / 63 labels. Independently recalculating using the original three-category AC1 estimator gives:

| Statistic | Invited original 99-row subset | Open original 99-row subset |
|---|---:|---:|
| Labels | 36 | 63 |
| AC1 | **0.7394137** | **0.6236370** |
| Analytic 95% CI, bounded at 1 | **0.4023–1.0000** | **0.2530–0.9942** |
| Fleiss kappa, generalized varying-rater estimator | **0.64590** | **0.28491** |
| Krippendorff nominal alpha | **0.61749** | **0.33964** |

The later archived result uses **104 retained rows from 22 raters across 15 labeled records, with 10 multiply rated**, and reports AC1 **0.7394 invited** and **0.6228 open**, plus open-enrollment Fleiss κ **0.2569** and alpha **0.3139**. The earlier source is not the final retained dataset: **the extra five rows, later raw labels and timestamps were not recovered**. Therefore this audit reproduces the original 99-row version, and corroborates but does not independently reproduce the complete later 104-row version. Both the original and later analytic lower AC1 bounds are below the original registered minimum **0.41**, so the documented two-part reliability criterion was not met. Sources: [earlier CSV](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/construct_validity_data.csv), [later summary](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/current_reliability_2026-08-18.json), [protocol](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/DRR_Detection_Validation_Protocol.md).

## De-identified reproducibility deliverables
- [Executable reproduction script](./reproduce_original_data.py)
- [Original 16-reviewer score extract, no personal identifiers](./Original_16Reviewer_Scores_Anonymized.csv)
- [Original 99-row label extract aggregated by record and recruitment group, no rater identifiers](./Original_99Row_Reliability_Aggregated_By_Record.csv)
- [Original 24-item reference-match numerators](./Figure_1_Item_Level_Source.csv).

These materials do not contain the original **16×24 individual respondent-to-record labels** or the later **104 retained raw rater-record labels**. They cannot support a reviewer-paired sensitivity-specificity test, full mixed-effects refit, original-model execution reconstruction, or participant consent certification. No missing raw observation was guessed, and neither reference classifications nor original source files were overwritten. Sources: [original score vector](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/analysis_2026-08-04.py), [original CSV](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/construct_validity_data.csv), [frozen later output](https://github.com/phillipwikes-bit/jrsstandard.com/blob/main/research/current_reliability_2026-08-18.json).

## Reviewer-facing positive response, subject to final page numbers and co-author approval
“We appreciate the referee's request for source-level replication. The revision now independently recalculates the panel mean and original Student-t interval from the archived 16 reviewer scores, reconciles all 24 archived item numerators to the same 322 of 384 classifications, and adds a 100,000-resample participant-level bootstrap as an explicitly retrospective sensitivity analysis. We also reproduce the original committed 99-label reliability snapshot, including AC1, Fleiss' kappa and Krippendorff's alpha for both recruitment groups. We distinguish this earlier dataset from the later 104-retained-label archive and do not claim to have independently reproduced missing inputs. These revisions improve the auditability of the study while preserving the bounded empirical result and the originally reported reliability-criterion shortfall.”

**Remaining gate:** recover and lawfully verify the raw 384 reviewer×record submissions, the later 113 submitted / 104 deduplicated rows with timestamps, and associated consent/authorization records before claiming full raw-data reproducibility or creating a permanent public deposit. The draft is not submitted or merged.
