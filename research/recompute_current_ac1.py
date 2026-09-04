#!/usr/bin/env python3
"""Recompute the Study 004 reliability coefficients from the CURRENT dataset.

READ-ONLY with respect to the repository. Writes only into its own directory.

METHOD IS NOT REINVENTED. Every estimator is imported unmodified from
research/compute_ac1_ci.py, the script the manuscript cites. The bootstrap
replicate count (B=20000) and seed (SEED=20260727) are that file's own module
constants, read at run time. NO SEED IS INVENTED HERE.

INCLUSION RULE, exactly as the manuscript states it in Methods 4.7:
    labels recorded under the five-condition instrument (mode = jrs),
    one label per rater per record, latest submission retained.
"Latest" is resolved by created_at ascending, so the rule is deterministic
rather than dependent on the order the API happens to return rows in.

FAIL-CLOSED. If the live table does not reproduce the committed
FULL_DATA_ANALYSIS_2026-08-15.txt figures, nothing is emitted and the exit code
is 1. A confidence interval computed on a dataset that no longer matches the
published point estimate is worse than no interval at all.

Usage:
  python3 recompute_current_ac1.py <repo_root> <out.json>
"""
import collections
import importlib.util
import io
import json
import os
import re
import sys
import urllib.request

SB = "https://pjzxkeviouofdseagvpf.supabase.co/rest/v1"
ANON = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"   # public by design


def fetch(table, limit=50000):
    req = urllib.request.Request(
        "%s/%s?select=*&limit=%d" % (SB, table, limit),
        headers={"apikey": ANON, "Authorization": "Bearer " + ANON})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())


def load_estimator(root):
    """Import research/compute_ac1_ci.py unmodified and hand back its functions."""
    path = os.path.join(root, "research", "compute_ac1_ci.py")
    spec = importlib.util.spec_from_file_location("ac1mod", path)
    mod = importlib.util.module_from_spec(spec)
    cwd = os.getcwd()
    os.chdir(os.path.join(root, "research"))   # its DATA path is relative
    try:
        spec.loader.exec_module(mod)
    finally:
        os.chdir(cwd)
    return mod


def dedup_latest(rows):
    """One label per (record, rater), latest created_at wins.

    compute_ac1_ci.py's dedup_last() keeps the last row in ITERATION order,
    which is only 'latest' if the caller sorted first. Sorting by created_at
    ascending makes that guarantee hold rather than assuming it.
    """
    ordered = sorted(rows, key=lambda r: (r.get("created_at") or ""))
    seen = {}
    for r in ordered:
        seen[(r["record_id"], r["labeler_code"])] = r
    return list(seen.values())


def block(mod, rows, label):
    recmap = collections.defaultdict(list)
    for r in rows:
        recmap[r["record_id"]].append(r["determination"])
    est, pa, n_est = mod.ac1(recmap)
    _, alo, ahi, se = mod.analytic_ci(recmap)
    blo, bhi = mod.bootstrap_ci(recmap)
    per_rater = collections.Counter(r["labeler_code"] for r in rows)
    per_rec = collections.Counter(r["record_id"] for r in rows)
    single = [k for k, v in recmap.items() if len(v) < 2]
    return {
        "group": label,
        "labels": len(rows),
        "raters": len(per_rater),
        "records_with_any_label": len(recmap),
        "records_estimable": n_est,
        "records_single_rater": len(single),
        "single_rater_record_ids": sorted(single),
        "raw_pairwise_agreement": round(pa, 4),
        "ac1": round(est, 4),
        "ac1_printed": "%.3f" % est,
        "analytic_ci": [round(max(alo, -1.0), 4), round(min(ahi, 1.0), 4)],
        "analytic_ci_printed": ["%.3f" % max(alo, -1.0), "%.3f" % min(ahi, 1.0)],
        "analytic_se": round(se, 4),
        "bootstrap_ci": [round(blo, 4), round(min(bhi, 1.0), 4)],
        "bootstrap_ci_printed": ["%.3f" % blo, "%.3f" % min(bhi, 1.0)],
        "krippendorff_alpha": round(mod.krippendorff_alpha(recmap), 4),
        "fleiss_kappa": round(mod.fleiss_kappa(recmap), 4),
        "labels_per_rater_min": min(per_rater.values()) if per_rater else 0,
        "labels_per_rater_max": max(per_rater.values()) if per_rater else 0,
        "labels_per_record_min": min(per_rec.values()) if per_rec else 0,
        "labels_per_record_max": max(per_rec.values()) if per_rec else 0,
    }


