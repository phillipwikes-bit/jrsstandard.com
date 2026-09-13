#!/usr/bin/env python3
"""Build the four JRS investigator field guides from source, with the routing footer.

WHY THIS SCRIPT EXISTS
----------------------
F-2 in docs/implementation-audit/IMPLEMENTATION_AUDIT_AND_SOLUTION_ASSESSMENT.md:
the four shipped guides carry no route to the Seven-Point Record Defensibility
Check, and there was no generator for them anywhere in the repository, so the
only way to add the line was to edit the compiled PDFs. That is the "fixing the
shadow instead of the thing casting it" prohibition, so the operation halted.

WHAT THE HISTORY SEARCH FOUND, AND WHY IT DID NOT SOLVE IT
---------------------------------------------------------
git history does contain JRS_Investigator_Field_Guide.docx (added bc72a20,
deleted e3c5567, both 2026-05-16). It is NOT the source of the shipped PDF. It
is a superseded predecessor: 23,783 characters against the PDF's 14,042, 24
numbered headings against 7, with only 3 shared. Building from it would replace
the current guides with older, materially different content. It is recorded here
so nobody has to re-derive that, and it is deliberately not used.

WHAT THIS SCRIPT THEREFORE DOES
-------------------------------
It establishes the missing upstream. Source of truth is research/field-guide-src/
*.md, seeded by --extract from the shipped PDFs. From that source it renders
PDFs that carry the routing footer.

THE ONE THING IT DELIBERATELY DOES NOT DO: overwrite the four shipped guides.
Extraction recovers WORDING, not TYPOGRAPHY. The shipped guides have tables,
running headers, a document-control block and page numbering that no text
extraction preserves, so a regenerated file would be a visibly different
document from the one readers have already downloaded. Whether to republish in
a new layout is the owner's call, not a build script's. Output goes to
build/field-guides/ and --verify reports wording fidelity so that call can be
made on evidence.

USAGE
  python3 scripts/generate_field_guides.py --extract   # reseed source from PDFs
  python3 scripts/generate_field_guides.py --build     # render to build/field-guides/
  python3 scripts/generate_field_guides.py --verify    # wording fidelity vs shipped
"""

import argparse
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "research", "field-guide-src")
OUT_DIR = os.path.join(ROOT, "build", "field-guides")

# The routing line this script exists to add. One sentence, no claim, no figure,
# pointing at the diagnostic. It states the URL in text because a PDF may be
# printed, and a printed hyperlink a reader cannot type is not a route.
ROUTING_TITLE = "Test your records against the Seven-Point Standard"
ROUTING_BODY = (
    "This guide describes what a defensible record contains. To test a record you "
    "already have, work through the Seven-Point Record Defensibility Check at "
    '<link href="https://jrsstandard.com/check" color="#7A5E28">jrsstandard.com/check</link>. '
    "It takes one closed matter and about five minutes, asks for no registration and "
    "no upload, and your answers stay in your browser."
)

GUIDES = [
    # (source slug, shipped pdf filename, document id, title)
    ("general",       "JRS_Investigator_Field_Guide.pdf",
     "001-INV",   "JRS Investigator Field Guide"),
    ("employment",    "JRS_Investigator_Field_Guide_Employment.pdf",
     "001-INV-E", "JRS Investigator Field Guide (Employment / EEO)"),
    ("fairhousing",   "JRS_Investigator_Field_Guide_FairHousing.pdf",
     "001-INV-F", "JRS Investigator Field Guide (Fair Housing)"),
    ("international", "JRS_Investigator_Field_Guide_International.pdf",
     "001-INV-I", "JRS Investigator Field Guide (International)"),
]


def pdf_text(path):
    """Extract text from a PDF, or return '' when the tool or file is absent."""
    try:
        r = subprocess.run(["pdftotext", "-layout", path, "-"],
                           capture_output=True, text=True)
        return r.stdout or ""
    except (OSError, subprocess.SubprocessError):
        return ""


def strip_running_furniture(txt):
    """Drop the repeated page header and footer lines that extraction duplicates."""
    keep = []
    for line in txt.split("\n"):
        s = line.strip()
        if re.match(r"^JRS™ \| .*Page \d+$", s):
            continue
        if re.match(r"^JRS™ Investigator Field Guide.*Supplement$", s):
            continue
        keep.append(line.rstrip())
    return re.sub(r"\n{3,}", "\n\n", "\n".join(keep)).strip()


