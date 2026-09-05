#!/usr/bin/env python3
"""Final architectural separation: four surgical corrections.

  1. The three retired request pages still carried a present-tense offer
     specification below their closure notice: a What is read / Turnaround /
     Cost / Capacity table, a "What you receive" deliverables list, and a meta
     description reading "Scope, price and turnaround agreed in writing before
     any record is sent". Every prior pass missed it because none of the
     strings tested matched that block. The tables and lists are kept as a
     historical record and put in the past tense, the meta descriptions become
     archival, and robots becomes noindex,follow so the pages stay unindexed
     while their outbound links to the live pathways are still followed.

  2. terms.html governs engagements closed to new requests, so it is taken out
     of the index and out of the sitemap. It is not deleted and stays reachable
     by URL; no substantive legal content changes.

  3. enterprise.html and review-engine.html name the Review Engine repeatedly
     without ever saying what it is relative to the standard. The two-sentence
     hierarchy already live on the homepage is placed on both, once, near the
     top, where an integrator or acquirer lands.

  4. jrsstandard.html carries two unsupported generalisations, one of them the
     uncorrected twin of a sentence already fixed on index.html. Both are put
     in conditional form. Nothing else on that page is touched.
"""

import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

REQUEST_PAGES = ["audit-request.html", "governance-request.html",
                 "calibration-request.html"]

HIERARCHY = """<!-- JRS / REVIEW ENGINE HIERARCHY. Added 2026-09-05. Both assets are named
     repeatedly on this page and the distinction between them was stated only
     on the homepage, so a reader who lands here from a search or a forwarded
     link could not learn it. Two sentences, once, nothing else. -->
<div style="margin:0 0 26px;border-left:2px solid var(--accent-dim);padding:2px 0 2px 16px;max-width:660px;">
 <p style="font-size:13px;color:var(--muted);line-height:1.7;margin:0 0 6px;"><b style="color:var(--text);">JRS, the Justification Review Standard, is the methodology.</b> It is the review logic and the documentation review standard: a set of conditions applied to a record, inside whatever workflow an organisation already runs.</p>
 <p style="font-size:13px;color:var(--muted);line-height:1.7;margin:0;"><b style="color:var(--text);">The JRS Review Engine is a technical implementation of that logic.</b> It applies the defined conditions to one record through an API and returns a structured determination. The standard is usable without the engine; the engine exists so a platform can operationalise the same conditions in code.</p>
</div>
"""

EDITS = []

# ── 1. Retired request pages ──────────────────────────────────────────
for page in REQUEST_PAGES:
    EDITS.append((page,
                  '<meta name="robots" content="noindex,nofollow">',
                  '<meta name="robots" content="noindex,follow">', 1))
    EDITS.append((page, "<td>What is read</td>", "<td>What was read</td>", 1))
    EDITS.append((page, "<td>Turnaround</td>", "<td>Turnaround, while open</td>", 1))
    EDITS.append((page,
                  '<tr><td>Cost</td><td><b style="color:var(--accent)">No charge.</b> This read is part of a Review Engine evaluation, not a separate purchase. Capacity is limited and scope is agreed in writing first</td></tr>',
                  '<tr><td>Cost</td><td><b style="color:var(--accent)">No charge.</b> While this pathway was open the read formed part of a Review Engine evaluation rather than a separate purchase, capacity was limited, and scope was agreed in writing first.</td></tr>',
                  1))
    EDITS.append((page, "<td>Written for</td>", "<td>Was written for</td>", 1))
    EDITS.append((page, "<h2>What you receive</h2>",
                  "<h2>What the review covered</h2>", 1))

# Deliverables lists, one per page.
EDITS.append(("audit-request.html",
  "<li>A defensibility assessment for each of the five records</li>",
  "<li>A defensibility assessment for each of the five records</li>", 1))

