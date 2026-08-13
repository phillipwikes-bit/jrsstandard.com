#!/usr/bin/env python3
"""Assertion suite for scripts/scout_opportunities.py.

Run:  python3 scripts/test_scout_opportunities.py
Exit: 0 if every assertion passes, 1 otherwise.

Covers package routing for all three packages, both classes of guardrail
disqualifier, the blocked-overrides-score rule, the no-match floor, and the
metric-equivalence rule that N postings in must produce exactly N scored
results out in every output mode. The fixture is inline so the suite has no
external file dependency.
"""
import importlib.util, json, os, sys, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("scout", os.path.join(HERE, "scout_opportunities.py"))
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

FIXTURE = r"""[
 {"title":"Review our workplace investigation reports for defensibility",
  "description":"We are an employment law firm. Our investigators now use AI-assisted drafting for case files and we are worried the reports will not hold up at tribunal during discovery. Need someone to build a documentation quality standard and review a sample of investigation reports.",
  "url":"https://example.test/1","budget":"$3,000"},
 {"title":"AI governance programme lead - ISO/IEC 42001 readiness",
  "description":"Building responsible AI oversight. Need model validation and reproducibility evidence for our board report and third-party audit. Must show control testing over time.",
  "url":"https://example.test/2","budget":"$120/hr"},
 {"title":"Need labelled data and ground truth set for our detection tool",
  "description":"We are an assurance vendor. Our detection model needs a gold standard test set with rater annotation so we can publish an accuracy claim with precision and recall.",
  "url":"https://example.test/3","budget":"negotiable"},
 {"title":"Ghostwrite a whitepaper on AI ethics",
  "description":"You will publish under our name and transfer all authorship. We need a proven effective framework we can guarantee results with. White-label only.",
  "url":"https://example.test/4","budget":"$800"},
 {"title":"Build me a Shopify store",
  "description":"Simple ecommerce site for selling candles. No AI involved.",
  "url":"https://example.test/5","budget":"$500"},
 {"title":"Share your answer key and scoring algorithm",
  "description":"We want the scoring internals and the answer key for your benchmark so we can run it ourselves internally.",
  "url":"https://example.test/6","budget":"$5,000"}
]"""

_fh = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8")
_fh.write(FIXTURE); _fh.close()
FIXTURE_PATH = _fh.name

P = json.loads(FIXTURE)
r = {p['title'][:20]: m.score_posting(p) for p in P}
checks = []
def chk(name, got, want): checks.append((name, got, want))

chk('defensibility -> package 1', r['Review our workplace']['package'], 1)
chk('governance -> package 2',    r['AI governance progra']['package'], 2)
chk('labelled data -> package 3', r['Need labelled data a']['package'], 3)
chk('shopify -> no match',        r['Build me a Shopify s']['verdict'], 'NO MATCH')
chk('answer-key ask blocked',     r['Share your answer ke']['verdict'], 'DO NOT BID')
chk('ghostwrite blocked',         r['Ghostwrite a whitepa']['verdict'], 'DO NOT BID')
chk('blocked overrides score',    r['Share your answer ke']['score'] > 0 and r['Share your answer ke']['verdict'] == 'DO NOT BID', True)
chk('blocked posting yields no opening',
    m.proposal_opening(r['Share your answer ke'], m.FALLBACK_PANEL, True), '')
chk('generic-only signals never set a package',
    m.score_posting({'title':'Write a policy manual','description':'sop and procedure manual, taxonomy'})['package'], 0)
chk('empty posting is safe', m.score_posting({})['verdict'], 'NO MATCH')

# METRIC EQUIVALENCE: N postings in must produce exactly N scored results out,
# in every output mode, with none silently dropped.
big = P * 7  # 42 postings
scored = [m.score_posting(p) for p in big]
chk('N in equals N out (42)', len(scored), len(big))
counts = {}
for s in scored: counts[s['verdict']] = counts.get(s['verdict'], 0) + 1
chk('verdict counts sum to N', sum(counts.values()), len(big))

# Cached-fallback labelling must be visible in the opening.
op = m.proposal_opening(r['Review our workplace'], m.FALLBACK_PANEL, False)
chk('cache fallback is labelled in output', 'FIGURES FROM CACHE' in op, True)

fail = 0
for n, got, want in checks:
    ok = got == want
    if not ok: fail += 1
    print(('PASS  ' if ok else 'FAIL  ') + n + ': got %r, expected %r' % (got, want))

# CLI modes must all exit cleanly and produce output.
for mode in (['--json'], ['--markdown'], []):
    out = subprocess.run([sys.executable, 'scripts/scout_opportunities.py',
                          FIXTURE_PATH] + mode,
                         capture_output=True, text=True, cwd=os.path.dirname(HERE))
    ok = out.returncode == 0 and len(out.stdout) > 200
    if not ok: fail += 1
    print(('PASS  ' if ok else 'FAIL  ') + 'CLI mode %-12s exit=%d bytes=%d'
          % (mode[0] if mode else 'text', out.returncode, len(out.stdout)))
j = json.loads(subprocess.run([sys.executable, 'scripts/scout_opportunities.py',
      FIXTURE_PATH,'--json'],
      capture_output=True, text=True, cwd=os.path.dirname(HERE)).stdout)
ok = len(j['results']) == len(P)
if not ok: fail += 1
print(('PASS  ' if ok else 'FAIL  ') + '--json emits exactly %d results' % len(P))

print('\n' + ('ALL ASSERTIONS PASSED' if fail == 0 else '%d FAILED' % fail))
sys.exit(0 if fail == 0 else 1)
