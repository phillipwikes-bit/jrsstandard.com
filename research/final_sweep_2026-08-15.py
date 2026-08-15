#!/usr/bin/env python3
"""FINAL SWEEP, 2026-08-15. Every dataset, every subdivision, one pass.

WHAT THIS DOES
    Pulls every anon-readable table, loads the closed-study aggregates from
    research/closed_aggregates_2026-08-15.json, runs every test the data can
    support, applies Holm-Bonferroni across the whole family, and writes a
    section to research/MASTER_TRACKER.md.

WHY EVERY TEST IS REPORTED, NOT ONLY THE POSITIVE ONES
    A sweep that records only what came out positive is selective reporting, and
    the resulting p-values do not mean what they appear to mean. Every test run
    is emitted with its multiplicity-adjusted threshold, whether it fired or
    not. research/Accuracy_Sweep_2026-08-01.md holds the same line.

Run:
    python3 research/final_sweep_2026-08-15.py            # print only
    python3 research/final_sweep_2026-08-15.py --write    # also append to the tracker

Exit code: 0 always. This reports; it does not gate.
"""
import collections
import io
import json
import math
import os
import statistics as st
import sys
import urllib.request
from math import comb

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SB = "https://pjzxkeviouofdseagvpf.supabase.co/rest/v1"
ANON = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"
AGG = os.path.join(HERE, "closed_aggregates_2026-08-15.json")
TRACKER = os.path.join(HERE, "MASTER_TRACKER.md")

TESTS = []          # every test run, in order, no filtering
NOTES = []          # non-inferential observations
BLOCKED = []        # things that cannot be tested and why


def fetch(table, limit=50000):
    req = urllib.request.Request(
        "%s/%s?select=*&limit=%d" % (SB, table, limit),
        headers={"apikey": ANON, "Authorization": "Bearer " + ANON})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except Exception:
        return None


def wilson(k, n, z=1.96):
    if not n:
        return (float("nan"), float("nan"))
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, c - h), min(1.0, c + h))


def fisher(a, b, c, d):
    n = a + b + c + d
    r1 = a + b
    c1 = a + c
    if n == 0 or r1 == 0 or c1 == 0 or r1 == n or c1 == n:
        return 1.0
    def p(x):
        return comb(r1, x) * comb(n - r1, c1 - x) / comb(n, c1)
    lo = max(0, c1 - (n - r1))
    hi = min(r1, c1)
    p0 = p(a)
    return min(1.0, sum(p(x) for x in range(lo, hi + 1) if p(x) <= p0 * (1 + 1e-9)))


def t_two_sided(t, df):
    """Two-sided p for Student's t via the regularised incomplete beta."""
    t = abs(float(t))
    if df <= 0:
        return float("nan")
    x = df / (df + t * t)
    def betacf(a, b, x):
        MAXIT, EPS, FPMIN = 300, 3e-16, 1e-300
        qab, qap, qam = a + b, a + 1.0, a - 1.0
        c = 1.0
        d = 1.0 - qab * x / qap
        if abs(d) < FPMIN:
            d = FPMIN
        d = 1.0 / d
        h = d
        for m in range(1, MAXIT + 1):
            m2 = 2 * m
            aa = m * (b - m) * x / ((qam + m2) * (a + m2))
            d = 1.0 + aa * d
            c = 1.0 + aa / c
            if abs(d) < FPMIN:
                d = FPMIN
            if abs(c) < FPMIN:
                c = FPMIN
            d = 1.0 / d
            h *= d * c
            aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
            d = 1.0 + aa * d
            c = 1.0 + aa / c
            if abs(d) < FPMIN:
                d = FPMIN
            if abs(c) < FPMIN:
                c = FPMIN
            d = 1.0 / d
            de = d * c
            h *= de
            if abs(de - 1.0) < EPS:
                break
        return h
    def betai(a, b, x):
        if x <= 0:
            return 0.0
        if x >= 1:
            return 1.0
        lb = (math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b)
              + a * math.log(x) + b * math.log(1 - x))
        bt = math.exp(lb)
        if x < (a + 1) / (a + b + 2):
            return bt * betacf(a, b, x) / a
        return 1.0 - bt * betacf(b, a, 1 - x) / b
    return betai(df / 2.0, 0.5, x)


