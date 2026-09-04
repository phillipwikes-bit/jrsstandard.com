#!/usr/bin/env python3
"""Verify the employment-records article against the live database.

AUTHOR SET OF RECORD, asserted first because it was got wrong once. The source
manuscript `research/BusinessEthics_Article_Draft.md` lines 5-10 names four
authors: Wikes, Pokhriyal, McMullan, Hossain. Stacyann Young is FIRST AUTHOR OF
THE COMPANION PUBLIC-RECORDS PAPER and is cited here, not co-authored. A prior
draft of this work made her first author of a merged paper, which was wrong and
has been removed. This check refuses to pass if that recurs.

Usage: python3 scripts/verify_employment_article.py
"""
import io
import json
import os
import re
import sys
import urllib.request
from math import comb, erf, exp, log, sqrt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MS = os.path.join(ROOT, "research", "Employment_Records_Article_2026-08-21.md")
SB = "https://pjzxkeviouofdseagvpf.supabase.co"
ADVERSE = {"failed_appeal", "failed_audit"}
FLAG = {"review_required", "gap_identified"}
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

# ---- AUTHORSHIP, checked before anything else ----
# AUTHOR ORDER CHANGED 2026-08-21 on the owner's instruction: Pokhriyal first
# because the research is hers, McMullan second, Wikes last as senior author,
# and Hossain moved from co-author to NAMED CONTRIBUTOR. The order is asserted
# positionally, not just by presence, because a byline that merely contains four
# names in any order is not the same paper.
byline = ms[:ms.index("**Author contributions.**")]
order = [byline.index("**Tanvi Pokhriyal**"), byline.index("**Kyle McMullan**"),
         byline.index("**Phillip Wikes**"), byline.index("**Contributor**")]
check("byline order: Pokhriyal, McMullan, Wikes, then Contributor",
      order == sorted(order), "positions %s" % order)
check("Wikes is marked senior author", "**Phillip Wikes**\nSenior author." in ms)
check("Hossain is a named CONTRIBUTOR, not an author",
      "**Ubayet Hossain, FRM**, Associate Director" in byline
      and "Ubayet Hossain" not in byline[:byline.index("**Contributor**")],
      "appears only under the Contributor heading")
check("Hossain's methodology credit is intact",
      "reference-panel design" in ms and "acceptance floors fixed in advance" in ms)
check("Hossain must confirm contributor credit before submission",
      "confirm he accepts named-contributor credit rather than co-authorship" in ms)
# The author block ONLY, which ends where the scope note begins. The first
# version of this check sliced to "## Abstract", which swallowed the scope note
# and therefore flagged the one legitimate mention of Young as an authorship
# error. The needle was wrong, not the manuscript.
author_block = ms[:ms.index("**Scope, and what this paper does not duplicate.**")]
check("Stacyann Young is NOT in the author block",
      "Stacyann Young" not in author_block and "Young" not in author_block,
      "author block is %d chars, 4 authors, Young absent" % len(author_block))
check("Young credited as companion first author in the scope note",
      "first-authored by Stacyann Young" in ms)
check("Kyle McMullan holds Section 6.4",
      "K.M. contributed Section 6.4" in ms and "### 6.4" in ms)
check("the research is attributed to Pokhriyal",
      "The research reported in Section 5 is hers." in ms)
check("no unresolved co-author bracket asks", "[Kyle:" not in ms)

# ---- CRITERION FIGURES, recomputed from live rows ----
check("live employment corpus is 22", len(hr) == 22, "n=%d" % len(hr))
a = sum(1 for r in hr if r["jrs_read"] in FLAG and r["outcome"] in ADVERSE)
b = sum(1 for r in hr if r["jrs_read"] in FLAG and r["outcome"] not in ADVERSE)
c = sum(1 for r in hr if r["jrs_read"] == "ready" and r["outcome"] in ADVERSE)
d = sum(1 for r in hr if r["jrs_read"] == "ready" and r["outcome"] not in ADVERSE)
p = fisher(a, b, c, d)
check("cells 7/9 and 2/13", (a, a + b, c, c + d) == (7, 9, 2, 13),
      "flagged %d/%d ready %d/%d" % (a, a + b, c, c + d))
check("p = 0.0073", "p = 0.0073" in ms and abs(p - 0.0073) < 1e-4,
      "recomputed %.4f" % p)
check("odds ratio 19.25", "19.25" in ms and abs(a * d / (b * c) - 19.25) < .01,
      "recomputed %.2f" % (a * d / (b * c)))
