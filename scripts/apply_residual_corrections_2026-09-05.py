#!/usr/bin/env python3
"""Three residual corrections from the independent verification audit.

  1. terms.html section 6 still read "An NDA on your paper is accepted and can
     be signed before scoping" in the present tense, implying a new engagement
     could still begin. It is put in the past and scoped to engagements agreed
     before 4 September 2026. The rest of the confidentiality provision, and
     every other contractual protection, is untouched.

  2. pilot.html lost the word "provisional" when the obsolete closing clause
     that carried it was removed. Explicit provisional framing is restored at
     both statements, tied to completion of analysis rather than to the study
     still being open. No figure, finding, method or limitation changes.

  3. audit-request.html, governance-request.html and calibration-request.html
     kept the intake mechanics around the replaced sentence: a "How to start"
     heading, a promise of scope and an invoice in one reply, a present-tense
     description of sending records and agreeing de-identification, a mailto
     subject naming the retired service, a lead-in offering the engagement
     page, and a status strip calling this "a paid test service being offered
     for the first time". All of it is replaced with a closure statement that
     promises nothing and points at licensing, technical integration and
     acquisition.

The last two items on that list were found during this pass rather than named
in the brief; both are intake or offer language on the same pages and are
reported in the run output.
"""

import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

REQUEST_PAGES = {
    "audit-request.html": "AI%20Documentation%20Defensibility%20Review",
    "governance-request.html": "AI%20Governance%20Documentation%20Review",
    "calibration-request.html": "Benchmark%20Access%20and%20Calibration",
}

EDITS = []

# ══ 1. terms.html section 6 ══
EDITS.append((
    "terms.html",
    "An NDA on your paper is accepted and can be signed before scoping. This survives the engagement.",
    "For engagements agreed in writing before 4 September 2026, an NDA provided by the client could be accepted and signed before the scope was agreed. This survives the engagement.",
    1))

# ══ 2. pilot.html, both status statements ══
EDITS.append((
    "pilot.html",
    "clearing the pre-registered threshold. The operational validation study closed on 4 September 2026; these figures carry the limitations stated here.",
    "clearing the pre-registered threshold. The operational validation study closed on 4 September 2026. These figures remain provisional pending completion of analysis and should be read against the methodological limitations stated here.",
    1))

EDITS.append((
    "pilot.html",
    "Figures current as of 5 August 2026. The operational validation study closed on 4 September 2026; these figures carry the limitations stated here, and analysis continues. Manuscript in preparation.",
    "Figures current as of 5 August 2026. The operational validation study closed on 4 September 2026. These figures remain provisional pending completion of analysis and should be read against the methodological limitations stated here. Manuscript in preparation.",
    1))

# ══ 3. the three request pages ══
for page, subject in REQUEST_PAGES.items():
    # Lead-in that offered the engagement page.
    EDITS.append((
        page,
        "Procurement or counsel need the fee basis, data handling and deliverable ownership on one page? That is how an engagement works.",
        "The fee basis, data handling and deliverable ownership that applied to these engagements are recorded on the engagement terms page, which is retained for the same historical purpose as this one.",
        1))

    # Heading.
    EDITS.append((page, "<h2>How to start</h2>",
                  "<h2>Status of this request pathway</h2>", 1))

    # The intake paragraph, including the mailto subject.
    EDITS.append((
        page,
        'This review is closed to new requests. For licensing, technical integration or acquisition, email <a href="mailto:info@jrsstandard.com?subject=%s">info@jrsstandard.com</a> and you will get scope and an invoice in one reply.</p>' % subject,
        'This founder-delivered service is closed to new requests. This page is retained for historical reference only. For licensing, technical integration or acquisition, use the <a href="enterprise.html#enterprise-inquiry">enterprise inquiry</a> or email <a href="mailto:info@jrsstandard.com?subject=JRS%20inquiry">info@jrsstandard.com</a>.</p>',
        1))

    # The present-tense record-handling promise.
    EDITS.append((
        page,
        "<p>There is no form on this page and nothing to upload here. <strong>Scope and turnaround are agreed in writing before any record is sent</strong>, and de-identification is agreed at the same time.</p>",
        "<p>There is no form on this page and nothing to upload here. No records are accepted, no scope is agreed and no work is undertaken through this page.</p>",
        1))

    # The status strip, which still called this a paid service on offer.
    EDITS.append((
        page,
        "<strong>Where this stands.</strong> JRS is under operational validation. <strong>Market validation is in progress and commercial demand has not yet been established.</strong> Current offers are being tested through controlled market experiments. This is a paid test service being offered for the first time, not an established product, and no claim of proven effectiveness is made.",
        "<strong>Where this stands.</strong> JRS is under operational validation. <strong>This service is closed and is no longer offered.</strong> While it was open it was a paid test service offered for the first time, not an established product, and no claim of proven effectiveness was made then or is made now.",
        1))