def welch(m1, s1, n1, m2, s2, n2):
    v1, v2 = s1 * s1, s2 * s2
    se = math.sqrt(v1 / n1 + v2 / n2)
    if se == 0 or n1 < 2 or n2 < 2:
        return (float("nan"),) * 5
    t = (m1 - m2) / se
    df = ((v1 / n1 + v2 / n2) ** 2
          / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1)))
    sp = math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2))
    d = (m1 - m2) / sp if sp > 0 else float("nan")
    return (t, df, t_two_sided(t, df), d, se)


def T(family, name, p, detail, cells=None):
    TESTS.append({"family": family, "name": name, "p": p,
                  "detail": detail, "cells": cells})


# ===========================================================================
# PHASE 1: INGESTION
# ===========================================================================
DATA = {}
for t in ("bench_labels", "bench_outcomes", "bench_records", "bench_gold",
          "bench_ai_verdicts", "study_runs", "findings_history",
          "research_questions", "interaction_events", "pilot_progress",
          "armb_progress", "realcase_progress", "studies", "findings",
          "ai_pilot_reads", "bench_experts", "bench_preflight",
          "engine_reviews", "pilot_contacts", "guide_downloads",
          "finding_responses", "finding_poll_votes"):
    DATA[t] = fetch(t)

AGGD = json.load(io.open(AGG, encoding="utf-8"))

INGEST = []
for t in sorted(DATA):
    v = DATA[t]
    if v is None:
        INGEST.append((t, "UNREACHABLE", 0))
    elif len(v) == 0:
        INGEST.append((t, "RLS-EMPTY", 0))
    else:
        INGEST.append((t, "OK", len(v)))

# ===========================================================================
# PHASE 2: CROSS-EXAMINATION
# ===========================================================================

# --- F1. Rung 2a: does each condition separate Ready from Gap? -------------
lab = DATA["bench_labels"] or []
jrs_raw = [r for r in lab if r.get("mode") == "jrs"]
ded = {}
for r in sorted(jrs_raw, key=lambda x: x.get("created_at") or ""):
    ded[(r["labeler_code"], r["record_id"])] = r
jrs = list(ded.values())
ready = [r for r in jrs if r["determination"] == "ready"]
gap = [r for r in jrs if r["determination"] == "gap_identified"]
CONDS = sorted({k for r in jrs for k in (r.get("conditions") or {})})
for c in CONDS:
    a = sum(1 for r in ready if (r.get("conditions") or {}).get(c) == "pass")
    x = sum(1 for r in gap if (r.get("conditions") or {}).get(c) == "pass")
    p = fisher(a, len(ready) - a, x, len(gap) - x)
    wa, wx = wilson(a, len(ready)), wilson(x, len(gap))
    T("F1 condition separation", c, p,
      "Ready %d/%d (%.0f-%.0f%%) vs Gap %d/%d (%.0f%%, %.0f-%.0f%%)"
      % (a, len(ready), 100 * wa[0], 100 * wa[1],
         x, len(gap), 100 * x / len(gap) if gap else 0,
         100 * wx[0], 100 * wx[1]),
      (a, len(ready) - a, x, len(gap) - x))

# --- F2. Rung 2a: does the rater's self-declared domain matter? ------------
by_dom = collections.defaultdict(list)
for r in jrs:
    by_dom[r.get("role") or "(none)"].append(r)
gap_overall = sum(1 for r in jrs if r["determination"] == "gap_identified")
for dom in sorted(by_dom):
    sub = by_dom[dom]
    a = sum(1 for r in sub if r["determination"] == "gap_identified")
    b = len(sub) - a
    c = gap_overall - a
    d = (len(jrs) - gap_overall) - b
    p = fisher(a, b, c, d)
    w = wilson(a, len(sub))
    T("F2 rater domain vs Gap rate", dom, p,
      "%d/%d gap (%.0f%%, 95%% CI %.0f-%.0f%%) vs %d/%d elsewhere"
      % (a, len(sub), 100 * a / len(sub), 100 * w[0], 100 * w[1], c, c + d),
      (a, b, c, d))

