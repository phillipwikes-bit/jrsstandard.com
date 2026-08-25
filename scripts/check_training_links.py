#!/usr/bin/env python3
"""Every training link on the site, and every companion-reference link, audited.

WHY THIS EXISTS. On 2026-08-25 the owner reported, in one message, that the
training links were "all screwed up": modules that would not open, a companion
desk reference he believed had been swapped for the Rapid Review Card, and a
"Deployment Kit" entry in the primary navigation where the training belonged.
Three different complaints about the same journey, and nothing in the repository
could answer any of them without a person opening pages by hand.

WHAT IT CHECKS.

  1. NAVIGATION. The primary nav on index.html must carry exactly one entry that
     reaches the training, and it must be named "Training". It previously
     carried two: a "Deployment Kit" button pointing at a retired product whose
     files api/dl.js deliberately refuses to serve, and "Reviewer Calibration",
     which is the training under a name nobody searching for training would
     recognise.

  2. THE COMPANION REFERENCE. Every link that offers the desk / companion
     reference must resolve to JRS-Reference-9d4f2a7c.pdf, the nineteen-page
     document, and NOT to JRS_Rapid_Review_Card.pdf, which is a one-page card.
     Those two sit next to each other in the kit list, which is exactly how one
     gets mistaken for the other.

  3. THE SIX MODULES. training.html must carry six module rows, six panels and
     six open buttons, with no gaps in the numbering. A missing panel renders as
     a row that does nothing when clicked, which is what "modules do not open"
     looks like from the outside.

  4. LABEL COHERENCE. No public page may send a reader to training.html under a
     label that does not contain the word "training", "module" or "certif". A
     link named for something else is a link the reader does not follow.

  5. LIVE TARGETS (skipped with --offline). The reference download must return
     the reference: this compares the served byte count against the repository
     copy, because a redirect that lands on the wrong PDF returns HTTP 200 and
     looks healthy in every check that only counts status codes.

Usage:
  python3 scripts/check_training_links.py
  python3 scripts/check_training_links.py --offline
Exit 0 = every check passes.
"""
import io
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://www.jrsstandard.com"

REFERENCE_PDF = "JRS-Reference-9d4f2a7c.pdf"
RAPID_CARD_PDF = "JRS_Rapid_Review_Card.pdf"

results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    return ok


def read(rel):
    try:
        with io.open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
            return fh.read()
    except Exception:
        return ""


def pages():
    skip = {".git", "node_modules", "research", "__pycache__", ".vercel", "templates"}
    out = []
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in skip and not d.startswith(".")]
        for f in files:
            if f.endswith(".html"):
                out.append(os.path.relpath(os.path.join(base, f), ROOT))
    return sorted(out)


# ---- 1. navigation ---------------------------------------------------------
def check_nav():
    src = read("index.html")
    nav_open = src.find('id="primary-nav-items"')
    nav_end = src.find("</div>", src.find("</nav>") - 400) if nav_open >= 0 else -1
    nav = src[nav_open:src.find("</nav>", nav_open)] if nav_open >= 0 else ""

    check("index.html has a primary nav", bool(nav),
          "%d chars" % len(nav) if nav else "not found")
    if not nav:
        return

    to_training = re.findall(r'<a href="training\.html"[^>]*>(.*?)</a>', nav, re.S)
    labels = [re.sub(r"<[^>]+>|&#\d+;|\s+", " ", t).strip() for t in to_training]
    check("exactly one nav entry reaches the training", len(to_training) == 1,
          "labels: %s" % (labels or "none"))
    check("the nav entry is named Training",
          bool(labels) and labels[0].lower().startswith("training"),
          "label is %r" % (labels[0] if labels else None))
    check("no retired Deployment Kit entry in the nav",
          "Deployment Kit" not in nav,
          "present" if "Deployment Kit" in nav else "absent")


# ---- 2. the companion reference --------------------------------------------
# A link is a reference offer when its own text names the reference. Matching on
# the link text rather than on the surrounding prose keeps this from firing on
# every paragraph that happens to mention the document.
REF_LINK_TEXT = re.compile(
    r'<a\s[^>]*href="([^"]+)"[^>]*>((?:(?!</a>).)*?'
    r'(?:desk reference|reviewer reference|companion reference)'
    r'(?:(?!</a>).)*?)</a>', re.I | re.S)


def check_reference_links():
    wrong = []
    total = 0
    for p in pages():
        src = read(p)
        for href, text in REF_LINK_TEXT.findall(src):
            total += 1
            if RAPID_CARD_PDF in href or "e=card" in href:
                label = re.sub(r"<[^>]+>|\s+", " ", text).strip()
                wrong.append("%s -> %s (%r)" % (p, href, label[:50]))
            elif REFERENCE_PDF not in href:
                label = re.sub(r"<[^>]+>|\s+", " ", text).strip()
                wrong.append("%s -> %s (%r)" % (p, href, label[:50]))
    check("every companion-reference link points at the 19-page reference",
          not wrong,
          "; ".join(wrong) if wrong else "%d reference links, all correct" % total)
    check("at least one companion-reference link exists", total > 0,
          "%d found" % total)


