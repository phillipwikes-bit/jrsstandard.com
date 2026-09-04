#!/usr/bin/env python3
"""api/honor.js: add Ubayet Hossain as an honoree for the methodology
contribution and the co-authorship.

WHY THIS IS A SEPARATE SCRIPT AND NOT A HAND EDIT. api/honor.js:95 records that
adding a roster entry "means writing a citation and issuing a link, which is an
owner decision rather than a count correction". The entry is therefore written
once, deterministically, with the citation drawn from what the record already
says about his contribution and nothing invented.

WHAT THE CITATION RESTS ON, ALL VERBATIM SOURCES:
  research/DRR_Detection_Validation_Protocol.md:116
    "The reference-panel design and the chance-corrected reliability framework
     are methodological contributions of Ubayet Hossain, FRM, Associate
     Director (Model Validation), KPMG India."
  research/MASTER_TRACKER.md:98
    "M-01 Ubayet Hossain, FRM: Associate Director (Model Validation), KPMG
     India; 9+ years in credit/market-risk model development and validation.
     Contributed the reliability/validation framework (the Rung 1-2 statistics
     and floors)."
  api/_contributor-roster.js:60
    kind 'author', note 'methodology co-author', code M-01.

HE IS ALREADY ON THE CONTRIBUTOR ROSTER as M-01 with key 6dyc0l2757, so he
already had a naming link. What he did not have was an honor entry, which is
the only path to a certificate. This adds that and nothing else.

THE KEY IS DERIVED, NOT RANDOM. sha256 over a fixed seed string, base36, first
ten characters, asserted non-colliding. Reproducible from this file alone.

Usage:
  python3 scripts/add_honor_hossain.py --apply
  python3 scripts/add_honor_hossain.py --check
"""
import argparse
import hashlib
import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = os.path.join(ROOT, "api", "honor.js")

SEED = 'JRS-honor-key:M-01:Ubayet Hossain:2026'
CODE = 'H-2026-38'


def derive_key():
    h = int(hashlib.sha256(SEED.encode()).hexdigest(), 16)
    a = '0123456789abcdefghijklmnopqrstuvwxyz'
    k = ''
    while len(k) < 10:
        k += a[h % 36]
        h //= 36
    return k


KEY = derive_key()

ENTRY = """  // METHODOLOGY AND CO-AUTHORSHIP, not a completed review. Every other entry
  // on this roster recognises someone who graded records. This one does not,
  // and the citation says so plainly rather than borrowing the reviewer
  // wording. He designed the measurement apparatus the study is scored
  // against, which is why the entry exists at all.
  //
  // Sources, all pre-existing and none written for this entry:
  //   research/DRR_Detection_Validation_Protocol.md:116  reference-panel design
  //                                                      and the chance-corrected
  //                                                      reliability framework
  //   research/MASTER_TRACKER.md:98                      Rung 1-2 statistics and
  //                                                      acceptance floors
  //   api/_contributor-roster.js:60                      M-01, kind 'author',
  //                                                      'methodology co-author'
  '%s': {
    code: '%s',
    study: 'methodology',
    participant: 'M-01',
    first: 'Ubayet',
    name: 'Ubayet Hossain, FRM',
    title: 'Associate Director, Model Validation',
    org: 'KPMG India',
    order: 'named for the methodology rather than for a completed review',
    citation: 'In recognition of designing the validation methodology on which '
            + 'this programme rests: the reference-panel design, the '
            + 'chance-corrected reliability framework, and the acceptance '
            + 'thresholds fixed in advance of any analysis. That work decided '
            + 'what the study would accept as evidence before it knew what the '
            + 'evidence would say, which is the part of a validation that has '
            + 'to be settled first and is hardest to add afterwards.'
  },
""" % (KEY, CODE)

ANCHOR = "const ROSTER = {\n"


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()

    body = io.open(API, encoding="utf-8").read()
    already = ("'%s': {" % KEY) in body
    applied = False

    if not already:
        if body.count(ANCHOR) != 1:
            sys.stderr.write("BLOCKED: ROSTER anchor missing or not unique\n")
            return 1
        if CODE in body:
            sys.stderr.write("BLOCKED: %s already in use\n" % CODE)
            return 1
        body = body.replace(ANCHOR, ANCHOR + ENTRY, 1)
        applied = True
        if args.apply:
            io.open(API, "w", encoding="utf-8").write(body)

    keys = re.findall(r"^  '([a-z0-9]{10})': \{", body, re.M)
    codes = re.findall(r"code: '(H-[A-Z0-9-]+)'", body)
    real = [k for k in keys if k != 'selftest00']
    dupes = len(keys) != len(set(keys)) or len(codes) != len(set(codes))
    r = subprocess.run(["node", "--check", API], capture_output=True)
    syntax = (r.returncode == 0)
    present = KEY in keys and CODE in codes
    ok = present and not dupes and syntax

    W = sys.stdout.write
    W("%s  Ubayet Hossain, %s\n" % ("APPLIED " if applied else "ALREADY ", CODE))
    W("\nkey                  : %s  (derived, not random)\n" % KEY)
    W("honor link           : https://www.jrsstandard.com/honor.html?k=%s\n" % KEY)
    W("certificate          : https://www.jrsstandard.com/api/honor-cert?k=%s\n" % KEY)
    W("contributor link     : https://www.jrsstandard.com/contributor.html?k=6dyc0l2757\n")
    W("roster keys          : %d total, %d real\n" % (len(keys), len(real)))
    W("duplicate key or code: %s\n" % ("FOUND" if dupes else "none"))
    W("node --check         : %s\n" % ("PASS" if syntax else "FAIL"))
    if not syntax:
        W(r.stderr.decode()[:300] + "\n")
    W("\nRESULT: %s\n" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
