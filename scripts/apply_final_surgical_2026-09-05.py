#!/usr/bin/env python3
"""Four authorized corrections from the independent final website audit.

SCOPE CONTROL. Exactly four files. Every edit below is an exact-string
replacement with an asserted occurrence count, so an edit that would land
somewhere unintended refuses instead of applying. Research files are never
opened. Nothing outside AUTHORIZED is written.

  1 check.html        remove the live founder-delivered record-read funnel
  2 engagement.html   make title / description / og metadata archival
  3 terms.html        make four forward-facing engagement clauses historical
  4 jrsstandard.html  add the established standard / engine hierarchy block
"""
import io, re, sys

AUTHORIZED = {"check.html", "engagement.html", "terms.html", "jrsstandard.html"}

HIERARCHY = """<!-- IP HIERARCHY. Added 2026-09-05. This page carried the standard in full
and never named the Review Engine, so a reader here could not tell the
methodology from the technology. Same two sentences as index.html, stated
once, near the top, so the distinction is made before the standard begins. -->
<div style="margin:0 0 28px;border-left:2px solid var(--accent-dim);padding:2px 0 2px 16px;max-width:660px;">
 <div style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent-dim);margin-bottom:7px;">Standard and engine</div>
 <p style="font-size:13px;color:var(--muted);line-height:1.7;margin:0 0 7px;"><b style="color:var(--text);">JRS, the Justification Review Standard, is the methodology.</b> It is a set of review conditions applied to a record by a person, on paper or inside whatever workflow an organisation already runs. It is not software and it needs none.</p>
 <p style="font-size:13px;color:var(--muted);line-height:1.7;margin:0;"><b style="color:var(--text);">The JRS Review Engine is a technical implementation of that logic.</b> It is an API that applies the defined review conditions to one record and returns a structured determination. The standard is usable without it; the engine exists so a platform can operationalise the same conditions in code.</p>
</div>
"""

