#!/usr/bin/env python3
"""Verify the ISACA Journal article: spec conformance, figures, fingerprints.

ISACA JOURNAL REQUIREMENTS, retrieved 2026-08-21 from isaca.org and its
submit-an-article page. Values are theirs, not recalled:

  Length      approximately 2,000 to 3,000 words
  Citations   ENDNOTES at the end of the article, not footnotes
  Content     new developments or in-depth technical subjects; broad appeal;
              practical matters. "Purely theoretical material is not solicited"
  Biography   current position, background, professional affiliations,
              publications. "Avoid including educational information"
  Format      Microsoft Word

Usage: python3 scripts/verify_isaca_article.py
"""
import io
import json
import os
import re
import sys
import urllib.request
from math import comb, erf, log, sqrt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MS = os.path.join(ROOT, "research", "Employment_Records_Article_ISACA_2026-08-21.md")
SB = "https://pjzxkeviouofdseagvpf.supabase.co"
ADVERSE = {"failed_appeal", "failed_audit"}
FLAG = {"review_required", "gap_identified"}
LO, HI = 2000, 3000
R = []


def check(n, ok, d=""):
    R.append(ok)
    print("%-5s %-58s %s" % ("PASS" if ok else "FAIL", n, d))


def key():
    for f in sorted(os.listdir(os.path.join(ROOT, "api"))):
        if f.endswith(".js"):
            m = re.search(r"sb_publishable_[A-Za-z0-9_-]+",
                          io.open(os.path.join(ROOT, "api", f),
                                  encoding="utf-8").read())
            if m:
                return m.group(0)
    raise SystemExit("[REQUIRED_ENV_PARAM] anon key not found")


def fisher(a, b, c, d):
    n, r1, c1 = a + b + c + d, a + b, a + c
    p = lambda x: comb(r1, x) * comb(n - r1, c1 - x) / comb(n, c1)
    o = p(a)
    return sum(p(x) for x in range(max(0, c1 - (n - r1)), min(r1, c1) + 1)
               if p(x) <= o + 1e-12)


def wilson(k, n, z=1.959963985):
    ph = k / n
    d = 1 + z * z / n
    c = (ph + z * z / (2 * n)) / d
    h = z * sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / d
    return 100 * (c - h), 100 * (c + h)


K = key()
req = urllib.request.Request(SB + "/rest/v1/bench_outcomes?select=*&limit=5000",
                             headers={"apikey": K, "Authorization": "Bearer " + K})
bo = json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
hr = [r for r in bo if r["domain"] == "HR / Employment"]
foil = [r for r in bo if r["domain"] == "Public records / FOIL"]
ms = io.open(MS, encoding="utf-8").read()

# ---- ISACA SPEC ----
words = len(re.sub(r"[*_`|#-]", " ", ms).split())
check("length inside ISACA's 2,000 to 3,000 words", LO <= words <= HI,
      "%d words" % words)
check("citations are endnotes, not footnotes",
      "## Endnotes" in ms and "<sup>" in ms and "[^" not in ms,
      "%d superscript markers, an Endnotes section, no footnote syntax"
      % ms.count("<sup>"))
edu = [t for t in ("M.S.", "M.A.", "MBA", "PhD", "Ph.D", "B.A.", "B.S.",
                   "holds a degree", "graduated") if t in ms]
check("bios carry no educational information, per ISACA", not edu,
      "; ".join(edu) if edu else "positions and affiliations only")
for bio in ("**Tanvi Pokhriyal** is an Organisational Psychologist",
            "**Phillip Wikes** is an AI Governance"):
    check("bio present: %s" % bio.split("**")[1], bio in ms)
check("practical rather than theoretical framing",
      "Running it as a control rather than a project" in ms
      and "three lines of defence" in ms,
      "carries an operational section and a three-lines placement")

# ---- AUTHORSHIP ----
check("byline is Pokhriyal and Wikes, McMullan removed at his request 2026-08-23",
      "**Tanvi Pokhriyal and Phillip Wikes**" in ms)
check("Hossain credited as a contributor in the endnotes, not the byline",
      "contribution of Ubayet Hossain, FRM" in ms
      and "Hossain" not in ms[:ms.index("---", 200)],
      "endnote 4")
check("Stacyann Young not named", "Young" not in ms)
check("creator interest disclosed", "would benefit from its adoption" in ms
      and "He read no case in this corpus" in ms, "endnote 5")

# ---- FIGURES, RECOMPUTED LIVE ----
check("live employment corpus is 22", len(hr) == 22, "n=%d" % len(hr))
a = sum(1 for r in hr if r["jrs_read"] in FLAG and r["outcome"] in ADVERSE)
b = sum(1 for r in hr if r["jrs_read"] in FLAG and r["outcome"] not in ADVERSE)
c = sum(1 for r in hr if r["jrs_read"] == "ready" and r["outcome"] in ADVERSE)
d = sum(1 for r in hr if r["jrs_read"] == "ready" and r["outcome"] not in ADVERSE)
check("cells 7/9 and 2/13", (a, a + b, c, c + d) == (7, 9, 2, 13),
      "flagged %d/%d ready %d/%d" % (a, a + b, c, c + d))
check("p = 0.0073", "p = 0.0073" in ms and abs(fisher(a, b, c, d) - .0073) < 1e-4,
      "recomputed %.4f" % fisher(a, b, c, d))
check("odds ratio 19.25 in endnote 1",
      "19.25" in ms and abs(a * d / (b * c) - 19.25) < .01)
