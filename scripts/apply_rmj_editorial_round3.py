#!/usr/bin/env python3
"""Apply Phillip's eleven-item RMJ calibration list of 2026-09-01 to R3.

WHY THIS EXISTS. The list is a claim-calibration pass, not a rewrite: every
change narrows a statement to what the 32-case pilot can carry. Field-wide
novelty, convergent validity on five audits, causal language in the construct
finding, a document-class heading stronger than the design, demonstrated
operational effectiveness, and two practical claims the study never measured.

TWO OF THE ELEVEN NEED NO EDIT and are asserted rather than applied:

  item 10's phrase, "lands where a professional auditor lands", is already
      absent: the R3 Discussion rewrite replaced the paragraph carrying it.
      The item is conditional on the phrase appearing, so nothing is added.
  item 11 asks that the conclusion sentence be left unchanged. It is
      asserted present and byte-identical, so a later pass cannot drift it.

    python3 scripts/apply_rmj_editorial_round3.py --check
    python3 scripts/apply_rmj_editorial_round3.py --apply
"""
import argparse
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R3.docx")
DST = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R4.docx")

# Item 1. Field-wide novelty out of the first result.
NOVELTY = ("That answers the first research question and provides an initial "
           "applied case set for examining record-level reconstructability "
           "across publicly available public-records materials.")

# Item 2. Convergent validity becomes preliminary convergent evidence, in the
# Methods where the analysis is named and in the Results where it is reported.
ANALYSES = ("Preliminary convergent evidence is assessed by comparing the "
            "read against the independent government auditor's own conclusion "
            "in the subset where an auditor examined the same agency's "
            "records. This is a concordance count rather than a significance "
            "test, because the comparison is between two instruments and not "
            "between groups.")

CONVERGENCE = ("The agreement with the available Comptroller findings "
               "provides preliminary evidence of convergence between the "
               "record-level read and independently identified evidentiary "
               "deficiencies.")

# Item 3. Construct claim from driven-by to consistent-with.
CONSTRUCT = ("The pattern is consistent with the reads reflecting the "
             "presence or absence of a rebuildable basis, which is the "
             "property the instrument was designed to examine, rather than "
             "appellate outcome alone.")

# Item 4. Document-class heading reports the observation, not a validity claim.
CLASS_HEAD = ("6.4 Documentation reads differed across source classes "
              "according to the extent of basis exposure")

# Items 5 and 6, one paragraph.
PRACTICAL = ("For public-records programs, the practical form is simpler than "
             "the research form. Determinations that identify the applicable "
             "exemption, document the records located and produced, and "
             "connect stated reasoning to cited authority provide a clearer "
             "basis for later review by auditors, appeals bodies, and other "
             "independent reviewers. The five conditions could be adapted for "
             "use as a pre-issuance review checklist as well as a research "
             "instrument. This pilot did not test whether using such a "
             "checklist improves documentation quality, lowers reversal "
             "rates, or produces other substantive outcomes.")

# Item 7. Abstract practical implications, second sentence only.
ABSTRACT_PRACTICAL = (
    "Practical implications. The findings suggest that reconstructability can "
    "be examined at the record level before a consequential record is "
    "finalised. A structured review that records both the assessment and its "
    "basis may provide an additional mechanism for identifying documentation "
    "weaknesses before records are subject to later audit, review or "
    "challenge.")

# Item 8. Five-audit limitation stated as preliminary agreement.
AUDIT_LIMIT = ("The five-case comparison with independent audits provides "
               "preliminary evidence of agreement rather than a stable "
               "estimate of convergent validity. In this corpus, document "
               "class and read are also not independent, which limits the "
               "interpretation of the comparisons in Sections 6.2 and 6.4.")

# Item 9. Gap reproduction bounded to the 10-case subset.
GAP_BOUNDED = ("Within this 10-case blind re-read, the Gap category was "
               "reproduced exactly, although the sample is too small to treat "
               "this result as a stable estimate of category-specific "
               "reliability.")

# Item 10. Conditional on a phrase that is already absent.
ITEM_10_PHRASE = "lands where a professional auditor lands"

