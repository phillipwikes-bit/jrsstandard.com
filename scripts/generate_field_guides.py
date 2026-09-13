#!/usr/bin/env python3
"""Append the Check routing page to each investigator field guide, design intact.

WHY THIS REPLACED A RECONSTRUCTION
----------------------------------
F-2 asked for a route from the four guides to the Seven-Point Record
Defensibility Check. No generator for the guides exists anywhere in the
repository or its history, so the first attempt rebuilt them from text
extracted out of the PDFs. That was wrong, and the evidence said so:

  - wording fidelity peaked at 90.5% against a 95% gate, a real 5 to 12
    per cent content loss;
  - 8 pages collapsed to 5;
  - the cover page, serif display type, gold rules and the aligned
    document-control block were all lost, because extraction recovers
    WORDING and never TYPOGRAPHY.

The anti-drift rule forbids patching a compiled artifact when an upstream
generator casts it. Here nothing casts it: the PDF is the only artifact that
has ever existed. So the PDF IS the upstream, and the correct pipeline takes
it as input and appends to it, deterministically and repeatably, rather than
trying to reproduce it. Every original page is carried through untouched, so
content and design fidelity are exact rather than approximate.

WHAT IT DOES
  1. Reads the running header and footer out of the original, so the appended
     page matches that specific guide instead of a hardcoded guess. This
     matters: a hardcoded table in the previous version had the Fair Housing
     document id as 001-INV-F and International as 001-INV-I, when the
     documents themselves say 001-INV-H and 001-INV-INT. Deriving them from
     the source makes that class of error impossible.
  2. Renders a single routing page carrying that header and footer, the next
     page number, and a live link to jrsstandard.com/check.
  3. Concatenates with pdfunite, from poppler, which is the same package that
     already supplies pdftotext for the verification step. No new dependency.
  4. --verify proves every original page survived byte-for-byte in its text,
     that exactly one page was added, and that the link annotation is present.

USAGE
  python3 scripts/generate_field_guides.py --build     # render to build/field-guides/
  python3 scripts/generate_field_guides.py --verify    # prove fidelity against shipped
  python3 scripts/generate_field_guides.py --publish   # copy build output over the shipped guides
"""

import argparse
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "build", "field-guides")

GUIDES = [
    "JRS_Investigator_Field_Guide.pdf",
    "JRS_Investigator_Field_Guide_Employment.pdf",
    "JRS_Investigator_Field_Guide_FairHousing.pdf",
    "JRS_Investigator_Field_Guide_International.pdf",
]

ROUTING_TITLE = "TEST YOUR RECORDS AGAINST THE SEVEN-POINT STANDARD"
ROUTING_BODY = (
    "This guide describes what a defensible record contains. To test a record you "
    "already have, work through the Seven-Point Record Defensibility Check at "
    '<link href="https://jrsstandard.com/check" color="#7A5E28">'
    "jrsstandard.com/check</link>. It takes one closed matter and about five minutes, "
    "asks for no registration and no upload, and your answers stay in your browser."
)
ROUTING_NOTE = (
    "The Check is a prompt for human review of a single record. It is not a "
    "determination about that record, not certification, and not a credential."
)


def pdf_text(path, first=None, last=None):
    cmd = ["pdftotext", "-layout"]
    if first:
        cmd += ["-f", str(first)]
    if last:
        cmd += ["-l", str(last)]
    cmd += [path, "-"]
    try:
        return subprocess.run(cmd, capture_output=True, text=True).stdout or ""
    except (OSError, subprocess.SubprocessError):
        return ""


def page_count(path):
    try:
        out = subprocess.run(["pdfinfo", path], capture_output=True, text=True).stdout
        m = re.search(r"^Pages:\s+(\d+)", out, re.M)
        return int(m.group(1)) if m else 0
    except (OSError, subprocess.SubprocessError):
        return 0


