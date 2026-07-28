#!/usr/bin/env python3
"""
Gwet's AC1 with 95% confidence intervals for the JRS Rung 2a reliability data.

Reads research/construct_validity_data.csv (one row per rater-record label,
column `determination` in {ready, review_required, gap_identified}).

Computes, for the expert panel (codes starting 'E') and the trained-reviewer
panel (all other codes), separately:
  - number of records, labels, mean raters per record
  - raw (observed) percent agreement, chance-corrected via Gwet's AC1
  - a 95% confidence interval by subject-level (record) bootstrap

AC1 point estimate uses Gwet's multiple-rater definition (Gwet, 2014,
Handbook of Inter-Rater Reliability, 4th ed.):
  p_a  = mean over records of  sum_k r_ik(r_ik-1) / (r_i(r_i-1))
  pi_k = mean over records of  r_ik / r_i
  p_e  = 1/(q-1) * sum_k pi_k(1-pi_k)
  AC1  = (p_a - p_e) / (1 - p_e)

No third-party packages; deterministic bootstrap (fixed seed) for reproducibility.
"""
import csv, collections, random

CATS = ['ready', 'review_required', 'gap_identified']
Q = len(CATS)
DATA = 'construct_validity_data.csv'
B = 20000
SEED = 20260727


def load():
    rows = list(csv.DictReader(open(DATA)))
    return rows


def dedup_last(rows):
    """Keep one label per (record, code): the last occurrence (a resubmission
    supersedes an earlier submission by the same rater)."""
    seen = {}
    for r in rows:
        seen[(r['record_id'], r['labeler_code'])] = r
    return list(seen.values())


def by_record(rows):
    d = collections.defaultdict(list)
    for r in rows:
        d[r['record_id']].append(r['determination'])
    return d


def ac1(recmap):
    """Gwet's AC1 point estimate and raw agreement over records with >=2 raters."""
    recs = [labels for labels in recmap.values() if len(labels) >= 2]
    n = len(recs)
    pa_terms, pik_terms = [], []
    for labels in recs:
        ri = len(labels)
        cnt = collections.Counter(labels)
        pa_i = sum(cnt[k] * (cnt[k] - 1) for k in CATS) / (ri * (ri - 1))
        pa_terms.append(pa_i)
        pik_terms.append({k: cnt[k] / ri for k in CATS})
    pa = sum(pa_terms) / n
    pik = {k: sum(t[k] for t in pik_terms) / n for k in CATS}
    pe = sum(pik[k] * (1 - pik[k]) for k in CATS) / (Q - 1)
    return (pa - pe) / (1 - pe), pa, n


def analytic_ci(recmap):
    """Gwet's (2014) linearization variance for AC1 with any number of raters,
    the same estimator implemented in the irrCAC package (gwet.ac1.dist).
    Returns (ac1, lo, hi) using a Student-t 95% interval on n-1 df."""
    import math
    recs = [labels for labels in recmap.values() if len(labels) >= 2]
    n = len(recs)
    pa_i, pik_i = [], []
    for labels in recs:
        ri = len(labels)
        cnt = collections.Counter(labels)
        pa_i.append(sum(cnt[k] * (cnt[k] - 1) for k in CATS) / (ri * (ri - 1)))
        pik_i.append({k: cnt[k] / ri for k in CATS})
    pa = sum(pa_i) / n
    pik = {k: sum(t[k] for t in pik_i) / n for k in CATS}
    pe = sum(pik[k] * (1 - pik[k]) for k in CATS) / (Q - 1)
    ac1 = (pa - pe) / (1 - pe)
    # per-subject linearized values
    lin = []
    for i in range(n):
        pe_i = sum(pik_i[i][k] * (1 - pik[k]) for k in CATS) / (Q - 1)
        val = (pa_i[i] - pe) / (1 - pe) - 2 * (1 - ac1) * (pe_i - pe) / (1 - pe)
        lin.append(val)
    var = sum((v - ac1) ** 2 for v in lin) / (n * (n - 1))
    se = math.sqrt(var)
    # Student-t 97.5 percentile for small n (lookup, df = n-1)
    tvals = {5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
             11: 2.201, 12: 2.179, 15: 2.131, 20: 2.086, 25: 2.060, 30: 2.042}
    t = tvals.get(n - 1, 1.96)
    return ac1, ac1 - t * se, ac1 + t * se, se


def bootstrap_ci(recmap, reps=B, seed=SEED):
    rng = random.Random(seed)
    keys = list(recmap.keys())
    ests = []
    for _ in range(reps):
        sample = rng.choices(keys, k=len(keys))
        sub = collections.defaultdict(list)
        for j, k in enumerate(sample):
            sub[(k, j)] = recmap[k]  # unique key so duplicate records both count
        est, _, _ = ac1(sub)
        ests.append(est)
    ests.sort()
    lo = ests[int(0.025 * reps)]
    hi = ests[int(0.975 * reps)]
    return lo, hi


def report(name, rows):
    recmap = by_record(rows)
    labels = sum(len(v) for v in recmap.values())
    nrec = len(recmap)
    est, pa, n = ac1(recmap)
    lo, hi = bootstrap_ci(recmap)
    aest, alo, ahi, se = analytic_ci(recmap)
    print(f"\n[{name}]")
    print(f"  records={nrec}  labels={labels}  mean raters/record={labels/nrec:.2f}")
    print(f"  raw agreement (p_a, pairwise) = {pa*100:.1f}%")
    print(f"  Gwet's AC1 = {est:.3f}")
    print(f"    analytic 95% CI (Gwet linearization) [{max(alo,-1):.3f}, {min(ahi,1):.3f}]  (SE={se:.3f})")
    print(f"    bootstrap 95% CI (subject resample)   [{lo:.3f}, {min(hi,1):.3f}]")
    print(f"  floor check (analytic): point>=0.61 -> {est>=0.61};  CI-low>=0.41 -> {alo>=0.41}")
    return est, alo, ahi, lo, hi


def main():
    rows = load()
    exp = [r for r in rows if r['labeler_code'].startswith('E')]
    rev_all = [r for r in rows if not r['labeler_code'].startswith('E')]
    rev_dedup = dedup_last(rev_all)

    print("=" * 64)
    print("JRS Rung 2a reliability: Gwet's AC1 with 95% bootstrap CIs")
    print(f"bootstrap reps={B}, seed={SEED}")
    print("=" * 64)
    report("Experts (E-codes)", exp)
    report("Trained reviewers (all labels, incl. resubmissions)", rev_all)
    report("Trained reviewers (deduplicated: one label per rater per record)", rev_dedup)


if __name__ == '__main__':
    main()
