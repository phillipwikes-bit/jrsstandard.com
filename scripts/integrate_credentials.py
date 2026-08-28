#!/usr/bin/env python3
"""Place the verified credential-and-proof sentence on the pages that ask a
cold visitor for trust and currently offer none.

WHY A SCRIPT AND NOT FOUR HAND EDITS. The sentence carries three figures that
must be live-bound, a CSS rule, and a 3,889-byte binder block that
scripts/check_zero_drift.py requires to be byte-identical everywhere it
appears. Hand-copying that four times is the drift this repository already
guards against in nine other places. The binder is READ from access.html at
run time rather than pasted here, so this script cannot become a fifth stale
copy of it.

THE FIGURES ARE NEVER TYPED. Every numeral in the sentence sits inside a
<span data-panel="..."> that JRS PANEL BINDER v2 overwrites from
/api/panel-stats on load. The numerals in the markup are the marked fallback,
not the claim.

SCOPE IS DELIBERATE AND check.html IS DELIBERATELY EXCLUDED. It already
publishes completers_detection (16) and countries_detection (11), which are the
DETECTION PANEL scoped figures. Putting completers_all (36) and countries_all
(16) beside them would place two different populations in one viewport, which is
the exact top-versus-bottom mismatch that the scoped keys were introduced to
end. A page that already proves itself correctly is not a target.

    python3 scripts/integrate_credentials.py            # dry run, default
    python3 scripts/integrate_credentials.py --apply
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BINDER_SOURCE = "access.html"
BINDER_RE = re.compile(r"<!-- JRS PANEL BINDER v2.*?<!-- /JRS PANEL BINDER v2 -->", re.S)

# The proof clause. Identical bytes on every page, so no page can drift from
# another. Only the lead verb and the object clause change, because "Built by"
# on a page of written guides and "the five conditions" on an API contract page
# are both wrong, and a sentence that does not fit its page gets rewritten by
# hand later, which is how drift starts.
PROOF = ('<b><span data-panel="reviewers_all">58</span> international reviewers '
         'across three studies</b> have graded records for this work, including '
         '<b><span data-panel="completers_all">36</span> independent experts across '
         '<span data-panel="countries_all">16</span> countries</b> who each '
         'completed a full 24-record set.')

CRED_CSS = ('.cred{font-size:12px;color:var(--muted-soft);line-height:1.6;'
            'border-left:2px solid var(--accent-dim);padding-left:11px;'
            'margin:18px 0 0;max-width:660px}')

LEAD = 'Built by <b>Phillip Wikes</b>, former Lead Civil Rights Officer, Maryland Commission on Civil Rights.'

# file -> (anchor that must appear exactly once, html inserted directly after it)
#
# Every anchor is the CLOSING TAG OF THE HERO BUTTON ROW. The credential goes
# BELOW the action on all four, following the decision recorded at
# access.html:78: credentials are supporting evidence, not a precondition, and
# at 110px tall they are the largest thing that can stand between a hook and an
# ask on a phone.
TARGETS = {
    "index.html": (
        '  <a href="enterprise.html#enterprise-inquiry" class="btn btn-accent">'
        'Embed the gate in your platform &rarr;</a>\n </div>',
        '\n <p class="cred">%s %s</p>' % (LEAD, PROOF),
    ),
    "enterprise.html": (
        ' <a href="security.html" class="btn btn-ghost">Security and data handling</a>\n</div>',
        '\n<p class="cred">%s %s</p>' % (LEAD, PROOF),
    ),
    "review-engine.html": (
        ' <a href="security.html" class="btn btn-ghost">Security and data handling</a>\n</div>',
        '\n<p class="cred">%s %s</p>' % (LEAD, PROOF),
    ),
}

# training.html's credential lives inside the enrolment overlay and already
# makes a DIFFERENT, training-specific claim. The proof is appended to that
# paragraph rather than replacing it, because the completion claim is not this
# script's to adjudicate.
TRAINING_ANCHOR = ('former Lead Civil Rights Officer, Maryland Commission on Civil Rights. '
                   'Every reviewer who has started this training has finished it.')
TRAINING_APPENDED = ' ' + PROOF


def read(rel):
    return io.open(os.path.join(ROOT, rel), encoding="utf-8").read()


def write(rel, body):
    io.open(os.path.join(ROOT, rel), "w", encoding="utf-8").write(body)


def canonical_binder():
    m = BINDER_RE.search(read(BINDER_SOURCE))
    if not m:
        raise SystemExit("no binder block found in %s" % BINDER_SOURCE)
    return m.group(0)


def add_css(src):
    """Insert the .cred rule at the end of the first <style> block."""
    if ".cred{" in src:
        return src, False
    i = src.find("</style>")
    if i < 0:
        raise SystemExit("no <style> block to extend")
    return src[:i] + CRED_CSS + "\n" + src[i:], True


def add_binder(src, binder):
    """Append the binder before </body>. A page with a data-panel span and no
    binder shows a frozen number wearing a live number's clothes."""
    if "JRS PANEL BINDER v2 ::" in src:
        return src, False
    i = src.rfind("</body>")
    if i < 0:
        raise SystemExit("no </body> to insert before")
    return src[:i] + binder + "\n" + src[i:], True


def apply_to(rel, anchor, insert, binder, dry):
    src = read(rel)
    n = src.count(anchor)
    if n != 1:
        raise SystemExit("%s: anchor appears %d times, expected exactly 1" % (rel, n))
    if insert.strip() in src:
        return (rel, "already present", 0)
    out = src.replace(anchor, anchor + insert, 1)
    out, css = add_css(out)
    out, bind = add_binder(out, binder)
    delta = len(out.encode("utf-8")) - len(src.encode("utf-8"))
    if not dry:
        write(rel, out)
    bits = ["cred"]
    if css:
        bits.append("css")
    if bind:
        bits.append("binder")
    return (rel, "+".join(bits), delta)


def main():
    dry = "--apply" not in sys.argv
    binder = canonical_binder()
    print("binder read from %s: %d bytes" % (BINDER_SOURCE, len(binder.encode("utf-8"))))
    rows = []
    for rel, (anchor, insert) in TARGETS.items():
        rows.append(apply_to(rel, anchor, insert, binder, dry))
    rows.append(apply_to("training.html", TRAINING_ANCHOR, TRAINING_APPENDED, binder, dry))

    print("%s" % ("DRY RUN, nothing written. Re-run with --apply."
                  if dry else "APPLIED"))
    for rel, what, delta in rows:
        print("  %-22s %-18s %+d bytes" % (rel, what, delta))
    return 0


if __name__ == "__main__":
    sys.exit(main())
