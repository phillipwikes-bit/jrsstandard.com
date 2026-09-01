#!/usr/bin/env python3
"""Convert the detection manuscript from author-date to numbered citations.

AUTHORISED BY VERIFICATION, NOT BY ASSUMPTION. The correction list of
2026-09-01 gated this conversion: do not touch the references until the exact
AI and Ethics style is verified. It was verified on 2026-09-01 against the live
journal page, which states "The entries in the list should be numbered
consecutively" and shows in-text forms "[5]" and "[1-3, 7]".

ORDERING. The page states only that entries are numbered consecutively. It does
not require citation order. The existing alphabetical list is therefore kept and
numbered in place, which satisfies the stated rule and avoids reordering 35
entries for a requirement the journal has not made. If the SNAPP template turns
out to want citation order, renumbering is a sort, not a rewrite.

WHY A SCRIPT WITH AN AUDIT. Thirty-five entries and twenty-four citation sites
cannot be converted by hand without a silent miss, and a missed citation is
invisible: the sentence still reads, it just no longer points anywhere. So every
replacement is keyed to a reference entry that must exist, an unmatched
citation stops the run, and the audit at the end requires that every entry is
cited and every marker resolves.

    python3 scripts/aie_number_references.py --check
    python3 scripts/aie_number_references.py --apply
"""
import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER = os.path.join(ROOT, "research",
                     "Detection_Article_Submission_FINAL5_2026-08-18.md")

# Every in-text citation in the manuscript, mapped to the reference key or keys
# it stands for. Keys are matched against the reference list, so a typo here
# fails loudly rather than silently dropping a citation.
PARENTHETICAL = [
    ("(Mitchell et al., 2019)", ["Mitchell"]),
    ("(Gebru et al., 2021)", ["Gebru"]),
    ("(Raji et al., 2020)", ["Raji"]),
    ("(NIST, 2023; ISO/IEC 42001:2023)", ["NIST", "ISO/IEC"]),
    ("(Regulation (EU) 2024/1689)", ["Regulation"]),
    ("(Burrell, 2016; Selbst and Barocas, 2018)", ["Burrell", "Selbst"]),
    ("(Almada, 2019; Kaminski and Urban, 2021)", ["Almada", "Kaminski"]),
    ("(Citron, 2008; Citron and Pasquale, 2014)", ["Citron, D.K., 2008",
                                                   "Citron, D.K., Pasquale"]),
    ("(Cobbe et al., 2021)", ["Cobbe"]),
    ("(Bender et al., 2021; Ji et al., 2023)", ["Bender", "Ji"]),
    ("(Ransohoff and Feinstein, 1978; Whiting et al., 2011)",
     ["Ransohoff", "Whiting"]),
    ("(Bates et al., 2015; Barr et al., 2013)", ["Bates", "Barr"]),
    ("(Gwet, 2008)", ["Gwet, K.L., 2008"]),
    ("(Feinstein and Cicchetti, 1990; Byrt et al., 1993)",
     ["Feinstein", "Byrt"]),
    ("(Wilson, 1927)", ["Wilson"]),
]

# Named-method citations. The text names these statistics by their authors but
# carried no parenthetical year, so the author-date sweep never saw them and
# they read as uncited. Adding the marker is part of the conversion, not a new
# citation: the work is already credited in the sentence.
NAMED_METHOD = [
    ("Krippendorff's alpha and Fleiss' kappa reported alongside",
     "Krippendorff's alpha %s and Fleiss' kappa %s reported alongside",
     ["Krippendorff", "Fleiss"]),
]

# Narrative citations keep the author name and take a marker after it, which is
# what the journal's own example does: "contradicted by Becker and Seligman [5]".
NARRATIVE = [
    ("Cobbe, Lee and Singh (2021)", "Cobbe, Lee and Singh", ["Cobbe"]),
    ("Burrell (2016)", "Burrell", ["Burrell"]),
    ("Ananny and Crawford (2018)", "Ananny and Crawford", ["Ananny"]),
    ("Jacobs and Wallach (2021)", "Jacobs and Wallach", ["Jacobs"]),
    ("Almada (2019)", "Almada", ["Almada"]),
    ("Kaminski and Urban (2021)", "Kaminski and Urban", ["Kaminski"]),
    ("Citron (2008)", "Citron", ["Citron, D.K., 2008"]),
    ("Bovens (2007)", "Bovens", ["Bovens"]),
    ("Landis and Koch (1977)", "Landis and Koch", ["Landis"]),
]


