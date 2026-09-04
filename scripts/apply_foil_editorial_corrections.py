#!/usr/bin/env python3
"""Apply the ten editorial corrections of 2026-09-01 to the FOIL manuscript.

Source is the figures DOCX, edited in place, so Stacyann's three graphics
travel with the document. A text-sourced build dropped them once already.

WHAT THE CORRECTIONS DO. They narrow claim language without touching a single
number. Every count, coefficient and p-value is asserted present before the
file is written. The substantive move is retiring three psychometric labels the
design does not earn in their strict sense, and replacing each with a
description of what was actually done:

    convergent validity   -> external concordance with independent audit findings
    construct validity    -> alignment with reconstructability
    discriminant validity -> structural differentiation across source types

Section 5.6, the second-domain employment corpus, moves out of Results. Left
there it reads as a second dataset rescuing a null finding, which is the single
most attackable move in the paper. It becomes a bounded Discussion paragraph
that names the boundary condition and states plainly that the outside evidence
is not used as validation here.

    python3 scripts/apply_foil_editorial_corrections.py --check
    python3 scripts/apply_foil_editorial_corrections.py --apply
"""
import argparse
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "foil_production_2026-09-01",
                   "FOIL_Article_FINAL_20260828_Review_2_FIGURES.docx")
OUT = os.path.join(ROOT, "research", "foil_corrected_2026-09-01")
DST = os.path.join(OUT, "FOIL_Article_CORRECTED_2026-09-01.docx")

TITLE = ("A Documentation Quality Read for Public-Records Determinations: "
         "Initial Evidence from 32 Public Cases")

# Correction 1 title, 3 to 5 label retirement, 9 second-reader framing.
# Plain string replacements, each asserted to occur exactly once.
SWAPS = [
    ("A Documentation Quality Read for Public-Records Determinations: "
     "Convergent, Construct, and Discriminant Evidence from 32 Public Cases",
     TITLE),
    ("Convergent validity compares the read against",
     "External concordance compares the read against"),
    ("Construct validity codes the contemporaneous basis notes",
     "The reconstructability analysis codes the contemporaneous basis notes"),
    ("Discriminant validity tests the read against document class",
     "The structural analysis tests the read against document class"),
    ("The convergent-validity result rests on five audits",
     "The external-concordance result rests on five audits"),
    ("5.2 The read agrees with independent auditors, five of five",
     "5.2 External concordance with independent audit findings"),
    ("5.3 The read tracks reconstructability, not outcome",
     "5.3 Alignment with reconstructability"),
    ("5.4 The read separates document classes by how much basis they expose",
     "5.4 Structural differentiation across source types"),
]

# Correction 8, purposive sampling, appended to 4.2 Materials.
SAMPLING = ("The corpus was purposively assembled to test the feasibility of "
            "applying the read across heterogeneous public-records materials. "
            "It was not designed as a representative sample of agency "
            "public-records determinations and cannot be used to estimate the "
            "prevalence of documentation deficiencies.")

# Correction 6, bounding the five-case comparison.
FIVE_BOUND = ("The five-case comparison provides initial external concordance "
              "evidence. The complete agreement is notable, but the subset is "
              "too small to support broad generalization.")

# Correction 9, the single Gap case.
GAP_NOTE = ("The single Gap case included in the blind second-read subset was "
            "classified identically by both reviewers. Because only one Gap "
            "case was included, this observation cannot support a "
            "category-specific reliability estimate. The figures below are "
            "preliminary inter-reader reproducibility evidence and do not "
            "show that reader dependence has been resolved.")

# Correction 7, the replacement Discussion paragraph.
DISCUSSION_56 = ("The null relationship between documentation reads and "
                 "appellate disposition should not be interpreted as evidence "
                 "that the read lacks sensitivity to documentation quality. "
                 "Published appellate decisions are selected around contested "
                 "legal questions and may not preserve the same relationship "
                 "between record quality and institutional outcome that would "
                 "be expected in a broader administrative corpus. Separate "
                 "work in another domain has observed a different pattern, "
                 "but that evidence is outside the present dataset and is not "
                 "used as validation evidence in this study.")

