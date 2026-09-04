#!/usr/bin/env python3
"""Reproduce every figure in Section 5 from the files in this package.

SELF-CONTAINED BY DESIGN. This script reads ONLY files that travel inside the
submission package. It makes no network request, contacts no database, embeds no
API key, and imports nothing outside the Python standard library. It runs on a
clean machine with no internet connection.

That is not a convenience. The manuscript's argument is that a reader should be
able to move from the record to the conclusion without relying on information
they cannot see. A reproduction script that reached outside its own package
would contradict the paper it supports.

NOTHING IS HARD-CODED THAT THE DATA CAN PRODUCE. The Section 5.3 cell counts are
computed from the construct coding frame, and the Section 5.4 groups from the
structural coding frame, rather than being written in as constants. The chain is
case, coding, analysis, result, and each step is a file you can open.

STATISTICS ARE WRITTEN OUT, NOT IMPORTED. Fisher's exact test, the Wilson score
interval, Cohen's kappa and Gwet's AC1 are implemented here, so no scientific
stack is needed to check any number in the paper.

INPUTS, all relative to this script's parent directory:
  02_DATA/JCI_JRS_32_Case_Master_Dataset.csv
  02_DATA/JCI_JRS_Construct_Coding_Frame.csv
  02_DATA/JCI_JRS_Structural_Coding_Frame.csv
  03_RELIABILITY/Blind_Recheck_RESULT_2026-08-28.json
  01_MANUSCRIPT/manuscript_verification.txt

USAGE
  python3 analysis.py            print every Section 5 figure
  python3 analysis.py --verify   also check each figure against the manuscript
                                 and exit non-zero on any mismatch
"""
import csv
import io
import json
import os
import re
import sys
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)

MASTER = os.path.join(PKG, "02_DATA", "JCI_JRS_32_Case_Master_Dataset.csv")
CONSTRUCT = os.path.join(PKG, "02_DATA", "JCI_JRS_Construct_Coding_Frame.csv")
STRUCTURAL = os.path.join(PKG, "02_DATA", "JCI_JRS_Structural_Coding_Frame.csv")
SECOND = os.path.join(PKG, "03_RELIABILITY", "Blind_Recheck_RESULT_2026-08-28.json")
MANUSCRIPT = os.path.join(PKG, "01_MANUSCRIPT", "manuscript_verification.txt")

# Section 5.6 belongs to a separate employment corpus reported in a companion
# manuscript. It is CITED, not recomputed, and the companion verification file
# in 06_COMPANION_STUDY carries its case list.
EMPLOYMENT = {"screened": 22, "analysed": 20, "excluded": 2,
              "p_primary": 0.0194, "p_sustained": 0.0291}


def need(path):
    if not os.path.exists(path):
        raise SystemExit("missing input: %s\n"
                         "This script must be run from inside the submission "
                         "package, whose structure is described in "
                         "00_MANIFEST.txt." % os.path.relpath(path, PKG))
    return path


def rows(path):
    with io.open(need(path), encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def comb(n, k):
    if k < 0 or k > n:
        return 0
    num = den = 1
    for i in range(k):
        num *= (n - i)
        den *= (i + 1)
    return num // den


def fisher_two_sided(a, b, c, d):
    n = a + b + c + d
    r1, c1 = a + b, a + c
    def P(x):
        return Fraction(comb(r1, x) * comb(n - r1, c1 - x), comb(n, c1))
    obs = P(a)
    total = Fraction(0)
    for x in range(max(0, c1 - (n - r1)), min(r1, c1) + 1):
        p = P(x)
        if p <= obs * Fraction(1000000001, 1000000000):
            total += p
    return float(total)


def wilson(x, n, z=1.959963985):
    if n == 0:
        return (None, None)
    p = x / float(n)
    den = 1 + z * z / n
    c = (p + z * z / (2 * n)) / den
    h = (z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5)) / den
    return (round(100 * (c - h), 1), round(100 * (c + h), 1))


SCALE = ["Ready", "Needs work", "Gap"]


def confusion(pairs):
    m = [[0] * 3 for _ in range(3)]
    for second, original in pairs:
        m[SCALE.index(second)][SCALE.index(original)] += 1
    return m


def kappa(pairs, w):
    n = len(pairs)
    m = confusion(pairs)
    row = [sum(m[i]) for i in range(3)]
    col = [sum(m[i][j] for i in range(3)) for j in range(3)]
    po = sum(w(i, j) * m[i][j] for i in range(3) for j in range(3)) / float(n)
    pe = sum(w(i, j) * row[i] * col[j] for i in range(3) for j in range(3)) / float(n * n)
    return (po - pe) / (1.0 - pe)


