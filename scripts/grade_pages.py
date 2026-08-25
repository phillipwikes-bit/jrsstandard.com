#!/usr/bin/env python3
"""Grade every page against the High-End Enterprise Track objective.

THE QUESTION EACH PAGE IS SCORED ON: if a GRC platform architect or legal-tech
executive lands here from a search result or a forwarded link, can they work out
what is being licensed, satisfy themselves it is credible, and reach a person,
without leaving the page to guess?

Scoring is mechanical and every point is tied to something present or absent in
the file, so two runs on the same page give the same grade and a change in grade
means the page changed. Judgement enters only in choosing the dimensions and
their weights, both of which are stated here rather than buried.

Pages are graded against the ROLE they play. A keyed participant surface is not
failing because it lacks an enterprise call to action; it is not for that
audience. Roles are assigned from measurable properties, never by guessing.

Usage:
  python3 scripts/grade_pages.py            # full report to stdout
  python3 scripts/grade_pages.py --md FILE  # also write a markdown report
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "node_modules", "__pycache__", "research", ".vercel"}

PRIVATE = {"programme-status-9872fb93cc94.html", "acquisition-9f3c2a7d4b.html",
           "vp-7c1f9a4e8d2b6035.html"}

# Pages a buyer can actually arrive on and be sold to. Everything else is graded
# on fitness for its own purpose.
COMMERCIAL = {"index.html", "enterprise.html", "review-engine.html",
              "engagement.html", "audit-request.html", "governance-request.html",
              "calibration-request.html", "org-pilot.html", "pilot.html"}

FRAMEWORKS = ("ISO/IEC 42001", "ISO 42001", "NIST AI RMF", "EU AI Act")
NON_EST = ("does not establish compliance", "no framework requires",
           "substitute for obligations", "does not establish legal or regulatory")
FALSE_ASSURANCE = ("SOC 2 bypass", "SOC 2 compliant", "ISO certified",
                   "GDPR compliant", "compliance guaranteed",
                   "triggering complex security compliance audits")


def pages():
    out = []
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith(".html"):
                out.append(os.path.relpath(os.path.join(base, f), ROOT))
    return sorted(out)


def read(rel):
    return io.open(os.path.join(ROOT, rel), encoding="utf-8", errors="replace").read()


ALL = pages()
BODIES = {p: read(p) for p in ALL}
INBOUND = {}
for p in ALL:
    n = 0
    for q in ALL:
        if q == p:
            continue
        if os.path.basename(p) in BODIES[q]:
            n += 1
    INBOUND[p] = n

try:
    SITEMAP = read("sitemap.xml") if os.path.exists(os.path.join(ROOT, "sitemap.xml")) else ""
except Exception:
    SITEMAP = ""


def role(p, b):
    base = os.path.basename(p)
    # Match COMMERCIAL on the RELATIVE PATH, not the basename. Every
    # reference/<topic>/index.html has the basename "index.html", so a basename
    # test graded 14 reference pages as commercial and dragged the commercial
    # mean down with dimensions that were never meant to apply to them.
    if p.startswith("reference" + os.sep):
        return "reference"
    if base in PRIVATE:
        return "private-owner"
    if 'content="noindex' in b and ("?k=" in b or "searchParams.get('k')" in b or "getKey" in b):
        return "keyed-participant"
    if 'content="noindex' in b:
        return "internal-tool"
    if p in COMMERCIAL:
        return "commercial"
    return "public-content"


def grade_page(p, b):
    r = role(p, b)
    pts = []          # (label, earned, possible, note)

    def add(label, ok, weight, note=""):
        pts.append((label, weight if ok else 0, weight, note))

    # ---- universal hygiene, every role -----------------------------------
    t = re.search(r"<title>(.*?)</title>", b, re.S)
    add("has a <title>", bool(t and t.group(1).strip()), 4)
    d = re.search(r'<meta name="description" content="([^"]{40,})"', b)
    add("meta description, 40+ chars", bool(d), 4)
    add("viewport declared", 'name="viewport"' in b, 4)
    add("canonical link", 'rel="canonical"' in b, 3)
    add("one <h1>", b.count("<h1") == 1, 3)
    add("skip-to-content link", "#main-content" in b or "skip" in b.lower()[:4000], 2)
    add("footer present", "site-footer" in b or "<footer" in b, 3)

    # ---- claim discipline, every role ------------------------------------
    named = [f for f in FRAMEWORKS if f in b]
    add("framework names qualified", (not named) or any(q in b for q in NON_EST), 8,
        "names: " + ", ".join(named) if named else "none named")
    bad = [f for f in FALSE_ASSURANCE if f.lower() in b.lower()]
    add("no false assurance claim", not bad, 8, "; ".join(bad) if bad else "")
    prices = re.findall(r"\$\s?\d{2,5}", re.sub(r"<script.*?</script>|<style.*?</style>", " ", b, flags=re.S))
    add("no hardcoded price", not prices, 5, ", ".join(sorted(set(prices))[:4]))

    # A page cannot be both listed for crawling and told not to be indexed. The
    # 2026-08-15 withdrawal commit states the rule outright: "A noindex page in a
    # sitemap asks to be crawled and then asks not to be indexed." Flagged here
    # because the contradiction is invisible on either surface alone.
    ni = 'content="noindex' in b
    insm = os.path.basename(p) in SITEMAP
    add("robots directive agrees with sitemap membership", not (ni and insm), 6,
        "noindex AND in sitemap" if (ni and insm) else "")

    # Two robots tags with different values is ambiguous markup. Crawlers take
    # the most restrictive, so the page behaves as noindex while the source
    # reads as if it were indexable.
    robots = re.findall(r'<meta name="robots" content="([^"]+)"', b)
    add("single, unambiguous robots directive", len(set(robots)) <= 1, 4,
        " AND ".join(robots) if len(set(robots)) > 1 else "")

    if r in ("commercial", "public-content", "reference"):
        add("indexed in sitemap", os.path.basename(p) in SITEMAP
            or (p == "index.html" and "jrsstandard.com/</loc>" in SITEMAP)
            or p.startswith("reference" + os.sep), 5)
        add("reachable, has inbound links", INBOUND[p] > 0, 5,
            "%d inbound" % INBOUND[p])
    else:
        add("correctly kept out of the sitemap",
            os.path.basename(p) not in SITEMAP, 5)
        add("noindex declared", 'content="noindex' in b, 5)

    # ---- enterprise readiness, weighted only where it belongs ------------
    if r == "commercial":
        add("dual-track positioning present", "JRS DUAL TRACK v1" in b, 10)
        add("routes to the engine documentation", "review-engine.html" in b, 8)
        add("routes to an enterprise inquiry",
            "enterprise-inquiry" in b or "enterprise.html" in b, 8)
        add("names the API or integration", "api/v1/review-engine" in b
            or "review engine" in b.lower() or "/api/" in b, 6)
        add("states the evidence stage honestly",
            "unvalidated" in b.lower() or "operational validation" in b.lower()
            or "no effectiveness claim" in b.lower(), 8)
        add("zero-retention claim carries its limit",
            ("no data at rest" not in b.lower()
             and "zero data retention" not in b.lower())
            or "does not remove the review" in b or "does not remove the assessment" in b, 8)
        add("a capture path exists on the page",
            "<form" in b or "/api/checkout" in b or "/api/enterprise-inquiry" in b, 10)
        add("terms or boundaries reachable",
            "terms.html" in b or "engagement.html" in b or "operational-boundaries" in b, 5)
    elif r in ("public-content", "reference"):
        add("offers a next step", "<form" in b or "/api/dl" in b
            or "training.html" in b or "check.html" in b
            or "investigator-guides.html" in b, 8)
        add("connects to the enterprise track",
            "enterprise.html" in b or "review-engine.html" in b, 6)
        add("free access stated or implied", "free" in b.lower(), 4)
    elif r == "keyed-participant":
        add("no analytics on a keyed surface",
            "googletagmanager" not in b and "gtag(" not in b, 6)
        add("referrer suppressed", 'name="referrer"' in b, 4)
    elif r == "private-owner":
        add("no analytics", "googletagmanager" not in b and "gtag(" not in b, 10)
        add("referrer suppressed", 'name="referrer"' in b, 6)
        # Count PUBLIC inbound only. The first version counted any inbound link,
        # so acquisition and vp failed for being linked from each other and from
        # programme-status, which are themselves private. Private surfaces
        # linking to each other is the design, not a leak.
        pub_in = sum(1 for q in ALL
                     if q != p and os.path.basename(q) not in PRIVATE
                     and os.path.basename(p) in BODIES[q])
        add("not linked from any PUBLIC page", pub_in == 0, 8,
            "%d public inbound" % pub_in)

    earned = sum(e for _, e, _, _ in pts)
    total = sum(t for _, _, t, _ in pts)
    pct = 100.0 * earned / total if total else 0.0
    if pct >= 93: g = "A"
    elif pct >= 85: g = "A-"
    elif pct >= 78: g = "B+"
    elif pct >= 70: g = "B"
    elif pct >= 62: g = "C+"
    elif pct >= 54: g = "C"
    elif pct >= 45: g = "D"
    else: g = "F"
    return r, g, pct, earned, total, pts


rows = []
for p in ALL:
    rows.append((p,) + grade_page(p, BODIES[p]))

ORDER = {"commercial": 0, "public-content": 1, "reference": 2,
         "keyed-participant": 3, "internal-tool": 4, "private-owner": 5}
rows.sort(key=lambda x: (ORDER.get(x[1], 9), -x[3]))

L = []
def w(s=""):
    L.append(s)

w("# Page-by-Page Grade: Enterprise Track Readiness")
w()
w("**Generated by:** `scripts/grade_pages.py`  ")
w("**Question every page is scored on:** if a GRC platform architect or legal-tech "
  "executive lands here from a search result or a forwarded link, can they work out "
  "what is being licensed, satisfy themselves it is credible, and reach a person, "
  "without leaving the page to guess?")
w()
w("Scoring is mechanical. Every point is tied to something present or absent in the "
  "file, so the same page scores the same twice and a grade change means the page "
  "changed. Judgement enters only in choosing the dimensions and their weights, both "
  "stated in the script rather than buried.")
w()
w("**Pages are graded against the role they play.** A keyed participant surface is not "
  "failing because it has no enterprise call to action; it is not for that audience. "
  "Roles are assigned from measurable properties, never guessed.")
w()

byrole = {}
for row in rows:
    byrole.setdefault(row[1], []).append(row)

w("## Summary by role")
w()
w("| Role | Pages | Mean score | A/A- | B+/B | C+/C | D/F |")
w("|---|---|---|---|---|---|---|")
for r in sorted(byrole, key=lambda k: ORDER.get(k, 9)):
    v = byrole[r]
    mean = sum(x[3] for x in v) / len(v)
    def n(gs): return sum(1 for x in v if x[2] in gs)
    w("| %s | %d | %.1f%% | %d | %d | %d | %d |"
      % (r, len(v), mean, n(("A", "A-")), n(("B+", "B")), n(("C+", "C")), n(("D", "F"))))
w()

for r in sorted(byrole, key=lambda k: ORDER.get(k, 9)):
    w("## %s (%d pages)" % (r.replace("-", " ").title(), len(byrole[r])))
    w()
    w("| Page | Grade | Score | Inbound | Failed dimensions |")
    w("|---|---|---|---|---|")
    for p, role_, g, pct, earned, total, pts in byrole[r]:
        fails = [lbl + (" (%s)" % note if note else "")
                 for lbl, e, t, note in pts if e == 0]
        w("| `%s` | **%s** | %.0f%% | %d | %s |"
          % (p, g, pct, INBOUND[p], "; ".join(fails) if fails else "none"))
    w()

allmean = sum(x[3] for x in rows) / len(rows)
commercial = byrole.get("commercial", [])
cmean = sum(x[3] for x in commercial) / len(commercial) if commercial else 0

w("## Summary Block")
w()
w("```")
w("JRS PAGE GRADE, ENTERPRISE TRACK READINESS")
w("")
w("  pages graded            %d" % len(rows))
w("  site mean score         %.1f%%" % allmean)
w("  COMMERCIAL mean score   %.1f%%  (%d pages)" % (cmean, len(commercial)))
w("")
w("  commercial page grades")
for p, role_, g, pct, e, t, pts in commercial:
    w("    %-28s %-3s %5.1f%%" % (os.path.basename(p), g, pct))
w("")
worst = [x for x in rows if x[2] in ("D", "F")]
w("  pages graded D or F     %d" % len(worst))
for p, role_, g, pct, e, t, pts in worst[:12]:
    w("    %-34s %-3s %5.1f%%" % (p, g, pct))
w("```")

out = "\n".join(L) + "\n"
print(out)
if "--md" in sys.argv:
    dest = sys.argv[sys.argv.index("--md") + 1]
    io.open(dest, "w", encoding="utf-8").write(out)
    print("wrote %s" % dest)
