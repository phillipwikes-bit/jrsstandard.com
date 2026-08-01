#!/usr/bin/env python3
"""Self-contained Arm B export + scorer. Run it where your service-role key lives.

WHAT IT DOES (one command, zero third-party deps, no token shared with anyone):
  1. Reads SUPABASE_SERVICE_ROLE_KEY from the shell environment.
  2. Fetches the Arm B judgments from ai_pilot_reads (batch armB) - the RLS-locked
     rows the service role can read.
  3. Joins the B1/B2 assignment from the armb_progress view.
  4. Scores each judgment against the verified key (embedded below), using the
     pre-registered Ready-vs-not-Ready binary collapse.
  5. Writes research/ArmB_Scored_Results.json and prints B1 vs B2 accuracy with a
     95% CI, plus detection-vs-chance (Floor 2).

RUN IT (locally, or anywhere your token is set). Either credential works:
    export SUPABASE_ACCESS_TOKEN='sbp_...'       # Personal Access Token (Management API)
  or
    export SUPABASE_SERVICE_ROLE_KEY='...'       # service-role key (REST, bypasses RLS)
    python3 scripts/export_arm_b_data.py
The token stays in your shell. It is never written to a file and never sent to chat.

If the key is not set, the script prints how to set it and exits WITHOUT inventing
numbers. It never fabricates: no key or no scorable rows => it says so and stops.
"""
import os, sys, json, math, random, collections, urllib.request

SB = "https://pjzxkeviouofdseagvpf.supabase.co"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "research", "ArmB_Scored_Results.json")

# Verified answer key (research/Verified_Key.md) - governs all accuracy scoring.
KEY = {
    'R01':'GROUNDED','R02':'UNGROUNDED','R03':'UNGROUNDED','R04':'GROUNDED',
    'R05':'UNGROUNDED','R06':'GROUNDED','R07':'UNGROUNDED','R08':'GROUNDED',
    'R09':'UNGROUNDED','R10':'GROUNDED','R11':'UNGROUNDED','R12':'GROUNDED',
    'R13':'UNGROUNDED','R14':'GROUNDED','R15':'UNGROUNDED','R16':'GROUNDED',
    'R17':'UNGROUNDED','R18':'GROUNDED','R19':'UNGROUNDED','R20':'GROUNDED',
    'R21':'UNGROUNDED','R22':'GROUNDED','R23':'UNGROUNDED','R24':'GROUNDED',
}
NEEDED_MIN = 18            # ArmB_Design.md: <18/24 excluded from accuracy analysis
SEED = 20260731
B = 20000
GROUNDED_TOK = {'ready','yes','grounded','rely','would_rely','adequate','supported'}
UNGROUND_TOK = {'review_required','needs_work','needs work','gap','gap_identified',
                'no','ungrounded','not_rely','would_not_rely','inadequate','unsupported'}


def die(msg, code=2):
    print(msg); sys.exit(code)


PROJECT_REF = "pjzxkeviouofdseagvpf"
MGMT = "https://api.supabase.com/v1/projects/%s/database/query" % PROJECT_REF


def get_cred():
    """Return (kind, token). 'service' = REST bypass-RLS key; 'pat' = sbp_ Personal
    Access Token used against the Management API SQL endpoint. Either works."""
    svc = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if svc:
        return ('service', svc)
    pat = os.environ.get('SUPABASE_ACCESS_TOKEN') or os.environ.get('SUPABASE_PAT')
    if pat:
        return ('pat', pat)
    die("No credential in the environment. This script does not invent results.\n"
        "Set ONE of these and re-run (the token stays in your shell, never in chat):\n"
        "    export SUPABASE_ACCESS_TOKEN='sbp_...'          # your Personal Access Token\n"
        "  or\n"
        "    export SUPABASE_SERVICE_ROLE_KEY='<service key>'\n"
        "    python3 scripts/export_arm_b_data.py")


