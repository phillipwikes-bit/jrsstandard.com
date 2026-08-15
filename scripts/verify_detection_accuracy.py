#!/usr/bin/env python3
"""Verify the detection paper's accuracy, sensitivity and specificity at data close.

WHY THIS EXISTS. Two of the four headline figures in Detection_Article_v2 were
already verifiable without any credential:

  accuracy 83.9% and 95% CI 72.7 to 95.1
      reproduced by `python3 research/analysis_2026-08-04.py`, and still current
      because no Arm A completer has touched their data since 2026-08-03.

  sensitivity 87.0% and specificity 80.7%
      NOT reproducible that way. They need the per-record judgments, which live
      in ai_pilot_reads behind row-level security. That is what this script is
      for, and it is the only outstanding item before submission.

HOW TO RUN IT. On your own machine, with your own key. The key is read from the
environment, is never printed, never written to a file, and never leaves the
process:

    export SUPABASE_SERVICE_ROLE_KEY='<service key>'
    python3 scripts/verify_detection_accuracy.py

If the key is not set, this prints how to set it and stops. It never invents a
number: no key, or no scorable rows, and it says so and exits.

WHAT IT PRINTS. Per-participant accuracy, sensitivity and specificity; the
participant-level means with confidence intervals; and a direct comparison
against the figures currently in the manuscript, marked MATCHES or DIFFERS.

Mirrors scripts/export_arm_b_data.py, which does the same job for Arm B.
"""
import json
import math
import os
import statistics as st
import sys
import urllib.request

PROJECT_REF = "pjzxkeviouofdseagvpf"
REST = "https://%s.supabase.co" % PROJECT_REF

# The verified answer key, identical to the copy in scripts/export_arm_b_data.py
# and to research/Verified_Key.md. 12 grounded, 12 ungrounded, fixed before any
# accuracy analysis was run and independently reproduced 24 of 24 by blind raters.
KEY = {
    'R01': 'GROUNDED',   'R02': 'UNGROUNDED', 'R03': 'UNGROUNDED', 'R04': 'GROUNDED',
    'R05': 'UNGROUNDED', 'R06': 'GROUNDED',   'R07': 'UNGROUNDED', 'R08': 'GROUNDED',
    'R09': 'UNGROUNDED', 'R10': 'GROUNDED',   'R11': 'UNGROUNDED', 'R12': 'GROUNDED',
    'R13': 'UNGROUNDED', 'R14': 'GROUNDED',   'R15': 'UNGROUNDED', 'R16': 'GROUNDED',
    'R17': 'UNGROUNDED', 'R18': 'GROUNDED',   'R19': 'UNGROUNDED', 'R20': 'GROUNDED',
    'R21': 'UNGROUNDED', 'R22': 'GROUNDED',   'R23': 'UNGROUNDED', 'R24': 'GROUNDED',
}

NEEDED_MIN = 18   # pre-registered: fewer than 18 of 24 excluded from accuracy analysis

GROUNDED_TOK = {'ready', 'yes', 'grounded', 'rely', 'would_rely', 'adequate', 'supported'}
UNGROUND_TOK = {'review_required', 'needs_work', 'needs work', 'gap', 'gap_identified',
                'no', 'ungrounded', 'not_rely', 'would_not_rely', 'inadequate', 'unsupported'}

# What the manuscript currently claims, for the comparison at the end.
PUBLISHED = {'accuracy': 83.9, 'ci_lo': 72.7, 'ci_hi': 95.1,
             'sensitivity': 87.0, 'specificity': 80.7, 'n': 16, 'reads': 384}


def die(msg, code=2):
    print(msg)
    sys.exit(code)


def get_key():
    k = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not k:
        die("SUPABASE_SERVICE_ROLE_KEY is not set.\n\n"
            "  export SUPABASE_SERVICE_ROLE_KEY='<service key>'\n"
            "  python3 scripts/verify_detection_accuracy.py\n\n"
            "Nothing was computed. This script does not guess at figures.")
    return k


def rest(path, key, rng=None):
    h = {"apikey": key, "Authorization": "Bearer " + key}
    if rng:
        h["Range"] = rng
    req = urllib.request.Request(REST + path, headers=h)
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read().decode())


def fetch_reads(key, batch_filter):
    rows, frm, page = [], 0, 1000
    while True:
        q = ("/rest/v1/ai_pilot_reads?select=reviewer_code,record_ref,jrs_read,rely,"
             "batch,created_at&order=created_at.asc")
        if batch_filter:
            q += "&batch=like." + batch_filter
        chunk = rest(q, key, rng="%d-%d" % (frm, frm + page - 1))
        if not chunk:
            break
        rows.extend(chunk)
        if len(chunk) < page:
            break
        frm += page
    return rows


def predict(det):
    d = (det or '').strip().lower()
    if d in GROUNDED_TOK:
        return 'GROUNDED'
    if d in UNGROUND_TOK:
        return 'UNGROUNDED'
    return None