def do_extract():
    os.makedirs(SRC_DIR, exist_ok=True)
    n = 0
    for slug, pdf, docid, title in GUIDES:
        path = os.path.join(ROOT, pdf)
        if not os.path.exists(path):
            print("  MISSING %s" % pdf)
            continue
        body = strip_running_furniture(pdf_text(path))
        if not body:
            print("  EMPTY EXTRACTION %s (is pdftotext installed?)" % pdf)
            continue
        out = os.path.join(SRC_DIR, slug + ".md")
        with open(out, "w", encoding="utf-8") as f:
            f.write("<!-- guide: id=%s title=%s -->\n" % (docid, title))
            f.write("<!-- EXTRACTED from %s by scripts/generate_field_guides.py --extract.\n"
                    "     This is a TEXT extraction. It preserves wording, not typography. -->\n\n"
                    % pdf)
            f.write(body + "\n")
        n += 1
        print("  wrote %s (%d chars)" % (os.path.relpath(out, ROOT), len(body)))
    return 0 if n else 1


def do_build():
    try:
        from reportlab.lib.pagesizes import LETTER
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                        PageBreak, Preformatted)
    except ImportError:
        print("reportlab is not installed. pip install reportlab")
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)
    ss = getSampleStyleSheet()
    body_style = ParagraphStyle("body", parent=ss["BodyText"], fontName="Helvetica",
                                fontSize=9.5, leading=13, spaceAfter=6)
    title_style = ParagraphStyle("t", parent=ss["Title"], fontName="Helvetica-Bold",
                                 fontSize=17, leading=21, spaceAfter=14)
    head_style = ParagraphStyle("h", parent=ss["BodyText"], fontName="Helvetica-Bold",
                                fontSize=10.5, leading=14, spaceBefore=11, spaceAfter=4,
                                textColor=colors.HexColor("#7A5E28"))
    route_head = ParagraphStyle("rh", parent=body_style, fontName="Helvetica-Bold",
                                fontSize=11, leading=15, spaceBefore=6, spaceAfter=6,
                                textColor=colors.HexColor("#7A5E28"))
    mono = ParagraphStyle("m", parent=body_style, fontName="Courier", fontSize=8.2,
                          leading=10.5)

    built = 0
    for slug, pdf, docid, title in GUIDES:
        src = os.path.join(SRC_DIR, slug + ".md")
        if not os.path.exists(src):
            print("  NO SOURCE for %s (run --extract first)" % slug)
            continue
        raw = open(src, encoding="utf-8").read()
        raw = re.sub(r"<!--.*?-->", "", raw, flags=re.S).strip()

        out = os.path.join(OUT_DIR, pdf)
        doc = SimpleDocTemplate(out, pagesize=LETTER,
                                leftMargin=0.9 * inch, rightMargin=0.9 * inch,
                                topMargin=0.9 * inch, bottomMargin=0.9 * inch,
                                title=title, author="Phillip Wikes")

        def footer(canv, _doc):
            canv.saveState()
            canv.setFont("Helvetica", 7.5)
            canv.setFillColor(colors.HexColor("#555555"))
            canv.drawString(0.9 * inch, 0.55 * inch,
                            "JRS™ | %s | © 2026 Phillip Wikes | jrsstandard.com" % docid)
            canv.drawRightString(LETTER[0] - 0.9 * inch, 0.55 * inch, "Page %d" % _doc.page)
            canv.restoreState()

        flow = [Paragraph(title, title_style)]

        # AVAILABLE TEXT WIDTH, in points. Every monospaced block is fitted to
        # this. The first build overflowed it and Courier silently ran off the
        # right edge, truncating words mid-character ("pre-final", "procedural
        # p"). A guide that loses the end of its own sentences is worse than no
        # rebuild at all, so width is computed rather than assumed.
        avail = LETTER[0] - doc.leftMargin - doc.rightMargin

        def fitted_mono(chunk):
            """Render a layout-preserving block at a size that cannot overflow.

            Courier advance width is exactly 0.6 em, so the largest font size
            that fits N columns is avail / (0.6 * N). Shrink to fit down to a
            legibility floor; below that, hard-wrap at the column count the
            floor allows rather than let the text leave the page.
            """
            lines = chunk.replace("\t", "    ").split("\n")
            longest = max((len(l) for l in lines), default=1) or 1
            size = min(8.2, avail / (0.6 * longest))
            if size < 5.6:
                size = 5.6
                cols = int(avail / (0.6 * size))
                wrapped = []
                for l in lines:
                    while len(l) > cols:
                        cut = l.rfind(" ", 0, cols)
                        if cut <= 0:
                            cut = cols
                        wrapped.append(l[:cut])
                        l = "    " + l[cut:].lstrip()
                    wrapped.append(l)
                lines = wrapped
            st = ParagraphStyle("m%d" % int(size * 10), parent=mono,
                                fontSize=size, leading=size * 1.28)
            return Preformatted("\n".join(lines), st)

        def esc(t):
            return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        # A heading in the extracted text is a short line, on its own, with no
        # sentence punctuation: either ALL CAPS or a numbered section title.
        # Without this the first build glued them onto the following sentence
        # and produced "PURPOSE This supplement introduces...".
        def is_heading(line):
            t = line.strip()
            if not (3 < len(t) <= 70):
                return False
            if t.endswith((".", ",", ";", ":")):
                return False
            if re.match(r"^\d{1,2}[\.\)]\s+\S", t):
                return True
            letters = [c for c in t if c.isalpha()]
            return bool(letters) and all(c.isupper() for c in letters)

        def is_tabular(chunk):
            """True only for a real column block, not for merely indented prose.

            pdftotext -layout indents ordinary paragraphs, and the first build
            read that indentation as table structure, so most of the body
            rendered as 6pt monospace instead of readable prose. Leading
            indentation is therefore removed before the test, and a block only
            counts as tabular when at least two of its lines carry an INTERNAL
            run of three or more spaces, which is what a column gap looks like.
            """
            lines = [l for l in chunk.split("\n") if l.strip()]
            if len(lines) < 2:
                return bool(re.search(r"\S {3,}\S", chunk))
            return sum(1 for l in lines if re.search(r"\S {3,}\S", l.strip())) >= 2

        def dedent(chunk):
            lines = [l for l in chunk.split("\n") if l.strip()]
            if not lines:
                return chunk
            pad = min(len(l) - len(l.lstrip()) for l in lines)
            return "\n".join(l[pad:] if len(l) >= pad else l for l in chunk.split("\n"))

        for para in raw.split("\n\n"):
            chunk = dedent(para.strip("\n"))
            if not chunk.strip():
                continue
            if is_tabular(chunk):
                flow.append(fitted_mono(chunk))
                flow.append(Spacer(1, 5))
                continue
            # Split a heading off the top of a prose block so it renders as one.
            lines = chunk.split("\n")
            while lines and is_heading(lines[0]):
                flow.append(Paragraph(esc(lines.pop(0).strip()), head_style))
            body = " ".join(l.strip() for l in lines).strip()
            if body:
                flow.append(Paragraph(esc(re.sub(r"\s+", " ", body)), body_style))

        # THE ROUTING FOOTER. This is the whole purpose of the script, so it is
        # appended here rather than written into any source file: it can never be
        # lost by a source edit and can never be duplicated by one either.
        flow.append(PageBreak())
        flow.append(Paragraph(ROUTING_TITLE, route_head))
        flow.append(Paragraph(ROUTING_BODY, body_style))

        doc.build(flow, onFirstPage=footer, onLaterPages=footer)
        built += 1
        print("  built %s (%d bytes)" % (os.path.relpath(out, ROOT), os.path.getsize(out)))

    if built:
        print("\n  Output is in build/field-guides/. The shipped guides at the repository")
        print("  root are deliberately NOT overwritten. See the module docstring.")
    return 0 if built else 1


