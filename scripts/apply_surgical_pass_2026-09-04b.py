#!/usr/bin/env python3
"""Surgical correction pass following the post-remediation audit.

Three corrections, nothing else:

  1. security.html carries the only surviving "Start an integration scoping
     call" on the public site. It becomes a technical integration inquiry,
     the wording already used twice on enterprise.html. The destination is
     unchanged because it already points at the enterprise inquiry anchor.

  2. terms.html is made unambiguously archival. Section 2 already carries a
     closure sentence; it is promoted to a status statement at the head of
     the section, and the four present-tense provisions in sections 1, 4, 7
     and 8 are scoped to engagements agreed before 4 September 2026. Legal
     meaning is preserved in every case: an obligation that was owed is
     still owed, it is simply stated as applying to pre-existing engagements.
     Sections 3, 5, 6, 9 and 10 are not touched.

  3. research.html and pilot.html state the study closes "expected 14 August
     2026", three weeks past. The authoritative status is that it closed on
     4 September 2026. Only status wording changes. No figure, no method, no
     limitation and no finding is altered, and nothing is added implying the
     analysis, the reporting or the programme has finished.

acquisition-9f3c2a7d4b.html carries the same obsolete statement and is
corrected for consistency; it is a private owner-facing surface and leaving a
wrong closure date on the page an acquirer reads would be a factual error.
"""

