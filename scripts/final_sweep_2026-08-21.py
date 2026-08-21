#!/usr/bin/env python3
"""Final sweep: every test on every readable dataset, positive AND null.

THE DIRECTIVE ASKED FOR A SEARCH FOR POSITIVE FINDINGS AND FOR ONLY THOSE TO BE
RECORDED. THIS SCRIPT DOES NOT DO THAT, DELIBERATELY, AND THE REASON IS ALREADY
IN THE PROGRAMME'S OWN RECORD.

research/MASTER_TRACKER.md, exploratory-sweep section 6, written 2026-08-08 in
response to the same directive:

    "Searching a dataset for positive results after the fact and recording only
    those is selective reporting, and it is the specific failure this
    programme's own record already holds a line against. Every test run is
    therefore recorded here, positive and null, with its multiplicity context,
    and the single test that survived is recorded as the artefact it is. That is
    the version of this pass that is safe to put in front of a journal or a
    buyer."

A tracker containing only the positive half of a sweep is the single most
damaging document that could exist in a data room: it is discoverable, it is
dated, and it proves selection. Every test this script runs is therefore
recorded with its result whatever that result is, and the family-wise threshold
is stated before any p-value is read.

WHAT IS ACTUALLY NEW SINCE THE 2026-08-08 SWEEP. Verified by live pull, not
assumed:

  bench_outcomes    54 rows, unchanged, last row 2026-08-08. The Rung 3 sweep
                    recorded on 2026-08-08 still stands and is NOT re-run for a
                    result; it is re-run only to confirm reproduction.
  bench_labels      129 labels, 15 records, 25 labelers, to 2026-08-13.
                    THE MANUSCRIPTS REPORT 108 LABELS, 10 RECORDS, 21 RATERS.
                    This is genuinely unanalysed growth.
  study_runs        70 nightly reproducibility runs to 2026-08-21, 61 on the
                    cross-vendor triple. The manuscripts report a single 84
                    percent figure. The time series has never been analysed.

FAMILY-WISE THRESHOLD, FIXED BEFORE ANY TEST IS READ. All tests below are
exploratory. With K tests the Bonferroni threshold is 0.05/K, computed and
printed by the script from its own registry rather than asserted.

Usage: python3 scripts/final_sweep_2026-08-21.py
"""
import io
import json
import os
import sys
import urllib.request
from collections import Counter, defaultdict
from math import comb, log, sqrt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SB = "https://pjzxkeviouofdseagvpf.supabase.co"


def anon_key():
    import re
    for name in sorted(os.listdir(os.path.join(ROOT, "api"))):
        if not name.endswith(".js"):
            continue
        m = re.search(r"sb_publishable_[A-Za-z0-9_-]+",
                      io.open(os.path.join(ROOT, "api", name),
                              encoding="utf-8").read())
        if m:
            return m.group(0)
    raise SystemExit("[REQUIRED_ENV_PARAM] anon key not found in api/")


KEY = anon_key()


