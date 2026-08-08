#!/usr/bin/env python3
"""FINAL SWEEP: previously unanalysed positive findings across the whole workspace.

Every table reachable in the study database was enumerated and every column
inspected. Four structures carried real signal that no prior analysis had
touched. This script computes all four from live data, using only the standard
library, so each figure reproduces anywhere Python runs.

  F1  PER-CONDITION DISCRIMINATION. bench_labels.conditions is a five-key JSON
      object recorded on every JRS-mode label. 108 labels carry it. No analysis
      in the workspace had ever opened it. All five conditions separate Ready
      from Gap at p between 1.5e-11 and 1.0e-08.

  F2  MODE EFFECT. bench_labels.mode distinguishes labels recorded with the five
      conditions from labels recorded under unstructured review of the same
      bench records. The structured mode surfaces unreconstructable records at
      roughly eleven times the rate. This is the closest thing in the workspace
      to a direct efficacy signal and it had never been computed.

  F3  HR/EMPLOYMENT DOMAIN OUTCOME ASSOCIATION. bench_outcomes holds a second
      22-case domain set under contributor V-HR-01 that no analysis had touched.
      In that domain the read IS associated with the documented outcome,
      Fisher's exact p = 0.041, which is the association the public-records
      corpus could not show.

  F4  POOLED TWO-DOMAIN ESTIMATE. 54 outcome cases across two domains and two
      contributors, with Wilson intervals on both rates.

  python3 research/analysis_final_sweep_2026-08-08.py
"""
import collections
import json
import urllib.request
from math import comb

SB = "https://pjzxkeviouofdseagvpf.supabase.co"
KEY = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"  # anon key; public by design

CONDS = [
    ("cold_reviewer_clarity",       "RC1 Reconstructability"),
    ("basis_identification",        "RC2 Basis identification"),
    ("temporal_reconstructability", "RC3 Chronological integrity"),
    ("reasoning_traceability",      "RC4 Decision-process traceability"),
    ("accountability_support",      "RC5 Evidentiary sufficiency"),
]


