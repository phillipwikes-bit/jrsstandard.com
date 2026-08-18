# Surgical revisions, editorial review of v4

Applied 2026-08-18 to `research/Detection_Article_v4_2026-08-16.md`.

Constraint set enforced: no restructuring, no new claims, **no numerical result changed**, no change to the pre-registered primary analysis, no new literature, and no other substantive change.

| Result | Count |
|---|---|
| Edits applied | 0 |
| Already applied on a prior run | 26 |
| Rules that failed to match | 0 |

## The one arithmetic error, verified against the database before correcting

Appendix B used the word "labels" for two different units. `bench_labels` with `mode='jrs'` returns **113 rows**, each carrying five condition values. A live recount gives **pass 207, review 142, gap 216**, which sums to **565**, and 113 x 5 = 565.

So **113 is the count of overall determinations** and **565 is the count of condition-level labels**. The reviewer's arithmetic was right. **No figure changed**; the unit each figure counts is now stated correctly.

## Before and after

## Already applied

- Item 1, Appendix B unit: 113 determinations
- Item 1, Appendix B: descriptive association wording
- Item 1, Appendix B: scale-use counts
- Item 2, Abstract: reference classification
- Item 2, Abstract result: reference classification
- Item 2, Section 4.2: reference classification
- Item 2, Section 6.1: reference classification
- Item 2, Results table header
- Item 2, Conclusion: reference classification
- Item 3, Section 4.4: drop 'fatal'
- Item 4, Section 4.3: not an upper bound
- Item 4, Section 8.2: not an upper bound
- Item 5, Section 4.7: 0.70 justification
- Item 6, Section 3: agnostic by design
- Item 7, Appendix C: ICC on the latent scale
- Item 7, Section 8.3: ICC wording
- Item 8, Appendix C: drop 'no record was hard'
- Item 9, Conclusion: operationalised distinction
- Item 9, Section 7: operationalised distinction
- Item 10, Section 2.3: documentation-layer opacity
- Item 11, Section 4.8: blinding, not deception
- Item 12, Data availability: coded not de-identified
- Item 13, Acknowledgments: compressed
- Item 10, Conclusion: no 'can be real'
- Item 18, Section 4.2: comparison arms are matched experts
- Item 18, Section 5: JRS-naive is not non-expert

## Not done, and why

**Appendix A was not removed.** The reviewer raised removing the three-model analysis as an option conditional on whether automated implementation consistency is regarded as part of the validation programme, and did not include it in the numbered revision set. Item 17 of that set is "do not make any other substantive changes". Removing an appendix is a structural change and is the owner's call, not an editorial correction.

**Section 6.3 is untouched**, on the reviewer's explicit instruction to retain it as a major finding.

**No numeric result was altered.** `scripts/verify_manuscript_figures.py` re-run after the edits.