f1, c1 = wilson(a, a + b), wilson(c, c + d)
check("Wilson intervals in endnote 1",
      "45.3 to 93.7" in ms and "4.3 to 42.2" in ms
      and abs(f1[0] - 45.3) < .05 and abs(c1[1] - 42.2) < .05,
      "recomputed %.1f-%.1f and %.1f-%.1f" % (f1[0], f1[1], c1[0], c1[1]))
logs = []
for rows in (hr, foil):
    x = sum(1 for r in rows if r["jrs_read"] in FLAG and r["outcome"] in ADVERSE) + .5
    y = sum(1 for r in rows if r["jrs_read"] in FLAG and r["outcome"] not in ADVERSE) + .5
    z = sum(1 for r in rows if r["jrs_read"] == "ready" and r["outcome"] in ADVERSE) + .5
    w = sum(1 for r in rows if r["jrs_read"] == "ready" and r["outcome"] not in ADVERSE) + .5
    logs.append((log(x * w / (y * z)), 1 / (1 / x + 1 / y + 1 / z + 1 / w)))
W = sum(w for _, w in logs)
L = sum(w * l for l, w in logs) / W
Q = sum(w * (l - L) ** 2 for l, w in logs)
pq = 2 * (1 - .5 * (1 + erf(sqrt(Q) / sqrt(2))))
check("Woolf Q = 2.550, p = 0.110 in endnote 2",
      "Q = 2.550" in ms and "p = 0.110" in ms
      and abs(Q - 2.550) < 1e-3 and abs(pq - .110) < 1e-3,
      "recomputed Q=%.3f p=%.3f" % (Q, pq))
check("companion corpus stated as 32", len(foil) == 32
      and "32 public-records determinations" in ms)

# ---- DISCLOSURES ----
for t, why in (
        ("no rule for defining it was fixed before the data closed",
         "no pre-registered coding"),
        ("p = 0.165, which is not significant", "the null coding is reported"),
        ("single-practitioner field pilot", "design stated as scope"),
        ("one timestamp per case rather than separate review and outcome times",
         "timestamp granularity, endnote 3"),
        ("selected from published sources rather than sampled at random",
         "selection stated"),
        ("It does not establish that the review improves outcomes",
         "claim boundary")):
    check("disclosure: %s" % why, t in ms)

# ---- AI FINGERPRINTS ----
FP = [
    ("In today's", "AI opener"), ("In an era", "AI opener"),
    ("It is important to", "AI filler"), ("It is worth noting", "AI filler"),
    ("Moreover,", "AI connective"), ("Furthermore,", "AI connective"),
    ("Additionally,", "AI connective"), ("In conclusion", "AI closer"),
    ("delve", "AI verb"), ("leverage", "AI verb"), ("robust framework", "AI phrase"),
    ("Designed for", "banned by CLAUDE.md III.7"),
    ("frequently", "banned by CLAUDE.md III.7"),
    ("no policy change required", "banned by CLAUDE.md III.7"),
    ("not only", "correlative pair, AI cadence"),
    ("It is not just", "AI cadence"), ("landscape", "AI noun"),
    ("navigate", "AI verb"), ("crucial", "AI intensifier"),
    ("pivotal", "AI intensifier"), ("underscore", "AI verb"),
    ("testament", "AI noun"), ("realm", "AI noun"),
    ("Consider a ", "AI hypothetical opener"),
    ("What has changed is", "AI antithesis closer"),
    (u"—", "em-dash"),
]
hits = [why for t, why in FP if t in ms]
check("McMullan absent from byline and bios",
      "Kyle McMullan is a Chief Audit Executive" not in ms
      and "Kyle McMullan and Phillip Wikes" not in ms,
      "he asked to come off the byline 2026-08-23")
check("acknowledgement in the exact form he specified",
      "The author thanks Kyle McMullan for comments on audit practice." in ms
      and "does not endorse its findings" in ms,
      "must not imply he reviewed the study")
check("circularity objection addressed in the body, not only in an endnote",
      "circularity objection" in ms and "must not be treated as answered" in ms)
check("sample size does not rest on the corpus size",
      "Not 22, and this study cannot derive one" in ms
      and "tolerable error" in ms)
check("third line credited rather than dismissed",
      "not an argument that internal audit has no role" in ms
      and "It is not a third-line activity" not in ms)
check("disclaimer excludes client engagements, not just identified organisations",
      "any client engagement, examination, or the records of any organisation" in ms
      and "any identified organisation" not in ms)
check("no AI-drafting claim over the corpus",
      "no case in it is shown to have been AI-drafted" in ms
      and "Testing AI-Assisted Employment Records" not in ms)

check("no AI fingerprint present", not hits,
      "; ".join(sorted(set(hits))[:4]) if hits
      else "%d patterns checked, 0 present" % len(FP))

# Exclude the author-bio block. Bios are supplied verbatim by the people they describe;
# an AI-fingerprint style rule must not force us to rewrite someone's own words.
body_only = ms.split("**Tanvi Pokhriyal** is an")[0]
tri = re.findall(r", \w[\w' ]{2,30}, \w[\w' ]{2,30}, and \w", body_only)
check("no triadic anaphora", not tri, "; ".join(tri[:2]) if tri else "0 found")

bad = len([x for x in R if not x])
print("\n%d checks, %d failed" % (len(R), bad))
sys.exit(0 if bad == 0 else 1)
