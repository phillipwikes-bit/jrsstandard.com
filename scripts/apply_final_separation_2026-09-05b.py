#!/usr/bin/env python3
"""Final surgical remediation: three confirmed contradictions plus the
duplicate-content synchronisation that caused two of them.

  1. index.html and jrsstandard.html both offer "Optional implementation
     support available upon request". Both pages are indexable and in the
     sitemap. The clause is removed; nothing replaces it, because inventing a
     substitute offer is exactly what the strategy forbids.

  2. jrsstandard.html still carries "Discussions are limited to workflow
     adaptation, reviewer onboarding, and implementation questions", the exact
     sentence corrected on index.html on 2026-09-04. It takes the wording
     already live on index.html.

  3. supported.html heads a section "Become a certified reviewer". The page
     already says "certificate of completion", which is permitted; the heading
     is not.

  4. Duplicate-content synchronisation. jrsstandard.html is systematically
     behind index.html on the approved 2026-09-04 corrections: "Begin
     implementation", "Records as they commonly arrive" and "Conditions
     commonly present at intake" were all corrected there and left here. They
     are brought into line, because leaving them is what produced findings 1
     and 2 in the first place.
"""

import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

OFFER = "Downloadable PDF &middot; Gumroad delivery &middot; Optional implementation support available upon request"
OFFER_NEW = "Downloadable PDF &middot; Gumroad delivery"

DISCUSSIONS_OLD = ("Organizations evaluating phased implementation approaches may request "
                   "additional operational information. Discussions are limited to workflow "
                   "adaptation, reviewer onboarding, and implementation questions related to "
                   "existing documentation-review environments.")
DISCUSSIONS_NEW = ("Organizations evaluating phased implementation approaches work from the "
                   "published materials. The kit, the training modules and the field guides are "
                   "written to be applied directly, and nothing here creates a consulting or "
                   "implementation engagement.")

EDITS = [
    # ── 1. the implementation-support offer, both pages ──
    ("index.html", OFFER, OFFER_NEW, 1),
    ("jrsstandard.html", OFFER, OFFER_NEW, 1),

    # ── 2. the founder-service discussions sentence ──
    ("jrsstandard.html", DISCUSSIONS_OLD, DISCUSSIONS_NEW, 1),

    # ── 3. the positive credential heading ──
    ("supported.html", "<h2>Become a certified reviewer</h2>",
     "<h2>Train as a JRS reviewer</h2>", 1),

    # ── 4. duplicate-content synchronisation with index.html ──
    ("jrsstandard.html", "Begin implementation", "Begin internal use", 1),
    ("jrsstandard.html", "Records as they commonly arrive",
     "Records as they arrive for review", 1),
    ("jrsstandard.html", "Conditions commonly present at intake",
     "Conditions that can be present at intake", 1),
]

TARGETS = sorted({e[0] for e in EDITS})

# Research-sensitive files. If any of these differs, the run is refused.
RESEARCH_PROTECTED = ["research.html", "research-summary.html", "pilot.html",
                      "results.html", "finding.html", "evidence-ledger.html",
                      "datasets.html", "codebook.html", "questions.html"]

# Retired layer must stay retired.
RETIRED = ["engagement.html", "audit-request.html", "governance-request.html",
           "calibration-request.html", "terms.html"]

# Commercial markers that must not move.
COMMERCIAL = {
    "index.html": ["Commercial Inquiries", "licensing, technology integration, or acquisition",
                   "engine-licence", "oem-embed", 'value="acquisition"',
                   "is the methodology", "is a technical implementation of that logic"],
    "jrsstandard.html": ["JRS", "review conditions"],
    "supported.html": ["certificate of completion", "Start the free training"],
}

# Disclaimers denying certification must survive untouched.
DISCLAIMERS = {
    "supported.html": ["certificate of completion"],
}

BANNED_NEW = ["implementation support available", "Discussions are limited to",
              "certified reviewer", "accredited reviewer", "scoping call",
              "Become a certified", "managed deployment", "founder-led"]


def fail(msg):
    print("REFUSED: " + msg)
    sys.exit(1)


def main():
    watch = sorted(set(TARGETS) | set(RESEARCH_PROTECTED) | set(RETIRED))
    before = {}
    for name in watch:
        p = ROOT / name
        if not p.exists():
            fail("missing file: " + name)
        before[name] = p.read_text(encoding="utf-8")

    text = dict(before)
    applied = []
    for name, old, new, count in EDITS:
        found = text[name].count(old)
        if found != count:
            fail("%s: expected %d occurrence(s) of %r, found %d"
                 % (name, count, old[:70], found))
        text[name] = text[name].replace(old, new)
        applied.append("%s: %r" % (name, old[:58]))

    # ══ GATES ══════════════════════════════════════════════════════════
    # G1. The three confirmed contradictions are gone.
    for name in ("index.html", "jrsstandard.html"):
        if "implementation support available upon request" in text[name]:
            fail(name + ": implementation-support offer survives")
    if "Discussions are limited to" in text["jrsstandard.html"]:
        fail("jrsstandard.html: founder-service discussions sentence survives")
    if "Become a certified" in text["supported.html"]:
        fail("supported.html: positive credential heading survives")
    if "certified reviewer" in text["supported.html"].lower():
        fail("supported.html: 'certified reviewer' survives")

    # G2. Duplicate synchronisation actually landed.
    for s in ("Begin internal use", "Records as they arrive for review",
              "Conditions that can be present at intake"):
        if s not in text["jrsstandard.html"]:
            fail("jrsstandard.html: sync string absent: %r" % s)

    # G3. Nothing banned introduced.
    for name in TARGETS:
        for b in BANNED_NEW:
            if text[name].count(b) > before[name].count(b):
                fail("%s: introduced banned wording %r" % (name, b))

    # G4. Research files byte-identical.
    for name in RESEARCH_PROTECTED:
        if text[name] != before[name]:
            fail("research-protected file modified: " + name)

    # G5. Retired layer byte-identical.
    for name in RETIRED:
        if text[name] != before[name]:
            fail("retired-layer file modified: " + name)

    # G6. Commercial and disclaimer markers unchanged.
    for name, needles in COMMERCIAL.items():
        for needle in needles:
            if before[name].count(needle) != text[name].count(needle):
                fail("%s: commercial marker changed: %r" % (name, needle))
    for name, needles in DISCLAIMERS.items():
        for needle in needles:
            if needle not in text[name]:
                fail("%s: disclaimer lost: %r" % (name, needle))

    # G7. The change must be small.
    for name in TARGETS:
        delta = abs(len(text[name].encode()) - len(before[name].encode()))
        if delta > 400:
            fail("%s: change of %d bytes is larger than surgical" % (name, delta))

    changed = [n for n in text if text[n] != before[n]]
    if not changed:
        fail("no change applied")
    for name in changed:
        (ROOT / name).write_text(text[name], encoding="utf-8")

    print("APPLIED\n")
    for line in applied:
        print("  " + line)
    print()
    for name in sorted(changed):
        print("  %-24s %7d -> %7d bytes" % (name, len(before[name].encode()),
                                            len(text[name].encode())))


if __name__ == "__main__":
    main()