# (file, old, new, expected_count)
EDITS = [
 # ---- 1. check.html : remove the funnel, keep every methodology element ----
 ("check.html",
  '  <h2>Want it read with you?</h2>\n'
  '  <p><b>Twenty minutes, no charge, not a discovery call.</b> Send one de-identified record and it gets read on the call against these seven modes, with you watching. The record is deleted when the call ends.</p>\n'
  '  <p style="margin:0 0 30px"><a class="cta-secondary" href="mailto:info@jrsstandard.com?subject=Twenty-minute%20record%20read&amp;body=Record%20type%3A%0ATimeframe%3A%0ATwo%20or%20three%20times%20that%20suit%20you%3A">Book a twenty-minute record read &rarr;</a></p>\n'
  '\n',
  '', 1),

 # ---- 2. engagement.html : metadata consistent with the archival body ----
 ("engagement.html",
  '<title>How an engagement works | JRS&#8482;</title>',
  '<title>How an engagement worked (closed) | JRS&#8482;</title>', 1),
 ("engagement.html",
  '<meta name="description" content="Scope, fees, data handling, de-identification, retention and deliverable ownership for JRS record-defensibility engagements. Written to be forwarded to procurement and counsel.">',
  '<meta name="description" content="Historical record of the founder-delivered JRS record-defensibility engagement model, closed to new requests on 4 September 2026. Scope, fees, data handling, de-identification, retention and deliverable ownership are retained here for reference.">', 1),
 ("engagement.html",
  '<meta property="og:title" content="How a JRS engagement works" />',
  '<meta property="og:title" content="How a JRS engagement worked (closed to new requests)" />', 1),
 ("engagement.html",
  '<meta property="og:description" content="Scope, fixed fees, data handling, retention and deliverable ownership. Written to be forwarded to procurement." />',
  '<meta property="og:description" content="Historical record of a closed engagement model: scope, fixed fees, data handling, retention and deliverable ownership. Not open for new requests." />', 1),

 # ---- 3. terms.html : four forward-facing clauses made historical ----
 ("terms.html",
  '<b>Registered trading address and governing jurisdiction:</b> <span class="todo">to be completed before the first engagement is signed.</span> Until then, an engagement is governed by whatever jurisdiction is named in the countersigned scope, and no engagement is signed without one.',
  '<b>Registered trading address and governing jurisdiction:</b> <span class="todo">not published here.</span> Each pre-existing engagement is governed by the jurisdiction named in its countersigned scope, and no engagement was signed without one.', 1),
 ("terms.html",
  '<b>All customer files and sample records submitted for diagnostic evaluation are processed in ephemeral working memory and deleted upon delivery of the diagnostic report. Customer records are never stored, logged to public research sets, or used for model training.</b> A record arriving with an identifier is returned rather than redacted. Records are read by one person and are not passed to any third-party service. No sub-processors are engaged.',
  '<b>Customer files and sample records supplied for diagnostic evaluation were processed in ephemeral working memory and deleted on delivery of the diagnostic report. Customer records were never stored, logged to public research sets, or used for model training.</b> A record arriving with an identifier was returned rather than redacted. Records were read by one person and were not passed to any third-party service. No sub-processors were engaged. These undertakings continue to bind the practice in respect of any material supplied under a pre-existing engagement.', 1),
 # The status strip restated the same forward-facing gap as section 1 and
 # carried "until a scope is countersigned". Left alone it would contradict the
 # section 1 correction two paragraphs above it, so it moves with it.
 ("terms.html",
  '<b>One item is deliberately incomplete.</b> Registered trading address and governing jurisdiction are marked above rather than guessed. <b>Publishing an address or a governing law that had not been decided would be worse than leaving it open</b>, and neither is needed until a scope is countersigned.',
  '<b>One item is deliberately left unpublished.</b> Registered trading address and governing jurisdiction are marked above rather than guessed. <b>Publishing an address or a governing law that had not been decided would be worse than leaving it open</b>, and for each pre-existing engagement the governing law is the one named in its countersigned scope.',
  1),
 ("terms.html",
  'These terms apply as published on the date your scope is countersigned. A later change to this page does not alter an engagement already agreed.',
  'These terms apply as published on the date the applicable scope was countersigned. A later change to this page does not alter an engagement already agreed.', 1),
 ("terms.html",
  'Questions on any clause before you engage: <a href="mailto:info@jrsstandard.com?subject=Terms%20query">info@jrsstandard.com</a>. How an engagement runs in practice is on the engagement page.',
  'Questions on any clause governing a pre-existing engagement: <a href="mailto:info@jrsstandard.com?subject=Terms%20query">info@jrsstandard.com</a>. How an engagement worked in practice is recorded on the engagement page.', 1),

 # ---- 4. jrsstandard.html : the hierarchy block ----
 ("jrsstandard.html",
  '<p class="page-subtitle">When a consequential decision is questioned long after it is made, the record becomes the only witness. This is a pre-finalization standard that evaluates whether a record can explain why a decision was made, before the record is finalized.</p>\n',
  '<p class="page-subtitle">When a consequential decision is questioned long after it is made, the record becomes the only witness. This is a pre-finalization standard that evaluates whether a record can explain why a decision was made, before the record is finalized.</p>\n\n' + HIERARCHY,
  1),
]

# Strings that MUST still be present after the pass, per file.
MUST_SURVIVE = {
 "check.html": [
   "The seven failure modes", "Fluent groundlessness", "Take it further",
   "Not what you came for?", "Pressure-test the standard",
   "What this page does not do", "does not establish legal or regulatory compliance",
   "The Seven-Point Record Defensibility Check",
 ],
 "engagement.html": [
   "noindex,nofollow", "Closed to new requests", "How an engagement worked",
   "This pathway is closed", "Data Isolation Guarantee", "83.9", "384 graded reads",
   "72.7", "pre-registered", "were performed personally and were not subcontracted",
 ],
 "terms.html": [
   "noindex,follow", "5. Ownership", "6. Confidentiality", "9. Liability",
   "It is not legal advice</b> and creates no attorney-client relationship",
   "It is not a certification, an accreditation, or an audit",
   "Liability under any engagement is limited to the fee paid for that engagement",
   "The written finding is yours outright on delivery",
   "closed to new requests on 4 September 2026",
   "Terms are net 30",
   "Your material, your identity as a client, and the content of any finding are treated as confidential",
   "an NDA provided by the client could be accepted",
 ],
 "jrsstandard.html": [
   "JRS Decision Defensibility Methodology", "Core principle", "Substrate neutrality",
   "Not a certification or accreditation system",
 ],
}