# ---- 3. the six modules ----------------------------------------------------
def check_six_modules():
    src = read("training.html")
    rows = sorted(int(n) for n in re.findall(r'id="module-row-(\d)"', src))
    panels = sorted(int(n) for n in re.findall(r'id="module-panel-(\d)"', src))
    btns = sorted(int(n) for n in re.findall(r'id="module-btn-(\d)"', src))
    want = [0, 1, 2, 3, 4, 5]
    check("training.html carries six module rows", rows == want, "rows=%s" % rows)
    check("training.html carries six module panels", panels == want,
          "panels=%s" % panels)
    check("training.html carries six open buttons", btns == want, "buttons=%s" % btns)

    # Every row must be wired to the toggle, or it is decoration.
    wired = re.findall(r'onclick="toggleModule\((\d)\)"', src)
    have = sorted(set(int(n) for n in wired))
    check("every module row is wired to toggleModule", have == want,
          "wired=%s" % have)

    # The desk reference must sit INSIDE the modules block, because focus mode
    # (?focus=1, the link handed to reviewers) hides everything outside it.
    tm = src.find('<div id="training-modules"')
    end, depth = -1, 0
    if tm >= 0:
        for m in re.finditer(r"<div\b|</div>", src[tm:]):
            if m.group(0) == "</div>":
                depth -= 1
                if depth == 0:
                    end = tm + m.end()
                    break
            else:
                depth += 1
    desk = src.find("Reviewer Desk Reference")
    check("the desk reference sits inside the modules block, so focus mode keeps it",
          tm >= 0 and end > 0 and tm < desk < end,
          "block=%d..%d desk=%d" % (tm, end, desk))


# ---- 4. label coherence ----------------------------------------------------
GOOD_LABEL = re.compile(r"train|module|certif", re.I)


def check_labels():
    bad = []
    for p in pages():
        if p == "training.html":
            continue
        src = read(p)
        for m in re.finditer(r'<a\s[^>]*href="(/?training\.html[^"]*)"[^>]*>(.*?)</a>',
                             src, re.S):
            label = re.sub(r"<[^>]+>|&[a-z]+;|&#\d+;", " ", m.group(2))
            label = re.sub(r"\s+", " ", label).strip()
            if not label:
                continue
            if not GOOD_LABEL.search(label):
                bad.append("%s: %r" % (p, label[:44]))
    check("no training link hides behind an unrelated label", not bad,
          "; ".join(bad[:6]) + (" (+%d more)" % (len(bad) - 6) if len(bad) > 6 else "")
          if bad else "every training link names the training")


# ---- 5. live targets -------------------------------------------------------
def fetch_len(path):
    req = urllib.request.Request(BASE + path,
                                 headers={"User-Agent": "jrs-links/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, len(r.read())


def check_live():
    try:
        want = os.path.getsize(os.path.join(ROOT, REFERENCE_PDF))
    except Exception:
        check("reference PDF exists in the repository", False, "missing")
        return
    check("reference PDF exists in the repository", True, "%d bytes" % want)

    try:
        status, got = fetch_len("/api/dl?f=%s&src=training-kit" % REFERENCE_PDF)
    except Exception as e:
        check("the desk reference download returns the reference", False,
              "fetch failed: %r" % (e,))
        return
    check("the desk reference download returns the reference",
          status == 200 and got == want,
          "HTTP %s, %d bytes, repository copy %d" % (status, got, want))

    # And prove the two are actually distinguishable by size, so the check above
    # is not passing on a coincidence.
    try:
        card = os.path.getsize(os.path.join(ROOT, RAPID_CARD_PDF))
    except Exception:
        card = -1
    check("the reference and the rapid card are different documents",
          card > 0 and card != want,
          "reference %d bytes, rapid card %d bytes" % (want, card))


# ---- 6. the implementation surface must not gate the training --------------
def check_kit_surface_does_not_gate_training():
    """The Deployment Kit section on index.html sells an implementation package.

    Its headline promise used to be "Reviewer training", obtainable by
    requesting pilot participation. The training is free, open, in the browser
    and reachable in one click, so the homepage was routing everyone who wanted
    it into a request queue for a package api/dl.js:38 will not serve. The
    section keeps its implementation content; the training is now offered first
    and named as free wherever the section mentions it.
    """
    src = read("index.html")
    i = src.find('id="section-kit"')
    if i < 0:
        check("index.html still has an implementation section", False, "not found")
        return
    depth, end = 0, -1
    start = src.rfind("<", 0, i)
    for m in re.finditer(r"<div\b|</div>", src[start:]):
        if m.group(0) == "</div>":
            depth -= 1
            if depth == 0:
                end = start + m.end()
                break
        else:
            depth += 1
    blk = src[start:end] if end > 0 else ""
    check("index.html still has an implementation section", bool(blk),
          "%d chars" % len(blk))
    if not blk:
        return

    check("the implementation section links to the free training",
          'href="training.html"' in blk,
          "%d training links inside the section" % blk.count('href="training.html"'))

    check("the section names the training as free",
          "free" in blk.lower() and "training" in blk.lower(),
          "free-training language present")

    # The retired product name must not be the badge on the section any more.
    check("the section is not badged as the retired Deployment Kit",
          '<div class="kit-badge">Deployment Kit</div>' not in blk,
          "badge is Training & Implementation")

    # No entry point anywhere may still be labelled for the retired product.
    check("no entry point is labelled View Deployment Kit",
          "View Deployment Kit" not in src,
          "absent" if "View Deployment Kit" not in src else "still present")


def main():
    offline = "--offline" in sys.argv
    check_nav()
    check_reference_links()
    check_six_modules()
    check_labels()
    check_kit_surface_does_not_gate_training()
    if not offline:
        check_live()

    width = max(len(n) for n, _, _ in results)
    failed = 0
    for name, ok, detail in results:
        if not ok:
            failed += 1
        print("%s  %-*s  %s" % ("PASS" if ok else "FAIL", width, name, detail))
    print("\n%d checks, %d failed" % (len(results), failed))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
