#!/usr/bin/env python3
"""Build *unapproved* reading-order review material from nine locked public PDFs.

No publication file is modified. Extracted text is an editorial working copy,
NOT a tagged-PDF reissue, approved alternative, PDF/UA finding or WCAG claim.
"""
import argparse
from collections import Counter
import hashlib
from html import escape
import json
from pathlib import Path
import re
import subprocess


def git_blob_sha(data):
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def pages_from_pdf(path, mode):
    command = ["pdftotext", "-enc", "UTF-8"]
    if mode == "layout":
        command.append("-layout")
    elif mode == "raw":
        command.append("-raw")
    else:
        raise ValueError("Unsupported extraction mode")
    command.extend([str(path), "-"])
    run = subprocess.run(command, capture_output=True, timeout=90, check=False)
    if run.returncode:
        raise RuntimeError(f"Text extraction failed in {mode} mode for {path.name}")
    text = run.stdout.decode("utf-8", errors="replace").replace("\r\n", "\n")
    pages = text.split("\f")
    while pages and not pages[-1].strip():
        pages.pop()
    return pages or [""]


def tokens(s):
    return Counter(re.findall(r"\w+", s.casefold(), re.UNICODE))


def candidate_html(item, raw_pages, layout_pages, identity, page_reviews):
    filename = item["file"]
    title = item.get("role") or filename
    edition = item.get("edition") or "Edition must be verified against published source"
    toc = " ".join(f'<a href="#page-{n}">Page {n}</a>' for n in range(1, len(page_reviews) + 1))
    sections = []
    for index, review in enumerate(page_reviews, start=1):
        raw = raw_pages[index - 1] if index <= len(raw_pages) else ""
        layout = layout_pages[index - 1] if index <= len(layout_pages) else ""
        warnings = ", ".join(review["flags"]) if review["flags"] else "No automatic extraction warning"
        raw_note = "Raw extraction missing for this page." if index > len(raw_pages) else ""
        layout_note = "Layout extraction missing for this page." if index > len(layout_pages) else ""
        sections.append(f'''<section id="page-{index}" aria-labelledby="page-h-{index}">
<h2 id="page-h-{index}">Source PDF page {index}</h2>
<p class="context"><strong>Editorial status: NOT ASSESSED.</strong> Automatic extraction observations: {escape(warnings)}. {escape(raw_note)} {escape(layout_note)} Headings, tables, links and reading order have not been checked.</p>
<pre class="reading">{escape(raw)}</pre>
<details><summary>Compare layout-based extraction for page {index}</summary>
<pre class="reading">{escape(layout)}</pre></details>
</section>''')
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>UNAPPROVED reading candidate: {escape(title)}</title>
<style>
:root{{color-scheme:light}}*{{box-sizing:border-box}}
body{{max-width:76ch;margin:0 auto;padding:1.5rem;font:1rem/1.6 system-ui,sans-serif;color:#162b3a;background:#fff}}
a{{color:#153f6c;text-decoration:underline}}a:focus-visible,summary:focus-visible{{outline:3px solid #916c21;outline-offset:3px}}
.warning{{border:2px solid #8b512b;padding:1rem;background:#fff8ee}}
section{{padding:1.5rem 0;border-top:1px solid #aab5bf}}
.reading{{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;tab-size:4}}
.context{{color:#485a68}}nav a{{display:inline-block;margin:.25rem .75rem .25rem 0}}
@media print{{body{{max-width:none}}details{{display:none}}}}
</style></head><body>
<a href="#main">Skip to transcript</a>
<header><p class="warning"><strong>NOT AN APPROVED ACCESSIBLE EDITION.</strong> This machine-extracted review candidate is not a source replacement or a screen-reader, reading-order, WCAG or PDF/UA verification. Do not publish until edition equivalence and accessibility have been independently assessed.</p></header>
<main id="main"><h1>Reading-order editorial candidate: {escape(title)}</h1>
<p><strong>Source file:</strong> {escape(filename)}</p>
<p><strong>Edition:</strong> {escape(edition)}</p>
<p><strong>Locked Git PDF blob:</strong> <code>{identity}</code></p>
<p>Text is extracted in two independent ordering modes for comparison. Mathematical notation, multi-column order, tables, illustrations, headers, footnotes and link destinations require editorial and assistive-technology review.</p>
<nav aria-label="Source PDF pages">{toc}</nav>
{''.join(sections)}
</main></body></html>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Checked-out repository root")
    parser.add_argument("--out", required=True, help="Non-deployed artifact output directory")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    out = Path(args.out).resolve()
    if out == root or root in out.parents:
        raise SystemExit("Refusing to place unapproved editorial candidates inside the published checkout")
    manifest = json.loads((root / "docs/JRS_Published_PDF_Identity_Manifest.json").read_text("utf-8"))
    assets = manifest.get("assets")
    if manifest.get("schema") != "jrs-published-pdf-identity.v1" or not isinstance(assets, list) or len(assets) != 9:
        raise SystemExit("Release hold: expected exact nine-edition source identity manifest")
    names = [asset.get("file", "") for asset in assets]
    if len(set(names)) != 9 or any(not re.fullmatch(r"[A-Za-z0-9_-]+\.pdf", n) for n in names):
        raise SystemExit("Release hold: unsafe or duplicated PDF identity")
    out.mkdir(parents=True, exist_ok=True)
    reports = []
    for item in assets:
        filename = item["file"]
        pdf_path = root / filename
        data = pdf_path.read_bytes()
        identity = git_blob_sha(data)
        if not data.startswith(b"%PDF-") or item.get("blob_sha") != identity or item.get("bytes") != len(data):
            raise SystemExit("Release hold: original PDF has changed or is not in the source manifest: " + filename)
        raw_pages = pages_from_pdf(pdf_path, "raw")
        layout_pages = pages_from_pdf(pdf_path, "layout")
        raw = "\n".join(raw_pages)
        layout = "\n".join(layout_pages)
        if len(raw.strip()) < 40:
            raise SystemExit("Release hold: extracted text is insufficient for review: " + filename)
        difference = sum((tokens(raw) - tokens(layout)).values()) + sum((tokens(layout) - tokens(raw)).values())
        # Expose page-level extraction risks for editorial review. Aggregate
        # token agreement can conceal omissions or page-order displacement.
        page_reviews = []
        for page_index in range(max(len(raw_pages), len(layout_pages))):
            raw_page = raw_pages[page_index] if page_index < len(raw_pages) else ""
            layout_page = layout_pages[page_index] if page_index < len(layout_pages) else ""
            raw_tokens, layout_tokens = tokens(raw_page), tokens(layout_page)
            page_difference = (sum((raw_tokens - layout_tokens).values())
                               + sum((layout_tokens - raw_tokens).values()))
            flags = []
            if not raw_page.strip() or not layout_page.strip():
                flags.append("EMPTY_EXTRACTION")
            if page_difference:
                flags.append("TOKEN_DISCREPANCY")
            if chr(0xfffd) in raw_page or chr(0xfffd) in layout_page:
                flags.append("REPLACEMENT_CHARACTER")
            page_reviews.append({
                "page": page_index + 1,
                "raw_characters": len(raw_page),
                "layout_characters": len(layout_page),
                "token_discrepancy": page_difference,
                "flags": flags,
                "editorial_disposition": "NOT_ASSESSED",
            })
        if len(raw_pages) != len(layout_pages):
            # Never silently associate the wrong layout transcript with a
            # source page. Preserve the candidates but flag this for review.
            for page in page_reviews:
                page["flags"].append("PAGE_COUNT_MISMATCH")
        stem = pdf_path.stem + ".reading-candidate.html"
        (out / stem).write_text(candidate_html(item, raw_pages, layout_pages, identity, page_reviews), encoding="utf-8")
        reports.append({
            "source_pdf": filename, "source_blob_sha": identity, "source_bytes": len(data),
            "candidate_html": stem, "raw_pages": len(raw_pages), "layout_pages": len(layout_pages),
            "raw_character_count": len(raw), "raw_replacement_characters": raw.count("\ufffd"),
            "raw_layout_token_discrepancy": difference,
            "page_review": page_reviews,
            "pages_flagged_for_editorial_review": sum(bool(p["flags"]) for p in page_reviews),
            "editorial_content_equivalence": "NOT_ASSESSED",
            "manual_reading_order": "NOT_ASSESSED", "accessible_pdf_tagging": "NOT_ASSESSED",
            "screen_reader_acceptance": "NOT_ASSESSED", "public_release_approved": False,
        })
    report = {
        "schema": "jrs-pdf-reading-candidate.v1", "status": "EXTRACTION_ONLY_NOT_CERTIFIED",
        "provenance": "Locked nine original public PDFs in the tested source checkout",
        "not_a_public_reissue": True, "not_a_screen_reader_test": True,
        "human_editorial_approval": "NOT_ASSESSED", "assets": reports,
    }
    (out / "candidate-inventory.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: {len(reports)} locked public PDF sources extracted into unapproved editorial review candidates.")
    print("BLOCKED: PDF reading order, accessible reissues and screen-reader acceptance remain NOT ASSESSED.")


if __name__ == "__main__":
    main()
