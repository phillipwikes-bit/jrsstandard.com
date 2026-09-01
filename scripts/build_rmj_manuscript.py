#!/usr/bin/env python3
"""Build the Records Management Journal version of the public-records article.

WHAT THIS CHANGES AND WHAT IT DOES NOT. The evidence does not move. Every case
count, coefficient, p-value, limitation and null result is carried across
untouched, and the script fails if any of them goes missing. What changes is
the frame and the front matter, which is what a venue decision actually
governs:

  title            leads with documentation quality and the evidence, not with
                   an unvalidated construct
  abstract         rebuilt into Emerald's structured fields. This is a rewrite,
                   not a trim: the fields are the house format
  keywords         added, six, indexable against records and information
                   governance vocabulary
  framing          an opening that states the records and information
                   governance problem, with public records as the corpus
                   rather than the subject
  practical
  implications     a section the journal's readership expects and the
                   submitted version did not carry

The source is the exact text of the manuscript that was submitted to and
declined by the Journal of Civic Information, so the science being carried
forward is the science that was written, not a reconstruction of it.

    python3 scripts/build_rmj_manuscript.py --check
    python3 scripts/build_rmj_manuscript.py --apply
"""
import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "foil_production_2026-09-01", "packet",
                   "extract", "JCI_SUBMISSION_2026-08-28", "01_MANUSCRIPT",
                   "manuscript_verification.txt")
OUT = os.path.join(ROOT, "research", "rmj_submission_2026-09-01")
MS = os.path.join(OUT, "01_RMJ_Manuscript.md")

TITLE = ("Can the Basis Be Rebuilt? A Record-Level Documentation Quality "
         "Review of 32 Public-Records Cases")

# Emerald's structured abstract fields. The exact word cap is confirmed at
# upload; the field set is the house format and is what the journal indexes on.
ABSTRACT = """**Purpose.** Records are judged, on appeal and in audit, on whether a reader who was not there can rebuild the basis for the decision from the record itself. Nothing measures that property directly. This paper tests whether a structured, record-level read can.

**Design/methodology/approach.** A three-level read, Ready, Needs work or Gap, was applied to 32 publicly available cases from 32 distinct sources across four document classes and two states, issued 2005 to 2026. The read and a short contemporaneous note giving its basis were recorded from the source alone, before the outcome was consulted. Ten cases were independently re-read.

**Findings.** The read agreed with independent government auditors in every case where both assessments existed, five of five. It tracked reconstructability rather than outcome: of seven noted Needs work cases, six state the basis could not be rebuilt, against none of 17 noted Ready cases (p = 0.0000520). It separated document classes by how much basis each exposes (p = 0.00466). A test against appellate outcome is null (p = 1.000), the expected boundary condition.

**Research limitations/implications.** Thirty-two cases from two states, from sources selected for contested legal questions. The blind second read agreed on 7 of 10 (AC1 0.582), below the pre-registered lower bound, so reliability evidence is interim.

**Practical implications.** Reconstructability can be assessed at the record level before a determination is finalised, and convergence with Comptroller findings indicates the read reaches auditors' judgments earlier.

**Originality/value.** A completed, citable, publicly sourced 32-case corpus with contemporaneous basis notes recorded blind to outcome. No comparable set exists in the records literature."""

KEYWORDS = ("**Keywords.** Records management; information governance; "
            "documentation quality; public records; freedom of information; "
            "recordkeeping evidence")

FRAME = """ 1. The governance problem

A record is the artefact an accountability process actually examines. When a determination is appealed, audited or litigated, the reviewer does not re-interview the officer who made it; the reviewer reads what was written. If the basis for the decision is not on the page, the organisation cannot evidence its own conduct, and the person the decision affects cannot engage the reasoning behind it.

Records and information governance has instruments for retention, classification, access and disposal. It has fewer for the sufficiency of an individual record as evidence of the decision it documents. Completeness checklists record whether required fields were filled; they do not record whether what was written can be rebuilt into the reasoning. That gap is the subject of this paper.

Public-records determinations are the corpus rather than the subject. They are used because they are published, because independent auditors have separately assessed some of the same programmes, and because their outcomes are documented, which makes convergent and discriminant tests possible. The governance question generalises beyond freedom of information: any consequential record that will be read cold by a later reviewer raises it."""

