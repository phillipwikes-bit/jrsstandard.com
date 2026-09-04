#!/usr/bin/env python3
"""Add Tanvi Pokhriyal to the honor roster as H-2026-39.

COMPLETION VERIFIED FIRST, as CLAUDE.md VIII requires:
  python3 research/check_completion.py V-HR-01  ->  COMPLETE, 22 cases, exit 0

Citation language supplied by the owner on 2026-08-21 and used as he wrote it,
adapted only to the certificate's grammar. api/honor-cert.js renders the body as

    'was named the recipient of the ' + HONOR_NAME + ' (' + HONOR_YEAR + '), '
    + order + ', ' + citation[0].lower() + citation[1:]

so the citation must open with a capital and read as a continuation of "was named
the recipient of ..., named for ..., in recognition of ...". That is why the
owner's sentences appear here recast into a single clause rather than verbatim:
the verbatim paragraph would produce "..., Tanvi led the employment arm ..." in
the middle of a sentence about herself in the third person.

Key derived deterministically from a fixed seed so the same input always yields
the same key and the result is reproducible from the record.

Usage:
  python3 scripts/add_honor_tanvi.py --check
  python3 scripts/add_honor_tanvi.py --apply
"""
import argparse
import hashlib
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HONOR = os.path.join(ROOT, "api", "honor.js")

SEED = 'JRS-honor-key:V-HR-01:Tanvi Pokhriyal:2026'
CODE = 'H-2026-39'


def derive_key():
    h = int(hashlib.sha256(SEED.encode()).hexdigest(), 16)
    a = '0123456789abcdefghijklmnopqrstuvwxyz'
    k = ''
    while len(k) < 10:
        k += a[h % 36]
        h //= 36
    return k


ENTRY = """  '%s': {
    code: '%s',
    study: 'employment',
    participant: 'V-HR-01',
    first: 'Tanvi',
    name: 'Tanvi Pokhriyal',
    title: 'Human Resources Manager',
    org: 'REIL Innovative Solutions',
    order: 'named for leading the employment arm of the validation programme',
    citation: 'In recognition of independently selecting and reviewing 22 '
            + 'adjudicated employment and labor matters across three '
            + 'jurisdictional systems, recording her assessment of each record '
            + 'before knowing the outcome of the case, and completing that work '
            + 'on her own time while maintaining a full-time human resources '
            + 'role.'
  },
"""


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    a = ap.parse_args()

    key = derive_key()
    s = io.open(HONOR, encoding="utf-8").read()

    print("derived key: %s" % key)
    if ("'%s'" % key) in s:
        print("KEY COLLISION or already applied; refusing to write.")
        return 1
    if CODE in s:
        print("%s already present; refusing to write." % CODE)
        return 1

    entry = ENTRY % (key, CODE)
    anchor = "  'q7m2vd9xk4': {"
    if s.count(anchor) != 1:
        print("anchor not unique; refusing to write.")
        return 1
    out = s.replace(anchor, entry + anchor, 1)

    # The composition comment is a published count and must move with the roster.
    old_c = ("// 37 entries: 1 public-records + 15 detection + 20 records-review "
             "+ 1 methodology.")
    new_c = ("// 38 entries: 1 public-records + 15 detection + 20 records-review "
             "+ 1 methodology + 1 employment.")
    if old_c not in out:
        print("composition comment not found in expected form; refusing to write.")
        return 1
    out = out.replace(old_c, new_c, 1)
    out = out.replace("// Codes run H-2026-01 to H-2026-38 with H-2026-06 retired,",
                      "// Codes run H-2026-01 to H-2026-39 with H-2026-06 retired,", 1)

    if a.check:
        print("would add %s as %s; composition 37 -> 38" % (key, CODE))
        return 0

    io.open(HONOR, "w", encoding="utf-8").write(out)
    print("wrote api/honor.js: %s added as %s" % (key, CODE))
    print("  honor page:  https://www.jrsstandard.com/honor.html?k=%s" % key)
    print("  certificate: https://www.jrsstandard.com/api/honor-cert?k=%s" % key)
    return 0


if __name__ == "__main__":
    sys.exit(main())