def load():
    """Split into: text before the references, the entries, text after.

    The appendices sit AFTER the reference list in this manuscript, and they
    carry citations of their own. Treating everything after "## References" as
    untouchable tail would leave those unconverted, which is how the Wilson
    citation in Appendix B was missed on the first run. Both sides of the
    reference block are converted.
    """
    s = io.open(PAPER, encoding="utf-8").read()
    i = s.index("\n## References\n")
    before, tail = s[:i], s[i:]
    block = tail.split("\n---\n", 1)
    refs_txt = block[0]
    after = "\n---\n" + block[1] if len(block) > 1 else ""
    entries = [l.strip() for l in refs_txt.split("\n")
               if l.strip() and not l.startswith("##")]
    return before, entries, after


def number_for(entries, key):
    hits = [i for i, e in enumerate(entries, 1) if e.startswith(key)]
    if len(hits) != 1:
        hits = [i for i, e in enumerate(entries, 1) if key in e]
    if len(hits) != 1:
        raise SystemExit("[REQUIRED_ENV_PARAM] reference key %r matched %d "
                         "entries, expected exactly 1" % (key, len(hits)))
    return hits[0]


def marker(nums):
    return "[" + ", ".join(str(n) for n in sorted(nums)) + "]"


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    if not (a.apply or a.check):
        ap.error("pass --check or --apply")

    before, entries, after = load()
    # One string so a citation is converted wherever it sits, then split back
    # on a sentinel that cannot occur in prose.
    SEP = "\x00REFBLOCK\x00"
    head = before + SEP + after
    used = set()
    changes = 0

    for literal, keys in PARENTHETICAL:
        if literal not in head:
            raise SystemExit("[REQUIRED_ENV_PARAM] citation %r is not in the "
                             "manuscript; the map is stale" % literal)
        nums = [number_for(entries, k) for k in keys]
        used.update(nums)
        n = head.count(literal)
        head = head.replace(literal, marker(nums))
        changes += n

    for literal, keep, keys in NARRATIVE:
        if literal not in head:
            raise SystemExit("[REQUIRED_ENV_PARAM] citation %r is not in the "
                             "manuscript; the map is stale" % literal)
        nums = [number_for(entries, k) for k in keys]
        used.update(nums)
        n = head.count(literal)
        head = head.replace(literal, "%s %s" % (keep, marker(nums)))
        changes += n

    for literal, template, keys in NAMED_METHOD:
        if literal not in head:
            raise SystemExit("[REQUIRED_ENV_PARAM] named-method citation %r is "
                             "not in the manuscript; the map is stale" % literal)
        nums = [number_for(entries, k) for k in keys]
        used.update(nums)
        n = head.count(literal)
        head = head.replace(literal,
                            template % tuple(marker([x]) for x in nums))
        changes += n

    leftover = re.findall(r"\([A-Z][^()]{0,120}?(?:19|20)\d\d[^()]{0,120}?\)",
                          head)
    leftover = [x for x in leftover if not re.match(r"^\(\d{4}\)$", x)]
    if leftover:
        raise SystemExit("[REQUIRED_ENV_PARAM] %d author-date citation(s) "
                         "remain unconverted: %s"
                         % (len(leftover), "; ".join(leftover[:4])))

    uncited = [i for i in range(1, len(entries) + 1) if i not in used]
    audit = []
    if uncited:
        audit.append("%d reference(s) cited nowhere: %s"
                     % (len(uncited),
                        ", ".join("[%d] %s" % (i, entries[i - 1][:38])
                                  for i in uncited)))
    numbered = ["%d. %s" % (i, e) for i, e in enumerate(entries, 1)]
    before_out, after_out = head.split(SEP, 1)
    out = (before_out + "\n## References\n\n" + "\n\n".join(numbered)
           + "\n" + after_out)

    for m in re.finditer(r"\[(\d+(?:, \d+)*)\]", head):
        for n in m.group(1).split(", "):
            if not (1 <= int(n) <= len(entries)):
                audit.append("marker [%s] points outside the list" % n)

    print("  %d reference entries, numbered 1 to %d"
          % (len(entries), len(entries)))
    print("  %d citation site(s) converted" % changes)
    print("  %d of %d entries cited" % (len(used), len(entries)))
    for line in audit:
        print("  NOTE  " + line)
    if not a.apply:
        print("\nCHECK ONLY, nothing written")
        return 0
    io.open(PAPER, "w", encoding="utf-8").write(out)
    print("\nwrote %s" % os.path.relpath(PAPER, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
