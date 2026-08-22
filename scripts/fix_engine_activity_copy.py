#!/usr/bin/env python3
"""Correct two false retention statements on the public engine-activity page.

FINDING (verified 2026-08-22):
    engine-activity.html:62  tells the public each call records "a short preview of the
                             submitted record"
    engine-activity.html:66  states "A stored row holds the structured result and a
                             200-character input preview, not the full record."

Neither is true. The `input_preview` column was removed from the write in
api/review-engine.js on 2026-08-14, and this page does not select it (line 79). The copy
was never updated with the code.

WHY IT MATTERS: the page contradicts the Data Isolation Guarantee published on
audit-request.html:129, calibration-request.html:129 and engagement.html:153, and it
contradicts the zero-retention claim in the licensing playbook. A security team doing
diligence reads the public page, not the source.

Idempotent. Run with --check to test without writing. Does NOT deploy.

Usage:
    python3 scripts/fix_engine_activity_copy.py --check
    python3 scripts/fix_engine_activity_copy.py
"""

import argparse
import os
import subprocess
import sys

TARGET = 'engine-activity.html'

REPLACEMENTS = [
    (
        'the determination, the five condition statuses, the structured finding, and a '
        'short preview of the submitted record.',
        'the determination, the five condition statuses, and the structured finding. '
        'The submitted record itself is not stored.',
    ),
    (
        'A stored row holds the structured result and a 200-character input preview, not '
        'the full record.',
        'A stored row holds the structured result only. No part of the submitted record '
        'is stored.',
    ),
]

# Strings that must be ABSENT after the fix. Each is a retention claim the code does not
# make. If any survives, the page still contradicts the Data Isolation Guarantee.
FORBIDDEN_AFTER = [
    'input preview',
    'preview of the submitted record',
    '200-character',
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='report without writing')
    args = ap.parse_args()

    root = subprocess.check_output(
        ['git', 'rev-parse', '--show-toplevel'], text=True).strip()
    path = os.path.join(root, TARGET)
    if not os.path.exists(path):
        print('FATAL: %s not found' % path, file=sys.stderr)
        return 2

    with open(path, encoding='utf-8') as fh:
        body = fh.read()

    original = body
    applied, already = [], []
    for old, new in REPLACEMENTS:
        if old in body:
            body = body.replace(old, new)
            applied.append(old[:60])
        elif new in body:
            already.append(new[:60])
        else:
            print('FATAL: neither the old nor the new text was found. The page has '
                  'changed since this script was written. Re-read %s before running.'
                  % TARGET, file=sys.stderr)
            print('  looked for: %r' % old[:80], file=sys.stderr)
            return 3

    if not applied:
        print('PASS  both statements already corrected (%d/%d)'
              % (len(already), len(REPLACEMENTS)))
        return 0

    failures = 0
    for token in FORBIDDEN_AFTER:
        if token.lower() in body.lower():
            print('FAIL  retention claim survives: %r' % token, file=sys.stderr)
            failures += 1
    if failures:
        return 1

    if args.check:
        print('WOULD APPLY %d replacement(s) to %s:' % (len(applied), TARGET))
        for a in applied:
            print('  %s...' % a)
        print('%d forbidden string(s) remain after the change: 0' % 0)
        print('NOT WRITTEN (--check)')
        return 0

    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(body)
    print('WROTE %d replacement(s) to %s (%d bytes -> %d bytes)'
          % (len(applied), TARGET, len(original), len(body)))
    print('NOT DEPLOYED. This is a live-site file; it reaches the public only on a '
          'selective deploy to main.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
