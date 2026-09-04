#!/usr/bin/env python3
"""Apply Phillip's second RMJ editorial list of 2026-09-01 to the R2 manuscript.

WHY THIS EXISTS. The ten-item list reviews the article as the Records
Management Journal version and asks for a records-management repositioning:
a public-records opening, JRS presented as a study framework rather than the
paper's product, an explicit records-management definition of
reconstructability, statistical and reproducibility detail trimmed out of the
narrative, an operational quality-control question, a scope sentence in the
limitations, and a new conclusion.

THREE OF THE TEN WERE ALREADY SATISFIED BY THE FIRST RMJ PASS and are not
re-applied, because applying them again would duplicate text rather than
change it. They are asserted as already-true instead:

  item 2, "Three findings, none of them about who won", is absent: the
      structured abstract replaced the paragraph that carried it.
  item 3, the employment-law corpus, is absent from the article. The
      replacement wording offered for it is already carried by Section 6.6,
      "Interpreting the null outcome association", written from the earlier
      list. What remained of item 3 was the argumentative closing sentence of
      6.5, which is removed here.
  item 4's disclosure point is already met; only the heading and the framing
      sentence are applied.

Two repairs are carried alongside, each a step here rather than a hand edit:

  A. Two whole-number cross-references were stale in the same way the n.m
     references were before the first pass. "Section 7 treats that as a
     limitation" pointed at the Discussion when Limitations is Section 9, and
     "Every figure in Section 5" pointed at Methods when the figures are in
     Section 6. Neither dangled, so neither was visible in a heading list.
     Both sentences are replaced by item 6 and repair C, and the guard now
     checks whole-number references as well as n.m so neither can return.
  B. Item 1's new opening is public-records-specific, which makes the first
     sentence of the corpus-justification paragraph a restatement of it.
     Trimmed.
  C. Phillip's correction of 2026-09-01, that the Methods sentence "can
     accidentally suggest the reviewer influenced both variables", was applied
     to the corrected master and never carried to this file. Applied here.

    python3 scripts/apply_rmj_editorial_round2.py --check
    python3 scripts/apply_rmj_editorial_round2.py --apply
"""
import argparse
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R2.docx")
DST = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R3.docx")

OPENING = (
    "A public-records determination is not only a response to a request. It "
    "is also a record of administrative action. It may later be examined by "
    "an appeals officer, an open-government body, a court, an auditor, or a "
    "records professional reviewing whether the agency can account for what "
    "it did. By that point, the original decision-maker may no longer be "
    "available. The record must therefore carry enough information for a "
    "later reviewer to understand how the determination was reached.")

CORPUS_TRIM = (
    "Public-records material provides a useful test corpus because decisions "
    "and audits are publicly available, some of the same programmes have been "
    "assessed independently, and documented outcomes permit examination of "
    "whether reconstructability is distinct from substantive outcome.")

RM_PROPERTY = (
    "From a records-management perspective, reconstructability concerns more "
    "than whether information has been retained. A file may contain a large "
    "volume of material and still fail to show how a particular "
    "administrative conclusion was reached. The relevant question is whether "
    "the relationship between the decision, the supporting material, and the "
    "stated reasoning remains sufficiently visible for later review. That "
    "distinction places documentation quality alongside more familiar "
    "concerns about retention, accessibility, authenticity, and "
    "accountability.")

FRAMEWORK_HEAD = "4. Record-level review framework"

FRAMEWORK_OPEN = (
    "The study applies a structured record-level review framework developed "
    "to assess whether a consequential decision can later be reconstructed "
    "from the record itself. The framework is referred to in this study as "
    "the Justification Review Standard (JRS). Five conditions carry that "
    "question. Reconstructability, whether the conclusion can be rebuilt from "
    "the record alone. Basis identification, whether the source of each "
    "characterization is identifiable. Chronological integrity, whether "
    "dates, sequence, and sources hold together when read cold. "
    "Decision-process traceability, whether the reasoning from evidence to "
    "conclusion can be followed and the responsible parties identified. "
    "Evidentiary sufficiency, whether the record carries enough to support "
    "the weight of the decision.")

BLIND_NOTE = (
    "The blinded second-read data and reproducibility materials are retained "
    "with the study records and are available from the authors.")

