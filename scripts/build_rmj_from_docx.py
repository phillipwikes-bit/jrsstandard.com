#!/usr/bin/env python3
"""Build the Records Management Journal version FROM the figures DOCX.

WHY THIS REPLACES THE EARLIER BUILDER. The first RMJ build took its source from
manuscript_verification.txt, which is the plain-text rendering of the paper. It
carried the figure captions and dropped the three figures themselves, because a
text file cannot hold an image. The captions then referred to figures that were
not there. This builds from the DOCX, so the images travel with the document
and stay attached to the discussion they belong to.

WHAT CHANGES, WHAT DOES NOT. The images, every number, every limitation, the
failed pre-registered lower bound and the null result are untouched. Changed:
the title, the abstract rebuilt into Emerald's structured fields, keywords, a
new opening section stating the records and information governance problem, and
a practical implications section before Limitations. Sections are renumbered to
absorb the two additions.

    python3 scripts/build_rmj_from_docx.py --check
    python3 scripts/build_rmj_from_docx.py --apply
"""
import argparse
import io
import os
import re
import shutil
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "foil_production_2026-09-01",
                   "FOIL_Article_FINAL_20260828_Review_2_FIGURES.docx")
OUT = os.path.join(ROOT, "research", "rmj_submission_2026-09-01")
DST = os.path.join(OUT, "01_RMJ_Manuscript.docx")

TITLE = ("Can the Basis Be Rebuilt? A Record-Level Documentation Quality "
         "Review of 32 Public-Records Cases")

ABSTRACT = [
 ("Purpose.", "Records are judged, on appeal and in audit, on whether a reader "
  "who was not there can rebuild the basis for the decision from the record "
  "itself. Nothing measures that property directly. This paper tests whether a "
  "structured, record-level read can."),
 ("Design/methodology/approach.", "A three-level read, Ready, Needs work or "
  "Gap, was applied to 32 publicly available cases from 32 distinct sources "
  "across four document classes and two states, issued 2005 to 2026. The read "
  "and a short contemporaneous note giving its basis were recorded from the "
  "source alone, before the outcome was consulted. Ten cases were "
  "independently re-read."),
 ("Findings.", "The read agreed with independent government auditors in every "
  "case where both assessments existed, five of five. It tracked "
  "reconstructability rather than outcome: of seven noted Needs work cases, "
  "six state the basis could not be rebuilt, against none of 17 noted Ready "
  "cases (p = 0.0000520). It separated document classes by how much basis each "
  "exposes (p = 0.00466). A test against appellate outcome is null "
  "(p = 1.000), the expected boundary condition."),
 ("Research limitations/implications.", "Thirty-two cases from two states, "
  "from sources selected for contested legal questions. The blind second read "
  "agreed on 7 of 10 (AC1 0.582), below the pre-registered lower bound, so "
  "reliability evidence is interim."),
 ("Practical implications.", "Reconstructability can be assessed at the record "
  "level before a determination is finalised, and convergence with Comptroller "
  "findings indicates the read reaches auditors' judgments earlier."),
 ("Originality/value.", "A completed, citable, publicly sourced 32-case corpus "
  "with contemporaneous basis notes recorded blind to outcome. No comparable "
  "set exists in the records literature."),
]

KEYWORDS = ("Keywords. Records management; information governance; "
            "documentation quality; public records; freedom of information; "
            "recordkeeping evidence")

FRAME = [
 "A record is the artefact an accountability process actually examines. When a "
 "determination is appealed, audited or litigated, the reviewer does not "
 "re-interview the officer who made it; the reviewer reads what was written. "
 "If the basis for the decision is not on the page, the organisation cannot "
 "evidence its own conduct, and the person the decision affects cannot engage "
 "the reasoning behind it.",
 "Records and information governance has instruments for retention, "
 "classification, access and disposal. It has fewer for the sufficiency of an "
 "individual record as evidence of the decision it documents. Completeness "
 "checklists record whether required fields were filled; they do not record "
 "whether what was written can be rebuilt into the reasoning. That gap is the "
 "subject of this paper.",
 "Public-records determinations are the corpus rather than the subject. They "
 "are used because they are published, because independent auditors have "
 "separately assessed some of the same programmes, and because their outcomes "
 "are documented, which makes convergent and discriminant tests possible. The "
 "governance question generalises beyond freedom of information: any "
 "consequential record that will be read cold by a later reviewer raises it.",
]

