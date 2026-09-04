#!/usr/bin/env python3
"""Stop internal working documents at the repository root from being served publicly.

FINDING (verified live 2026-08-22 against https://www.jrsstandard.com):
    /CLAUDE.md                                              200, 19854 bytes
    /JRS-Platform-Strategy.md                               200, 39736 bytes
    /RESEARCH-ENGINE-DEPLOY.md                              200,  2583 bytes
    /RUNG2-REFERENCE-PANEL-METHODOLOGY.md                   200,  5587 bytes
    /JRS_Operational_Evaluation_Study_Twenty_Record_Ledger.docx  200, 31626 bytes
    /JRS_Practitioner_Self_Review_Final.docx                200, 19627 bytes

/CLAUDE.md is the material one. The live copy contains the opaque slug of the private
owner page and the opaque name of the private roster endpoint. CLAUDE.md itself states
those surfaces carry no token and are secured by the slug alone, so publishing the slug
removes their only access control.

This script adds a fail-closed rewrite to vercel.json sending every root-level .md and
.docx to /404.html. It does NOT rotate the slugs; that is a separate decision because it
breaks any link already in circulation.

Idempotent. Run with --check to test without writing.

Usage:
    python3 scripts/block_internal_docs.py --check
    python3 scripts/block_internal_docs.py
"""

import argparse
import json
import os
import subprocess
import sys

BLOCK_RULES = [
    {"source": "/:file(.*\\.md)", "destination": "/404.html"},
    {"source": "/:file(.*\\.docx)", "destination": "/404.html"},
]

# Files that MUST keep answering 200 after the change. A rewrite that took these down
# would break the site, so the script refuses to write if it would match one of them.
MUST_STAY_LIVE = ('index.html', 'sitemap.xml', 'robots.txt', 'results.json',
                  'openapi-review-engine.json', 'JRS-Standard.pdf')


def load(path):
    with open(path, encoding='utf-8') as fh:
        return json.load(fh)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='report without writing')
    args = ap.parse_args()

    root = subprocess.check_output(
        ['git', 'rev-parse', '--show-toplevel'], text=True).strip()
    path = os.path.join(root, 'vercel.json')
    if not os.path.exists(path):
        print('FATAL: vercel.json not found at %s' % path, file=sys.stderr)
        return 2

    cfg = load(path)
    existing = cfg.get('rewrites', [])
    have = {r.get('source') for r in existing}
    missing = [r for r in BLOCK_RULES if r['source'] not in have]

    for keep in MUST_STAY_LIVE:
        if keep.endswith(('.md', '.docx')):
            print('FATAL: %s would be blocked by these rules' % keep, file=sys.stderr)
            return 3

    if not missing:
        print('PASS  block rules already present in vercel.json rewrites')
        return 0

    if args.check:
        print('WOULD ADD %d rewrite rule(s) to vercel.json:' % len(missing))
        for r in missing:
            print('  %s -> %s' % (r['source'], r['destination']))
        print('NOT WRITTEN (--check)')
        return 0

    cfg['rewrites'] = existing + missing
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(cfg, fh, indent=2)
        fh.write('\n')
    json.loads(open(path, encoding='utf-8').read())
    print('WROTE %d rewrite rule(s) to vercel.json' % len(missing))
    print('NOT DEPLOYED. This takes effect only on a push to main.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
