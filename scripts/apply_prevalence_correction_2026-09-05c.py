#!/usr/bin/env python3
"""Priority 1: the seven unsupported prevalence assertions on jrsstandard.html.

Each has a corrected counterpart already live on index.html, and each of those
forms is reused here so the two pages state the same thing. Only the offending
sentences move; surrounding copy on jrsstandard.html differs from index.html in
places and is deliberately left alone rather than overwritten with index's
paragraph.

No other content file is touched. No research figure, limitation or status
statement is in scope.
"""

import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = "jrsstandard.html"

# (id, original, replacement) — one entry per audit finding P-1..P-7.
EDITS = [
    ("P-1",
     "Each reflects documentation patterns that appear routinely in organizational review.",
     "Each reflects documentation patterns observed in organizational review."),

    ("P-2",
     "These patterns are not unusual. They are the ordinary condition of most organizational records.",
     "These patterns are not hypothetical. They can arise across HR, investigations, compliance, and administrative records."),

    ("P-3",
     "The reconstruction failure example above is not unusual. It is the common condition when managers depart mid-process.",
     "The reconstruction failure example above is drawn from review practice. It is a condition that can arise when managers depart mid-process."),

    ("P-4",
     "They describe the reconstruction environment that most records eventually enter.",
     "They describe the review environment a record may eventually enter."),

    ("P-5",
     "They are the ordinary environment that most records eventually enter.",
     "They describe the review environment a record may eventually enter."),

    ("P-6",
     "The following conditions describe how organizational documentation commonly becomes harder to interpret over time.",
     "The following conditions describe how organizational documentation can become harder to interpret over time."),

    ("P-7",
     "The later-review conditions that most commonly surface documentation failures include:",
     "The later-review conditions observed to surface documentation failures include:"),
]

# Must be gone after the run.
BANNED_AFTER = [
    "appear routinely",
    "not unusual",
    "most records eventually enter",
    "commonly becomes harder to interpret",
    "most commonly surface documentation failures",
]

# Must survive: architecture, research and status language on the same page.
MUST_SURVIVE = [
    # methodology / engine positioning
    "Justification Review Standard",
    "creates a consulting or implementation engagement",
    "work from the published materials",
    # boundaries and denials
    "Not a certification or accreditation system.",
    # duplicate-sync strings already applied
    "Begin internal use",
    "Records as they arrive for review",
    "Conditions that can be present at intake",
    # conditional forms already present
    "can produce records that become difficult",
    "Records are often reviewed long after the people who created them are unavailable",
]

# Wording this pass must never introduce.
BANNED_NEW = [
    "scoping call", "implementation support available", "Discussions are limited to",
    "certified reviewer", "managed deployment", "founder-led",
    "most organizations", "widespread", "in every organization",
    "always", "guarantees",
]


def fail(msg):
    print("REFUSED: " + msg)
    sys.exit(1)


def main():
    p = ROOT / TARGET
    if not p.exists():
        fail("missing file: " + TARGET)
    before = p.read_text(encoding="utf-8")
    text = before
    applied = []

    for tag, old, new in EDITS:
        n = text.count(old)
        if n != 1:
            fail("%s: expected exactly 1 occurrence of %r, found %d" % (tag, old[:70], n))
        text = text.replace(old, new, 1)
        applied.append((tag, old, new))

    # ══ GATES ══════════════════════════════════════════════════════════
    for b in BANNED_AFTER:
        if b in text:
            fail("banned prevalence phrase survives: %r" % b)

    for needle in MUST_SURVIVE:
        if needle not in text:
            fail("required content lost: %r" % needle)

    low_before, low_after = before.lower(), text.lower()
    for b in BANNED_NEW:
        if low_after.count(b) > low_before.count(b):
            fail("introduced banned wording: %r" % b)

    # No numeric figure may move: research and study figures live on this page.
    nb = sorted(re.findall(r"\d+(?:\.\d+)?%?", before))
    na = sorted(re.findall(r"\d+(?:\.\d+)?%?", text))
    if nb != na:
        fail("a numeric value changed on the page")

    # Structural integrity.
    for open_t, close_t in (("<div", "</div>"), ("<p ", "</p>"), ("<h2", "</h2>")):
        if before.count(open_t) != text.count(open_t) or before.count(close_t) != text.count(close_t):
            fail("tag balance changed for %s" % open_t)

    # The change must be small: seven sentences, not a rewrite.
    delta = abs(len(text.encode()) - len(before.encode()))
    if delta > 400:
        fail("change of %d bytes is larger than seven sentences" % delta)

    if text == before:
        fail("no change applied")
    p.write_text(text, encoding="utf-8")

    print("APPLIED\n")
    for tag, old, new in applied:
        print("  %s" % tag)
        print("    -  %s" % old)
        print("    +  %s" % new)
    print("\n  %s  %d -> %d bytes (delta %d)"
          % (TARGET, len(before.encode()), len(text.encode()), delta))


if __name__ == "__main__":
    main()
