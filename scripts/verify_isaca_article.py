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
PRIMARY_N = 20
EXCLUDED = 2
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
# The case-list appendix is submission evidence, not article prose, and is excluded from
# the count the way a reference list is excluded from a word limit. It is counted and
# reported separately so it can never hide growth in the body.
_body = ms[:ms.index("## Appendix: case list")] if "## Appendix: case list" in ms else ms
_appx = ms[ms.index("## Appendix: case list"):] if "## Appendix: case list" in ms else ""
words = len(re.sub(r"[*_`|#-]", " ", _body).split())
check("length inside ISACA's 2,000 to 3,000 words", LO <= words <= HI,
      "%d words in the body, %d in the appendix"
      % (words, len(re.sub(r"[*_`|#-]", " ", _appx).split())))
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
      and "three lines of defense" in ms,
      "carries an operational section and a three-lines placement")

# ---- AUTHORSHIP ----
check("byline is Pokhriyal and Wikes, McMullan removed at his request 2026-08-23",
      "**Tanvi Pokhriyal and Phillip Wikes**" in ms)
# The contributor-methodology endnote was removed on 2026-08-24. It credited a
# reference-panel design, a chance-corrected agreement framework and prespecified
# thresholds, none of which this study uses, and the third contradicted endnote 4. The
# guard now asserts the credit stays out while the study lacks those methods.
check("no methodology credit for methods this study does not use",
      "Hossain" not in ms,
      "single reviewer, no panel, no chance-corrected agreement, retrospective rule")
check("the absent methods really are absent from the study",
      not re.search(r"\b(Gwet|AC1|Krippendorff|chance-corrected|reference-panel)\b", ms)
      and "Inter-rater reliability was not tested in this study." in ms
      and "applied retrospectively and was not fixed before the data closed" in ms)
check("no employer named anywhere",
      "KPMG" not in ms,
      "naming a Big Four firm implies institutional involvement that does not exist")
check("endnotes numbered from 1, grouped, and rendered as paragraphs not a list",
      "**Corpus and sources**" in ms and "**Exclusions**" in ms
      and "**Protocol and classification**" in ms and "**Statistical methods**" in ms
      and "**Contributor methodology**" not in ms
      and "**1.** The corpus comprises 20" in ms and "**6.** Comparison with" in ms)
check("Wilson intervals attached to the proportions, not the odds ratio",
      "95 percent Wilson score interval 40.9 to 92.9 percent" in ms
      and "95 percent Wilson score interval 4.7 to 44.8 percent" in ms)
check("figure 1 exhibit present",
      "**Figure 1. Record-Level Documentation Review**" in ms
      and "Failure signal" in ms)
check("five conditions explicitly operationalized for this study",
      "For this study, the five conditions were operationalized" in ms)
check("no reliability claim from a single reviewer",
      "Inter-rater reliability was not tested in this study." in ms
      and "repeatable between reviewers" not in ms)
check("association language, not effect language",
      "an association of this size can be observed" in ms
      and "an effect of this size is visible" not in ms)
check("Stacyann Young not named", "Young" not in ms)
_flat = re.sub(r"\s+", " ", ms)
check("creator interest disclosed once, without a cross-reference",
      _flat.count("benefit from its adoption") == 1
      and "did not participate in the case classifications or outcome recording" in _flat
      and "set out in endnote" not in _flat,
      "one Declarations statement, no endnote duplicate, no cross-reference")

# ---- FIGURES, RECOMPUTED LIVE ----
check("live screened set is 22", len(hr) == 22, "n=%d" % len(hr))
# The two excluded matters, identified by their own properties rather than by index.
_OUT = re.compile(r"Committee on Open Government|FOIL-AO-", re.I)
_DESC = re.compile(r"^Published .* proceedings involving", re.I)
excluded = [r for r in hr
            if _OUT.search(r.get("source") or "")
            or _DESC.match((r.get("source") or "").strip())]
primary = [r for r in hr if r not in excluded]
check("exactly %d matters excluded, identified by rule not by index" % EXCLUDED,
      len(excluded) == EXCLUDED,
      "; ".join((r.get("source") or "")[:44] for r in excluded))
check("primary corpus is %d" % PRIMARY_N, len(primary) == PRIMARY_N,
      "n=%d" % len(primary))
a = sum(1 for r in primary if r["jrs_read"] in FLAG and r["outcome"] in ADVERSE)
b = sum(1 for r in primary if r["jrs_read"] in FLAG and r["outcome"] not in ADVERSE)
c = sum(1 for r in primary if r["jrs_read"] == "ready" and r["outcome"] in ADVERSE)
d = sum(1 for r in primary if r["jrs_read"] == "ready" and r["outcome"] not in ADVERSE)
check("cells 6/8 and 2/12", (a, a + b, c, c + d) == (6, 8, 2, 12),
      "flagged %d/%d ready %d/%d" % (a, a + b, c, c + d))
