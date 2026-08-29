#!/usr/bin/env python3
"""Add the named-contributor credits to the detection manuscript's Acknowledgments.

WHO IS NAMED HERE, AND WHO IS NOT.

The manuscript acknowledges three groups. All three are credited here, by the
author's direction of 2026-08-29:

  V-AI-##   detection panel (Arm A)    -> named here
  E-##      reliability raters         -> named here
  RR-###    comparison study (Arm B)   -> named here
  V-HR-01   employment pilot           -> NOT named here. It is a different
                                          study and is not one of the three
                                          groups this paper acknowledges.

The code prefix is the study identifier. That mapping was validated on
2026-08-28 against every roster row carrying a descriptive note: 24 agreed, 0
disagreed.

NO CONTRIBUTOR IS PLACED IN A STUDY. Phillip's direction of 2026-08-29:
remove the language about which part of the study each person took part in.
The credits are therefore one list, ordered alphabetically rather than by code,
because ordering by code would put every V-AI together, then every E, then
every RR, reassembling exactly the grouping the instruction removes.

That is also the strongest form of blind protection these credits can take.
With no group named and no code order, a reader cannot infer any participant's
study or arm from the list, and the internal nomenclature has nothing left to
attach to.

NOBODY IS NAMED WHO DID NOT ELECT IT. Four contributors confirmed and chose
anonymity. They are counted in every figure and appear nowhere by name. The
election is read from each person's own confirmation entry, never from the
study roster.

THE LIST IS PARTIAL AND SAYS SO. The closing sentence states that
confirmations remain open, so the list is a record of the elections received
to date rather than a roster of who took part.

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
SPELLINGS = os.path.join(ROOT, "research",
                         "Contributor_Spellings_2026-08-29.md")
UA = {"User-Agent": "Mozilla/5.0 (JRS credits)"}

# The anchor is the consent paragraph the credits attach to. It was rewritten
# on 2026-08-29: the previous version said a contributor had withdrawn "at her
# election", which was false. The 2026-08-16 credit removal was made on the
# owner's instruction and no contributor has withdrawn.
ANCHOR = ("Reviewers are recognised as named contributors with their consent; none "
          "is a co-author of this paper. Contributors may withdraw their name at any "
          "time, and no contributor has done so. Reviewers who have not recorded an "
          "election are counted in every figure and are not named.")


WORDS = {0: "none", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
         6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
         11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen",
         15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen",
         19: "nineteen", 20: "twenty", 21: "twenty-one",
         22: "twenty-two", 23: "twenty-three", 24: "twenty-four",
         25: "twenty-five", 26: "twenty-six", 27: "twenty-seven",
         28: "twenty-eight", 29: "twenty-nine", 30: "thirty",
         31: "thirty-one", 32: "thirty-two", 33: "thirty-three",
         34: "thirty-four", 35: "thirty-five", 36: "thirty-six",
         37: "thirty-seven", 38: "thirty-eight", 39: "thirty-nine",
         40: "forty"}


def word(n):
    """The manuscript spells out counts of this size in prose, so the credits do
    too. A bare "13" beside "sixteen" in the same sentence is the tell that a
    number was pasted in rather than written."""
    if n not in WORDS:
        raise SystemExit("[REQUIRED_ENV_PARAM] no spelled form for %d; extend "
                         "WORDS rather than printing a numeral into prose that "
                         "spells every other count out" % n)
    return WORDS[n]


def norm_name(text):
    """Match key for a person: the name before the first comma, lowercased,
    with punctuation and internal spacing removed.

    Phillip's spelling list changes how several names are printed, including
    "dr Gabriela Bar" to "Dr. Gabriela Bar". Matching on the raw string would
    fail on exactly the entries the list exists to correct, so the key ignores
    the characters that are being corrected.
    """
    head = text.split(",")[0]
    return "".join(c for c in head.lower() if c.isalnum())


def sort_key_name(text):
    """Alphabetical by name, insensitive to case and punctuation.

    Without this "Dr. Gabriela Bar" sorts after "Dr Sharon Licqurish", because
    a full stop is a higher codepoint than a space. A reader scanning for a
    name does not know where the author put the punctuation.
    """
    return "".join(c for c in text.lower() if c.isalnum() or c.isspace())


def spellings():
    """The supplied display strings, keyed by normalised name.

    Absent file is fail-closed, not a silent fallback to the self-entered
    strings: a run that quietly prints the old spellings would look identical
    to a successful one.
    """
    if not os.path.exists(SPELLINGS):
        raise SystemExit("[REQUIRED_ENV_PARAM] the contributor spelling "
                         "authority is missing at %s. Nothing is printed from "
                         "the self-entered strings once the authority exists, "
                         "so a missing file is an error rather than a "
                         "fallback." % os.path.relpath(SPELLINGS, ROOT))
    out = {}
    for line in io.open(SPELLINGS, encoding="utf-8").read().split("\n"):
        if not line.startswith("- "):
            continue
        entry = line[2:].strip()
        key = norm_name(entry)
        if key in out:
            raise SystemExit("the spelling authority lists %r twice" % entry)
        out[key] = entry
    return out


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
    comp = {c: v for c, v in cred.items() if c.startswith("RR-")}
    panel_conf = len([c for c in confirmed if c.startswith("V-AI-")])
    rely_conf = len([c for c in confirmed if re.match(r"^E-\d+$", c)])
    comp_conf = len([c for c in confirmed if c.startswith("RR-")])

    def render(d):
        """One person per line, alphabetical by the name as entered.

        Several contributors used semicolons inside their own descriptions, so
        a semicolon-joined run of them cannot be read: the boundary between two
        people is invisible. A list keeps every description exactly as entered
        and still shows where each one ends.

        Sorted by name, never by code, for the reason in the module docstring.
        """
        return "\n".join(
            "- %s" % v for v in sorted(d.values(), key=sort_key_name))

    # One population now, so the unnamed figure is the confirmed total across
    # the three credited groups less the named total. Still computed rather
    # than asserted, so a further election cannot leave the sentence stale
    # while the list grows.
    named = dict(panel)
    named.update(rely)
    named.update(comp)

    # Every printed string comes from the spelling authority, and the mapping
    # must be a bijection. An unmatched authority entry means a name Phillip
    # supplied belongs to nobody credited; an unmatched contributor means
    # someone would print with a spelling he did not approve. Neither is
    # recoverable by guessing, so both stop the run.
    spell = spellings()
    used, unmatched = set(), []
    for code in sorted(named, key=sort_key):
        key = norm_name(named[code])
        if key not in spell:
            unmatched.append("%s (%s) has no entry in the spelling authority"
                             % (named[code].split(",")[0].strip(), code))
            continue
        named[code] = spell[key]
        used.add(key)
    leftover = [spell[k] for k in spell if k not in used]
    if leftover:
        unmatched.append("%d spelling entr(y/ies) match no credited "
                         "contributor: %s"
                         % (len(leftover),
                            "; ".join(x.split(",")[0] for x in leftover)))
    if unmatched:
        raise SystemExit("the spelling authority and the credited set do not "
                         "correspond: %s" % "; ".join(unmatched))
    confirmed_total = panel_conf + rely_conf + comp_conf
    unnamed = confirmed_total - len(named)
    if unnamed < 0:
        raise SystemExit("more named than confirmed; the join is wrong")
    count_word = word(unnamed).capitalize()

    tail = ("%s further contributor%s confirmed and elected not to be named. "
            "Their judgments are counted in every figure reported here and "
            "they appear nowhere by name. Confirmations remain open, so this "
            "is a record of the elections received to date rather than of who "
            "took part."
            % (count_word, "" if unnamed == 1 else "s"))

    block = (ANCHOR + "\n\n"
             "**Named contributors, as at 29 August 2026.** Recognition is by "
             "each contributor's own election, recorded through the "
             "confirmation mechanism described in the data availability "
             "statement, and each name and description below stands as that "
             "person entered it. %s contributors to this programme have "
             "confirmed and %s elected to be named:\n\n%s\n\n%s"
             % (word(confirmed_total).capitalize(), word(len(named)),
                render(named), tail))

    # Re-entrant by construction. The credits sit between the consent anchor and
    # the methodology credit, so a re-run replaces that span rather than
    # inserting a second copy of it. Running this twice must be a no-op, not a
    # duplicated Acknowledgments.
    n = body.count(ANCHOR)
    if n != 1:
        raise SystemExit("anchor appears %d times, expected 1" % n)
    START = body.index(ANCHOR)
    CLOSER = "\n\nThe reliability and validation methodology"
    if CLOSER not in body[START:]:
        raise SystemExit("the methodology credit no longer follows the consent "
                         "anchor; the Acknowledgments has been restructured")
    END = body.index(CLOSER, START)
    out = body[:START] + block + body[END:]

    # No contributor who elected anonymity may appear, and no comparison-study
    # or employment-study contributor may be credited in this paper.
    anon_names = ["Kyle McMullan", "Marguerite Maroudis", "Tuneer Mondal",
                  "Alexandria Davis"]
    problems = [nm for nm in anon_names if nm in out]
    for code in cred:
        if code.startswith("V-HR-"):
            nm = cred[code].split(",")[0].split(" — ")[0].strip()
            if nm and nm in block:
                problems.append("%s (%s) is in the employment pilot, which is "
                                "not one of this paper's three groups" % (nm, code))
    # The internal arm nomenclature must not reach the manuscript.
    for token in ("Arm A", "Arm B"):
        if token in block:
            problems.append("the generated credits disclose %r" % token)
    if problems:
        raise SystemExit("this pass would publish someone it must not: %s"
                         % "; ".join(problems))

    print("%s" % ("DRY RUN, nothing written. Re-run with --apply." if dry else "APPLIED"))
    print("  credited          %d named, one list, no study named"
          % len(named))
    print("  spellings         %d applied from the supplied authority"
          % len(used))
    print("  confirmed total   %d across the three credited groups"
          % confirmed_total)
    print("  unnamed           %d, counted in every figure" % unnamed)
    print("  employment pilot  %d named in the credit list, NOT credited here"
          % len([c for c in cred if c.startswith("V-HR-")]))
    print("  words %d -> %d" % (len(body.split()), len(out.split())))
    if not dry:
        io.open(PAPER, "w", encoding="utf-8").write(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
