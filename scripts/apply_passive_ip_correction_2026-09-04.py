#!/usr/bin/env python3
"""Surgical content correction: align index/enterprise/training/pilot with the
passive IP-asset strategy.

Scope is fixed by the protocol: four public pages only. The script refuses to
write if any excluded surface is touched, if a canonical block moves by a byte,
or if any preserved pathway disappears. Every edit is an exact-string swap or an
asserted line slice, so a drifted source fails loudly instead of half-applying.
"""

import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGETS = ["index.html", "enterprise.html", "training.html", "pilot.html"]

# Surfaces this run must never open, read or write.
FORBIDDEN = [
    "programme-status-9872fb93cc94.html",
    "api/people-9dd1ecdf6f8cdfd4.js",
    "api/leads-4b7e2c9af106d385.js",
    "vercel.json",
]

CANONICAL_OPEN = "<!-- JRS DUAL TRACK v1 :: CANONICAL BLOCK."
CANONICAL_CLOSE = "<!-- /JRS DUAL TRACK v1 -->"

# ── The IP-hierarchy note. Sits OUTSIDE the canonical block, which is not
#    edited by a byte, and states the standard/engine distinction once. ──
IP_HIERARCHY = """<!-- IP HIERARCHY. Added 2026-09-04. The two tracks above name the engine
and the standard but never say which is which, so a reader could take JRS
itself for the software. One sentence each, stated once, in one place. -->
<div style="margin:0 0 28px;border-left:2px solid var(--accent-dim);padding:2px 0 2px 16px;max-width:660px;">
 <div style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent-dim);margin-bottom:7px;">Standard and engine</div>
 <p style="font-size:13px;color:var(--muted);line-height:1.7;margin:0 0 7px;"><b style="color:var(--text);">JRS, the Justification Review Standard, is the methodology.</b> It is a set of review conditions applied to a record by a person, on paper or inside whatever workflow an organisation already runs. It is not software and it needs none.</p>
 <p style="font-size:13px;color:var(--muted);line-height:1.7;margin:0;"><b style="color:var(--text);">The JRS Review Engine is a technical implementation of that logic.</b> It is an API that applies the defined review conditions to one record and returns a structured determination. The standard is usable without it; the engine exists so a platform can operationalise the same conditions in code.</p>
</div>
"""