def ci95_t(xs):
    n = len(xs)
    if n < 2:
        return (float('nan'), float('nan'))
    m = sum(xs) / n
    s = st.stdev(xs)
    tcrit = {4: 2.776, 5: 2.571, 10: 2.228, 11: 2.201, 14: 2.145,
             15: 2.131, 16: 2.120, 19: 2.093, 20: 2.086}.get(n - 1, 2.045)
    h = tcrit * s / math.sqrt(n)
    return (m - h, m + h)


def main():
    key = get_key()

    # Discover which batch label carries the detection panel, rather than
    # assuming one. Arm B is known to use 'armB%'; anything else is a candidate.
    print("Reading ai_pilot_reads ...")
    allrows = fetch_reads(key, None)
    if not allrows:
        die("ai_pilot_reads returned no rows even with the service key. "
            "Nothing computed.")
    batches = sorted({(r.get('batch') or '(null)') for r in allrows})
    print("  batch labels present: %s" % ", ".join(batches))
    detection = [r for r in allrows if not str(r.get('batch') or '').lower().startswith('armb')]
    print("  rows total %d | non-ArmB (detection) %d" % (len(allrows), len(detection)))
    if not detection:
        die("No non-ArmB rows found. If the detection panel uses a different batch "
            "label, pass it and re-run. Nothing computed.")

    # Latest submission per reviewer per record wins, matching the manuscript.
    latest = {}
    for r in sorted(detection, key=lambda x: x.get('created_at') or ''):
        latest[(r.get('reviewer_code'), r.get('record_ref'))] = r
    rows = list(latest.values())
    print("  after keeping the latest submission per reviewer per record: %d" % len(rows))

    by = {}
    for r in rows:
        by.setdefault(r.get('reviewer_code'), []).append(r)

    accs, sens, spec = [], [], []
    print("\n%-12s %6s %8s %12s %12s" % ("reviewer", "reads", "accuracy", "sensitivity", "specificity"))
    unscorable = 0
    for code in sorted(by):
        rs = by[code]
        scored = [(predict(r.get('jrs_read')), KEY.get(str(r.get('record_ref')).upper()))
                  for r in rs]
        scored = [(p, t) for p, t in scored if p and t]
        unscorable += len(rs) - len(scored)
        if len(scored) < NEEDED_MIN:
            print("%-12s %6d   EXCLUDED (below the pre-registered %d of 24 bar)"
                  % (code, len(scored), NEEDED_MIN))
            continue
        n = len(scored)
        acc = 100.0 * sum(1 for p, t in scored if p == t) / n
        pos = [(p, t) for p, t in scored if t == 'UNGROUNDED']   # detecting the risk
        neg = [(p, t) for p, t in scored if t == 'GROUNDED']
        sn = 100.0 * sum(1 for p, t in pos if p == t) / len(pos) if pos else float('nan')
        sp = 100.0 * sum(1 for p, t in neg if p == t) / len(neg) if neg else float('nan')
        accs.append(acc); sens.append(sn); spec.append(sp)
        print("%-12s %6d %7.2f%% %11.2f%% %11.2f%%" % (code, n, acc, sn, sp))

    if not accs:
        die("\nNo participant cleared the %d of 24 bar. Nothing computed." % NEEDED_MIN)

    print("\n%d participants analysed, %d unscorable judgments skipped." % (len(accs), unscorable))
    for name, xs, pub in (("accuracy", accs, PUBLISHED['accuracy']),
                          ("sensitivity", sens, PUBLISHED['sensitivity']),
                          ("specificity", spec, PUBLISHED['specificity'])):
        m = sum(xs) / len(xs)
        lo, hi = ci95_t(xs)
        flag = "MATCHES" if abs(m - pub) < 0.1 else "DIFFERS  <-- manuscript says %.1f%%" % pub
        print("  %-12s mean %6.2f%%   95%% CI %6.2f to %6.2f    %s" % (name, m, lo, hi, flag))

    m = sum(accs) / len(accs)
    lo, hi = ci95_t(accs)
    print("\nManuscript claims: n=%d, %d reads, accuracy %.1f%% (CI %.1f to %.1f), "
          "sensitivity %.1f%%, specificity %.1f%%"
          % (PUBLISHED['n'], PUBLISHED['reads'], PUBLISHED['accuracy'],
             PUBLISHED['ci_lo'], PUBLISHED['ci_hi'],
             PUBLISHED['sensitivity'], PUBLISHED['specificity']))
    print("Computed here:     n=%d, %d reads, accuracy %.1f%% (CI %.1f to %.1f)"
          % (len(accs), sum(len(by[c]) for c in by), m, lo, hi))
    print("\nIf every line above says MATCHES, the manuscript figures are verified at "
          "close and nothing needs changing. If any line says DIFFERS, the manuscript "
          "is what needs changing, not this script.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
