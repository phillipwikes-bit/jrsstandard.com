#!/usr/bin/env python3
"""Reviewer-evaluation certificate, as a PDF the owner can hand over.

WHY THIS IS NOT build_certificate.py's REVIEWERS LIST. That registry is the
24-record study completers, and its standard_body() says the holder "completed
the independent review of all 24 records". Adding an evaluation respondent to it
would print a record review that did not happen onto the canonical issued
template. This is a different credential and it gets its own builder.

WHY IT IS NOT A NEW TEMPLATE EITHER. It renders through make_certificate() from
build_certificate.py, which is the locked layout taken from the issued reference
PDF. Nothing about the design is re-decided here; only the body sentence and the
title differ, because the thing being certified differs.

THE BODY SENTENCE IS READ OUT OF api/reviewer-cert.js, NOT COPIED. The endpoint
renders the same certificate in the browser. If the two carried their own copies
of the sentence, one would eventually say something the other does not, and the
printed certificate and the self-served one would disagree about what the holder
did. The parse below is the single source of truth, and
scripts/check_zero_drift.py fails if it stops resolving.

VERIFICATION IS MANDATORY AND IS NOT SKIPPABLE. Before rendering, the person is
looked up on the live no-token roster endpoint and must hold:
  - a reviewer-cert row, which is the evaluation submission, and
  - a completion code matching the one supplied on the command line.
Anything else and it refuses. A certificate that can be produced for a name that
is not in the record is not a certificate.

Usage:
  python3 research/build_reviewer_eval_certificate.py "Aigul Moiseeva" JRS-R-DOGUUVV9
  python3 research/build_reviewer_eval_certificate.py --list
"""
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from build_certificate import make_certificate  # locked layout, do not re-implement

PEOPLE = "https://www.jrsstandard.com/api/people-9dd1ecdf6f8cdfd4"
CERT_ENDPOINT = os.path.join(ROOT, "api", "reviewer-cert.js")

TITLE = "Certificate of Participation"
CODE_RE = re.compile(r"^JRS-R-[A-Z0-9]{6,12}$")

MONTHS = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"]


def die(msg, code=2):
    sys.stderr.write(msg.rstrip() + "\n")
    sys.exit(code)


def endpoint_body():
    """The BODY string from api/reviewer-cert.js, concatenated as JS would.

    Parsed rather than copied so the printed certificate and the browser one
    cannot drift apart. A parse failure is fatal: guessing the sentence here is
    precisely the duplication this function exists to prevent.
    """
    try:
        src = io.open(CERT_ENDPOINT, encoding="utf-8").read()
    except OSError as e:
        die("cannot read %s: %r" % (CERT_ENDPOINT, e))
    m = re.search(r"^const BODY = (.*?);\s*$", src, re.M | re.S)
    if not m:
        die("BODY not found in api/reviewer-cert.js. The certificate wording is\n"
            "the one thing this script may not invent. Fix the parse or the\n"
            "endpoint before issuing anything.")
    parts = re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(1))
    if not parts:
        die("BODY in api/reviewer-cert.js parsed to no string literals.")
    body = "".join(p.replace("\\'", "'").replace("\\\\", "\\") for p in parts)
    if len(body) < 40:
        die("BODY parsed to %d characters, which is too short to be the real\n"
            "sentence. Refusing rather than printing a truncated certificate."
            % len(body))
    return body


def roster():
    try:
        with urllib.request.urlopen(PEOPLE, timeout=45) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        die("HTTP %s from the roster endpoint" % e.code)
    except Exception as e:
        die("roster endpoint unreachable: %r\n"
            "Refusing to issue: the holder cannot be verified offline." % (e,))


def long_date(iso):
    """'2026-08-16T05:42:24Z' -> 'August 16, 2026'. The submission date, not today."""
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", iso or "")
    if not m:
        return ""
    y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if not 1 <= mo <= 12:
        return ""
    return "%s %d, %d" % (MONTHS[mo - 1], d, y)