# Meta descriptions: archival, no marketing.
META = {
 "audit-request.html":
   'Can your records still explain themselves? Scope, price and turnaround agreed in writing before any record is sent.',
 "governance-request.html":
   'Does your standard produce records that survive review? Scope, price and turnaround agreed in writing before any record is sent.',
 "calibration-request.html":
   'What did you test your detection claim against? Scope, price and turnaround agreed in writing before any record is sent.',
}
ARCHIVAL_META = ("Historical information about a founder-delivered JRS review "
                 "pathway that is closed to new requests.")
for page, old in META.items():
    EDITS.append((page, old, ARCHIVAL_META, None))  # count resolved at runtime

# ── 2. terms.html ─────────────────────────────────────────────────────
EDITS.append(("terms.html",
              '<meta name="robots" content="index,follow">',
              '<meta name="robots" content="noindex,follow">', 1))

# ── 3. Hierarchy on the two commercial entry pages ────────────────────
HIER_ANCHORS = {
 "enterprise.html":
   '<div class="btn-row" style="margin-top:0;">\n <a href="#enterprise-inquiry" class="btn btn-primary">Make a technical integration inquiry &rarr;</a>',
 "review-engine.html":
   '<div class="btn-row" style="margin-top:0;">\n <a href="enterprise.html#enterprise-inquiry" class="btn btn-primary">Request a token &rarr;</a>',
}

# ── 4. jrsstandard.html prevalence ────────────────────────────────────
EDITS.append(("jrsstandard.html",
  "Most records are eventually read by someone who was not there.",
  "A record may eventually be read by someone who was not there.", 1))
EDITS.append(("jrsstandard.html",
  "Well-intentioned personnel working under normal operational conditions routinely produce records that become difficult to interpret, defend, or reconstruct during later review.",
  "Well-intentioned personnel working under normal operational conditions can produce records that become difficult to interpret, defend, or reconstruct during later review.",
  2))
EDITS.append(("jrsstandard.html",
  "well-intentioned personnel working under normal operational conditions routinely produce records that become difficult to interpret, defend, or reconstruct during later review.",
  "well-intentioned personnel working under normal operational conditions can produce records that become difficult to interpret, defend, or reconstruct during later review.",
  1))

# Research markers to compare before and after, per file.
RESEARCH_MARKERS = ["83.9%", "72.7 to 95.1", "87.0%", "80.7%", "Gwet", "0.739",
                    "0.623", "0.74", "0.62", "86.7%", "82.2 to 93.3",
                    "384 graded reads", "pre-registered threshold",
                    "closed on 4 September 2026", "provisional", "interim",
                    "Not real-world validation", "Manuscript in preparation",
                    "24-record", "held-out"]

COMMERCIAL_MARKERS = {
 "enterprise.html": ["Platform licence", "Annual, per organisation",
                     "Make a technical integration inquiry", "Review Engine API",
                     ">Acquisition", "Enterprise and licensing inquiry",
                     'id="pricing"'],
 "review-engine.html": ["Request a token", "OpenAPI 3.1", "sandbox"],
}

BANNED_NEW = ["scoping call", "you will get scope", "an invoice in one reply",
              "How to start", "book a call", "founder-led",
              "live-record onboarding", "managed deployment"]


def fail(msg):
    print("REFUSED: " + msg)
    sys.exit(1)