PRACTICAL = [
 ("", "Three implications follow for practice, stated at the level the "
      "evidence supports."),
 ("Reconstructability can be assessed before finalisation, not only after "
  "challenge.", "The read operates on the record alone and takes minutes. "
  "Every judgment in this study was made from the source without access to the "
  "decision-maker, which is the position a later reviewer occupies. A records "
  "function can occupy that position deliberately, while the file is still "
  "open."),
 ("A written basis note is the mechanism, not the score.", "The three-level "
  "read is a summary; what carried the analysis was the short contemporaneous "
  "note stating why. Of the seven Needs work cases with a note, six state that "
  "the basis could not be rebuilt. A programme that records the reason "
  "alongside the rating produces an auditable trail; one that records only a "
  "rating does not."),
 ("Programme-level and case-level records fail differently.", "Every Gap read "
  "in this corpus fell on a programme-level audit, and none on a case-level "
  "determination. Case-level sources that reproduce the determination text "
  "read Ready in six of seven; sources that assessed records in camera or in "
  "aggregate read Ready in none of seven. A governance programme applying this "
  "should expect the two classes to behave differently and should not pool "
  "them."),
 ("What this does not support.", "The evidence does not establish that "
  "applying the read improves documentation, reduces adverse findings, or "
  "performs equivalently outside the two states and four document classes "
  "sampled. The reliability evidence is interim. These are the questions a "
  "larger study would take up."),
]


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def para(runs, style=None, after=140):
    pr = "<w:pPr>"
    if style:
        pr += '<w:pStyle w:val="%s"/>' % style
    pr += '<w:spacing w:after="%d"/></w:pPr>' % after
    body = ""
    for text, bold in runs:
        rpr = "<w:rPr><w:b/></w:rPr>" if bold else ""
        body += ('<w:r>%s<w:t xml:space="preserve">%s</w:t></w:r>'
                 % (rpr, esc(text)))
    return "<w:p>%s%s</w:p>" % (pr, body)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.check):
        ap.error("pass --check or --apply")
    if not os.path.exists(SRC):
        raise SystemExit("[REQUIRED_ENV_PARAM] figures DOCX not found at %s"
                         % os.path.relpath(SRC, ROOT))
    zin = zipfile.ZipFile(SRC)
    doc = zin.read("word/document.xml").decode("utf-8")
    spans = [(m.start(), m.end()) for m in
             re.finditer(r"<w:p\b.*?</w:p>", doc, re.S)]

    def text_of(i):
        return re.sub(r"<[^>]+>", "", doc[spans[i][0]:spans[i][1]])

    # 1. Title.
    old_title = text_of(0)
    if "Documentation Quality Read for Public-Records" not in old_title:
        raise SystemExit("[REQUIRED_ENV_PARAM] paragraph 0 is not the title")

    # 2. Abstract body runs from after the Abstract heading to the image.
    i_abs = next(i for i in range(len(spans))
                 if text_of(i).strip() == "Abstract")
    i_img = next(i for i in range(i_abs, len(spans))
                 if "<w:drawing>" in doc[spans[i][0]:spans[i][1]])
    # 3. Introduction heading, where the new Section 1 is inserted before.
    i_intro = next(i for i in range(len(spans))
                   if text_of(i).strip() == "1. Introduction")
    # 4. Limitations heading, where practical implications go before.
    i_lim = next(i for i in range(len(spans))
                 if text_of(i).strip() == "7. Limitations")

    print("  title paragraph      %d" % 0)
    print("  abstract body        %d..%d, replaced by %d structured fields"
          % (i_abs + 1, i_img - 1, len(ABSTRACT)))
    print("  figure 1 kept at     %d" % i_img)
    print("  new Section 1 before %d (1. Introduction)" % i_intro)
    print("  practical impl before %d (7. Limitations)" % i_lim)

    edits = []
    edits.append((spans[0][0], spans[0][1],
                  para([(TITLE, False)], "Heading1")))
    abs_xml = "".join(para([(h, True), (" " + b, False)]) for h, b in ABSTRACT)
    abs_xml += para([(KEYWORDS, False)])
    edits.append((spans[i_abs + 1][0], spans[i_img - 1][1], abs_xml))
    frame_xml = para([("1. The governance problem", False)], "Heading2")
    frame_xml += "".join(para([(p, False)]) for p in FRAME)
    edits.append((spans[i_intro][0], spans[i_intro][0], frame_xml))
    prac_xml = para([("8. Practical implications for records and information "
                      "governance", False)], "Heading2")
    for h, b in PRACTICAL:
        prac_xml += para(([(h, True), (" " + b, False)] if h
                          else [(b, False)]))
    edits.append((spans[i_lim][0], spans[i_lim][0], prac_xml))

    for a, b, xml in sorted(edits, key=lambda e: -e[0]):
        doc = doc[:a] + xml + doc[b:]

    # Renumber the original sections 1 to 8 into 2 to 7, 9, 10.
    renum = [("1. Introduction", "2. Introduction"),
             ("2. Research questions", "3. Research questions"),
             ("3. The instrument", "4. The instrument"),
             ("4. Methods", "5. Methods"),
             ("5. Results", "6. Results"),
             ("6. Discussion", "7. Discussion"),
             ("7. Limitations", "9. Limitations"),
             ("8. Conclusion", "10. Conclusion")]
    for old, new in reversed(renum):
        pat = "<w:t xml:space=\"preserve\">%s</w:t>" % old
        alt = "<w:t>%s</w:t>" % old
        if pat in doc:
            doc = doc.replace(pat, "<w:t xml:space=\"preserve\">%s</w:t>" % new, 1)
        elif alt in doc:
            doc = doc.replace(alt, "<w:t>%s</w:t>" % new, 1)
        else:
            raise SystemExit("[REQUIRED_ENV_PARAM] heading %r not found for "
                             "renumbering" % old)
    # Subsections are renumbered HIGHEST FIRST. Methods 4.x becomes 5.x and
    # Results 5.x becomes 6.x; doing Methods first collides both onto 5.x, and
    # a collision here is invisible in the heading list because both sets look
    # individually correct. Results is therefore moved out of the way before
    # Methods moves into it.
    def sub_renumber(doc, frm, to, count):
        for n in range(count, 0, -1):
            a, b = "%d.%d " % (frm, n), "%d.%d " % (to, n)
            doc = doc.replace("<w:t>%s" % a, "<w:t>%s" % b)
            doc = doc.replace('<w:t xml:space="preserve">%s' % a,
                              '<w:t xml:space="preserve">%s' % b)
        return doc

    doc = sub_renumber(doc, 5, 6, 7)   # Results 5.1-5.7 -> 6.1-6.7
    doc = sub_renumber(doc, 4, 5, 6)   # Methods 4.1-4.6 -> 5.1-5.6

    plain = re.sub(r"<[^>]+>", "", doc)
    must = ["five of five", "p = 0.0000520", "p = 0.00466", "p = 0.0000050",
            "p = 1.000", "p = 0.0194", "AC1 0.582", "7 of 10",
            "18 Ready, 9 Needs work, 5 Gap", "Figure 1.", "Figure 2.",
            "Figure 3."]
    missing = [m for m in must if m not in plain]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] rebuild dropped: %s"
                         % "; ".join(missing))
    imgs = len([n for n in zin.namelist() if "media/image" in n])
    print("  images carried       %d" % imgs)
    print("  evidence carried     %d/%d" % (len(must) - len(missing), len(must)))

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