# Correction 2, the scope sentence for Introduction and Conclusion.
SCOPE = ("This pilot provides initial evidence regarding the behavior of the "
         "documentation read across public-records materials. It does not "
         "establish full instrument validity.")

# Correction 10, the closing statement.
CONCLUSION = ("The pilot provides initial evidence that a structured "
              "documentation read can be applied consistently enough to "
              "warrant further study, and that its classifications show "
              "meaningful alignment with reconstructability-related "
              "characteristics and with independent audit findings in this "
              "corpus. Larger studies using independent reviewers, broader "
              "populations, and external comparison measures are required "
              "before stronger validation claims can be made.")


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def para(text, style=None, bold_lead=None):
    pr = "<w:pPr>"
    if style:
        pr += '<w:pStyle w:val="%s"/>' % style
    pr += '<w:spacing w:after="140"/></w:pPr>'
    runs = ""
    if bold_lead:
        runs += ('<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">%s</w:t>'
                 '</w:r>' % esc(bold_lead))
    runs += '<w:r><w:t xml:space="preserve">%s</w:t></w:r>' % esc(text)
    return "<w:p>%s%s</w:p>" % (pr, runs)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.check):
        ap.error("pass --check or --apply")
    if not os.path.exists(SRC):
        raise SystemExit("[REQUIRED_ENV_PARAM] source DOCX not found at %s"
                         % os.path.relpath(SRC, ROOT))
    zin = zipfile.ZipFile(SRC)
    doc = zin.read("word/document.xml").decode("utf-8")
    log = []

    def para_spans(d):
        return [(m.start(), m.end()) for m in
                re.finditer(r"<w:p\b.*?</w:p>", d, re.S)]

    def replace_para_text(d, old, new):
        """Rewrite a paragraph found by its CONCATENATED text.

        Word splits a heading across runs at formatting boundaries, so
        "5.3 The read tracks reconstructability, not outcome" lives in the file
        as two <w:t> elements and a plain string replace never sees it. Matching
        on the joined text and rebuilding the paragraph handles both cases, and
        the paragraph's own style is preserved rather than guessed.
        """
        for a, b in para_spans(d):
            block = d[a:b]
            txt = re.sub(r"<[^>]+>", "", block)
            txt = (txt.replace("&amp;", "&").replace("&lt;", "<")
                      .replace("&gt;", ">").replace("&quot;", '"'))
            if txt.strip() != old.strip():
                continue
            st = re.search(r'<w:pStyle w:val="([^"]+)"/>', block)
            return d[:a] + para(new, st.group(1) if st else None) + d[b:], True
        return d, False

    for old, new in SWAPS:
        n = doc.count(esc(old))
        if n == 1:
            doc = doc.replace(esc(old), esc(new), 1)
            log.append("swapped: %s" % old[:58])
            continue
        doc, ok = replace_para_text(doc, old, new)
        if not ok:
            raise SystemExit("[REQUIRED_ENV_PARAM] %r found neither as a "
                             "unique string nor as a whole paragraph"
                             % old[:52])
        log.append("swapped (split runs): %s" % old[:48])

    spans = lambda: [(m.start(), m.end()) for m in
                     re.finditer(r"<w:p\b.*?</w:p>", doc, re.S)]

    def find(pred):
        for i, (a, b) in enumerate(spans()):
            if pred(re.sub(r"<[^>]+>", "", doc[a:b])):
                return i
        return -1

    def insert_after(i, xml):
        a, b = spans()[i]
        return doc[:b] + xml + doc[b:]

    # 8. Purposive sampling, after the Materials paragraph.
    i = find(lambda t: t.startswith("Public material only."))
    if i < 0:
        raise SystemExit("[REQUIRED_ENV_PARAM] 4.2 Materials text not found")
    doc = insert_after(i, para(SAMPLING))
    log.append("added: purposive-sampling limitation to 4.2")

    # 6. Bound the five-case comparison, at the end of 5.2.
    i = find(lambda t: t.startswith("External concordance compares the read"))
    doc = insert_after(i, para(FIVE_BOUND))
    log.append("added: five-case generalisation bound")

    # 9. Second-reader framing, before the agreement figures.
    i = find(lambda t: t.startswith("The two readers agreed exactly on 7 of 10"))
    if i < 0:
        raise SystemExit("[REQUIRED_ENV_PARAM] 5.7 opening sentence not found")
    a, b = spans()[i]
    doc = doc[:a] + para(GAP_NOTE) + doc[a:]
    log.append("added: single-Gap-case caveat and reproducibility framing")

    # 7. Move 5.6 out of Results.
    sp = spans()
    i_h = find(lambda t: t.startswith("5.6 The same instrument"))
    if i_h < 0:
        raise SystemExit("[REQUIRED_ENV_PARAM] section 5.6 heading not found")
    i_next = find(lambda t: t.startswith("5.7 Blind second read"))
    sp = spans()
    cut_a, cut_b = sp[i_h][0], sp[i_next][0]
    doc = doc[:cut_a] + doc[cut_b:]
    log.append("removed: section 5.6 from Results, 4 paragraphs")

    # Renumber 5.7 to 5.6 now that the old 5.6 is gone.
    doc = doc.replace(esc("5.7 Blind second read"), esc("5.6 Blind second read"), 1)
    # Cross-references follow the heading. Anchored on "Section 5.7" so the
    # percentage "85.7%" elsewhere in the results is not caught.
    n_ref = doc.count("Section 5.7")
    doc = doc.replace("Section 5.7", "Section 5.6")
    log.append("renumbered: 5.7 becomes 5.6, and %d cross-reference(s)" % n_ref)

    # Place the replacement paragraph in the Discussion.
    i = find(lambda t: t.strip() == "6. Discussion")
    if i < 0:
        raise SystemExit("[REQUIRED_ENV_PARAM] Discussion heading not found")
    doc = insert_after(i, para(DISCUSSION_56))
    log.append("added: bounded Discussion paragraph replacing 5.6")

    # 2. Scope sentence in the Introduction and the Conclusion.
    i = find(lambda t: t.strip() == "1. Introduction")
    doc = insert_after(i, para(SCOPE))
    log.append("added: scope statement to the Introduction")

    # 10. Conclusion. Replace the closing paragraph that cites 5.6.
    i = find(lambda t: t.startswith("It also makes the follow-on study"))
    if i < 0:
        raise SystemExit("[REQUIRED_ENV_PARAM] closing paragraph not found")
    a, b = spans()[i]
    old_close = re.sub(r"<[^>]+>", "", doc[a:b])
    # The old paragraph cites Section 5.6, which no longer exists there.
    new_close = old_close.split("The employment-law corpus described")[0].strip()
    doc = doc[:a] + para(new_close) + para(CONCLUSION) + doc[b:]
    log.append("replaced: closing paragraph, 5.6 cross-reference removed")

    plain = re.sub(r"<[^>]+>", "", doc)
    must = ["five of five", "p = 0.0000520", "p = 0.00466", "p = 0.0000050",
            "p = 1.000", "AC1 0.582", "7 of 10", "0.474", "0.559",
            "18 Ready, 9 Needs work, 5 Gap", "Figure 1.", "Figure 2.",
            "Figure 3.", "32 publicly available"]
    missing = [m for m in must if m not in plain]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] corrections dropped evidence: %s"
                         % "; ".join(missing))
    banned = ["Convergent validity", "Construct validity",
              "Discriminant validity", "convergent-validity", "Section 5.7",
              "5.7 Blind second read"]
    left = [b for b in banned if b in plain]
    if left:
        raise SystemExit("[REQUIRED_ENV_PARAM] retired label survives: %s"
                         % "; ".join(left))

    for line in log:
        print("  " + line)
    print("  evidence carried: %d/%d" % (len(must) - len(missing), len(must)))
    print("  retired labels remaining: 0")
    print("  images: %d" % len([n for n in zin.namelist() if "media/image" in n]))
    if not args.apply:
        print("\nCHECK ONLY, nothing written")
        return 0
    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    tmp = DST + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "word/document.xml":
                zout.writestr(item, doc.encode("utf-8"))
            else:
                zout.writestr(item, zin.read(item.filename))
    os.replace(tmp, DST)
    print("\nwrote %s" % os.path.relpath(DST, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
