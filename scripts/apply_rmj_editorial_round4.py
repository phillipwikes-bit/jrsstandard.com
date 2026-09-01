#!/usr/bin/env python3
"""Apply Phillip's fourteen-item RMJ list of 2026-09-01 to R4.

WHY THIS EXISTS. The list quotes the pre-round-1 title, so it was written
against a state two passes old. Seven of the fourteen are already satisfied
and are asserted rather than re-applied, because applying supplied text over
text that already says the same thing is how a manuscript ends up saying it
twice. Seven are genuinely outstanding and are applied.

ALREADY SATISFIED, asserted only:
  2  the abstract does not lead with convergent, construct and discriminant
     vocabulary; the structured Purpose element already states the question
     his replacement sentence states.
  6  the employment-law corpus is gone and Section 6.6 already carries his
     replacement wording almost verbatim.
  9  "could be adapted for use as a pre-issuance review checklist" is in.
  10 the officer-consistency and defence-cost claims are gone, replaced by
     the clearer-basis-for-later-review wording.
  11 the Gap reproduction is already bounded to the ten-case re-read.
  13 the field-wide novelty claim is already the bounded sentence he asks for.
  7 is a near-duplicate: the paragraph is present from an earlier variant of
     his own text, so only its final sentence is refreshed to this wording.

ONE REPAIR IS CARRIED. Item 14's ending closes on the same question the
penultimate paragraph already closes on, almost word for word, because that
paragraph came from an earlier list of his. Its unique first two sentences
stay and set the new ending up; the duplicated question goes.

ONE ITEM HAD NO MATCHING TARGET. Item 5 maps "discriminant validity" to a
phrase about appellate outcome, but this manuscript calls the appellate
comparison a specification check. The live "Discriminant validity" label sits
on the DOCUMENT-CLASS test, so it is relabelled as structural differentiation,
which is what item 8 calls the same finding.

    python3 scripts/apply_rmj_editorial_round4.py --check
    python3 scripts/apply_rmj_editorial_round4.py --apply
"""
import argparse
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R4.docx")
DST = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R5.docx")

TITLE = ("Can Public-Records Determinations Be Independently Reconstructed? "
         "Evidence from 32 Public Cases")

PROTOCOL_HEAD = "4. Record-level review protocol"

PROTOCOL_OPEN = (
    "This study applies a structured record-level review protocol designed to "
    "examine whether the basis of a consequential determination can later be "
    "reconstructed from the record itself. The protocol is referred to in "
    "this study as the Justification Review Standard (JRS). Five conditions "
    "carry that question. Reconstructability, whether the conclusion can be "
    "rebuilt from the record alone. Basis identification, whether the source "
    "of each characterization is identifiable. Chronological integrity, "
    "whether dates, sequence, and sources hold together when read cold. "
    "Decision-process traceability, whether the reasoning from evidence to "
    "conclusion can be followed and the responsible parties identified. "
    "Evidentiary sufficiency, whether the record carries enough to support "
    "the weight of the decision.")

AUDIT_FINDING = (
    "In the five compliance audits included in the corpus, the record-level "
    "review classified each source as Gap, consistent with the independent "
    "auditors' findings that the relevant programmes could not adequately "
    "evidence aspects of their public-records administration.")

AUDIT_CAVEAT = (
    "Because this comparison is limited to five structurally similar audit "
    "cases, it should be interpreted as preliminary evidence of convergence "
    "rather than as a stable estimate of instrument validity.")

CONSTRUCT_ANALYSIS = (
    "Preliminary construct evidence codes the contemporaneous basis notes for "
    "one question: does the note state that the underlying record-level basis "
    "could not be rebuilt from the source? Coding requires an explicit "
    "statement in the note, not an inference. This coding is post-hoc and is "
    "labelled as such wherever it appears. Association with the read is "
    "tested with Fisher's exact test.")

STRUCTURAL_ANALYSIS = (
    "Structural differentiation is examined by testing the read against "
    "document class, using a structural variable rather than the reviewer's "
    "own words: whether the source reproduces the determination text or "
    "instead assessed the underlying records in camera or in aggregate.")

RM_PROPERTY = (
    "From a records-management perspective, reconstructability concerns more "
    "than whether information has been retained. A file may contain "
    "substantial material and still fail to show how a particular "
    "administrative conclusion was reached. The relevant question is whether "
    "the relationship between the decision, the information supporting it, "
    "and the stated reasoning remains sufficiently visible for later review. "
    "Reconstructability therefore complements established concerns with "
    "retention, accessibility, authenticity, and accountability at the level "
    "of consequential individual records.")