def rest(path, key, rng=None):
    h = {"apikey": key, "Authorization": "Bearer " + key}
    if rng:
        h["Range-Unit"] = "items"; h["Range"] = rng
    req = urllib.request.Request(SB + path, headers=h)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def mgmt_sql(query, pat):
    body = json.dumps({"query": query}).encode()
    req = urllib.request.Request(MGMT, data=body, method='POST', headers={
        "Authorization": "Bearer " + pat, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read().decode())


def fetch_all(kind, tok):
    """Return (armb_rows, arm_map) using whichever credential kind was supplied."""
    if kind == 'pat':
        amap = {}
        for r in mgmt_sql("select code, arm_code from armb_progress", tok):
            if r.get('code'):
                amap[r['code']] = r.get('arm_code')
        rows = mgmt_sql(
            "select reviewer_code, record_ref, jrs_read, rely, batch, created_at "
            "from ai_pilot_reads where batch like 'armB%' order by created_at asc", tok)
        return (rows if isinstance(rows, list) else [], amap)
    # service-role REST path
    amap = {}
    for r in rest("/rest/v1/armb_progress?select=code,arm_code", tok):
        if r.get('code'):
            amap[r['code']] = r.get('arm_code')
    rows, frm, page = [], 0, 1000
    while True:
        chunk = rest("/rest/v1/ai_pilot_reads?select=reviewer_code,record_ref,jrs_read,"
                     "rely,batch,created_at&batch=like.armB*&order=created_at.asc",
                     tok, rng="%d-%d" % (frm, frm + page - 1))
        if not chunk:
            break
        rows.extend(chunk)
        if len(chunk) < page:
            break
        frm += page
    return (rows, amap)


def predict(det):
    d = (det or '').strip().lower()
    if d in GROUNDED_TOK: return 'GROUNDED'
    if d in UNGROUND_TOK: return 'UNGROUNDED'
    return None


def wilson(k, n, z=1.96):
    if n == 0: return (float('nan'), float('nan'))
    p = k / n; d = 1 + z*z/n
    c = (p + z*z/(2*n)) / d
    h = z * math.sqrt(p*(1-p)/n + z*z/(4*n*n)) / d
    return (c - h, c + h)


def mean(xs): return sum(xs)/len(xs) if xs else float('nan')


def main():
    kind, tok = get_cred()
    raw, amap = fetch_all(kind, tok)

    if not raw:
        die("Service role reached the DB but returned 0 Arm B rows. Nothing to "
            "score; not fabricating. Check that batch values start with 'armB'.")

    per = collections.defaultdict(lambda: {'cond': None, 'correct': 0, 'scored': 0, 'unscored': 0})
    unknown_records = set()
    for row in raw:
        code = row.get('reviewer_code') or ''
        cond = amap.get(code)
        if not cond:
            mb = ''.join(ch for ch in str(row.get('batch') or ''))
            cond = 'B1' if 'B1' in mb else ('B2' if 'B2' in mb else None)
        rec = str(row.get('record_ref') or '').strip().upper()
        det = row.get('rely') if cond == 'B2' else row.get('jrs_read')
        pred = predict(det)
        p = per[code]; p['cond'] = cond
        if rec not in KEY or pred is None:
            p['unscored'] += 1
            if rec not in KEY:
                unknown_records.add(rec)
            continue
        p['scored'] += 1
        if pred == KEY[rec]:
            p['correct'] += 1

    parts = []
    for code, p in per.items():
        acc = p['correct']/p['scored'] if p['scored'] else float('nan')
        parts.append({'code': code, 'cond': p['cond'], 'correct': p['correct'],
                      'scored': p['scored'], 'unscored': p['unscored'],
                      'accuracy': acc, 'included': p['scored'] >= NEEDED_MIN})
    parts.sort(key=lambda x: (str(x['cond']), x['code']))

    inc = [p for p in parts if p['included']]
    b1 = [p['accuracy'] for p in inc if p['cond'] == 'B1']
    b2 = [p['accuracy'] for p in inc if p['cond'] == 'B2']
    result = {'generated_from': 'ai_pilot_reads batch=armB via service role',
              'n_rows': len(raw), 'participants': parts,
              'included': {'B1': len(b1), 'B2': len(b2)},
              'unknown_record_refs': sorted(x for x in unknown_records if x)}

    if b1 and b2:
        m1, m2 = mean(b1), mean(b2)
        random.seed(SEED)
        boot = sorted(mean([random.choice(b1) for _ in b1]) -
                      mean([random.choice(b2) for _ in b2]) for _ in range(B))
        lo, hi = boot[int(0.025*B)], boot[int(0.975*B)]
        tot_c = sum(p['correct'] for p in inc); tot_s = sum(p['scored'] for p in inc)
        wlo, whi = wilson(tot_c, tot_s)
        result['floor3'] = {'B1_accuracy': m1, 'B2_accuracy': m2, 'difference': m1-m2,
                            'diff_95ci': [lo, hi], 'met': lo > 0,
                            'note': 'preliminary if either arm < 5 (design floor 5-8/arm)'}
        result['floor2'] = {'pooled_correct': tot_c, 'pooled_scored': tot_s,
                            'accuracy': tot_c/tot_s, 'wilson_95ci': [wlo, whi],
                            'above_chance': wlo > 0.50, 'meets_0.70': tot_c/tot_s >= 0.70}
    else:
        result['status'] = 'insufficient per-arm data to compare (need >=1 included per arm)'

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as f:
        json.dump(result, f, indent=2)

    # console summary
    print("Arm B rows fetched: %d | included B1=%d B2=%d" % (len(raw), len(b1), len(b2)))
    for p in parts:
        flag = '' if p['included'] else '  [EXCLUDED <18]'
        print("  %-8s %-3s %2d/%-2d acc=%.3f%s" % (p['code'], str(p['cond']),
              p['correct'], p['scored'], p['accuracy'], flag))
    if result.get('floor3'):
        f3 = result['floor3']
        print("B1=%.3f  B2=%.3f  diff=%+.3f  95%%CI[%+.3f,%+.3f]  Floor3 %s" % (
            f3['B1_accuracy'], f3['B2_accuracy'], f3['difference'],
            f3['diff_95ci'][0], f3['diff_95ci'][1], 'MET' if f3['met'] else 'NOT MET'))
        f2 = result['floor2']
        print("Floor2 pooled %d/%d=%.3f  95%%CI[%.3f,%.3f]  above-chance=%s" % (
            f2['pooled_correct'], f2['pooled_scored'], f2['accuracy'],
            f2['wilson_95ci'][0], f2['wilson_95ci'][1], f2['above_chance']))
    else:
        print("STATUS:", result.get('status'))
    if result['unknown_record_refs']:
        print("NOTE: unmapped record_ref values (add a map to score them):",
              result['unknown_record_refs'])
    print("Wrote", OUT)


if __name__ == '__main__':
    main()
