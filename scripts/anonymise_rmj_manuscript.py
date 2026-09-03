#!/usr/bin/env python3
"""Produce a double-anonymous submission copy of the RMJ manuscript.

WHY THIS EXISTS. Records Management Journal uses double-anonymous review. The
submission copy must carry no author identity anywhere in the package, and a
DOCX carries identity in three places, not one: the visible text, the OOXML
metadata parts, and any tracked-change or comment authorship.

WHAT IS REMOVED, and why each one is identifying:

  the byline                  both author names and their affiliations
  author contributions        S.Y. and P.W. initials map to the byline
  disclosure                  "City of New York" narrows one author to an
                              employer; the substance is kept, the employer
                              is not
  competing interests         it states that an author developed the protocol
                              under study, which names the study's owner to
                              anyone who searches the protocol
  data availability           "available from the authors" is replaced with
                              the neutral editorial-office form
  docProps/core.xml           carried lastModifiedBy "Jeff Billups", a third
                              party's name, in the shipped file
  docProps/app.xml            Company and Manager fields

THE BRANDED NAMES ARE THE HARD PART AND ARE HANDLED DELIBERATELY.
"Justification Review Standard", "JRS" and "Decision Reconstruction Risk" are
publicly attributable: the standard is published under the author's name at a
public domain. A reviewer who searches any of the three reaches the author in
one step, so leaving them in defeats anonymity however clean the byline is.
They are therefore neutralised to unbranded descriptors by default. Pass
--keep-brand to retain them, which is a legitimate choice if the editor has
agreed the framework name may appear, but it is not the default because the
default for an anonymous submission should fail safe.

    python3 scripts/anonymise_rmj_manuscript.py SOURCE.docx OUT.docx
    python3 scripts/anonymise_rmj_manuscript.py SOURCE.docx OUT.docx --keep-brand
"""
import argparse
import os
import re
import shutil
import sys
import zipfile

BYLINE_REPLACEMENT = "[Author names and affiliations removed for anonymous review]"

CONTRIBUTIONS = (
    "Author contributions. The first author designed the public-records case "
    "protocol, selected and screened all 32 publicly available "
    "determinations, recorded the read and its contemporaneous basis note for "
    "each case blind to the documented outcome, recorded the outcomes and "
    "citations, and leads the public-records framing. The second author "
    "developed the review protocol and the reconstruction-risk construct, "
    "designed the pilot, ran the analyses, and co-wrote the manuscript.")

DISCLOSURE = (
    "Disclosure. Both authors contributed to this work in their personal "
    "professional capacities. One author conducted this research voluntarily "
    "and independently, using publicly available materials and without "
    "institutional affiliation. The research does not represent the views, "
    "positions, policies, or practices of any employer or government entity. "
    "No internal, confidential, privileged, or otherwise nonpublic government "
    "materials were used. No funding was received for this work.")

COMPETING = (
    "Competing interests. One author developed the review protocol examined "
    "in this study and has a continuing professional interest in it. The "
    "study design places the protocol against independent government audit "
    "findings and an independent blind second read. The other author declares "
    "no competing interests.")

DATA_NOTE = (
    "The blinded second-read data and reproducibility materials are retained "
    "with the study records and can be supplied to the editorial office on "
    "request.")

# Branded terms and their unbranded equivalents, longest first so that the
# expansion is replaced before the acronym inside it.
BRAND = [
    ("The protocol is referred to in this study as the Justification Review "
     "Standard (JRS).",
     "The protocol is named and described in full in the non-anonymous "
     "version of this manuscript."),
    ("Justification Review Standard (JRS)", "review protocol"),
    ("Justification Review Standard", "review protocol"),
    ("Decision Reconstruction Risk", "decision reconstruction risk"),
    ("JRS", "the protocol"),
]

# Nothing in this list may survive anywhere in the output package.
FORBIDDEN = ["Stacyann", "Young", "Phillip", "Wikes", "Billups",
             "City of New York", "S.Y.", "P.W."]
FORBIDDEN_BRAND = ["Justification Review Standard", "JRS",
                   "Decision Reconstruction Risk"]

CORE_XML = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<cp:coreProperties '
    'xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/'
    'core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" '
    'xmlns:dcterms="http://purl.org/dc/terms/" '
    'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    '<dc:title></dc:title><dc:creator></dc:creator>'
    '<cp:lastModifiedBy></cp:lastModifiedBy><cp:revision>1</cp:revision>'
    '</cp:coreProperties>')


def para_text(seg: str) -> str:
    t = re.sub(r"<[^>]+>", "", seg)
    return (t.replace("&amp;", "&").replace("&lt;", "<")
             .replace("&gt;", ">").replace("&quot;", '"'))


