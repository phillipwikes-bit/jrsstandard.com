#!/usr/bin/env python3
"""Second editorial round on the FOIL manuscript, twelve corrections.

Applied on top of the ten corrections of the first round, to the DOCX, so the
three figures travel with the document.

TWO OF THESE SUPERSEDE THE FIRST ROUND rather than adding to it, and are
handled as replacements so the manuscript does not end up carrying both:

  title      round 1 set "Initial Evidence"; round 2 sets "Assessing
             Documentation Quality ... Preliminary Evidence"
  section 5.6 round 1 moved it to a Discussion paragraph; round 2 reduces that
             to a single forward-reference sentence
  sampling   round 1 added a purposive-sampling paragraph; round 2 supplies
             different wording for the same point, so the first is replaced
             rather than duplicated

Nothing numeric changes. Every reported figure is asserted present before the
file is written.

    python3 scripts/apply_foil_editorial_round2.py --check
    python3 scripts/apply_foil_editorial_round2.py --apply
"""
import argparse
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "foil_corrected_2026-09-01",
                   "FOIL_Article_CORRECTED_2026-09-01.docx")
OUT = os.path.join(ROOT, "research", "foil_corrected_2026-09-01")
DST = os.path.join(OUT, "FOIL_Article_CORRECTED_R2_2026-09-01.docx")

TITLE = ("Assessing Documentation Quality in Public-Records Determinations: "
         "Preliminary Evidence from 32 Public Cases")

ABSTRACT_OPEN = (
    "This study examines whether a structured documentation-quality read can "
    "distinguish between public-records sources according to the extent to "
    "which the basis for a determination can be reconstructed from the "
    "published record. Thirty-two public-records cases from four document "
    "classes and two states were reviewed between June and August 2026. Each "
    "source was classified as Ready, Needs work, or Gap, with the basis for "
    "the classification recorded before the documented outcome was consulted.")

BOUNDED_GAP = (
    "Existing records-management and FOIA research addresses many aspects of "
    "access, compliance, technology, and decision-making. Less attention has "
    "been given to a narrower record-level question: whether a later reviewer "
    "can reconstruct the basis for a determination from the documentation "
    "available to them. Two agencies can run the same case-management system "
    "and produce determinations of very different defensibility. This pilot "
    "tests an instrument aimed at that gap: a structured read of the record, "
    "applied without regard to the workflow or the tool that produced it.")

DECISION_RULE = (
    "The five conditions are not treated as independent additive scores. They "
    "provide a structured basis for an overall record-level judgment. A Ready "
    "classification indicates that the material available to the reviewer "
    "permits reconstruction of the basis for the determination. Needs work "
    "indicates that part of the basis can be reconstructed but material gaps "
    "remain. Gap indicates that the available source does not provide a "
    "sufficient record-level basis from which the determination can be "
    "independently reconstructed.")

REVIEWER_SEP = (
    "All 32 initial reads were recorded by a single domain reviewer. "
    "Documented outcomes were coded by the same reviewer after the "
    "record-level read and basis note had been completed. The temporal "
    "separation reduces outcome influence on the initial classification but "
    "does not remove the broader limitation associated with a single primary "
    "reviewer. Section 7 treats that as a limitation.")

CAUSAL_SOFTEN = (
    "The association is consistent with the interpretation that the reads "
    "responded to the presence or absence of a rebuildable basis, which is "
    "the property the instrument is intended to assess, rather than to who "
    "won or to what kind of case it was.")

NULL_REFRAME = (
    "The null association is consistent with the distinction between "
    "documentation reconstructability and appellate disposition. Published "
    "appellate decisions are selected because a legal dispute reached review "
    "and therefore cannot be treated as representative of the documentation "
    "quality of public-records determinations generally.")

SECOND_STUDY = (
    "A separate study is examining whether the relationship between "
    "documentation quality and adjudicative outcome differs in a corpus not "
    "selected through publication or appellate review. Those results are "
    "reported separately.")

TECH_NEUTRAL = (
    "Reviewability is a property of the record, measurable regardless of the "
    "software or system that produced it. That is what makes a "
    "documentation-quality read portable across agencies and across "
    "workflows, and Section 5.2 shows it lands where a professional auditor "
    "lands.")

CONCLUSION_SOFTEN = (
    "The drafting tool and the technology stack will keep changing. The "
    "evidentiary test does not. A public-records determination whose basis "
    "cannot be reconstructed from the documentation available to a later "
    "reviewer carries a material reviewability and defensibility risk.")

DATA_AVAIL = (
    "Case-level data, including public citations, classifications, "
    "contemporaneous basis notes, outcome coding, and analysis procedures, "
    "are maintained in the study database. Verified counts as of 8 August "
    "2026: 32 cases from 32 distinct public sources, collected 26 June to 8 "
    "August 2026; reads 18 Ready, 9 Needs work, 5 Gap; outcomes 15 did not "
    "survive review, 7 contested, 5 sustained, 5 adverse audit findings. "
    "Analysis code and the complete case set will be made available with "
    "publication, subject to journal requirements.")

