#!/usr/bin/env python3
"""Apply the approved five-priority refinement to index.html.

Scope is the approved change list at
research/index_html_surgical_change_list_2026-09-04.md and nothing else.

EXCLUSIONS CONFIRMED BY THE OWNER AND ENFORCED HERE:
  * the canonical dual-track block, lines 977-993, is untouched and asserted
    byte-identical afterwards;
  * quoted specimen records and the reviewer-search checklist are excluded
    from the prevalence pass;
  * the Pilot Program block keeps its name and structure.

ONE ADDITION TO THE LIST, FLAGGED RATHER THAN SILENT. The phrase
"defined collaboratively" occurs TWICE, at 2129 as listed and also at 1352,
which the change list identified as a target for the boundary sentence but did
not count for this phrase. His instruction states the substitution as a rule
about the phrase, so both are corrected; leaving one would defeat the fix.

    python3 scripts/apply_index_refinement_2026-09-04.py --check
    python3 scripts/apply_index_refinement_2026-09-04.py --apply
"""
import argparse
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, "index.html")

ANCHOR = ('<div style="font-size:12.5px;color:var(--muted-soft);'
          'line-height:1.65;max-width:620px;margin-bottom:24px;">JRS '
          'originated from civil rights investigative and '
          'documentation-review experience')

STATUS_BLOCK = '''
<!-- CURRENT PROGRAMME STATUS. Added 2026-09-04. The opening already answered
what JRS is, what it is not and who it is for; it did not state the stage the
programme is at, which is the sentence a first-time reader needs before they
weigh a finding. -->
<div style="margin-bottom:24px;border:1px solid rgba(190,148,71,.3);background:rgba(190,148,71,.03);padding:20px 22px;">
 <div style="font-family:'JetBrains Mono',monospace;font-size:7.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:8px;">Current programme status</div>
 <p style="font-size:13.5px;color:var(--muted);line-height:1.7;max-width:620px;margin:0;">JRS is in an active stage of operational development and validation. Current findings, practitioner exercises, and technical demonstrations should be interpreted according to their stated methods and limitations.</p>
</div>

<!-- OPEN-ACCESS PRACTITIONER RESOURCES. Added 2026-09-04. The three resources
already existed but were split between the canonical dual-track block, which is
byte-identical across pages and must not be edited, and an Explore strip that
leads with the Pilot Program rather than with a resource. This block names them
in one place. The Explore strip is deliberately left in place: it carries the
by-Role entry that this block does not. -->
<div style="margin-bottom:24px;border:1px solid var(--rule);background:var(--surface);padding:20px 22px;">
 <div style="font-family:'JetBrains Mono',monospace;font-size:7.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:12px;">Open-access practitioner resources</div>
 <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;">
  <div>
   <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:5px;">Investigator Field Guides</div>
   <p style="font-size:12px;color:var(--muted);line-height:1.6;margin:0 0 6px;">Practical resources for reviewing consequential documentation in investigative, employment, housing, and related environments.</p>
   <a href="investigator-guides.html" style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);text-decoration:none;">Open the guides &#8594;</a>
  </div>
  <div>
   <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:5px;">Reviewer Training</div>
   <p style="font-size:12px;color:var(--muted);line-height:1.6;margin:0 0 6px;">Six self-paced modules introducing the JRS review conditions, supported by a companion desk reference and certificate.</p>
   <a href="training.html" style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);text-decoration:none;">Open the training &#8594;</a>
  </div>
  <div>
   <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:5px;">Simulations and Exercises</div>
   <p style="font-size:12px;color:var(--muted);line-height:1.6;margin:0 0 6px;">Practical scenarios examining evidence gaps, chronology problems, reasoning traceability, and Decision Reconstruction Risk.</p>
   <a href="simulations.html" style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);text-decoration:none;">Open the simulations &#8594;</a>
  </div>
 </div>
</div>
'''

