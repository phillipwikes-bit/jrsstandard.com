#!/usr/bin/env python3
"""Apply the two remaining RMJ corrections from the R5 editorial assessment.

WHY THIS EXISTS. The assessment grades R5 at A- and names exactly two things
standing between it and an A, then says explicitly not to keep rewriting the
core article. So this pass touches only those two.

  1. LITERATURE FOUNDATION. R5 carries two scholarly references, the FOIA
     technology memorandum and Gwet, plus the primary sources. For Records
     Management Journal that invites the question of how reconstructability
     relates to authenticity, reliability, completeness, accountability and
     evidential value. A positioning paragraph is added to Section 1 and five
     references are added.

  2. CONSTRUCT EVIDENCE. The same reviewer assigned the classification and
     wrote the note explaining it, so an association between the two is not
     fully independent. The basis-note analysis is restated as evidence of
     internal classification coherence, and the structural comparison and the
     audit concordance are named as the externally meaningful evidence. The
     circularity is stated in the Results, the Discussion and the Limitations
     rather than left for a reviewer to raise.

EVERY REFERENCE ADDED HERE WAS VERIFIED AGAINST THE PUBLISHER'S OWN PAGE, not
written from memory. Duranti 1995 from the Archivaria APA citation service;
Yeo 2007 from the author's own publication list, which gives 315-343 where a
search summary had given the issue range; Duranti and Makhlouf Shabou 2015
from two Emerald pages, because the issue listing credits only the second
author while the article pages credit both; Farrell 2024 from the Emerald
article page; ISO 15489-1:2016 from iso.org. No citation is included that
could not be resolved to a publisher record, and none is characterised beyond
what those pages state.

    python3 scripts/apply_rmj_editorial_round5.py --check
    python3 scripts/apply_rmj_editorial_round5.py --apply
"""
import argparse
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R5.docx")
DST = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R6.docx")

POSITIONING = (
    "Records and information governance already has a vocabulary for the "
    "qualities a record must hold. ISO 15489-1:2016 requires that a record be "
    "authentic, reliable, have integrity and be usable, and Duranti (1995) "
    "sets out reliability and authenticity as distinct properties, the first "
    "concerning the record's capacity to stand for the facts it asserts and "
    "the second its identity and freedom from alteration. Yeo (2007) "
    "characterises records as persistent representations of activities, which "
    "locates their value in what they allow a later party to understand "
    "rather than in their survival alone. Reconstructability sits alongside "
    "these rather than replacing them. A record can be authentic, reliable, "
    "unaltered and readily retrievable and still not show a later reviewer "
    "how the conclusion it documents was reached. That is a question about "
    "the sufficiency of a single consequential record as evidence of its own "
    "decision.")

POSITIONING2 = (
    "Work on measuring these qualities exists. Duranti and Makhlouf Shabou "
    "(2015) develop a model and instruments for defining and measuring "
    "quality dimensions of public electronic records, and Farrell (2024) "
    "examines public sector recordkeeping against accountability understood "
    "both as a mechanism and as a virtue, finding gaps in the mechanisms "
    "through which public bodies can be required to explain their "
    "recordkeeping conduct. The present study is narrower than either. It "
    "asks whether one property, the reconstructability of the basis for an "
    "individual determination, can be assessed consistently from the record "
    "alone, and it tests that on public material where an independent "
    "assessment of the same programmes already exists.")

ANALYSES_COHERENCE = (
    "Internal classification coherence codes the contemporaneous basis notes "
    "for one question: does the note state that the underlying record-level "
    "basis could not be rebuilt from the source? Coding requires an explicit "
    "statement in the note, not an inference. This coding is post-hoc and is "
    "labelled as such wherever it appears. Because the same reviewer assigned "
    "the classification and wrote the note, this analysis measures whether "
    "the classification and its stated reason agree, not whether the "
    "classification agrees with an independent assessment. Association "
    "between the two is tested with Fisher's exact test.")

RESULTS_FRAMING = (
    "These findings provide preliminary evidence addressing the third "
    "research question. The pattern is consistent with the reads reflecting "
    "the presence or absence of a rebuildable basis, which is the property "
    "the instrument was designed to examine, rather than appellate outcome "
    "alone. The coding is post-hoc, and the same reviewer assigned the "
    "classification and wrote the note it codes, so this result is evidence "
    "that the classifications and their recorded reasons cohere rather than "
    "independent construct validation. The contemporaneous notes are what "
    "make that coherence checkable by anyone re-reading the case set. The "
    "structural comparison in Section 6.4 and the audit concordance in "
    "Section 6.2 do not depend on the reviewer's explanatory language and "
    "carry the externally meaningful evidence.")

