#!/usr/bin/env python3
"""Apply the approved refinement blocks to programme-status-9872fb93cc94.html.

WHY THIS FILE AND NOT index.html. He directed the work at this exact URL and
asked to see the change on the page he opens. The same refinement already went
to index.html and stays there; this is an addition to a second page, not a move.

WHAT IS ADDED. Two blocks, directly under the h1 and ABOVE the Commercial
Inbox, so the page opens on what JRS is and where the programme stands before
it opens on a queue of names:

  * Current programme status, the wording from his item 5;
  * Open-Access Practitioner Resources, the three entries from his item 3.

WHAT IS NOT ADDED, AND WHY. The five priorities were tested against this file
earlier and three had no target here: there is no consulting or pilot-obligation
language, no prevalence or effectiveness wording, and no Commercial Inquiries
section. A Commercial Inquiries FORM is deliberately not added: this page
already carries the Commercial Inbox, which is the private queue that receives
those inquiries, and adding a second intake path on the same page would create
two routes to one mailbox.

PRIVACY POSTURE IS ASSERTED, NOT ASSUMED. The run fails if noindex, the
no-referrer policy, or any of the private sections is missing afterwards, and
if the page ever gains an analytics tag.

    python3 scripts/apply_programme_status_refinement.py --check
    python3 scripts/apply_programme_status_refinement.py --apply
"""
import argparse
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, "programme-status-9872fb93cc94.html")

ANCHOR = "  <h1>JRS Programme Status</h1>\n"

BLOCKS = '''  <!-- CURRENT PROGRAMME STATUS and OPEN-ACCESS PRACTITIONER RESOURCES.
       Added 2026-09-04 at his direction, directly under the h1 and above the
       Commercial Inbox, so the page states where the programme stands before
       it shows a queue of names.

       This page remains private: opaque unlinked slug, noindex,nofollow,
       no-referrer, no analytics tag, no token. Nothing below is a reason to
       link it anywhere, and no private row from this page is duplicated to
       the public site. -->
  <div style="border:1px solid rgba(190,148,71,.3);background:rgba(190,148,71,.03);padding:18px 20px;margin:18px 0;">
   <div style="font-family:'JetBrains Mono',monospace;font-size:7.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:8px;">Current programme status</div>
   <p style="font-size:13.5px;color:var(--muted);line-height:1.7;margin:0;">JRS is in an active stage of operational development and validation. Current findings, practitioner exercises, and technical demonstrations should be interpreted according to their stated methods and limitations.</p>
  </div>

  <div style="border:1px solid var(--rule);padding:18px 20px;margin:18px 0;">
   <div style="font-family:'JetBrains Mono',monospace;font-size:7.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:12px;">Open-access practitioner resources</div>
   <div style="margin-bottom:12px;">
    <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">Investigator Field Guides</div>
    <p style="font-size:12.5px;color:var(--muted);line-height:1.6;margin:0 0 5px;">Practical resources for reviewing consequential documentation in investigative, employment, housing, and related environments.</p>
    <a href="investigator-guides.html" style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);text-decoration:none;">Open the guides &#8594;</a>
   </div>
   <div style="margin-bottom:12px;">
    <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">Reviewer Training</div>
    <p style="font-size:12.5px;color:var(--muted);line-height:1.6;margin:0 0 5px;">Six self-paced modules introducing the JRS review conditions, supported by a companion desk reference and certificate.</p>
    <a href="training.html" style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);text-decoration:none;">Open the training &#8594;</a>
   </div>
   <div>
    <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">Simulations and Exercises</div>
    <p style="font-size:12.5px;color:var(--muted);line-height:1.6;margin:0 0 5px;">Practical scenarios examining evidence gaps, chronology problems, reasoning traceability, and Decision Reconstruction Risk.</p>
    <a href="simulations.html" style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);text-decoration:none;">Open the simulations &#8594;</a>
   </div>
  </div>

'''

