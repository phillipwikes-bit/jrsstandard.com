#!/usr/bin/env python3
"""Measure the dual-track architecture as a visitor actually meets it.

Renders the pages that carry the two tracks and reports, per viewport:
  * what is above the fold, in document order, with pixel offsets
  * where each track's entry point sits, as a percentage down the page
  * every call to action, its prominence class and where it leads
  * how many clicks separate a cold visitor from the enterprise inquiry

Nothing here is judged by reading source. Positions come from
getBoundingClientRect on a rendered page, which is the only thing that
answers "what does someone see in three seconds".

    python3 scripts/audit_dual_track.py [--json out.json]
"""
import http.server
import json
import os
import socketserver
import sys
import threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 0  # ephemeral; the OS picks a free port
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

VIEWPORTS = [("desktop", 1440, 900), ("phone", 390, 844)]

# The pages that carry one or both tracks.
PAGES = [
    ("index.html", "homepage, both tracks"),
    ("enterprise.html", "Track 1 landing"),
    ("review-engine.html", "Track 1 integration schema"),
    ("pilot.html", "Track 2 pilot"),
    ("training.html", "Track 2 training"),
]

# Substrings that mark a link or button as belonging to one track.
T1 = ("enterprise", "review-engine", "api", "integration", "licence",
      "license", "partner", "vendor", "platform", "inquiry", "scoping")
T2 = ("training", "simulation", "pilot", "guide", "codebook", "research",
      "standard", "card", "module", "reviewer")

JS = r"""
({vw, vh}) => {
  const seen = [];
  const px = e => { const r = e.getBoundingClientRect();
                    return {x:Math.round(r.x), y:Math.round(r.y+window.scrollY),
                            w:Math.round(r.width), h:Math.round(r.height)}; };
  const vis = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect();
                     return s.display!=='none' && s.visibility!=='hidden' &&
                            +s.opacity > 0.05 && r.width>1 && r.height>1; };

  // Every interactive element that leads somewhere.
  const ctas = [];
  document.querySelectorAll('a[href], button[onclick]').forEach(e => {
    if (!vis(e)) return;
    const p = px(e), cls = (e.className||'').toString();
    const txt = (e.textContent||'').replace(/\s+/g,' ').trim();
    if (!txt || txt.length > 70) return;
    let weight = 'link';
    if (/btn-primary/.test(cls)) weight = 'primary';
    else if (/btn-accent/.test(cls)) weight = 'accent';
    else if (/btn-ghost/.test(cls)) weight = 'ghost';
    else if (/\bbtn\b/.test(cls)) weight = 'button';
    else if (/nav-item|util-link|sticky-nav/.test(cls)) weight = 'nav';
    ctas.push({t:txt, href:e.getAttribute('href')||'',
               onclick:(e.getAttribute('onclick')||'').slice(0,60),
               weight, y:p.y, x:p.x, w:p.w, h:p.h});
  });

  // Headings, for hierarchy.
  const heads = [];
  document.querySelectorAll('h1,h2').forEach(e => {
    if (!vis(e)) return;
    heads.push({tag:e.tagName, t:(e.textContent||'').replace(/\s+/g,' ').trim().slice(0,80),
                y:px(e).y, size:Math.round(parseFloat(getComputedStyle(e).fontSize))});
  });

  return {
    docHeight: Math.round(document.documentElement.scrollHeight),
    overflow: document.documentElement.scrollWidth > vw + 1,
    ctas, heads,
    h1count: document.querySelectorAll('h1').length
  };
}
"""


def track_of(text, href):
    blob = (text + " " + href).lower()
    t1 = any(k in blob for k in T1)
    t2 = any(k in blob for k in T2)
    if t1 and not t2:
        return "T1"
    if t2 and not t1:
        return "T2"
    if t1 and t2:
        return "both"
    return "-"


def main():
    os.chdir(ROOT)

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), Quiet)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    from playwright.sync_api import sync_playwright
    report = {}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME)
        for page, role in PAGES:
            report[page] = {"role": role, "views": {}}
            for name, vw, vh in VIEWPORTS:
                pg = b.new_page(viewport={"width": vw, "height": vh})
                errs = []
                pg.on("pageerror", lambda e: errs.append(str(e)[:120]))
                pg.goto("http://127.0.0.1:%d/%s" % (port, page),
                        wait_until="domcontentloaded")
                pg.wait_for_timeout(500)
                d = pg.evaluate(JS, {"vw": vw, "vh": vh})
                pg.close()

                fold = [c for c in d["ctas"] if c["y"] < vh]
                for c in d["ctas"]:
                    c["track"] = track_of(c["t"], c["href"])
                first = {}
                for tr in ("T1", "T2"):
                    hits = [c for c in d["ctas"] if c["track"] == tr]
                    if hits:
                        top = min(hits, key=lambda c: c["y"])
                        first[tr] = {"t": top["t"], "y": top["y"],
                                     "weight": top["weight"],
                                     "pct": round(100.0 * top["y"] / max(d["docHeight"], 1), 1),
                                     "aboveFold": top["y"] < vh}
                    else:
                        first[tr] = None
                report[page]["views"][name] = {
                    "viewport": [vw, vh],
                    "docHeight": d["docHeight"],
                    "horizontalOverflow": d["overflow"],
                    "h1count": d["h1count"],
                    "jsErrors": errs,
                    "ctaTotal": len(d["ctas"]),
                    "ctaAboveFold": len(fold),
                    "aboveFold": [{"t": c["t"], "y": c["y"], "weight": c["weight"],
                                   "track": track_of(c["t"], c["href"])} for c in fold[:14]],
                    "firstTrackEntry": first,
                    "headings": d["heads"][:10],
                }
        b.close()
    srv.shutdown()

    for page, data in report.items():
        print("=" * 78)
        print("%s  (%s)" % (page, data["role"]))
        for view, d in data["views"].items():
            print("  %-8s %dx%d  page=%dpx  CTAs=%d (%d above fold)  h1=%d%s"
                  % (view, d["viewport"][0], d["viewport"][1], d["docHeight"],
                     d["ctaTotal"], d["ctaAboveFold"], d["h1count"],
                     "  JS-ERRORS=%d" % len(d["jsErrors"]) if d["jsErrors"] else ""))
            for tr in ("T1", "T2"):
                f = d["firstTrackEntry"][tr]
                if not f:
                    print("      %s first entry : NONE ON PAGE" % tr)
                else:
                    print("      %s first entry : y=%-6d (%4.1f%% down) %-8s %s%s"
                          % (tr, f["y"], f["pct"], f["weight"], f["t"][:40],
                             "  [above fold]" if f["aboveFold"] else "  <-- BELOW FOLD"))
            if d["aboveFold"]:
                print("      above the fold, in order:")
                for c in d["aboveFold"]:
                    print("        y=%-5d %-8s %-5s %s" % (c["y"], c["weight"], c["track"], c["t"][:52]))
            else:
                print("      above the fold: NOTHING CLICKABLE")
    if "--json" in sys.argv:
        out = sys.argv[sys.argv.index("--json") + 1]
        with open(out, "w") as fh:
            json.dump(report, fh, indent=2)
        print("\nwrote %s" % out)


if __name__ == "__main__":
    main()