SAMPLING = (
    "The sample was designed to test the feasibility and behavior of the "
    "review protocol across contrasting public sources, not to estimate the "
    "prevalence of documentation-quality classifications across "
    "public-records programs.")


NULL_PARA = (
    "A fourth analysis, testing the read against whether the agency prevailed "
    "on appeal, is null (p = 1.000). Given the first three findings that is "
    "the expected relationship: reconstructability and appellate disposition "
    "measure different things, and published decisions are selected for "
    "contested legal questions rather than for thin files.")

BLIND_DATA_NOTE = (
    "The blind second read, its per-case answers and every coefficient "
    "reported in Section 5.6 are held in "
    "Blind_Recheck_RESULT_2026-08-28.json.")


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def para(text, style=None):
    pr = "<w:pPr>"
    if style:
        pr += '<w:pStyle w:val="%s"/>' % style
    pr += '<w:spacing w:after="140"/></w:pPr>'
    return ('<w:p>%s<w:r><w:t xml:space="preserve">%s</w:t></w:r></w:p>'
            % (pr, esc(text)))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.check):
        ap.error("pass --check or --apply")
    if not os.path.exists(SRC):
        raise SystemExit("[REQUIRED_ENV_PARAM] round-1 DOCX not found at %s"
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

    def find(pred):
        for i, (a, b) in enumerate(spans()):
            if pred(text_at(a, b)):
                return i
        return -1

    def replace_para(i, new_text, style=None):
        nonlocal doc
        a, b = spans()[i]
        if style is None:
            st = re.search(r'<w:pStyle w:val="([^"]+)"/>', doc[a:b])
            style = st.group(1) if st else None
        doc = doc[:a] + para(new_text, style) + doc[b:]

    def delete_para(i):
        nonlocal doc
        a, b = spans()[i]
        doc = doc[:a] + doc[b:]

    def insert_after(i, text, style=None):
        nonlocal doc
        a, b = spans()[i]
        doc = doc[:b] + para(text, style) + doc[b:]

    def do(label, pred, action, *a):
        i = find(pred)
        if i < 0:
            raise SystemExit("[REQUIRED_ENV_PARAM] target not found: %s" % label)
        action(i, *a)
        log.append(label)

    # 2. Title.
    do("title -> Assessing Documentation Quality ... Preliminary Evidence",
       lambda t: t.startswith("A Documentation Quality Read for Public-Records"),
       replace_para, TITLE)
    # 1. Abstract opening, and delete the rhetorical line.
    do("abstract opening rewritten in conventional research style",
       lambda t: t.startswith("Public-records determinations are reviewed "
                              "constantly"),
       replace_para, ABSTRACT_OPEN)
    do("deleted: 'Three findings, none of them about who won.'",
       lambda t: t.strip() == "Three findings, none of them about who won.",
       delete_para)
    # 3. Bounded literature claim.
    do("'Very little measures the second thing' replaced with a bounded claim",
       lambda t: t.startswith("Very little measures the second thing"),
       replace_para, BOUNDED_GAP)
    # 4. Decision rule.
    do("added: five-conditions-to-three-levels decision rule",
       lambda t: t.startswith("The conditions resolve to a three-level read"),
       insert_after, DECISION_RULE)
    # 5. Reviewer and outcome separation.
    do("4.5 single-reviewer sentence rewritten with temporal separation",
       lambda t: t.startswith("All 32 reads were recorded by a single domain "
                              "reviewer, who also recorded the outcomes"),
       replace_para, REVIEWER_SEP)
    # 6. Soften the causal reading in 5.3.
    i = find(lambda t: t.startswith("These findings provide preliminary "
                                    "evidence addressing the third"))
    if i < 0:
        raise SystemExit("[REQUIRED_ENV_PARAM] 5.3 interpretation not found")
    a, b = spans()[i]
    old = text_at(a, b)
    lead = "These findings provide preliminary evidence addressing the third research question. "
    tail = old.split("and not by who won or by what kind of case it was.", 1)
    if len(tail) != 2:
        raise SystemExit("[REQUIRED_ENV_PARAM] 5.3 causal clause not found")
    replace_para(i, lead + CAUSAL_SOFTEN + tail[1].strip())
    log.append("5.3 causal language softened to 'consistent with'")
    # 7. Reframe the null result.
    i = find(lambda t: "Two variables that measure different things are not "
                       "expected to correlate" in t)
    if i < 0:
        raise SystemExit("[REQUIRED_ENV_PARAM] 5.5 argumentative sentence "
                         "not found")
    a, b = spans()[i]
    old = text_at(a, b)
    cut = old.split("Two variables that measure different things")[0].strip()
    replace_para(i, cut + " " + NULL_REFRAME)
    log.append("5.5 argumentative sentence replaced with the neutral reframing")
    # 8. Reduce the Discussion paragraph to one forward reference.
    do("second-corpus Discussion paragraph reduced to a forward reference",
       lambda t: t.startswith("The null relationship between documentation "
                              "reads and appellate disposition"),
       replace_para, SECOND_STUDY)
    # 9. Technology framing.
    do("AI contrast removed from the technology paragraph",
       lambda t: t.startswith("Reviewability is a property of the record"),
       replace_para, TECH_NEUTRAL)
    # 10. Conclusion.
    do("conclusion absolute claim replaced with a risk statement",
       lambda t: t.startswith("The drafting tool and the technology stack "
                              "will keep changing"),
       replace_para, CONCLUSION_SOFTEN)
    # 11. Data availability.
    do("data availability simplified, implementation detail removed",
       lambda t: t.startswith("Case-level data (public citation, read"),
       replace_para, DATA_AVAIL)
    # 12. Sampling limitation, replacing round 1's wording rather than adding.
    do("sampling limitation replaced with the round-2 wording",
       lambda t: t.startswith("The corpus was purposively assembled"),
       replace_para, SAMPLING)

    # 13. The round-2 abstract opening states the design, so the original
    #     methods paragraph beneath it is now a duplicate.
    do("redundant abstract methods paragraph removed",
       lambda t: t.startswith("We tested a structured, record-level "
                              "documentation read on 32 real"),
       delete_para)
    # 14. Correction 8 removes the second corpus from the main article; the
    #     abstract carried the same result and has to lose it too.
    do("second-corpus result removed from the abstract",
       lambda t: t.startswith("A fourth analysis, testing the read against "
                              "whether the agency prevailed"),
       replace_para, NULL_PARA)
    # 15. Limitations described that corpus in full and pointed at a section
    #     that no longer holds the observation.
    do("second-corpus limitation paragraph removed",
       lambda t: t.startswith("The cross-domain observation in Section 5.6 "
                              "is not a result of this study"),
       delete_para)
    # 16. The forward reference replaced the first Discussion paragraph, which
    #     left it opening the section. It belongs at the end.
    do("forward reference moved to the close of the Discussion",
       lambda t: t.strip() == SECOND_STUDY, delete_para)
    do("forward reference reseated after the practical-form paragraph",
       lambda t: t.startswith("For public-records programs, the practical "
                              "form is simpler"),
       insert_after, SECOND_STUDY)
    # 17. Same developer detail correction 11 removed, in the front-matter note.
    do("implementation detail removed from the blind-read data note",
       lambda t: t.startswith("The blind second read, its per-case answers"),
       replace_para, BLIND_DATA_NOTE)

    # 18. Second copy of the same developer detail, in 4.6, whose closing
    #     clause also pointed at note-coding text correction 11 removed.
    i = find(lambda t: t.startswith("The second reader was shown the public "
                                    "source"))
    if i < 0:
        raise SystemExit("[REQUIRED_ENV_PARAM] 4.6 reader paragraph not found")
    a, b = spans()[i]
    old = text_at(a, b)
    cut = old.split("All figures are computed from the stored data")[0].strip()
    if cut == old.strip():
        raise SystemExit("[REQUIRED_ENV_PARAM] 4.6 implementation sentence "
                         "not found")
    replace_para(i, cut)
    log.append("implementation detail removed from the 4.6 second-read note")

    plain = re.sub(r"<[^>]+>", "", doc)
    must = ["five of five", "p = 0.0000520", "p = 0.00466", "p = 0.0000050",
            "p = 1.000", "AC1 0.582", "7 of 10", "0.474", "0.559",
            "18 Ready, 9 Needs work, 5 Gap", "Figure 1.", "Figure 2.",
            "Figure 3.", "85.7%"]
    missing = [m for m in must if m not in plain]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] round 2 dropped evidence: %s"
                         % "; ".join(missing))
    banned = ["We tested a structured, record-level documentation read",
              "employment-law corpus", "standard-library script",
              "Three findings, none of them about who won",
              "Very little measures the second thing",
              "who also recorded the outcomes",
              "Two variables that measure different things",
              "hand-typed denial", "Python standard library",
              "cannot be independently defended",
              "Convergent, Construct, and Discriminant"]
    left = [b for b in banned if b in plain]
    if left:
        raise SystemExit("[REQUIRED_ENV_PARAM] retired phrasing survives: %s"
                         % "; ".join(left))

    for line in log:
        print("  " + line)
    print("  evidence carried: %d/%d" % (len(must) - len(missing), len(must)))
    print("  retired phrasings remaining: 0")
    print("  images: %d" % len([n for n in zin.namelist()
                                if "media/image" in n]))
    if not args.apply:
        print("\nCHECK ONLY, nothing written")
        return 0
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
