#!/usr/bin/env python3
"""Render a report page to a downloadable PDF.

WHY THIS EXISTS. Five reports were delivered as artifacts, which are web pages
rendered inside a sandbox that blocks downloads. The owner could read them and
could not keep them. An artifact is a viewing surface, not a deliverable; a
file is a deliverable. This turns one into the other.

Print handling is added at render time only, so the published artifact is never
modified: the light palette is stamped explicitly because a PDF has one theme
forever, backgrounds are preserved, and no card, table or section is allowed to
split across a page break.

    python3 scripts/render_report_pdf.py SOURCE.html OUT.pdf [--title "Name"]
"""
import io
import os
import sys
import http.server
import socketserver
import threading

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

PRINT_CSS = """
<style>
@page { size: Letter; margin: 16mm 15mm 18mm; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-size: 11pt; }
.wrap { max-width: none; padding: 0; }
header.mast { padding-top: 0; }
h1 { font-size: 29pt; }
h2 { font-size: 17pt; }
h3 { font-size: 12.5pt; }
section, .card, .verdict, .rung, .week, .depth, .tablewrap, .ev, footer,
ol.road > li, ol.fix > li { break-inside: avoid; page-break-inside: avoid; }
section { padding-top: 26px; }
h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; }
table { min-width: 0; font-size: 9.4pt; }
th, td { padding: 7px 9px; }
.ev, pre { font-size: 8.8pt; }
.card p, .rung p, .week-body ol, .lede, ul.tight { font-size: 10.3pt; }
.meta { font-size: 8.5pt; }
.verdict, .card { box-shadow: none; }
</style>
"""


def render(src_path, out_path):
    # A MARKDOWN SOURCE IS CONVERTED, NOT WRAPPED. This function used to drop
    # whatever it was given straight into <body>, so a .md file rendered with
    # literal '#', '**' and '---' markers and every heading, table and paragraph
    # collapsed into one block of running text. The FOIL manuscript PDF delivered
    # on 2026-08-27 has that defect: reported as an 11-page paper, actually
    # unformatted source. Converting here rather than at each call site means no
    # caller can forget.
    if src_path.lower().endswith((".md", ".markdown")):
        import subprocess
        tmp = out_path + ".src.html"
        r = subprocess.run([sys.executable,
                            os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                         "md_to_html.py"), src_path, tmp],
                           capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(tmp):
            raise SystemExit("markdown conversion failed for %s:\n%s%s"
                             % (src_path, r.stdout, r.stderr))
        src_path = tmp
    src = io.open(src_path, encoding="utf-8").read()
    body = src.replace("</style>", "</style>" + PRINT_CSS, 1)
    doc = ('<!doctype html><html lang="en" data-theme="light"><head>'
           '<meta charset="utf-8">'
           '<meta name="viewport" content="width=device-width,initial-scale=1">'
           '</head><body>' + body + '</body></html>')

    work = os.path.dirname(os.path.abspath(out_path)) or "."
    tmp = os.path.join(work, "._render.html")
    io.open(tmp, "w", encoding="utf-8").write(doc)

    cwd = os.getcwd()
    os.chdir(work)

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", 0), Quiet)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    errs = []
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            b = p.chromium.launch(executable_path=CHROME)
            pg = b.new_page(viewport={"width": 1100, "height": 1400})
            pg.on("pageerror", lambda e: errs.append(str(e)[:90]))
            pg.goto("http://127.0.0.1:%d/._render.html" % port,
                    wait_until="networkidle")
            pg.wait_for_timeout(1400)   # let the webfonts settle
            pg.emulate_media(media="print")
            pg.pdf(path=os.path.basename(out_path), format="Letter",
                   print_background=True,
                   margin={"top": "16mm", "bottom": "18mm",
                           "left": "15mm", "right": "15mm"})
            pg.close()
            b.close()
    finally:
        srv.shutdown()
        try:
            os.unlink(tmp)
        except OSError:
            pass
        os.chdir(cwd)

    size = os.path.getsize(out_path)
    raw = io.open(out_path, "rb").read(2048)
    pages = raw.count(b"/Type /Page") - raw.count(b"/Type /Pages")
    if pages <= 0:
        whole = io.open(out_path, "rb").read()
        pages = whole.count(b"/Type /Page") - whole.count(b"/Type /Pages")
    return size, pages, errs


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 2:
        print(__doc__)
        return 2
    src, out = args
    if not os.path.exists(src):
        print("missing source: %s" % src)
        return 1
    size, pages, errs = render(src, out)
    print("%-42s %s bytes, %d pages%s"
          % (os.path.basename(out), format(size, ","), pages,
             "  JS-ERRORS=%d" % len(errs) if errs else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
