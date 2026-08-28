JCI submission, reproduction materials
======================================

Python: 3.11 as run. Any Python 3.8 or later should work.
Dependencies: NONE. The Python standard library only. Fisher's exact test, the
Wilson score interval, Cohen's kappa (unweighted and linear weighted) and Gwet's
AC1 are written out in analysis.py rather than imported, so no scientific stack
is required to check any figure in the paper.

INPUTS
  1. The study database, read anonymously through the published endpoint. The
     key embedded in analysis.py is an anonymous publishable key, already
     shipped in the site's HTML, and grants read access to aggregate views only.
  2. Blind_Recheck_RESULT_2026-08-28.json (in 03_RELIABILITY) for Section 5.7.

RUN
  python3 analysis.py            prints every Section 5 figure
  python3 analysis.py --verify   also checks each figure against the manuscript
                                 text and exits non-zero on any mismatch

WHAT EACH SECTION REPRODUCES
  Section 5.2   concordance with independent government auditors, five of five
  Section 5.3   Fisher's exact, two-sided p = 0.0000520
                on the 24 note-carrying case-level sources: Needs work 6 of 7
                state a reconstructability failure, Ready 0 of 17
  Section 5.4   document class, Fisher's exact p = 0.00466
                Gap concentration, Fisher's exact p = 0.0000050
  Section 5.5   appellate disposition, Fisher's exact p = 1.000, null
  Section 5.6   cited from the companion employment manuscript, not recomputed
                here: p = 0.0194 primary, p = 0.0291 sustained coding
  Section 5.7   7 of 10 exact agreement, 70.0 percent
                Cohen's kappa 0.474 unweighted, 0.559 linear weighted
                Gwet's AC1 0.582

EXPECTED OUTPUT
  The final line reads "19 probes, 0 mismatch(es)". Any other number means the
  manuscript and the data have diverged and the paper should not be submitted
  until they agree.

A NOTE ON SECTION 5.3
  An earlier version of this analysis coded all 27 case-level sources. Three of
  them carry no contemporaneous note, and a case with no note cannot be coded
  for what its note states. Restricting to the 24 that carry one moves the
  result from p = 0.00028 to p = 0.0000520. The restriction is stated in the
  manuscript and is applied here.