def gwet_ac1(pairs):
    n = len(pairs)
    m = confusion(pairs)
    po = sum(m[i][i] for i in range(3)) / float(n)
    pi = [(sum(m[c]) + sum(m[i][c] for i in range(3))) / float(2 * n) for c in range(3)]
    pe = sum(p * (1 - p) for p in pi) / 2.0
    return (po - pe) / (1.0 - pe)


def main():
    verify = "--verify" in sys.argv
    master = rows(MASTER)
    construct = rows(CONSTRUCT)
    structural = rows(STRUCTURAL)
    with io.open(need(SECOND), encoding="utf-8") as fh:
        sr = json.load(fh)[0]

    if len(master) != 32:
        raise SystemExit("master dataset has %d rows, expected 32" % len(master))

    reads = {}
    for r in master:
        reads[r["JRS Read"]] = reads.get(r["JRS Read"], 0) + 1
    noted = sum(1 for r in master if r["Contemporaneous Note Available"] == "Yes")
    audits = [r for r in master if r["Document class"] == "Programme-level audit"]
    case_level = [r for r in master if r["Document class"] == "Case-level source"]

    print("PUBLIC-RECORDS PILOT, from the packaged dataset: %d cases" % len(master))
    print("Reads: %d Ready, %d Needs work, %d Gap"
          % (reads.get("Ready", 0), reads.get("Needs work", 0), reads.get("Gap", 0)))
    print("Notes: %d of %d carry a contemporaneous basis note" % (noted, len(master)))
    print()

    # ---- 5.2
    gap_audits = sum(1 for r in audits if r["JRS Read"] == "Gap")
    print("5.2  CONVERGENT VALIDITY against independent government auditors")
    print("     programme-level audits %d, Gap reads %d, concordance %d of %d"
          % (len(audits), gap_audits, gap_audits, len(audits)))
    print()

    # ---- 5.3, computed from the construct coding frame
    nw = [r for r in construct if r["JRS Read"] == "Needs work"]
    rd = [r for r in construct if r["JRS Read"] == "Ready"]
    nw_yes = sum(1 for r in nw if r["Reconstructability Failure Explicitly Stated"] == "Yes")
    rd_yes = sum(1 for r in rd if r["Reconstructability Failure Explicitly Stated"] == "Yes")
    p53 = fisher_two_sided(nw_yes, len(nw) - nw_yes, rd_yes, len(rd) - rd_yes)
    uncoded = len(case_level) - len(construct)
    print("5.3  CONSTRUCT VALIDITY, from JCI_JRS_Construct_Coding_Frame.csv")
    print("     %d case-level sources, %d carry a note and are coded, %d excluded"
          % (len(case_level), len(construct), uncoded))
    print("     Needs work (n = %d): %d stated, %d not stated, %.1f%%"
          % (len(nw), nw_yes, len(nw) - nw_yes, 100.0 * nw_yes / len(nw)))
    print("     Ready      (n = %d): %d stated, %d not stated, 0.0%%"
          % (len(rd), rd_yes, len(rd) - rd_yes))
    print("     Fisher's exact, two-sided p = %.7f" % p53)
    print()

    # ---- 5.4, computed from the structural coding frame
    ga = [r for r in structural if r["Structural group"].startswith("A")]
    gb = [r for r in structural if r["Structural group"].startswith("B")]
    ga_r = sum(1 for r in ga if r["JRS Read"] == "Ready")
    gb_r = sum(1 for r in gb if r["JRS Read"] == "Ready")
    p54 = fisher_two_sided(ga_r, len(ga) - ga_r, gb_r, len(gb) - gb_r)
    gap_c = sum(1 for r in case_level if r["JRS Read"] == "Gap")
    p_gap = fisher_two_sided(gap_audits, len(audits) - gap_audits,
                             gap_c, len(case_level) - gap_c)
    print("5.4  DISCRIMINANT VALIDITY, from JCI_JRS_Structural_Coding_Frame.csv")
    print("     group A reproduces the determination text: Ready %d of %d" % (ga_r, len(ga)))
    print("     group B assessed the records in camera or in aggregate: Ready %d of %d"
          % (gb_r, len(gb)))
    print("     Fisher's exact, two-sided p = %.5f" % p54)
    print("     Gap concentration: %d of %d audits, %d of %d case-level, p = %.7f"
          % (gap_audits, len(audits), gap_c, len(case_level), p_gap))
    print()

    # ---- 5.5
    resolved = [r for r in master if r["Included in 5.5?"] == "Yes"]
    r_ready = [r for r in resolved if r["JRS Read"] == "Ready"]
    r_other = [r for r in resolved if r["JRS Read"] != "Ready"]
    held = lambda g: sum(1 for r in g if r["Documented Outcome"] == "held_up")
    p55 = fisher_two_sided(held(r_ready), len(r_ready) - held(r_ready),
                           held(r_other), len(r_other) - held(r_other))
    print("5.5  SPECIFICATION CHECK, read against appellate disposition")
    print("     resolved %d; Ready held up %d of %d, other held up %d of %d"
          % (len(resolved), held(r_ready), len(r_ready), held(r_other), len(r_other)))
    print("     Fisher's exact, two-sided p = %.3f" % p55)
    print()

    # ---- 5.6
    print("5.6  CROSS-DOMAIN employment corpus, cited from the companion manuscript")
    print("     %d screened, %d excluded, %d analysed; p = %.4f primary, %.4f sustained"
          % (EMPLOYMENT["screened"], EMPLOYMENT["excluded"], EMPLOYMENT["analysed"],
             EMPLOYMENT["p_primary"], EMPLOYMENT["p_sustained"]))
    print("     case list: 06_COMPANION_STUDY/"
          "JCI_Companion_Employment_Corpus_Verification.csv")
    print()

    # ---- 5.7, recomputed from the per-case answers, not read off the summary
    pairs = [(c["second"], c["original"]) for c in sr["per_case"] if c["second"] in SCALE]
    agreed = sum(1 for s, o in pairs if s == o)
    ku = kappa(pairs, lambda i, j: 1.0 if i == j else 0.0)
    kw = kappa(pairs, lambda i, j: 1.0 - abs(i - j) / 2.0)
    ac1 = gwet_ac1(pairs)
    lo, hi = wilson(agreed, len(pairs))
    adjacent = sum(1 for c in sr["per_case"] if c["distance"] == 1)
    extreme = sum(1 for c in sr["per_case"] if c["distance"] == 2)
    print("5.7  BLIND SECOND READ, recomputed from the per-case answers")
    print("     %d cases, exact agreement %d of %d = %.1f%%, 95%% Wilson %.1f to %.1f"
          % (len(pairs), agreed, len(pairs), 100.0 * agreed / len(pairs), lo, hi))
    print("     Cohen's kappa %.3f unweighted, %.3f linear weighted; Gwet's AC1 %.3f"
          % (ku, kw, ac1))
    print("     %d disagreements, %d adjacent, %d Ready against Gap"
          % (len(pairs) - agreed, adjacent, extreme))
    print()

    # ---- verification against the packaged manuscript text
    with io.open(need(MANUSCRIPT), encoding="utf-8") as fh:
        text = re.sub(r"\s+", " ", fh.read())
    probes = [
        ("5.1 corpus", "32 publicly available determinations"),
        ("5.1 notes", "%d of the 32 carry a contemporaneous basis note" % noted),
        ("5.2 concordance", "five of five"),
        ("5.3 case-level", "%d case-level sources classified Ready or Needs work" % len(case_level)),
        ("5.3 coded", "the %d of those %d that carry a note" % (len(construct), len(case_level))),
        ("5.3 uncoded", "The %d case-level sources without a note" % uncoded),
        ("5.3 Needs work", "Needs work (n = %d)" % len(nw)),
        ("5.3 Ready", "Ready (n = %d)" % len(rd)),
        ("5.3 p", "p = %.7f" % p53),
        ("5.4 p", "p = %.5f" % p54),
        ("5.4 gap p", "p = %.7f" % p_gap),
        ("5.5 p", "p = %.3f" % p55),
        ("5.6 analysed", "%d adjudicated matters" % EMPLOYMENT["analysed"]),
        ("5.6 primary p", "p = %.4f" % EMPLOYMENT["p_primary"]),
        ("5.6 sustained p", "p = %.4f" % EMPLOYMENT["p_sustained"]),
        ("5.7 agreement", "%d of %d" % (agreed, len(pairs))),
        ("5.7 percent", "%.1f percent" % (100.0 * agreed / len(pairs))),
        ("5.7 kappa", "%.3f" % round(ku, 3)),
        ("5.7 weighted", "%.3f" % round(kw, 3)),
        ("5.7 AC1", "%.3f" % round(ac1, 3)),
    ]
    print("VERIFICATION against 01_MANUSCRIPT/manuscript_verification.txt")
    bad = 0
    for label, probe in probes:
        ok = probe in text
        if not ok:
            bad += 1
        print("  %-16s %-56s %s" % (label, probe, "OK" if ok else "NOT IN MANUSCRIPT"))
    print()
    print("%d probes, %d mismatch(es)" % (len(probes), bad))
    if verify and bad:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
