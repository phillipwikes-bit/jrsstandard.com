#!/usr/bin/env python3
"""Apply the ten-priority RMJ editorial pass to 01_RMJ_Manuscript.docx.

WHY THIS EXISTS. Phillip's list of 2026-09-01 for Records Management Journal:
replace the abstract, drop the duplicate keyword list, rebuild the opening so
the article reads as records management using public records as a corpus,
remove absolute literature claims, remove the companion employment-law corpus
from the findings, de-causalise the auditor convergence, make the practical
implications operational, drop the "Gap carries the operational consequence"
claim, tighten the limitations, and replace the conclusion.

Three repairs are carried alongside the ten because the ten create or expose
them, and each is a step here rather than a hand edit so the run stays
reproducible from the source DOCX:

  A. Every Results cross-reference in this manuscript is off by one section.
     The RMJ build renumbered Methods 4.x to 5.x and Results 5.x to 6.x, and
     the in-text references were left on 5.x. They do not dangle: they resolve
     to a real but WRONG Methods heading, so "Section 5.2" reads as Materials
     where the auditor concordance is meant. Sixteen references across ten
     paragraphs are remapped.
  B. Priority 3's new opening restates paragraph 24 almost sentence for
     sentence ("the reviewer does not re-interview; they read the record"),
     which already duplicated the paragraph Priority 3 replaces. Deleted.
  C. Priority 5 removes the second corpus from the findings, and the
     Limitations paragraph describing that corpus in full has to go with it,
     as does the Discussion sentence that pointed at it.

    python3 scripts/apply_rmj_editorial_round1.py --check
    python3 scripts/apply_rmj_editorial_round1.py --apply
"""
import argparse
import os
import re
import shutil
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript.docx")
DST = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R2.docx")

ABSTRACT = [
    ("Purpose. Consequential records are often reviewed after the fact by "
     "people who did not participate in the original decision. Their ability "
     "to assess the decision depends on whether the record preserves enough "
     "information to reconstruct its basis. This study examines whether a "
     "structured, record-level documentation quality read can identify "
     "differences in that reconstructability."),
    ("Design/methodology/approach. A three-level read, Ready, Needs work or "
     "Gap, was applied to 32 publicly available public-records cases from 32 "
     "distinct sources across four document classes and two states, issued "
     "between 2005 and 2026. The read and a contemporaneous note explaining "
     "its basis were recorded from the source before the documented outcome "
     "was consulted. Ten cases were independently re-read."),
    ("Findings. The read corresponded with independent government audit "
     "findings in all five cases where comparable audit assessments were "
     "available. It was associated with reconstructability as reflected in "
     "contemporaneous basis notes: six of seven noted Needs work cases "
     "recorded that the basis could not be rebuilt, compared with none of 17 "
     "noted Ready cases (p = 0.0000520). The read also distinguished document "
     "classes according to the extent to which the underlying basis was "
     "exposed (p = 0.00466). It was not associated with appellate outcome in "
     "the resolved subset (p = 1.000), consistent with reconstructability and "
     "appellate disposition representing different properties."),
    ("Research limitations/implications. The corpus is small, non-random and "
     "limited to two jurisdictions. Reliability evidence is preliminary "
     "because only 10 cases received an independent blind re-read."),
    ("Practical implications. The findings suggest that reconstructability "
     "can be examined at the record level before a consequential record is "
     "finalised. A structured review that records both the assessment and its "
     "basis may provide an additional quality-assurance mechanism for records "
     "subject to later audit, review or challenge."),
    ("Originality/value. The study provides an initial empirical examination "
     "of a structured record-level approach to assessing whether the basis "
     "for a consequential decision remains independently reconstructable from "
     "the record itself."),
]

KEYWORDS = ("Keywords: Records management; information governance; "
            "documentation quality; public records; recordkeeping evidence; "
            "decision reconstructability")

