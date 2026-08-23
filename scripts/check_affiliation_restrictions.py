#!/usr/bin/env python3
"""Assert that contributor affiliation restrictions are honoured on every deployable surface.

STANDING OBLIGATION. research/Dossier_Stacyann_Young_2026-08-09.md section 8a records the
policy Stacyann Young set on 2026-08-09: her title and agency removed from the certificate,
from any public-facing recognition, from the manuscript author line, and from both Council
notes. That section closes: "Nothing in the programme should reintroduce her employer. The
study record still holds it."

She is a public employee who contributed voluntarily, on public materials, in a personal
capacity. Reintroducing her agency on any surface is a concrete harm to a named individual,
and the obligation survives any commercial licence. A restriction that depends on somebody
remembering it is not a control, so it is asserted here instead.

Checked surfaces: every deployable HTML page, every api/*.js, and the research deliverables
that are circulated as documents. The study record itself is deliberately NOT checked: it
legitimately holds her employer, which is precisely why the restriction exists.

Usage:
    python3 scripts/check_affiliation_restrictions.py
    python3 scripts/check_affiliation_restrictions.py --verbose

Exit codes:
    0  every restriction honoured
    1  a restricted term appears on a surface it must not
    2  a required source file is missing
"""

import argparse
import os
import re
import subprocess
import sys

# person -> (restricted terms, the file recording the restriction)
RESTRICTIONS = {
    'Stacyann Young': {
        'terms': [
            'Housing Preservation',
            'Deputy Records Access',
            'HPD',
            'Taxi and Limousine',
            'Environmental Protection',
        ],
        'source': 'research/Dossier_Stacyann_Young_2026-08-09.md section 8a',
        'set_on': '2026-08-09',
        'permitted_form': 'Stacyann Young, Independent Researcher',
    },
}

# Files that legitimately hold the restricted terms: the study record, the dossier that
# documents the restriction, the correspondence that agreed it, and the tracker history.
# Scrubbing these would destroy the evidence that the restriction was honoured.
EXEMPT_SUBSTRINGS = (
    'research/Dossier_Stacyann_Young',
    'research/Message_Stacy',
    'research/Message_Stacyann',
    'research/MASTER_TRACKER',
    'research/IP_SALE_TRACKER',
    'research/PARTICIPANT_INVENTORY',
    'research/REVIEWER_ROSTER',
    'research/Expert_Roster',
    'research/Evaluator_Outreach',
    'research/Contributor_Claims_Exposure',
    'scripts/check_affiliation_restrictions.py',
)

RESULTS = []


def check(name, ok, detail=''):
    RESULTS.append((bool(ok), name, detail))
    print('%-5s %s%s' % ('PASS' if ok else 'FAIL', name,
                         ('   ' + detail) if detail else ''))
    return bool(ok)


def exempt(path):
    return any(sub in path for sub in EXEMPT_SUBSTRINGS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--verbose', action='store_true', help='list every scanned file')
    args = ap.parse_args()

    root = subprocess.check_output(
        ['git', 'rev-parse', '--show-toplevel'], text=True).strip()
    tracked = subprocess.check_output(
        ['git', '-C', root, 'ls-files'], text=True).split('\n')
    tracked = [t for t in tracked if t]

    for person, rule in RESTRICTIONS.items():
        src = os.path.join(root, rule['source'].split(' section')[0])
        if not os.path.exists(src):
            print('FATAL: restriction source missing: %s' % rule['source'],
                  file=sys.stderr)
            return 2

        # 1. Deployable surfaces: every HTML page and every endpoint.
        surfaces = [t for t in tracked
                    if (re.search(r'\.html?$', t) or
                        (t.startswith('api/') and t.endswith('.js')))
                    and not t.startswith('research/')]

        # 2. Circulated research deliverables, excluding the record of the restriction.
        deliverables = [t for t in tracked
                        if t.startswith('research/') and t.endswith('.md')
                        and not exempt(t)]

        for label, group in (('deployable surface', surfaces),
                             ('research deliverable', deliverables)):
            hits = []
            for rel in group:
                path = os.path.join(root, rel)
                try:
                    with open(path, encoding='utf-8', errors='replace') as fh:
                        body = fh.read()
                except OSError:
                    continue
                for term in rule['terms']:
                    if term in body:
                        hits.append('%s:%s' % (rel, term))
            check('%s: no restricted term on any %s (%d scanned)'
                  % (person, label, len(group)),
                  not hits,
                  '; '.join(hits[:4]) if hits
                  else '%d terms checked' % len(rule['terms']))

        # 3. The permitted form must still be the one in use where she is named.
        named_in = [t for t in tracked
                    if t.startswith('research/') and t.endswith('.md')
                    and not exempt(t)
                    and 'Stacyann Young' in open(os.path.join(root, t),
                                                 encoding='utf-8',
                                                 errors='replace').read()]
        if args.verbose:
            for t in named_in:
                print('      names her: %s' % t)
        check('%s: named in %d deliverable(s), restriction source on file'
              % (person, len(named_in)),
              os.path.exists(src),
              '%s, set %s' % (rule['source'], rule['set_on']))

    failed = [r for r in RESULTS if not r[0]]
    print('\n%d checks, %d failed' % (len(RESULTS), len(failed)))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
