#!/usr/bin/env python3
"""Add the named-contributor credits to the detection manuscript's Acknowledgments.

WHO IS NAMED HERE, AND WHO IS NOT.

The manuscript acknowledges three groups: the detection panel of 16, the
reliability study of 25 raters, and the comparison study of 20 whose "work is
reported in its own paper". Only the first two belong in this paper's credits.

  V-AI-##   detection panel      -> named here
  E-##      reliability raters   -> named here
  RR-###    comparison study     -> NOT named here; that is the other paper's
                                    acknowledgment to make
  V-HR-01   employment pilot     -> NOT named here, different study entirely

The code prefix is the study identifier. That mapping was validated on
2026-08-28 against every roster row carrying a descriptive note: 24 agreed, 0
disagreed.

NOBODY IS NAMED WHO DID NOT ELECT IT. Four contributors across the whole
roster confirmed and chose anonymity; two of them are in the two groups this
paper credits, and the other two are in the comparison study. The paragraph
reports the per-group figure, not the roster-wide one, because a reader
counting the list against it would otherwise find it short by two. All four
are counted in every figure and appear nowhere by name. The election is read
from each person's own confirmation entry, never from the study roster.

THE LIST IS PARTIAL AND SAYS SO. 13 of the 16 panel members have confirmed and
11 elected naming; the sentence states that plainly rather than implying the
list is the panel.

    python3 scripts/apply_contributor_credits.py            # dry run, default
    python3 scripts/apply_contributor_credits.py --apply
"""
import io
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER = os.path.join(ROOT, "research", "Detection_Article_Submission_FINAL5_2026-08-18.md")
CREDITS = os.path.join(ROOT, "research", "Contributor_Credit_List_2026-08-29.md")
UA = {"User-Agent": "Mozilla/5.0 (JRS credits)"}

ANCHOR = ("Reviewers are recognised as named contributors with their consent; none "
          "is a co-author of this paper. Contributors may withdraw their name at any "
          "time; one has, and her judgments remain in the analysis unnamed at her "
          "election.")


WORDS = {0: "none", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
         6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
         11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen",
         15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen",
         19: "nineteen", 20: "twenty"}


def word(n):
    """The manuscript spells out counts of this size in prose, so the credits do
    too. A bare "13" beside "sixteen" in the same sentence is the tell that a
    number was pasted in rather than written."""
    return WORDS.get(n, str(n))


def sort_key(code):
    m = re.match(r"([A-Z-]+?)-?(\d+)$", code)
    return (m.group(1), int(m.group(2))) if m else (code, 0)


def credits():
    t = io.open(CREDITS, encoding="utf-8").read()
    rows = re.findall(r"^- \*\*([A-Z-]+\d+)\*\* — (.+)$", t, re.M)
    out = {}
    for code, val in rows:
        out[code] = val.strip()
    return out


def main():
    dry = "--apply" not in sys.argv
    body = io.open(PAPER, encoding="utf-8").read()
    cred = credits()

    with urllib.request.urlopen(
            urllib.request.Request("https://www.jrsstandard.com/api/contributor-stats",
                                   headers=UA), timeout=30) as r:
        stats = json.loads(r.read().decode())
    confirmed = set(stats["confirmed_codes"])

    panel = {c: v for c, v in cred.items() if c.startswith("V-AI-")}
    rely = {c: v for c, v in cred.items() if re.match(r"^E-\d+$", c)}
    panel_conf = len([c for c in confirmed if c.startswith("V-AI-")])
    rely_conf = len([c for c in confirmed if re.match(r"^E-\d+$", c)])

    def render(d):
        """One person per line. Several contributors used semicolons inside their
        own descriptions, so a semicolon-joined run of them cannot be read: the
        boundary between two people is invisible. A list keeps every description
        exactly as entered and still shows where each one ends."""
        return "\n".join("- %s" % d[c] for c in sorted(d, key=sort_key))

    # Anonymity is counted per group, not across the whole roster. Four
    # contributors in all elected not to be named, but two of them sit in the
    # comparison study, whose credits belong to its own paper. Only the
    # unnamed confirmations inside these two groups may be reported here.
    unnamed = (panel_conf - len(panel)) + (rely_conf - len(rely))
    if unnamed < 0:
        raise SystemExit("more named than confirmed; the join is wrong")
    count_word = word(unnamed).capitalize()

    tail = ("%s further contributor%s in these two groups confirmed and elected "
            "not to be named. Their judgments are counted in every figure "
            "reported here and they appear nowhere by name. Confirmations remain "
            "open, so this is a record of the elections received to date rather "
            "than of who took part."
            % (count_word, "" if unnamed == 1 else "s"))

    block = (ANCHOR + "\n\n"
             "**Named contributors, as at 29 August 2026.** Recognition is by each "
             "contributor's own election, recorded through the confirmation "
             "mechanism described in the data availability statement, and each "
             "name and description below stands as that person entered it. Of the "
             "sixteen detection panel members, %s have confirmed and %s elected "
             "to be named:\n\n%s\n\nOf the reliability raters, %s have confirmed "
             "and %s elected to be named:\n\n%s\n\n%s"
             % (word(panel_conf), word(len(panel)), render(panel),
                word(rely_conf), word(len(rely)), render(rely), tail))

    n = body.count(ANCHOR)
    if n != 1:
        raise SystemExit("anchor appears %d times, expected 1" % n)
    out = body.replace(ANCHOR, block, 1)

    # No contributor who elected anonymity may appear, and no comparison-study
    # or employment-study contributor may be credited in this paper.
    anon_names = ["Kyle McMullan", "Marguerite Maroudis", "Tuneer Mondal",
                  "Alexandria Davis"]
    problems = [nm for nm in anon_names if nm in out]
    for code in cred:
        if code.startswith("RR-") or code.startswith("V-HR-"):
            nm = cred[code].split(",")[0].split(" — ")[0].strip()
            if nm and nm in block:
                problems.append("%s (%s) credited in the wrong paper" % (nm, code))
    if problems:
        raise SystemExit("this pass would publish someone it must not: %s"
                         % "; ".join(problems))

    print("%s" % ("DRY RUN, nothing written. Re-run with --apply." if dry else "APPLIED"))
    print("  detection panel   %d confirmed, %d named" % (panel_conf, len(panel)))
    print("  reliability       %d confirmed, %d named" % (rely_conf, len(rely)))
    print("  unnamed here      %d, counted in every figure" % unnamed)
    print("  comparison study  %d named in the credit list, NOT credited here"
          % len([c for c in cred if c.startswith("RR-")]))
    print("  employment pilot  %d named in the credit list, NOT credited here"
          % len([c for c in cred if c.startswith("V-HR-")]))
    print("  words %d -> %d" % (len(body.split()), len(out.split())))
    if not dry:
        io.open(PAPER, "w", encoding="utf-8").write(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