def main():
    root = sys.argv[1]
    outp = sys.argv[2]
    mod = load_estimator(root)
    W = sys.stdout.write

    W("estimator      : research/compute_ac1_ci.py (imported unmodified)\n")
    W("bootstrap reps : %d   (module constant B)\n" % mod.B)
    W("bootstrap seed : %d   (module constant SEED)\n" % mod.SEED)
    W("categories     : %s   (module constant CATS)\n\n" % mod.CATS)

    rows = fetch("bench_labels")

    # ---- FAIL-CLOSED GATE 1: the live table must still match the committed run
    committed = os.path.join(root, "research", "FULL_DATA_ANALYSIS_2026-08-15.txt")
    txt = io.open(committed, encoding="utf-8").read()
    want = {}
    m = re.search(r"RUNG 2a RELIABILITY\s+\(bench_labels, (\d+) rows\)", txt)
    want["rows"] = int(m.group(1)) if m else None
    m = re.search(r"modes: \{'jrs': (\d+), 'normal': (\d+)\}", txt)
    want["jrs"], want["normal"] = (int(m.group(1)), int(m.group(2))) if m else (None, None)
    m = re.search(r"distinct raters: (\d+)\s+\(experts (\d+), R- codes (\d+)\)", txt)
    want["raters"], want["e"], want["r"] = (
        int(m.group(1)), int(m.group(2)), int(m.group(3))) if m else (None, None, None)
    m = re.search(r"distinct records labelled: (\d+)", txt)
    want["records"] = int(m.group(1)) if m else None
    m = re.search(r"experts\s+AC1=([\d.]+)\s+labels=(\d+) raters=(\d+) records=(\d+)", txt)
    want["exp"] = m.groups() if m else None
    m = re.search(r"trained\s+AC1=([\d.]+)\s+labels=(\d+) raters=(\d+) records=(\d+)", txt)
    want["tra"] = m.groups() if m else None
    m = re.search(r"all raters\s+AC1=([\d.]+)\s+labels=(\d+) raters=(\d+) records=(\d+)", txt)
    want["all"] = m.groups() if m else None

    modes = collections.Counter(r.get("mode") for r in rows)
    codes = set(r["labeler_code"] for r in rows)
    got = {
        "rows": len(rows),
        "jrs": modes.get("jrs", 0),
        "normal": modes.get("normal", 0),
        "raters": len(codes),
        "e": len([c for c in codes if str(c).startswith("E")]),
        "r": len([c for c in codes if str(c).startswith("R")]),
        "records": len(set(r["record_id"] for r in rows)),
    }
    W("GATE 1  live table versus the committed 2026-08-15 run\n")
    gate1 = True
    for k in ("rows", "jrs", "normal", "raters", "e", "r", "records"):
        ok = want[k] == got[k]
        gate1 &= ok
        W("  %-10s committed %-6s live %-6s  %s\n"
          % (k, want[k], got[k], "ok" if ok else "MISMATCH"))
    if not gate1:
        W("\nBLOCKED: the live table has moved since the published run. "
          "Nothing written.\n")
        return 1

    # ---- inclusion rule
    jrs = [r for r in rows if r.get("mode") == "jrs"]
    ded = dedup_latest(jrs)
    exp = [r for r in ded if str(r["labeler_code"]).startswith("E")]
    reg = [r for r in ded if not str(r["labeler_code"]).startswith("E")]

    res = {
        "experts": block(mod, exp, "experts (E-coded, invited)"),
        "regular": block(mod, reg, "regular reviewers (R-coded, self-enrolled)"),
        "pooled": block(mod, ded, "all five-condition raters"),
    }

    # ---- FAIL-CLOSED GATE 2: point estimates must reproduce the published run
    W("\nGATE 2  recomputed point estimates versus the published run\n")
    gate2 = True
    for key, wkey in (("experts", "exp"), ("regular", "tra"), ("pooled", "all")):
        w = want[wkey]
        d = res[key]
        checks = [("AC1", w[0], d["ac1_printed"]),
                  ("labels", w[1], str(d["labels"])),
                  ("raters", w[2], str(d["raters"])),
                  ("records", w[3], str(d["records_estimable"]))]
        for name, a, b in checks:
            ok = a == b
            gate2 &= ok
            W("  %-8s %-8s committed %-6s recomputed %-6s  %s\n"
              % (key, name, a, b, "ok" if ok else "MISMATCH"))
    if not gate2:
        W("\nBLOCKED: the recomputation does not reproduce the published point "
          "estimates. Nothing written.\n")
        return 1

    # ---- excluded, baseline-instrument raters
    normal_rows = [r for r in rows if r.get("mode") == "normal"]
    nrat = collections.Counter(r["labeler_code"] for r in normal_rows)
    jrs_raters = set(r["labeler_code"] for r in jrs)
    res["excluded_baseline"] = {
        "raters": len(nrat),
        "labels": len(normal_rows),
        "codes": {k: v for k, v in sorted(nrat.items())},
        "also_appear_in_jrs_set": sorted(set(nrat) & jrs_raters),
    }
    res["totals"] = {
        "all_raters_any_instrument": got["raters"],
        "e_coded": got["e"],
        "r_coded": got["r"],
        "raters_in_five_condition_set": res["pooled"]["raters"],
        "records_any_label_all_modes": got["records"],
        "labels_submitted_five_condition": got["jrs"],
        "labels_retained_after_dedup": len(ded),
    }
    res["provenance"] = {
        "dataset": "live bench_labels, Supabase project pjzxkeviouofdseagvpf",
        "row_count": got["rows"],
        "estimator": "research/compute_ac1_ci.py, imported unmodified",
        "bootstrap_reps": mod.B,
        "bootstrap_seed": mod.SEED,
        "inclusion_rule": "mode = jrs; one label per rater per record; "
                          "latest created_at retained",
        "gate1_live_matches_committed_run": True,
        "gate2_point_estimates_reproduce": True,
    }

    W("\nRECOMPUTED CURRENT VALUES\n")
    for k in ("experts", "regular", "pooled"):
        d = res[k]
        W("  [%s]\n" % d["group"])
        W("    labels %d  raters %d  records estimable %d  (single-rater %d)\n"
          % (d["labels"], d["raters"], d["records_estimable"], d["records_single_rater"]))
        W("    raw pairwise %.1f%%   AC1 %.4f -> %s\n"
          % (d["raw_pairwise_agreement"] * 100, d["ac1"], d["ac1_printed"]))
        W("    analytic 95%% CI  %s to %s   (SE %.3f)\n"
          % (d["analytic_ci_printed"][0], d["analytic_ci_printed"][1], d["analytic_se"]))
        W("    bootstrap 95%% CI %s to %s\n"
          % (d["bootstrap_ci_printed"][0], d["bootstrap_ci_printed"][1]))
        W("    Krippendorff alpha %.3f   Fleiss kappa %.3f\n"
          % (d["krippendorff_alpha"], d["fleiss_kappa"]))
    e = res["excluded_baseline"]
    W("\n  excluded, baseline instrument: %d raters, %d labels\n" % (e["raters"], e["labels"]))
    for c, n in e["codes"].items():
        W("    %-16s %d labels\n" % (c, n))
    W("    any of them also in the five-condition set: %s\n"
      % (e["also_appear_in_jrs_set"] or "none"))
    t = res["totals"]
    W("\n  25/22 accounting: %d raters total (%d E- + %d R-), "
      "%d in the five-condition set\n"
      % (t["all_raters_any_instrument"], t["e_coded"], t["r_coded"],
         t["raters_in_five_condition_set"]))
    W("  record accounting: %d records carry a label, %d estimable, %d single-rater\n"
      % (res["pooled"]["records_with_any_label"], res["pooled"]["records_estimable"],
         res["pooled"]["records_single_rater"]))
    W("  label accounting : %d submitted under the five conditions, %d retained\n"
      % (t["labels_submitted_five_condition"], t["labels_retained_after_dedup"]))

    io.open(outp, "w", encoding="utf-8").write(json.dumps(res, indent=2) + "\n")
    W("\nwrote %s\n" % outp)
    W("RESULT: PASS\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