COEFFICIENTS = (
    "Two further coefficients are reported because the unweighted figure is "
    "not the only defensible one for this scale, and reporting only the most "
    "favourable of the three would be a choice made after seeing the data. "
    "The scale is ordinal, Ready to Needs work to Gap, and all 3 "
    "disagreements were between adjacent categories; none was a Ready against "
    "a Gap. Linear weighted kappa is 0.559 and Gwet's AC1 is 0.582. All three "
    "rest on 10 cases and none of them should be read as a stable estimate.")

DATA_AVAIL = (
    "Case-level data, including public citations, classifications, "
    "contemporaneous basis notes, outcome coding, and analysis procedures, "
    "are maintained in the study database. Verified counts as of 8 August "
    "2026: 32 cases from 32 distinct public sources, collected 26 June to 8 "
    "August 2026; reads 18 Ready, 9 Needs work, 5 Gap; outcomes 15 did not "
    "survive review, 7 contested, 5 sustained, 5 adverse audit findings. "
    "Analysis code and the complete case set will be made available with "
    "publication, subject to journal requirements.")

DISCUSSION = [
    ("This pilot provides preliminary evidence that record reconstructability "
     "can be examined systematically across public-records materials. The "
     "framework produced the full range of classifications across four "
     "document classes, corresponded with independent audit findings in the "
     "five cases where an external audit provided a comparable assessment, "
     "and showed patterns consistent with the construct it was designed to "
     "examine."),
    ("The practical implication is a records-management one. A determination "
     "may be preserved, accessible, and formally complete while still failing "
     "to preserve the basis on which the agency acted. Reviewability "
     "therefore depends not only on whether the record survives, but also on "
     "whether the relationship between the decision, its supporting "
     "information, and its stated reasoning remains available to a later "
     "reviewer."),
]

QC_QUESTION = [
    ("For records programmes, the findings suggest a practical "
     "quality-control question that can be applied before a consequential "
     "determination is finalized: if the decision-maker were unavailable and "
     "a later reviewer had only the record, could that reviewer identify what "
     "was decided, what information supported it, and how the stated "
     "conclusion followed from that information?"),
    ("This does not require agencies to preserve every intermediate thought "
     "or drafting artifact. It requires attention to whether the record "
     "ultimately retained is sufficient to reconstruct the basis of the "
     "action it documents."),
]

SCOPE = (
    "The study should therefore be read as an initial validation and "
    "feasibility exercise rather than as a population estimate of "
    "documentation quality in public-records programmes.")

CONCLUSION = [
    ("Public-records determinations must often survive the people who created "
     "them. When a determination is later reviewed, the relevant question is "
     "not whether the original decision-maker could still explain what "
     "happened. It is whether the record can do so."),
    ("This pilot examined that question across 32 publicly available "
     "public-records cases representing four document classes and two "
     "jurisdictions. The findings provide preliminary evidence that a "
     "structured record-level read can distinguish between sources that "
     "expose the basis of a determination and sources that leave that basis "
     "difficult or impossible to reconstruct."),
    ("The broader implication is not limited to public-records "
     "administration. Records management has long concerned itself with "
     "whether organizations retain information that is accessible, reliable, "
     "and capable of supporting accountability. Reconstructability adds a "
     "related question for consequential administrative records: when the "
     "decision is examined later, does the record preserve enough of its "
     "evidentiary basis and reasoning to explain how the organization acted?"),
    ("The answer matters independently of the technology used to create the "
     "record. Systems will change. Drafting tools will change. The "
     "requirement that an organization be able to account for consequential "
     "decisions from its own records will remain."),
]

REVIEWER_SEP = (
    "All 32 initial reads were recorded by a single domain reviewer. "
    "Documented outcomes were coded by the same reviewer after the "
    "record-level read and basis note had been completed. The temporal "
    "separation reduces outcome influence on the initial classification but "
    "does not remove the broader limitation associated with a single primary "
    "reviewer. Section 9 treats that as a limitation.")

