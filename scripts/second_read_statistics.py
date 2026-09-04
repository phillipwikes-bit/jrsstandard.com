#!/usr/bin/env python3
"""Every agreement statistic the public-records manuscript needs, from the
second reader's actual answers.

SOURCES. The reader's labels come from the owner-only endpoint
api/recheck-answers-b1a768e88d3e48bd, which returns labels and nothing else.
The original reads come from research/Blind_Recheck_KEY_E08.md, which is never
deployed. The two are only ever joined here, off-server.

WHY MORE THAN ONE STATISTIC. The instrument is an ORDINAL three-level scale,
Ready < Needs work < Gap. Unweighted Cohen's kappa treats a Ready/Needs work
disagreement as identical to a Ready/Gap disagreement, which is wrong for this
scale and understates agreement when every disagreement is adjacent. Linear
weighted kappa is reported for that reason. Gwet's AC1 is reported because this
research programme already benchmarks on it (the manuscript cites Gwet 2008) and
because kappa is unstable when one category dominates the margin, which it does
here: 6 of 10 cases are Ready in the original read.

NOTHING IS ROUNDED BEFORE IT IS PRINTED, and no statistic is reported without
its n, because n = 10 is small and every figure here has to carry that.

    python3 scripts/second_read_statistics.py ANSWERS.json
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY_FILE = os.path.join(ROOT, "research", "Blind_Recheck_KEY_E08.md")
SCALE = ["Ready", "Needs work", "Gap"]          # ordinal, low to high severity


def answer_key():
    rows = {}
    for line in io.open(KEY_FILE, encoding="utf-8"):
        m = re.match(r"^\|\s*(\d+)\s*\|\s*([0-9a-f-]{36})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", line)
        if m:
            rows[int(m.group(1))] = {"case_id": m.group(2), "original": m.group(3).strip(),
                                     "outcome": m.group(4).strip()}
    if len(rows) != 10:
        raise SystemExit("expected 10 key rows, parsed %d" % len(rows))
    return rows


def confusion(pairs):
    k = len(SCALE)
    m = [[0] * k for _ in range(k)]
    for second, original in pairs:
        m[SCALE.index(second)][SCALE.index(original)] += 1
    return m


def kappa(pairs, weights):
    """Cohen's kappa with a supplied weight function w(i, j) in [0, 1]."""
    n = len(pairs)
    k = len(SCALE)
    m = confusion(pairs)
    row = [sum(m[i]) for i in range(k)]
    col = [sum(m[i][j] for i in range(k)) for j in range(k)]
    po = sum(weights(i, j) * m[i][j] for i in range(k) for j in range(k)) / float(n)
    pe = sum(weights(i, j) * row[i] * col[j] for i in range(k) for j in range(k)) / float(n * n)
    if abs(1.0 - pe) < 1e-12:
        return None, po, pe
    return (po - pe) / (1.0 - pe), po, pe


def gwet_ac1(pairs):
    """Gwet's AC1. Chance agreement uses the mean marginal, not the product, so
    it does not collapse when one category dominates."""
    n = len(pairs)
    k = len(SCALE)
    m = confusion(pairs)
    po = sum(m[i][i] for i in range(k)) / float(n)
    pi = []
    for c in range(k):
        row = sum(m[c])
        col = sum(m[i][c] for i in range(k))
        pi.append((row + col) / float(2 * n))
    pe = sum(p * (1 - p) for p in pi) / float(k - 1)
    if abs(1.0 - pe) < 1e-12:
        return None, po, pe
    return (po - pe) / (1.0 - pe), po, pe


