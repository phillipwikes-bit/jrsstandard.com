#!/usr/bin/env python3
"""Retire the public founder-delivered service layer (Option A).

The retirement decision already exists in this repository: api/_offer-config.js
marks audit, governance and calibration `retired: true` as of 2026-08-26, and
scripts/check_zero_drift.py::check_revenue_model_is_licensing_only asserts that
retirement holds at the config and checkout layer. What was never retired is the
public HTML surface: a fee catalogue with turnarounds, three intake pages
offering a scoping call, four sitemap entries and twelve footer links routing
readers into all of it.

This closes that gap and nothing else. It is archival, not destructive: no page
is deleted, no research content is touched, and every page keeps its text. What
is removed is the funnel, which is the inbound links, the sitemap entries, the
search-index invitation and the call-to-action wording.
"""

import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

SERVICE_PAGES = [
    "engagement.html",
    "audit-request.html",
    "governance-request.html",
    "calibration-request.html",
]

# Pages carrying footer links into the retired layer.
FOOTER_PAGES = ["enterprise.html", "pilot.html", "review-engine.html", "security.html"]

FOOTER_LINKS = [
    '<a href="audit-request.html" class="footer-link">Record Review</a>',
    '<a href="governance-request.html" class="footer-link">Governance Review</a>',
    '<a href="calibration-request.html" class="footer-link">Benchmark Calibration</a>',
]

# Research surfaces that must come out of this run byte-identical.
RESEARCH_UNTOUCHABLE = [
    "research.html",
    "research-summary.html",
    "results.html",
    "finding.html",
    "evidence-ledger.html",
    "datasets.html",
    "codebook.html",
    "questions.html",
    "methodology.html",
    "index.html",
    "training.html",
]

RETIREMENT_NOTICE = """<!-- SERVICE LAYER RETIRED 2026-09-04. api/_offer-config.js marked these
     offers retired: true on 2026-08-26 and the checkout layer stopped serving
     them, but this page stayed indexed, linked from four footers and listed in
     the sitemap, so it went on reading as a live catalogue. The page is kept
     rather than deleted so an existing client or a forwarded link still
     resolves to an intelligible record of what was offered. -->
<div style="border:1px solid var(--review-text);background:rgba(212,160,85,.06);padding:16px 18px;margin:0 0 26px;max-width:680px;">
 <div style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--review-text);margin-bottom:8px;">Closed to new requests</div>
 <p style="font-size:13.5px;color:var(--muted);line-height:1.7;margin:0 0 8px;">These reviews are no longer offered. JRS is maintained as an independently usable methodology and an intellectual-property asset, not as a review service, and nothing on this page is open for a new request.</p>
 <p style="font-size:13.5px;color:var(--muted);line-height:1.7;margin:0;">The methodology, the field guides, the reviewer training and the simulations remain free and open, and the commercial pathways that remain are licensing of the <a href="review-engine.html" style="color:var(--accent);">JRS Review Engine</a>, technical integration, and acquisition: <a href="enterprise.html#enterprise-inquiry" style="color:var(--accent);">enterprise inquiry</a>.</p>
</div>
"""

# (file, old, new, expected count)
EDITS = []

# 1. Search engines: stop inviting indexation of the retired layer.
for page in SERVICE_PAGES:
    EDITS.append((page,
                  '<meta name="robots" content="index,follow">',
                  '<meta name="robots" content="noindex,nofollow">',
                  1))

# 2. The scoping-call offer, the last live founder-service call to action.
for page in ["audit-request.html", "governance-request.html", "calibration-request.html"]:
    EDITS.append((page,
                  "Prefer an invoice, a purchase order, or a scoping call first? Email",
                  "This review is closed to new requests. For licensing, technical integration or acquisition, email",
                  1))

# 3. engagement.html: the catalogue's action column.
EDITS.append(("engagement.html", "<td>Scope it</td>", "<td>Closed</td>", 3))

# 4. org-pilot.html: the one outward link from a live public page.
EDITS.append(("org-pilot.html",
              ' <a href="engagement.html">Engagement terms</a>',
              "",
              1))

# 5. terms.html: date-scope the clauses that govern the retired engagements.
#    Nothing else in the document is touched: ownership, confidentiality,
#    liability and the non-establishment clause all stand unchanged.
EDITS.append(("terms.html",
              "2. What an engagement is</h2>",
              "2. What an engagement is</h2>",
              1))  # anchor assertion only, no text change

FOOTER_LINK_PAGES = FOOTER_PAGES


def fail(msg):
    print("REFUSED: " + msg)
    sys.exit(1)


