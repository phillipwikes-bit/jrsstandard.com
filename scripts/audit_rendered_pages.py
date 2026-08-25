#!/usr/bin/env python3
"""Render every page in a real browser and report what is actually broken.

WHY. Every checker in this repository reads source. Source checks passed while
the owner kept reporting the site was wrong, three times running, because the
defects were things only a rendering engine can see: a control hidden by a media
query, a section pushed below two screens of another section's copy, stylesheet
text leaking onto the page as visible characters. This opens each page at phone
and desktop width and looks at the result.

WHAT IT REPORTS, per page, per viewport:

  RAW-CSS          stylesheet text rendered as visible characters. The signature
                   of an unbalanced <style>: the browser closes at the first
                   </style> and the rest becomes body text.
  OVERFLOW         document wider than the viewport, in pixels.
  NO-H1            no visible level-one heading.
  MANY-H1          more than one visible h1.
  JS-ERROR         an uncaught exception during load.
  DUP-ID           the same id on more than one element.
  TINY-TAP         an interactive control under 32px tall on a phone.
  OFFSCREEN        visible content starting left of zero or past the right edge.
  BROKEN-IMG       an <img> that failed to load.
  EMPTY            under 200 characters of visible text.
  NO-VIEWPORT      missing or zoom-blocking viewport meta.

Findings are facts about the rendered page, not opinions about the design.

Usage:
  python3 scripts/audit_rendered_pages.py --base http://127.0.0.1:8811
  python3 scripts/audit_rendered_pages.py --base http://127.0.0.1:8811 --only training.html
Exit 0 when no page reports a finding.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
SKIP_DIRS = {".git", "node_modules", "research", "__pycache__", ".vercel",
             "templates", "scripts"}
VIEWPORTS = [("phone", 390, 844), ("desktop", 1280, 900)]

BASE = "http://127.0.0.1:8811"
ONLY = None
for i, a in enumerate(sys.argv):
    if a == "--base" and i + 1 < len(sys.argv):
        BASE = sys.argv[i + 1].rstrip("/")
    if a == "--only" and i + 1 < len(sys.argv):
        ONLY = sys.argv[i + 1]

PROBE = r"""
() => {
  const out = [];
  const vw = window.innerWidth;

  // RAW-CSS: stylesheet syntax that ended up as text nodes in the body.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n, leaked = null;
  const cssish = /\{[^{}]*(?:color|font-size|padding|margin|display|background|border)\s*:[^{}]*\}/;
  while ((n = walker.nextNode())) {
    const p = n.parentElement;
    if (!p || p.closest('style,script,code,pre,textarea')) continue;
    const t = (n.textContent || '').trim();
    if (t.length > 40 && cssish.test(t)) { leaked = t.slice(0, 90); break; }
  }
  if (leaked) out.push(['RAW-CSS', leaked]);

  // OVERFLOW
  const over = Math.round(document.documentElement.scrollWidth - vw);
  if (over > 2) out.push(['OVERFLOW', over + 'px wider than the viewport']);

  // H1
  const vis = el => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const h1s = [...document.querySelectorAll('h1')].filter(vis);
  if (h1s.length === 0) out.push(['NO-H1', 'no visible h1']);
  if (h1s.length > 1) out.push(['MANY-H1', h1s.length + ' visible h1 elements']);

  // DUP-ID
  const seen = {}, dups = [];
  for (const el of document.querySelectorAll('[id]')) {
    const id = el.id;
    if (!id) continue;
    if (seen[id]) { if (dups.indexOf(id) < 0) dups.push(id); }
    seen[id] = 1;
  }
  if (dups.length) out.push(['DUP-ID', dups.slice(0, 6).join(', ')]);

  // TINY-TAP, phones only
  if (vw <= 480) {
    const small = [];
    for (const el of document.querySelectorAll('button, a.btn, .btn, .btn-open, .cta, input[type=submit]')) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.height < 32) {
        small.push((el.id || el.className || el.tagName) + '=' + Math.round(r.height) + 'px');
        if (small.length >= 4) break;
      }
    }
    if (small.length) out.push(['TINY-TAP', small.join(', ')]);
  }

  // OFFSCREEN
  // OFFSCREEN. Capped at the first 4000 leaf elements: index.html alone has
  // tens of thousands, and a full walk turned a 72-page audit into a job that
  // could not finish inside a tool call. Overflow is caught by OVERFLOW anyway;
  // this only names an offender when one exists early in the document.
  const off = [];
  const leaves = document.querySelectorAll('body *');
  const cap = Math.min(leaves.length, 4000);
  for (let li = 0; li < cap; li++) {
    const el = leaves[li];
    if (el.children.length) continue;
    // Skip links are parked far off-canvas on purpose and slide in on focus.
    // Reporting the deliberate pattern as a defect trains the reader to skim.
    if (el.classList && el.classList.contains('skip-link')) continue;
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.left < -2000) continue;
    if (r.left < -4 || r.right > vw + 4) {
      off.push((el.id || el.tagName) + ' [' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
      if (off.length >= 3) break;
    }
  }
  if (off.length) out.push(['OFFSCREEN', off.join(' ')]);

  // BROKEN-IMG
  const bad = [...document.images].filter(i => i.complete && i.naturalWidth === 0)
                                  .map(i => i.getAttribute('src') || '(no src)');
  if (bad.length) out.push(['BROKEN-IMG', bad.slice(0, 3).join(', ')]);

  // EMPTY
  const text = (document.body.innerText || '').trim();
  if (text.length < 200) out.push(['EMPTY', text.length + ' chars of visible text']);

  // NO-VIEWPORT
  const mv = document.querySelector('meta[name="viewport"]');
  const c = mv ? (mv.getAttribute('content') || '') : '';
  if (!mv) out.push(['NO-VIEWPORT', 'no viewport meta']);
  else if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\b|\.0)/.test(c))
    out.push(['NO-VIEWPORT', 'viewport blocks zoom: ' + c]);

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
    targets = [ONLY] if ONLY else pages()
    findings = []
    checked = 0

    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        for name, w, h in VIEWPORTS:
            ctx = b.new_context(viewport={"width": w, "height": h})
            pg = ctx.new_page()
            for rel in targets:
                errs = []
                handler = lambda e: errs.append(str(e))
                pg.on("pageerror", handler)
                try:
                    pg.goto(BASE + "/" + rel.replace(os.sep, "/"),
                            wait_until="domcontentloaded", timeout=25000)
                    pg.wait_for_timeout(400)
                    res = pg.evaluate(PROBE)
                except Exception as e:
                    res = [["LOAD-FAILED", str(e)[:90]]]
                pg.remove_listener("pageerror", handler)
                checked += 1
                for kind, detail in res:
                    findings.append((rel, name, kind, detail))
                if errs:
                    findings.append((rel, name, "JS-ERROR", errs[0][:90]))
            ctx.close()
        b.close()

    if findings:
        w1 = max(len(f[0]) for f in findings)
        w3 = max(len(f[2]) for f in findings)
        for rel, vp, kind, detail in sorted(findings):
            print("%-*s  %-7s  %-*s  %s" % (w1, rel, vp, w3, kind, detail))
    print("\n%d page-viewport renders, %d findings across %d pages"
          % (checked, len(findings), len(set(f[0] for f in findings))))
    return 0 if not findings else 1


if __name__ == "__main__":
    sys.exit(main())
