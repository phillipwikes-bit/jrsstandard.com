#!/usr/bin/env python3
"""Arm B accuracy scorer (JRS vs baseline) — runs the moment the raw labels exist.

WHY THIS FILE EXISTS
--------------------
The Arm B per-record judgments live in `ai_pilot_reads` (batch = armB), which is
RLS-locked: the public/anon key returns zero rows, and this environment has no
service-role key. So the accuracy result cannot be produced from here. This
script closes that gap: export the armB rows once (you own the DB) and this
scores them against the verified key with the pre-registered rule, no guesswork.

HOW TO GET THE RESULT (one of):
  A) Export rows to a file and run this. From any context that has the
     service-role key (e.g. Supabase SQL editor / psql / a Vercel function):
         select code, condition, record_id, determination, mode
         from ai_pilot_reads
         where batch = 'armB';
     Save as research/armb_export.json (array of objects) or .csv, then:
         python3 research/score_armb.py research/armb_export.json
  B) If record_id is a UUID rather than R01..R24, also provide a mapping file
     research/armb_record_map.json  = { "<uuid>": "R01", ... }  and pass it:
         python3 research/score_armb.py research/armb_export.json research/armb_record_map.json

SCORING (pre-registered, JRS_PreRegistered_Analysis_Plan.md sec.3/Floor 2;
ArmB_Design.md):
  - Binary collapse: prediction is GROUNDED iff the reviewer said the record is
    adequately supported, else UNGROUNDED.
      B1 (JRS):      determination 'ready'  -> GROUNDED ; 'review_required'/'needs_work'/'gap_identified' -> UNGROUNDED
      B2 (baseline): 'yes'/'grounded'/'rely'-> GROUNDED ; 'no'/'ungrounded'/'not_rely' -> UNGROUNDED
  - Correct iff prediction == verified key (Verified_Key.md).
  - Participants with < 18/24 scored reads are excluded from the accuracy analysis.
  - Reports per-arm mean accuracy, B1 - B2 difference with 95% CI (participant
    bootstrap, fixed seed), and Floor 2 vs chance (0.50) per arm and pooled.
"""
import csv, json, sys, collections, random

# ---- verified key (Verified_Key.md; governs all accuracy scoring) ----
KEY = {
    'R01':'GROUNDED','R02':'UNGROUNDED','R03':'UNGROUNDED','R04':'GROUNDED',
    'R05':'UNGROUNDED','R06':'GROUNDED','R07':'UNGROUNDED','R08':'GROUNDED',
    'R09':'UNGROUNDED','R10':'GROUNDED','R11':'UNGROUNDED','R12':'GROUNDED',
    'R13':'UNGROUNDED','R14':'GROUNDED','R15':'UNGROUNDED','R16':'GROUNDED',
    'R17':'UNGROUNDED','R18':'GROUNDED','R19':'UNGROUNDED','R20':'GROUNDED',
    'R21':'UNGROUNDED','R22':'GROUNDED','R23':'UNGROUNDED','R24':'GROUNDED',
}
NEEDED_MIN = 18
SEED = 20260731
B = 20000

GROUNDED_TOKENS = {'ready','yes','grounded','rely','would_rely','adequate','supported'}
UNGROUNDED_TOKENS = {'review_required','needs_work','needs work','gap','gap_identified',
                     'no','ungrounded','not_rely','would_not_rely','inadequate','unsupported'}


def load_rows(path):
    if path.endswith('.json'):
        return json.load(open(path))
    return list(csv.DictReader(open(path)))


def predict(determination):
    d = (determination or '').strip().lower()
    if d in GROUNDED_TOKENS: return 'GROUNDED'
    if d in UNGROUNDED_TOKENS: return 'UNGROUNDED'
    return None  # unknown token -> not scorable


def rec_label(row, rmap):
    r = str(row.get('record') or row.get('record_label') or row.get('record_id') or '').strip()
    if r in KEY: return r
    if rmap and r in rmap and rmap[r] in KEY: return rmap[r]
    ru = r.upper()
    return ru if ru in KEY else None