def main():
    before = {}
    paths = set(SERVICE_PAGES + FOOTER_PAGES + ["org-pilot.html", "terms.html", "sitemap.xml"])
    for name in sorted(paths | set(RESEARCH_UNTOUCHABLE)):
        p = ROOT / name
        if not p.exists():
            fail("missing file: " + name)
        before[name] = p.read_text(encoding="utf-8")

    text = dict(before)
    applied = []

    # ── Exact-string edits ────────────────────────────────────────────────
    for name, old, new, count in EDITS:
        found = text[name].count(old)
        if found != count:
            fail("%s: expected %d occurrence(s) of %r, found %d"
                 % (name, count, old[:60], found))
        if old != new:
            text[name] = text[name].replace(old, new)
            applied.append("%s: %d x %r" % (name, count, old[:52]))

    # ── Footer links out of the retired layer ─────────────────────────────
    for name in FOOTER_LINK_PAGES:
        for link in FOOTER_LINKS:
            # Absorb one leading newline and its indentation so no blank gap is
            # left in the footer markup.
            pat = re.compile(r"\n\s*" + re.escape(link))
            n = len(pat.findall(text[name]))
            if n != 1:
                fail("%s: expected 1 footer link %r, found %d" % (name, link[:46], n))
            text[name] = pat.sub("", text[name], count=1)
        applied.append("%s: removed 3 footer links into the retired layer" % name)

    # ── Retirement notice at the top of each retired page ─────────────────
    for name in SERVICE_PAGES:
        m = re.search(r'(<main[^>]*>\s*)', text[name])
        if not m:
            fail(name + ": no <main> element to anchor the notice")
        if "SERVICE LAYER RETIRED" in text[name]:
            fail(name + ": retirement notice already present")
        text[name] = text[name][:m.end()] + "\n" + RETIREMENT_NOTICE + text[name][m.end():]
        applied.append("%s: inserted the retirement notice" % name)

    # ── sitemap.xml: drop the four retired pages, keep terms.html ─────────
    sm = text["sitemap.xml"]
    for page in SERVICE_PAGES:
        pat = re.compile(
            r"\s*<url>(?:(?!</url>).)*?"
            + re.escape("https://www.jrsstandard.com/" + page)
            + r"(?:(?!</url>).)*?</url>", re.S)
        n = len(pat.findall(sm))
        if n != 1:
            fail("sitemap.xml: expected 1 entry for %s, found %d" % (page, n))
        sm = pat.sub("", sm, count=1)
    text["sitemap.xml"] = sm
    applied.append("sitemap.xml: removed 4 retired-page entries, terms.html kept")

    # ══ GATES ════════════════════════════════════════════════════════════
    # G1. Research surfaces byte-identical.
    for name in RESEARCH_UNTOUCHABLE:
        if text[name] != before[name]:
            fail("research/methodology surface was modified: " + name)

    # G2. No public page still links into the retired layer.
    for name in sorted(set(list(paths) + RESEARCH_UNTOUCHABLE)):
        if name in SERVICE_PAGES or name == "sitemap.xml":
            continue
        for page in SERVICE_PAGES:
            if 'href="%s"' % page in text[name] or 'href="/%s"' % page in text[name]:
                fail("%s still links into the retired layer: %s" % (name, page))

    # G3. Retired pages are all noindex and all carry the notice.
    for name in SERVICE_PAGES:
        if '<meta name="robots" content="noindex,nofollow">' not in text[name]:
            fail(name + ": not noindex")
        if "SERVICE LAYER RETIRED" not in text[name]:
            fail(name + ": notice missing")

    # G4. The funnel wording is gone.
    for name in SERVICE_PAGES:
        if "scoping call" in text[name]:
            fail(name + ": scoping call offer survives")
        if "Scope it" in text[name]:
            fail(name + ": Scope it call to action survives")

    # G5. Sitemap no longer lists the retired pages; terms.html still does.
    for page in SERVICE_PAGES:
        if page in text["sitemap.xml"]:
            fail("sitemap.xml still lists " + page)
    if "terms.html" not in text["sitemap.xml"]:
        fail("sitemap.xml lost terms.html")

    # G6. Commercial pathways survive on the pages that carry them.
    for name, needles in {
        "enterprise.html": ["Platform licence", "Annual, per organisation",
                            "Review Engine API", "Acquisition",
                            "Make a technical integration inquiry"],
        "review-engine.html": ["Licensing", "Acquisition"],
        "index.html": ["Commercial Inquiries", "Acquisition"],
    }.items():
        for needle in needles:
            if needle not in text[name]:
                fail("%s: commercial pathway lost: %r" % (name, needle))

    # G7. Practitioner resources survive.
    for needle in ["investigator-guides.html", "training.html", "simulations.html",
                   "research.html"]:
        if needle not in text["index.html"]:
            fail("index.html: practitioner resource link lost: " + needle)

    # G8. No new consulting promise introduced anywhere.
    banned_new = ["collaborative implementation", "we will implement",
                  "managed deployment", "custom scoping", "founder-led"]
    for name in text:
        if name == "sitemap.xml":
            continue
        for b in banned_new:
            if b in text[name].lower() and b not in before[name].lower():
                fail("%s: introduced banned phrase %r" % (name, b))

    # G9. No sitemap URL now points at a file that does not exist.
    for loc in re.findall(r"<loc>https://www\.jrsstandard\.com/([^<]*)</loc>",
                          text["sitemap.xml"]):
        if not loc or loc.endswith("/"):
            continue
        if not (ROOT / loc).exists():
            fail("sitemap.xml points at a missing file: " + loc)

    # ── Write ─────────────────────────────────────────────────────────────
    changed = [n for n in text if text[n] != before[n]]
    if not changed:
        fail("no change applied")
    for name in changed:
        (ROOT / name).write_text(text[name], encoding="utf-8")

    print("APPLIED\n")
    for line in applied:
        print("  " + line)
    print("\n  files changed: %d" % len(changed))
    for name in sorted(changed):
        print("    %-28s %7d -> %7d bytes"
              % (name, len(before[name].encode()), len(text[name].encode())))
    print("\n  research surfaces asserted byte-identical: %d"
          % len(RESEARCH_UNTOUCHABLE))


if __name__ == "__main__":
    main()