def esc(t: str) -> str:
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build_para(text: str, style: str | None) -> str:
    pr = "<w:pPr>"
    if style:
        pr += '<w:pStyle w:val="%s"/>' % style
    pr += '<w:spacing w:after="140"/></w:pPr>'
    return ('<w:p>%s<w:r><w:t xml:space="preserve">%s</w:t></w:r></w:p>'
            % (pr, esc(text)))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("source")
    ap.add_argument("out")
    ap.add_argument("--keep-brand", action="store_true",
                    help="retain the branded framework names")
    args = ap.parse_args()

    if not os.path.exists(args.source):
        raise SystemExit("[REQUIRED_ENV_PARAM] source not found: %s"
                         % args.source)

    zin = zipfile.ZipFile(args.source)
    doc = zin.read("word/document.xml").decode("utf-8")
    log: list[str] = []

    def spans() -> list[tuple[int, int]]:
        return [(m.start(), m.end())
                for m in re.finditer(r"<w:p\b.*?</w:p>", doc, re.S)]

    def find(prefix: str) -> int:
        for i, (a, b) in enumerate(spans()):
            if para_text(doc[a:b]).strip().startswith(prefix):
                return i
        return -1

    def replace(prefix: str, new_text: str, label: str) -> None:
        nonlocal doc
        i = find(prefix)
        if i < 0:
            raise SystemExit("[REQUIRED_ENV_PARAM] not found: %s" % prefix)
        a, b = spans()[i]
        st = re.search(r'<w:pStyle w:val="([^"]+)"/>', doc[a:b])
        doc = doc[:a] + build_para(new_text, st.group(1) if st else None) + doc[b:]
        log.append(label)

    def delete(prefix: str, label: str) -> None:
        nonlocal doc
        i = find(prefix)
        if i < 0:
            raise SystemExit("[REQUIRED_ENV_PARAM] not found: %s" % prefix)
        a, b = spans()[i]
        doc = doc[:a] + doc[b:]
        log.append(label)

    replace("Stacyann Young", BYLINE_REPLACEMENT, "byline replaced")
    delete("Phillip Wikes", "second byline line removed")
    replace("Author contributions.", CONTRIBUTIONS,
            "contributions de-initialled")
    replace("Disclosure.", DISCLOSURE, "employer removed from the disclosure")
    replace("Competing interests.", COMPETING, "competing interests anonymised")
    replace("The blinded second-read data", DATA_NOTE,
            "data note routed to the editorial office")

    if not args.keep_brand:
        n = 0
        for old, new in BRAND:
            if old in doc:
                n += doc.count(old)
                doc = doc.replace(old, new)
        log.append("branded terms neutralised: %d occurrence(s)" % n)
    else:
        log.append("branded terms RETAINED by --keep-brand")

    shutil.copyfile(args.source, args.out + ".tmp")
    with zipfile.ZipFile(args.out + ".tmp2", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            name = item.filename
            if name == "word/document.xml":
                data = doc.encode("utf-8")
            elif name == "docProps/core.xml":
                data = CORE_XML.encode("utf-8")
            elif name == "docProps/app.xml":
                raw = zin.read(name).decode("utf-8")
                for tag in ("Company", "Manager"):
                    raw = re.sub(r"<%s>.*?</%s>" % (tag, tag), "<%s></%s>"
                                 % (tag, tag), raw, flags=re.S)
                data = raw.encode("utf-8")
            else:
                data = zin.read(name)
            zout.writestr(item, data)
    os.replace(args.out + ".tmp2", args.out)
    os.remove(args.out + ".tmp")
    zin.close()

    # Verify against the WHOLE package, every part, not just document.xml.
    zchk = zipfile.ZipFile(args.out)
    leaks: list[str] = []
    banned = list(FORBIDDEN) + ([] if args.keep_brand else FORBIDDEN_BRAND)
    for name in zchk.namelist():
        if name.startswith("word/media/"):
            continue
        body = zchk.read(name).decode("utf-8", "ignore")
        plain = para_text(body)
        for term in banned:
            if term in plain:
                leaks.append("%s in %s" % (term, name))
    imgs = [n for n in zchk.namelist() if n.startswith("word/media/")]
    zchk.close()

    for line in log:
        print("  " + line)
    print("  images preserved: %d" % len(imgs))
    if leaks:
        print()
        for lk in leaks:
            print("  LEAK: %s" % lk)
        raise SystemExit("[REQUIRED_ENV_PARAM] identity survives in the "
                         "output package; not fit for anonymous submission")
    print("  package scanned for %d banned term(s) across %d part(s): clean"
          % (len(banned), len(zipfile.ZipFile(args.out).namelist()) - len(imgs)))
    print("\nwrote %s" % args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