def furniture(path):
    """Recover this guide's own running header and footer, exactly as it sets them.

    Returns a dict the page painter can follow literally:
      head_left, head_right : the running header, split when the guide sets it
                              as two elements across the page
      foot_text             : the footer text without its page number
      foot_inline           : True when the page number sits inside the footer
                              string rather than right-aligned on its own
      foot_centred          : True when the footer is centred on the page

    READ FROM AN INTERIOR PAGE, NOT PAGE ONE. The cover carries no running
    header, so the earlier version of this function returned an empty header
    for the general guide and that guide's appended page came out bare. It
    also required a "·" separator, which only three of the four guides use:
    the general guide sets "JRS(tm) Investigator Field Guide" hard left and
    "001-INV | Technical Supplement" hard right, with no separator at all.
    Both assumptions were wrong, so both are gone.
    """
    n = page_count(path)
    probe = 3 if n >= 3 else n
    head_left = head_right = ""
    for line in pdf_text(path, probe, probe).split("\n"):
        if "JRS" not in line:
            continue
        s = line.rstrip()
        if not s.strip():
            continue
        gap = re.search(r"\S(\s{4,})\S", s)
        if gap:
            head_left = s[:gap.start() + 1].strip()
            head_right = s[gap.end() - 1:].strip()
        else:
            head_left = s.strip()
        break

    foot_text = ""
    foot_inline = False
    foot_centred = False
    for line in pdf_text(path).split("\n"):
        s = line.rstrip()
        if not (re.search(r"Page \d+$", s) and "JRS" in s):
            continue
        indent = len(s) - len(s.lstrip())
        before = re.sub(r"\s*Page \d+$", "", s).strip()
        # A wide run of spaces before the page number means it is set as its
        # own right-aligned element. A narrow one means it is part of the
        # footer sentence, which is how the general guide sets it.
        m = re.search(r"(\s*)Page \d+$", s)
        foot_inline = len(m.group(1)) < 10
        foot_centred = foot_inline and indent > 8
        foot_text = before
        break

    return {"head_left": head_left, "head_right": head_right,
            "foot_text": foot_text, "foot_inline": foot_inline,
            "foot_centred": foot_centred}


def do_build():
    try:
        from reportlab.lib.pagesizes import LETTER
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    except ImportError:
        print("reportlab is not installed. pip install reportlab")
        return 1

    if not shutil.which("pdfunite"):
        print("pdfunite not found. It ships with poppler-utils, the same package as pdftotext.")
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)
    ss = getSampleStyleSheet()
    # Serif body to match the guides, which set their prose in a serif face.
    body = ParagraphStyle("b", parent=ss["BodyText"], fontName="Times-Roman",
                          fontSize=10.5, leading=15, spaceAfter=10)
    label = ParagraphStyle("l", parent=body, fontName="Helvetica-Bold", fontSize=8.5,
                           leading=12, spaceAfter=14,
                           textColor=colors.HexColor("#7A5E28"))
    note = ParagraphStyle("n", parent=body, fontName="Times-Italic", fontSize=9.5,
                          leading=13, textColor=colors.HexColor("#555555"))

    built = 0
    for name in GUIDES:
        src = os.path.join(ROOT, name)
        if not os.path.exists(src):
            print("  MISSING %s" % name)
            continue
        n = page_count(src)
        if not n:
            print("  UNREADABLE %s" % name)
            continue
        fur = furniture(src)
        tmp = os.path.join(OUT_DIR, "_routing_%s" % name)
        out = os.path.join(OUT_DIR, name)

        doc = SimpleDocTemplate(tmp, pagesize=LETTER,
                                leftMargin=0.9 * inch, rightMargin=0.9 * inch,
                                topMargin=1.0 * inch, bottomMargin=0.9 * inch)

        def furniture_painter(canv, _doc, fur=fur, n=n):
            L, R = 0.9 * inch, LETTER[0] - 0.9 * inch
            canv.saveState()
            canv.setFont("Helvetica", 7.5)
            canv.setFillColor(colors.HexColor("#555555"))
            canv.setStrokeColor(colors.HexColor("#CCCCCC"))
            if fur["head_left"]:
                canv.drawString(L, LETTER[1] - 0.62 * inch, fur["head_left"])
                if fur["head_right"]:
                    canv.drawRightString(R, LETTER[1] - 0.62 * inch, fur["head_right"])
                canv.line(L, LETTER[1] - 0.72 * inch, R, LETTER[1] - 0.72 * inch)
            page_label = "Page %d" % (n + 1)
            if fur["foot_text"]:
                canv.line(L, 0.72 * inch, R, 0.72 * inch)
                if fur["foot_inline"]:
                    line = (fur["foot_text"] + " " + page_label).strip()
                    if fur["foot_centred"]:
                        canv.drawCentredString((L + R) / 2.0, 0.55 * inch, line)
                    else:
                        canv.drawString(L, 0.55 * inch, line)
                else:
                    canv.drawString(L, 0.55 * inch, fur["foot_text"])
                    canv.drawRightString(R, 0.55 * inch, page_label)
            else:
                canv.drawRightString(R, 0.55 * inch, page_label)
            canv.restoreState()

        doc.build([Paragraph(ROUTING_TITLE, label),
                   Paragraph(ROUTING_BODY, body),
                   Spacer(1, 6),
                   Paragraph(ROUTING_NOTE, note)],
                  onFirstPage=furniture_painter, onLaterPages=furniture_painter)

        r = subprocess.run(["pdfunite", src, tmp, out], capture_output=True, text=True)
        try:
            os.remove(tmp)
        except OSError:
            pass
        if r.returncode != 0:
            print("  pdfunite failed on %s: %s" % (name, r.stderr.strip()))
            continue
        built += 1
        print("  built %s  (%d + 1 = %d pages, %d bytes)"
              % (name, n, page_count(out), os.path.getsize(out)))

    if built:
        print("\n  Output is in build/field-guides/. Run --verify, then --publish.")
    return 0 if built == len(GUIDES) else 1


