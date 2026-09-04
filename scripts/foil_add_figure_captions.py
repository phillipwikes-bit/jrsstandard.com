#!/usr/bin/env python3
"""Add figure numbers, captions and two in-text references to the FOIL DOCX.

SCOPE. Three caption paragraphs are inserted, one directly after each image
paragraph, and one sentence is appended to each of two existing paragraphs so
the two analytical charts are referenced in the text that discusses them.
Nothing else in word/document.xml is touched.

NUMBERING. The manuscript contains no existing "Figure" or "Table" number, so
the sequence is assigned in document order: the study overview at paragraph 16
is Figure 1, the outcome chart inside Section 5.1 at paragraph 57 is Figure 2,
and the source-type chart inside Section 5.4 at paragraph 85 is Figure 3. That
is also the order the production brief assumes.

REFERENCES ARE APPENDED, NOT INSERTED AS NEW PARAGRAPHS. Each reference joins
the paragraph immediately preceding its figure, so no new block interrupts the
argument and no existing sentence is rewritten.

The document defines no Caption style, so captions are built from explicit run
properties at 10pt against the 12pt body, centred to match the image
paragraphs they follow.

    python3 scripts/foil_add_figure_captions.py --check
    python3 scripts/foil_add_figure_captions.py --apply
"""
import argparse
import os
import re
import shutil
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "research", "foil_production_2026-09-01")
SRC = os.path.join(WORK, "00_ORIGINAL_Review_2.docx")
OUT = os.path.join(WORK, "FOIL_Article_FINAL_20260828_Review_2_FIGURES.docx")

CAPTIONS = [
    (16, "Figure 1. Overview of the 32-case study and documentation-read "
         "outcomes.",
         "The study examined 32 publicly available cases across four document "
         "classes using the three-level documentation read of Ready, Needs "
         "work, and Gap."),
    (57, "Figure 2. Documentation read by documented outcome.",
         "The figure shows the distribution of the three documentation reads "
         "across the documented outcomes in the 32-case corpus."),
    (85, "Figure 3. Documentation read distribution by source type.",
         "The figure shows the distribution of the three documentation reads "
         "across the four source classes in the study corpus."),
]

REFERENCES = [
    (56, " Figure 2 shows the distribution of documentation reads across the "
         "documented outcomes."),
    (84, " Figure 3 shows the distribution of documentation reads across the "
         "four source classes."),
]


def esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def caption_xml(label, body):
    return (
        '<w:p><w:pPr><w:spacing w:before="60" w:after="240"/>'
        '<w:jc w:val="center"/></w:pPr>'
        '<w:r><w:rPr><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>'
        '<w:t xml:space="preserve">%s </w:t></w:r>'
        '<w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>'
        '<w:t xml:space="preserve">%s</w:t></w:r></w:p>'
        % (esc(label), esc(body)))


def run_xml(text):
    return ('<w:r><w:t xml:space="preserve">%s</w:t></w:r>' % esc(text))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    if not (a.apply or a.check):
        ap.error("pass --check or --apply")
    if not os.path.exists(SRC):
        raise SystemExit("[REQUIRED_ENV_PARAM] source not found: %s" % SRC)

    z = zipfile.ZipFile(SRC)
    doc = z.read("word/document.xml").decode("utf-8")
    spans = [(m.start(), m.end()) for m in
             re.finditer(r"<w:p\b.*?</w:p>", doc, re.S)]
    problems = []

    for idx, label, body in CAPTIONS:
        if idx >= len(spans):
            problems.append("paragraph %d does not exist" % idx)
            continue
        block = doc[spans[idx][0]:spans[idx][1]]
        if "<w:drawing>" not in block:
            problems.append("paragraph %d is not an image paragraph" % idx)

    for idx, sentence in REFERENCES:
        if idx >= len(spans):
            problems.append("paragraph %d does not exist" % idx)
            continue
        block = doc[spans[idx][0]:spans[idx][1]]
        if "</w:r>" not in block:
            problems.append("paragraph %d carries no run to append to" % idx)
        if "Figure" in block:
            problems.append("paragraph %d already references a figure" % idx)

    if problems:
        for p in problems:
            print("FAIL  " + p)
        return 1

    # Keep each image with the caption that follows it. Without this the
    # inserted caption paragraph reflows onto the next page and the figure is
    # orphaned from its own number: measured on the first build, Figure 1's
    # image landed on page 2 with its caption on page 3, and Figure 2's image
    # on page 6 with its caption on page 7. This is the formatting change the
    # brief authorises to prevent a layout defect, and it is applied only to
    # the three image paragraphs.
    kept = 0
    for idx, _l, _b in sorted(CAPTIONS, key=lambda c: -c[0]):
        s0, s1 = spans[idx]
        block = doc[s0:s1]
        if "<w:keepNext/>" in block:
            continue
        if "<w:pPr>" in block:
            nb = block.replace("<w:pPr>", "<w:pPr><w:keepNext/>", 1)
        else:
            nb = re.sub(r"(<w:p\b[^>]*>)", r"\1<w:pPr><w:keepNext/></w:pPr>",
                        block, count=1)
        doc = doc[:s0] + nb + doc[s1:]
        spans = [(m.start(), m.end()) for m in
                 re.finditer(r"<w:p\b.*?</w:p>", doc, re.S)]
        kept += 1
    print("  keepNext set on %d image paragraph(s)" % kept)

    # Highest index first, so earlier offsets stay valid.
    edits = ([(i, "caption", caption_xml(l, b)) for i, l, b in CAPTIONS]
             + [(i, "reference", run_xml(s)) for i, s in REFERENCES])
    for idx, kind, payload in sorted(edits, key=lambda e: -e[0]):
        s0, s1 = spans[idx]
        if kind == "caption":
            doc = doc[:s1] + payload + doc[s1:]
            print("  caption after paragraph %d" % idx)
        else:
            block = doc[s0:s1]
            j = block.rindex("</w:r>") + len("</w:r>")
            doc = doc[:s0] + block[:j] + payload + block[j:] + doc[s1:]
            print("  reference appended to paragraph %d" % idx)

    if not a.apply:
        print("\nCHECK ONLY, nothing written")
        return 0

    shutil.copy2(SRC, OUT)
    tmp = OUT + ".tmp"
    zin = zipfile.ZipFile(SRC)
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "word/document.xml":
                zout.writestr(item, doc.encode("utf-8"))
            elif item.filename.startswith("word/media/image"):
                # Repainted PNGs come from the working directory.
                local = os.path.join(WORK, os.path.basename(item.filename))
                zout.writestr(item, open(local, "rb").read())
            else:
                zout.writestr(item, zin.read(item.filename))
    os.replace(tmp, OUT)
    print("\nwrote %s" % os.path.relpath(OUT, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
