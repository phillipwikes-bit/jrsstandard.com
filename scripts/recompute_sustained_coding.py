#!/usr/bin/env python3
"""Recompute the employment sustained-outcome coding the CFOC emails quote.

WHY. research/CFOC_Submission_2026-08-08.md, sent under Stacyann Young's name to
the Chief FOIA Officers Council and to a named DOI attorney, asserts:

    "22 adjudicated cases ... records assessed as complete were sustained in six
     of eight resolved cases against one of eight for records assessed as
     incomplete, p = 0.041"

Those figures come from research/BusinessEthics_Article_Draft.md:96, computed on
the full 22-case screened set. On 2026-08-24 the employment corpus was corrected:
two matters fail the inclusion criteria and the analysis now runs on 20
(research/Employment_Records_Article_ISACA_2026-08-21.md, note 2), with the
primary association at p = 0.0194 rather than the 22-case p = 0.0073.

THE SUSTAINED CODING WAS NEVER RECOMPUTED ON THE CORRECTED SET. This script does
that, from the live database rather than from any draft, so the email can be
corrected against a number that exists rather than one that is assumed to have
held.

CODING RULES, TAKEN FROM THE MANUSCRIPT AND NOT INVENTED HERE. Note 4 records
that an adverse audit or compliance finding is a separate category from failing
review. The sustained coding asks only whether the employer's position was
sustained among matters with a recorded disposition, so:

    resolved   = held_up, failed_appeal, failed_audit
    unresolved = challenged           (no recorded disposition)
    sustained  = held_up

That reproduces the published 16 resolved cases exactly, which is the check that
the rules are the right ones rather than merely plausible.

    python3 scripts/recompute_sustained_coding.py
"""
import collections
import json
import re
import sys
import urllib.request
from fractions import Fraction

SB = "https://pjzxkeviouofdseagvpf.supabase.co"
KEY = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"  # anon; public by design

RESOLVED = {"held_up", "failed_appeal", "failed_audit"}
SUSTAINED = {"held_up"}
COMPLETE_READS = {"ready"}
INCOMPLETE_READS = {"review_required", "gap_identified"}


def q(path):
    req = urllib.request.Request(SB + path,
                                 headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def comb(n, k):
    if k < 0 or k > n:
        return 0
    num = den = 1
    for i in range(k):
        num *= (n - i)
        den *= (i + 1)
    return num // den


def fisher_two_sided(a, b, c, d):
    """Exact two-sided Fisher p by summing tables no more probable than observed.

    Written out rather than imported: scipy is not installed here and a p value
    quoted to a federal council should not depend on a package that may or may
    not be present at the moment someone re-runs this.
    """
    n = a + b + c + d
    row1, col1 = a + b, a + c
    def prob(x):
        return Fraction(comb(row1, x) * comb(n - row1, col1 - x), comb(n, col1))
    p_obs = prob(a)
    lo = max(0, col1 - (n - row1))
    hi = min(row1, col1)
    total = Fraction(0)
    for x in range(lo, hi + 1):
        p = prob(x)
        if p <= p_obs * Fraction(1000000001, 1000000000):
            total += p
    return float(total)


def odds_ratio(a, b, c, d):
    if b == 0 or c == 0:
        return None
    return (a * d) / float(b * c)


def wilson(k, n, z=1.959963985):
    if n == 0:
        return (None, None)
    p = k / float(n)
    den = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / den
    half = (z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5)) / den
    return (round(100 * (centre - half), 1), round(100 * (centre + half), 1))


def table(rows):
    """2x2: complete/incomplete read against sustained/not, among resolved only."""
    res = [r for r in rows if r["outcome"] in RESOLVED]
    a = sum(1 for r in res if r["jrs_read"] in COMPLETE_READS and r["outcome"] in SUSTAINED)
    b = sum(1 for r in res if r["jrs_read"] in COMPLETE_READS and r["outcome"] not in SUSTAINED)
    c = sum(1 for r in res if r["jrs_read"] in INCOMPLETE_READS and r["outcome"] in SUSTAINED)
    d = sum(1 for r in res if r["jrs_read"] in INCOMPLETE_READS and r["outcome"] not in SUSTAINED)
    return a, b, c, d, len(res)