def do_verify():
    """Report wording fidelity of each built guide against the shipped one."""
    ok = True
    for slug, pdf, docid, title in GUIDES:
        shipped = os.path.join(ROOT, pdf)
        built = os.path.join(OUT_DIR, pdf)
        if not os.path.exists(built):
            print("  %-46s NOT BUILT (run --build)" % pdf)
            ok = False
            continue
        a = re.sub(r"\s+", " ", pdf_text(shipped)).strip().lower()
        b = re.sub(r"\s+", " ", pdf_text(built)).strip().lower()
        sents = [s.strip() for s in re.split(r"(?<=\.) ", a) if len(s.strip()) > 60]
        hit = sum(1 for s in sents if s[:70] in b)
        pct = (100.0 * hit / len(sents)) if sents else 0.0
        routed = "check" in b and "seven-point" in b
        print("  %-46s wording %3d/%3d (%5.1f%%)  routing_line=%s"
              % (pdf, hit, len(sents), pct, "YES" if routed else "NO"))
        if pct < 95.0 or not routed:
            ok = False
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--extract", action="store_true", help="reseed source markdown from the shipped PDFs")
    ap.add_argument("--build", action="store_true", help="render source to build/field-guides/")
    ap.add_argument("--verify", action="store_true", help="compare built output against shipped wording")
    a = ap.parse_args()
    if not (a.extract or a.build or a.verify):
        ap.print_help()
        return 2
    rc = 0
    if a.extract:
        print("EXTRACT"); rc |= do_extract()
    if a.build:
        print("BUILD");   rc |= do_build()
    if a.verify:
        print("VERIFY");  rc |= do_verify()
    return rc


if __name__ == "__main__":
    sys.exit(main())
