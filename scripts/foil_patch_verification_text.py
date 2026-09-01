#!/usr/bin/env python3
"""Apply the manuscript's figure changes to manuscript_verification.txt.

WHY THIS IS A PATCH AND NOT A REGENERATION. The obvious approach is to
regenerate this file from the DOCX so the two cannot drift. It does not work
here, and the reason is worth recording rather than rediscovering: the DOCX is
LOSSY relative to this file. The author block is two lines here,

    Stacyann Young
    Independent Researcher

and a single paragraph in the DOCX, "Stacyann Young Independent Researcher",
because the DOCX was itself built from a markdown source and flattened the
break. A round-trip extractor was written and self-tested against the packet
DOCX; it reproduced 248 of 258 lines and could not recover that break or the
list numbering. Regenerating would therefore rewrite the author block and the
research-question list, neither of which the production brief authorises
touching.

So this applies exactly the three changes that were applied to the DOCX, and
nothing else:

  1. the outcome cross-tab is removed, because the documented-outcome chart
     replaced it and the brief says not to restore it;
  2. three figure captions are inserted where the images sit;
  3. two in-text figure references are appended to the paragraphs that
     introduce Figures 2 and 3.

Every anchor is matched on its full line. A missing or duplicated anchor stops
the run rather than patching the wrong place.

    python3 scripts/foil_patch_verification_text.py --check PATH
    python3 scripts/foil_patch_verification_text.py --apply PATH
"""
import argparse
import io
import sys

TABLE = [
    "| Read | Sustained | Did not survive | Contested | Adverse audit | Total |",
    "|---|---|---|---|---|---|",
    "| Ready | 3 | 10 | 5 | 0 | 18 |",
    "| Needs work | 2 | 5 | 2 | 0 | 9 |",
    "| Gap | 0 | 0 | 0 | 5 | 5 |",
    "| Total | 5 | 15 | 7 | 5 | 32 |",
]

CAP1 = ("Figure 1. Overview of the 32-case study and documentation-read "
        "outcomes. The study examined 32 publicly available cases across four "
        "document classes using the three-level documentation read of Ready, "
        "Needs work, and Gap.")
CAP2 = ("Figure 2. Documentation read by documented outcome. The figure shows "
        "the distribution of the three documentation reads across the "
        "documented outcomes in the 32-case corpus.")
CAP3 = ("Figure 3. Documentation read distribution by source type. The figure "
        "shows the distribution of the three documentation reads across the "
        "four source classes in the study corpus.")

REF2 = (" Figure 2 shows the distribution of documentation reads across the "
        "documented outcomes.")
REF3 = (" Figure 3 shows the distribution of documentation reads across the "
        "four source classes.")

ANCHOR_CAP1 = ("The pilot contributes a working protocol for measuring "
               "documentation quality in a public-records programme, a "
               "completed and citable 32-case set, and preliminary evidence "
               "that the read responds to the reconstructability property it "
               "is designed to assess.")
ANCHOR_REF2 = ("Reads across the 32 cases: 18 Ready, 9 Needs work, 5 Gap. "
               "Documented outcomes: 15 determinations did not survive "
               "review, 7 contested without a recorded disposition, 5 "
               "sustained, 5 adverse audit findings.")
ANCHOR_REF3 = ("The same conclusion can be reached without relying on the "
               "reviewer's own words, using a structural feature of each "
               "source.")


def find_one(lines, text, label):
    hits = [i for i, l in enumerate(lines) if l == text]
    if len(hits) != 1:
        raise SystemExit("[REQUIRED_ENV_PARAM] %s matched %d lines, expected "
                         "exactly 1" % (label, len(hits)))
    return hits[0]


def patch(lines):
    notes = []

    # 1. Remove the cross-tab, matched as a contiguous block.
    start = None
    for i in range(len(lines) - len(TABLE) + 1):
        if lines[i:i + len(TABLE)] == TABLE:
            start = i
            break
    if start is None:
        raise SystemExit("[REQUIRED_ENV_PARAM] the outcome cross-tab was not "
                         "found as a contiguous block; nothing removed")
    end = start + len(TABLE)
    while end < len(lines) and lines[end] == "":
        end += 1
    del lines[start:end]
    notes.append("removed the outcome cross-tab, %d lines" % (end - start))

    # 2 and 3, highest line first so earlier indices stay valid.
    i3 = find_one(lines, ANCHOR_REF3, "Figure 3 reference anchor")
    lines[i3] = lines[i3] + REF3
    lines.insert(i3 + 2, CAP3)
    lines.insert(i3 + 3, "")
    notes.append("Figure 3 reference and caption at line %d" % (i3 + 1))

    i2 = find_one(lines, ANCHOR_REF2, "Figure 2 reference anchor")
    lines[i2] = lines[i2] + REF2
    lines.insert(i2 + 2, CAP2)
    lines.insert(i2 + 3, "")
    notes.append("Figure 2 reference and caption at line %d" % (i2 + 1))

    i1 = find_one(lines, ANCHOR_CAP1, "Figure 1 caption anchor")
    lines.insert(i1 + 2, CAP1)
    lines.insert(i1 + 3, "")
    notes.append("Figure 1 caption at line %d" % (i1 + 1))
    return lines, notes


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", metavar="PATH")
    ap.add_argument("--check", metavar="PATH")
    a = ap.parse_args()
    path = a.apply or a.check
    if not path:
        ap.error("pass --check or --apply with a path")
    src = io.open(path, encoding="utf-8").read()
    lines = src.split("\n")
    trailing_nl = src.endswith("\n")
    if trailing_nl:
        lines.pop()
    out, notes = patch(list(lines))
    for n in notes:
        print("  " + n)
    print("  lines %d -> %d" % (len(lines), len(out)))
    if not a.apply:
        print("\nCHECK ONLY, nothing written")
        return 0
    io.open(path, "w", encoding="utf-8").write(
        "\n".join(out) + ("\n" if trailing_nl else ""))
    print("\nwrote %s" % path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