def mean(xs): return sum(xs)/len(xs) if xs else float('nan')


def wilson(k, n, z=1.96):
    if n == 0: return (float('nan'), float('nan'))
    p = k/n; d = 1+z*z/n
    c = (p + z*z/(2*n))/d
    h = z*((p*(1-p)/n + z*z/(4*n*n))**0.5)/d
    return (c-h, c+h)


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    rows = load_rows(sys.argv[1])
    rmap = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else None

    per = collections.defaultdict(lambda: {'cond':None,'correct':0,'scored':0,'bad':0})
    for row in rows:
        code = str(row.get('code') or row.get('arm_code') or '').strip()
        cond = str(row.get('condition') or row.get('arm') or '').strip().upper()
        if cond not in ('B1','B2'):
            continue
        rl = rec_label(row, rmap)
        pred = predict(row.get('determination') or row.get('answer') or row.get('label'))
        p = per[code]; p['cond'] = cond
        if rl is None or pred is None:
            p['bad'] += 1; continue
        p['scored'] += 1
        if pred == KEY[rl]: p['correct'] += 1

    parts = []
    for code, p in per.items():
        acc = p['correct']/p['scored'] if p['scored'] else float('nan')
        incl = p['scored'] >= NEEDED_MIN
        parts.append({'code':code,'cond':p['cond'],'correct':p['correct'],
                      'scored':p['scored'],'acc':acc,'included':incl,'bad':p['bad']})
    parts.sort(key=lambda x:(x['cond'],x['code']))

    print("="*64)
    print("Arm B accuracy — JRS (B1) vs baseline (B2), pre-registered scoring")
    print("="*64)
    for p in parts:
        flag = "" if p['included'] else "  [EXCLUDED <18 scored]"
        print("  %-8s %-3s  %2d/%-2d correct  acc=%.3f%s" % (
            p['code'], p['cond'], p['correct'], p['scored'], p['acc'], flag))

    inc = [p for p in parts if p['included']]
    b1 = [p['acc'] for p in inc if p['cond']=='B1']
    b2 = [p['acc'] for p in inc if p['cond']=='B2']
    tot_correct = sum(p['correct'] for p in inc)
    tot_scored = sum(p['scored'] for p in inc)

    print("-"*64)
    print("Included: B1 n=%d, B2 n=%d" % (len(b1), len(b2)))
    if not b1 or not b2:
        print("NOT ENOUGH per-arm data to compare (need >=1 included per arm; "
              "design floor is 5-8/arm). Report as in-progress.")
        return
    m1, m2 = mean(b1), mean(b2)
    diff = m1 - m2
    print("B1 (JRS) mean accuracy     = %.3f" % m1)
    print("B2 (baseline) mean accuracy= %.3f" % m2)
    print("Difference (B1 - B2)       = %+.3f" % diff)

    random.seed(SEED)
    boot = []
    for _ in range(B):
        s1 = mean([random.choice(b1) for _ in b1])
        s2 = mean([random.choice(b2) for _ in b2])
        boot.append(s1 - s2)
    boot.sort()
    lo, hi = boot[int(0.025*B)], boot[int(0.975*B)]
    print("  95%% CI of difference (participant bootstrap) [%+.3f, %+.3f]" % (lo, hi))
    print("  Floor 3 (B1 > B2, CI excludes 0): %s" % ("MET" if lo > 0 else "NOT met"))

    lo_p, hi_p = wilson(tot_correct, tot_scored)
    print("-"*64)
    print("Floor 2 (detection vs chance): pooled %d/%d = %.3f, 95%% CI [%.3f, %.3f]" % (
        tot_correct, tot_scored, tot_correct/tot_scored, lo_p, hi_p))
    print("  above chance (CI-low > 0.50): %s ; >=0.70 target: %s" % (
        "yes" if lo_p > 0.50 else "no", "yes" if tot_correct/tot_scored >= 0.70 else "no"))


if __name__ == '__main__':
    main()