# --- F3. Rung 3: real-case outcomes, every subdivision ---------------------
OUT = DATA["bench_outcomes"] or []
ADVERSE = {"failed_appeal", "failed_audit", "challenged"}
def audit_doc(r):
    s = (r.get("source") or "").lower()
    return ("osc.ny.gov" in s) or ("comptroller" in s) or ("/audits/" in s)
def split(rows, flag, label):
    a = sum(1 for r in rows if flag(r) and r["outcome"] in ADVERSE)
    b = sum(1 for r in rows if flag(r) and r["outcome"] not in ADVERSE)
    c = sum(1 for r in rows if not flag(r) and r["outcome"] in ADVERSE)
    d = sum(1 for r in rows if not flag(r) and r["outcome"] not in ADVERSE)
    p = fisher(a, b, c, d)
    w1, w0 = wilson(a, a + b), wilson(c, c + d)
    T("F3 Rung 3 outcomes", label, p,
      "flagged %d/%d (%.0f%%, %.0f-%.0f%%) vs unflagged %d/%d (%.0f%%, %.0f-%.0f%%)"
      % (a, a + b, 100 * a / (a + b) if a + b else 0, 100 * w1[0], 100 * w1[1],
         c, c + d, 100 * c / (c + d) if c + d else 0, 100 * w0[0], 100 * w0[1]),
      (a, b, c, d))
flagged = lambda r: r["jrs_read"] in ("gap_identified", "review_required")
gaponly = lambda r: r["jrs_read"] == "gap_identified"
split(OUT, flagged, "flagged vs ready, all 54")
for dom in sorted({r["domain"] for r in OUT}):
    split([r for r in OUT if r["domain"] == dom], flagged, "flagged vs ready, %s" % dom)
split(OUT, gaponly, "gap only vs rest, all 54")
NONAUDIT = [r for r in OUT if not audit_doc(r)]
split(NONAUDIT, flagged, "flagged vs ready, AUDIT REPORTS REMOVED (n=%d)" % len(NONAUDIT))
split(NONAUDIT, gaponly, "gap only, AUDIT REPORTS REMOVED (n=%d)" % len(NONAUDIT))

# --- F4. Rung 1: is any constructed record systematically harder? ----------
runs = [r for r in (DATA["study_runs"] or [])
        if (r.get("metrics") or {}).get("mode") == "cross_vendor"]
per_rec = collections.defaultdict(list)
for r in runs:
    for k, v in ((r.get("metrics") or {}).get("per_record") or {}).items():
        if v is not None:
            per_rec[k].append(v)
grand = [v for vs in per_rec.values() for v in vs]
gm = st.mean(grand) if grand else 0.0
# DESCRIPTIVE ONLY, NO SIGNIFICANCE TEST, AND THE REASON MATTERS.
#
# A first version of this block ran Welch on each record against all others and
# produced p-values down to 2.6e-58. Those were artefacts, not findings, for two
# independent reasons:
#   1. The runs are the SAME 15 records re-scored nightly. Observations within a
#      record are serially dependent, so the effective n is nowhere near the run
#      count and any test assuming independence is meaningless.
#   2. Several records score 1.000 on every run. Zero variance drives the
#      standard error to zero and the t statistic to infinity regardless of the
#      size of the underlying difference.
# The spread across records is real and worth reporting. The p-values were not,
# and they are not computed.
for k in sorted(per_rec, key=lambda z: st.mean(per_rec[z])):
    vs = per_rec[k]
    NOTES.append("F4 record %-14s mean %.3f  min %.3f  max %.3f  SD %.3f  over %d runs"
                 % (k, st.mean(vs), min(vs), max(vs),
                    st.pstdev(vs) if len(vs) > 1 else 0.0, len(vs)))
