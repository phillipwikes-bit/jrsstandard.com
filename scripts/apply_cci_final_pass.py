#!/usr/bin/env python3
"""The owner's final surgical pass on the CCI article: four text edits, an
Oxford-comma sweep for AP style, and the four hyperlinks CCI's guidance asks for.

EVERY LINK TARGET WAS FETCHED AND ITS CONTENT CHECKED, not merely pinged. A
EUR-Lex ELI URI returns HTTP 200 for a not-found page, so a status code alone
proves nothing. Each URL below was retrieved and its document title matched
against the instrument the article names:

    McDonnell Douglas    law.cornell.edu/supremecourt/text/411/792
                         title "McDONNELL DOUGLAS CORPORATION, Petitioner, v.
                         Percy GREEN. | Supreme Court | US Law | LII"
    GDPR                 eur-lex.europa.eu/eli/reg/2016/679/oj
                         title "Regulation - 2016/679 - EN - gdpr - EUR-Lex"
    EU AI Act            eur-lex.europa.eu/eli/reg/2024/1689/oj
                         title "Regulation - EU - 2024/1689 - EN - EUR-Lex"
    Reg (EU) 2026/1744   eur-lex.europa.eu/eli/reg/2026/1744/oj
                         title "Regulation - EU - 2026/1744 - EN - EUR-Lex"

Justia was rejected: it returns 403 to automated requests, so a reader following
the link from a PDF is fine but the link could not be verified from here.
Cornell's LII is authoritative and reachable.

ITEM 19 IS DELIBERATELY NOT APPLIED. The owner asks to retitle the European
section to "The European frame" but conditions it on Hekim's approval. Hekim has
approved nothing yet: the entire section, its length and its heading are what he
is currently being asked to sign off. Changing the heading now would pre-empt the
approval it is conditioned on.

    python3 scripts/apply_cci_final_pass.py            # dry run, default
    python3 scripts/apply_cci_final_pass.py --apply
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "Evidentiary_Deficit_CCI_RESUBMISSION_2026-08-28_V3.md")

EDITS = [
    (2, "the risk is not that the prose contains an error.",
        "the risk is not simply that the prose contains an error."),

    (9, "a drafting tool prompted with prior records may reproduce similar "
        "characterizations, while a reviewer",
        "a drafting tool may reproduce similar characterizations when prompted with "
        "prior records, while a reviewer"),

    # AP style: CCI's guidance rejects the Oxford comma.
    (11, "whether the same subjective standards are being applied across employees, "
         "and whether the organization can identify the evidence supporting them.",
         "whether the same subjective standards are being applied across employees "
         "and whether the organization can identify the evidence supporting them."),

    (24, "A defensible record lets someone who was not present follow the reasoning",
         "A defensible record lets someone who was not present reconstruct the reasoning"),
]

# Markdown link syntax, so the docx builder can emit real w:hyperlink elements.
# The visible text is the instrument name; the URL never appears in the article.
LINKS = [
    ("*McDonnell Douglas Corp. v. Green*",
     "[*McDonnell Douglas Corp. v. Green*](https://www.law.cornell.edu/supremecourt/text/411/792)"),
    ("Under the GDPR, the accountability principle",
     "Under the [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj), the accountability principle"),
    ("The EU AI Act now generally applies",
     "The [EU AI Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) now generally applies"),
    ("postponed by Regulation (EU) 2026/1744",
     "postponed by [Regulation (EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj)"),
]

# Must NOT be linked, on the owner's instruction: concepts, not sources.
NEVER_LINK = ["Decision Reconstruction Risk", "Justification Review Standard",
              "right to know why", "pretext", "burden-shifting", "cultural fit",
              "executive presence", "DORA", "ISO/IEC 42001"]


def oxford_commas(text):
    """Series commas before 'and' or 'or' in a list of three or more."""
    body = re.sub(r"^#.*$", "", text, flags=re.M)
    body = re.sub(r"\[[^\]]*\]\([^)]*\)", "LINK", body)
    return re.findall(r"\w+,\s+\w[\w\s]{0,30},\s+(?:and|or)\s+\w+", body)


def main():
    dry = "--apply" not in sys.argv
    body = io.open(SRC, encoding="utf-8").read()
    out = body

    for item, old, new in EDITS:
        n = out.count(old)
        if n != 1:
            raise SystemExit("item %s anchor appears %d times, expected 1: %r"
                             % (item, n, old[:70]))
        out = out.replace(old, new, 1)

    for old, new in LINKS:
        n = out.count(old)
        if n != 1:
            raise SystemExit("link anchor appears %d times, expected 1: %r" % (n, old[:60]))
        out = out.replace(old, new, 1)

    for term in NEVER_LINK:
        if re.search(r"\[[^\]]*" + re.escape(term) + r"[^\]]*\]\(", out):
            raise SystemExit("%r was linked; the owner's instruction is that "
                             "concepts are not hyperlinked" % term)

    if "[^" in out or re.search(r"^\s*\[\d+\]", out, re.M):
        raise SystemExit("a footnote marker appeared; CCI wants in-text links only")
    if re.search(r"^##\s*(References|Bibliography|Works cited)", out, re.M | re.I):
        raise SystemExit("a reference list appeared; CCI has not asked for one")

    ox = oxford_commas(out)
    print("%s" % ("DRY RUN, nothing written. Re-run with --apply." if dry else "APPLIED"))
    for item, _, _ in EDITS:
        print("  edit item %s" % item)
    print()
    print("  HYPERLINKS EMBEDDED, %d:" % len(LINKS))
    for _, new in LINKS:
        m = re.search(r"\[([^\]]+)\]\(([^)]+)\)", new)
        print("    %-38s -> %s" % (m.group(1)[:38], m.group(2)))
    print()
    print("  footnotes: none | reference list: none | concepts linked: 0")
    print("  Oxford commas remaining (AP style rejects them): %d" % len(ox))
    for o in ox:
        print("    %s" % o)
    print("  words: %d -> %d" % (len(body.split()), len(out.split())))
    print()
    print("  ITEM 19 NOT APPLIED: the European heading change is conditioned on")
    print("  Hekim's approval, and he has approved nothing yet.")
    if not dry:
        io.open(SRC, "w", encoding="utf-8").write(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
