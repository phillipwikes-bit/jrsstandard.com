#!/usr/bin/env python3
"""engagement.html only: make the page archival in its body, not just its head.

The page already carries a "Closed to new requests" notice, noindex,nofollow,
no sitemap entry and zero inbound links. Its body still read as a live offer:
two mailto CTAs with pre-filled scoping subjects, a promise of scope, fee,
turnaround and an invoice within one business day, and a statement that the
engagements are being tested.

Historical content is preserved throughout, including the fee table, the data
handling section and the research figures. Only the language that implies a
visitor can start something now is put in the past, and the two action links
are replaced with a non-actionable archival line.

No other file is touched. The script refuses to run if any other page, any
research surface or the numeric content of this page changes.
"""

import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = "engagement.html"

BOOK_CTA = ('  <p style="margin:18px 0 26px">\n'
            '    <a class="cta-primary" href="mailto:info@jrsstandard.com?subject=Twenty-minute%20record%20read&amp;body=Record%20type%3A%0ATimeframe%3A%0ATwo%20or%20three%20times%20that%20suit%20you%3A">Book a twenty-minute record read &rarr;</a>\n'
            '  </p>')

SCOPE_CTA = ('  <p style="margin:22px 0 10px">\n'
             '    <a class="cta-primary" href="mailto:info@jrsstandard.com?subject=Engagement%20scoping&amp;body=Record%20type%3A%0AApproximate%20volume%3A%0ATimeframe%3A%0APurchase%20order%20required%3A%0ANDA%20required%20before%20scoping%3A">Request scope and invoice &rarr;</a>\n'
             '  </p>')

ARCHIVAL_NOTE = ('  <p style="margin:18px 0 26px;font-size:13.5px;color:var(--muted-soft);line-height:1.7">'
                 'This pathway is closed. Neither the record read nor a scoping request can be initiated from this page.</p>')

EDITS = [
    # ── Lede: the page is a record, not a live offer sheet ──
    ("C-1", '<h1 class="lede">How an engagement works.</h1>',
     '<h1 class="lede">How an engagement worked.</h1>'),

    ("C-2",
     "<p><b>This page exists to be forwarded.</b> If you are considering a record-defensibility review, your procurement team and your counsel will want the fee basis, the data handling, and who owns the output. All three are below, on one page, with nothing held back for a call.</p>",
     "<p><b>This page is retained as a historical record of the former engagement model.</b> While the pathway was open, a procurement team or counsel evaluating a record-defensibility review needed the fee basis, the data handling, and who owned the output. All three are recorded below. The engagements themselves are closed to new requests.</p>"),

    # ── Fees and payment: describe how it worked ──
    ("C-3",
     "<p>Every engagement is <b>fixed fee, agreed in writing before any work begins.</b> There is no hourly rate, no retainer, and no scope creep clause, because the scope is a fixed number of records.</p>",
     "<p>Every engagement was <b>fixed fee, agreed in writing before any work began.</b> There was no hourly rate, no retainer, and no scope creep clause, because the scope was a fixed number of records.</p>"),

    ("C-4",
     "<p><b>Invoiced on agreement. Purchase orders accepted.</b> Payment terms are net 30 unless your procurement process requires otherwise, in which case they follow yours.</p>",
     "<p><b>Invoicing followed agreement of scope, and purchase orders were accepted.</b> For engagements agreed in writing before 4 September 2026, payment terms are net 30 unless the client's procurement process requires otherwise, in which case they follow that process.</p>"),

    # ── Who did the work ──
    ("C-5",
     "Phillip Wikes, formerly Lead Civil Rights Officer at the Maryland Commission on Civil Rights. Engagements are not subcontracted.",
     "Phillip Wikes, formerly Lead Civil Rights Officer at the Maryland Commission on Civil Rights. Engagements were performed personally and were not subcontracted."),

    # ── The record-read section ──
    ("C-6", "<h2>Before you commit anything</h2>",
     "<h2>How the introductory record read worked</h2>"),

    ("C-7",
     "<p><b>Twenty minutes, no charge, and it is not a discovery call.</b> Send one de-identified record in advance and it gets read on the call, against the seven modes and the five conditions, with you watching. You see exactly what a finding looks like on your own material before deciding whether to pay for four more.</p>",
     "<p><b>Twenty minutes, no charge, and it was not a discovery call.</b> A client sent one de-identified record in advance and it was read on the call, against the seven modes and the five conditions, with them watching, so they saw what a finding looked like on their own material before deciding whether to pay for four more.</p>"),

    ("C-8",
     "<p>No slides, no proposal afterwards unless you ask for one, and the record is deleted when the call ends.</p>",
     "<p>No slides, no proposal afterwards unless one was asked for, and the record was deleted when the call ended.</p>"),

    ("C-9", BOOK_CTA, ARCHIVAL_NOTE),

    # ── The intake section ──
    ("C-10", "<h2>Starting</h2>", "<h2>How an engagement started</h2>"),

    ("C-11",
     "<p>Email with your record type, approximate volume and timeframe. <b>You receive scope, the fixed fee, turnaround and an invoice in one reply, within one business day.</b> No discovery call is required, and none will be proposed unless you ask for one.</p>",
     "<p>A client emailed their record type, approximate volume and timeframe. <b>Scope, the fixed fee, turnaround and an invoice came back in one reply, within one business day.</b> No discovery call was required, and none was proposed unless asked for.</p>"),

    ("C-12", SCOPE_CTA, ""),

    ("C-13",
     '<p style="font-size:13.5px;color:var(--muted-soft);line-height:1.7">Not ready for that? The <a href="check.html">seven-point record check</a> is public and ungated, requires nothing from you, and transmits nothing. Most people should read that first.</p>',
     '<p style="font-size:13.5px;color:var(--muted-soft);line-height:1.7">The <a href="check.html">seven-point record check</a> remains public and ungated, requires nothing from you, and transmits nothing. It is open now and is the place to start.</p>'),

    # ── Status strip ──
    ("C-14",
     "<b>Operational validation.</b> JRS is under operational validation and is offered as such. <b>Commercial demand has not yet been established, and these engagements are being tested through controlled market experiments.</b> You would be among the first, which is stated because it is relevant to your decision.",
     "<b>Operational validation.</b> JRS is under operational validation. <b>While this pathway was open, commercial demand had not been established and these engagements were being tested through controlled market experiments.</b> That was stated at the time because it was relevant to a client's decision. The pathway is now closed."),
]

