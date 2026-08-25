#!/usr/bin/env python3
"""Exhaustive link audit. Every link on every page, resolved, including anchors.

WHY. Three rounds of "the training links are broken" were answered with narrow
checks that each passed, because each one looked at the thing I already
suspected. Status-code checkers in this repository have never resolved in-page
anchors at all, so a link to page.html#does-not-exist has always reported 200
and been counted healthy. That is the whole class of defect this file closes.

WHAT IT RESOLVES, per page, from the repository source:

  1. href to a local .html file            -> the file must exist
  2. href with a #fragment                 -> the TARGET PAGE must contain that
                                              id (or a name= anchor). This is
                                              the check nothing here has ever
                                              done.
  3. bare #fragment on the same page       -> same rule, against itself
  4. href to a local asset (pdf/png/...)   -> the file must exist
  5. href to /api/dl?...                   -> the token must be one api/dl.js
                                              actually honours, and the file it
                                              maps to must exist on disk
  6. onclick="showSection('x')"            -> a section with that id must exist
                                              on the same page
  7. onclick="showSimTab(n)"               -> a sim-panel-n must exist
  8. onclick="toggleModule(n)"             -> a module-panel-n must exist
  9. href to a directory path (/reviewer/) -> an index.html must exist there
 10. mailto:                               -> must be the canonical address

Every finding prints file:line so it can be opened directly.

Usage:
  python3 scripts/audit_all_links.py              # full audit
  python3 scripts/audit_all_links.py --training   # only pages/links touching training
Exit 0 = no broken links.
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "node_modules", "research", "__pycache__", ".vercel",
             "templates", "scripts"}
CANONICAL_EMAIL = "info@jrsstandard.com"

findings = []
stats = {"pages": 0, "links": 0, "anchors": 0, "api_dl": 0, "onclick": 0,
         "runtime": 0}


# An href built by JavaScript string concatenation or template interpolation.
# The source literal is a fragment of an expression, never a resolvable target.
RUNTIME = re.compile(r"'\s*\+|\+\s*'|\$\{|encodeURIComponent\(|\besc\(")


def is_runtime(href):
    return bool(RUNTIME.search(href))


def rel(p):
    return os.path.relpath(p, ROOT)


def pages():
    out = []
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for f in files:
            if f.endswith(".html"):
                out.append(os.path.join(base, f))
    return sorted(out)


def read(path):
    try:
        with io.open(path, encoding="utf-8") as fh:
            return fh.read()
    except Exception:
        return ""


def line_of(src, idx):
    return src.count("\n", 0, idx) + 1


def ids_of(src):
    """Every id= and name= anchor a fragment could legitimately target."""
    out = set(re.findall(r'\bid="([^"]+)"', src))
    out |= set(re.findall(r"\bid='([^']+)'", src))
    out |= set(re.findall(r'<a\s[^>]*\bname="([^"]+)"', src))
    return out


# ---- api/dl.js vocabulary, parsed from the endpoint itself ------------------
def dl_vocabulary():
    src = read(os.path.join(ROOT, "api", "dl.js"))
    files, docs, kits = {}, {}, set()
    m = re.search(r"const FILES = \{(.*?)\};", src, re.S)
    if m:
        for k, v in re.findall(r"(\w+):\s*'([^']+)'", m.group(1)):
            files[k] = v
    m = re.search(r"const DOCS = \{(.*?)\};", src, re.S)
    if m:
        for k, v in re.findall(r"(\w+):\s*'([^']+)'", m.group(1)):
            docs[k] = v
    m = re.search(r"const KITS = new Set\(\[(.*?)\]\)", src, re.S)
    if m:
        kits = set(re.findall(r"'([^']+)'", m.group(1)))
    # Aliases normEdition/normDoc accept, so a link using one is not reported
    # as unknown when the endpoint would in fact serve it.
    alias_doc = {"std": "standard", "jrs": "standard", "rapidcard": "card",
                 "rrc": "card", "reviewcard": "card", "drrarticle": "drr",
                 "researchpaper": "paper", "reliability": "accuracy"}
    alias_ed = {"eeo": "employment", "housing": "fairhousing", "fh": "fairhousing",
                "intl": "international", "int": "international"}
    return files, docs, kits, alias_doc, alias_ed


FILES, DOCS, KITS, ALIAS_DOC, ALIAS_ED = dl_vocabulary()


def resolve_local(from_page, href):
    """Map an href to a path on disk, or None if it is not a local target."""
    path = href.split("#", 1)[0].split("?", 1)[0]
    if not path:
        return None
    if path.startswith("/"):
        cand = os.path.join(ROOT, path.lstrip("/"))
    else:
        cand = os.path.join(os.path.dirname(from_page), path)
    cand = os.path.normpath(cand)
    if cand.endswith("/") or os.path.isdir(cand):
        cand = os.path.join(cand, "index.html")
    if not os.path.splitext(cand)[1]:
        # extensionless route: Vercel serves <name>.html
        if os.path.exists(cand + ".html"):
            cand += ".html"
        elif os.path.isdir(cand):
            cand = os.path.join(cand, "index.html")
    return cand


def audit_page(path, cache):
    src = read(path)
    if not src:
        return
    stats["pages"] += 1
    here = ids_of(src)
    page = rel(path)

    for m in re.finditer(r'<a\s[^>]*href="([^"]*)"', src):
        href = m.group(1).strip()
        ln = line_of(src, m.start())
        if not href or href.startswith(("http://", "https://", "tel:", "javascript:")):
            continue
        # Skip hrefs assembled at runtime. These live inside <script> string
        # concatenation, so the literal in the source is a fragment, not a URL,
        # and resolving it produces noise that hides the real findings. They are
        # counted so the number is not silently smaller than the page's links.
        if is_runtime(href):
            stats["runtime"] += 1
            continue
        stats["links"] += 1

        if href.startswith("mailto:"):
            addr = href[7:].split("?", 1)[0]
            if is_runtime(addr):
                stats["runtime"] += 1
                continue
            if addr and addr != CANONICAL_EMAIL:
                findings.append((page, ln, "non-canonical mailto", href))
            continue

        # bare fragment, same page
        if href.startswith("#"):
            frag = href[1:]
            stats["anchors"] += 1
            if frag and frag not in here:
                findings.append((page, ln, "anchor not on this page", href))
            continue

        target = resolve_local(path, href)
        if target is None:
            continue

        if href.startswith("/api/") or "/api/" in href.split("?", 1)[0]:
            audit_api_link(page, ln, href)
            continue

        if not os.path.exists(target):
            findings.append((page, ln, "target file does not exist", href))
            continue

        # cross-page fragment
        if "#" in href:
            frag = href.split("#", 1)[1]
            if frag:
                stats["anchors"] += 1
                if target not in cache:
                    cache[target] = ids_of(read(target))
                if frag not in cache[target]:
                    findings.append((page, ln, "anchor not on the target page", href))

    # onclick handlers are links in every way that matters to a reader
    for m in re.finditer(r"showSection\('([^']+)'\)", src):
        stats["onclick"] += 1
        sid = m.group(1)
        if ("section-" + sid) not in here and sid not in here:
            findings.append((page, line_of(src, m.start()),
                             "showSection target missing", sid))
    for m in re.finditer(r"showSimTab\((\d+)\)", src):
        stats["onclick"] += 1
        n = m.group(1)
        if ("sim-panel-" + n) not in here:
            findings.append((page, line_of(src, m.start()),
                             "showSimTab panel missing", "sim-panel-" + n))
    for m in re.finditer(r"toggleModule\((\d+)\)", src):
        stats["onclick"] += 1
        n = m.group(1)
        if ("module-panel-" + n) not in here:
            findings.append((page, line_of(src, m.start()),
                             "toggleModule panel missing", "module-panel-" + n))


def audit_api_link(page, ln, href):
    q = href.split("?", 1)[1] if "?" in href else ""
    params = dict(p.split("=", 1) for p in q.split("&") if "=" in p)
    if "/api/dl" not in href or is_runtime(href):
        return
    stats["api_dl"] += 1
    e = re.sub(r"[^a-z]", "", (params.get("e") or "").lower())
    f = (params.get("f") or "").replace("&amp;", "")
    if e:
        key = ALIAS_ED.get(e, e)
        if key in FILES:
            name = FILES[key]
        else:
            key = ALIAS_DOC.get(e, e)
            name = DOCS.get(key)
        if not name:
            findings.append((page, ln, "api/dl token not honoured by the endpoint", href))
            return
    elif f:
        if f not in KITS:
            findings.append((page, ln, "api/dl filename not whitelisted", href))
            return
        name = f
    else:
        findings.append((page, ln, "api/dl link carries no e= or f=", href))
        return
    if not os.path.exists(os.path.join(ROOT, name)):
        findings.append((page, ln, "api/dl maps to a file that does not exist",
                         "%s -> %s" % (href, name)))


def main():
    only_training = "--training" in sys.argv
    cache = {}
    for p in pages():
        audit_page(p, cache)

    rows = findings
    if only_training:
        rows = [r for r in rows if "training" in (r[0] + r[3]).lower()]

    if rows:
        width = max(len(r[2]) for r in rows)
        for page, ln, kind, detail in sorted(rows):
            print("BROKEN  %-38s %5d  %-*s  %s" % (page, ln, width, kind, detail))
    print("\n%d pages, %d links, %d anchors resolved, %d api/dl links, "
          "%d onclick targets, %d runtime-built hrefs skipped"
          % (stats["pages"], stats["links"], stats["anchors"], stats["api_dl"],
             stats["onclick"], stats["runtime"]))
    print("%d broken" % len(rows))
    return 0 if not rows else 1


if __name__ == "__main__":
    sys.exit(main())