OPENING = [
    ("A consequential record is often examined by someone who was not present "
     "when the underlying decision was made. On appeal, in audit, during "
     "investigation, or in later review, that person must work from the "
     "record available to them. The record therefore carries more than the "
     "decision itself. It carries the basis by which the decision can later "
     "be understood, examined and, where necessary, defended."),
    ("Records and information governance provides established approaches to "
     "retention, classification, access, disposal and preservation. A "
     "separate question arises at the level of the individual consequential "
     "record: whether the record preserves enough evidentiary and "
     "decision-process information for an independent reviewer to reconstruct "
     "how the conclusion was reached."),
    ("Completeness alone does not answer that question. A record may contain "
     "the required fields, follow an approved format and read as complete "
     "while still leaving the later reviewer unable to determine what "
     "evidence supported a conclusion, how the relevant information was "
     "interpreted, or why one outcome was reached rather than another."),
    ("This study examines that problem through public-records determinations. "
     "Public-records material provides a useful test corpus because decisions "
     "and audits are publicly available, some of the same programmes have "
     "been assessed independently, and documented outcomes permit examination "
     "of whether reconstructability is distinct from substantive outcome."),
    ("The broader question is not limited to freedom of information. It "
     "concerns the evidentiary quality of consequential records that must "
     "remain understandable and reviewable after the original decision-maker "
     "is no longer available."),
]

GAP_CLAIM = (
    "Existing records and information governance controls do not necessarily "
    "assess this property at the level of an individual consequential record. "
    "Two agencies can run the same case-management system and produce "
    "determinations of very different defensibility. This pilot examines "
    "whether a structured record-level read can do so.")

CONVERGENCE = (
    "The agreement with the available Comptroller findings provides "
    "preliminary evidence that the record-level read identifies the same type "
    "of evidentiary deficiency identified independently through "
    "programme-level audit.")

NULL_HEAD = "6.6 Interpreting the null outcome association"

NULL_BODY = [
    ("The absence of an association between the documentation read and "
     "appellate outcome should not be interpreted as evidence that "
     "reconstructability lacks practical significance. The published "
     "public-records corpus is structured around contested legal questions, "
     "and appellate disposition reflects legal and substantive factors that "
     "extend beyond the quality of the record."),
    ("The present finding therefore establishes an important boundary for "
     "this corpus: reconstructability and appellate disposition should not be "
     "treated as interchangeable outcome measures. Future studies should "
     "examine agency determinations before they enter a publication or "
     "litigation pathway and should compare record-level reconstructability "
     "with independently established audit and review findings."),
]

IMPLICATIONS = [
    ("The findings support three potential uses of reconstructability review "
     "within records and information governance, while not establishing that "
     "the review improves substantive outcomes."),
    ("Pre-finalisation quality assurance. A record can be reviewed for "
     "reconstructability while the underlying matter remains active. The "
     "relevant question is whether an informed reviewer who did not "
     "participate in the decision could understand the evidentiary basis and "
     "reasoning from the record available to them."),
    ("Retrospective review. Records functions can use reconstructability "
     "review to examine consequential records already in the system, "
     "particularly where audit, appeal or regulatory exposure makes later "
     "explanation likely."),
    ("Audit sampling. A structured record-level read may provide a method for "
     "identifying recurring documentation weaknesses across a programme. The "
     "value is not the rating alone. It is the recorded basis for the rating, "
     "which can identify the specific information missing from the record."),
]

GAP_REPRODUCED = "The Gap category was reproduced exactly in the blind second read."

RELIABILITY = ("Additional independent reviews would be required before stable "
               "estimates of inter-rater reliability could be established.")