# Contractual and research content that must survive.
TERMS_INVARIANTS = [
    "Your material, your identity as a client, and the content of any finding are treated as confidential",
    "This survives the engagement",
    "It is not legal advice", "does not establish compliance",
    "The written finding is yours outright on delivery",
    "limited to the fee paid for that engagement",
    "No sub-processors are engaged",
    "never stored, logged to public research sets, or used for model training",
    "Status of founder-delivered engagements",
]

PILOT_INVARIANTS = [
    "83.9%", "72.7 to 95.1", "sensitivity 87.0%", "specificity 80.7%",
    "Gwet's AC1 0.74", "0.62", "384 graded reads", "pre-registered threshold",
    "Not real-world validation", "Manuscript in preparation",
    "closed on 4 September 2026", "interim",
]

BANNED_NEW = [
    "scoping call", "you will get scope", "an invoice in one reply",
    "turnaround", "before any record is sent", "de-identification is agreed",
    "How to start", "being offered for the first time,",
]


def fail(msg):
    print("REFUSED: " + msg)
    sys.exit(1)


def main():
    targets = sorted({e[0] for e in EDITS})
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
        if found != count:
            fail("%s: expected %d occurrence(s) of %r, found %d"
                 % (name, count, old[:70], found))
        text[name] = text[name].replace(old, new)
        applied.append("%s: %r" % (name, old[:56]))

    # ── Gates ────────────────────────────────────────────────────────────
    t = text["terms.html"]
    if "is accepted and can be signed before scoping" in t:
        fail("terms.html: present-tense NDA clause survives")
    if "an NDA provided by the client could be accepted" not in t:
        fail("terms.html: historical NDA wording absent")
    for needle in TERMS_INVARIANTS:
        if needle not in t:
            fail("terms.html: preserved provision lost: %r" % needle)

    p = text["pilot.html"]
    if p.count("remain provisional pending completion of analysis") != 2:
        fail("pilot.html: provisional framing not restored at both statements")
    if "until the study closes" in p or "expected 14 August 2026" in p:
        fail("pilot.html: reopened the study")
    for needle in PILOT_INVARIANTS:
        if before["pilot.html"].count(needle) != p.count(needle):
            fail("pilot.html: research content changed: %r (%d -> %d)"
                 % (needle, before["pilot.html"].count(needle), p.count(needle)))

    for page, subject in REQUEST_PAGES.items():
        s = text[page]
        if "How to start" in s:
            fail(page + ": intake heading survives")
        if "Status of this request pathway" not in s:
            fail(page + ": archival heading absent")
        if "closed to new requests. This page is retained for historical reference only" not in s:
            fail(page + ": closure statement absent")
        if subject in s:
            fail(page + ": retired-service mailto subject survives")
        for promise in ("you will get scope", "an invoice in one reply",
                        "Scope and turnaround are agreed", "de-identification is agreed",
                        "being offered for the first time,"):
            if promise in s:
                fail("%s: promise survives: %r" % (page, promise))
        # The legitimate pathways must be reachable from the page.
        if 'href="enterprise.html#enterprise-inquiry"' not in s:
            fail(page + ": lost the enterprise inquiry pathway")
        # Retirement plumbing must be untouched.
        if '<meta name="robots" content="noindex,nofollow">' not in s:
            fail(page + ": noindex lost")
        if "SERVICE LAYER RETIRED" not in s:
            fail(page + ": retirement notice lost")

    # Nothing this pass writes may reintroduce banned wording anywhere.
    for name in targets:
        for b in BANNED_NEW:
            if text[name].count(b) > before[name].count(b):
                fail("%s: introduced banned wording %r" % (name, b))

    for name in targets:
        if text[name] == before[name]:
            fail(name + ": no change applied")
        (ROOT / name).write_text(text[name], encoding="utf-8")

    print("APPLIED\n")
    for line in applied:
        print("  " + line)
    print()
    for name in targets:
        print("  %-28s %7d -> %7d bytes"
              % (name, len(before[name].encode()), len(text[name].encode())))
    print("\n  Two items were found during this pass rather than named in the brief,")
    print("  both intake or offer language on the same three pages:")
    print("    - the lead-in 'Procurement or counsel need the fee basis ...'")
    print("    - the status strip 'a paid test service being offered for the first time'")


if __name__ == "__main__":
    main()