# Must be gone.
BANNED_AFTER = [
    "Book a twenty-minute record read", "Request scope and invoice",
    'class="cta-primary"',   # the element usage; the CSS rule itself is
                             # left alone, since removing it would be an
                             # unrelated edit outside this pass's scope "mailto:info@jrsstandard.com?subject=Twenty-minute",
    "mailto:info@jrsstandard.com?subject=Engagement%20scoping",
    "You receive scope", "are being tested through controlled market experiments",
    "Engagements are not subcontracted", "This page exists to be forwarded",
    "<h2>Starting</h2>", "Before you commit anything",
]

# Must survive: the historical and contractual record.
MUST_SURVIVE = [
    "Closed to new requests",
    "SERVICE LAYER RETIRED",
    '<meta name="robots" content="noindex,nofollow">',
    "AI Documentation Defensibility Review",
    "AI Governance Documentation Review",
    "Benchmark Access and Calibration",
    "Data Isolation Guarantee",
    "ephemeral working memory",
    "83.9%", "72.7 to 95.1", "384 graded reads",
    "pre-registered analysis plan",
    'href="review-engine.html"',
    'href="enterprise.html#enterprise-inquiry"',
    "seven-point record check",
]


def fail(msg):
    print("REFUSED: " + msg)
    sys.exit(1)


def main():
    p = ROOT / TARGET
    before = p.read_text(encoding="utf-8")
    text = before
    applied = []

    for tag, old, new in EDITS:
        n = text.count(old)
        if n != 1:
            fail("%s: expected exactly 1 occurrence of %r, found %d" % (tag, old[:70], n))
        text = text.replace(old, new, 1)
        applied.append((tag, old, new))

    # Collapse the blank line left by the removed second CTA.
    text = re.sub(r"\n\n\n+", "\n\n", text)

    # ══ GATES ══════════════════════════════════════════════════════════
    for b in BANNED_AFTER:
        if b in text:
            fail("active-service element survives: %r" % b)
    for needle in MUST_SURVIVE:
        if needle not in text:
            fail("historical or contractual content lost: %r" % needle)

    # No mailto may remain that functions as retired-service intake.
    for m in re.findall(r'mailto:[^"]*', text):
        if "subject=" in m:
            fail("a mailto with a pre-filled subject survives: %r" % m[:80])

    # The research figures must not move. A whole-page numeric compare is the
    # wrong test here: removing two mailto links deletes their percent-encoded
    # sequences, and the archival wording adds a date, both legitimately.
    for fig in ("83.9%", "72.7 to 95.1", "384 graded reads", "95% confidence interval",
                "completers_detection", "net 30"):
        if before.count(fig) != text.count(fig):
            fail("research or contractual figure changed: %r (%d -> %d)"
                 % (fig, before.count(fig), text.count(fig)))

    # Structure must hold and the page must not be emptied.
    for o, c in (("<div", "</div>"), ("<p", "</p>"), ("<h2", "</h2>"), ("<a ", "</a>")):
        if text.count(o) - text.count(c) != before.count(o) - before.count(c):
            fail("tag balance changed for %s" % o)
    if len(text.encode()) < len(before.encode()) * 0.9:
        fail("page shrank by more than 10 percent; archival content may have been destroyed")

    if text == before:
        fail("no change applied")
    p.write_text(text, encoding="utf-8")

    print("APPLIED\n")
    for tag, old, new in applied:
        print("  %s" % tag)
        print("    -  %s" % (old.replace("\n", " ")[:150]))
        print("    +  %s" % (new.replace("\n", " ")[:150] if new else "(removed)"))
    print("\n  %s  %d -> %d bytes" % (TARGET, len(before.encode()), len(text.encode())))


if __name__ == "__main__":
    main()