# Strings that MUST be absent after the pass, per file.
BANNED_AFTER = {
 "check.html": [
   "Want it read with you", "Twenty minutes, no charge", "Book a twenty-minute",
   "twenty-minute record read", "Twenty-minute%20record%20read",
   "with you watching", "body=Record%20type",
 ],
 "engagement.html": [
   "How an engagement works", "Written to be forwarded",
 ],
 "terms.html": [
   "before the first engagement is signed", "before you engage",
   "your scope is countersigned", "How an engagement runs in practice",
   "records submitted for diagnostic evaluation are processed",
   "until a scope is countersigned",
   "One item is deliberately incomplete",
 ],
 "jrsstandard.html": [],
}


def main():
    for f in sorted({e[0] for e in EDITS}):
        if f not in AUTHORIZED:
            sys.exit("REFUSE: %s is not in the authorized set" % f)

    src = {f: io.open(f, encoding="utf-8").read() for f in AUTHORIZED}
    before = {f: len(s.encode("utf-8")) for f, s in src.items()}

    # Gate 1: every old string appears exactly the asserted number of times.
    for f, old, new, n in EDITS:
        got = src[f].count(old)
        if got != n:
            sys.exit("REFUSE: %s expected %d occurrence(s) of %r, found %d"
                     % (f, n, old[:90], got))

    # Numeric multiset of each file, to prove no figure moved.
    nums = {f: sorted(re.findall(r'\d+(?:\.\d+)?', s)) for f, s in src.items()}

    out = dict(src)
    for f, old, new, n in EDITS:
        out[f] = out[f].replace(old, new, n)

    # Gate 2: must-survive.
    for f, needles in MUST_SURVIVE.items():
        for k in needles:
            if k not in out[f]:
                sys.exit("REFUSE: %s lost required content %r" % (f, k))

    # Gate 3: banned-after.
    for f, needles in BANNED_AFTER.items():
        for k in needles:
            if k in out[f]:
                sys.exit("REFUSE: %s still contains banned %r" % (f, k))

    # Gate 4: tag balance unchanged for the containers we touch.
    for f in AUTHORIZED:
        for tag in ("div", "p", "h2", "a"):
            o = len(re.findall(r'<%s[\s>]' % tag, src[f])), len(re.findall(r'</%s>' % tag, src[f]))
            c = len(re.findall(r'<%s[\s>]' % tag, out[f])), len(re.findall(r'</%s>' % tag, out[f]))
            if (o[0] - o[1]) != (c[0] - c[1]):
                sys.exit("REFUSE: %s tag balance for <%s> changed %s -> %s" % (f, tag, o, c))

    # Gate 5: RESEARCH FIGURES, not every digit.
    # The first version of this gate compared the whole-file numeric multiset
    # for check.html and refused, correctly, because deleting the funnel also
    # deletes "margin:0 0 30px" and the percent-encodings %20 %3A %0A. Those
    # are style and URL bytes, not measurements. The gate now names the figures
    # that actually matter and asserts their counts are unchanged, which is the
    # condition the scope control was written to protect.
    FIGURES = {
        "check.html": ["83.9", "72.7", "95.1", "384"],
        "jrsstandard.html": ["83.9", "384"],
        "engagement.html": ["83.9", "72.7", "95.1", "384"],
        "terms.html": [],
    }
    for f, figs in FIGURES.items():
        for v in figs:
            b, a = src[f].count(v), out[f].count(v)
            if b != a:
                sys.exit("REFUSE: %s figure %s count changed %d -> %d" % (f, v, b, a))

    # jrsstandard.html: only additions allowed, nothing removed.
    a = sorted(re.findall(r'\d+(?:\.\d+)?', out["jrsstandard.html"]))
    for v in nums["jrsstandard.html"]:
        if a.count(v) < nums["jrsstandard.html"].count(v):
            sys.exit("REFUSE: jrsstandard.html lost numeric value %r" % v)

    # Gate 6: byte-delta ceiling.
    for f in AUTHORIZED:
        d = len(out[f].encode("utf-8")) - before[f]
        if abs(d) > 4000:
            sys.exit("REFUSE: %s byte delta %+d exceeds ceiling" % (f, d))

    for f in AUTHORIZED:
        io.open(f, "w", encoding="utf-8").write(out[f])
        print("%-20s %7d -> %7d  (%+d bytes)"
              % (f, before[f], len(out[f].encode("utf-8")),
                 len(out[f].encode("utf-8")) - before[f]))
    print("all gates passed")


if __name__ == "__main__":
    main()