CLASS_FINDING = [
    ("The classifications differed across the document classes represented in "
     "this corpus, with the observed pattern corresponding to differences in "
     "the extent to which the sources exposed the underlying basis for the "
     "determination."),
    ("Because document class and classification are not independent in this "
     "corpus, this finding should be interpreted as descriptive evidence "
     "consistent with the proposed construct rather than as independent "
     "validation of the review protocol."),
]

QA_SAMPLING = (
    "At programme level, reconstructability review could also be incorporated "
    "into quality-assurance sampling. A records or information governance "
    "function could sample consequential determinations, assess whether their "
    "documented basis can be independently reconstructed, identify recurring "
    "gaps, and use those findings to examine whether templates, guidance, "
    "training, or review controls require adjustment. This pilot did not test "
    "those operational interventions, but the findings provide a basis for "
    "examining them in subsequent implementation research.")

FINAL = (
    "The contribution of this pilot is not to establish a fully validated "
    "measurement instrument or to demonstrate that the use of the review "
    "protocol improves administrative outcomes. It is narrower. The findings "
    "provide initial empirical evidence that reconstructability can be "
    "examined systematically at the level of an individual consequential "
    "record. For records and information governance, that raises a practical "
    "question alongside retention and preservation: when a decision must "
    "later be explained, does the record itself preserve enough of its "
    "evidentiary basis and reasoning for an independent reviewer to "
    "reconstruct how the organization acted?")

BROADER_TRIM = (
    "The broader implication is not limited to public-records "
    "administration. Records management has long concerned itself with "
    "whether organizations retain information that is accessible, reliable, "
    "and capable of supporting accountability.")

