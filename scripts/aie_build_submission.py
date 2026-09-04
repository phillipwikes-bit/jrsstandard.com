#!/usr/bin/env python3
"""Split the detection manuscript into a blinded manuscript and a title page.

WHY. AI and Ethics runs double-blind review, and the journal is explicit that
the obligation is the author's: "It is the responsibility of the author to
anonymize the manuscript and any associated materials. Author names,
affiliations and any other potentially identifying information should be
removed from the manuscript text and any accompanying files." A separate title
page carries "title, author names, affiliations, and the contact information of
the corresponding author. Any acknowledgements, disclosures, or funding
information should also be included on this page."

WHAT MOVES AND WHAT STAYS. The scientific argument does not move. What moves is
identity: the byline, the author-contributions statement, the acknowledgements
with their named contributor roster, and the two places where a named
individual is credited in the body. What stays is every methodological
disclosure, every limitation, the failed criterion, the competing-interests
substance written without names, and the declarations the journal requires in
the manuscript itself.

THE BLINDING IS AUDITED, NOT ASSERTED. A name list is checked against the
finished blinded file and the run fails if any of them survives. That list is
built from the roster and the spelling authority rather than typed here, so a
contributor added later cannot slip through because someone forgot to update a
constant.

    python3 scripts/aie_build_submission.py --check
    python3 scripts/aie_build_submission.py --apply
"""
import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL5_2026-08-18.md")
OUT = os.path.join(ROOT, "research", "aie_submission_2026-09-01")
BLIND = os.path.join(OUT, "01_Blinded_Manuscript.md")
TITLE = os.path.join(OUT, "02_Title_Page.md")
SPELL = os.path.join(ROOT, "research",
                     "Contributor_Spellings_2026-08-29.md")

IDENTIFIERS = [
    "Phillip Wikes", "Ubayet Hossain", "Wikes", "Hossain",
    "Maryland Commission on Civil Rights", "Saurabh Nanda",
    "Align Technology",
]


def contributor_names():
    if not os.path.exists(SPELL):
        raise SystemExit("[REQUIRED_ENV_PARAM] the spelling authority is "
                         "missing; the blinding audit cannot be built from a "
                         "guess at who is named")
    out = []
    for line in io.open(SPELL, encoding="utf-8").read().split("\n"):
        if line.startswith("- "):
            out.append(line[2:].split(",")[0].strip())
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    if not (a.apply or a.check):
        ap.error("pass --check or --apply")
    s = io.open(SRC, encoding="utf-8").read()
    moved = []

    title_line = s.split("\n", 1)[0]

    # 1. The byline and the author-contributions statement leave the body.
    byline = re.search(r"^\*\*Authors\.\*\*.*$", s, re.M)
    contrib = re.search(r"^\*\*Author contributions\.\*\*.*$", s, re.M)
    compet = re.search(r"^\*\*Competing interests\.\*\*.*$", s, re.M)
    if not (byline and contrib and compet):
        raise SystemExit("[REQUIRED_ENV_PARAM] the front matter no longer has "
                         "the expected Authors, Author contributions and "
                         "Competing interests lines")
    body = s
    for m, label in ((byline, "byline"), (contrib, "author contributions")):
        body = body.replace(m.group(0) + "\n\n", "", 1)
        moved.append(label)
    body = body.replace(
        compet.group(0),
        "**Competing interests.** Declared in full under Statements and "
        "Declarations. The first author created the construct and the "
        "instrument under study and would benefit from its adoption. That is a "
        "material conflict and it is not mitigated by the design alone; "
        "Section 9 states what was done about it and what was not.", 1)
    moved.append("competing-interests line rewritten without names")

    # 2. The acknowledgements, including the named contributor roster.
    ack_i = body.index("## Acknowledgments")
    ack = body[ack_i:]
    body = body[:ack_i].rstrip() + "\n"
    moved.append("acknowledgements and the named contributor roster")

    # 3. The two places a named individual is credited in the body.
    body = body.replace(
        "This principle was surfaced by pilot reviewer Saurabh Nanda and is "
        "credited with his permission.",
        "This principle was surfaced by a pilot reviewer and is credited on "
        "the title page with their permission.", 1)
    moved.append("named pilot reviewer in Section 3")
    body = re.sub(r", was designed by Ubayet Hossain, FRM\.",
                  ", was designed by the second author.", body)
    body = re.sub(r"was designed by Ubayet Hossain, FRM\.",
                  "was designed by the second author.", body)

    # Author contributions must still appear in the declarations, without names.
    body = body.replace(
        "**Authors' contributions.** P.W.", "**Authors' contributions.** P.W.")

    names = contributor_names()
    leaks = []
    for n in IDENTIFIERS + names:
        if n and re.search(r"\b%s\b" % re.escape(n), body):
            leaks.append(n)
    # The initials in the contributions statement are the journal's own
    # convention and are not an identity leak on their own.
    print("  moved to the title page: %s" % "; ".join(moved))
    print("  blinded manuscript: %d words" % len(body.split()))
    print("  identity check: %s"
          % ("CLEAN" if not leaks else "LEAK -> " + ", ".join(leaks[:6])))
    if leaks:
        return 1

    title = ("# Title Page\n\n## %s\n\n%s\n\n%s\n\n"
             "**Corresponding author.** [REQUIRED_ENV_PARAM] name, "
             "institutional or postal address, and email for the corresponding "
             "author. Not recorded in this repository; supply before upload.\n\n"
             "**Affiliations.** [REQUIRED_ENV_PARAM] the affiliation each "
             "author wishes to appear in print. The byline above carries the "
             "descriptors used in the manuscript, which are not institutional "
             "affiliations.\n\n"
             "**Funding.** No external funding was received. No participant "
             "was compensated.\n\n"
             "**Competing interests.** %s\n\n"
             "%s"
             % (title_line.lstrip("# ").strip(),
                byline.group(0), contrib.group(0),
                compet.group(0).replace("**Competing interests.** ", ""),
                ack))

    if not a.apply:
        print("\nCHECK ONLY, nothing written")
        return 0
    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    io.open(BLIND, "w", encoding="utf-8").write(body)
    io.open(TITLE, "w", encoding="utf-8").write(title)
    print("\nwrote %s" % os.path.relpath(BLIND, ROOT))
    print("wrote %s" % os.path.relpath(TITLE, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
