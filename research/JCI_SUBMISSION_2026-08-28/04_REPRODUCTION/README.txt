JCI submission, reproduction materials
Version 2026-08-28

DEPENDENCIES: NONE.
Python 3.8 or later. The Python standard library only. Fisher's exact test, the
Wilson score interval, Cohen's kappa (unweighted and linear weighted) and Gwet's
AC1 are written out in analysis.py rather than imported, so no scientific stack
is required to check any figure in the paper.

NO NETWORK. No internet connection, external database, API key or third-party
package is required. analysis.py reads only files inside this package. It has
been run with all socket access disabled and completes normally.

RUN
    cd 04_REPRODUCTION
    python3 analysis.py            prints every Section 5 figure
    python3 analysis.py --verify   also checks each figure against the
                                   manuscript text and exits non-zero on any
                                   mismatch

INPUTS, all inside this package
    ../02_DATA/JCI_JRS_32_Case_Master_Dataset.csv
    ../02_DATA/JCI_JRS_Construct_Coding_Frame.csv
    ../02_DATA/JCI_JRS_Structural_Coding_Frame.csv
    ../03_RELIABILITY/Blind_Recheck_RESULT_2026-08-28.json
    ../01_MANUSCRIPT/manuscript_verification.txt

WHAT EACH SECTION REPRODUCES
    5.2   concordance with independent government auditors, five of five
    5.3   Fisher's exact, two-sided p = 0.0000520, computed from the construct
          coding frame: Needs work 6 of 7 state a reconstructability failure,
          Ready 0 of 17
    5.4   document class, Fisher's exact p = 0.00466, computed from the
          structural coding frame
          Gap concentration, Fisher's exact p = 0.0000050
    5.5   appellate disposition, Fisher's exact p = 1.000, null
    5.6   cited from the companion employment manuscript, not recomputed here;
          the case list is in 06_COMPANION_STUDY
    5.7   7 of 10 exact agreement, 70.0 percent, 95 percent Wilson 39.7 to 89.2
          Cohen's kappa 0.474 unweighted, 0.559 linear weighted
          Gwet's AC1 0.582
          recomputed from the per-case answers, not read off the summary

EXPECTED OUTPUT
The final line reads "20 probes, 0 mismatch(es)". Any other number means the
data and the manuscript have diverged.

NOTHING IS HARD-CODED THAT THE DATA CAN PRODUCE
The Section 5.3 cell counts come from the construct coding frame and the Section
5.4 groups from the structural coding frame. The chain is case, coding,
analysis, result, and every step is a file in this package.

A NOTE ON SECTION 5.3
An earlier version of the analysis coded all 27 case-level sources. Three carry
no contemporaneous note, and a case with no note cannot be coded for what its
note states. Restricting to the 24 that carry one moves the result from
p = 0.00028 to p = 0.0000520. The restriction is stated in the manuscript and is
applied here.
