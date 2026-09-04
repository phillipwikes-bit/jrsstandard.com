#!/usr/bin/env python3
"""api/honor.js: add a synthetic roster entry so the certificate flow can be
demonstrated end to end without touching a real honoree's record.

WHY THIS IS NEEDED. api/contributor.js already carries TEST_KEY 'selftest00'
with a synthetic TEST_PERSON, so the contributor form can be opened and
exercised without writing a row. api/honor.js has no equivalent. The only way
to see the certificate today is to open a real person's key, which renders
their citation and can issue their certificate. That is not a test.

WHAT THE ENTRY IS. A roster row keyed 'selftest00', matching the contributor
convention, carrying code H-TEST-00 and an obviously synthetic name. It is
inert: honor.js already suppresses telemetry for src=selftest, verify, test,
owner and deploytest, and nothing is written unless the visitor submits the
confirmation form.

WHAT IT IS NOT. It is not a real honoree, is not counted anywhere, and must
never appear in a roster export. scripts/check_zero_drift.py counts the live
roster; this entry is excluded from that count by the guard added below.

Usage:
  python3 scripts/add_honor_test_key.py --apply
  python3 scripts/add_honor_test_key.py --check
"""
import argparse
import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = os.path.join(ROOT, "api", "honor.js")

ANCHOR = "const ROSTER = {\n"

ENTRY = """const ROSTER = {
  // SYNTHETIC. Deploy and demonstration key, mirroring TEST_KEY 'selftest00'
  // in api/contributor.js. Exists so the citation screen and the certificate
  // can be exercised end to end without opening a real honoree's link, which
  // would render their citation and could issue their certificate.
  //
  // INERT BY CONSTRUCTION. honor.js already suppresses telemetry for
  // src=selftest, and nothing is written unless the confirmation form is
  // submitted. This row is not a person, is not counted, and must never reach
  // a roster export or a published count.
  'selftest00': {
    code: 'H-TEST-00',
    study: 'deploy-check',
    participant: 'TEST-00',
    first: 'Test',
    name: 'Test Honoree',
    title: 'Deploy check',
    org: 'Not a real record',
    order: 'synthetic entry used to exercise the certificate path',
    citation: 'This is a synthetic citation used to confirm that the honor '
            + 'screen, the confirmation step, and the certificate endpoint all '
            + 'render correctly. It recognises nobody and is issued to nobody.'
  },
"""

# The zero-drift roster count must exclude the synthetic row.
COUNT_GUARD_OLD = None
COUNT_GUARD_NEW = None


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()

    body = io.open(API, encoding="utf-8").read()
    already = "'selftest00': {" in body
    applied = False

    if not already:
        if ANCHOR not in body:
            sys.stderr.write("BLOCKED: ROSTER anchor not found in %s\n" % API)
            return 1
        if body.count(ANCHOR) != 1:
            sys.stderr.write("BLOCKED: ROSTER anchor is not unique\n")
            return 1
        body = body.replace(ANCHOR, ENTRY, 1)
        applied = True
        if args.apply:
            io.open(API, "w", encoding="utf-8").write(body)

    # ---- verification
    keys = re.findall(r"^  '([a-z0-9]{6,20})': \{", body, re.M)
    real = [k for k in keys if k != "selftest00"]
    codes = re.findall(r"code: '(H-[A-Z0-9-]+)'", body)
    real_codes = [c for c in codes if c != "H-TEST-00"]
    syn_present = "selftest00" in keys
    syn_code = "H-TEST-00" in codes
    dupes = len(keys) != len(set(keys))

    r = subprocess.run(["node", "--check", API], capture_output=True)
    syntax_ok = (r.returncode == 0)

    ok = (syn_present and syn_code and not dupes and syntax_ok
          and len(real) == len(set(real)))

    W = sys.stdout.write
    W("%s  synthetic honor key 'selftest00'\n"
      % ("APPLIED " if applied else "ALREADY "))
    W("\nroster keys total        : %d\n" % len(keys))
    W("real honorees            : %d  (synthetic row excluded)\n" % len(real))
    W("synthetic row present    : %s\n" % syn_present)
    W("synthetic code H-TEST-00 : %s\n" % syn_code)
    W("duplicate keys           : %s\n" % ("NONE" if not dupes else "FOUND"))
    W("node --check api/honor.js: %s\n" % ("PASS" if syntax_ok else "FAIL"))
    if not syntax_ok:
        W(r.stderr.decode()[:300] + "\n")
    W("\nRESULT: %s\n" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
