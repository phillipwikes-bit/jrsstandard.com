#!/usr/bin/env python3
"""Codes the 24 case-level basis notes with a fixed text pattern (SLGR submission, 2026-10-07).

The rule: does the note explicitly state that the underlying basis could not be rebuilt from the
source? Applied mechanically: a note is coded Yes when a single sentence pairs a negation with a
rebuilding verb. No judgment, no model, no network. Anyone can re-run it on the published notes.

Usage: python3 scripts/code_basis_notes.py [--check]
Writes research/slgr_submission_2026-10-07/Basis_Note_Coding_Frame_RULE.csv and prints Table 1.
--check exits non-zero if the committed frame differs from a fresh run.
"""
import csv, re, sys, os
from math import comb

SRC = 'research/JCI_SUBMISSION_2026-08-28/02_DATA/JCI_JRS_Construct_Coding_Frame.csv'
OUT = 'research/slgr_submission_2026-10-07/Basis_Note_Coding_Frame_RULE.csv'
NEG = r"(cannot|can ?not|could not|unable to|not able to|but not)"
VERB = r"(reconstruct\w*|recreate\w*|re-create\w*|rebuil\w*|test\w*|verif\w*)"
PATTERN = re.compile(NEG + r"\b[^.;]{0,80}\b" + VERB, re.I)

def code(note):
    for s in re.split(r'(?<=[.;])\s+', note):
        m = PATTERN.search(s)
        if m: return 'Yes', m.group(0)
    return 'No', ''

def fisher(a, b, c, d):
    n, r1, k = a + b + c + d, a + b, a + c
    p = lambda x: comb(r1, x) * comb(n - r1, k - x) / comb(n, k)
    p0 = p(a)
    return sum(p(x) for x in range(max(0, k - (n - r1)), min(r1, k) + 1) if p(x) <= p0 * (1 + 1e-9))

rows = list(csv.DictReader(open(SRC)))
out = [['Case ID', 'Read', 'Basis note (verbatim)', 'Failure explicitly stated (rule)', 'Matched words', 'Earlier code (2026-08-08)', 'Coder']]
t = {'Needs work': [0, 0], 'Ready': [0, 0]}
for r in rows:
    c, m = code(r['Supporting Note'])
    t[r['JRS Read']][0 if c == 'Yes' else 1] += 1
    out.append([r['Case ID'], r['JRS Read'], r['Supporting Note'], c, m, r['Reconstructability Failure Explicitly Stated'], 'fixed text pattern, scripts/code_basis_notes.py'])
import io
buf = io.StringIO(); csv.writer(buf, lineterminator='\n').writerows(out)
if '--check' in sys.argv:
    ok = os.path.exists(OUT) and open(OUT).read() == buf.getvalue()
    print('frame current' if ok else 'frame STALE'); sys.exit(0 if ok else 1)
open(OUT, 'w').write(buf.getvalue())
(a, b), (c, d) = t['Needs work'], t['Ready']
print('Needs work: %d stated, %d not; Ready: %d stated, %d not; Fisher two-sided p = %.5f' % (a, b, c, d, fisher(a, b, c, d)))
