#!/usr/bin/env python3
"""Pre-submission checks for the Compliance Today manuscript and its supplement.

Measurable, repeatable checks on the built .docx files: length, title, banned
prose, endnote integrity, verbatim acknowledgement, study figures, and the
supplement's counts against the study totals recorded in the article.

It does not verify quotes or citations against primary sources. Those checks
need network access this repository's sessions do not always have, and are
listed in research/ComplianceToday_PreSubmission_Checklist_2026-11-03.md.

Usage: python3 scripts/verify_ct_article.py
"""
import collections
import os
import re
import subprocess
import sys

import docx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MS = os.path.join(ROOT, "research", "ComplianceToday_Testing_Employment_Files_2026-11-03.docx")
SUP = os.path.join(ROOT, "research", "ComplianceToday_Supplement_Case_List_2026-11-03.docx")
R = []


def check(name, ok, detail=""):
    R.append(ok)
    print("%-5s %-62s %s" % ("PASS" if ok else "FAIL", name, detail))


def plain(path):
    return subprocess.run(["pandoc", path, "-t", "plain", "--wrap=none"],
                          capture_output=True, text=True, check=True).stdout


ms = plain(MS)
body = ms.split("\nEndnotes\n")[0]
notes_part = ms.split("\nEndnotes\n")[1] if "\nEndnotes\n" in ms else ""

# ---- length and title (HCCA 2024 guidelines: 1,600 to 3,200 words; title 10 words or fewer)
words = len(ms.split())
check("total words within 1,600 to 3,200", 1600 <= words <= 3200, "%d words" % words)
title = docx.Document(MS).paragraphs[0].text
check("title is 10 words or fewer", len(title.split()) <= 10, "%d words: %s" % (len(title.split()), title))
check("title is sentence case with a capitalized colon subtitle",
      re.match(r"^[A-Z][a-z].*: [A-Z]", title) is not None and title.split()[1].islower())

# ---- house prose rules (CLAUDE.md 36.7) and known-false statements
check("no em-dash or en-dash", "—" not in ms and "–" not in ms)
for banned in ("frequently", "no policy change required"):
    check("banned phrase absent: %s" % banned, banned not in ms.lower())
check("no sentence opens 'Designed for'", re.search(r"(^|[.!?]\s+)Designed for", ms) is None)
check("no claim that the corpus was deliberately non-healthcare",
      re.search(r"deliberately (drawn|selected|chosen)", ms, re.I) is None)
check("body no longer points to an in-article appendix", "appendix" not in body.lower())

# ---- endnotes: every number cited, cited in order of first appearance
sup_map = str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹", "0123456789")
cited = [int(m.translate(sup_map)) for m in re.findall(r"[⁰¹²³⁴-⁹]+", body)]
listed = len(re.findall(r"^\d+\.\s", notes_part.split("\nAcknowledgement\n")[0], re.M))
first = []
for n in cited:
    if n not in first:
        first.append(n)
check("every endnote is cited in the body", sorted(set(cited)) == list(range(1, listed + 1)),
      "%d listed, cited %s" % (listed, sorted(set(cited))))
check("endnotes first appear in numerical order", first == sorted(first), str(first))

# ---- acknowledgement exactly as approved by Kyle McMullan on 2026-08-27
ack = ("The authors thank Kyle McMullan for comments on audit practice. "
       "His comments did not extend to the study, its data or its findings.")
check("acknowledgement verbatim", ack in " ".join(ms.split()))

# ---- illustrative example labelled; disclosures present
check("worked example labelled as an illustrative composite",
      "illustrative composite, not drawn from any organization" in ms)
check("financial-interest disclosure present", "may benefit from its adoption" in ms)

# ---- study figures stated consistently
flat = " ".join(ms.split())
for fig in ("Screened 22, analyzed 20", "12 Ready, 5 Needs work, 3 Gap",
            "6 sustained, 7 did not survive review, 6 contested, 1 adverse audit finding",
            "6 of 8 incomplete records", "2 of 12 Ready records", "p = 0.0194",
            "p = 0.0291", "p = 0.0073", "40.9% to 92.9%", "4.7% to 44.8%"):
    check("figure present: %s" % fig, fig in flat)

# ---- B-019 disclosure stays in (owner decision 2026-11-03: disclose, do not recode)
check("adverse finding defined as the reviewer's code", "the reviewer coded the matter as not surviving review" in flat)
check("outcome-coding sensitivity disclosed in an endnote", "between 0.0044 and 0.1089" in flat)

# ---- no unverified verbatim case quotes (2026-11-03: decisions could not be opened)
for q in ("corroborated the alleged inappropriate", "failed to check the box for reprisal"):
    check("unverified case quote not presented verbatim: %s" % q, q not in flat)

# ---- no unverified claim that the corpus contains no healthcare matters (2026-11-03)
check("no claim that none of the matters is from healthcare",
      re.search(r"[Nn]one of (its|the) 20 matters comes? from healthcare", ms) is None)

# ---- supplement table reproduces the study totals
rows = [[c.text.strip() for c in r.cells] for r in docx.Document(SUP).tables[0].rows][1:]
reads = collections.Counter(r[2] for r in rows)
outs = collections.Counter(r[3] for r in rows)
check("supplement lists 20 matters", len(rows) == 20, str(len(rows)))
check("supplement reads 12/5/3", reads == {"Ready": 12, "Needs work": 5, "Gap": 3}, dict(reads).__repr__())
check("supplement outcomes 6/7/6/1",
      outs == {"Sustained": 6, "Did not survive": 7, "Contested": 6,
               "Adverse audit or compliance finding": 1}, dict(outs).__repr__())
adverse = lambda r: r[3] in ("Did not survive", "Adverse audit or compliance finding")
inc = [r for r in rows if r[2] != "Ready"]
rdy = [r for r in rows if r[2] == "Ready"]
check("supplement reproduces 6 of 8 and 2 of 12",
      (sum(map(adverse, inc)), len(inc), sum(map(adverse, rdy)), len(rdy)) == (6, 8, 2, 12))

failed = R.count(False)
print("\n%d checks, %d failed" % (len(R), failed))
sys.exit(1 if failed else 0)