import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# (file, old, new, expected count)
EDITS = [

    # ══ CORRECTION 1 ══ security.html
    ("security.html",
     '<a href="enterprise.html#enterprise-inquiry" class="btn btn-primary">Start an integration scoping call &rarr;</a>',
     '<a href="enterprise.html#enterprise-inquiry" class="btn btn-primary">Make a technical integration inquiry &rarr;</a>',
     1),

    # ══ CORRECTION 2 ══ terms.html
    # Lede: say at the top what the document now is.
    ("terms.html",
     "<p>These govern paid record-defensibility engagements. <b>They are written to be read by your counsel</b>,",
     "<p>These govern paid record-defensibility engagements. <b>Those engagements were closed to new requests on 4 September 2026</b>, so this page is retained to govern engagements agreed in writing before that date rather than to offer new ones. <b>They are written to be read by your counsel</b>,",
     1),

    # Section 2: promote the closure to a status statement at the head of the
    # section, and scope the fee cross-reference, which now points at pages
    # that publish no fee.
    ("terms.html",
     "<p>A <b>structured read of documentation quality</b> against the five JRS review conditions and the seven documented failure modes, delivered as a written finding. Fees are fixed and agreed in writing before work begins. The current fee for each engagement is stated on that engagement's own page and is confirmed in the written scope you receive before anything is charged; the written scope governs. Turnaround is stated at scoping. There is no hourly rate, no retainer, and no scope variation clause, because scope is a fixed number of records. <b>These engagements were closed to new requests on 4 September 2026.</b> This section governs engagements agreed in writing before that date and is retained so those terms remain readable; the commercial pathways that remain open are licensing of the JRS Review Engine, technical integration, and acquisition.</p>",
     "<p><b>Status of founder-delivered engagements:</b> the engagements described in this section were closed to new requests on 4 September 2026. The provisions below remain applicable only to engagements agreed in writing before that date and are retained for the purpose of governing those pre-existing engagements. The commercial pathways that remain open are licensing of the JRS Review Engine, technical integration, and acquisition.</p><p>An engagement was a <b>structured read of documentation quality</b> against the five JRS review conditions and the seven documented failure modes, delivered as a written finding. Fees were fixed and agreed in writing before work began. For each pre-existing engagement the fee is the figure confirmed in the written scope received before anything was charged; the written scope governs. Turnaround was stated at scoping. There was no hourly rate, no retainer, and no scope variation clause, because scope was a fixed number of records.</p>",
     1),

    # Section 1: personal performance, scoped.
    ("terms.html",
     "trading as <b>JRS&#8482;</b>. Engagements are performed personally and are not subcontracted.",
     "trading as <b>JRS&#8482;</b>. For engagements agreed in writing before 4 September 2026, the work was performed personally and was not subcontracted.",
     1),

    # Section 4: the record-handling obligations, scoped without weakening
    # them. The data-protection sentences are left exactly as they are.
    ("terms.html",
     "<p>Records are supplied by you, de-identified to a standard agreed at scoping.",
     "<p>For pre-existing engagements, records were supplied by you, de-identified to a standard agreed at scoping.",
     1),

    # Section 7: payment, scoped.
    ("terms.html",
     "<p>Invoiced on agreement of scope. <b>Purchase orders accepted.</b> Terms are net 30 unless your procurement process requires otherwise, in which case they follow yours.",
     "<p>For pre-existing engagements, invoicing followed agreement of scope. <b>Purchase orders were accepted.</b> Terms are net 30 unless your procurement process requires otherwise, in which case they follow yours.",
     1),

    # Section 8: cancellation, scoped. The obligation itself is unchanged.
    ("terms.html",
     "<p>You may cancel before records are transmitted at <b>no charge</b>. After records are received and reading has begun, the fixed fee is payable in full, because the fee buys a read of a fixed set rather than time.</p>",
     "<p>For pre-existing engagements governed by these terms: cancellation before records were transmitted carried <b>no charge</b>. Once records were received and reading had begun, the agreed fee remains payable in full in accordance with the applicable written agreement, because the fee buys a read of a fixed set rather than time.</p>",
     1),

    # ══ CORRECTION 3 ══ study status
    ("research.html",
     "<b style=\"color:var(--text)\">Figures are current as of 5 August 2026 and remain provisional until the study closes, expected 14 August 2026.</b> Invited reviewers may still complete, which would change the counts and the point estimate. Every figure is recomputed at close. A manuscript reporting this result in full is in preparation.",
     "<b style=\"color:var(--text)\">Study status: the operational validation study closed on 4 September 2026.</b> Figures are current as of 5 August 2026 and carry the methodological and provisional limitations stated above. Analysis and reporting continue: a manuscript reporting this result in full is in preparation.",
     1),

    ("research.html",
     "these figures are provisional until the study closes and are recomputed at that point.",
     "these figures carry the provisional and methodological limitations recorded against each study; the operational validation study closed on 4 September 2026 and analysis continues.",
     1),

    ("pilot.html",
     "Figures current as of 5 August 2026 and provisional until the study closes, expected 14 August 2026. Manuscript in preparation.",
     "Figures current as of 5 August 2026. The operational validation study closed on 4 September 2026; these figures carry the limitations stated here, and analysis continues. Manuscript in preparation.",
     1),

    ("pilot.html",
     "clearing the pre-registered threshold. Provisional until the study closes.",
     "clearing the pre-registered threshold. The operational validation study closed on 4 September 2026; these figures carry the limitations stated here.",
     1),

    # Consistency on the private acquisition surface, which carries the same
    # obsolete statement.
    ("acquisition-9f3c2a7d4b.html",
     "The study closes on or about 14 August 2026; invited reviewers may still complete, so these counts are provisional and are recomputed at close.",
     "The operational validation study closed on 4 September 2026; these counts carry the provisional and methodological limitations recorded with them, and analysis continues.",
     1),
]

TARGETS = sorted({e[0] for e in EDITS})

# Research substance that must survive untouched, per file.
RESEARCH_INVARIANTS = {
    "research.html": ["83.9%", "72.7 to 95.1", "sensitivity 87.0%", "specificity 80.7%",
                      "Gwet's AC1 0.739", "0.623", "86.7%", "82.2 to 93.3",
                      "384 graded reads", "pre-registered threshold",
                      "independently verified", "Reviewers took part in a personal capacity",
                      "manuscript"],
    "pilot.html": ["83.9%", "72.7 to 95.1", "sensitivity 87.0%", "specificity 80.7%",
                   "Gwet's AC1 0.74", "0.62", "384 graded reads",
                   "pre-registered threshold", "Not real-world validation",
                   "Manuscript in preparation"],
}

# Contract provisions that must survive in terms.html.
TERMS_INVARIANTS = [
    "It is not legal advice", "does not establish compliance",
    "EU AI Act", "NIST AI RMF", "ISO/IEC 42001",
    "The written finding is yours outright on delivery",
    "No licence back is retained",
    "treated as confidential", "This survives the engagement",
    "limited to the fee paid for that engagement",
    "Nothing here limits liability that cannot be limited by law",
    "A later change to this page does not alter an engagement already agreed",
    "processed in ephemeral working memory",
    "never stored, logged to public research sets, or used for model training",
    "No sub-processors are engaged",
]