DISCUSSION_FRAMING = (
    "This pilot provides preliminary evidence that record reconstructability "
    "can be examined systematically across public-records materials. The "
    "framework produced the full range of classifications across four "
    "document classes, corresponded with independent audit findings in the "
    "five cases where an external audit provided a comparable assessment, and "
    "differentiated sources by a structural feature that does not depend on "
    "the reviewer's own explanatory language. The coding of contemporaneous "
    "basis notes adds that the classifications cohere with their recorded "
    "reasons; the audit concordance and the structural comparison are the "
    "evidence that does not rest on the reviewer's own account.")

LIMITATION = (
    "The note coding in Section 6.3 is post-hoc rather than pre-registered. "
    "The same reviewer assigned the classification and wrote the note that "
    "the coding then reads, so an association between them is not "
    "independent construct validation and is reported as evidence of internal "
    "coherence. The structural comparison and the audit concordance do not "
    "share that dependence.")

REFERENCES = [
    ("Duranti, L. (1995). Reliability and authenticity: The concepts and "
     "their implications. Archivaria, 39, 5-10."),
    ("Duranti, L., & Makhlouf Shabou, B. (2015). Digital diplomatics and "
     "measurement of electronic public data qualities: What lessons should be "
     "learned? Records Management Journal, 25(1), 56-77. "
     "https://doi.org/10.1108/RMJ-01-2015-0006"),
    ("Farrell, M. (2024). Accountability as a mechanism and a virtue in Irish "
     "public sector recordkeeping. Records Management Journal, 34(2-3), "
     "190-204. https://doi.org/10.1108/RMJ-09-2023-0051"),
    ("International Organization for Standardization. (2016). ISO "
     "15489-1:2016. Information and documentation - Records management - Part "
     "1: Concepts and principles."),
    ("Yeo, G. (2007). Concepts of record (1): Evidence, information, and "
     "persistent representations. The American Archivist, 70(2), 315-343."),
]

