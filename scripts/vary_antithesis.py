#!/usr/bin/env python3
"""Break up the repeated "X is not Y. It is Z." construction in the CCI article.

WHY. The piece is clean on all 21 lexical tells and all four house rules, and
its burstiness sits in the human band at 0.52. What gives it away is rhythm: six
sentences use the same negation-then-correction move in 1,400 words, roughly one
every 230. That construction is the single most recognizable model tell, and an
editor at a compliance outlet who reads AI-drafted prose all day will feel it
before naming it.

THREE ARE VARIED, THREE ARE KEPT. This is not an instruction to purge the
construction, which is ordinary English and sometimes the right sentence.

  KEPT, because each earns its place:
    "the risk is not that the prose contains an error. It is that the record
     can become more polished than the evidence beneath it."
        The article's central claim; the antithesis IS the argument.
    "the practical question is not whether AI should write employment records.
     It is whether the organization has a control..."
        The conclusion's frame, and the owner protected the closing section.
    "It is not a legal doctrine and not a claim of any new entitlement."
        The right-to-know-why disclaimer, on the owner's protected list and
        legally load-bearing. Not touched.

MEANING IS PRESERVED IN EVERY CASE. Each replacement says exactly what the
original said; only the shape changes.

    python3 scripts/vary_antithesis.py            # dry run, default
    python3 scripts/vary_antithesis.py --apply
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "Evidentiary_Deficit_CCI_RESUBMISSION_2026-08-28_V3.md")

EDITS = [
    ("pretext section",
     "The problem is not necessarily that the decision was wrong. It is that the "
     "record may be unable to demonstrate why the decision was made.",
     "The decision may well have been the right one. The record may still be "
     "unable to demonstrate why it was made."),

    ("side-by-side control",
     "The control is not to ban particular phrases. It is to require subjective "
     "conclusions to be connected to identifiable evidence before the record "
     "becomes final, and to look across records rather than only at each one.",
     "Banning particular phrases achieves little. What helps is requiring "
     "subjective conclusions to be connected to identifiable evidence before the "
     "record becomes final, and reading across records rather than only at each "
     "one."),

    ("seven-point control summary",
     "The organizing principle is not \"retain everything.\" It is to preserve "
     "enough evidence to reconstruct and defend the record when its author is no "
     "longer available to explain it.",
     "The organizing principle is preservation rather than retention: enough "
     "evidence to reconstruct and defend the record when its author is no longer "
     "available to explain it."),
]

# Must survive untouched.
KEEP = [
    "the risk is not that the prose contains an error. It is that the record can "
    "become more polished than the evidence beneath it",
    "the practical question is not whether AI should write employment records. It "
    "is whether the organization has a control",
    "It is not a legal doctrine and not a claim of any new entitlement",
    "What it may not be able to do is show the reason was the one it actually applied",
    "remain distinct theories with different elements",
]


def antithesis_count(text):
    sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", text))
             if len(s.split()) > 3]
    n = 0
    for i, s in enumerate(sents):
        split = (re.search(r"\b(is|are|was|were)\s+not\b", s)
                 and i + 1 < len(sents) and re.match(r"^It is\b", sents[i + 1]))
        same = re.search(r"\bis not\b[^.]{3,90}\.\s*It is\b", s)
        if split or same:
            n += 1
    return n, len(sents)


def main():
    dry = "--apply" not in sys.argv
    body = io.open(SRC, encoding="utf-8").read()
    before, total = antithesis_count(body)
    out = body
    for label, old, new in EDITS:
        n = out.count(old)
        if n != 1:
            raise SystemExit("%s anchor appears %d times, expected 1: %r"
                             % (label, n, old[:70]))
        out = out.replace(old, new, 1)

    missing = [k for k in KEEP if k not in re.sub(r"\s+", " ", out)]
    if missing:
        raise SystemExit("this pass disturbed material that must be kept: %s"
                         % "; ".join(m[:50] for m in missing))

    after, total2 = antithesis_count(out)
    words = len(out.split())
    print("%s" % ("DRY RUN, nothing written. Re-run with --apply." if dry else "APPLIED"))
    for label, _, _ in EDITS:
        print("  varied: %s" % label)
    print()
    print("  antithesis 'not X. It is Y.'   %d -> %d" % (before, after))
    print("  per 1,000 words                %.1f -> %.1f"
          % (1000.0 * before / len(body.split()), 1000.0 * after / words))
    print("  words                          %d -> %d" % (len(body.split()), words))
    print("  kept intact                    %d of %d" % (len(KEEP), len(KEEP)))
    if not dry:
        io.open(SRC, "w", encoding="utf-8").write(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