# Item 11. Must survive this pass byte-identical.
ITEM_11_SENTENCE = (
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
        raise SystemExit("[REQUIRED_ENV_PARAM] R3 DOCX not found at %s"
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

    def swap_tail(i, marker, new_tail, label):
        """Replace from marker to end of paragraph with new_tail."""
        a, b = spans()[i]
        old = text_at(a, b)
        if marker not in old:
            raise SystemExit("[REQUIRED_ENV_PARAM] sentence not found: %s"
                             % label)
        replace_para(i, (old.split(marker)[0].strip() + " " + new_tail).strip())

    plain0 = re.sub(r"<[^>]+>", "", doc)

    # Item 10 is conditional and its phrase is already gone. Assert, add nothing.
    if ITEM_10_PHRASE in plain0:
        raise SystemExit("[REQUIRED_ENV_PARAM] item 10's phrase is present "
                         "after all; apply its replacement before continuing")
    log.append("item 10 phrase confirmed absent, nothing added")

    # Item 11's sentence must be here before the pass and after it.
    if ITEM_11_SENTENCE not in plain0:
        raise SystemExit("[REQUIRED_ENV_PARAM] item 11's conclusion sentence "
                         "is not in the source; the file is not R3")

    # Item 1.
    i = require("first-result paragraph",
                lambda t: t.startswith("The conditions were applied to 32 "
                                       "publicly available determinations"))
    swap_tail(i, "That answers the first research question", NOVELTY,
              "field-novelty claim")
    log.append("field-wide novelty claim replaced with a bounded one")

    # Item 2, Methods and Results.
    i = require("Analyses convergent-validity sentence",
                lambda t: t.startswith("Convergent validity compares the read"))
    replace_para(i, ANALYSES)
    i = require("6.2 concordance paragraph",
                lambda t: t.startswith("Concordance is five of five"))
    swap_tail(i, "The agreement with the available Comptroller findings",
              CONVERGENCE, "convergence sentence")
    log.append("convergent validity restated as preliminary convergent evidence")

    # Item 3.
    i = require("6.3 construct interpretation",
                lambda t: t.startswith("These findings provide preliminary "
                                       "evidence addressing the third"))
    a, b = spans()[i]
    old = text_at(a, b)
    head = "These findings provide preliminary evidence addressing the third research question."
    marker = "The coding is post-hoc"
    if head not in old or marker not in old:
        raise SystemExit("[REQUIRED_ENV_PARAM] 6.3 interpretation shape "
                         "changed")
    replace_para(i, head + " " + CONSTRUCT + " " + marker
                 + old.split(marker, 1)[1].strip())
    log.append("construct claim softened from driven-by to consistent-with")

    # Item 4.
    i = require("6.4 heading",
                lambda t: t.strip().startswith("6.4 The read separates "
                                               "document classes"))
    replace_para(i, CLASS_HEAD)
    log.append("6.4 heading reports the observed difference")

    # Items 5 and 6.
    i = require("practical-form paragraph",
                lambda t: t.startswith("For public-records programs, the "
                                       "practical form is simpler"))
    replace_para(i, PRACTICAL)
    log.append("unmeasured practical claims and the checklist claim replaced")

    # Item 7.
    i = require("abstract practical implications",
                lambda t: t.startswith("Practical implications. The findings "
                                       "suggest"))
    replace_para(i, ABSTRACT_PRACTICAL)
    log.append("abstract practical-implications sentence calibrated")

    # Item 8.
    i = require("five-audit limitation",
                lambda t: t.startswith("The convergent-validity result rests "
                                       "on five audits"))
    replace_para(i, AUDIT_LIMIT)
    log.append("five-audit limitation stated as preliminary agreement")

    # Item 9.
    i = require("blind re-read asymmetry paragraph",
                lambda t: t.startswith("The disagreements are not symmetric"))
    swap_tail(i, "The Gap category was reproduced exactly", GAP_BOUNDED,
              "Gap reproduction sentence")
    log.append("Gap reproduction bounded to the 10-case subset")

    plain = re.sub(r"<[^>]+>", "", doc)

    # Item 11. Unchanged, and still exactly once.
    if plain.count(ITEM_11_SENTENCE) != 1:
        raise SystemExit("[REQUIRED_ENV_PARAM] item 11's conclusion sentence "
                         "was altered or duplicated by this pass")
    log.append("item 11 conclusion sentence verified unchanged")

    must = ["five of five", "p = 0.0000520", "p = 0.00466", "p = 0.0000050",
            "p = 1.000", "0.582", "0.559", "0.474", "7 of 10",
            "39.7 to 89.2", "Figure 1.", "Figure 2.", "Figure 3.",
            "85.7%", "23.1%", "28.6%",
            "Reconstructability, whether the conclusion can be rebuilt",
            "initial validation and feasibility exercise",
            "Documented outcomes were coded by the same reviewer after",
            ITEM_11_SENTENCE]
    missing = [m for m in must if m not in plain]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] round 3 dropped: %s"
                         % "; ".join(missing))

    banned = ["the field did not previously have",
              "Convergent validity compares the read",
              "convergent-validity result rests",
              "were driven by the presence or absence",
              "6.4 The read separates document classes",
              "work as a pre-issuance checklist",
              "more consistent across officers", "cheaper to defend",
              "additional quality-assurance mechanism",
              ITEM_10_PHRASE,
              "identifies the same type of evidentiary deficiency"]
    left = [b for b in banned if b in plain]
    if left:
        raise SystemExit("[REQUIRED_ENV_PARAM] retired phrasing survives: %s"
                         % "; ".join(left))

    # Every cross-reference must still resolve to a heading that exists.
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
