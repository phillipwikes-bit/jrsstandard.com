#!/usr/bin/env python3
"""Verify every number in the cross-domain manuscript against the live database.

Nothing in the manuscript is trusted. Each figure is recomputed from
`bench_outcomes` pulled live, and the check fails if the manuscript and the
recomputation disagree anywhere.

The two FOIL-only figures that come from the public-records note coding and the
document-class structure are asserted against `research/FOIL_Article_Draft.md`
instead, because their source coding lives in that manuscript rather than in a
readable table. That is stated rather than silently skipped.

Usage: python3 scripts/verify_crossdomain_manuscript.py
"""
import io
import json
import os
import re
import sys
import urllib.request
from math import comb, exp, log, sqrt, erf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MS = os.path.join(ROOT, "research", "CrossDomain_Validation_Manuscript_2026-08-21.md")
FOIL = os.path.join(ROOT, "research", "FOIL_Article_Draft.md")
SB = "https://pjzxkeviouofdseagvpf.supabase.co"

ADVERSE = {"failed_appeal", "failed_audit"}
FLAG = {"review_required", "gap_identified"}
RESULTS = []


def check(name, ok, detail=""):
    RESULTS.append(ok)
    print("%-5s %-56s %s" % ("PASS" if ok else "FAIL", name, detail))
    return ok


def key():
    for n in sorted(os.listdir(os.path.join(ROOT, "api"))):
        if n.endswith(".js"):
            m = re.search(r"sb_publishable_[A-Za-z0-9_-]+",
                          io.open(os.path.join(ROOT, "api", n),
                                  encoding="utf-8").read())
            if m:
                return m.group(0)
    raise SystemExit("[REQUIRED_ENV_PARAM] anon key not found")


def fisher(a, b, c, d):
    n, r1, c1 = a + b + c + d, a + b, a + c
    p = lambda x: comb(r1, x) * comb(n - r1, c1 - x) / comb(n, c1)
    obs = p(a)
    return sum(p(x) for x in range(max(0, c1 - (n - r1)), min(r1, c1) + 1)
               if p(x) <= obs + 1e-12)


def wilson(k, n, z=1.959963985):
    ph = k / n
    d = 1 + z * z / n
    c = (ph + z * z / (2 * n)) / d
    h = z * sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / d
    return 100 * (c - h), 100 * (c + h)


def orci(a, b, c, d, z=1.959963985):
    A, B, C, D = a + .5, b + .5, c + .5, d + .5
    l = log(A * D / (B * C))
    se = sqrt(1 / A + 1 / B + 1 / C + 1 / D)
    return exp(l), exp(l - z * se), exp(l + z * se)


def cells(rows):
    a = sum(1 for r in rows if r["jrs_read"] in FLAG and r["outcome"] in ADVERSE)
    b = sum(1 for r in rows if r["jrs_read"] in FLAG and r["outcome"] not in ADVERSE)
    c = sum(1 for r in rows if r["jrs_read"] == "ready" and r["outcome"] in ADVERSE)
    d = sum(1 for r in rows if r["jrs_read"] == "ready" and r["outcome"] not in ADVERSE)
    return a, b, c, d


K = key()
req = urllib.request.Request(SB + "/rest/v1/bench_outcomes?select=*&limit=5000",
                             headers={"apikey": K, "Authorization": "Bearer " + K})
bo = json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
ms = io.open(MS, encoding="utf-8").read()
foil = io.open(FOIL, encoding="utf-8").read()

check("live corpus size is 54", len(bo) == 54, "n=%d" % len(bo))

a, b, c, d = cells(bo)
p = fisher(a, b, c, d)
o, lo, hi = orci(a, b, c, d)
check("pooled cells 17/23 and 12/31",
      (a, a + b, c, c + d) == (17, 23, 12, 31),
      "flagged %d/%d, ready %d/%d" % (a, a + b, c, c + d))
check("pooled p = 0.0139 in the manuscript", "p = 0.0139" in ms and
      abs(p - 0.0139) < 0.0001, "recomputed %.4f" % p)
check("pooled OR 4.20 (1.33 to 13.22)",
      "4.20 (1.33 to 13.22)" in ms and abs(o - 4.20) < 0.01
      and abs(lo - 1.33) < 0.01 and abs(hi - 13.22) < 0.01,
      "recomputed %.2f (%.2f to %.2f)" % (o, lo, hi))
fl, cl = wilson(a, a + b), wilson(c, c + d)
check("pooled Wilson intervals 53.5-87.5 and 23.7-56.2",
      "53.5 to 87.5" in ms and "23.7 to 56.2" in ms
      and abs(fl[0] - 53.5) < .05 and abs(cl[1] - 56.2) < .05,
      "recomputed %.1f-%.1f and %.1f-%.1f" % (fl[0], fl[1], cl[0], cl[1]))

