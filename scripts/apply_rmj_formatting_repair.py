#!/usr/bin/env python3
"""Restore the run formatting my earlier rewrites stripped from the RMJ file.

WHY THIS EXISTS. Phillip asked why Stacyann Young's name is bolded. It is not
specially bolded: BOTH bylines were bold in the source manuscript, and my
byline rewrite emitted a plain run, so Phillip's lost its bold and hers stood
out by contrast. Auditing the whole version chain for the same fault found six
places where a rewrite dropped run formatting, plus one structural defect:

  1. the Wikes byline lost bold on the name;
  2. the six structured-abstract labels lost bold;
  3. the three Section 8 implication labels lost bold;
  4. the Competing interests label was written plain, unlike Disclosure and
     Author contributions beside it;
  5. all seven reference entries lost, or never had, the italic on the
     journal or report title;
  6. THE SCOPE SENTENCE IN THE LIMITATIONS CARRIES pStyle Heading2. It was
     inserted after the "9. Limitations" heading and inherited that heading's
     style, so a body sentence is marked as a section heading. That is not
     cosmetic: it puts the sentence in the document outline and any generated
     table of contents, and renders it at heading size.

The cause in every case is the same: the para() helper used by every pass
writes a single unformatted run. This script writes explicit runs instead.

THIS PASS CHANGES FORMATTING ONLY. The flattened text of the document must be
byte-identical before and after, and the run asserts exactly that; if a single
character moves, it refuses to write.

    python3 scripts/apply_rmj_formatting_repair.py --check
    python3 scripts/apply_rmj_formatting_repair.py --apply
"""
import argparse
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R8.docx")
DST = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R9.docx")

B, I, P = "b", "i", ""

# (opening text used to find the paragraph, [(run text, flag), ...])
SPECS = [
    ("Phillip Wikes,", [
        ("Phillip Wikes", B),
        (", Independent Researcher; Developer of the Justification Review "
         "Standard", P)]),
    ("Competing interests.", [
        ("Competing interests.", B),
        (" P.W. developed the Justification Review Standard, the review "
         "protocol examined in this study, and has a continuing professional "
         "interest in it. The study design places the protocol against "
         "independent government audit findings and an independent blind "
         "second read. S.Y. declares no competing interests.", P)]),
    ("Purpose.", [("Purpose.", B)]),
    ("Design/methodology/approach.", [("Design/methodology/approach.", B)]),
    ("Findings.", [("Findings.", B)]),
    ("Research limitations/implications.",
     [("Research limitations/implications.", B)]),
    ("Practical implications.", [("Practical implications.", B)]),
    ("Originality/value.", [("Originality/value.", B)]),
    ("Pre-finalisation quality assurance.",
     [("Pre-finalisation quality assurance.", B)]),
    ("Retrospective review.", [("Retrospective review.", B)]),
    ("Audit sampling.", [("Audit sampling.", B)]),
    ("Chief FOIA Officers Council.", [
        ("Chief FOIA Officers Council. (2026, May 28). ", P),
        ("Memorandum: data collection and volunteers", I),
        (" [Government-wide FOIA technology inventory initiative]. United "
         "States Department of Justice.", P)]),
    ("Duranti, L. (1995).", [
        ("Duranti, L. (1995). Reliability and authenticity: The concepts and "
         "their implications. ", P),
        ("Archivaria, 39", I),
        (", 5-10.", P)]),
    ("Duranti, L., & Makhlouf Shabou, B. (2015).", [
        ("Duranti, L., & Makhlouf Shabou, B. (2015). Digital diplomatics and "
         "measurement of electronic public data qualities: What lessons "
         "should be learned? ", P),
        ("Records Management Journal, 25", I),
        ("(1), 56-77. https://doi.org/10.1108/RMJ-01-2015-0006", P)]),
    ("Farrell, M. (2024).", [
        ("Farrell, M. (2024). Accountability as a mechanism and a virtue in "
         "Irish public sector recordkeeping. ", P),
        ("Records Management Journal, 34", I),
        ("(2-3), 190-204. https://doi.org/10.1108/RMJ-09-2023-0051", P)]),
    ("Gwet, K. L. (2008).", [
        ("Gwet, K. L. (2008). Computing inter-rater reliability and its "
         "variance in the presence of high agreement. ", P),
        ("British Journal of Mathematical and Statistical Psychology, 61", I),
        ("(1), 29-48.", P)]),
    ("International Organization for Standardization.", [
        ("International Organization for Standardization. (2016). ", P),
        ("ISO 15489-1:2016. Information and documentation - Records "
         "management - Part 1: Concepts and principles.", I)]),
    ("Yeo, G. (2007).", [
        ("Yeo, G. (2007). Concepts of record (1): Evidence, information, and "
         "persistent representations. ", P),
        ("The American Archivist, 70", I),
        ("(2), 315-343.", P)]),
]

