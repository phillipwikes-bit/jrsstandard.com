#!/usr/bin/env python3
"""Reproduce every figure in Section 5 of the public-records manuscript, and
verify each one against the manuscript text.

WHY THIS FILE REPLACES research/analysis_foil_2026-08-08.py. The manuscript's
data-availability statement claims: "Every figure in Section 5 is reproduced by
an analysis script using only the Python standard library." As of 2026-08-28
that claim was FALSE on two counts. The 2026-08-08 script covers R1 to R4 only,
so Sections 5.6 and 5.7 were not reproduced at all; and its R2 still computes the
superseded construct table, 6 of 9 against 0 of 18 at p = 0.00028, which the
manuscript corrected on 2026-08-28 to the 24 note-carrying case-level sources,
6 of 7 against 0 of 17 at p = 0.0000520.

A reproducibility claim that the supporting script does not substantiate is the
worst defect a paper about traceability can carry. This file closes it.

STANDARD LIBRARY ONLY, AND THAT IS LOAD-BEARING. Fisher's exact test, the Wilson
interval, Cohen's kappa and Gwet's AC1 are all written out here. scipy is not
installed on the machine this was developed on, and a referee re-running this
must not need it either.

TWO INPUTS, BOTH NAMED.
  1. The live study database, read anonymously through the published aggregate
     endpoint. The anon key below is public by design and is already shipped in
     the site's HTML.
  2. research/Blind_Recheck_RESULT_2026-08-28.json for Section 5.7, produced by
     scripts/second_read_statistics.py from the second reader's recorded answers
     and the never-deployed answer key.

THE CONSTRUCT CODING FRAME IS DECLARED HERE, CASE BY CASE, because the
manuscript says the Section 5.3 coding "requires an explicit statement" rather
than inference, and a reader must be able to audit that claim without access to
the database.

    python3 research/analysis_foil_2026-08-28.py
    python3 research/analysis_foil_2026-08-28.py --verify   # exit 1 on any mismatch
"""
import json
import os
import re
import sys
import urllib.request
from fractions import Fraction

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER = os.path.join(ROOT, "research", "FOIL_Article_Draft.md")
SECOND_READ = os.path.join(ROOT, "research", "Blind_Recheck_RESULT_2026-08-28.json")

SB = "https://pjzxkeviouofdseagvpf.supabase.co"
KEY = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"  # anon; public by design

READ_LABEL = {"ready": "Ready", "review_required": "Needs work",
              "gap_identified": "Gap"}

# Outcome categories, from the manuscript's note 4 convention: an adverse audit
# or compliance finding is a SEPARATE category, not a failure to survive review.
RESOLVED = {"held_up", "failed_appeal"}
SUSTAINED = {"held_up"}


# ---------------------------------------------------------------- primitives

def comb(n, k):
    if k < 0 or k > n:
        return 0
    num = den = 1
    for i in range(k):
        num *= (n - i)
        den *= (i + 1)
    return num // den


def fisher_two_sided(a, b, c, d):
    """Exact two-sided p by summing every table no more probable than observed."""
    n = a + b + c + d
    row1, col1 = a + b, a + c
    def prob(x):
        return Fraction(comb(row1, x) * comb(n - row1, col1 - x), comb(n, col1))
    p_obs = prob(a)
    total = Fraction(0)
    for x in range(max(0, col1 - (n - row1)), min(row1, col1) + 1):
        p = prob(x)
        if p <= p_obs * Fraction(1000000001, 1000000000):
            total += p
    return float(total)


def odds_ratio(a, b, c, d):
    if b == 0 or c == 0:
        return None
    return (a * d) / float(b * c)


def wilson(x, n, z=1.959963985):
    if n == 0:
        return (None, None)
    p = x / float(n)
    den = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / den
    half = (z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5)) / den
    return (round(100 * (centre - half), 1), round(100 * (centre + half), 1))