# ── (file, old, new, count) ───────────────────────────────────────────────
EDITS = [

    # ══ index.html ══ founder-dependent service obligation
    ("index.html",
     "<p>Organizations evaluating phased implementation approaches may request additional operational information. Discussions are limited to workflow adaptation, reviewer onboarding, and implementation questions related to existing documentation-review environments.</p>",
     "<p>Organizations evaluating phased implementation approaches work from the published materials. The kit, the training modules and the field guides are written to be applied directly, and nothing here creates a consulting or implementation engagement.</p>",
     1),

    ("index.html",
     "Scope defined collaboratively. Implementation boundaries explicitly maintained.",
     "Scope defined by the participating organisation. Implementation boundaries explicitly maintained.",
     1),

    ("index.html",
     "Pilot scope defined collaboratively.",
     "Pilot scope defined by the participating organisation.",
     1),

    # ══ index.html ══ prevalence pass
    ("index.html",
     "These are not unusual. They can arise across HR, investigations, compliance, and administrative records.",
     "These are not hypothetical. They can arise across HR, investigations, compliance, and administrative records.",
     1),

    ("index.html",
     "The following conditions describe how organizational documentation commonly becomes harder to interpret over time.",
     "The following conditions describe how organizational documentation can become harder to interpret over time.",
     1),

    # The same sentence appears twice with different capitalisation, at the
    # head of a paragraph and mid-sentence. Both are corrected; neither is
    # matched by the other's casing, which is why they are separate edits.
    ("index.html",
     "Well-intentioned personnel working under normal operational conditions routinely produce records that become difficult to interpret, defend, or reconstruct during later review.",
     "Well-intentioned personnel working under normal operational conditions can produce records that become difficult to interpret, defend, or reconstruct during later review.",
     1),

    ("index.html",
     "well-intentioned personnel working under normal operational conditions routinely produce records that become difficult to interpret, defend, or reconstruct during later review.",
     "well-intentioned personnel working under normal operational conditions can produce records that become difficult to interpret, defend, or reconstruct during later review.",
     1),

    ("index.html",
     "They are not theoretical failure modes. They are the ordinary environment that most records eventually enter.",
     "They are not theoretical failure modes. They describe the review environment a record may eventually enter.",
     2),

    ("index.html",
     "The personnel, systems, and context available at drafting are not the conditions under which most records are eventually reviewed.",
     "The personnel, systems, and context available at drafting are not the conditions under which a record is eventually reviewed.",
     1),

    ("index.html",
     "Each reflects documentation patterns that appear routinely in organizational review.",
     "Each reflects documentation patterns observed in organizational review.",
     1),

    ("index.html",
     "The reconstruction failure example above is not unusual. It is the common condition when managers depart mid-process.",
     "The reconstruction failure example above is drawn from review practice. It is a condition that can arise when managers depart mid-process.",
     1),

    ("index.html",
     "Additional failure categories will be documented as they appear consistently across review contexts.",
     "Additional failure categories will be documented as they are observed across review contexts.",
     1),

    ("index.html",
     "Most records that fail during later review looked fine at drafting.",
     "Records that fail during later review often looked fine at drafting.",
     1),

    ("index.html",
     "where records are routinely read later by adjudicators and legal counsel who were not present when they were written.",
     "where records are read later by adjudicators and legal counsel who were not present when they were written.",
     1),

    ("index.html",
     "The later-review conditions that most commonly surface documentation failures include:",
     "The later-review conditions observed to surface documentation failures include:",
     1),

    ("index.html",
     "The conditions JRS identifies arise most commonly from ordinary workflow pressures, not deliberate falsification.",
     "The conditions JRS identifies arise from ordinary workflow pressures, not deliberate falsification.",
     1),

    ("index.html",
     "<span class=\"lo-check\">--</span>Why records are routinely reviewed without original context",
     "<span class=\"lo-check\">--</span>Why records are often reviewed without original context",
     1),

    # ══ enterprise.html ══ scoping calls
    ("enterprise.html",
     "<a href=\"#enterprise-inquiry\" class=\"btn btn-primary\">Start an integration scoping call &rarr;</a>",
     "<a href=\"#enterprise-inquiry\" class=\"btn btn-primary\">Make a technical integration inquiry &rarr;</a>",
     2),

    # ══ enterprise.html ══ collaboratively defined deployment
    ("enterprise.html",
     "Pilot scope is defined collaboratively based on the organization's existing workflows and highest-risk record types.",
     "Pilot scope is defined by the participating organisation, based on its existing workflows and highest-risk record types.",
     1),

    ("enterprise.html",
     "Organizational participation is structured around operational fit, not fixed engagement models. Pilots are scoped based on existing workflows, reviewer availability, and the record types presenting the highest documentation risk.",
     "Organizational participation is self-directed and structured around operational fit. Pilots are scoped by the participating organisation, based on its existing workflows, reviewer availability, and the record types presenting the highest documentation risk.",
     1),

    ("enterprise.html",
     "<h2 class=\"section-head\">Pilot Engagement Sequence</h2>",
     "<h2 class=\"section-head\">Pilot Sequence</h2>",
     1),

    ("enterprise.html",
     ">Simulation Engagement</div>",
     ">Simulation Practice</div>",
     1),

    ("enterprise.html",
     "It is an operational engagement with the review infrastructure.",
     "It is self-directed operational use of the published review materials.",
     1),

    # ══ enterprise.html ══ enterprise inquiry framing
    ("enterprise.html",
     "Organizations evaluating phased implementation approaches, or with questions about applying review controls within existing workflows, may request additional operational information. Discussions are limited to workflow adaptation, reviewer onboarding, and implementation questions related to existing documentation-review environments.",
     "Inquiries are received on three subjects: licensing of the JRS Review Engine, technical integration of that engine into a partner platform, and acquisition of the JRS assets. The review materials themselves are published and self-directed, and an inquiry is not a prerequisite for using them.",
     1),

    ("enterprise.html",
     "<strong style=\"color:var(--muted);font-weight:600;\">Scope of discussion:</strong> Workflow insertion points and reviewer routing. Phased or selective deployment. Higher-risk record categories as starting points. Department-level or record-type-level implementation. Integration with existing HR, compliance, or investigation workflows.",
     "<strong style=\"color:var(--muted);font-weight:600;\">Scope of inquiry:</strong> Licensing terms for the JRS Review Engine. Technical integration, the API contract and the request identifier your audit trail cites. Acquisition of the standard and its associated assets.",
     1),

    # ══ enterprise.html ══ founder-delivered setup and scoped evaluation pricing
    ("enterprise.html",
     "<tr><td><b>Integration setup</b></td><td>One-time, invoiced on a signed scope</td><td>Number of record types, whether routing returns into a queue you already run or a new one, and how much of the condition mapping your team does rather than us.</td></tr>",
     "<tr><td><b>Integration setup</b></td><td>One-time, invoiced on a signed scope</td><td>Number of record types, and whether routing returns into a queue you already run or a new one. Condition mapping is carried out by the licensee against the published condition definitions.</td></tr>",
     1),

    ("enterprise.html",
     "<tr><td><b>Evaluation</b></td><td><b>No charge, and no contact required</b></td><td>The sandbox runs a record now. A scoped evaluation against a set of your own records is arranged through the inquiry form.</td></tr>",
     "<tr><td><b>Evaluation</b></td><td><b>No charge, and no contact required</b></td><td>The sandbox runs a record now, and the Organization Mini-Pilot runs a set of your own records in your own browser. Neither requires an inquiry.</td></tr>",
     1),

    ("enterprise.html",
     "<a href=\"#enterprise-inquiry\" class=\"btn btn-primary\">Get a written scope and figure &rarr;</a>",
     "<a href=\"#enterprise-inquiry\" class=\"btn btn-primary\">Send a licensing inquiry &rarr;</a>",
     1),

    ("enterprise.html",
     "It produces the one thing an enterprise conversation actually needs, which is evidence from your records rather than someone else's.",
     "It produces evidence from your own records rather than someone else's, and it runs without contacting anyone.",
     1),

    # ══ training.html ══ terminology
    ("training.html",
     "<div class=\"hero-eyebrow\">JRS Reviewer Certification Program &nbsp;&middot;&nbsp; Decision Defensibility</div>",
     "<div class=\"hero-eyebrow\">JRS Reviewer Training Program &nbsp;&middot;&nbsp; Decision Defensibility</div>",
     1),

    ("training.html",
     ">JRS Training &amp; Certification</div>",
     ">JRS Reviewer Training Program</div>",
     1),

    ("training.html",
     ">Start Your JRS Certification</h2>",
     ">Start the JRS Reviewer Training Program</h2>",
     1),

    ("training.html",
     "you carry the designation <b style=\"color:var(--text)\">JRS Certified Master Reviewer</b>",
     "you carry the designation <b style=\"color:var(--text)\">JRS Master Reviewer</b>",
     1),

    ("training.html",
     "To discuss licensing or a co-branded certification, contact",
     "To discuss licensing or a co-branded training program, contact",
     1),

    # ══ training.html ══ contextual legal guidance
    ("training.html",
     "<td>Secondary review required. Legal consultation required before finalization.</td>",
     "<td>Secondary review indicated. Legal consultation is commonly indicated before finalization, subject to organizational policy and applicable law.</td>",
     1),

    ("training.html",
     "The single email does not constitute the referenced documentation. Legal consultation required before finalization.",
     "The single email does not constitute the referenced documentation. Legal consultation is indicated before finalization, subject to organizational policy and applicable law.",
     1),

    # ══ training.html ══ prevalence
    ("training.html",
     "across the four AI functions most commonly present in workplace documentation: summarization, recommendation, analysis, and narrative drafting.",
     "across the four AI functions this training addresses in workplace documentation: summarization, recommendation, analysis, and narrative drafting.",
     1),

    ("training.html",
     "LAYER 6: COMMONLY OBSERVED CONDITIONS",
     "LAYER 6: CONDITIONS PARTICIPANTS REPORT",
     1),

    ("training.html",
     "<div class=\"findings-eyebrow\">Commonly Observed Conditions</div>",
     "<div class=\"findings-eyebrow\">Conditions Participants Report</div>",
     1),

    ("training.html",
     "Reviewers commonly observe escalation wording exceeding documented behavioral support.",
     "Reviewers report escalation wording exceeding documented behavioral support.",
     1),

    # ══ pilot.html ══ founder-led engagement framing
    ("pilot.html",
     "class=\"btn btn-primary\">Contact Participation Team</a>",
     "class=\"btn btn-primary\">Contact About Participation</a>",
     1),

    ("pilot.html",
     "<p class=\"contact-sub\">Inquiries about pilot participation, implementation questions, AI governance-level evaluations, and requests to stay informed as the framework develops are all welcome. Your message is forwarded directly; your contact information is not displayed publicly.</p>",
     "<p class=\"contact-sub\">Pilot participation is self-directed: the review conditions, the field guides and the simulations are published, and an organization applies them in its own environment on its own scope. Questions about the standard, and requests to stay informed as it develops, are welcome. Your message is forwarded directly; your contact information is not displayed publicly.</p>",
     1),
]

