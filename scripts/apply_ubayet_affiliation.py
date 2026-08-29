#!/usr/bin/env python3
"""Apply Ubayet Hossain's affiliation change, on his instruction of 2026-08-28.

HIS WORDS: "I agree that removing the KPMG name is the right move. Listing me as
an 'Independent Financial Risk & Model Validation Professional' works much
better for this personal capacity contribution. Please go ahead with that update
for submission."

WHY THIS RUNS BEFORE THE HONOR LINK IS SENT. His honor record at
api/honor.js:124 still carries "Associate Director, Model Validation" and
"KPMG India", and honor.html pre-fills those into the form he would see. Sending
him the link first would show him, on a page inviting him to accept recognition,
the exact affiliation he has just asked to retire.

SCOPE IS EVERY SURFACE THAT NAMES HIM, not only the manuscript. Three roster
modules and the live submission draft. Historical logs are left alone: they
record what was true when written, and rewriting them would destroy the record
of the change itself.

    python3 scripts/apply_ubayet_affiliation.py            # dry run, default
    python3 scripts/apply_ubayet_affiliation.py --apply
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEW_TITLE = "Independent Financial Risk & Model Validation Professional"

# (path, old, new). Every one is asserted to appear exactly once.
EDITS = [
    ("api/honor.js",
     "    title: 'Associate Director, Model Validation',\n    org: 'KPMG India',",
     "    title: 'Independent Financial Risk & Model Validation Professional',\n"
     "    org: '',"),

    ("api/_coauthor-roster.js",
     "title:'Associate Director, Model Validation', org:'KPMG India'",
     "title:'Independent Financial Risk & Model Validation Professional', org:''"),

    ("research/Detection_Article_Submission_FINAL5_2026-08-18.md",
     "Ubayet Hossain, FRM (Associate Director, Model Validation, KPMG India)",
     "Ubayet Hossain, FRM (Independent Financial Risk & Model Validation "
     "Professional)"),
]

# The contributor roster's line is column-aligned, so it is rewritten by regex
# rather than by an exact string that padding would break.
CONTRIB = "api/_contributor-roster.js"

# Nothing anywhere in a LIVE surface may still name the employer for him.
FORBIDDEN_AFTER = ["api/honor.js", "api/_coauthor-roster.js", CONTRIB,
                   "research/Detection_Article_Submission_FINAL5_2026-08-18.md"]


def read(rel):
    return io.open(os.path.join(ROOT, rel), encoding="utf-8").read()


def write(rel, body):
    io.open(os.path.join(ROOT, rel), "w", encoding="utf-8").write(body)


def main():
    dry = "--apply" not in sys.argv
    staged = {}

    for rel, old, new in EDITS:
        body = staged.get(rel, read(rel))
        n = body.count(old)
        if n != 1:
            raise SystemExit("%s: anchor appears %d times, expected 1: %r"
                             % (rel, n, old[:60]))
        staged[rel] = body.replace(old, new, 1)

    body = staged.get(CONTRIB, read(CONTRIB))
    m = re.search(r"(code:'M-01'.*?title:')([^']*)(',\s*org:')([^']*)(')", body, re.S)
    if not m:
        raise SystemExit("%s: M-01 title/org pair not found" % CONTRIB)
    body = body[:m.start(2)] + NEW_TITLE + body[m.end(2):m.start(4)] + body[m.end(4):]
    staged[CONTRIB] = body

    # Assert the employer name is gone from every live surface, and that his
    # FRM designation and the methodology credit survive.
    problems = []
    for rel in FORBIDDEN_AFTER:
        after = staged.get(rel, read(rel))
        for m2 in re.finditer(r"KPMG", after):
            window = after[max(0, m2.start() - 260):m2.start() + 60]
            if "Ubayet" in window or "M-01" in window:
                problems.append("%s still ties KPMG to him" % rel)
        if "Ubayet Hossain, FRM" not in after and "Ubayet" in after:
            problems.append("%s lost the FRM designation" % rel)
    if problems:
        raise SystemExit("; ".join(sorted(set(problems))))

    print("%s" % ("DRY RUN, nothing written. Re-run with --apply." if dry else "APPLIED"))
    for rel in sorted(staged):
        before = read(rel)
        print("  %-52s %+d bytes" % (rel, len(staged[rel]) - len(before)))
    print()
    print("  new title: %s" % NEW_TITLE)
    print("  org field: cleared on every live surface")
    print("  FRM designation retained: yes")
    print("  historical logs: deliberately untouched, they record what was true")
    if not dry:
        for rel, body in staged.items():
            write(rel, body)
    return 0


if __name__ == "__main__":
    sys.exit(main())