def wilson(x, n, z=1.959963985):
    if n == 0:
        return (None, None)
    p = x / float(n)
    den = 1 + z * z / n
    c = (p + z * z / (2 * n)) / den
    h = (z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5)) / den
    return (round(100 * (c - h), 1), round(100 * (c + h), 1))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    payload = json.load(io.open(sys.argv[1], encoding="utf-8"))
    key = answer_key()
    readers = payload.get("readers", [])
    if not readers:
        raise SystemExit("[REQUIRED_ENV_PARAM] no readers in %s" % sys.argv[1])

    results = []
    for r in readers:
        pairs, rows = [], []
        for a in r.get("answers", []):
            n = a.get("n")
            second = (a.get("label") or "").strip()
            original = key[n]["original"]
            if second in SCALE:
                pairs.append((second, original))
            rows.append({"case": n, "second": second, "original": original,
                         "agree": second == original,
                         "distance": abs(SCALE.index(second) - SCALE.index(original))
                                     if second in SCALE else None,
                         "reason": a.get("reason", ""),
                         "knew_outcome": a.get("knew_outcome") is True})
        n = len(pairs)
        agreed = sum(1 for s, o in pairs if s == o)
        k_un, po_un, pe_un = kappa(pairs, lambda i, j: 1.0 if i == j else 0.0)
        k_lin, po_lin, pe_lin = kappa(
            pairs, lambda i, j: 1.0 - abs(i - j) / float(len(SCALE) - 1))
        ac1, po_ac, pe_ac = gwet_ac1(pairs)
        adjacent = sum(1 for x in rows if x["distance"] == 1)
        extreme = sum(1 for x in rows if x["distance"] == 2)
        stricter = sum(1 for x in rows
                       if x["distance"] and SCALE.index(x["second"]) > SCALE.index(x["original"]))
        lenient = sum(1 for x in rows
                      if x["distance"] and SCALE.index(x["second"]) < SCALE.index(x["original"]))
        lo, hi = wilson(agreed, n)

        print("=" * 78)
        print("READER %s   slot %s   submitted %s"
              % (r.get("name", ""), r.get("slot", ""), r.get("submitted_at", "")))
        print("prior familiarity: %s" % (r.get("prior_familiarity") or "(none stated)"))
        print("consent to be named in the paper: %s"
              % ("YES" if r.get("consent_named_in_paper") else "no"))
        print("cases where the reader reported knowing the outcome: %d"
              % sum(1 for x in rows if x["knew_outcome"]))
        print()
        print("  cases scored                 %d of %d" % (n, r.get("total_cases") or 10))
        print("  exact agreement              %d of %d = %.1f%%  (95%% Wilson %s to %s)"
              % (agreed, n, 100.0 * agreed / n, lo, hi))
        print("  disagreements                %d, of which adjacent %d, Ready/Gap %d"
              % (n - agreed, adjacent, extreme))
        print("  direction                    second reader stricter %d, more lenient %d"
              % (stricter, lenient))
        print()
        print("  Cohen's kappa, unweighted    %.3f   (po %.3f, pe %.3f)" % (k_un, po_un, pe_un))
        print("  Cohen's kappa, linear weight %.3f   (po %.3f, pe %.3f)" % (k_lin, po_lin, pe_lin))
        print("  Gwet's AC1                   %.3f   (po %.3f, pe %.3f)" % (ac1, po_ac, pe_ac))
        print()
        print("  CONFUSION MATRIX, rows second reader, columns original read")
        m = confusion(pairs)
        print("  %-12s %s" % ("", "  ".join("%-11s" % s for s in SCALE)))
        for i, s in enumerate(SCALE):
            print("  %-12s %s" % (s, "  ".join("%-11d" % m[i][j] for j in range(len(SCALE)))))
        print()
        print("  %-5s %-12s %-12s %-6s %s" % ("CASE", "SECOND READ", "ORIGINAL", "AGREE", "DIST"))
        for x in rows:
            print("  %-5s %-12s %-12s %-6s %s"
                  % (x["case"], x["second"], x["original"],
                     "yes" if x["agree"] else "NO", x["distance"]))
        print()
        results.append({
            "reader": r.get("name", ""), "slot": r.get("slot", ""),
            "submitted_at": r.get("submitted_at", ""),
            "consent_named_in_paper": r.get("consent_named_in_paper") is True,
            "prior_familiarity": r.get("prior_familiarity", ""),
            "n": n, "agreed": agreed,
            "percent_agreement": round(100.0 * agreed / n, 1),
            "agreement_ci": [lo, hi],
            "kappa_unweighted": round(k_un, 3),
            "kappa_linear_weighted": round(k_lin, 3),
            "gwet_ac1": round(ac1, 3),
            "disagreements": n - agreed, "adjacent": adjacent, "extreme": extreme,
            "second_stricter": stricter, "second_more_lenient": lenient,
            "knew_outcome_count": sum(1 for x in rows if x["knew_outcome"]),
            "per_case": rows,
        })

    out = os.path.join(ROOT, "research", "Blind_Recheck_RESULT_2026-08-28.json")
    io.open(out, "w", encoding="utf-8").write(json.dumps(results, indent=2))
    print("written: %s" % os.path.relpath(out, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