# Items already satisfied. Each string must be ABSENT from the source.
ALREADY_GONE = [
    ("2", "Convergent, Construct, and Discriminant"),
    ("6", "employment-law corpus"),
    ("6", "odds ratio 15.00"),
    ("9", "work as a pre-issuance checklist"),
    ("10", "more consistent across officers"),
    ("10", "cheaper to defend"),
    ("13", "the field did not previously have"),
]
# Each string must be PRESENT in the source.
ALREADY_DONE = [
    ("9", "could be adapted for use as a pre-issuance review checklist"),
    ("10", "provide a clearer basis for later review by auditors"),
    ("11", "Within this 10-case blind re-read, the Gap category was "
           "reproduced exactly"),
    ("13", "an initial applied case set for examining record-level "
           "reconstructability"),
    ("6", "reconstructability and appellate disposition should not be "
          "treated as interchangeable outcome measures"),
]
# Guarded by the previous pass and by item 11 of the previous list.
KEEP_EXACT = (
    "The findings provide preliminary evidence that a structured record-level "
    "read can distinguish between sources that expose the basis of a "
    "determination and sources that leave that basis difficult or impossible "
    "to reconstruct.")


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
        raise SystemExit("[REQUIRED_ENV_PARAM] R4 DOCX not found at %s"
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

    def replace_para(i, new_text):
        nonlocal doc
        a, b = spans()[i]
        st = re.search(r'<w:pStyle w:val="([^"]+)"/>', doc[a:b])
        doc = doc[:a] + para(new_text, st.group(1) if st else None) + doc[b:]

    def replace_with_many(i, texts):
        nonlocal doc
        a, b = spans()[i]
        st = re.search(r'<w:pStyle w:val="([^"]+)"/>', doc[a:b])
        style = st.group(1) if st else None
        doc = doc[:a] + "".join(para(t, style) for t in texts) + doc[b:]

    def insert_after(i, texts):
        nonlocal doc
        a, b = spans()[i]
        st = re.search(r'<w:pStyle w:val="([^"]+)"/>', doc[a:b])
        style = st.group(1) if st else None
        doc = doc[:b] + "".join(para(t, style) for t in texts) + doc[b:]

    plain0 = re.sub(r"<[^>]+>", "", doc)

    bad = ["item %s: %r still present" % (n, s)
           for n, s in ALREADY_GONE if s in plain0]
    bad += ["item %s: %r missing" % (n, s)
            for n, s in ALREADY_DONE if s not in plain0]
    if bad:
        raise SystemExit("[REQUIRED_ENV_PARAM] the source is not R4; "
                         + "; ".join(bad))
    if KEEP_EXACT not in plain0:
        raise SystemExit("[REQUIRED_ENV_PARAM] the guarded conclusion "
                         "sentence is not in the source")
    log.append("items 2, 6, 9, 10, 11 and 13 verified already satisfied")

    # Item 1. Title.
    i = require("title",
                lambda t: t.startswith("Can the Basis Be Rebuilt?"))
    replace_para(i, TITLE)
    log.append("title -> Can Public-Records Determinations Be Independently "
               "Reconstructed?")

    # Item 3. JRS as the protocol the study applies.
    i = require("framework heading",
                lambda t: t.strip() == "4. Record-level review framework")
    replace_para(i, PROTOCOL_HEAD)
    i = require("framework opening",
                lambda t: t.startswith("The study applies a structured "
                                       "record-level review framework"))
    replace_para(i, PROTOCOL_OPEN)
    log.append("section 4 restated as the review protocol the study applies")

    # Item 4. Audit agreement, restated and immediately bounded.
    i = require("audit result paragraph",
                lambda t: t.startswith("All five received a Gap read"))
    a, b = spans()[i]
    old = text_at(a, b)
    marker = "In the auditors' own terms:"
    if marker not in old:
        raise SystemExit("[REQUIRED_ENV_PARAM] audit paragraph shape changed")
    replace_para(i, AUDIT_FINDING + " " + marker
                 + old.split(marker, 1)[1].rstrip())
    i = require("concordance paragraph",
                lambda t: t.startswith("Concordance is five of five"))
    insert_after(i, [AUDIT_CAVEAT])
    log.append("audit agreement restated and bounded at the point of claim")

    # Item 5. Validity labels out of the Analyses list.
    i = require("construct-validity analysis",
                lambda t: t.startswith("Construct validity codes the "
                                       "contemporaneous basis notes"))
    replace_para(i, CONSTRUCT_ANALYSIS)
    i = require("discriminant-validity analysis",
                lambda t: t.startswith("Discriminant validity tests the read"))
    replace_para(i, STRUCTURAL_ANALYSIS)
    log.append("construct and discriminant validity labels retired")

    # Item 7. Refresh the records-management paragraph to this wording.
    i = require("records-management property paragraph",
                lambda t: t.startswith("From a records-management "
                                       "perspective, reconstructability"))
    replace_para(i, RM_PROPERTY)
    log.append("records-management paragraph refreshed to the current wording")

    # Item 8. Document-class finding, descriptive and bounded.
    i = require("6.4 closing paragraph",
                lambda t: t.startswith("The instrument separates document "
                                       "classes"))
    replace_with_many(i, CLASS_FINDING)
    log.append("document-class finding restated as descriptive evidence")

    # Item 12. Programme-level quality-assurance sampling.
    i = require("audit sampling implication",
                lambda t: t.startswith("Audit sampling."))
    insert_after(i, [QA_SAMPLING])
    log.append("programme-level quality-assurance sampling paragraph added")

    # Item 14. Ending.
    i = require("technology closing paragraph",
                lambda t: t.startswith("The answer matters independently of "
                                       "the technology"))
    replace_para(i, FINAL)
    log.append("conclusion now ends on the contribution statement")

    # Repair. Item 14's ending closes on the same question the penultimate
    #     paragraph already closes on, almost word for word. That paragraph's
    #     own first two sentences are unique and set the ending up, so only
    #     the duplicated question goes.
    i = require("broader-implication paragraph",
                lambda t: t.startswith("The broader implication is not "
                                       "limited to public-records"))
    replace_para(i, BROADER_TRIM)
    log.append("duplicated closing question removed from the penultimate "
               "paragraph")

    plain = re.sub(r"<[^>]+>", "", doc)

    if plain.count(KEEP_EXACT) != 1:
        raise SystemExit("[REQUIRED_ENV_PARAM] the guarded conclusion "
                         "sentence was altered or duplicated")
    log.append("guarded conclusion sentence verified unchanged")

    must = ["five of five", "p = 0.0000520", "p = 0.00466", "p = 0.0000050",
            "p = 1.000", "0.582", "0.559", "0.474", "7 of 10",
            "39.7 to 89.2", "Figure 1.", "Figure 2.", "Figure 3.",
            "85.7%", "23.1%", "28.6%",
            "Reconstructability, whether the conclusion can be rebuilt",
            "Evidentiary sufficiency, whether the record carries enough",
            "initial validation and feasibility exercise",
            "Documented outcomes were coded by the same reviewer after",
            KEEP_EXACT]
    missing = [m for m in must if m not in plain]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] round 4 dropped: %s"
                         % "; ".join(missing))

    banned = ["Can the Basis Be Rebuilt?", "review framework",
              "Construct validity codes", "Discriminant validity tests",
              "The instrument separates document classes",
              "The answer matters independently of the technology",
              "Systems will change", "Drafting tools will change",
              "That distinction places documentation quality alongside",
              "does the record preserve enough of its evidentiary basis and "
              "reasoning to explain how the organization acted"]
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