# ── Line slices to delete: (file, start, end, must-contain fragment) ──────
#    1-indexed, inclusive. Each is asserted against its fragment before cutting.
DELETIONS = [
    # Enterprise: the interactive custom-pricing estimator, replaced by prose.
    ("enterprise.html", 856, 893, "Answer three questions and this returns the tier"),
    # Enterprise: the Engagements block. Fixed-scope, fixed-price, invoiced
    # founder-delivered reviews. This is the service-pricing structure.
    ("enterprise.html", 920, 930, "Fixed scope, fixed price, invoiced."),
    # Enterprise: the estimator's JavaScript, orphaned once the widget is gone.
    ("enterprise.html", 1138, 1215, "SCOPE ESTIMATOR"),
]

ESTIMATOR_REPLACEMENT = """ <p class="body-text">What matters before an inquiry is not the figure but whether this is your size of commitment. The shape below states what a licence is made of and what moves it. Scope is described by the licensee in the inquiry form; nothing is scoped on a call, and nothing is charged during operational validation without a signed scope.</p>
"""

# ── Everything below must still be present when the run finishes ─────────
MUST_SURVIVE = {
    "index.html": [
        CANONICAL_OPEN, CANONICAL_CLOSE,
        "Commercial Inquiries",
        "investigator-guides.html", "training.html", "simulations.html",
        "Licensing", "Acquisition",
        "Pilot Program",
        "review-engine.html",
        "jrsSanitizeCheck",
        'id="jrs-scs-output"',
    ],
    "enterprise.html": [
        "JRS Review Engine", "review-engine.html",
        "Platform licence", "Annual, per organisation",
        "Organization Mini-Pilot",
        "Pilot Program",
        "investigator-guides.html",
        "security.html",
        "Enterprise and licensing inquiry",
        "For integrators",
    ],
    "training.html": [
        "JRS Reviewer Training Program",
        "Decision Defensibility Score",
        "jrs-training-progress",
        "openEnroll",
    ],
    "pilot.html": [
        "jrsSanitizeCheck",
        "submitVulnObs",
        "Pilot Program",
        "training.html", "simulations.html",
    ],
}