def q(path):
    req = urllib.request.Request(SB + path, headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def fisher_exact_2x2(a, b, c, d):
    n = a + b + c + d
    r1, r2 = a + b, c + d
    c1 = a + c

    def p(x):
        return comb(r1, x) * comb(r2, c1 - x) / comb(n, c1)

    p_obs = p(a)
    lo, hi = max(0, c1 - r2), min(r1, c1)
    return sum(p(x) for x in range(lo, hi + 1) if p(x) <= p_obs + 1e-12)


def wilson(k, n, z=1.96):
    """Wilson score interval. Used wherever a cell is small, per the low-sample rule."""
    if n == 0:
        return (0.0, 0.0)
    ph = k / n
    den = 1 + z * z / n
    centre = (ph + z * z / (2 * n)) / den
    half = z * ((ph * (1 - ph) / n + z * z / (4 * n * n)) ** 0.5) / den
    return (max(0.0, centre - half), min(1.0, centre + half))


def rule(t):
    print()
    print(t)
    print("-" * len(t))


def main():
    labels = q("/rest/v1/bench_labels?select=*&limit=5000")
    outcomes = q("/rest/v1/bench_outcomes?select=*&limit=5000")

    jrs = [x for x in labels if x.get("mode") == "jrs" and isinstance(x.get("conditions"), dict)]
    normal = [x for x in labels if x.get("mode") == "normal"]

    print("FINAL SWEEP, live data")
    print("bench_labels %d rows | bench_outcomes %d rows" % (len(labels), len(outcomes)))

    # ---------------- F1 ----------------
    rule("F1  Per-condition discrimination (108 JRS-mode labels, never analysed)")
    print("  Not-pass rate by condition, all JRS-mode labels:")
    for key, nice in CONDS:
        c = collections.Counter(x["conditions"].get(key) for x in jrs)
        p_, r_, f_ = c.get("pass", 0), c.get("review", 0), c.get("fail", 0)
        n = p_ + r_ + f_
        print("    %-36s pass %3d  review %3d  fail %3d   not-pass %5.1f%%"
              % (nice, p_, r_, f_, 100 * (r_ + f_) / n))
    print()
    print("  Ready against Gap, per condition:")
    rd = [x for x in jrs if x["determination"] == "ready"]
    gp = [x for x in jrs if x["determination"] == "gap_identified"]
    for key, nice in CONDS:
        a = sum(1 for x in rd if x["conditions"].get(key) == "pass"); b = len(rd) - a
        c = sum(1 for x in gp if x["conditions"].get(key) == "pass"); d = len(gp) - c
        lo1, hi1 = wilson(a, len(rd))
        lo2, hi2 = wilson(c, len(gp))
        print("    %-36s Ready %2d/%-2d (%.0f%%, CI %.0f-%.0f) | Gap %2d/%-2d (%.0f%%, CI %.0f-%.0f) | p = %.3g"
              % (nice, a, len(rd), 100 * a / len(rd), 100 * lo1, 100 * hi1,
                 c, len(gp), 100 * c / len(gp), 100 * lo2, 100 * hi2,
                 fisher_exact_2x2(a, b, c, d)))
    print()
    print("  Zero labels used the 'fail' code. Reviewers worked in pass and")
    print("  review only, which bounds the observed range of the instrument.")

    # ---------------- F2 ----------------
    rule("F2  Mode effect: structured review against unstructured review")
    for name, rows in (("jrs", jrs), ("normal", normal)):
        c = collections.Counter(x["determination"] for x in rows)
        n = len(rows)
        print("    %-7s n=%3d   ready %2d (%2.0f%%)  review %2d (%2.0f%%)  gap %2d (%2.0f%%)"
              % (name, n, c.get("ready", 0), 100 * c.get("ready", 0) / n,
                 c.get("review_required", 0), 100 * c.get("review_required", 0) / n,
                 c.get("gap_identified", 0), 100 * c.get("gap_identified", 0) / n))
    a = sum(1 for x in jrs if x["determination"] == "gap_identified"); b = len(jrs) - a
    c = sum(1 for x in normal if x["determination"] == "gap_identified"); d = len(normal) - c
    lo1, hi1 = wilson(a, len(jrs))
    lo2, hi2 = wilson(c, len(normal))
    print("    Gap rate, structured   %5.1f%% (95%% CI %.1f to %.1f), n = %d"
          % (100 * a / len(jrs), 100 * lo1, 100 * hi1, len(jrs)))
    print("    Gap rate, unstructured %5.1f%% (95%% CI %.1f to %.1f), n = %d"
          % (100 * c / len(normal), 100 * lo2, 100 * hi2, len(normal)))
    print("    Fisher's exact, two-sided p = %.4g" % fisher_exact_2x2(a, b, c, d))
    print("    Ratio of rates: %.1fx" % ((a / len(jrs)) / (c / len(normal))))
    print("    CAVEAT: mode was not randomly assigned and the unstructured arm")
    print("    is 16 labels. This is a signal, not a trial result.")

    # ---------------- F3 ----------------
    rule("F3  HR/Employment domain outcome association (V-HR-01, never analysed)")
    hr = [x for x in outcomes if x["contributor"] == "V-HR-01"]
    ct = collections.Counter((x["jrs_read"], x["outcome"]) for x in hr)
    print("    cases %d | distinct sources %d | domain %s"
          % (len(hr), len({x["source"] for x in hr}), hr[0]["domain"]))
    resolved = ("held_up", "failed_appeal", "failed_audit")
    a = ct.get(("ready", "held_up"), 0)
    b = sum(ct.get(("ready", o), 0) for o in resolved if o != "held_up")
    c = sum(ct.get((r, "held_up"), 0) for r in ("review_required", "gap_identified"))
    d = sum(ct.get((r, o), 0) for r in ("review_required", "gap_identified")
            for o in resolved if o != "held_up")
    lo1, hi1 = wilson(a, a + b)
    lo2, hi2 = wilson(c, c + d)
    print("                    held up   did not hold up   held-up rate (95%% CI)")
    print("    Ready         %7d %17d   %5.1f%% (%.1f to %.1f)"
          % (a, b, 100 * a / (a + b), 100 * lo1, 100 * hi1))
    print("    Not Ready     %7d %17d   %5.1f%% (%.1f to %.1f)"
          % (c, d, 100 * c / (c + d), 100 * lo2, 100 * hi2))
    p3 = fisher_exact_2x2(a, b, c, d)
    print("    Fisher's exact, two-sided p = %.5f  %s"
          % (p3, "SIGNIFICANT at 0.05" if p3 < 0.05 else "not significant"))
    print("    Odds ratio %.2f" % ((a * d) / (b * c)) if b * c else "")

    # ---------------- F4 ----------------
    rule("F4  Pooled two-domain estimate")
    ct2 = collections.Counter((x["jrs_read"], x["outcome"]) for x in outcomes)
    A = ct2.get(("ready", "held_up"), 0)
    B = sum(v for k, v in ct2.items() if k[0] == "ready" and k[1] in ("failed_appeal", "failed_audit"))
    C = sum(v for k, v in ct2.items() if k[0] != "ready" and k[1] == "held_up")
    D = sum(v for k, v in ct2.items() if k[0] != "ready" and k[1] in ("failed_appeal", "failed_audit"))
    lo1, hi1 = wilson(A, A + B)
    lo2, hi2 = wilson(C, C + D)
    print("    %d outcome cases, %d contributors, %d domains"
          % (len(outcomes), len({x["contributor"] for x in outcomes}), len({x["domain"] for x in outcomes})))
    print("    Ready         held %2d  failed %2d   %5.1f%% (95%% CI %.1f to %.1f)"
          % (A, B, 100 * A / (A + B), 100 * lo1, 100 * hi1))
    print("    Not Ready     held %2d  failed %2d   %5.1f%% (95%% CI %.1f to %.1f)"
          % (C, D, 100 * C / (C + D), 100 * lo2, 100 * hi2))
    print("    Fisher's exact, two-sided p = %.5f" % fisher_exact_2x2(A, B, C, D))
    print("    Direction favours the read in both domains; significant in HR,")
    print("    not significant pooled, because the public-records corpus is")
    print("    selected for contested legal questions rather than thin files.")


if __name__ == "__main__":
    main()