CONCLUSION = [
    ("This study examines a simple records question: whether a consequential "
     "decision can later be understood and evaluated from the record itself."),
    ("Across 32 public-records cases, the structured documentation read "
     "produced a full range of assessments, corresponded with the available "
     "independent government audit findings, and was associated with "
     "reconstructability as reflected in contemporaneous basis notes and "
     "structural differences among the source records. It was not associated "
     "with appellate outcome, supporting the conclusion that reconstructability "
     "and substantive disposition should not be treated as the same variable."),
    ("The study does not establish the effectiveness of the instrument or its "
     "generalisability beyond the corpus examined. Its contribution is "
     "narrower and more practical. It provides an initial method for "
     "examining a property that consequential records must often possess: the "
     "capacity to preserve enough evidentiary and decision-process "
     "information for a later, independent reviewer to reconstruct the basis "
     "of the decision."),
    ("The next study is therefore clear. It should examine agency records as "
     "issued, rather than only records that later entered published disputes; "
     "use multiple blinded reviewers; preserve contemporaneous basis notes; "
     "and compare record-level assessments with independently established "
     "review or audit findings."),
    ("For records and information governance, the central implication is "
     "straightforward. A record may survive because it was retained, "
     "classified and preserved correctly while still failing to preserve the "
     "basis of the decision it documents. Reconstructability is therefore a "
     "distinct quality of consequential records and one that can be examined "
     "directly."),
]

TECH_NEUTRAL = (
    "Reviewability is a property of the record, measurable regardless of the "
    "software or system that produced it. That is what makes a "
    "documentation-quality read portable across agencies and across "
    "workflows, and Section 6.2 shows it lands where a professional auditor "
    "lands.")

