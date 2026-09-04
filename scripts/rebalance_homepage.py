#!/usr/bin/env python3
"""Move depth off the homepage into the panels that already exist for it.

The home panel measured 38,696px of a 39,361px page at 390x844: roughly
forty-six phone screens in one scroll, with 55 top-level blocks. Twelve
other panels already exist in the same document and most of those blocks
belong to one of them by subject.

Nothing is rewritten and nothing is deleted. Each block is moved
byte-for-byte into the panel built for its subject, so the depth stays on
the site one click away instead of stacked under the landing page.

    python3 scripts/rebalance_homepage.py [--dry-run]
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, "index.html")

# Block index in #section-home .container -> destination panel id.
# Indices come from scripts/audit_dual_track.py's measurement of the live
# page; the moved block is identified by its opening tag offset, never by
# its text, so a copy edit cannot silently retarget a move.
PLAN = {
    11: "section-doccond",   # Common Documentation Review Failures
    12: "section-library",   # Simulation Environment / Full Simulation Library
    15: "section-doccond",   # Recurring Observations
    19: "section-kit",       # How Organizations Typically Begin
    20: "section-roles",     # Role-Based Review Environments
    21: "section-kit",       # How JRS Fits Into Existing Workflows
    22: "section-guidance",  # Five Pre-Submission Review Questions
    25: "section-ai",        # Why AI-Assisted Drafting Changes Review Risk
    27: "section-doccond",   # Common Documentation Review Failures (detail)
    28: "section-tools",     # Operational Resources
    29: "section-kit",       # Implementation Progression
    30: "section-guidance",  # Record Stability Over Time
    31: "section-training",  # Simulation Training
    32: "section-guidance",  # How Review Works
    33: "section-guidance",  # Reviewer Judgment callout
    34: "section-guidance",  # Five Review Conditions
    35: "section-usecases",  # Where JRS Is Applied
    36: "section-kit",       # How Deployment Works
    37: "section-kit",       # Typical Deployment Pathway
    38: "section-kit",       # How Teams Usually Begin
    39: "section-kit",       # Deployment Boundaries
    40: "section-kit",       # Where JRS Fits
    41: "section-about",     # Operational Basis
    42: "section-kit",       # Deploy Review Controls
    43: "section-usecases",  # Record Types Covered
    44: "section-kit",       # Multi-Level Adoption Structure
    45: "section-about",     # Practitioner References
    46: "section-about",     # What JRS Does Not Do
    47: "section-about",     # From Practice
    48: "section-about",     # Operational FAQ
    49: "section-tools",     # Existing Workflow Environments
    51: "section-about",     # What This Is Not
    52: "section-about",     # Scope and Limitations
}


def find_top_level_blocks(src, start, end):
    """Return (open_offset, close_offset) for each direct child element."""
    blocks = []
    i = start
    while i < end:
        m = re.compile(r"<([a-zA-Z][a-zA-Z0-9]*)\b").search(src, i)
        if not m or m.start() >= end:
            break
        tag = m.group(1).lower()
        if tag in ("br", "hr", "img", "input", "meta", "link"):
            i = src.find(">", m.start()) + 1
            continue
        depth = 0
        j = m.start()
        pat = re.compile(r"<(/?)%s\b|<(/?)([a-zA-Z][a-zA-Z0-9]*)\b" % tag, re.I)
        # Walk tags of this element name only, tracking nesting.
        scan = re.compile(r"<(/?)(%s)\b" % tag, re.I)
        k = j
        while True:
            mm = scan.search(src, k)
            if not mm:
                return blocks
            if mm.group(1) == "":
                depth += 1
            else:
                depth -= 1
                if depth == 0:
                    close = src.find(">", mm.start()) + 1
                    blocks.append((m.start(), close))
                    i = close
                    break
            k = mm.end()
    return blocks


def main():
    dry = "--dry-run" in sys.argv
    src = io.open(PAGE, encoding="utf-8").read()
    original_len = len(src)

    # Attribute order in this file is id before class, so match on the id and
    # walk back to the opening tag rather than assuming a literal string.
    anchor = src.find('id="section-home"')
    assert anchor >= 0, "section-home not found"
    home = src.rfind("<div", 0, anchor)
    assert home >= 0, "section-home opening tag not found"
    cstart = src.find('<div class="container">', home)
    assert cstart >= 0, "home container not found"
    cstart = src.find(">", cstart) + 1

    # End of the home container: the next panel's opening tag. Panels are
    # written as <div id="section-x" class="page-section">, so find the next
    # id="section- after this one and walk back to its <div.
    m = re.compile(r'<div\s+id="section-[a-z]+"\s+class="page-section"').search(src, cstart)
    assert m, "no following panel found"
    nxt = m.start()
    cend = src.rfind("</div>", cstart, nxt)
    assert cend > cstart, "no container close before the next panel"

    blocks = find_top_level_blocks(src, cstart, cend)
    print("home container: %d top-level blocks" % len(blocks))
    missing = [i for i in PLAN if i >= len(blocks)]
    assert not missing, "plan references blocks that do not exist: %s" % missing

    # Cut from the bottom so earlier offsets stay valid.
    moves = {}
    for idx in sorted(PLAN, reverse=True):
        a, b = blocks[idx]
        moves.setdefault(PLAN[idx], []).insert(0, src[a:b])
        src = src[:a] + src[b:]

    moved_bytes = sum(len(x) for v in moves.values() for x in v)
    print("moving %d blocks, %d bytes, into %d panels"
          % (sum(len(v) for v in moves.values()), moved_bytes, len(moves)))

    banner = ("\n<!-- RELOCATED FROM THE HOME PANEL 2026-08-26. The home panel was\n"
              "     38,696px of a 39,361px page at 390x844, about forty-six phone\n"
              "     screens in one scroll. These blocks were moved byte-for-byte\n"
              "     into the panel that already existed for their subject. Nothing\n"
              "     was rewritten and nothing was deleted. -->\n")

    for panel, chunks in moves.items():
        p = src.find('id="%s"' % panel)
        assert p >= 0, "panel %s not found" % panel
        ins = src.find('<div class="container">', p)
        assert ins >= 0, "no container in %s" % panel
        ins = src.find(">", ins) + 1
        src = src[:ins] + banner + "\n".join(chunks) + "\n" + src[ins:]
        print("  %-22s <- %2d blocks, %6d bytes" % (panel, len(chunks),
                                                    sum(len(c) for c in chunks)))

    delta = len(src) - original_len
    print("document %d -> %d bytes (%+d, banners only)" % (original_len, len(src), delta))
    if dry:
        print("DRY RUN, nothing written")
        return
    io.open(PAGE, "w", encoding="utf-8").write(src)
    print("written")


if __name__ == "__main__":
    main()
