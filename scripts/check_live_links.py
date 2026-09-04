#!/usr/bin/env python3
"""Verify every internal link on the live site actually resolves.

DIFFERENT FROM THE FILESYSTEM CHECK IN scripts/repo_audit.py, AND THAT DIFFERENCE
IS THE POINT. That one asks whether a file exists in the repository. This one
asks whether the URL a visitor clicks returns something. Those diverge whenever a
page exists locally but was excluded from the deployment, which is exactly what
.vercelignore now does to *.md, scripts/ and research/.

WHAT COUNTS AS ACTIVE: any 2xx, or a 3xx whose Location eventually reaches a 2xx.
A redirect is a working link. A 404 or a 5xx is not. Redirects are followed to a
depth of 5 and the final status is what is reported, so a chain that ends in a
404 is caught rather than being credited as "it redirected, fine".

Anchors, mailto:, tel: and external hosts are out of scope. Query strings are
kept, because a route can be conditional on them.

Usage:
  python3 scripts/check_live_links.py
  python3 scripts/check_live_links.py --base https://jrsstandard-com-git-... (preview)
"""
import io
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://www.jrsstandard.com"
if "--base" in sys.argv:
    BASE = sys.argv[sys.argv.index("--base") + 1].rstrip("/")

SKIP_DIRS = {".git", "node_modules", "__pycache__", "research", ".vercel"}
ATTR = re.compile(r'(?:href|src)\s*=\s*"([^"]+)"')
# Fragments produced by JavaScript that builds markup are not links.
TEMPLATE = re.compile(r"""[+$`]|'\s*\+|\+\s*'|\$\{""")


def pages():
    out = []
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith(".html"):
                out.append(os.path.relpath(os.path.join(base, f), ROOT))
    return sorted(out)


def read(rel):
    return io.open(os.path.join(ROOT, rel), encoding="utf-8", errors="replace").read()


def fetch(path, depth=0):
    """Return (final_status, hops). Follows redirects manually to see the chain."""
    if depth > 5:
        return ("redirect-loop", depth)
    url = BASE + path if path.startswith("/") else BASE + "/" + path
    req = urllib.request.Request(url, method="GET",
                                 headers={"User-Agent": "jrs-linkcheck/1.0"})
    try:
        # Do not let urllib follow redirects silently; the chain is the evidence.
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *a, **k):
                return None
        op = urllib.request.build_opener(NoRedirect)
        with op.open(req, timeout=25) as r:
            return (r.status, depth)
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303, 307, 308):
            loc = e.headers.get("Location") or ""
            if not loc:
                return (e.code, depth)
            nxt = urllib.parse.urlparse(loc)
            if nxt.scheme and nxt.netloc and nxt.netloc not in BASE:
                return ("external-%d" % e.code, depth)
            target = loc if loc.startswith("/") else "/" + loc.lstrip("/")
            if nxt.scheme:
                target = nxt.path + (("?" + nxt.query) if nxt.query else "")
            return fetch(target, depth + 1)
        return (e.code, depth)
    except Exception as e:
        return ("error:%s" % type(e).__name__, depth)


targets = {}
for p in pages():
    body = read(p)
    # Markup built inside JS is not navigation.
    body = re.sub(r"<script[^>]*>.*?</script>", " ", body, flags=re.S | re.I)
    for t in ATTR.findall(body):
        if t.startswith(("http://", "https://", "mailto:", "tel:", "#", "data:", "//")):
            continue
        if TEMPLATE.search(t):
            continue
        t = t.replace("&amp;", "&").strip()
        if not t or t.startswith("javascript:"):
            continue
        path = t if t.startswith("/") else "/" + t
        targets.setdefault(path, set()).add(p)

print("Base: %s" % BASE)
print("%d distinct internal link targets across %d pages\n" % (len(targets), len(pages())))

ok, bad, redirs = [], [], []
for path in sorted(targets):
    status, hops = fetch(path)
    if isinstance(status, int) and 200 <= status < 300:
        (redirs if hops else ok).append((path, status, hops))
    else:
        bad.append((path, status, hops, sorted(targets[path])))

for path, status, hops, srcs in bad:
    print("DEAD  %-52s -> %s   linked from: %s"
          % (path[:52], status, ", ".join(srcs[:3])))
if redirs:
    print()
    for path, status, hops in redirs:
        print("REDIR %-52s -> %d after %d hop(s)" % (path[:52], status, hops))

print()
print("%d targets: %d direct 2xx, %d resolve via redirect, %d DEAD"
      % (len(targets), len(ok), len(redirs), len(bad)))
sys.exit(1 if bad else 0)
