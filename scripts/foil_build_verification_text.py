#!/usr/bin/env python3
"""Regenerate 01_MANUSCRIPT/manuscript_verification.txt from a manuscript DOCX.

WHY IT IS REGENERATED AND NOT HAND-EDITED. analysis.py --verify checks twenty
reported figures against this file. If the manuscript changes and this file is
patched by hand, the two drift in exactly the way the file exists to prevent,
and the drift is invisible until a reviewer runs the script.

WHY THE EXTRACTOR IS VALIDATED BEFORE IT IS TRUSTED. An extractor that
reproduces the text almost correctly is worse than none: it would rewrite 257
lines and bury the real change among its own artefacts. One such generator
already stripped the underscores out of Blind_Recheck_RESULT_2026-08-28.json in
an earlier pass, and the corrupted filename was then read as a manuscript
error. So --selftest runs the extractor against the manuscript the packet was
built from and requires byte equality with the file already in the packet.
Only then is it run against the revised manuscript.

    python3 scripts/foil_build_verification_text.py --selftest OLD.docx OLD.txt
    python3 scripts/foil_build_verification_text.py --build NEW.docx OUT.txt
"""
import argparse
import io
import os
import re
import sys
import zipfile

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def cell_text(node_xml):
    runs = re.findall(r"<w:t(?: [^>]*)?>(.*?)</w:t>", node_xml, re.S)
    return unesc("".join(runs)).strip()


def para_text(b):
    """Runs joined, with <w:br/> and <w:tab/> honoured.

    The author block is one paragraph carrying line breaks, so joining runs
    blind would fuse "Stacyann Young" and "Independent Researcher" onto one
    line. The reference file keeps them apart, which is the correct reading of
    the document.
    """
    parts = re.findall(
        r"<w:t(?: [^>]*)?>(.*?)</w:t>|(<w:br\b[^>]*/>)|(<w:tab\b[^>]*/>)",
        b, re.S)
    out = []
    for t, br, tab in parts:
        if br:
            out.append("\n")
        elif tab:
            out.append("\t")
        else:
            out.append(unesc(t))
    return "".join(out)


def unesc(s):
    return (s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
             .replace("&quot;", '"').replace("&apos;", "'"))


def extract(docx_path):
    doc = zipfile.ZipFile(docx_path).read("word/document.xml").decode("utf-8")
    body = re.search(r"<w:body>(.*)</w:body>", doc, re.S).group(1)
    blocks = re.findall(r"<w:tbl>.*?</w:tbl>|<w:p\b.*?</w:p>", body, re.S)
    out = []
    counter = [0]
    for b in blocks:
        if b.startswith("<w:tbl>"):
            rows = re.findall(r"<w:tr\b.*?</w:tr>", b, re.S)
            grid = []
            for r in rows:
                cells = re.findall(r"<w:tc>.*?</w:tc>", r, re.S)
                grid.append([cell_text(c) for c in cells])
            if not grid:
                continue
            def row(cells):
                # An empty leading cell renders as "| |", not "|  |": the
                # padding belongs to the content, not to the delimiter.
                return "|" + "|".join(" %s " % c if c else " "
                                      for c in cells) + "|"
            out.append(row(grid[0]))
            out.append("|" + "---|" * len(grid[0]))
            for r in grid[1:]:
                out.append(row(r))
            out.append("")
            continue
        style = re.search(r'<w:pStyle w:val="([^"]+)"', b)
        numbered = "<w:numPr>" in b
        txt = para_text(b)
        if re.search(r"<w:drawing>", b) and not txt.strip():
            continue
        if not txt.strip():
            out.append("")
            continue
        if numbered:
            # Consecutive numbered paragraphs form one list: numbered in
            # sequence and not separated by blank lines, as in the reference.
            if out and out[-1] == "" and counter[0] > 0:
                out.pop()
            counter[0] += 1
            out.append("%d. %s" % (counter[0], txt.strip()))
            out.append("")
            continue
        counter[0] = 0
        if style and style.group(1).startswith("Heading"):
            out.append(" " + txt.strip())
        else:
            out.append(txt.strip())
        out.append("")
    # collapse runs of blank lines to one, and drop a trailing blank
    tidy = []
    for line in out:
        if line == "" and tidy and tidy[-1] == "":
            continue
        tidy.append(line)
    while tidy and tidy[-1] == "":
        tidy.pop()
    return "\n".join(tidy) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--selftest", nargs=2, metavar=("DOCX", "REFERENCE_TXT"))
    ap.add_argument("--build", nargs=2, metavar=("DOCX", "OUT_TXT"))
    a = ap.parse_args()
    if a.selftest:
        docx, ref = a.selftest
        got = extract(docx)
        want = io.open(ref, encoding="utf-8").read()
        if got == want:
            print("SELFTEST PASS  extractor reproduces %s byte for byte"
                  % os.path.basename(ref))
            return 0
        gl, wl = got.split("\n"), want.split("\n")
        print("SELFTEST FAIL  %d generated lines vs %d reference lines"
              % (len(gl), len(wl)))
        import difflib
        n = 0
        for line in difflib.unified_diff(wl, gl, "reference", "generated",
                                         lineterm="", n=0):
            if line.startswith(("---", "+++", "@@")):
                continue
            n += 1
            if n <= 24:
                print("  %s %s" % (line[0], line[1:][:150]))
        print("  ... %d differing line(s)" % n)
        return 1
    if a.build:
        docx, out = a.build
        io.open(out, "w", encoding="utf-8").write(extract(docx))
        print("wrote %s" % out)
        return 0
    ap.error("pass --selftest or --build")


if __name__ == "__main__":
    sys.exit(main())