def find(people, name):
    n = name.strip().lower()
    return [p for p in people
            if n in (p.get("name") or "").lower()
            or n == (p.get("email") or "").strip().lower()]


def main():
    if len(sys.argv) < 2:
        sys.stderr.write(__doc__)
        return 2

    data = roster()
    people = data.get("people") or []

    if sys.argv[1] == "--list":
        seen = set()
        print("Evaluation respondents holding a completion code:")
        for p in people:
            if p.get("source") != "reviewer-cert":
                continue
            k = (p.get("name"), p.get("completion_code"))
            if k in seen:
                continue
            seen.add(k)
            print("  %-26s %-16s %s"
                  % (p.get("name") or "(no name)", p.get("completion_code") or "(none)",
                     p.get("country") or ""))
        if not seen:
            print("  (none)")
        return 0

    if len(sys.argv) < 3:
        die("Both a name and the completion code are required.\n"
            "  python3 research/build_reviewer_eval_certificate.py \"Full Name\" JRS-R-XXXXXXX")

    name_arg, code_arg = sys.argv[1], sys.argv[2].strip().upper()

    if not CODE_RE.match(code_arg):
        die("%r is not a completion code. It starts with JRS-R- followed by 6 to\n"
            "12 characters, and is shown on submitting the evaluation." % code_arg)

    rows = find(people, name_arg)
    if not rows:
        die("NOT FOUND: no contact row carries %r.\n"
            "Nothing is issued for a name that is not in the record." % name_arg, 1)

    cert_rows = [r for r in rows if r.get("source") == "reviewer-cert"]
    if not cert_rows:
        die("REFUSED: %r has rows in the record but none from source\n"
            "'reviewer-cert', which is the evaluation submission that produces a\n"
            "completion code. Sources held: %s"
            % (name_arg, ", ".join(sorted({r.get("source") or "?" for r in rows}))), 1)

    codes = {r.get("completion_code") for r in cert_rows if r.get("completion_code")}
    if code_arg not in codes:
        die("REFUSED: the code on record for %r is %s, not %s."
            % (name_arg, ", ".join(sorted(codes)) or "(none)", code_arg), 1)

    row = [r for r in cert_rows if r.get("completion_code") == code_arg][0]
    full_name = (row.get("name") or name_arg).strip()
    issued = long_date(row.get("date") or "")
    if not issued:
        die("REFUSED: the submission date on the row did not parse, and the\n"
            "certificate is not dated with today instead.")

    body = endpoint_body()

    # STATED HERE BECAUSE IT IS THE WHOLE POINT OF THIS FILE. This certificate
    # attests an evaluation submission. It does not attest a training
    # completion, a record review, or membership of the detection panel, and
    # the body sentence it prints is the one the live endpoint prints.
    records_run = row.get("records_run") or 0
    if records_run:
        die("REFUSED: this row carries records_run=%d. A person who reviewed\n"
            "records is a study participant and gets the study certificate from\n"
            "research/build_certificate.py, not this one." % records_run)

    safe = re.sub(r"[^A-Za-z0-9]+", "_", full_name).strip("_")
    out = os.path.join(HERE, "JRS_Reviewer_Evaluation_Certificate_%s.pdf" % safe)

    make_certificate(full_name, issued, body, out, title=TITLE)

    print("VERIFIED AGAINST THE LIVE RECORD")
    print("  name              %s" % full_name)
    print("  completion code   %s" % code_arg)
    print("  submitted         %s  (%s)" % (issued, row.get("date")))
    print("  organization      %s" % (row.get("organization") or "(none on file)"))
    print("  country           %s (%s)" % (row.get("country") or "",
                                           row.get("country_source") or ""))
    print("  records reviewed  %d" % records_run)
    print()
    print("  title             %s" % TITLE)
    print("  body              read from api/reviewer-cert.js, not copied")
    print("                    %s" % body)
    print()
    print("  wrote %s" % out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
