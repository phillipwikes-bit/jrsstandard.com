"""Reproduce every count and test reported in Young and Wikes (2026).

Standard library only. Run from this folder:  python3 reproduce_results.py
Reads the CSV files in ./data and prints each reported figure.
"""
import csv
from collections import Counter
from math import comb, sqrt
from pathlib import Path

DATA = Path(__file__).parent / "data"


def rows(name):
    with open(DATA / name, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def fisher_two_sided(a, b, c, d):
    """Fisher's exact test on [[a, b], [c, d]], two-sided by summing tables no more likely than the observed one."""
    r1, r2, c1 = a + b, c + d, a + c
    n = r1 + r2

    def p(x):
        return comb(r1, x) * comb(r2, c1 - x) / comb(n, c1)

    p0 = p(a)
    lo, hi = max(0, c1 - r2), min(r1, c1)
    return sum(p(x) for x in range(lo, hi + 1) if p(x) <= p0 * (1 + 1e-7))


def wilson(x, n, z=1.959963985):
    phat = x / n
    centre = (phat + z * z / (2 * n)) / (1 + z * z / n)
    half = z * sqrt(phat * (1 - phat) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return centre - half, centre + half


def main():
    master = rows("Young_Wikes_2026_32_Case_Master_Dataset.csv")
    structural = rows("Young_Wikes_2026_Structural_Coding_Frame.csv")

    print("Cases:", len(master))
    print("Reads:", dict(Counter(r["JRS Read"] for r in master)))
    print("Outcomes:", dict(Counter(r["Outcome Category"] for r in master)))
    print("Notes present:", sum(r["Contemporaneous Note Available"] == "Yes" for r in master))

    audits = [r for r in master if r["Document class"] == "Programme-level audit"]
    print("\nAudit concordance: %d of %d audits read Gap"
          % (sum(r["JRS Read"] == "Gap" for r in audits), len(audits)))

    coded = [r for r in master if r["5.3 reconstructability coding"] in ("Yes", "No")]
    nw = [r for r in coded if r["JRS Read"] == "Needs work"]
    rd = [r for r in coded if r["JRS Read"] == "Ready"]
    a = sum(r["5.3 reconstructability coding"] == "Yes" for r in nw)
    c = sum(r["5.3 reconstructability coding"] == "Yes" for r in rd)
    print("\nTable 1: Needs work %d of %d stated; Ready %d of %d stated; p = %.7f"
          % (a, len(nw), c, len(rd), fisher_two_sided(a, len(nw) - a, c, len(rd) - c)))
    print("  Stricter coding (one in-camera note recoded): p = %.7f"
          % fisher_two_sided(a - 1, len(nw) - a + 1, c, len(rd) - c))

    grp_a = [r for r in structural if r["Structural group"].startswith("A")]
    grp_b = [r for r in structural if r["Structural group"].startswith("B")]
    ra = sum(r["JRS Read"] == "Ready" for r in grp_a)
    rb = sum(r["JRS Read"] == "Ready" for r in grp_b)
    print("\nTable 2: reproduces text %d of %d Ready; in camera or aggregate %d of %d Ready; p = %.5f"
          % (ra, len(grp_a), rb, len(grp_b), fisher_two_sided(ra, len(grp_a) - ra, rb, len(grp_b) - rb)))
    case_b = [r for r in grp_b if "audit" not in r["Source type"].lower()]
    rcb = sum(r["JRS Read"] == "Ready" for r in case_b)
    print("  Case-level only: %d of %d against %d of %d; p = %.4f"
          % (ra, len(grp_a), rcb, len(case_b),
             fisher_two_sided(ra, len(grp_a) - ra, rcb, len(case_b) - rcb)))
    case_level = [r for r in master if r["Document class"] == "Case-level source"]
    gap_case = sum(r["JRS Read"] == "Gap" for r in case_level)
    gap_audit = sum(r["JRS Read"] == "Gap" for r in audits)
    print("  Gap concentration: audits %d of %d, case-level %d of %d; p = %.7f"
          % (gap_audit, len(audits), gap_case, len(case_level),
             fisher_two_sided(gap_audit, len(audits) - gap_audit, gap_case, len(case_level) - gap_case)))

    resolved = [r for r in master if r["Outcome Category"] in ("Sustained", "Did not survive review")
                and r["JRS Read"] in ("Ready", "Needs work")]
    t = {(rd_, oc): 0 for rd_ in ("Ready", "Needs work") for oc in ("Sustained", "Did not survive review")}
    for r in resolved:
        t[(r["JRS Read"], r["Outcome Category"])] += 1
    s1, f1 = t[("Ready", "Sustained")], t[("Ready", "Did not survive review")]
    s2, f2 = t[("Needs work", "Sustained")], t[("Needs work", "Did not survive review")]
    print("\nTable 3: Ready %d sustained / %d not; Needs work %d sustained / %d not; OR = %.2f; p = %.3f"
          % (s1, f1, s2, f2, (s1 * f2) / (f1 * s2), fisher_two_sided(s1, f1, s2, f2)))

    blind = [r for r in master if r["Included in blind second read?"].startswith("Yes")]
    agree = sum(r["Agreement"] == "Agree" for r in blind)
    lo, hi = wilson(agree, len(blind))
    print("\nBlind second read: %d of %d agree (%.1f%%), Wilson 95%% CI %.1f to %.1f"
          % (agree, len(blind), 100 * agree / len(blind), 100 * lo, 100 * hi))


if __name__ == "__main__":
    main()