def report(name, rows):
    a, b, c, d, n_res = table(rows)
    p = fisher_two_sided(a, b, c, d)
    orr = odds_ratio(a, b, c, d)
    print("%s  (%d matters, %d with a recorded disposition)" % (name, len(rows), n_res))
    print("  complete read   sustained %d of %d  (%.1f%%, Wilson %s to %s)"
          % (a, a + b, 100.0 * a / (a + b) if a + b else 0, *wilson(a, a + b)))
    print("  incomplete read sustained %d of %d  (%.1f%%, Wilson %s to %s)"
          % (c, c + d, 100.0 * c / (c + d) if c + d else 0, *wilson(c, c + d)))
    print("  Fisher exact, two-sided: p = %.4f   odds ratio %s"
          % (p, "%.2f" % orr if orr is not None else "undefined (a zero cell)"))
    print()
    return {"n": len(rows), "resolved": n_res, "a": a, "b": b, "c": c, "d": d,
            "p": round(p, 4), "odds_ratio": round(orr, 2) if orr is not None else None}


def main():
    rows = [r for r in q("/rest/v1/bench_outcomes?select=jrs_read,outcome,note,record,domain,contributor")
            if r["domain"] == "HR / Employment"]
    if len(rows) != 22:
        raise SystemExit("expected 22 screened employment matters, got %d" % len(rows))

    print("source: bench_outcomes, live, anon key. %d screened employment matters.\n" % len(rows))
    print("read distribution: %s" % dict(collections.Counter(r["jrs_read"] for r in rows)))
    print("outcome distribution: %s\n" % dict(collections.Counter(r["outcome"] for r in rows)))

    full = report("SCREENED SET, 22 matters  [the basis the CFOC emails quote]", rows)

    # The two exclusions, identified from the manuscript's stated criteria rather
    # than by position: one is a public-records forum sitting in the employment
    # set, the other identifies no party, forum, date or case number.
    def is_public_records(r):
        t = " ".join(str(r.get(k) or "") for k in ("note", "record")).lower()
        return ("committee on open government" in t or "advisory opinion" in t
                or "foil" in t)
    def is_uncitable(r):
        t = " ".join(str(r.get(k) or "") for k in ("note", "record"))
        return not re.search(r"\b(19|20)\d{2}\b", t) or len(t.strip()) < 80

    excluded = [r for r in rows if is_public_records(r) or is_uncitable(r)]
    print("EXCLUSION SCREEN, applied from the manuscript's stated criteria:")
    print("  public-records forum in the employment set : %d"
          % sum(1 for r in rows if is_public_records(r)))
    print("  no party, forum, date or case number       : %d"
          % sum(1 for r in rows if is_uncitable(r)))
    print("  total flagged                              : %d (manuscript says 2)\n"
          % len(excluded))

    if len(excluded) != 2:
        print("[REQUIRED_ENV_PARAM] the exclusion screen flagged %d matters, not the 2"
              % len(excluded))
        print("  that research/Employment_Records_Article_ISACA_2026-08-21.md note 2")
        print("  names. The 20-case sustained coding is NOT computed, because guessing")
        print("  which two to drop would fabricate the very figure this script exists")
        print("  to establish. Appendix A of that manuscript names both; supply them")
        print("  explicitly to complete this.")
        print()
        print(json.dumps({"screened_22": full, "corrected_20": None}, indent=2))
        return 2

    keep = [r for r in rows if r not in excluded]
    corrected = report("ANALYSED SET, 20 matters  [the corrected basis, 2026-08-24]", keep)
    print(json.dumps({"screened_22": full, "corrected_20": corrected}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