# Wording this pass must never introduce.
BANNED_NEW = [
    "scoping call", "implementation call", "book a call", "schedule a call",
    "collaborative scoping", "implementation consulting", "workflow consulting",
    "founder-led", "live-record onboarding", "managed deployment",
    # over-claiming on the closed study
    "final results", "results are conclusive", "analysis is complete",
    "research has ended", "development has ended", "final analysis",
]


def fail(msg):
    print("REFUSED: " + msg)
    sys.exit(1)


def main():
    before = {}
    for name in TARGETS:
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
        applied.append("%s: %r" % (name, old[:60]))

    # ══ GATES ══════════════════════════════════════════════════════════
    # G1. The scoping-call CTA is gone and the replacement is present.
    if "integration scoping call" in text["security.html"]:
        fail("security.html: scoping-call CTA survives")
    if "Make a technical integration inquiry" not in text["security.html"]:
        fail("security.html: replacement CTA absent")
    if 'href="enterprise.html#enterprise-inquiry"' not in text["security.html"]:
        fail("security.html: CTA destination lost")

    # G2. No banned wording introduced anywhere in this pass.
    for name in TARGETS:
        low_after, low_before = text[name].lower(), before[name].lower()
        for b in BANNED_NEW:
            if b in low_after and low_before.count(b) < low_after.count(b):
                fail("%s: introduced banned wording %r" % (name, b))

    # G3. terms.html reads as archival and keeps every preserved provision.
    t = text["terms.html"]
    if "Status of founder-delivered engagements" not in t:
        fail("terms.html: status statement missing")
    # Three explicit statements of the date (lede, section 1, section 2) plus
    # four "pre-existing engagements" scopings carry the archival framing.
    if t.count("4 September 2026") < 3:
        fail("terms.html: closure date not stated enough times to be unambiguous")
    if t.count("pre-existing engagement") < 3:
        fail("terms.html: present-tense provisions not scoped to pre-existing engagements")
    for needle in TERMS_INVARIANTS:
        if needle not in t:
            fail("terms.html: preserved provision lost: %r" % needle)
    for heading in ["1. Who you are contracting with", "2. What an engagement is",
                    "3. What an engagement is not", "4. Your records", "5. Ownership",
                    "6. Confidentiality", "7. Payment", "8. Cancellation",
                    "9. Liability", "10. Changes"]:
        if heading not in t:
            fail("terms.html: section lost: " + heading)

    # G4. Study status corrected everywhere, with no obsolete date left.
    for name in ("research.html", "pilot.html", "acquisition-9f3c2a7d4b.html"):
        if "expected 14 August 2026" in text[name] or "on or about 14 August 2026" in text[name]:
            fail(name + ": obsolete expected close date survives")
        if "until the study closes" in text[name]:
            fail(name + ": still says the study has not closed")
        if "closed on 4 September 2026" not in text[name]:
            fail(name + ": closure date not stated")

    # G5. Research substance untouched.
    for name, needles in RESEARCH_INVARIANTS.items():
        for needle in needles:
            if before[name].count(needle) != text[name].count(needle):
                fail("%s: research substance changed: %r (%d -> %d)"
                     % (name, needle, before[name].count(needle), text[name].count(needle)))

    # G6. No numeric figure anywhere in the touched research prose changed.
    for name in ("research.html", "pilot.html"):
        nb = re.findall(r"\d+\.\d+", before[name])
        na = re.findall(r"\d+\.\d+", text[name])
        if sorted(nb) != sorted(na):
            fail(name + ": a decimal figure changed")

    for name in TARGETS:
        if text[name] == before[name]:
            fail(name + ": no change applied")
        (ROOT / name).write_text(text[name], encoding="utf-8")

    print("APPLIED\n")
    for line in applied:
        print("  " + line)
    print()
    for name in TARGETS:
        print("  %-32s %7d -> %7d bytes"
              % (name, len(before[name].encode()), len(text[name].encode())))


if __name__ == "__main__":
    main()
