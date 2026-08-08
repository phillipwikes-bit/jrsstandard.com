#!/usr/bin/env python3
"""Pre-registered analysis for the public-records (FOIL) pilot, Study PR-DVP.

Runs the association between the JRS read, recorded blind to the outcome, and
the documented outcome, on the completed sample. Pure standard library: Fisher's
exact test is computed from the hypergeometric distribution rather than pulled
from scipy, so the result is reproducible anywhere Python runs.

Data source: bench_outcomes, contributor E-08, domain "Public records / FOIL".
Counts below are transcribed from a service-role read on 2026-08-08 and are
re-checkable with:

  select jrs_read, outcome, count(*) from bench_outcomes
  where contributor='E-08' group by jrs_read, outcome;

  python3 research/analysis_foil_2026-08-08.py
"""
from math import comb

# jrs_read -> outcome -> n, as stored.
CELLS = {
    "ready":           {"held_up": 3, "failed_appeal": 10, "challenged": 5},
    "review_required": {"held_up": 2, "failed_appeal": 5,  "challenged": 2},
    "gap_identified":  {"failed_audit": 5},
}


def fisher_exact_2x2(a, b, c, d):
    """Two-sided Fisher's exact test on [[a, b], [c, d]] by summing the
    probability of every table at least as extreme as the observed one."""
    n = a + b + c + d
    r1, r2 = a + b, c + d
    c1 = a + c

    def p(x):
        return comb(r1, x) * comb(r2, c1 - x) / comb(n, c1)

    p_obs = p(a)
    lo = max(0, c1 - r2)
    hi = min(r1, c1)
    return sum(p(x) for x in range(lo, hi + 1) if p(x) <= p_obs + 1e-12)


def main():
    total = sum(sum(v.values()) for v in CELLS.values())
    print("PUBLIC-RECORDS PILOT, completed sample")
    print("Cases: %d" % total)
    print()

    print("Read distribution")
    for read, outs in CELLS.items():
        print("  %-16s %2d" % (read, sum(outs.values())))
    print()

    print("Outcome distribution")
    outs = {}
    for v in CELLS.values():
        for k, n in v.items():
            outs[k] = outs.get(k, 0) + n
    for k in sorted(outs):
        print("  %-16s %2d" % (k, outs[k]))
    print()

    # --- Primary analysis: determinations only, resolved dispositions only ---
    # "challenged" records that a determination was contested without recording
    # which way it resolved, so those cases carry no outcome to associate with a
    # read and are excluded rather than assumed. The audit cases are a different
    # instrument and are analysed separately below.
    a = CELLS["ready"]["held_up"]              # Ready and held up
    b = CELLS["ready"]["failed_appeal"]        # Ready and failed
    c = CELLS["review_required"]["held_up"]    # Needs work and held up
    d = CELLS["review_required"]["failed_appeal"]

    n = a + b + c + d
    p = fisher_exact_2x2(a, b, c, d)
    rate_ready = a / (a + b)
    rate_needs = c / (c + d)
    odds = (a * d) / (b * c) if b * c else float("inf")

    print("PRIMARY: JRS read against documented disposition, determinations only")
    print("                     held up   did not hold up")
    print("  Ready              %6d %14d" % (a, b))
    print("  Needs work         %6d %14d" % (c, d))
    print("  n = %d" % n)
    print("  Held-up rate, Ready       %.1f%%" % (100 * rate_ready))
    print("  Held-up rate, Needs work  %.1f%%" % (100 * rate_needs))
    print("  Difference                %+.1f points" % (100 * (rate_ready - rate_needs)))
    print("  Odds ratio                %.2f" % odds)
    print("  Fisher's exact, two-sided p = %.3f" % p)
    print("  VERDICT: %s" % ("association supported" if p < 0.05 else
                             "NULL. No association between read and disposition at this sample."))
    print()

    # --- Secondary, descriptive: the audit subset ---
    gap = CELLS["gap_identified"]["failed_audit"]
    print("SECONDARY, descriptive only: the audit subset")
    print("  %d of %d cases carrying a Gap read are compliance audits, and all %d"
          % (gap, gap, gap))
    print("  record an adverse audit finding.")
    print("  CONFOUND, stated rather than reported as a result: every Gap read in")
    print("  this sample comes from an audit and every audit received a Gap read,")
    print("  so case type and read are perfectly collinear here. No association")
    print("  can be separated from case type, and none is claimed.")
    print()

    print("REPORTABLE LINES")
    print("  Sample: %d cases, %d distinct public sources, 26 June to 8 August 2026." % (total, total))
    print("  Reads: %d Ready, %d Needs work, %d Gap."
          % (sum(CELLS['ready'].values()), sum(CELLS['review_required'].values()),
             sum(CELLS['gap_identified'].values())))
    print("  Primary test: Fisher's exact, two-sided, p = %.3f on n = %d. Null." % (p, n))


if __name__ == "__main__":
    main()