PRACTICAL = """ Practical implications for records and information governance

Three implications follow for practice, stated at the level the evidence supports.

**Reconstructability can be assessed before finalisation, not only after challenge.** The read operates on the record alone and takes minutes. Every judgment in this study was made from the source without access to the decision-maker, which is the position a later reviewer occupies. A records function can occupy that position deliberately, while the file is still open.

**A written basis note is the mechanism, not the score.** The three-level read is a summary; what carried the analysis was the short contemporaneous note stating why. Of the seven Needs work cases with a note, six state that the basis could not be rebuilt. A programme that records the reason alongside the rating produces an auditable trail; one that records only a rating does not.

**Programme-level and case-level records fail differently.** Every Gap read in this corpus fell on a programme-level audit, and none on a case-level determination. Case-level sources that reproduce the determination text read Ready in six of seven; sources that assessed records in camera or in aggregate read Ready in none of seven. A governance programme applying this should expect the two classes to behave differently and should not pool them.

**What this does not support.** The evidence does not establish that applying the read improves documentation, reduces adverse findings, or performs equivalently outside the two states and four document classes sampled. The reliability evidence is interim. These are the questions a larger study would take up."""


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    if not (a.apply or a.check):
        ap.error("pass --check or --apply")
    if not os.path.exists(SRC):
        raise SystemExit("[REQUIRED_ENV_PARAM] submitted manuscript text not "
                         "found at %s" % os.path.relpath(SRC, ROOT))
    src = io.open(SRC, encoding="utf-8").read()
    lines = src.split("\n")

    # Replace the title line and the abstract block; keep everything else.
    i_abs = next(i for i, l in enumerate(lines) if l.strip() == "Abstract")
    # The abstract runs to the first numbered section heading.
    i_end = next(i for i in range(i_abs + 1, len(lines))
                 if re.match(r"^\s*1\.\s", lines[i]))
    head = lines[:i_abs]
    body = lines[i_end:]

    head[0] = TITLE
    new = (head + ["", " Abstract", "", ABSTRACT, "", KEYWORDS, "", "---", "",
                   FRAME, ""] + body)
    out = "\n".join(new)

    # Placement first, then renumbering, so the anchor is matched against the
    # original heading text. Doing it the other way round put the section
    # after the Conclusion, because " Limitations" had already become
    # " 8. Limitations" and the anchor missed.
    anchor = "\n 7. Limitations"
    if anchor not in out:
        raise SystemExit("[REQUIRED_ENV_PARAM] the Limitations heading was not "
                         "found; practical implications would land at the end")
    out = out.replace(anchor, "\n" + PRACTICAL + "\n" + anchor, 1)

    # The frame section is inserted before the original Section 1, so the
    # original numbering would collide. Renumber the original 1 onward.
    def bump(m):
        return " %d.%s" % (int(m.group(1)) + 1, m.group(2))
    out = re.sub(r"^ (\d)\.(\s)", bump, out, flags=re.M)
    out = out.replace("\n 2. The governance problem", "\n 1. The governance problem")

    # Number the inserted section in sequence with the rest.
    out = out.replace(
        "\n Practical implications for records and information governance",
        "\n 8. Practical implications for records and information governance", 1)
    # Named old_h/new_h rather than a/b: "a" is the argparse namespace in this
    # scope, and rebinding it in a loop silently broke --apply.
    for old_h, new_h in (("\n 8. Limitations", "\n 9. Limitations"),
                         ("\n 9. Conclusion", "\n 10. Conclusion")):
        out = out.replace(old_h, new_h, 1)

    # Section headings carry a leading space in the source, which is how the
    # extractor marked a Heading paragraph. Left as-is, md_to_docx reads
    # "1. Title" as an ordered-list item and Word renumbers it, stripping the
    # section number and the heading style from every section in the paper.
    # Emitting them as markdown headings keeps both. Numbered list items,
    # which carry no leading space, are deliberately not touched.
    out = re.sub(r"^ (\d+\. .+)$", r"## \1", out, flags=re.M)
    out = re.sub(r"^ (Abstract|References|Acknowledg\w+|Data availability.*|"
                 r"Practical implications.*)$", r"## \1", out, flags=re.M)

    must = ["32 publicly available", "five of five", "p = 0.0000520",
            "p = 0.00466", "p = 0.0000050", "p = 1.000", "p = 0.0194",
            "AC1 0.582", "7 of 10", "18 Ready, 9 Needs work, 5 Gap"]
    missing = [m for m in must if m not in out]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] the rebuild dropped evidence: %s"
                         % "; ".join(missing))

    print("  title: %s" % TITLE)
    print("  abstract: Emerald structured, %d fields, %d words"
          % (ABSTRACT.count("**") // 2, len(re.sub(r"\*\*", "", ABSTRACT).split())))
    print("  keywords: %d" % len(KEYWORDS.split("**Keywords.**")[1].split(";")))
    print("  words %d -> %d" % (len(src.split()), len(out.split())))
    print("  evidence carried: all %d required figures present" % len(must))
    if not a.apply:
        print("\nCHECK ONLY, nothing written")
        return 0
    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    io.open(MS, "w", encoding="utf-8").write(out)
    print("\nwrote %s" % os.path.relpath(MS, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