BLOCKED.append("F4 per-record model agreement is reported descriptively and is NOT "
               "significance tested. The nightly runs re-score the same 15 records, so "
               "observations within a record are serially dependent and the effective "
               "sample is far smaller than the run count; several records also have zero "
               "variance, which sends any t statistic to infinity. An earlier version of "
               "this script tested them anyway and returned p-values to 2.6e-58, which "
               "were artefacts of both problems. Testing this properly needs a "
               "mixed-effects model over run and record, which is not run here.")

# --- F5. Reproducibility trend over time ----------------------------------
series = []
for r in runs:
    m = r.get("metrics") or {}
    pr = {k: v for k, v in (m.get("per_record") or {}).items() if v is not None}
    val = m.get("overall_agreement")
    if val is None and pr:
        val = sum(pr.values()) / len(pr)
    if val is not None:
        series.append((r["created_at"][:10], val, len(pr)))
series.sort()
big = [s for s in series if s[2] == 15]
if len(big) >= 4:
    xs = list(range(len(big)))
    ys = [s[1] for s in big]
    mx, my = st.mean(xs), st.mean(ys)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sxx = sum((x - mx) ** 2 for x in xs)
    slope = sxy / sxx if sxx else 0.0
    resid = [y - (my + slope * (x - mx)) for x, y in zip(xs, ys)]
    sse = sum(e * e for e in resid)
    n = len(xs)
    sse_var = sse / (n - 2) if n > 2 else float("nan")
    se_slope = math.sqrt(sse_var / sxx) if sxx and sse_var == sse_var else float("nan")
    tval = slope / se_slope if se_slope else float("nan")
    p = t_two_sided(tval, n - 2) if tval == tval else float("nan")
    T("F5 reproducibility trend", "slope across the %d 15-record runs" % n, p,
      "slope %+.5f per run, first %.3f last %.3f" % (slope, ys[0], ys[-1]))
else:
    BLOCKED.append("F5 trend: fewer than 4 fifteen-record runs")

# --- F6. AI verdicts vs the fixed gold key --------------------------------
gold = DATA["bench_gold"] or []
verd = DATA["bench_ai_verdicts"] or []
gold_by_det = collections.Counter(g.get("determination") for g in gold)
verd_by_det = collections.Counter(v.get("determination") for v in verd)
NOTES.append("F6 bench_gold determinations: %s" % dict(gold_by_det))
NOTES.append("F6 bench_ai_verdicts determinations: %s" % dict(verd_by_det))
BLOCKED.append("F6 AI-vs-gold accuracy: bench_gold carries 3 rows all on record_id "
               "00000000-0000-0000-0000-000000000000 and bench_ai_verdicts carries 5 "
               "rows on real record ids. There is no join key, so no agreement rate "
               "can be computed. Not estimated.")

# --- F7. Detection panel: sensitivity vs specificity -----------------------
dp = AGGD["detection_panel"]
t, df, p, d, se = welch(dp["sensitivity"]["mean"], dp["sensitivity"]["sd"], dp["sensitivity"]["n"],
                        dp["specificity"]["mean"], dp["specificity"]["sd"], dp["specificity"]["n"])
T("F7 detection asymmetry", "sensitivity vs specificity, UNPAIRED approximation", p,
  "sens %.2f (SD %.2f) vs spec %.2f (SD %.2f), diff %+.2f, d=%.2f, Welch df %.1f"
  % (dp["sensitivity"]["mean"], dp["sensitivity"]["sd"],
     dp["specificity"]["mean"], dp["specificity"]["sd"],
     dp["sensitivity"]["mean"] - dp["specificity"]["mean"], d, df))
BLOCKED.append("F7 is UNPAIRED and therefore conservative-to-wrong in an unknown "
               "direction. The same 16 reviewers produced both numbers, so the correct "
               "test is paired and needs the per-participant pairs, which the aggregate "
               "endpoint did not emit and which no longer exists to query. Reported as "
               "an approximation and must not be published as a paired result.")