# Item 2, item 3's corpus, and item 4's disclosure are already satisfied.
ALREADY = ["Three findings, none of them about who won",
           "employment-law corpus", "employment and labour matters",
           "odds ratio 15.00", "p = 0.0194"]


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
        raise SystemExit("[REQUIRED_ENV_PARAM] R2 DOCX not found at %s"
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

    def style_of(i):
        a, b = spans()[i]
        st = re.search(r'<w:pStyle w:val="([^"]+)"/>', doc[a:b])
        return st.group(1) if st else None

    def replace_para(i, new_text, style=None):
        nonlocal doc
        if style is None:
            style = style_of(i)
        a, b = spans()[i]
        doc = doc[:a] + para(new_text, style) + doc[b:]

    def replace_block(i, j, texts, style=None):
        nonlocal doc
        if style is None:
            style = style_of(i)
        a = spans()[i][0]
        b = spans()[j][1]
        doc = doc[:a] + "".join(para(t, style) for t in texts) + doc[b:]

    def insert_after(i, texts, style=None):
        nonlocal doc
        if style is None:
            style = style_of(i)
        b = spans()[i][1]
        doc = doc[:b] + "".join(para(t, style) for t in texts) + doc[b:]

    def insert_before(i, texts, style=None):
        nonlocal doc
        if style is None:
            style = style_of(i)
        a = spans()[i][0]
        doc = doc[:a] + "".join(para(t, style) for t in texts) + doc[a:]

    def require(label, pred):
        i = find(pred)
        if i < 0:
            raise SystemExit("[REQUIRED_ENV_PARAM] target not found: %s"
                             % label)
        return i

    # Three of the ten are already true. Assert, do not re-apply.
    plain0 = re.sub(r"<[^>]+>", "", doc)
    present = [a for a in ALREADY if a in plain0]
    if present:
        raise SystemExit("[REQUIRED_ENV_PARAM] expected already-removed text "
                         "is present, the source is not the R2 file: %s"
                         % "; ".join(present))
    log.append("items 2 and 3's corpus confirmed already absent, not re-applied")

    # Item 1. Public-records opening.
    i = require("governance opening paragraph",
                lambda t: t.startswith("A consequential record is often "
                                       "examined by someone"))
    replace_para(i, OPENING)
    log.append("opening replaced with the public-records lead")

    # Repair B. The corpus paragraph now restates the new opening.
    i = require("corpus-justification paragraph",
                lambda t: t.startswith("This study examines that problem "
                                       "through public-records"))
    replace_para(i, CORPUS_TRIM)
    log.append("corpus paragraph trimmed of the sentence the opening now makes")

    # Item 5. Records-management definition of reconstructability, at the
    # end of the Introduction.
    i = require("Introduction closing paragraph",
                lambda t: t.startswith("Existing records and information "
                                       "governance controls"))
    insert_after(i, [RM_PROPERTY])
    log.append("records-management definition of reconstructability added")

    # Item 4. Framework, not product.
    i = require("instrument heading",
                lambda t: t.strip() == "4. The instrument")
    replace_para(i, FRAMEWORK_HEAD)
    i = require("JRS opening paragraph",
                lambda t: t.startswith("The Justification Review Standard "
                                       "(JRS) asks one question"))
    replace_para(i, FRAMEWORK_OPEN)
    log.append("section 4 reframed as a study framework, five conditions kept")

    # Item 3 remainder. The argumentative close of 6.5; Section 6.6 already
    # carries the interpretation this list offered as its replacement.
    i = require("6.5 closing paragraph",
                lambda t: t.startswith("Read alongside Sections 6.3 and 6.4"))
    a, b = spans()[i]
    old = text_at(a, b)
    marker = "Two variables that measure different things"
    if marker not in old:
        raise SystemExit("[REQUIRED_ENV_PARAM] 6.5 argumentative sentence "
                         "not found")
    replace_para(i, old.split(marker)[0].strip())
    log.append("6.5 argumentative close removed, 6.6 carries the reading")

    # Item 6. Reproducibility detail out of the narrative.
    i = require("front-matter blind-read note",
                lambda t: t.startswith("The blind second read, its per-case "
                                       "answers"))
    replace_para(i, BLIND_NOTE)
    i = require("coefficient explanation paragraph",
                lambda t: t.startswith("Two further coefficients are reported"))
    replace_para(i, COEFFICIENTS)
    i = require("data availability paragraph",
                lambda t: t.startswith("Case-level data (public citation, "
                                       "read"))
    replace_para(i, DATA_AVAIL)
    log.append("reproducibility and coefficient detail trimmed, values kept")

    # Item 6, third copy. Section 5.6 carries the same implementation detail
    #     and a closing clause pointing at note-coding text the simplified
    #     data-availability statement no longer carries.
    i = require("5.6 second-reader paragraph",
                lambda t: t.startswith("The second reader was shown the "
                                       "public source"))
    a, b = spans()[i]
    old = text_at(a, b)
    marker = "All figures are computed from the stored data"
    if marker not in old:
        raise SystemExit("[REQUIRED_ENV_PARAM] 5.6 implementation sentence "
                         "not found")
    replace_para(i, old.split(marker)[0].strip())
    log.append("implementation detail removed from the 5.6 second-read note")

    # Item 7. Discussion opening.
    i = require("Discussion three propositions",
                lambda t: t.startswith("The pilot provides evidence for three "
                                       "propositions"))
    j = require("Discussion reviewability paragraph",
                lambda t: t.startswith("Reviewability is a property of the "
                                       "record"))
    replace_block(i, j, DISCUSSION)
    log.append("first two Discussion paragraphs replaced")

    # Item 8. Operational quality-control question.
    i = require("pre-finalisation implication",
                lambda t: t.startswith("Pre-finalisation quality assurance."))
    insert_after(i, QC_QUESTION)
    log.append("operational quality-control question added to section 8")

    # Item 9. Scope sentence at the head of the Limitations. Anchored on the
    #     heading, not on the paragraph text: two paragraphs open with "All 32
    #     reads were recorded by a single domain reviewer" and the first of
    #     them is in Methods.
    i = require("Limitations heading", lambda t: t.strip() == "9. Limitations")
    insert_after(i, [SCOPE])
    log.append("scope sentence added at the head of the Limitations")

    # Repair C. Phillip's correction of 2026-09-01, "this sentence can
    #     accidentally suggest the reviewer influenced both variables", is
    #     applied to the corrected master and was never carried to this file.
    i = require("Methods single-reviewer sentence",
                lambda t: t.startswith("All 32 reads were recorded by a "
                                       "single domain reviewer, who also "
                                       "recorded the outcomes"))
    replace_para(i, REVIEWER_SEP)
    log.append("Methods reviewer sentence rewritten with temporal separation")

    # Item 10. Conclusion.
    i = require("conclusion first paragraph",
                lambda t: t.startswith("This study examines a simple records "
                                       "question"))
    j = require("conclusion last paragraph",
                lambda t: t.startswith("For records and information "
                                       "governance, the central implication"))
    replace_block(i, j, CONCLUSION)
    log.append("conclusion replaced with the records-management ending")

    plain = re.sub(r"<[^>]+>", "", doc)

    must = ["five of five", "p = 0.0000520", "p = 0.00466", "p = 0.0000050",
            "p = 1.000", "0.582", "0.559", "0.474", "7 of 10",
            "39.7 to 89.2", "Figure 1.", "Figure 2.", "Figure 3.",
            "85.7%", "23.1%", "28.6%",
            "Reconstructability, whether the conclusion can be rebuilt",
            "Evidentiary sufficiency, whether the record carries enough",
            "initial validation and feasibility exercise",
            "Documented outcomes were coded by the same reviewer after"]
    missing = [m for m in must if m not in plain]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] RMJ round 2 dropped: %s"
                         % "; ".join(missing))

    banned = ["who also recorded the outcomes",
              "Blind_Recheck_RESULT", "standard library", "standard-library",
              "analysis.py", "needs no network access",
              "Two variables that measure different things",
              "The Justification Review Standard (JRS) asks one question",
              "4. The instrument",
              "Section 7 treats that as a limitation",
              "Every figure in Section 5",
              "A consequential record is often examined by someone",
              "This study examines a simple records question",
              "which credits an adjacent disagreement more than a distant one",
              "which does not collapse when one category holds most of the "
              "margin"]
    left = [b for b in banned if b in plain]
    if left:
        raise SystemExit("[REQUIRED_ENV_PARAM] retired phrasing survives: %s"
                         % "; ".join(left))

    # Every cross-reference, n.m and whole-number, must resolve to a heading.
    heads = set()
    for a, b in spans():
        t = text_at(a, b).strip()
        m = re.match(r"^(\d+(?:\.\d+)?)\.?\s+\S", t)
        if m and len(t) < 95:
            heads.add(m.group(1))
    stale = []
    for a, b in spans():
        t = text_at(a, b)
        for m in re.finditer(r"Sections?\s+(\d+(?:\.\d+)?)"
                             r"(?:\s+and\s+(\d+(?:\.\d+)?))?", t):
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
