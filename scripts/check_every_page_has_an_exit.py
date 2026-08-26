#!/usr/bin/env python3
"""Every page must offer a visible way back to the homepage, on a phone.

WHY. On 2026-08-26 the owner arrived at training.html from the menu and could
not get back. The page did carry two exits, but training.html:356 hid one of
them below the mobile breakpoint:

    @media(...){ .back-to-site{display:none} }

and the sticky nav that replaced it carried no Home entry at all: every link in
it was an in-page anchor except Pilot Program. That was survivable only while a
cross-site strip on the same page carried a Home link, and that strip was
removed an hour earlier, in this session, by me.

Source checks cannot see this. "Return to Home" was present in the HTML the
whole time, correctly pointing at index.html. It was simply invisible at the
width the owner was using. So this renders each page at phone width and asks
the only question that matters: is there something on screen a person can press
to get home.

An exit counts when it is VISIBLE at 390px and its href resolves to the
homepage. A link inside a horizontally scrollable nav counts, because the nav
scrolls and the entry is reachable; a display:none link does not.

Usage:
  python3 scripts/check_every_page_has_an_exit.py --base http://127.0.0.1:8811
Exit 0 = every page has a visible way home.
"""
import os
import sys

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
SKIP_DIRS = {".git", "node_modules", "research", "__pycache__", ".vercel",
             "templates", "scripts"}

# index.html IS the homepage.
#
# The two private owner surfaces are DELIBERATELY stranded. They are unlinked,
# opaque-slug pages carrying commercial and personal data, and CLAUDE.md
# requires that they never carry public chrome. Being unreachable in both
# directions is the point, so they are exempted with the reason recorded rather
# than quietly passing.
EXEMPT = {
    "index.html",
    "acquisition-9f3c2a7d4b.html",
    "vp-7c1f9a4e8d2b6035.html",
    "vp-7c1f9a4e8d2b6035.htm",
    "programme-status-9872fb93cc94.html",
}

BASE = "http://127.0.0.1:8811"
for i, a in enumerate(sys.argv):
    if a == "--base" and i + 1 < len(sys.argv):
        BASE = sys.argv[i + 1].rstrip("/")

PROBE = r"""
() => {
  const home = /(^|\/)index\.html($|[#?])|^\/$|^\.\.\/index\.html|^\.\.\/\.\.\/index\.html/;
  const out = [];
  for (const a of document.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href') || '';
    if (!home.test(href)) continue;
    const s = getComputedStyle(a);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) continue;
    const r = a.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    // Parked off-canvas on purpose (skip links) does not count as an exit.
    if (r.left < -2000) continue;
    out.push({ text: (a.textContent || '').trim().slice(0, 30), href: href,
               h: Math.round(r.height) });
    if (out.length >= 3) break;
  }
  return out;
}
"""


def pages():
    out = []
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for f in files:
            if f.endswith(".html"):
                out.append(os.path.relpath(os.path.join(base, f), ROOT))
    return sorted(out)


def main():
    targets = [p for p in pages() if p not in EXEMPT]
    stranded, thin, ok = [], [], 0

    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = b.new_context(viewport={"width": 390, "height": 844})
        pg = ctx.new_page()
        for rel in targets:
            try:
                pg.goto(BASE + "/" + rel.replace(os.sep, "/"),
                        wait_until="domcontentloaded", timeout=25000)
                pg.wait_for_timeout(300)
                exits = pg.evaluate(PROBE)
            except Exception as e:
                stranded.append("%s (load failed: %s)" % (rel, str(e)[:40]))
                continue
            if not exits:
                stranded.append(rel)
                continue
            ok += 1
            # An exit under 24px tall on a phone is technically present and
            # practically unhittable. Reported separately so a real absence is
            # never buried under a list of small ones.
            if max(e["h"] for e in exits) < 24:
                thin.append("%s (%dpx tall)" % (rel, max(e["h"] for e in exits)))
        b.close()

    for rel in stranded:
        print("STRANDED  %s" % rel)
    for t in thin:
        print("THIN      %s" % t)
    print("\n%d pages checked at 390px, %d with a visible way home, "
          "%d stranded, %d with only a sub-24px exit"
          % (len(targets), ok, len(stranded), len(thin)))
    return 0 if not stranded else 1


if __name__ == "__main__":
    sys.exit(main())
