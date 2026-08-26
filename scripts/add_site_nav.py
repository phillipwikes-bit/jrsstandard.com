#!/usr/bin/env python3
"""Give every public page the same navigation bar.

WHY. The owner reported, repeatedly, that almost every link pulled up the home
page's default panel. The links were not broken. Measured across the site:

    72 pages
     6 carry any navigation at all
    66 carry none

On those 66 the only things in the header are the JRS wordmark and, in some
footers, "Home" -- and both correctly go to the front page. So from almost
anywhere on the site the only reachable destination WAS the front page. That is
not a broken link, it is a missing menu, and it looks identical from the
outside.

WHAT THIS INSTALLS. One canonical bar, byte-identical on every page that gets
it, placed immediately after the site header so it reads as part of the
chrome rather than as page content. It uses the section targets that
index.html now honours, so "Free Resources" opens the Free Resources panel
instead of dropping the reader on the default one.

It scrolls horizontally on a phone rather than wrapping, which is the pattern
already used by .sticky-nav on training.html and .util-bar-inner elsewhere, so
it behaves the way the rest of this site already behaves.

WHAT IS DELIBERATELY EXCLUDED, and why each one:

  programme-status-9872fb93cc94.html   private owner surface, must never carry
  acquisition-9f3c2a7d4b.html          public chrome or invite a public reader
  vp-7c1f9a4e8d2b6035.html
  bench-admin.html                     admin tool
  coauthor.html, honor.html            personal key-gated pages, single purpose
  contributor.html, access.html
  people.html                          deliberate retired dead end
  404.html                             already offers its own way back
  index.html, jrsstandard.html         already have a full menu
  enterprise.html, pilot.html
  review-engine.html, training.html

Usage:
  python3 scripts/add_site_nav.py           # install or update
  python3 scripts/add_site_nav.py --check   # report only, change nothing
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "node_modules", "research", "__pycache__", ".vercel",
             "templates", "scripts"}

EXCLUDE = {
    "programme-status-9872fb93cc94.html",
    "acquisition-9f3c2a7d4b.html",
    "vp-7c1f9a4e8d2b6035.html",
    "vp-7c1f9a4e8d2b6035.htm",
    "bench-admin.html",
    "coauthor.html",
    "honor.html",
    "contributor.html",
    "access.html",
    "people.html",
    "404.html",
    "index.html",
    "jrsstandard.html",
    "enterprise.html",
    "pilot.html",
    "review-engine.html",
    "training.html",
}

OPEN = "<!-- JRS SITE NAV v1 :: CANONICAL BLOCK. Byte-identical on every page that carries it. -->"
CLOSE = "<!-- /JRS SITE NAV v1 -->"

# Destinations, in the order a reader is most likely to want them. Every href is
# either a real page or a section index.html is now able to open.
NAV = OPEN + """
<nav class="jrs-sitenav" aria-label="Site">
 <a href="index.html">Home</a>
 <a href="training.html">Training</a>
 <a href="index.html#section-tools">Free Resources</a>
 <a href="simulations.html">Simulations</a>
 <a href="pilot.html">Pilot Program</a>
 <a href="enterprise.html">Enterprise</a>
 <a href="research.html">Research</a>
 <a href="jrsstandard.html">The Standard</a>
</nav>
""" + CLOSE

CSS_OPEN = "/* JRS SITE NAV v1 */"
CSS_CLOSE = "/* /JRS SITE NAV v1 */"
CSS = CSS_OPEN + """
.jrs-sitenav{display:flex;align-items:stretch;background:var(--bg);border-bottom:1px solid var(--rule);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.jrs-sitenav::-webkit-scrollbar{display:none}
.jrs-sitenav a{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted-soft);text-decoration:none;padding:13px 16px;border-right:1px solid var(--rule);white-space:nowrap;flex-shrink:0;display:flex;align-items:center;min-height:44px}
.jrs-sitenav a:hover{color:var(--accent);background:rgba(190,148,71,.05)}
@media(max-width:640px){ .jrs-sitenav a{padding:12px 13px;font-size:7.5px} }
""" + CSS_CLOSE


def pages():
    out = []
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for f in files:
            if f.endswith(".html"):
                out.append(os.path.relpath(os.path.join(base, f), ROOT))
    return sorted(out)


def depth_prefix(rel):
    """A page in reference/foo/ must reach index.html as ../../index.html."""
    d = os.path.dirname(rel)
    return "" if not d else "../" * (d.count(os.sep) + 1)


def main():
    check_only = "--check" in sys.argv
    added, already, skipped, failed = [], [], [], []

    for rel in pages():
        if os.path.basename(rel) in EXCLUDE and os.path.dirname(rel) == "":
            skipped.append(rel)
            continue
        if rel in EXCLUDE:
            skipped.append(rel)
            continue
        path = os.path.join(ROOT, rel)
        src = io.open(path, encoding="utf-8").read()

        if OPEN in src:
            already.append(rel)
            continue

        # The bar goes straight after the site header. Three pages
        # (org-pilot, recheck, supported) have no header at all: they open
        # directly on <main>. There the bar goes immediately before <main>,
        # which puts it in the same visual position a header would occupy.
        m = re.search(r"</header>", src)
        if m:
            at, tail_from = m.end(), m.end()
        else:
            m2 = re.search(r"<main\b", src)
            if not m2:
                failed.append("%s: no </header> and no <main> to anchor to" % rel)
                continue
            at, tail_from = m2.start(), m2.start()

        pre = depth_prefix(rel)
        block = NAV
        if pre:
            block = re.sub(r'href="(?!https?:|/|#)', 'href="' + pre, block)

        out = src[:at] + ("\n" if m else "") + block + ("" if m else "\n") + src[tail_from:]

        # The stylesheet goes in the page's own <style>, matching the
        # inline-only convention this codebase uses.
        s = re.search(r"</style>", out)
        if not s:
            failed.append("%s: no </style> to place the rule in" % rel)
            continue
        out = out[:s.start()] + CSS + "\n" + out[s.start():]

        if not check_only:
            io.open(path, "w", encoding="utf-8").write(out)
        added.append(rel)

    print("added:   %d" % len(added))
    for r in added:
        print("   " + r)
    print("already: %d" % len(already))
    print("skipped: %d" % len(skipped))
    for r in skipped:
        print("   " + r)
    if failed:
        print("FAILED:  %d" % len(failed))
        for r in failed:
            print("   " + r)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