def main():
    targets = sorted({e[0] for e in EDITS} | set(HIER_ANCHORS) | {"sitemap.xml"})
    before = {}
    for name in targets:
        p = ROOT / name
        if not p.exists():
            fail("missing file: " + name)
        before[name] = p.read_text(encoding="utf-8")

    text = dict(before)
    applied = []

    for name, old, new, count in EDITS:
        found = text[name].count(old)
        if count is None:
            if found < 1:
                fail("%s: %r not found" % (name, old[:60]))
        elif found != count:
            fail("%s: expected %d occurrence(s) of %r, found %d"
                 % (name, count, old[:70], found))
        if old != new:
            text[name] = text[name].replace(old, new)
            applied.append("%s: %r" % (name, old[:52]))

    # sitemap: drop terms.html
    pat = re.compile(r"\s*<url>(?:(?!</url>).)*?"
                     + re.escape("https://www.jrsstandard.com/terms.html")
                     + r"(?:(?!</url>).)*?</url>", re.S)
    if len(pat.findall(text["sitemap.xml"])) != 1:
        fail("sitemap.xml: expected exactly 1 terms.html entry")
    text["sitemap.xml"] = pat.sub("", text["sitemap.xml"], count=1)
    applied.append("sitemap.xml: removed the terms.html entry")

    # hierarchy blocks
    for name, anchor in HIER_ANCHORS.items():
        if text[name].count(anchor) != 1:
            fail("%s: hierarchy anchor not unique" % name)
        if "JRS / REVIEW ENGINE HIERARCHY" in text[name]:
            fail("%s: hierarchy block already present" % name)
        text[name] = text[name].replace(anchor, HIERARCHY + anchor, 1)
        applied.append("%s: inserted the hierarchy block" % name)

    # ══ GATES ══════════════════════════════════════════════════════════
    for page in REQUEST_PAGES:
        s = text[page]
        if '<meta name="robots" content="noindex,follow">' not in s:
            fail(page + ": robots not noindex,follow")
        if ARCHIVAL_META not in s:
            fail(page + ": archival meta description absent")
        if "agreed in writing before any record is sent" in s:
            fail(page + ": active-service meta description survives")
        if "<td>What is read</td>" in s or "<h2>What you receive</h2>" in s:
            fail(page + ": present-tense offer spec survives")
        if "Capacity is limited and scope is agreed in writing first" in s:
            fail(page + ": present-tense capacity clause survives")
        for keep in ("Status of this request pathway",
                     "This founder-delivered service is closed to new requests",
                     "SERVICE LAYER RETIRED",
                     'href="enterprise.html#enterprise-inquiry"'):
            if keep not in s:
                fail("%s: lost required content %r" % (page, keep))
        if "<form" in s:
            fail(page + ": a form appeared")
        if page in text["sitemap.xml"]:
            fail(page + ": present in sitemap")

    t = text["terms.html"]
    if '<meta name="robots" content="noindex,follow">' not in t:
        fail("terms.html: robots not noindex,follow")
    if "terms.html" in text["sitemap.xml"]:
        fail("sitemap.xml: terms.html still listed")
    if t != before["terms.html"].replace(
            '<meta name="robots" content="index,follow">',
            '<meta name="robots" content="noindex,follow">'):
        fail("terms.html: something beyond the robots directive changed")

    for name, needles in COMMERCIAL_MARKERS.items():
        for needle in needles:
            if before[name].count(needle) != text[name].count(needle):
                fail("%s: commercial marker changed: %r" % (name, needle))
        for phrase in ("is the methodology", "is a technical implementation of that logic"):
            if phrase not in text[name]:
                fail("%s: hierarchy sentence missing: %r" % (name, phrase))

    # Research markers must not move on any touched file.
    for name in targets:
        for m in RESEARCH_MARKERS:
            if before[name].count(m) != text[name].count(m):
                fail("%s: research marker changed: %r (%d -> %d)"
                     % (name, m, before[name].count(m), text[name].count(m)))

    # No banned wording introduced.
    for name in targets:
        for b in BANNED_NEW:
            if text[name].count(b) > before[name].count(b):
                fail("%s: introduced banned wording %r" % (name, b))

    # jrsstandard.html: only the two targeted generalisations moved.
    j = text["jrsstandard.html"]
    if "routinely produce records that become difficult" in j:
        fail("jrsstandard.html: prevalence sentence survives")
    if "Most records are eventually read by someone who was not there" in j:
        fail("jrsstandard.html: prevalence sentence survives")
    if abs(len(j) - len(before["jrsstandard.html"])) > 40:
        fail("jrsstandard.html: change is larger than the two sentences")

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


if __name__ == "__main__":
    main()
