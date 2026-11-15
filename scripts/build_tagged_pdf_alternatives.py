"""Create tagged *text-reading alternatives* for locked published JRS PDFs.

These are automated transcriptions, not approved replacement editions and not
PDF/UA, WCAG, image-alternative, or assistive-technology certifications.
Requires python-docx, Poppler, and LibreOffice with tagged-PDF export.
"""

from __future__ import annotations

import hashlib
import html
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

from docx import Document
from docx.enum.text import WD_BREAK
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parent.parent
ENTRIES = [
    ("JRS-Standard.pdf", "standard-v2-text-reading.html", "JRS-Standard_Tagged_Text_Reading_Copy.pdf"),
    ("JRS_Rapid_Review_Card.pdf", "rapid-review-card-text-reading.html", "JRS_Rapid_Review_Card_Tagged_Text_Reading_Copy.pdf"),
    ("JRS_Investigator_Field_Guide_Employment.pdf", "employment-investigator-guide-text-reading.html", "JRS_Investigator_Field_Guide_Employment_Tagged_Text_Reading_Copy.pdf"),
    ("JRS_Investigator_Field_Guide_FairHousing.pdf", "fair-housing-investigator-guide-text-reading.html", "JRS_Investigator_Field_Guide_FairHousing_Tagged_Text_Reading_Copy.pdf"),
    ("JRS_Investigator_Field_Guide_International.pdf", "international-investigator-guide-text-reading.html", "JRS_Investigator_Field_Guide_International_Tagged_Text_Reading_Copy.pdf"),
    ("JRS-Reference-9d4f2a7c.pdf", "reviewer-reference-text-reading.html", "JRS-Reference_Tagged_Text_Reading_Copy.pdf"),
    ("JRS_Reliability_Accuracy.pdf", "reliability-accuracy-text-reading.html", "JRS_Reliability_Accuracy_Tagged_Text_Reading_Copy.pdf"),
    ("JRS_Investigator_Field_Guide.pdf", "general-investigator-guide-text-reading.html", "JRS_Investigator_Field_Guide_Tagged_Text_Reading_Copy.pdf"),
]


def blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def tokens(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def original_coverage(original: str, copy: str) -> float:
    """Multi-character word recall tolerates PDF layout's stray single glyphs."""
    from collections import Counter

    old = Counter(token for token in tokens(original) if len(token) >= 2)
    new = Counter(token for token in tokens(copy) if len(token) >= 2)
    return sum(min(count, new[token]) for token, count in old.items()) / max(1, sum(old.values()))


def extract_sections(source: str):
    sections = re.findall(r'<section class="source-page"[^>]*>(.*?)</section>', source, re.S)
    if not sections:
        raise ValueError("No transcribed source pages")
    for section in sections:
        match = re.search(r"<h2[^>]*>(.*?)</h2>", section, re.S)
        if not match:
            raise ValueError("Missing source page heading")
        blocks = re.findall(r'<(p|pre) class="source-block">(.*?)</\1>', section, re.S)
        if not blocks:
            raise ValueError("Empty transcribed source page")
        yield html.unescape(match.group(1)), [(kind, html.unescape(body)) for kind, body in blocks]


def make_docx(source: str, title: str, outfile: Path):
    doc = Document()
    section = doc.sections[0]
    section.page_width, section.page_height = Inches(8.5), Inches(11)
    section.top_margin = section.bottom_margin = Inches(0.7)
    section.left_margin = section.right_margin = Inches(0.8)
    normal = doc.styles["Normal"]
    normal.font.name = "Liberation Sans"
    normal.font.size = Pt(11)
    normal.paragraph_format.space_after = Pt(7)
    for style in [doc.styles["Title"], doc.styles["Heading 1"], doc.styles["Heading 2"]]:
        style.font.name = "Liberation Sans"
        style.font.color.rgb = RGBColor(0, 0, 0)
    doc.styles["Heading 1"].font.size = Pt(16)
    doc.styles["Heading 2"].font.size = Pt(12)
    doc.core_properties.title = f"{title} - tagged text-reading alternative"
    doc.core_properties.subject = "Automated text-reading alternative; publication of record unchanged"
    doc.core_properties.author = "Justification Review Standard"
    doc.add_paragraph(title, "Heading 1")
    notice = doc.add_paragraph(style="Normal")
    notice.add_run("Text-reading alternative, not an approved replacement publication. ").bold = True
    notice.add_run(
        "This copy preserves text extracted from the separately published PDF. "
        "Automated transcription can lose visual content, table relationships, and original reading order. "
        "It has not passed independent assistive-technology or PDF/UA review. "
        "The published PDF remains the edition of record."
    )
    for page_number, (heading, blocks) in enumerate(extract_sections(source), start=1):
        doc.add_paragraph(heading, "Heading 2")
        for _, text in blocks:
            # Preserve line breaks, but do not invent list/table structures.
            p = doc.add_paragraph(style="Normal")
            for i, line in enumerate(text.split("\n")):
                if i:
                    p.add_run().add_break(WD_BREAK.LINE)
                p.add_run(line)
    doc.save(outfile)


def run(executable: str, *args: str) -> str:
    return subprocess.check_output([executable, *args], text=True, stderr=subprocess.STDOUT, timeout=180)


def main():
    manifest = json.loads((ROOT / "docs/JRS_Published_PDF_Identity_Manifest.json").read_text())
    assets = {a["file"]: a for a in manifest["assets"]}
    if len(ENTRIES) != 8:
        raise ValueError("Expected eight HTML sources plus the separately tagged research paper")
    soffice = os.environ.get("JRS_SOFFICE", "soffice")
    target = ROOT / "accessible"
    produced = []
    with tempfile.TemporaryDirectory(prefix="jrs-tagged-alternatives-") as workspace:
        temp = Path(workspace)
        inputs = []
        for original, html_file, pdf_name in ENTRIES:
            original_bytes = (ROOT / original).read_bytes()
            identity = assets[original]
            if blob_sha(original_bytes) != identity["blob_sha"]:
                raise ValueError(f"Published edition identity mismatch: {original}")
            source_path = target / html_file
            source_bytes = source_path.read_bytes()
            source = source_bytes.decode("utf-8")
            if "not a replacement publication" not in source:
                raise ValueError(f"Missing source limitation notice: {html_file}")
            title = re.search(r"<h1>(.*?)</h1>", source, re.S)
            if not title:
                raise ValueError(f"Missing title: {html_file}")
            input_docx = temp / Path(pdf_name).with_suffix(".docx").name
            make_docx(source, html.unescape(title.group(1)), input_docx)
            inputs.append(input_docx)
            produced.append({"original": original, "original_blob_sha": identity["blob_sha"],
                             "source": f"accessible/{html_file}", "source_blob_sha": blob_sha(source_bytes),
                             "reading_copy": f"accessible/{pdf_name}"})
        profile = (temp / "libreoffice-profile").as_uri()
        filter_options = 'pdf:writer_pdf_Export:{"UseTaggedPDF":{"type":"boolean","value":"true"},"ExportBookmarks":{"type":"boolean","value":"true"}}'
        print(run(soffice, f"-env:UserInstallation={profile}", "--headless", "--convert-to", filter_options,
                  "--outdir", str(temp), *(str(path) for path in inputs)))
        for item in produced:
            temp_pdf = temp / Path(item["reading_copy"]).name
            if not temp_pdf.is_file():
                raise ValueError(f"LibreOffice did not export {temp_pdf.name}")
            info = run("pdfinfo", str(temp_pdf))
            if not re.search(r"^Tagged:\s+yes\s*$", info, re.M):
                raise ValueError(f"No PDF tag tree: {temp_pdf.name}")
            original = run("pdftotext", str(ROOT / item["original"]), "-")
            revised = run("pdftotext", str(temp_pdf), "-")
            agreement = original_coverage(original, revised)
            if agreement < 0.99:
                from collections import Counter
                missing = Counter(tokens(original)) - Counter(tokens(revised))
                print(f"TEXT COVERAGE DIAGNOSTIC {temp_pdf.name}: {missing.most_common(20)}")
                raise ValueError(f"PDF token coverage below 99%: {temp_pdf.name}: {agreement:.3%}")
            item["text_token_coverage"] = round(agreement, 5)
            item["pdf_pages"] = int(re.search(r"^Pages:\s+(\d+)", info, re.M).group(1))
            final_pdf = target / temp_pdf.name
            final_pdf.write_bytes(temp_pdf.read_bytes())
            item["reading_copy_blob_sha"] = blob_sha(final_pdf.read_bytes())
            print(f"PASS {final_pdf.name}: tagged yes, {agreement:.2%} source text coverage, {item['pdf_pages']} pages")
    result = {"schema": "jrs-tagged-transcription-pdf-manifest.v1", "date": "2026-11-15",
              "scope": "Tagged PDF text-reading alternatives, not approved replacement editions",
              "original_publication_binaries_modified": False, "accessibility_certified": False,
              "approved_to_replace_original_pdfs": False, "physical_screen_reader_acceptance": False,
              "caveat": "Tagged PDFs do not resolve lost visual material, tables, true semantic reading order, PDF/UA, or WCAG compliance.",
              "copies": produced}
    (ROOT / "docs/JRS_Tagged_Transcription_PDF_Manifest_2026-11-15.json").write_text(json.dumps(result, indent=2) + "\n")


if __name__ == "__main__":
    main()