check("p = 0.0194", "p = 0.0194" in ms and abs(fisher(a, b, c, d) - .0194) < 1e-4,
      "recomputed %.4f" % fisher(a, b, c, d))
check("odds ratio 15.00 in endnote 5",
      "15.00" in ms and abs(a * d / (b * c) - 15.00) < .01)
f1, c1 = wilson(a, a + b), wilson(c, c + d)
check("Wilson intervals in endnote 5",
      "40.9 to 92.9" in ms and "4.7 to 44.8" in ms
      and abs(f1[0] - 40.9) < .05 and abs(c1[1] - 44.8) < .05,
      "recomputed %.1f-%.1f and %.1f-%.1f" % (f1[0], f1[1], c1[0], c1[1]))
check("the 22-case figure is reported as the conservative comparison",
      "returns the corpus to 22 and strengthens the association to p = 0.0073" in ms)
check("both exclusions are named in the appendix",
      ms.count("**EXCLUDED FROM THE ANALYSIS.**") == EXCLUDED)
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
        ("no rule was fixed before the data closed",
         "no pre-registered coding"),
        ("Restricting to the 13 matters with a resolved disposition", "the alternative coding is reported"),
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
check("acknowledgement is plural and bounds his contribution",
      "The authors thank Kyle McMullan for comments on audit practice." in ms
      and "did not extend\nto the study, its data or its findings" in ms,
      "two-author byline, and it must not imply he reviewed the study")
check("circularity objection addressed in the body, not only in an endnote",
      "circularity objection" in ms and "must not be treated as answered" in ms)
check("adverse-finding rule disclosed as retrospective",
      "applied retrospectively and was not fixed before the data closed" in ms
      and "should be treated as exploratory" in ms)
check("outcome categories reconcile to the primary corpus",
      "mutually exclusive and sum to 20" in ms)
check("what the reviewer read is stated precisely",
      "read the published decision in full" in ms
      and "No employer record was obtained independently of the decision." in ms)
check("case list appendix present with 22 numbered entries",
      "## Appendix: case list" in ms
      and len(re.findall(r"^\d+\. ", ms[ms.index("## Appendix: case list"):], re.M)) == 22)
_live_srcs = [ (r.get("source") or "").strip() for r in hr ]
check("every appendix citation matches the study database",
      all(src.rstrip(".") in ms for src in _live_srcs if src),
      "%d of %d live citations found in the manuscript"
      % (sum(1 for s2 in _live_srcs if s2 and s2.rstrip(".") in ms), len(_live_srcs)))
check("forum count matches the primary corpus",
      "six adjudicating forums" in ms
      and "three jurisdictional systems" not in ms,
      "20-case corpus spans 6 forums after the public-records matter came out")
check("the uncitable entry is excluded and said to be",
      "identifies no specific decision and cannot be cited" in ms
      and "**EXCLUDED FROM THE ANALYSIS.**" in ms)
check("the out-of-domain entry is excluded and said to be",
      "Public-records advisory opinion, not an employment adjudication" in ms)
check("the entry lacking a locator is described, not excluded",
      "The tribunal case number is not on file" in ms)
check("exclusions recorded in an endnote a reader can reconstruct from",
      "**2.** Twenty-two matters were screened into the study database" in ms
      and "both matters are named in the appendix" in ms)
check("appendix states which entries are outside the analysis",
      "The two marked EXCLUDED are not part of the 20-case analysis" in ms)
check("nonsignificance not read as equivalence",
      "did not detect a statistically significant difference" in ms
      and "does not establish equivalence" in ms)
check("one spelling standard, US English in the body",
      not [w for w in re.findall(r"\b\w+\b", ms)
           if (re.search(r"(isation|isations|ised|ises|ising)$", w)
               and w.lower() not in ("comprised", "comprises", "rising", "raised",
                                     "raises", "advised", "advises", "revised",
                                     "revises", "supervised", "supervises"))
           or w.lower() in ("defence", "behaviour", "practising", "licence", "programme")])
check("sample size does not rest on the corpus size",
      "This study cannot establish a periodic control sample size" in ms
      and "tolerable error" in ms)
check("third line credited rather than dismissed",
      "not an argument that internal audit has no role" in ms
      and "It is not a third-line activity" not in ms)
check("disclaimer excludes client engagements, not just identified organizations",
      "any client engagement, examination, or the records of any organization" in ms
      and "any identified organization" not in ms)
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
