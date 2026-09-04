#!/usr/bin/env python3
"""Correct Section 5.6 of the public-records manuscript to the companion study's
current figures.

THE DEFECT. research/FOIL_Article_Draft.md section 5.6 cites the employment
corpus at "22 cases from 22 distinct sources", "7 of 9 ... against 2 of 13 ...
p = 0.0073, odds ratio 19.25", and "6 of 8 ... against 1 of 8 ... p = 0.041,
odds ratio 21.0".

Every one of those numbers is computed on the 22-case SCREENED set. The
employment corpus was corrected on 2026-08-24: two matters fail the stated
inclusion criteria and the analysis runs on 20
(research/Employment_Records_Article_ISACA_2026-08-21.md, note 2 and note 5).

WHY THIS IS WORSE THAN A STALE NUMBER. That manuscript states plainly:
"Including them produces p = 0.0073 with an odds ratio of 19.25. Because those
matters do not meet the stated inclusion criteria, this result is reported only
as a sensitivity analysis." So the public-records paper is presenting the
companion study's EXCLUDED-CASES SENSITIVITY ANALYSIS as its headline result.

AND ONE OF THE TWO EXCLUDED MATTERS IS A PUBLIC-RECORDS ADVISORY OPINION
(appendix A15, FOIL-AO-19774), excluded precisely because it belongs to the
corpus THIS paper reports. A referee who opens the companion manuscript finds a
public-records case propping up the public-records paper's cross-domain claim.
That is the single most damaging form the error could take.

PROVENANCE WAS ESTABLISHED BEFORE ANYTHING WAS REWRITTEN. Recomputed from live
bench_outcomes by scripts/recompute_sustained_coding.py: the 22-case screened set
yields 6 of 8 against 1 of 8, p = 0.0406, odds ratio 21.00, reproducing the
quoted figures exactly. The numbers were never wrong; their basis was superseded.

    python3 scripts/fix_crossdomain_citation.py            # dry run, default
    python3 scripts/fix_crossdomain_citation.py --apply
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER = os.path.join(ROOT, "research", "FOIL_Article_Draft.md")
SOURCE = os.path.join(ROOT, "research", "Employment_Records_Article_ISACA_2026-08-21.md")

# (old fragment, new fragment, the line in the companion manuscript that
#  establishes the replacement)
EDITS = [
    (
        "on 22 cases from 22 distinct sources including United States Supreme Court "
        "decisions, Federal Labor Relations Authority decisions, and United Kingdom "
        "Employment Tribunal judgments",
        "on 20 adjudicated matters drawn from 20 distinct published decisions across "
        "six forums in two countries, including United States Supreme Court decisions, "
        "Federal Labor Relations Authority decisions, and United Kingdom Employment "
        "Tribunal judgments. Twenty-two matters were screened and two were excluded "
        "before analysis under that study's stated inclusion criteria, one of them a "
        "public-records advisory opinion that belongs to the present corpus rather "
        "than to an employment one",
        "note 2: 'Twenty-two matters were screened; 20 met the inclusion criteria'",
    ),
    (
        "records read as Needs work or Gap did so in 7 of 9 cases (77.8 percent, "
        "95 percent Wilson interval 45.3 to 93.7) against 2 of 13 records read as "
        "Ready (15.4 percent, interval 4.3 to 42.2); Fisher's exact test, two-sided, "
        "p = 0.0073, odds ratio 19.25.",
        "records read as Needs work or Gap did so in 6 of 8 cases (75.0 percent, "
        "95 percent Wilson interval 40.9 to 92.9) against 2 of 12 records read as "
        "Ready (16.7 percent, interval 4.7 to 44.8); Fisher's exact test, two-sided, "
        "p = 0.0194, odds ratio 15.00.",
        "note 5: 'p = 0.0194, odds ratio 15.00 ... 6 of 8 ... 2 of 12'",
    ),
    (
        # SECOND OCCURRENCE, IN THE FINDINGS SUMMARY. Section 5.6 was not the only
        # place the superseded figures appeared: the summary at the head of the
        # paper carried them too. Fixing one and not the other would have left the
        # paper contradicting itself, which is worse than being uniformly stale.
        "the same instrument does show the association (7 of 9 flagged records drew "
        "an adverse finding against 2 of 13 passed records, p = 0.0073)",
        "the same instrument does show the association (6 of 8 flagged records drew "
        "an adverse finding against 2 of 12 passed records, p = 0.0194)",
        "note 5, same source as the Section 5.6 correction",
    ),
    (
        "On the coding that matches the specification check above, restricted to "
        "resolved dispositions, determinations read as Ready were sustained in 6 of 8 "
        "(75.0 percent, interval 40.9 to 92.9) against 1 of 8 for records read as "
        "Needs work or Gap (12.5 percent, interval 2.2 to 47.1); p = 0.041, odds "
        "ratio 21.0.",
        # NO CHANGELOG LANGUAGE IN A MANUSCRIPT. The first version of this
        # replacement read "the figures previously cited here ... are superseded",
        # which is a note to an editor, not prose a referee can use: a reader has
        # no way to know what was previously cited. The superseded figures belong
        # in the commit record and the tracker, not in the paper.
        "On the coding that matches the specification check above, restricted to the "
        "13 matters carrying a resolved disposition and asking only whether the "
        "employer's position was sustained, the association holds at p = 0.0291.",
        "the ISACA manuscript: 'Restricting to the 13 matters with a resolved "
        "disposition and asking only whether the employer's position was sustained "
        "gives p = 0.0291.'",
    ),
]

# Figures that must survive this edit untouched, because they belong to the
# present corpus and not to the companion one. A cross-domain correction that
# quietly moves a public-records number is a worse bug than the one being fixed.
OWN_CORPUS = ["32", "0.739", "83.9", "p = 1.000", "Six of nine", "eighteen"]


def main():
    dry = "--apply" not in sys.argv
    body = io.open(PAPER, encoding="utf-8").read()
    src = io.open(SOURCE, encoding="utf-8").read()

    # Every replacement figure must actually appear in the companion manuscript.
    for probe in ("p = 0.0194", "odds ratio 15.00", "p = 0.0291",
                  "20 met the inclusion criteria", "6 of 8", "2 of 12"):
        if probe not in re.sub(r"\s+", " ", src):
            raise SystemExit("[REQUIRED_ENV_PARAM] %r is not in %s; refusing to write "
                             "a figure that its own source does not carry"
                             % (probe, os.path.relpath(SOURCE, ROOT)))

    before = {k: body.count(k) for k in OWN_CORPUS}
    out = body
    applied = []
    for old, new, why in EDITS:
        n = out.count(old)
        if n != 1:
            raise SystemExit("anchor appears %d times, expected 1: %r" % (n, old[:70]))
        out = out.replace(old, new, 1)
        applied.append(why)

    after = {k: out.count(k) for k in OWN_CORPUS}
    drift = {k: (before[k], after[k]) for k in OWN_CORPUS if before[k] != after[k]}
    if drift:
        raise SystemExit("this edit moved a figure belonging to the present corpus: %s"
                         % drift)

    print("%s" % ("DRY RUN, nothing written. Re-run with --apply." if dry else "APPLIED"))
    print("  %s  %d -> %d words" % (os.path.relpath(PAPER, ROOT),
                                    len(body.split()), len(out.split())))
    for w in applied:
        print("    grounded in %s" % w)
    print("  own-corpus figures unchanged: %s" % ", ".join(OWN_CORPUS))
    if not dry:
        io.open(PAPER, "w", encoding="utf-8").write(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