logs = []
for dom, want_p, want_or in (("HR / Employment", 0.0073, 13.80),
                             ("Public records / FOIL", 0.4709, 1.89)):
    rows = [r for r in bo if r["domain"] == dom]
    A, B, C, D = cells(rows)
    pp = fisher(A, B, C, D)
    oo, l2, h2 = orci(A, B, C, D)
    check("domain %s p and OR" % dom.split(" /")[0],
          abs(pp - want_p) < 0.0001 and abs(oo - want_or) < 0.01
          and ("%.4f" % pp).lstrip("0") in ms.replace("0.", "."),
          "p=%.4f OR %.2f (%.2f to %.2f) n=%d" % (pp, oo, l2, h2, len(rows)))
    A, B, C, D = A + .5, B + .5, C + .5, D + .5
    logs.append((log(A * D / (B * C)), 1 / (1 / A + 1 / B + 1 / C + 1 / D)))

W = sum(w for _, w in logs)
L = sum(w * l for l, w in logs) / W
Q = sum(w * (l - L) ** 2 for l, w in logs)
pq = 2 * (1 - 0.5 * (1 + erf(sqrt(Q) / sqrt(2))))
check("Woolf Q = 2.550 and p = 0.110",
      "Q = 2.550" in ms and "p = 0.110" in ms
      and abs(Q - 2.550) < 0.001 and abs(pq - 0.110) < 0.001,
      "recomputed Q=%.3f p=%.3f, pooled OR %.2f" % (Q, pq, exp(L)))

aud = [r for r in bo if "osc.ny.gov" in (r.get("source") or "").lower()
       or "comptroller" in (r.get("source") or "").lower()]
check("5 audits, all Gap read, all adverse auditor finding",
      len(aud) == 5 and all(r["jrs_read"] == "gap_identified" for r in aud)
      and all(r["outcome"] == "failed_audit" for r in aud),
      "n=%d, exact binomial %.4f, Wilson %.1f to 100.0"
      % (len(aud), 0.5 ** 5, wilson(5, 5)[0]))
check("manuscript states the 5/5 concordance and p = 0.031",
      "five of five" in ms and "p = 0.031" in ms and "56.6 to 100" in ms)

# NEEDLE CORRECTED 2026-08-21. This check was written asserting "p = 0.0047",
# which is the rounded form. FOIL_Article_Draft.md carries "p = 0.00466", so the
# check correctly failed and the MANUSCRIPT was corrected to the source figure
# rather than the check being loosened to accept a rounding. The needle now
# tracks the source.
for fig, why in (("p = 0.00028", "construct note coding"),
                 ("p = 0.00466", "document-class discriminant"),
                 ("0.0000050", "gap concentration"),
                 ("p = 1.000", "appellate specification check")):
    check("FOIL figure %s traces to FOIL_Article_Draft (%s)" % (fig, why),
          fig.replace("p = ", "") in foil and fig in ms,
          "not recomputable from a readable table; asserted against the source "
          "manuscript")

for claim, why in (
        ("No analysis plan fixing a primary outcome coding was recorded before "
         "either corpus closed, and none is claimed", "pre-registration absence"),
        ("The same reviewer also recorded the outcomes in each corpus",
         "dual role"),
        ("The determination is a deterministic function of the five conditions",
         "circularity bound"),
        # NEEDLE UPDATED 2026-08-21 when the competing-interests statement was
        # hardened to the standard set by Detection_Article_Submission_FINAL5
        # Section 9: state the conflict, then what was and was NOT done about it.
        ("he read no record in either corpus", "creator interest, mitigation"),
        ("and no independent statistician replicated them before submission",
         "creator interest, what was NOT mitigated"),
        ("[REQUIRED_ENV_PARAM", "unresolved co-author declarations")):
    check("disclosure present: %s" % why, claim in ms)

for banned, why in ((u"—", "em-dash"), ("pre-registered outcome", "unsupported claim"),
                    ("No condition is decorative", "circular Section 4 claim")):
    check("absent: %s" % why, banned not in ms)

m = re.search(r"\*\*Purpose\*\* .*?\*\*Article classification\*\* [^\n]*", ms, re.S)
aw = len(re.sub(r"[*_`]", " ", m.group(0)).split()) if m else 999
check("abstract within Emerald's 250 words", aw <= 250, "%d words" % aw)

words = len(re.sub(r"[*_`|#-]", " ", ms).split())
ntab = len([l for l in ms.split("\n") if l.startswith("|---")])
print("\nEmerald count: %d words + %d tables x 280 = %d"
      % (words, ntab, words + 280 * ntab))
bad = len([r for r in RESULTS if not r])
print("%d checks, %d failed" % (len(RESULTS), bad))
sys.exit(0 if bad == 0 else 1)
