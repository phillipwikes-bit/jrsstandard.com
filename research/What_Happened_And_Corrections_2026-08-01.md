# What happened, in plain English, and what needs correcting (2026-08-01)

## The mistake I made

When I recomputed your reliability score earlier this session, I mixed in the wrong data. Your reviewers labeled records in two modes: the JRS mode (they used the five conditions) and a baseline mode (a general prompt, no JRS conditions). Reliability of the JRS read should only use the JRS-mode labels. I accidentally included baseline-mode labels from three reviewers. That produced a false result: a "collapse" to AC1 0.18.

Believing that false 0.18, I told you the reliability had failed, and I had you pull the reliability result off the website, out of the article drafts, and delete two PDFs. All of that was based on my miscalculation.

## What is actually true (verified today from your live database, JRS reads only)

- Experts: AC1 = 0.74
- Trained reviewers: AC1 = 0.62
- Both clear your pre-registered 0.61 floor.

These match your original numbers (0.74 and 0.63). Nothing collapsed. Your reliability result was valid the whole time. When I include the baseline labels the wrong way, it reproduces the false 0.157 (about 0.18), which confirms that mixing the modes was the error.

The one honest caveat that was always true: this is interim, based on 10 of about 26 planned records, so the confidence intervals are wide. It clears the floor on the point estimate; it is not yet final.

## The numbers, Arm A and Arm B

**Arm A (named expert detection panel)**
- Completion (verified today): 14 reviewers finished all 24 records; 1 more at 22/24. Across 10 countries on 5 continents.
- Accuracy: about 82.6 percent against the verified key. This figure is from the query you ran last session; it is in the tracker. I could not re-verify it from this environment (see the access note below).

**Arm B (blind randomized comparison, fresh expert reviewers)**
- Completion (verified today): 11 finished. 4 in the JRS group (B1), 7 in the baseline group (B2); 1 more in progress.
- Accuracy (from your query last session, in the tracker): B1 (JRS) 74.0 percent, B2 (baseline) 72.9 percent. The difference is about +1 point, not statistically significant at this sample size. B1 is still below the pre-registered per-arm target.

**Reliability (verified today):** experts 0.74, trained 0.62, both pass the 0.61 floor, interim.

**Reproducibility (locked figure):** 84 percent cross-vendor agreement across 15 records. This is consistency, not accuracy.

## What now needs correcting because of my error

The reliability result is valid, so the changes I had you make to hide it should be reversed if you want to report it:

1. Public pages (research.html, pilot.html, results.html, and the acquisition page): I changed these to say reliability is "still being collected, not reported." They can be restored to the real interim result: experts 0.74, trained 0.62, both clear the floor, interim on 10 records.
2. Article drafts (Detection/Arm B, Article1 Rungs 1-2, Business Ethics): the reliability paragraph was pulled the same way and can be restored with the interim qualifier.
3. Deleted PDFs (JRS_Reliability_Accuracy.pdf, JRS_Validation_Report.pdf): deleted based on the false number. Both are recoverable from git history.
4. LinkedIn paragraph: the reliability sentence was removed and can be restored, worded as substantial interim agreement rather than a final claim.
5. Panel counts in the drafts are stale: update Arm A to 14 complete and Arm B to 11 complete (4 JRS, 7 baseline).

## Access note (why I keep saying "verified today" for some numbers and not others)

In this environment I can read your public aggregate views (completion counts and the reliability labels), which is how I verified completion and reliability today. I cannot reach the locked answer tables that hold the detection and Arm B accuracy answers, and the Supabase connection is not available to me as a tool in this session. So the accuracy figures (82.6, 74.0, 72.9) are the ones you produced by your own query last session. If you want them re-verified, that has to run where the database connection is actually available.
