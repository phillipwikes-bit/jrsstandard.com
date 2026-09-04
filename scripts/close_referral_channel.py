#!/usr/bin/env python3
"""Close the federal-sector training referral channel across forward-looking plans.

OWNER DETERMINATION, 2026-08-23: "they are not at all interested, Broida was just blowing
me off." The three referrals (FELTG / Deborah J. Hopkins, Gilbert Training Group / Gary M.
Gilbert, LRP / Seth Supran) are removed as a recommended action, and Peter Broida is removed
from forward-looking go-to-market planning.

WHAT THIS DOES NOT DO. It does not delete the historical record. research/Broida_*.md,
research/Referral_Outreach_Emails.md, research/Referral_Followups_2026-08-13.md and the
MASTER_TRACKER entries stay exactly as written, because they record what actually happened
and a tracker that deletes its own history is worthless. The follow-up drafts are marked
WITHDRAWN in place so they cannot be sent by mistake.

The guard at the bottom asserts that no forward-looking planning document recommends
contacting any of the three organisations again.

Idempotent. Run with --check to test without writing.

Usage:
    python3 scripts/close_referral_channel.py --check
    python3 scripts/close_referral_channel.py
"""

import argparse
import os
import re
import subprocess
import sys

# Documents that recommend future action. These must carry no referral recommendation.
FORWARD_PLANS = [
    'research/Licensing_Plan_Addendum_Training_2026-08-22.md',
    'research/Institutional_Stress_Test_2026-08-23.md',
    'research/Licensing_Execution_Plan_2026-08-22.md',
]

# Documents that record history. These are never touched by the guard.
HISTORICAL = [
    'research/Broida_Founding_Access_Offer.md',
    'research/Broida_Reply_ThankYou.md',
    'research/Referral_Outreach_Emails.md',
    'research/Referral_Followups_2026-08-13.md',
    'research/MASTER_TRACKER.md',
    'research/IP_SALE_TRACKER.md',
    'research/IP_Sale_Playbook.md',
    'research/PROJECT_STATE.md',
    'research/LinkedIn_About_Review_2026-08-05.md',
    'research/LinkedIn_Profile_Blueprint_2026-08-05.md',
    'research/LinkedIn_Profile_Copy.md',
    'research/Buyer_Pages_Link_Audit_2026-08-13.md',
    'research/SITE_MASTER_INVENTORY_2026-08-22.md',
]

WITHDRAWN_BANNER = """> **WITHDRAWN 2026-08-23 ON THE OWNER'S DETERMINATION. DO NOT SEND.**
>
> "They are not at all interested, Broida was just blowing me off." The federal-sector
> training referral channel is closed. These drafts are retained as a record of what was
> written, not as a queued action. Nothing below is to be sent to FELTG, the Gilbert
> Training Group, LRP, or Peter Broida.

"""

# Terms that must not appear in a forward-looking planning document.
FORBIDDEN_IN_PLANS = [
    'FELTG',
    'Gilbert Training Group',
    'Seth Supran',
    'Deborah J. Hopkins',
    'Broida',
    'Referral_Followups',
    'Case Alert',
    'Dewey',
]

RESULTS = []


def check(name, ok, detail=''):
    RESULTS.append((bool(ok), name, detail))
    print('%-5s %s%s' % ('PASS' if ok else 'FAIL', name,
                         ('   ' + detail) if detail else ''))
    return bool(ok)


def mark_withdrawn(root, rel, dry):
    path = os.path.join(root, rel)
    if not os.path.exists(path):
        print('SKIP  %s not present' % rel)
        return True
    with open(path, encoding='utf-8') as fh:
        body = fh.read()
    if 'WITHDRAWN 2026-08-23' in body:
        print('PASS  %s already marked withdrawn' % rel)
        return True
    if dry:
        print('WOULD MARK WITHDRAWN  %s' % rel)
        return True
    lines = body.split('\n')
    insert_at = 1 if lines and lines[0].startswith('#') else 0
    new = '\n'.join(lines[:insert_at] + ['', WITHDRAWN_BANNER.rstrip()]
                    + lines[insert_at:])
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(new)
    print('MARKED WITHDRAWN  %s' % rel)
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='report without writing')
    args = ap.parse_args()

    root = subprocess.check_output(
        ['git', 'rev-parse', '--show-toplevel'], text=True).strip()

    print('--- MARK THE DRAFTS WITHDRAWN (retained, not deleted) ---')
    for rel in ('research/Referral_Followups_2026-08-13.md',
                'research/Referral_Outreach_Emails.md'):
        mark_withdrawn(root, rel, args.check)

    print('\n--- GUARD: no forward-looking plan may recommend this channel ---')
    for rel in FORWARD_PLANS:
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            check('plan present: %s' % rel, False, 'file not found')
            continue
        with open(path, encoding='utf-8') as fh:
            body = fh.read()
        # A closure notice is the opposite of a recommendation. The block that records
        # WHY the channel is closed necessarily names it, and flagging that would force
        # the record to be vaguer than the decision it documents. Excluded by marker.
        scanned = re.sub(r'## 3\. Closed: the federal-sector training referral channel.*?(?=\n## )',
                         '', body, flags=re.S)
        scanned = re.sub(r'\*\*Note on a removed item\.\*\*.*', '', scanned, flags=re.S)
        hits = [t for t in FORBIDDEN_IN_PLANS if t.lower() in scanned.lower()]
        check('no referral recommendation in %s' % os.path.basename(rel),
              not hits, ', '.join(hits) if hits else '%d terms checked'
              % len(FORBIDDEN_IN_PLANS))

    print('\n--- HISTORY IS PRESERVED ---')
    for rel in ('research/Broida_Reply_ThankYou.md',
                'research/Referral_Outreach_Emails.md'):
        check('historical record retained: %s' % os.path.basename(rel),
              os.path.exists(os.path.join(root, rel)))

    failed = [r for r in RESULTS if not r[0]]
    print('\n%d checks, %d failed' % (len(RESULTS), len(failed)))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