EDITS = [
    ("P5 line 1031, supporting sentence",
     "For organisations and professionals interested in discussing potential "
     "licensing, integration, or acquisition involving JRS.",
     "JRS is maintained as an independently developed intellectual-property "
     "and professional resource asset. Organisations or professionals with a "
     "serious interest in discussing potential licensing, technology "
     "integration, or acquisition may make an inquiry here."),

    ("P3 line 1352, phrase, second occurrence found during application",
     "Pilot scope is defined collaboratively based on the organization's "
     "existing workflows and highest-risk record types.",
     "Pilot scope is defined by the participating organisation, based on its "
     "existing workflows and highest-risk record types. These resources "
     "support independent examination of documentation review practices and "
     "do not, by themselves, create a consulting or commercial engagement."),

    ("P4 line 1464",
     "These failure modes appear routinely across HR, legal, compliance, "
     "investigation, and governance records",
     "These failure modes can arise across HR, legal, compliance, "
     "investigation, and governance records"),

    ("P4 line 1474",
     "Chronology gaps appeared repeatedly in HR review discussions",
     "Chronology gaps were raised in HR review discussions"),

    ("P4 line 1482",
     "a condition surfacing repeatedly across compliance and HR "
     "documentation contexts in reviewer exercises",
     "a condition observed across compliance and HR documentation contexts "
     "in reviewer exercises"),

    ("P4 line 1486",
     "Reviewer disagreement emerged consistently in comparator exercises",
     "Reviewer disagreement emerged in comparator exercises"),

    ("P4 line 1501, both of his item 6 examples",
     "These are not unusual. They appear routinely across HR, "
     "investigations, compliance, and administrative records. The file looks "
     "complete at drafting because the author's context fills the gaps.",
     "These are not unusual. They can arise across HR, investigations, "
     "compliance, and administrative records. The file looks complete at "
     "drafting because the author's contextual knowledge may supply "
     "information that is not preserved within the record itself."),

    ("P3 line 2129, phrase",
     "Scope is defined collaboratively.",
     "Scope is defined by the participating organisation."),

    ("P3 line 2131, step title",
     '<div class="kit-flow-title">Begin implementation</div>',
     '<div class="kit-flow-title">Begin internal use</div>'),

    ("P4 line 2846",
     "Conditions commonly present at intake review",
     "Conditions that can be present at intake review"),

    ("P4 line 2895",
     "Records as they commonly arrive for review.",
     "Records as they arrive for review."),
]

# Must survive untouched.
CANONICAL_MARKER = ("JRS DUAL TRACK v1 :: CANONICAL BLOCK. Byte-identical on "
                    "every page that")
SPECIMENS = [
    '"Employee demonstrated unprofessional conduct."',
    "Employee demonstrates a consistently poor attitude toward supervisors",
    "the employee has consistently demonstrated resistance to management",
    'Does pattern language ("repeatedly," "consistently") have specific dated',
]
KEEP = [
    ">Commercial Inquiries<", "Licensing: the review engine",
    "Licensing: the framework", "Integration: embed in our product",
    ">Acquisition<", "JRS Operational Review Pilot Program",
    "No confidential records or sensitive information should be submitted",
]


def canonical_block(src: str) -> str:
    i = src.index(CANONICAL_MARKER)
    return src[i:i + 4000]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.check):
        ap.error("pass --check or --apply")

    src = open(TARGET, encoding="utf-8").read()
    before_canonical = canonical_block(src)
    doc = src
    log = []

    if ANCHOR not in doc:
        raise SystemExit("[REQUIRED_ENV_PARAM] insertion anchor not found")
    if doc.count(ANCHOR) != 1:
        raise SystemExit("[REQUIRED_ENV_PARAM] insertion anchor is ambiguous")
    end = doc.index("</div>", doc.index(ANCHOR)) + len("</div>")
    doc = doc[:end] + "\n" + STATUS_BLOCK.strip("\n") + doc[end:]
    log.append("inserted: programme status block and open-access resources")

    for label, old, new in EDITS:
        n = doc.count(old)
        if n != 1:
            raise SystemExit("[REQUIRED_ENV_PARAM] %s matched %d times, "
                             "expected 1" % (label, n))
        doc = doc.replace(old, new, 1)
        log.append("edited: %s" % label)

    if canonical_block(doc) != before_canonical:
        raise SystemExit("[REQUIRED_ENV_PARAM] the canonical dual-track block "
                         "changed; it must stay byte-identical across pages")
    for s in SPECIMENS:
        if s not in doc:
            raise SystemExit("[REQUIRED_ENV_PARAM] a quoted specimen or the "
                             "reviewer checklist was altered: %s" % s[:50])
    for k in KEEP:
        if k not in doc:
            raise SystemExit("[REQUIRED_ENV_PARAM] required element lost: %s"
                             % k)
    for banned in ["for sale", "buy JRS", "investment opportunity",
                   "$", "pricing starts"]:
        if banned in doc and banned not in src:
            raise SystemExit("[REQUIRED_ENV_PARAM] introduced banned "
                             "commercial language: %s" % banned)
    for href in ("investigator-guides.html", "training.html",
                 "simulations.html"):
        if not os.path.exists(os.path.join(ROOT, href)):
            raise SystemExit("[REQUIRED_ENV_PARAM] new link target missing: %s"
                             % href)

    for line in log:
        print("  " + line)
    print("  canonical dual-track block: byte-identical")
    print("  quoted specimens intact: %d/%d" % (len(SPECIMENS),
                                                len(SPECIMENS)))
    print("  new link targets exist: 3/3")
    print("  net lines: %d -> %d" % (src.count("\n"), doc.count("\n")))

    if not args.apply:
        print("\nCHECK ONLY, nothing written")
        return 0
    open(TARGET, "w", encoding="utf-8").write(doc)
    print("\nwrote index.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