# Repair A. Every entry is a Results reference the RMJ renumbering left on the
# Methods block, where it resolves to a real but wrong heading.
XREF = [
    ("every coefficient reported in Section 5.7",
     "every coefficient reported in Section 6.7"),
    ("what makes the analysis in Section 5.3 possible",
     "what makes the analysis in Section 6.3 possible"),
    ("are analyzed separately in Section 5.2",
     "are analyzed separately in Section 6.2"),
    ("which is why Section 5.2 is reported as concordance",
     "which is why Section 6.2 is reported as concordance"),
    ("the same collinearity bounds what Section 5.4 can claim",
     "the same collinearity bounds what Section 6.4 can claim"),
    ("Read alongside Sections 5.3 and 5.4",
     "Read alongside Sections 6.3 and 6.4"),
    ("The note coding in Section 5.3 is post-hoc",
     "The note coding in Section 6.3 is post-hoc"),
    ("which bounds Sections 5.2 and 5.4 to the readings given there",
     "which bounds Sections 6.2 and 6.4 to the readings given there"),
    ("It computes the Section 5.3 cell counts",
     "It computes the Section 6.3 cell counts"),
    ("and the Section 5.4 groups from the structural coding frame",
     "and the Section 6.4 groups from the structural coding frame"),
    ("The blind second read of Section 5.7",
     "The blind second read of Section 6.7"),
]


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
        raise SystemExit("[REQUIRED_ENV_PARAM] RMJ DOCX not found at %s"
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
        """Replace paragraphs i..j inclusive with texts, keeping i's style."""
        nonlocal doc
        if style is None:
            style = style_of(i)
        a = spans()[i][0]
        b = spans()[j][1]
        doc = doc[:a] + "".join(para(t, style) for t in texts) + doc[b:]

    def delete_para(i):
        nonlocal doc
        a, b = spans()[i]
        doc = doc[:a] + doc[b:]

    def require(label, pred):
        i = find(pred)
        if i < 0:
            raise SystemExit("[REQUIRED_ENV_PARAM] target not found: %s" % label)
        return i

    def drop_sentence(i, marker, label):
        """Delete from marker to the end of the paragraph."""
        a, b = spans()[i]
        old = text_at(a, b)
        if marker not in old:
            raise SystemExit("[REQUIRED_ENV_PARAM] sentence not found: %s"
                             % label)
        replace_para(i, old.split(marker)[0].strip())

    # Priority 1. Abstract, Purpose through Originality/value.
    i = require("abstract Purpose",
                lambda t: t.startswith("Purpose. Records are judged"))
    j = require("abstract Originality/value",
                lambda t: t.startswith("Originality/value. A completed"))
    replace_block(i, j, ABSTRACT)
    log.append("abstract replaced, six structured elements")

    # Priority 2. One keyword list, on the Priority 2 wording.
    i = require("first keyword list",
                lambda t: t.startswith("Keywords. Records management"))
    replace_para(i, KEYWORDS)
    i = require("duplicate keyword list",
                lambda t: t.startswith("Keywords: FOIA; FOIL"))
    delete_para(i)
    log.append("duplicate keyword list removed, one list retained")

    # Priority 3. Opening section rebuilt as a records-governance problem.
    i = require("opening paragraph",
                lambda t: t.startswith("A record is the artefact an "
                                       "accountability process"))
    j = require("corpus-not-subject paragraph",
                lambda t: t.startswith("Public-records determinations are the "
                                       "corpus rather than the subject"))
    replace_block(i, j, OPENING)
    log.append("governance-problem opening rebuilt, five paragraphs")

    # Repair B. The new opening restates this paragraph sentence for sentence.
    i = require("duplicated Introduction opener",
                lambda t: t.startswith("A records officer who denies, "
                                       "redacts, or partially grants"))
    delete_para(i)
    log.append("duplicated Introduction opener removed")

    # Priority 4. Bounded literature claim.
    i = require("'Very little measures the second thing'",
                lambda t: t.startswith("Very little measures the second thing"))
    replace_para(i, GAP_CLAIM)
    log.append("absolute literature claim replaced with a bounded one")

    # Priority 6. Non-causal statement of the auditor convergence.
    i = require("concordance paragraph",
                lambda t: t.startswith("Concordance is five of five"))
    a, b = spans()[i]
    replace_para(i, text_at(a, b).strip() + " " + CONVERGENCE)
    log.append("auditor convergence stated without the causal reading")

    # Priority 5. The companion corpus leaves the findings.
    i = require("6.6 heading",
                lambda t: t.strip().startswith("6.6 The same instrument"))
    replace_para(i, NULL_HEAD)
    i = require("second-corpus first paragraph",
                lambda t: t.startswith("That explanation can be tested rather "
                                       "than asserted"))
    j = require("second-corpus third paragraph",
                lambda t: t.startswith("That result belongs to the second "
                                       "study"))
    replace_block(i, j, NULL_BODY)
    log.append("6.6 rewritten as the null-outcome boundary, second corpus out")

    # Repair C. The Discussion pointer and the Limitations paragraph go too.
    i = require("Discussion three propositions",
                lambda t: t.startswith("The pilot provides evidence for three "
                                       "propositions"))
    drop_sentence(i, "Section 5.6 adds a fourth observation",
                  "Discussion pointer to the second corpus")
    log.append("Discussion pointer to the second corpus removed")
    i = require("Limitations second-corpus paragraph",
                lambda t: t.startswith("The cross-domain observation in "
                                       "Section 5.6"))
    delete_para(i)
    log.append("Limitations paragraph describing the second corpus removed")

    # Priority 7. Operational practical implications.
    i = require("implications opener",
                lambda t: t.startswith("Three implications follow for "
                                       "practice"))
    j = require("programme-level and case-level paragraph",
                lambda t: t.startswith("Programme-level and case-level records "
                                       "fail differently"))
    replace_block(i, j, IMPLICATIONS)
    log.append("practical implications restated as three operational uses")

    # Priority 8. Drop the operational-consequence claim about Gap.
    i = require("disagreement asymmetry paragraph",
                lambda t: t.startswith("The disagreements are not symmetric"))
    drop_sentence(i, "The Gap read, which is the one that carries",
                  "Gap operational-consequence claim")
    a, b = spans()[i]
    replace_para(i, text_at(a, b).strip() + " " + GAP_REPRODUCED)
    log.append("Gap operational-consequence claim replaced with the finding")

    # Priority 9. Tighten the reliability limitation.
    i = require("one second reader paragraph",
                lambda t: t.startswith("One second reader is not a panel"))
    drop_sentence(i, "Two further blind packets were prepared",
                  "unreturned blind packets sentence")
    a, b = spans()[i]
    replace_para(i, text_at(a, b).strip() + " " + RELIABILITY)
    log.append("unreturned-packet detail replaced with a reliability statement")

    # Priority 10. Records-focused conclusion.
    i = require("conclusion opener",
                lambda t: t.startswith("The drafting tool and the technology "
                                       "stack"))
    j = require("conclusion follow-on paragraph",
                lambda t: t.startswith("It also makes the follow-on study "
                                       "specific"))
    replace_block(i, j, CONCLUSION)
    log.append("conclusion replaced with the records-management version")

    # Repair D. Phillip's standing instruction of 2026-09-01 on this exact
    #     sentence, "avoid repeatedly contrasting hand-typed denial and an
    #     AI-drafted one alike", is already applied to the corrected master.
    #     Priority 10 restates the concern for RMJ. Applied here so the two
    #     manuscripts do not contradict each other on a point already ruled on.
    i = require("technology paragraph",
                lambda t: t.startswith("Reviewability is a property of the "
                                       "record"))
    replace_para(i, TECH_NEUTRAL)
    log.append("AI contrast removed from the technology paragraph")

    # Repair A. Remap every Results cross-reference left on the Methods block.
    fixed = 0
    for old, new in XREF:
        if old not in re.sub(r"<[^>]+>", "", doc):
            raise SystemExit("[REQUIRED_ENV_PARAM] cross-reference not found: "
                             "%s" % old)
        for i, (a, b) in enumerate(spans()):
            t = text_at(a, b)
            if old in t:
                replace_para(i, t.replace(old, new))
                fixed += 1
                break
    log.append("Results cross-references remapped off the Methods block: %d"
               % fixed)

    plain = re.sub(r"<[^>]+>", "", doc)

    must = ["five of five", "p = 0.0000520", "p = 0.00466", "p = 0.0000050",
            "p = 1.000", "0.582", "7 of 10", "0.474", "0.559",
            "Figure 1.", "Figure 2.", "Figure 3.", "85.7%", "23.1%", "28.6%"]
    missing = [m for m in must if m not in plain]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] RMJ pass dropped evidence: %s"
                         % "; ".join(missing))

    banned = ["hand-typed denial",
              "Nothing measures that property directly",
              "reaches auditors' judgments earlier",
              "No comparable set exists in the records literature",
              "Very little measures the second thing",
              "Keywords: FOIA; FOIL",
              "employment and labour matters", "odds ratio 15.00",
              "p = 0.0194", "p = 0.0291", "6 of 8", "2 of 12",
              "employment-law corpus",
              "which is the one that carries the operational consequence",
              "Two further blind packets were prepared",
              "The drafting tool and the technology stack",
              "cannot be independently defended",
              "A records officer who denies, redacts, or partially grants"]
    left = [b for b in banned if b in plain]
    if left:
        raise SystemExit("[REQUIRED_ENV_PARAM] retired phrasing survives: %s"
                         % "; ".join(left))

    # No Results reference may still point into the Methods block.
    heads = set()
    for a, b in spans():
        t = text_at(a, b).strip()
        m = re.match(r"^(\d+(?:\.\d+)?)\.?\s+\S", t)
        if m and len(t) < 95:
            heads.add(m.group(1))
    stale = []
    for a, b in spans():
        for m in re.finditer(r"Sections?\s+(\d\.\d)(?:\s+and\s+(\d\.\d))?",
                             text_at(a, b)):
            for g in m.groups():
                if g and g not in heads:
                    stale.append(g)
    if stale:
        raise SystemExit("[REQUIRED_ENV_PARAM] dangling cross-reference: %s"
                         % "; ".join(sorted(set(stale))))

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

    shutil.copyfile(SRC, DST)
    zsrc = zipfile.ZipFile(SRC)
    tmp = DST + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zsrc.infolist():
            data = zsrc.read(item.filename)
            if item.filename == "word/document.xml":
                data = doc.encode("utf-8")
            zout.writestr(item, data)
    zsrc.close()
    os.replace(tmp, DST)
    print("\nwrote %s" % os.path.relpath(DST, ROOT))


if __name__ == "__main__":
    main()