f1, c1 = wilson(a, a + b), wilson(c, c + d)
check("Wilson 45.3-93.7 and 4.3-42.2",
      "45.3 to 93.7" in ms and "4.3 to 42.2" in ms
      and abs(f1[0] - 45.3) < .05 and abs(c1[1] - 42.2) < .05,
      "recomputed %.1f-%.1f and %.1f-%.1f" % (f1[0], f1[1], c1[0], c1[1]))
res = [r for r in hr if r["outcome"] != "challenged"]
A = sum(1 for r in res if r["jrs_read"] == "ready" and r["outcome"] == "held_up")
B = sum(1 for r in res if r["jrs_read"] == "ready" and r["outcome"] != "held_up")
C = sum(1 for r in res if r["jrs_read"] in FLAG and r["outcome"] == "held_up")
D = sum(1 for r in res if r["jrs_read"] in FLAG and r["outcome"] != "held_up")
check("second coding p = 0.041", "p = 0.041" in ms
      and abs(fisher(A, B, C, D) - 0.041) < 1e-3,
      "recomputed %.4f on %d resolved" % (fisher(A, B, C, D), len(res)))
A2 = sum(1 for r in hr if r["jrs_read"] == "ready" and r["outcome"] == "held_up")
B2 = sum(1 for r in hr if r["jrs_read"] == "ready" and r["outcome"] != "held_up")
C2 = sum(1 for r in hr if r["jrs_read"] in FLAG and r["outcome"] == "held_up")
D2 = sum(1 for r in hr if r["jrs_read"] in FLAG and r["outcome"] != "held_up")
check("third coding p = 0.165", "p = 0.165" in ms
      and abs(fisher(A2, B2, C2, D2) - 0.165) < 1e-3,
      "recomputed %.4f" % fisher(A2, B2, C2, D2))

# ---- COMPANION HOMOGENEITY, the Section 6.3 claim ----
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
check("Woolf Q = 2.550 and p = 0.110",
      "Q = 2.550" in ms and "p = 0.110" in ms
      and abs(Q - 2.550) < 1e-3 and abs(pq - .110) < 1e-3,
      "recomputed Q=%.3f p=%.3f" % (Q, pq))
check("companion corpus is 32 public-records determinations",
      len(foil) == 32 and "32 freedom-of-information determinations" in ms,
      "n=%d" % len(foil))

# ---- DISCLOSURES AND BANS ----
for t, why in (
        ("No analysis plan fixing a primary outcome coding was recorded before "
         "the data closed, and this paper does not claim otherwise",
         "pre-registration absence, Section 5"),
        ("and none is claimed", "pre-registration absence, provenance"),
        ("This is a single-practitioner field pilot", "design stated as scope, Section 7"),
        ("Design: a single-practitioner field pilot", "design stated neutrally, Section 5.1"),
        ("The database stores one timestamp per case rather than separate review and outcome times",
         "timestamp granularity, found 2026-08-21 and disclosed"),
        ("The determination is a deterministic function of the five conditions",
         "circularity bound"),
        ("has been withdrawn", "withdrawn per-condition analysis"),
        ("he read no case in this corpus", "creator interest, mitigated"),
        ("no independent statistician replicated them before submission",
         "creator interest, NOT mitigated"),
        ("[REQUIRED_ENV_PARAM", "unresolved co-author declarations"),
        ("standard deviation 6.4 points, range 66.7 to 100 percent",
         "reproducibility dispersion, not a bare point estimate"),
        # NEEDLE CORRECTED: the manuscript reads "ranges from", not "range from".
        ("ranges from 0.236 to 0.413, all below the 0.61 floor",
         "condition-level reliability weakness")):
    check("disclosure: %s" % why, t in ms)

for t, why in ((u"—", "em-dash"), ("pre-registered outcome", "unsupported claim"),
               ("No condition is decorative", "withdrawn circular claim"),
               ("Target:", "venue language in the draft"),
               ("Records Management Journal", "venue language in the draft"),
               ("Journal of Business Ethics", "venue language in the draft")):
    check("absent: %s" % why, t not in ms)

m = re.search(r"\*\*Purpose\*\* .*?\*\*Article classification\*\* [^\n]*", ms, re.S)
aw = len(re.sub(r"[*_`]", " ", m.group(0)).split()) if m else 999
check("abstract within Emerald's 250 words", aw <= 250, "%d words" % aw)
check("nine practitioner controls or four-control set intact",
      "four controls applied before a record enters the system of record" in ms)

words = len(re.sub(r"[*_`|#-]", " ", ms).split())
nt = len([l for l in ms.split("\n") if l.startswith("|---")])
print("\nEmerald count: %d words + %d tables x 280 = %d" % (words, nt, words + 280 * nt))
bad = len([x for x in R if not x])
print("%d checks, %d failed" % (len(R), bad))
sys.exit(0 if bad == 0 else 1)
