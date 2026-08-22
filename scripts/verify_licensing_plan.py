#!/usr/bin/env python3
"""Fail-closed assertion harness for the Commercial Licensing and Distribution Plan.

Every number and status claim in a buyer-facing licensing document must be traceable to
a primary source in this repository or to a live endpoint. This script asserts each one
and fails the run if the document drifts from the source.

It checks three classes of claim:
  A. DEPLOYMENT COUNTS      counted from `git ls-tree origin/main`, not from the working tree
  B. EMPIRICAL TELEMETRY    the completed cross-vendor series and its dispersion
  C. STATUS CLAIMS          publication, trademarks, revenue, institutional boundary

Usage:
    python3 scripts/verify_licensing_plan.py                       # check sources only
    python3 scripts/verify_licensing_plan.py --doc PATH.md         # also check a document
    python3 scripts/verify_licensing_plan.py --doc PATH.md --live  # also hit production

Exit codes:
    0  all assertions passed
    1  one or more assertions failed
    2  a required source file is missing
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

HOST = 'https://www.jrsstandard.com'

# ---------------------------------------------------------------------------
# A. DEPLOYMENT COUNTS. Counted from origin/main. The working tree contains the
#    private research/ corpus, which is NOT deployed, so a working-tree count
#    overstates every asset class and must never be quoted to a licensee.
# ---------------------------------------------------------------------------
DEPLOYED_EXPECTED = {
    'html':  71,
    'api':   45,
    'pdf':   10,
    'docx':   2,
}

# ---------------------------------------------------------------------------
# B. EMPIRICAL TELEMETRY. Source: research/MASTER_TRACKER.md, 2026-08-21 Family C,
#    computed from the live `study_runs` table.
# ---------------------------------------------------------------------------
POOLED_SERIES = {
    'runs': 61,
    'mean_pct': 84.9,
    'sd_points': 6.4,
    'min_pct': 66.7,
    'max_pct': 100.0,
    'closed': '2026-08-21',
    'source': 'research/MASTER_TRACKER.md 2026-08-21 Family C, from study_runs',
}

# The detection manuscript reports a DIFFERENT series on a restricted corpus. Both are
# true; they have different denominators. A licensing document that quotes one without
# naming the denominator will look inconsistent against the paper.
FIXED_CORPUS_SERIES = {
    'runs': 41,
    'mean_pct': 87.2,
    'sd_points': 3.2,
    'min_pct': 82.2,
    'max_pct': 93.3,
    'source': 'research/Detection_Article_Submission_FINAL5_2026-08-18.md:453',
}

# ---------------------------------------------------------------------------
# C. STATUS CLAIMS. Each carries the file that proves it.
# ---------------------------------------------------------------------------
STATUS = {
    'publication': {
        'venue': 'CEP Magazine (Society of Corporate Compliance and Ethics)',
        'title': 'When the Record Cannot Speak for Itself',
        'state': 'accepted, in copy-editing, November issue',
        'peer_reviewed': False,
        'source': 'research/MASTER_TRACKER.md:493, :582',
    },
    'trademarks': {
        'filed': False,
        'classes_drafted': ['042'],
        'source': 'research/IP_SALE_TRACKER.md:80; TRADEMARK_FILING_DOSSIER_JRS_DRR.md:49',
    },
    'methodology_contributor': {
        # Title verified against the roster. NOT "Director".
        'title': 'Associate Director, Model Validation',
        'capacity': 'personal professional capacity',
        'institutional_involvement': None,
        'source': 'api/_contributor-roster.js:75',
    },
}

# Strings that must NEVER appear in a buyer-facing document. Each is a claim that a
# licensee's own counsel or security team would falsify on first inspection.
BANNED = [
    ('peer-reviewed',        'Nothing has completed peer review. CEP is a practitioner venue.'),
    ('peer reviewed',        'Nothing has completed peer review. CEP is a practitioner venue.'),
    ('KPMG',                 'No institutional involvement exists. Naming the firm exposes the '
                             'contributor with his employer and invites objection.'),
    ('never stored',         'api/review-engine.js:176 writes a row per review. The true claim '
                             'is that no customer RECORD TEXT is stored.'),
    ('never logged',         'api/review-engine.js:176 writes a row per review.'),
    ('is published',         'No paper is published. CEP is accepted and forthcoming.'),
    ('real-time telemetry',  'The nightly run was suspended 2026-08-21. The series is closed.'),
    ('live telemetry',       'The nightly run was suspended 2026-08-21. The series is closed.'),
    ('—',               'Em-dash banned in prose per CLAUDE.md III.7.'),
]

# Tax and entity content cannot be verified from this workspace. Nothing in the
# repository records an LLC, a formation date, an IRC 195 election, or any household
# income figure. SURGICAL_REMEDIATION_PROMPT.md:68 forbids asserting an entity type
# that has not been formed.
REQUIRED_ENV_PARAMS = [
    ('JRS_ENTITY_FORMED',        'Has the Single-Member LLC actually been formed? '
                                 'No formation record exists in this repository.'),
    ('JRS_ENTITY_EFFECTIVE_DATE', 'Stated as 2027-01-01. Unverifiable here.'),
    ('JRS_ENTITY_STATE',         'State of formation. Unknown.'),
    ('JRS_STARTUP_COST_ACTUAL',  'Stated range $7,000 to $16,000. No invoice, quote or '
                                 'ledger exists in this repository.'),
    ('JRS_195_ELECTION',         'IRC Section 195 startup-cost election. Unverifiable here.'),
    ('JRS_HOUSEHOLD_INCOME',     'Pension distributions and salary. Not present in this '
                                 'repository and must not be inferred.'),
    ('JRS_TAX_ADVISER_REVIEW',   'Whether a licensed tax practitioner has reviewed the '
                                 'structure. No record here.'),
]

RESULTS = []


def check(name, ok, detail=''):
    RESULTS.append((bool(ok), name, detail))
    print('%-5s %s%s' % ('PASS' if ok else 'FAIL', name,
                         ('   ' + detail) if detail else ''))
    return bool(ok)


def deployed_counts(root):
    out = subprocess.check_output(
        ['git', '-C', root, 'ls-tree', '-r', '--name-only', 'origin/main'], text=True)
    files = out.splitlines()
    return {
        'html': sum(1 for f in files if re.search(r'\.html?$', f)),
        'api':  sum(1 for f in files if f.startswith('api/') and f.endswith('.js')),
        'pdf':  sum(1 for f in files if f.endswith('.pdf')),
        'docx': sum(1 for f in files if f.endswith('.docx')),
    }


def grep(root, rel, needle):
    path = os.path.join(root, rel)
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf-8', errors='replace') as fh:
        return needle in fh.read()


def get_json(url, timeout=20):
    req = urllib.request.Request(url, headers={'User-Agent': 'jrs-verify/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except (urllib.error.URLError, ValueError, OSError):
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--doc', default=None, help='licensing document to check')
    ap.add_argument('--live', action='store_true', help='also query production endpoints')
    args = ap.parse_args()

    root = subprocess.check_output(
        ['git', 'rev-parse', '--show-toplevel'], text=True).strip()

    print('--- A. DEPLOYMENT COUNTS (origin/main, not the working tree) ---')
    actual = deployed_counts(root)
    for key, expected in DEPLOYED_EXPECTED.items():
        check('deployed %s count == %d' % (key, expected),
              actual[key] == expected, 'actual=%d' % actual[key])

    print('\n--- B. EMPIRICAL TELEMETRY ---')
    check('pooled series recorded in MASTER_TRACKER',
          grep(root, 'research/MASTER_TRACKER.md', '61 cross-vendor runs'),
          POOLED_SERIES['source'])
    check('pooled mean 84.9 recorded',
          grep(root, 'research/MASTER_TRACKER.md', 'mean 0.849'))
    check('fixed-corpus series recorded in the detection manuscript',
          grep(root, 'research/Detection_Article_Submission_FINAL5_2026-08-18.md',
               '**41 nightly runs**'),
          FIXED_CORPUS_SERIES['source'])

    print('\n--- C. STATUS CLAIMS ---')
    check('trademarks recorded as NOT filed',
          grep(root, 'research/IP_SALE_TRACKER.md', 'marks not filed'),
          STATUS['trademarks']['source'])
    check('methodology contributor title is Associate Director',
          grep(root, 'api/_contributor-roster.js', "'Associate Director, Model Validation'"),
          'NOT "Director". ' + STATUS['methodology_contributor']['source'])
    check('CEP acceptance recorded',
          grep(root, 'research/MASTER_TRACKER.md', 'CEP Magazine (SCCE)'),
          STATUS['publication']['source'])

    if args.live:
        print('\n--- LIVE ---')
        st = get_json(HOST + '/api/run-study')
        check('nightly run reports studies_closed',
              bool(st) and st.get('skipped') == 'studies_closed',
              json.dumps(st) if st else 'no response')
        op = get_json(HOST + '/api/orgpilot-stats')
        check('org pilot organizations == 0 (no paying deployment)',
              bool(op) and op.get('organizations') == 0,
              json.dumps(op)[:120] if op else 'no response')

    if args.doc:
        print('\n--- D. DOCUMENT: %s ---' % args.doc)
        path = os.path.join(root, args.doc) if not os.path.isabs(args.doc) else args.doc
        if not os.path.exists(path):
            print('FATAL: document not found: %s' % path, file=sys.stderr)
            return 2
        with open(path, encoding='utf-8', errors='replace') as fh:
            body = fh.read()
        low = body.lower()
        for token, why in BANNED:
            check('banned string absent: %r' % token, token.lower() not in low, why)
        for figure in ('84.9', '61', '6.4', '66.7'):
            check('pooled figure %s present' % figure, figure in body)
        for key, why in REQUIRED_ENV_PARAMS:
            check('stub declared: %s' % key,
                  '[REQUIRED_ENV_PARAM: %s]' % key in body, why)
        # A working-tree count is only a defect when offered AS the deployed figure.
        # This document quotes both counts side by side to correct the directive, so the
        # assertion is that the deployed column is present and labelled, not that the
        # larger number never appears.
        check('deployed asset counts stated and labelled',
              'PDF documents | **10**' in body and 'Word documents | **2**' in body,
              'research/ is not deployed; working-tree counts overstate the asset')
        check('working-tree counts not offered as deployment figures',
              'deployment includes 56 PDF documents' not in body,
              'the directive figure, which must not be restated as fact')

    failed = [r for r in RESULTS if not r[0]]
    print('\n%d checks, %d failed' % (len(RESULTS), len(failed)))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
