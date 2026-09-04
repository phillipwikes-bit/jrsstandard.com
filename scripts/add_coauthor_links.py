#!/usr/bin/env python3
"""Generate the three co-author confirmation keys, deterministically.

Keys are derived from a fixed seed so the same three keys are produced on every run and can
be regenerated if the roster file is ever lost. Each is checked for collision against every
key already live in api/_contributor-roster.js and api/honor.js before it is emitted.

Usage:
    python3 scripts/add_coauthor_links.py          # print the three keys and links
    python3 scripts/add_coauthor_links.py --check  # verify no collision, print nothing else

Exit codes:
    0  keys generated, no collision
    1  collision against an existing key
    2  a required source file is missing
"""

import argparse
import hashlib
import os
import re
import subprocess
import sys

SEED = 'jrs-coauthor-confirmation-2026-08-24'
ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
KEY_LEN = 10

# code -> the person. Titles and organisations are the ones on file, shown back as editable
# defaults rather than asserted. Young's org is empty BY STANDING INSTRUCTION: she set an
# affiliation policy on 2026-08-09 removing her title and agency from every surface
# (research/Dossier_Stacyann_Young_2026-08-09.md section 8a).
PEOPLE = [
    {
        'code': 'M-01',
        'first': 'Ubayet',
        'name': 'Ubayet Hossain, FRM',
        'title': 'Associate Director, Model Validation',
        'org': 'KPMG India',
        'paper': 'the detection study',
        'role': 'co-author',
        'org_note': '',
    },
    {
        'code': 'V-HR-01',
        'first': 'Tanvi',
        'name': 'Tanvi Pokhriyal',
        'title': 'Organisational Psychologist (freelance)',
        'org': '',
        'paper': 'the employment records study',
        'role': 'first author',
        'org_note': '',
    },
    {
        'code': 'E-08',
        'first': 'Stacyann',
        'name': 'Stacyann Young',
        'title': 'Independent Researcher',
        'org': '',
        'paper': 'the public records study',
        'role': 'first author',
        # Her own policy, quoted back to her so the blank field reads as deliberate.
        'org_note': 'Left blank on purpose. You asked on 9 August that your title and '
                    'agency stay off every surface, and that still stands. Fill this in '
                    'only if you want it to change.',
    },
]


def derive(code):
    h = hashlib.sha256((SEED + '|' + code).encode('utf-8')).digest()
    n = int.from_bytes(h, 'big')
    out = []
    for _ in range(KEY_LEN):
        out.append(ALPHABET[n % len(ALPHABET)])
        n //= len(ALPHABET)
    return ''.join(out)


def existing_keys(root):
    keys = set()
    for rel in ('api/_contributor-roster.js', 'api/honor.js'):
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            print('FATAL: %s missing' % rel, file=sys.stderr)
            sys.exit(2)
        with open(path, encoding='utf-8') as fh:
            body = fh.read()
        keys |= set(re.findall(r"'([a-z0-9]{10})'\s*:", body))
    return keys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    root = subprocess.check_output(
        ['git', 'rev-parse', '--show-toplevel'], text=True).strip()
    taken = existing_keys(root)

    rows, bad = [], 0
    for p in PEOPLE:
        k = derive(p['code'])
        if k in taken:
            print('FAIL  collision for %s: %s' % (p['code'], k), file=sys.stderr)
            bad += 1
            continue
        if k in [r[0] for r in rows]:
            print('FAIL  internal collision: %s' % k, file=sys.stderr)
            bad += 1
            continue
        rows.append((k, p))

    if bad:
        return 1

    print('PASS  %d keys derived, 0 collisions against %d existing keys'
          % (len(rows), len(taken)))
    if args.check:
        return 0

    print()
    for k, p in rows:
        print('%-9s %-22s %s' % (p['code'], p['name'], k))
        print('          https://www.jrsstandard.com/coauthor.html?k=%s' % k)
    print()
    print('ROSTER literal for api/_coauthor-roster.js:')
    for k, p in rows:
        print("  '%s': { code:'%s', first:'%s', name:%s, title:%s, org:%s, paper:%s, role:%s, org_note:%s },"
              % (k, p['code'], p['first'],
                 repr(p['name']).replace('"', "'"),
                 repr(p['title']).replace('"', "'"),
                 repr(p['org']).replace('"', "'"),
                 repr(p['paper']).replace('"', "'"),
                 repr(p['role']).replace('"', "'"),
                 repr(p['org_note']).replace('"', "'")))
    return 0


if __name__ == '__main__':
    sys.exit(main())