def do_verify():
    ok = True
    for name in GUIDES:
        src = os.path.join(ROOT, name)
        out = os.path.join(OUT_DIR, name)
        if not os.path.exists(out):
            print("  %-46s NOT BUILT" % name)
            ok = False
            continue
        n = page_count(src)
        m = page_count(out)
        # Every original page must survive EXACTLY. Compare the text of pages
        # 1..n in the output against the whole original.
        a = pdf_text(src)
        b = pdf_text(out, 1, n)
        same = (a == b)
        added = (m == n + 1)
        link = open(out, "rb").read().count(b"/URI") > 0
        route = "jrsstandard.com/check" in pdf_text(out, m, m)
        verdict = "PASS" if (same and added and link and route) else "FAIL"
        print("  %-46s %s  pages %d->%d  original_text_identical=%s  link=%s  routing=%s"
              % (name, verdict, n, m, same, link, route))
        if verdict == "FAIL":
            ok = False
    print("\n  %s" % ("Every original page is byte-identical in text and exactly one page was added."
                      if ok else "At least one guide did not verify. Nothing should be published."))
    return 0 if ok else 1


def do_publish():
    if do_verify() != 0:
        print("\nREFUSED: verification failed, so nothing was copied.")
        return 1
    for name in GUIDES:
        out = os.path.join(OUT_DIR, name)
        shutil.copyfile(out, os.path.join(ROOT, name))
        print("  published %s (%d bytes)" % (name, os.path.getsize(os.path.join(ROOT, name))))
    print("\n  Shipped guides replaced. Commit, deploy, then confirm with")
    print("  scripts/preflight_deploy_check.py --all")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--build", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--publish", action="store_true")
    a = ap.parse_args()
    if not (a.build or a.verify or a.publish):
        ap.print_help()
        return 2
    rc = 0
    if a.build:
        print("BUILD"); rc |= do_build()
    if a.verify and not a.publish:
        print("VERIFY"); rc |= do_verify()
    if a.publish:
        print("PUBLISH"); rc |= do_publish()
    return rc


if __name__ == "__main__":
    sys.exit(main())