# Banned in the four files after the run: the terminology and service promises.
BANNED_AFTER = [
    "scoping call",
    "Scope defined collaboratively",
    "defined collaboratively",
    "Fixed scope, fixed price",
    "JRS Certified Master Reviewer",
    "JRS Reviewer Certification Program",
    "Start Your JRS Certification",
    "Legal consultation required",
]


def fail(msg):
    print("REFUSED: " + msg)
    sys.exit(1)


def main():
    # Nothing outside the four target files may be opened for writing.
    for name in FORBIDDEN:
        if name in TARGETS:
            fail("excluded surface is in the target list: " + name)

    before = {}
    canon = {}
    for name in TARGETS:
        p = ROOT / name
        if not p.exists():
            fail("missing target file: " + name)
        before[name] = p.read_text(encoding="utf-8")
        if CANONICAL_OPEN in before[name]:
            i = before[name].index(CANONICAL_OPEN)
            j = before[name].index(CANONICAL_CLOSE) + len(CANONICAL_CLOSE)
            canon[name] = before[name][i:j]

    text = dict(before)
    applied = []

    # 1. Line deletions first, so the string edits below run against the
    #    surviving markup and a stale offset cannot silently cut the wrong rows.
    #    Descending by start line so an earlier cut cannot shift a later one.
    for name, start, end, fragment in sorted(DELETIONS, key=lambda d: -d[1]):
        lines = text[name].split("\n")
        if start < 1 or end > len(lines):
            fail("%s: slice %d-%d out of range" % (name, start, end))
        chunk = "\n".join(lines[start - 1:end])
        if fragment not in chunk:
            fail("%s: slice %d-%d does not contain %r" % (name, start, end, fragment))
        replacement = []
        if fragment == "Answer three questions and this returns the tier":
            replacement = ESTIMATOR_REPLACEMENT.rstrip("\n").split("\n")
        text[name] = "\n".join(lines[:start - 1] + replacement + lines[end:])
        applied.append("%s: removed lines %d-%d (%s)" % (name, start, end, fragment[:44]))

    # 2. Exact-string edits.
    for name, old, new, count in EDITS:
        found = text[name].count(old)
        if found != count:
            fail("%s: expected %d occurrence(s) of %r, found %d" % (name, count, old[:70], found))
        text[name] = text[name].replace(old, new)
        applied.append("%s: %d x %r" % (name, count, old[:64]))

    # 3. The IP-hierarchy note, inserted immediately after the canonical block
    #    closes so the canonical markup itself is never touched.
    anchor = CANONICAL_CLOSE + "\n"
    if text["index.html"].count(anchor) != 1:
        fail("index.html: canonical close anchor is not unique")
    if "IP HIERARCHY" in text["index.html"]:
        fail("index.html: IP hierarchy note already present")
    text["index.html"] = text["index.html"].replace(anchor, anchor + IP_HIERARCHY, 1)
    applied.append("index.html: inserted the IP hierarchy note after the canonical block")

    # ── Gates ────────────────────────────────────────────────────────────
    for name in TARGETS:
        if name in canon:
            if canon[name] not in text[name]:
                fail(name + ": the canonical dual-track block was altered")
        for needle in MUST_SURVIVE[name]:
            if needle not in text[name]:
                fail("%s: required content disappeared: %r" % (name, needle))
        for needle in BANNED_AFTER:
            if needle in text[name]:
                fail("%s: banned phrase still present: %r" % (name, needle))
        # Analytics, APIs and privacy controls must be untouched.
        for keep in ["G-NVYHJ7BJ92", "googletagmanager"]:
            if before[name].count(keep) != text[name].count(keep):
                fail(name + ": analytics markup changed")
        for keep in ["/api/", "formspree.io"]:
            if before[name].count(keep) != text[name].count(keep):
                fail(name + ": endpoint references changed (%s)" % keep)

    # No new pricing figure anywhere.
    money = re.compile(r"[$£€]\s?\d")
    for name in TARGETS:
        if len(money.findall(text[name])) > len(money.findall(before[name])):
            fail(name + ": a currency figure was introduced")

    # Orphan check: no id referenced by script that no longer exists in markup.
    for orphan in ["sc-vol", "sc-types", "sc-exposure", "sc-go", "sc-out", "sc-tier", "sc-body", "sc-send"]:
        if orphan in text["enterprise.html"]:
            fail("enterprise.html: estimator remnant left behind: " + orphan)

    for name in TARGETS:
        if text[name] == before[name]:
            fail(name + ": no change applied")
        (ROOT / name).write_text(text[name], encoding="utf-8")

    print("APPLIED\n")
    for line in applied:
        print("  " + line)
    print()
    for name in TARGETS:
        print("  %-16s %d -> %d bytes   %d -> %d lines" % (
            name, len(before[name].encode()), len(text[name].encode()),
            before[name].count("\n") + 1, text[name].count("\n") + 1))


if __name__ == "__main__":
    main()