# --- F8. Arm B: sensitivity vs specificity, and vs the detection panel -----
ab = AGGD["arm_b"]
t, df, p, d, se = welch(ab["sensitivity"]["mean"], ab["sensitivity"]["sd"], ab["sensitivity"]["n"],
                        ab["specificity"]["mean"], ab["specificity"]["sd"], ab["specificity"]["n"])
T("F8 Arm B asymmetry", "sensitivity vs specificity, UNPAIRED approximation", p,
  "sens %.2f (SD %.2f) vs spec %.2f (SD %.2f), diff %+.2f, d=%.2f"
  % (ab["sensitivity"]["mean"], ab["sensitivity"]["sd"],
     ab["specificity"]["mean"], ab["specificity"]["sd"],
     ab["sensitivity"]["mean"] - ab["specificity"]["mean"], d))
for metric in ("accuracy", "sensitivity", "specificity"):
    t, df, p, d, se = welch(dp[metric]["mean"], dp[metric]["sd"], dp[metric]["n"],
                            ab[metric]["mean"], ab[metric]["sd"], ab[metric]["n"])
    T("F9 detection panel vs Arm B", metric, p,
      "detection %.2f (SD %.2f, n %d) vs Arm B %.2f (SD %.2f, n %d), diff %+.2f, d=%.2f"
      % (dp[metric]["mean"], dp[metric]["sd"], dp[metric]["n"],
         ab[metric]["mean"], ab[metric]["sd"], ab[metric]["n"],
         dp[metric]["mean"] - ab[metric]["mean"], d))

# --- F10. B1 vs B2, the pre-registered comparison --------------------------
b1 = ab["by_arm"]["B1"]
b2 = ab["by_arm"]["B2"]
t, df, p, d, se = welch(b1["mean"], b1["sd"], b1["n"], b2["mean"], b2["sd"], b2["n"])
T("F10 pre-registered Floor 3", "B1 vs B2 accuracy", p,
  "B1 %.2f (SD %.2f, n %d) vs B2 %.2f (SD %.2f, n %d), diff %+.2f, 95%% CI %+.2f to %+.2f, d=%.3f"
  % (b1["mean"], b1["sd"], b1["n"], b2["mean"], b2["sd"], b2["n"],
     ab["arm_comparison"]["mean_difference"],
     ab["arm_comparison"]["diff_ci95_low"], ab["arm_comparison"]["diff_ci95_high"],
     ab["arm_comparison"]["cohens_d"]))
BLOCKED.append("F10 sensitivity and specificity split by B1 vs B2 were never emitted by "
               "the endpoint, which returned by_arm for accuracy only. The endpoint is "
               "deleted, so this cannot be recovered without redeploying. Not estimated.")

# --- F11. Perfect-scorer rates -------------------------------------------
for label, blk, n in (("detection accuracy", dp["accuracy"], dp["accuracy"]["n"]),
                      ("detection sensitivity", dp["sensitivity"], dp["sensitivity"]["n"]),
                      ("detection specificity", dp["specificity"], dp["specificity"]["n"]),
                      ("Arm B accuracy", ab["accuracy"], ab["accuracy"]["n"]),
                      ("Arm B sensitivity", ab["sensitivity"], ab["sensitivity"]["n"]),
                      ("Arm B specificity", ab["specificity"], ab["specificity"]["n"])):
    k = blk["scored_100"]
    w = wilson(k, n)
    NOTES.append("F11 %s: %d/%d scored 100%% (%.0f%%, 95%% CI %.0f-%.0f%%)"
                 % (label, k, n, 100 * k / n, 100 * w[0], 100 * w[1]))
a = dp["sensitivity"]["scored_100"]
b = dp["sensitivity"]["n"] - a
c = dp["specificity"]["scored_100"]
d2 = dp["specificity"]["n"] - c
T("F11 perfect scorers", "detection: perfect sensitivity vs perfect specificity",
  fisher(a, b, c, d2),
  "%d/%d vs %d/%d" % (a, a + b, c, c + d2), (a, b, c, d2))

