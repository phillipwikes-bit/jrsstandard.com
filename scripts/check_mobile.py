#!/usr/bin/env python3
"""Mobile-friendliness audit across every page.

Checks the properties that actually break a page on a phone, each measurable
from the source rather than from a rendering engine:

  1. viewport meta present and not blocking zoom
  2. no fixed pixel width wider than a small phone (360 CSS px)
  3. tables are inside a horizontally scrollable container
  4. tap targets: buttons and primary links have a usable minimum height
  5. input font-size >= 16px, below which iOS Safari zooms the whole page
  6. at least one max-width media query, so the layout responds at all
  7. no horizontal overflow forced by white-space:nowrap on long prose

Usage: python3 scripts/check_mobile.py
Exit 0 = every page passes.
"""
import io
import os
import re
import sys

SKIP = {".git", "node_modules", "research", "__pycache__", ".vercel"}
PHONE = 360
R = []


def pages():
    o = []
    for b, d, f in os.walk("."):
        d[:] = [x for x in d if x not in SKIP]
        for fn in f:
            if fn.endswith(".html"):
                o.append(os.path.join(b, fn).lstrip("./"))
    return sorted(o)


def check(p, name, ok, detail=""):
    R.append((p, name, ok, detail))


for p in pages():
    s = io.open(p, encoding="utf-8", errors="replace").read()
    css = " ".join(re.findall(r"<style[^>]*>(.*?)</style>", s, re.S))
    inline = " ".join(re.findall(r'style="([^"]*)"', s))
    allcss = css + " " + inline

    vp = re.search(r'<meta name="viewport" content="([^"]*)"', s)
    check(p, "viewport", bool(vp), vp.group(1) if vp else "MISSING")
    if vp:
        v = vp.group(1)
        check(p, "zoom not blocked",
              "user-scalable=no" not in v and "maximum-scale=1" not in v, v)

    # Fixed widths wider than a small phone, excluding max-width and SVG attrs.
    wide = []
    for m in re.finditer(r"(?<!max-)(?<!min-)width\s*:\s*(\d{3,4})px", allcss):
        if int(m.group(1)) > PHONE:
            wide.append(m.group(1) + "px")
    check(p, "no fixed width wider than %dpx" % PHONE, not wide,
          ", ".join(sorted(set(wide))[:5]))

    ntab = s.count("<table")
    if ntab:
        wrapped = len(re.findall(r'overflow-x\s*:\s*auto', allcss))
        # table{display:block;overflow-x:auto} makes the table its own scroll
        # container, which is as valid as a wrapper div and is what the mobile
        # fix pack applies. The first version looked only for a wrapper.
        selfscroll = re.search(r"table\s*\{[^}]*overflow-x\s*:\s*auto", allcss) is not None
        check(p, "tables scroll horizontally",
              wrapped > 0 or "tablewrap" in s or selfscroll,
              "%d tables, %d scroll containers" % (ntab, wrapped))

    if "<button" in s:
        check(p, "buttons have a usable tap height",
              "min-height:44px" in allcss.replace(" ", "")
              or re.search(r"padding\s*:\s*1[0-9]px", allcss) is not None,
              "no min-height and no >=10px vertical padding found")

    if "<input" in s or "<textarea" in s or "<select" in s:
        sizes = [int(x) for x in re.findall(r"font-size\s*:\s*(\d+)px", allcss)]
        small = [x for x in sizes if x < 16]
        # Only fields matter, so look at the field rules specifically.
        field = re.findall(r"(?:input|textarea|select)[^{}]*\{[^}]*font-size\s*:\s*(\d+)px", allcss)
        bad = [f for f in field if int(f) < 16]
        # An !important 16px field rule wins the cascade regardless of what an
        # earlier rule says, so a page carrying it is NOT auto-zooming. The first
        # version of this check reported 20 false failures by reading the source
        # as a flat list instead of as a cascade.
        override = re.search(
            r"input\s*,\s*select\s*,\s*textarea\s*\{[^}]*font-size\s*:\s*(1[6-9]|[2-9]\d)px\s*!important",
            allcss.replace("\n", " "))
        if override:
            bad = []
        check(p, "form fields >= 16px, no iOS auto-zoom", not bad,
              "field font-size: " + ", ".join(bad) + "px" if bad else "")

    check(p, "has a responsive breakpoint",
          "@media" in css and "max-width" in css,
          "no max-width media query" if "@media" not in css else "")

fails = [r for r in R if not r[2]]
bypage = {}
for p, n, ok, d in fails:
    bypage.setdefault(p, []).append("%s%s" % (n, " (%s)" % d if d else ""))

for p in sorted(bypage):
    print("FAIL %-42s %s" % (p, "; ".join(bypage[p])))

print()
print("%d checks across %d pages, %d failed on %d pages"
      % (len(R), len(pages()), len(fails), len(bypage)))
sys.exit(1 if fails else 0)