def fetch(table, limit=5000):
    req = urllib.request.Request(
        "%s/rest/v1/%s?select=*&limit=%d" % (SB, table, limit),
        headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    return json.loads(urllib.request.urlopen(req, timeout=60).read().decode())


# --- exact statistics, standard library only --------------------------------
def fisher(a, b, c, d):
    """Two-sided Fisher exact on [[a,b],[c,d]]."""
    n, r1, c1 = a + b + c + d, a + b, a + c
    def p(x):
        return comb(r1, x) * comb(n - r1, c1 - x) / comb(n, c1)
    obs = p(a)
    lo, hi = max(0, c1 - (n - r1)), min(r1, c1)
    return sum(p(x) for x in range(lo, hi + 1) if p(x) <= obs + 1e-12)


def wilson(k, n, z=1.959963985):
    if n == 0:
        return (float("nan"), float("nan"))
    ph = k / n
    d = 1 + z * z / n
    c = (ph + z * z / (2 * n)) / d
    h = z * sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / d
    return 100 * (c - h), 100 * (c + h)


def odds_ratio(a, b, c, d):
    """Haldane-Anscombe corrected when any cell is zero, and says which."""
    if 0 in (a, b, c, d):
        return (a + .5) * (d + .5) / ((b + .5) * (c + .5)), True
    return a * d / (b * c), False


def or_ci(a, b, c, d, z=1.959963985):
    A, B, C, D = a + .5, b + .5, c + .5, d + .5
    lor = log(A * D / (B * C))
    se = sqrt(1 / A + 1 / B + 1 / C + 1 / D)
    from math import exp
    return exp(lor - z * se), exp(lor + z * se)


def gwet_ac1(units):
    """Gwet's AC1 over units = list of lists of categorical ratings."""
    cats = sorted({r for u in units for r in u})
    us = [u for u in units if len(u) >= 2]
    if not us:
        return float("nan"), 0
    pa = sum(sum(u.count(c) * (u.count(c) - 1) for c in cats) /
             (len(u) * (len(u) - 1)) for u in us) / len(us)
    pi = {c: sum(u.count(c) / len(u) for u in us) / len(us) for c in cats}
    k = len(cats)
    pe = sum(pi[c] * (1 - pi[c]) for c in cats) / (k - 1) if k > 1 else 0.0
    return (pa - pe) / (1 - pe) if pe != 1 else float("nan"), len(us)


TESTS = []


def record(family, name, detail, p=None, effect="", note=""):
    TESTS.append(dict(family=family, name=name, detail=detail, p=p,
                      effect=effect, note=note))


# ===========================================================================
# FAMILY A. Rung 3 real-case outcomes. REPRODUCTION CHECK ONLY.
# ===========================================================================
bo = fetch("bench_outcomes")
ADVERSE = {"failed_appeal", "failed_audit"}
FLAG = {"review_required", "gap_identified"}


def two_by_two(rows, flag_fn, out_fn):
    a = sum(1 for r in rows if flag_fn(r) and out_fn(r))
    b = sum(1 for r in rows if flag_fn(r) and not out_fn(r))
    c = sum(1 for r in rows if not flag_fn(r) and out_fn(r))
    d = sum(1 for r in rows if not flag_fn(r) and not out_fn(r))
    return a, b, c, d


def run_2x2(family, name, rows, flag_fn, out_fn, note=""):
    a, b, c, d = two_by_two(rows, flag_fn, out_fn)
    if (a + b) == 0 or (c + d) == 0:
        record(family, name, "n=%d, one arm empty" % len(rows), None,
               "not estimable", note)
        return
    p = fisher(a, b, c, d)
    o, corrected = odds_ratio(a, b, c, d)
    lo, hi = or_ci(a, b, c, d)
    fl = wilson(a, a + b)
    cl = wilson(c, c + d)
    small = "SMALL CELL" if min(a, b, c, d) < 5 else ""
    record(family, name,
           "n=%d  cells %d/%d/%d/%d  flagged %.1f%% (%.1f to %.1f)  "
           "clean %.1f%% (%.1f to %.1f)"
           % (len(rows), a, b, c, d, 100 * a / (a + b), fl[0], fl[1],
              100 * c / (c + d), cl[0], cl[1]),
           p, "OR %.2f (%.2f to %.2f)%s" % (o, lo, hi,
                                            " [Haldane]" if corrected else ""),
           " ".join(x for x in (small, note) if x))


run_2x2("A. Rung 3", "flagged -> adverse, all domains", bo,
        lambda r: r["jrs_read"] in FLAG, lambda r: r["outcome"] in ADVERSE)
for dom in sorted({r["domain"] for r in bo}):
    run_2x2("A. Rung 3", "flagged -> adverse, domain=%s" % dom,
            [r for r in bo if r["domain"] == dom],
            lambda r: r["jrs_read"] in FLAG, lambda r: r["outcome"] in ADVERSE)
run_2x2("A. Rung 3", "gap only -> adverse, all domains", bo,
        lambda r: r["jrs_read"] == "gap_identified",
        lambda r: r["outcome"] in ADVERSE)
run_2x2("A. Rung 3", "gap -> failed_audit, all domains", bo,
        lambda r: r["jrs_read"] == "gap_identified",
        lambda r: r["outcome"] == "failed_audit",
        note="KNOWN ARTEFACT, see below")
run_2x2("A. Rung 3", "flagged -> not held_up, all domains", bo,
        lambda r: r["jrs_read"] in FLAG, lambda r: r["outcome"] != "held_up")
for dom in sorted({r["domain"] for r in bo}):
    run_2x2("A. Rung 3", "flagged -> not held_up, domain=%s" % dom,
            [r for r in bo if r["domain"] == dom],
            lambda r: r["jrs_read"] in FLAG, lambda r: r["outcome"] != "held_up")
resolved = [r for r in bo if r["outcome"] != "challenged"]
run_2x2("A. Rung 3", "resolved only, flagged -> adverse", resolved,
        lambda r: r["jrs_read"] in FLAG, lambda r: r["outcome"] in ADVERSE)

# The artefact, re-derived rather than asserted.
src_tab = defaultdict(Counter)
for r in bo:
    src = (r.get("source") or "").lower()
    cls = ("COMPTROLLER AUDIT" if ("osc.ny.gov" in src or "comptroller" in src)
           else "other source")
    src_tab[cls][r["outcome"]] += 1
    src_tab[cls]["read=" + r["jrs_read"]] += 1

# ===========================================================================
# FAMILY B. bench_labels. NEW DATA: 129 labels, 15 records, 25 labelers.
# ===========================================================================
bl = fetch("bench_labels")
CONDS = ["basis_identification", "cold_reviewer_clarity", "accountability_support",
         "reasoning_traceability", "temporal_reconstructability"]

# One label per labeler per record, earliest kept, matching the published rule.
dedup = {}
for r in sorted(bl, key=lambda r: r["created_at"]):
    dedup.setdefault((r["labeler_code"], r["record_id"]), r)
dd = list(dedup.values())

units = defaultdict(list)
for r in dd:
    units[r["record_id"]].append(r["determination"])
ac1_all, n_units = gwet_ac1(list(units.values()))
record("B. Reliability", "Gwet AC1, determination, ALL labels deduped",
       "%d labels, %d records with >=2 raters, %d labelers"
       % (len(dd), n_units, len({r["labeler_code"] for r in dd})),
       None, "AC1 = %.3f" % ac1_all,
       "MANUSCRIPTS REPORT 0.739 EXPERT / 0.624 TRAINED ON 10 RECORDS, 99 LABELS")

for mode in sorted({r["mode"] for r in dd}):
    u = defaultdict(list)
    for r in dd:
        if r["mode"] == mode:
            u[r["record_id"]].append(r["determination"])
    a, n = gwet_ac1(list(u.values()))
    record("B. Reliability", "Gwet AC1, mode=%s" % mode,
           "%d labels, %d multi-rater records"
           % (sum(1 for r in dd if r["mode"] == mode), n),
           None, "AC1 = %.3f" % a if a == a else "not estimable")

for cond in CONDS:
    u = defaultdict(list)
    for r in dd:
        v = (r.get("conditions") or {}).get(cond)
        if v:
            u[r["record_id"]].append(v)
    a, n = gwet_ac1(list(u.values()))
    record("B. Reliability", "Gwet AC1, condition=%s" % cond,
           "%d multi-rater records" % n, None,
           "AC1 = %.3f" % a if a == a else "not estimable")

# Per-condition discrimination against the determination, on the new corpus.
for cond in CONDS:
    a = sum(1 for r in dd if r["determination"] == "ready"
            and (r.get("conditions") or {}).get(cond) == "pass")
    b = sum(1 for r in dd if r["determination"] == "ready"
            and (r.get("conditions") or {}).get(cond) not in (None, "pass"))
    c = sum(1 for r in dd if r["determination"] == "gap_identified"
            and (r.get("conditions") or {}).get(cond) == "pass")
    d = sum(1 for r in dd if r["determination"] == "gap_identified"
            and (r.get("conditions") or {}).get(cond) not in (None, "pass"))
    if min(a + b, c + d) == 0:
        record("B. Conditions", "%s separates Ready from Gap" % cond,
               "one arm empty", None, "not estimable")
        continue
    p = fisher(a, b, c, d)
    o, corr = odds_ratio(a, b, c, d)
    record("B. Conditions", "%s separates Ready from Gap" % cond,
           "Ready pass %d/%d, Gap pass %d/%d" % (a, a + b, c, c + d), p,
           "OR %.1f%s" % (o, " [Haldane]" if corr else ""),
           "CIRCULAR, see the derivation test below")


# IS THE DETERMINATION A FUNCTION OF THE CONDITIONS? If it is, the five tests
# above are a variable tested against a function of itself, which is the same
# artefact class as gap -> failed_audit and must be labelled the same way.
_allpass_not_ready = sum(
    1 for r in dd
    if all((r.get("conditions") or {}).get(k) == "pass" for k in CONDS)
    and r["determination"] != "ready")
_anyfail_ready = sum(
    1 for r in dd
    if any((r.get("conditions") or {}).get(k) == "fail" for k in CONDS)
    and r["determination"] == "ready")
_uses_fail = sum(1 for r in dd
                 if any((r.get("conditions") or {}).get(k) == "fail"
                        for k in CONDS))
record("B. Conditions", "DERIVATION TEST: determination vs conditions",
       "all-five-pass but not Ready: %d; any-fail but Ready: %d; labels using "
       "'fail' at all: %d" % (_allpass_not_ready, _anyfail_ready, _uses_fail),
       None, "DETERMINISTIC" if _allpass_not_ready == 0 and _anyfail_ready == 0
       else "not deterministic",
       "IF DETERMINISTIC, EVERY B. Conditions TEST ABOVE IS CIRCULAR AND IS NOT "
       "A FINDING")

# Rater-level: does any single labeler drive the determination distribution?
by_lab = Counter(r["labeler_code"] for r in dd)
gap_rate = {}
for lab in by_lab:
    rows = [r for r in dd if r["labeler_code"] == lab]
    gap_rate[lab] = sum(1 for r in rows if r["determination"] == "gap_identified") / len(rows)
hi_lab = sorted(gap_rate.items(), key=lambda kv: -kv[1])[:3]
record("B. Raters", "per-rater gap rate spread",
       "%d labelers, %d..%d labels each"
       % (len(by_lab), min(by_lab.values()), max(by_lab.values())), None,
       "highest gap rates: " + ", ".join("%s %.0f%%" % (k[:10], 100 * v)
                                         for k, v in hi_lab))

# ===========================================================================
# FAMILY C. study_runs. NEW DATA: 70 nightly runs to 2026-08-21.
# ===========================================================================
sr = fetch("study_runs")
tri = [r for r in sr if "," in (r.get("model") or "")]
ag = [(r["created_at"][:10], r["metrics"].get("overall_agreement"))
      for r in tri if isinstance(r.get("metrics"), dict)
      and r["metrics"].get("overall_agreement") is not None]
ag.sort()
if ag:
    vals = [v for _, v in ag]
    mean = sum(vals) / len(vals)
    sd = (sum((v - mean) ** 2 for v in vals) / (len(vals) - 1)) ** .5 if len(vals) > 1 else 0.0
    half = len(vals) // 2
    m1 = sum(vals[:half]) / half if half else float("nan")
    m2 = sum(vals[half:]) / (len(vals) - half)
    record("C. Reproducibility", "cross-vendor agreement, full series",
           "%d runs, %s to %s" % (len(ag), ag[0][0], ag[-1][0]), None,
           "mean %.3f, sd %.3f, min %.3f, max %.3f"
           % (mean, sd, min(vals), max(vals)),
           "MANUSCRIPTS REPORT A SINGLE 84 PERCENT FIGURE")
    record("C. Reproducibility", "drift, first half vs second half",
           "%d vs %d runs" % (half, len(vals) - half), None,
           "mean %.3f -> %.3f, delta %+.3f" % (m1, m2, m2 - m1),
           "descriptive only, runs are not independent samples")
    lowest = sorted(ag, key=lambda kv: kv[1])[:3]
    record("C. Reproducibility", "lowest observed agreement runs",
           "; ".join("%s %.3f" % (d, v) for d, v in lowest), None, "")

# ===========================================================================
# OUTPUT
# ===========================================================================
K = len([t for t in TESTS if t["p"] is not None])
THRESH = 0.05 / K if K else float("nan")

print("=" * 100)
print("FINAL SWEEP 2026-08-21. %d inferential tests, %d descriptive." %
      (K, len(TESTS) - K))
print("Bonferroni family-wise threshold, computed from the registry: "
      "0.05/%d = %.5f" % (K, THRESH))
print("=" * 100)
fam = None
for t in TESTS:
    if t["family"] != fam:
        fam = t["family"]
        print("\n--- %s" % fam)
    ps = "p=%.4f" % t["p"] if t["p"] is not None else "p=n/a"
    mark = ""
    if t["p"] is not None:
        mark = " **SURVIVES**" if t["p"] < THRESH else (
            " (nominal only)" if t["p"] < 0.05 else "")
    if "CIRCULAR" in t["note"] or "ARTEFACT" in t["note"]:
        mark = " [ARTEFACT, NOT A FINDING]"
    print("  %-46s %-10s %-34s %s%s"
          % (t["name"][:46], ps, t["effect"][:34], t["note"], mark))

print("\n--- ARTEFACT RE-DERIVATION, source class vs outcome")
for cls in sorted(src_tab):
    print("  %-20s %s" % (cls, dict(src_tab[cls])))

surv = [t for t in TESTS if t["p"] is not None and t["p"] < THRESH
        and "CIRCULAR" not in t["note"] and "ARTEFACT" not in t["note"]]
arte = [t for t in TESTS if t["p"] is not None and t["p"] < THRESH
        and ("CIRCULAR" in t["note"] or "ARTEFACT" in t["note"])]
nom = [t for t in TESTS if t["p"] is not None and THRESH <= t["p"] < 0.05]
print("\nSURVIVE family-wise AND NOT ARTEFACTUAL: %d" % len(surv))
print("Cross threshold but are artefacts: %d   nominal only: %d   null: %d"
      % (len(arte), len(nom), K - len(surv) - len(arte) - len(nom)))
for t in arte:
    print("   ARTEFACT: %s  %s" % (t["name"], t["note"]))
json.dump(TESTS, io.open(os.path.join(ROOT, "research",
                                      "final_sweep_2026-08-21.json"),
                         "w", encoding="utf-8"), indent=1)
print("\nwrote research/final_sweep_2026-08-21.json")