# Body paragraph wrongly carrying a heading style.
DESTYLE = "The study should therefore be read as an initial validation"


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def run(text, flag):
    rpr = ""
    if flag == B:
        rpr = "<w:rPr><w:b/></w:rPr>"
    elif flag == I:
        rpr = "<w:rPr><w:i/></w:rPr>"
    return ('<w:r>%s<w:t xml:space="preserve">%s</w:t></w:r>'
            % (rpr, esc(text)))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.check):
        ap.error("pass --check or --apply")
    if not os.path.exists(SRC):
        raise SystemExit("[REQUIRED_ENV_PARAM] R8 DOCX not found at %s"
                         % os.path.relpath(SRC, ROOT))

    zin = zipfile.ZipFile(SRC)
    doc = zin.read("word/document.xml").decode("utf-8")
    log = []

    def spans():
        return [(m.start(), m.end()) for m in
                re.finditer(r"<w:p\b.*?</w:p>", doc, re.S)]

    def text_at(a, b):
        t = re.sub(r"<[^>]+>", "", doc[a:b])
        return (t.replace("&amp;", "&").replace("&lt;", "<")
                 .replace("&gt;", ">").replace("&quot;", '"'))

    def flat():
        return "\n".join(text_at(a, b) for a, b in spans())

    before = flat()

    def find(prefix):
        hits = [i for i, (a, b) in enumerate(spans())
                if text_at(a, b).startswith(prefix)]
        if not hits:
            raise SystemExit("[REQUIRED_ENV_PARAM] paragraph not found: %s"
                             % prefix)
        if len(hits) > 1:
            raise SystemExit("[REQUIRED_ENV_PARAM] prefix matches %d "
                             "paragraphs, ambiguous: %s" % (len(hits), prefix))
        return hits[0]

    fixed = 0
    for prefix, runs in SPECS:
        i = find(prefix)
        a, b = spans()[i]
        whole = text_at(a, b)
        ppr = re.search(r"<w:pPr>.*?</w:pPr>", doc[a:b], re.S)
        # A spec may cover only the leading label; the remainder stays plain.
        covered = "".join(t for t, _ in runs)
        if not whole.startswith(covered):
            raise SystemExit("[REQUIRED_ENV_PARAM] spec text does not match "
                             "the paragraph for %r" % prefix)
        tail = whole[len(covered):]
        parts = [run(t, f) for t, f in runs]
        if tail:
            parts.append(run(tail, P))
        doc = (doc[:a] + "<w:p>" + (ppr.group(0) if ppr else "")
               + "".join(parts) + "</w:p>" + doc[b:])
        fixed += 1
    log.append("run formatting restored in %d paragraph(s)" % fixed)

    i = find(DESTYLE)
    a, b = spans()[i]
    seg = doc[a:b]
    if 'w:val="Heading2"' not in seg:
        raise SystemExit("[REQUIRED_ENV_PARAM] the scope sentence no longer "
                         "carries Heading2; the source is not R8")
    seg2 = re.sub(r'<w:pStyle w:val="Heading2"/>', "", seg)
    doc = doc[:a] + seg2 + doc[b:]
    log.append("scope sentence de-styled: body text, not a section heading")

    after = flat()
    if after != before:
        for x, (p, q) in enumerate(zip(before.split("\n"),
                                       after.split("\n"))):
            if p != q:
                raise SystemExit("[REQUIRED_ENV_PARAM] this pass altered text "
                                 "at paragraph %d:\n  was: %s\n  now: %s"
                                 % (x, p[:90], q[:90]))
        raise SystemExit("[REQUIRED_ENV_PARAM] this pass altered the text "
                         "length; formatting-only was required")
    log.append("text byte-identical before and after: %d characters"
               % len(after))

    # No body paragraph may carry a heading style.
    bad = []
    for a, b in spans():
        seg = doc[a:b]
        t = text_at(a, b).strip()
        if re.search(r'w:val="Heading[123]"', seg) and len(t) > 120:
            bad.append(t[:70])
    if bad:
        raise SystemExit("[REQUIRED_ENV_PARAM] body paragraph(s) carry a "
                         "heading style: %s" % "; ".join(bad))
    log.append("no body paragraph carries a heading style")

    # Both bylines must be bold on the name.
    for prefix in ("Stacyann Young", "Phillip Wikes,"):
        i = find(prefix)
        a, b = spans()[i]
        first = re.search(r"<w:r>(?:(?!</w:r>).)*</w:r>", doc[a:b], re.S)
        if not first or "<w:b/>" not in first.group(0):
            raise SystemExit("[REQUIRED_ENV_PARAM] byline not bold: %s"
                             % prefix)
    log.append("both bylines bold on the name")

    imgs = [n for n in zin.namelist() if n.startswith("word/media/")]
    for line in log:
        print("  " + line)
    print("  images: %d" % len(imgs))

    if not args.apply:
        print("\nCHECK ONLY, nothing written")
        return

    tmp = DST + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "word/document.xml":
                data = doc.encode("utf-8")
            zout.writestr(item, data)
    zin.close()
    os.replace(tmp, DST)
    print("\nwrote %s" % os.path.relpath(DST, ROOT))


if __name__ == "__main__":
    main()