# --- F12. Site telemetry --------------------------------------------------
ev = DATA["interaction_events"] or []
types = collections.Counter(e.get("type") for e in ev)
NOTES.append("F12 interaction_events by type: %s" % dict(types))
days = collections.Counter((e.get("created_at") or "")[:10] for e in ev if e.get("created_at"))
if days:
    NOTES.append("F12 span %s to %s over %d distinct days, %.1f events/day"
                 % (min(days), max(days), len(days), len(ev) / len(days)))

# --- F13. research_questions duplication ---------------------------------
rq = DATA["research_questions"] or []
qtext = [q.get("question") for q in rq]
dupes = {k: v for k, v in collections.Counter(qtext).items() if v > 1}
if dupes:
    NOTES.append("F13 research_questions: %d rows, %d distinct, EVERY question stored %s times"
                 % (len(qtext), len(set(qtext)), sorted({str(v) for v in dupes.values()})))

# ===========================================================================
# PHASE 3: MULTIPLICITY AND OUTPUT
# ===========================================================================
valid = [t for t in TESTS if t["p"] == t["p"]]
K = len(valid)
ordered = sorted(valid, key=lambda t: t["p"])
holm_cut = None
for i, t in enumerate(ordered):
    thresh = 0.05 / (K - i)
    t["holm_threshold"] = thresh
    t["holm_pass"] = (t["p"] < thresh) and (holm_cut is None)
    if not t["holm_pass"]:
        holm_cut = i
for t in TESTS:
    if t["p"] != t["p"]:
        t["holm_threshold"] = float("nan")
        t["holm_pass"] = False

L = []
A = L.append
A("")
A("---")
A("")
A("## FINAL SWEEP 2026-08-15: every dataset, every subdivision")
A("")
A("Generated by `research/final_sweep_2026-08-15.py`. **Every test run is listed. "
  "Nothing is filtered on its result.** Family-wise control is Holm-Bonferroni across "
  "all %d tests; the per-test threshold is shown." % K)
A("")
A("### Phase 1: ingestion")
A("")
A("| Table | Status | Rows |")
A("|---|---|---|")
for name, status, n in INGEST:
    A("| `%s` | %s | %d |" % (name, status, n))
A("")
A("`RLS-EMPTY` means HTTP 200 with an empty array: row-level security filtered it, "
  "not an empty table.")
A("")
A("### Phase 2: every test, ordered by p")
A("")
A("| # | Family | Test | p | Holm threshold | Survives |")
A("|---|---|---|---|---|---|")
for i, t in enumerate(ordered, 1):
    A("| %d | %s | %s | %.2e | %.2e | %s |"
      % (i, t["family"], t["name"], t["p"], t["holm_threshold"],
         "**YES**" if t["holm_pass"] else "no"))
A("")
A("### Detail for every test")
A("")
for t in ordered:
    small = ""
    if t["cells"] and min(t["cells"]) < 5:
        small = "  **CELL < 5: interval is wide by construction; no inference from this alone.**"
    A("- **%s / %s** p=%.4g. %s%s" % (t["family"], t["name"], t["p"], t["detail"], small))
A("")
A("### Survivors")
A("")
surv = [t for t in ordered if t["holm_pass"]]
if surv:
    for t in surv:
        A("- **%s / %s**, p=%.4g, Holm threshold %.4g. %s"
          % (t["family"], t["name"], t["p"], t["holm_threshold"], t["detail"]))
else:
    A("None.")
A("")
A("### Non-inferential observations")
A("")
for n in NOTES:
    A("- %s" % n)
A("")
A("### Cannot be tested, and why")
A("")
for b in BLOCKED:
    A("- %s" % b)
A("")

REPORT = "\n".join(L)
print(REPORT)

if "--write" in sys.argv:
    with io.open(TRACKER, "a", encoding="utf-8") as fh:
        fh.write(REPORT)
    print("\n[written to %s]" % TRACKER)

sys.exit(0)