# Every in-text citation added must resolve to a reference entry.
CITED = ["Duranti (1995)", "Yeo (2007)",
         "Duranti and Makhlouf Shabou (2015)", "Farrell (2024)",
         "ISO 15489-1:2016"]


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
        raise SystemExit("[REQUIRED_ENV_PARAM] R5 DOCX not found at %s"
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

    def require(label, pred):
        i = find(pred)
        if i < 0:
            raise SystemExit("[REQUIRED_ENV_PARAM] target not found: %s"
                             % label)
        return i

    def style_of(i):
        a, b = spans()[i]
        st = re.search(r'<w:pStyle w:val="([^"]+)"/>', doc[a:b])
        return st.group(1) if st else None

    def replace_para(i, new_text):
        nonlocal doc
        style = style_of(i)
        a, b = spans()[i]
        doc = doc[:a] + para(new_text, style) + doc[b:]

    def insert_after(i, texts):
        nonlocal doc
        style = style_of(i)
        b = spans()[i][1]
        doc = doc[:b] + "".join(para(t, style) for t in texts) + doc[b:]

    def set_doc(new_doc):
        nonlocal doc
        doc = new_doc

    # 1. Literature positioning, after the governance paragraph in Section 1.
    i = require("governance approaches paragraph",
                lambda t: t.startswith("Records and information governance "
                                       "provides established approaches"))
    insert_after(i, [POSITIONING, POSITIONING2])
    log.append("literature positioning added to section 1, two paragraphs")

    # 2a. Methods: the analysis is internal coherence, and says why.
    i = require("construct-evidence analysis",
                lambda t: t.startswith("Preliminary construct evidence codes"))
    replace_para(i, ANALYSES_COHERENCE)
    log.append("basis-note analysis restated as internal coherence in Methods")

    # 2b. Results: circularity stated, external evidence named.
    i = require("6.3 interpretation paragraph",
                lambda t: t.startswith("These findings provide preliminary "
                                       "evidence addressing the third"))
    replace_para(i, RESULTS_FRAMING)
    log.append("6.3 interpretation names the dependence and the external "
               "evidence")

    # 2c. Discussion: structural comparison carries the weight.
    i = require("Discussion opening",
                lambda t: t.startswith("This pilot provides preliminary "
                                       "evidence that record "
                                       "reconstructability"))
    replace_para(i, DISCUSSION_FRAMING)
    log.append("Discussion leads on the evidence that does not depend on the "
               "reviewer")

    # 2d. Limitations: the circularity in full.
    i = require("note-coding limitation",
                lambda t: t.startswith("The note coding in Section 6.3 is "
                                       "post-hoc"))
    replace_para(i, LIMITATION)
    log.append("limitation states the shared-reviewer dependence outright")

    # 1b. Reference entries. The list is rebuilt alphabetically rather than
    #     appended to, because inserting after Gwet would leave Duranti,
    #     Farrell, ISO and Yeo sitting behind G.
    i = require("References heading", lambda t: t.strip() == "References")
    j = require("primary-source heading",
                lambda t: t.strip() == "Cited determinations, opinions, and "
                                       "audits")
    existing = []
    for k in range(i + 1, j):
        a, b = spans()[k]
        t = text_at(a, b).strip()
        if t:
            existing.append(t)
    merged = sorted(existing + REFERENCES, key=lambda r: r.lower())
    style = style_of(i + 1)
    a = spans()[i + 1][0]
    b = spans()[j - 1][1]
    set_doc(doc[:a] + "".join(para(r, style) for r in merged) + doc[b:])
    log.append("reference list rebuilt alphabetically: %d entries, %d added"
               % (len(merged), len(REFERENCES)))

    plain = (re.sub(r"<[^>]+>", "", doc).replace("&amp;", "&")
             .replace("&lt;", "<").replace("&gt;", ">")
             .replace("&quot;", '"'))

    # Every in-text citation must have a reference entry, and every added
    # reference must be cited. A reference list nobody cites is padding.
    ref_start = plain.index("References")
    body, refs = plain[:ref_start], plain[ref_start:]
    for c in CITED:
        if c not in body:
            raise SystemExit("[REQUIRED_ENV_PARAM] citation not in body: %s"
                             % c)
    for surname, marker in [("Duranti, L. (1995)", "Duranti (1995)"),
                            ("Duranti, L., & Makhlouf Shabou, B. (2015)",
                             "Duranti and Makhlouf Shabou (2015)"),
                            ("Farrell, M. (2024)", "Farrell (2024)"),
                            ("ISO 15489-1:2016", "ISO 15489-1:2016"),
                            ("Yeo, G. (2007)", "Yeo (2007)")]:
        if surname not in refs:
            raise SystemExit("[REQUIRED_ENV_PARAM] reference entry missing: %s"
                             % surname)
        if marker not in body:
            raise SystemExit("[REQUIRED_ENV_PARAM] uncited reference: %s"
                             % surname)
    log.append("every added reference is cited and every citation resolves")

    # Read the entries back as paragraphs. plain has no newlines between
    # paragraphs, so splitting it would assert on a single line and pass on
    # nothing.
    h = require("References heading", lambda t: t.strip() == "References")
    e = require("primary-source heading",
                lambda t: t.strip() == "Cited determinations, opinions, and "
                                       "audits")
    entries = []
    for k in range(h + 1, e):
        a2, b2 = spans()[k]
        t = text_at(a2, b2).strip()
        if t:
            entries.append(t)
    if len(entries) < 7:
        raise SystemExit("[REQUIRED_ENV_PARAM] reference list has %d entries, "
                         "expected at least 7" % len(entries))
    if entries != sorted(entries, key=lambda r: r.lower()):
        raise SystemExit("[REQUIRED_ENV_PARAM] reference list is not "
                         "alphabetical; first out of order: %s"
                         % next(x for x, y in
                                zip(entries,
                                    sorted(entries, key=lambda r: r.lower()))
                                if x != y)[:60])
    log.append("reference list verified alphabetical: %d entries"
               % len(entries))

    must = ["five of five", "p = 0.0000520", "p = 0.00466", "p = 0.0000050",
            "p = 1.000", "0.582", "0.559", "0.474", "7 of 10",
            "39.7 to 89.2", "Figure 1.", "Figure 2.", "Figure 3.",
            "85.7%", "23.1%", "28.6%",
            "Can Public-Records Determinations Be Independently Reconstructed",
            "Reconstructability, whether the conclusion can be rebuilt",
            "initial validation and feasibility exercise",
            "The findings provide preliminary evidence that a structured "
            "record-level read can distinguish between sources that expose "
            "the basis of a determination and sources that leave that basis "
            "difficult or impossible to reconstruct."]
    missing = [m for m in must if m not in plain]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] round 5 dropped: %s"
                         % "; ".join(missing))

    banned = ["Preliminary construct evidence codes",
              "reported as construct evidence rather than as a confirmatory "
              "test, and the contemporaneous notes",
              "showed patterns consistent with the construct it was designed "
              "to examine"]
    left = [b for b in banned if b in plain]
    if left:
        raise SystemExit("[REQUIRED_ENV_PARAM] retired phrasing survives: %s"
                         % "; ".join(left))

    heads = set()
    for a, b in spans():
        t = text_at(a, b).strip()
        m = re.match(r"^(\d+(?:\.\d+)?)\.?\s+\S", t)
        if m and len(t) < 120:
            heads.add(m.group(1))
    stale = []
    for a, b in spans():
        for m in re.finditer(r"Sections?\s+(\d+(?:\.\d+)?)"
                             r"(?:\s+and\s+(\d+(?:\.\d+)?))?", text_at(a, b)):
            for g in m.groups():
                if g and g not in heads:
                    stale.append(g)
    if stale:
        raise SystemExit("[REQUIRED_ENV_PARAM] cross-reference resolves to no "
                         "heading: %s" % "; ".join(sorted(set(stale))))

    imgs = [n for n in zin.namelist() if n.startswith("word/media/")]
    for line in log:
        print("  " + line)
    print("  evidence carried: %d/%d" % (len(must) - len(missing), len(must)))
    print("  retired phrasings remaining: %d" % len(left))
    print("  cross-references resolving to a real heading: all")
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