MUST_SURVIVE = [
    '<meta name="robots" content="noindex,nofollow">',
    '<meta name="referrer" content="no-referrer">',
    "<title>Programme Status | JRS</title>",
    "Commercial Inbox",
    "api/leads-4b7e2c9af106d385",
    "api/people-9dd1ecdf6f8cdfd4",
    "The Reviewer Panel",
    "Private Contact Detail",
    "Honor acceptances, with their quote",
    "Sale Dossier",
    "Buyer archetypes",
]
# Checked against the file with HTML COMMENTS STRIPPED. The bare measurement
# id appears in a comment at the top of this page recording that analytics were
# removed on 2026-08-12, so a naive string search reports a tag that does not
# exist. What is banned is the tag actually LOADING: the script host or a gtag
# call in live markup.
BANNED = ["googletagmanager", "gtag("]
NEW = ["Current programme status", "Open-access practitioner resources",
       "Investigator Field Guides", "Reviewer Training",
       "Simulations and Exercises"]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.check):
        ap.error("pass --check or --apply")

    src = open(TARGET, encoding="utf-8").read()
    if src.count(ANCHOR) != 1:
        raise SystemExit("[REQUIRED_ENV_PARAM] h1 anchor matched %d times, "
                         "expected 1" % src.count(ANCHOR))
    for n in NEW:
        if n in src:
            raise SystemExit("[REQUIRED_ENV_PARAM] %r already present; the "
                             "blocks would be duplicated" % n)
    doc = src.replace(ANCHOR, ANCHOR + BLOCKS, 1)

    for m in MUST_SURVIVE:
        if m not in doc:
            raise SystemExit("[REQUIRED_ENV_PARAM] private-page element lost: "
                             "%s" % m)
    live = re.sub(r"<!--.*?-->", "", doc, flags=re.S)
    for b in BANNED:
        if b in live:
            raise SystemExit("[REQUIRED_ENV_PARAM] analytics tag introduced on "
                             "a private page: %s" % b)
    for n in NEW:
        if doc.count(n) != 1:
            raise SystemExit("[REQUIRED_ENV_PARAM] %r appears %d times"
                             % (n, doc.count(n)))
    for href in ("investigator-guides.html", "training.html",
                 "simulations.html"):
        if not os.path.exists(os.path.join(ROOT, href)):
            raise SystemExit("[REQUIRED_ENV_PARAM] link target missing: %s"
                             % href)
    # Anchored on the HEADING MARKUP, not the words. The explanatory comment
    # inserted above also contains the phrase "Commercial Inbox", so a bare
    # string search finds that comment first and reports the blocks as being
    # below a section they are in fact above.
    inbox_h2 = '<h2 style="font-size:22px">Commercial Inbox</h2>'
    if inbox_h2 not in doc:
        raise SystemExit("[REQUIRED_ENV_PARAM] Commercial Inbox heading not "
                         "found")
    label = ('letter-spacing:.18em;text-transform:uppercase;color:'
             'var(--accent);margin-bottom:8px;">Current programme status</div>')
    if doc.index(label) > doc.index(inbox_h2):
        raise SystemExit("[REQUIRED_ENV_PARAM] the status block must sit above "
                         "the Commercial Inbox heading")

    print("  inserted: current programme status")
    print("  inserted: open-access practitioner resources, 3 entries")
    print("  privacy posture intact: noindex, no-referrer, no analytics tag")
    print("  private sections intact: %d/%d" % (len(MUST_SURVIVE),
                                                len(MUST_SURVIVE)))
    print("  link targets exist: 3/3")
    print("  bytes: %d -> %d" % (len(src), len(doc)))
    if not args.apply:
        print("\nCHECK ONLY, nothing written")
        return 0
    open(TARGET, "w", encoding="utf-8").write(doc)
    print("\nwrote programme-status-9872fb93cc94.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