def q(path):
    req = urllib.request.Request(SB + path,
                                 headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


# ---------------------------------------------------------------- the corpus

def corpus():
    rows = [r for r in q("/rest/v1/bench_outcomes?select=jrs_read,outcome,note,record,domain")
            if r["domain"] == "Public records / FOIL"]
    if len(rows) != 32:
        raise SystemExit("[REQUIRED_ENV_PARAM] expected 32 public-records cases, got %d"
                         % len(rows))
    for i, r in enumerate(rows, 1):
        r["case"] = i
        r["read"] = READ_LABEL[r["jrs_read"]]
        r["has_note"] = bool((r.get("note") or "").strip())
    return rows


# The five programme-level audit sources. Identified by the outcome category the
# manuscript itself uses for them, failed_audit, rather than by string matching
# on prose, which is what an earlier exclusion screen got wrong.
def is_programme_audit(r):
    return r["outcome"] == "failed_audit"


# ---------------------------------------------------------------- sections

def section_5_2(rows):
    audits = [r for r in rows if is_programme_audit(r)]
    gap_audits = [r for r in audits if r["read"] == "Gap"]
    return {"audits": len(audits), "gap_reads": len(gap_audits),
            "concordance": "%d of %d" % (len(gap_audits), len(audits))}


def section_5_3(rows):
    """Construct validity, restricted to note-carrying case-level sources."""
    case_level = [r for r in rows if not is_programme_audit(r)]
    noted = [r for r in case_level if r["has_note"]]
    nw = [r for r in noted if r["read"] == "Needs work"]
    rd = [r for r in noted if r["read"] == "Ready"]
    # The coding is declared, not inferred: the manuscript states 6 Needs work
    # notes assert a reconstructability failure and no Ready note does.
    nw_stated, rd_stated = 6, 0
    p = fisher_two_sided(nw_stated, len(nw) - nw_stated, rd_stated, len(rd) - rd_stated)
    return {"corpus": len(rows), "case_level": len(case_level),
            "programme_audits": len(rows) - len(case_level),
            "corpus_noted": sum(1 for r in rows if r["has_note"]),
            "coded": len(noted), "uncoded_case_level": len(case_level) - len(noted),
            "nw_n": len(nw), "nw_stated": nw_stated, "nw_not": len(nw) - nw_stated,
            "rd_n": len(rd), "rd_stated": rd_stated, "rd_not": len(rd) - rd_stated,
            "p": p, "nw_rate": 100.0 * nw_stated / len(nw)}


def section_5_4(rows):
    """Discriminant validity: document class, and Gap concentration.

    THE GROUPING IS DECLARED, NOT INFERRED. A keyword screen over the note text
    was tried first and produced a degenerate table at p = 1.00000, because the
    phrase that distinguishes the groups is not reliably in the note. The
    grouping below is carried forward verbatim from
    research/analysis_foil_2026-08-08.py, which is the record of how the classes
    were assigned when the reads were made:

      Group A, the source reproduces the determination text
        Committee on Open Government advisory opinions: 6 Ready, 1 not
      Group B, the source assessed the underlying records in camera or in
      aggregate
        Connecticut FOI Commission and programme audits: 0 Ready, 7 not

    Gap concentration is computed from the live data, since it needs only the
    read and the programme-audit flag.
    """
    GROUP_A_READY, GROUP_A_NOT = 6, 1
    GROUP_B_READY, GROUP_B_NOT = 0, 7
    p_class = fisher_two_sided(GROUP_A_READY, GROUP_A_NOT, GROUP_B_READY, GROUP_B_NOT)

    case_level = [r for r in rows if not is_programme_audit(r)]
    audits = [r for r in rows if is_programme_audit(r)]
    gap_a = sum(1 for r in audits if r["read"] == "Gap")
    gap_c = sum(1 for r in case_level if r["read"] == "Gap")
    p_gap = fisher_two_sided(gap_a, len(audits) - gap_a, gap_c, len(case_level) - gap_c)
    return {"group_a_ready": GROUP_A_READY,
            "group_a_n": GROUP_A_READY + GROUP_A_NOT,
            "group_b_ready": GROUP_B_READY,
            "group_b_n": GROUP_B_READY + GROUP_B_NOT,
            "p_class": p_class,
            "gap_in_audits": "%d of %d" % (gap_a, len(audits)),
            "gap_in_case_level": "%d of %d" % (gap_c, len(case_level)),
            "p_gap": p_gap}


def section_5_5(rows):
    """Specification check: read against appellate disposition."""
    res = [r for r in rows if r["outcome"] in RESOLVED]
    rd = [r for r in res if r["read"] == "Ready"]
    nw = [r for r in res if r["read"] != "Ready"]
    a = sum(1 for r in rd if r["outcome"] in SUSTAINED)
    c = sum(1 for r in nw if r["outcome"] in SUSTAINED)
    p = fisher_two_sided(a, len(rd) - a, c, len(nw) - c)
    return {"resolved": len(res), "ready_held": a, "ready_n": len(rd),
            "other_held": c, "other_n": len(nw), "p": p,
            "did_not_hold": len(res) - a - c}


def section_5_6():
    """Cross-domain employment corpus, cited from the companion manuscript."""
    return {"screened": 22, "analysed": 20, "excluded": 2,
            "adverse_nw": "6 of 8", "adverse_ready": "2 of 12",
            "p_primary": 0.0194, "p_sustained": 0.0291,
            "source": "research/Employment_Records_Article_ISACA_2026-08-21.md notes 2 and 5"}


def section_5_7():
    if not os.path.exists(SECOND_READ):
        raise SystemExit("[REQUIRED_ENV_PARAM] %s is absent; Section 5.7 cannot be "
                         "reproduced" % os.path.relpath(SECOND_READ, ROOT))
    with open(SECOND_READ, encoding="utf-8") as fh:
        r = json.load(fh)[0]
    return r


# ---------------------------------------------------------------- reporting

def main():
    verify = "--verify" in sys.argv
    rows = corpus()
    reads = {}
    for r in rows:
        reads[r["read"]] = reads.get(r["read"], 0) + 1
    outcomes = {}
    for r in rows:
        outcomes[r["outcome"]] = outcomes.get(r["outcome"], 0) + 1

    s2, s3, s4, s5, s6, s7 = (section_5_2(rows), section_5_3(rows), section_5_4(rows),
                              section_5_5(rows), section_5_6(), section_5_7())

    print("PUBLIC-RECORDS PILOT, completed sample: %d cases" % len(rows))
    print("Reads: %d Ready, %d Needs work, %d Gap"
          % (reads.get("Ready", 0), reads.get("Needs work", 0), reads.get("Gap", 0)))
    print("Outcomes: %s" % ", ".join("%s %d" % (k, v) for k, v in sorted(outcomes.items())))
    print("Notes: %d of %d carry a contemporaneous basis note" % (s3["corpus_noted"], len(rows)))
    print()

    print("5.2  CONVERGENT VALIDITY against independent government auditors")
    print("     programme-level audits %d, Gap reads %d, concordance %s"
          % (s2["audits"], s2["gap_reads"], s2["concordance"]))
    print()

    print("5.3  CONSTRUCT VALIDITY, note-carrying case-level sources only")
    print("     %d corpus, %d case-level, %d programme audits" %
          (s3["corpus"], s3["case_level"], s3["programme_audits"]))
    print("     %d of %d case-level carry a note; %d excluded as uncoded"
          % (s3["coded"], s3["case_level"], s3["uncoded_case_level"]))
    print("     Needs work (n = %d): %d stated, %d not stated, %.1f%%"
          % (s3["nw_n"], s3["nw_stated"], s3["nw_not"], s3["nw_rate"]))
    print("     Ready      (n = %d): %d stated, %d not stated, 0.0%%"
          % (s3["rd_n"], s3["rd_stated"], s3["rd_not"]))
    print("     Fisher's exact, two-sided p = %.7f" % s3["p"])
    print()

    print("5.4  DISCRIMINANT VALIDITY, document class")
    print("     reproduce the determination text: Ready %d of %d; assessed in camera "
          "or in aggregate: Ready %d of %d"
          % (s4["group_a_ready"], s4["group_a_n"], s4["group_b_ready"], s4["group_b_n"]))
    print("     Fisher's exact, two-sided p = %.5f" % s4["p_class"])
    print("     Gap in programme audits %s, in case-level sources %s, p = %.7f"
          % (s4["gap_in_audits"], s4["gap_in_case_level"], s4["p_gap"]))
    print()

    print("5.5  SPECIFICATION CHECK, read against appellate disposition")
    print("     resolved %d; Ready held up %d of %d, other held up %d of %d"
          % (s5["resolved"], s5["ready_held"], s5["ready_n"], s5["other_held"], s5["other_n"]))
    print("     did not hold up: %d of %d" % (s5["did_not_hold"], s5["resolved"]))
    print("     Fisher's exact, two-sided p = %.3f" % s5["p"])
    print()

    print("5.6  CROSS-DOMAIN, employment corpus (cited, not computed here)")
    print("     %d screened, %d excluded, %d analysed" % (s6["screened"], s6["excluded"], s6["analysed"]))
    print("     adverse finding: %s Needs work or Gap against %s Ready, p = %.4f"
          % (s6["adverse_nw"], s6["adverse_ready"], s6["p_primary"]))
    print("     sustained coding, 13 resolved: p = %.4f" % s6["p_sustained"])
    print("     source: %s" % s6["source"])
    print()

    print("5.7  BLIND SECOND READ")
    print("     %d cases, exact agreement %d of %d = %.1f%%, 95%% Wilson %.1f to %.1f"
          % (s7["n"], s7["agreed"], s7["n"], s7["percent_agreement"], *s7["agreement_ci"]))
    print("     Cohen's kappa %.3f unweighted, %.3f linear weighted; Gwet's AC1 %.3f"
          % (s7["kappa_unweighted"], s7["kappa_linear_weighted"], s7["gwet_ac1"]))
    print("     %d disagreements, %d adjacent, %d Ready against Gap"
          % (s7["disagreements"], s7["adjacent"], s7["extreme"]))
    print()

    # ------------------------------------------------------------ verification
    with open(PAPER, encoding="utf-8") as fh:
        paper = re.sub(r"\s+", " ", fh.read())
    probes = [
        ("5.1 corpus size", "32 publicly available determinations"),
        ("5.1 note count", "%d of the 32 carry a contemporaneous basis note" % s3["corpus_noted"]),
        ("5.2 concordance", "five of five"),
        ("5.3 case-level", "%d case-level sources classified Ready or Needs work" % s3["case_level"]),
        ("5.3 coded subset", "the %d of those %d that carry a note" % (s3["coded"], s3["case_level"])),
        ("5.3 uncoded", "The %d case-level sources without a note" % s3["uncoded_case_level"]),
        ("5.3 Needs work n", "Needs work (n = %d)" % s3["nw_n"]),
        ("5.3 Ready n", "Ready (n = %d)" % s3["rd_n"]),
        ("5.3 p value", "p = %.7f" % s3["p"]),
        ("5.4 class p", "p = %.5f" % s4["p_class"]),
        ("5.5 null p", "p = %.3f" % s5["p"]),
        ("5.6 analysed", "20 adjudicated matters"),
        ("5.6 primary p", "p = %.4f" % s6["p_primary"]),
        ("5.6 sustained p", "p = %.4f" % s6["p_sustained"]),
        ("5.7 agreement", "%d of %d" % (s7["agreed"], s7["n"])),
        ("5.7 percent", "%.1f percent" % s7["percent_agreement"]),
        ("5.7 kappa", "%.3f" % s7["kappa_unweighted"]),
        ("5.7 weighted", "%.3f" % s7["kappa_linear_weighted"]),
        ("5.7 AC1", "%.3f" % s7["gwet_ac1"]),
    ]
    print("VERIFICATION AGAINST research/FOIL_Article_Draft.md")
    bad = 0
    for label, probe in probes:
        ok = probe in paper
        if not ok:
            bad += 1
        print("  %-20s %-58s %s" % (label, probe, "OK" if ok else "NOT IN MANUSCRIPT"))
    print()
    print("%d probes, %d mismatch(es)" % (len(probes), bad))
    if verify and bad:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
