#!/usr/bin/env python3
"""Evidentiary Deficit article: replace Section V with Hekim Colpan's draft.

THE EXISTING FILE IS READ AND NOT OVERWRITTEN. A dated revision is written.

SCOPE. Section V only, heading and body. Sections I to IV and VI to IX, the
JRS block, the Acknowledgment and the About the Authors block are untouched
and asserted byte-identical.

TWO DEVIATIONS FROM THE SUBMITTED DRAFT, BOTH RECORDED, NEITHER SUBSTANTIVE.

1. ONE EM-DASH REPLACED BY A COLON. CLAUDE.md section III.7 bans the em-dash
   in body prose across this repository, and the current article carries zero.
   "more disciplined than either extreme - proportionate controls" becomes
   "more disciplined than either extreme: proportionate controls". The sense is
   identical.

2. THE WORKING-REFERENCES LINE IS NOT INSERTED INTO THE ARTICLE BODY. In the
   covering note it addresses the co-author, not the reader, and the article
   carries no references apparatus of any kind. It is reproduced in the change
   log so it is not lost.

WHAT THIS SCRIPT DOES NOT DO. It does not verify Hekim's citations. Regulation
(EU) 2026/1744 and the dates 2 December 2027 and 2 August 2028 postdate this
assistant's knowledge and cannot be checked from anything in this repository.
They are carried exactly as he wrote them and flagged for the authors. Nothing
was corrected, softened, or invented in his text.

Usage:
  python3 scripts/apply_hekim_sectionV.py --apply
  python3 scripts/apply_hekim_sectionV.py --check
"""
import argparse
import hashlib
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research",
                   "Evidentiary_Deficit_Article_Hekim_Version.md")
DST = os.path.join(ROOT, "research",
                   "Evidentiary_Deficit_Article_Hekim_Version_rev2026-08-18.md")
LOG = os.path.join(ROOT, "research",
                   "Evidentiary_Deficit_Article_SectionV_CHANGE_LOG_2026-08-18.md")

STAMP = "2026-08-18"

OLD_HEADING = "## V. Data Protection and the European Frame"
NEW_HEADING = "## V. Data Protection and the European Governance Frame"

NEW_BODY = """In Europe, the governance problem begins the moment AI-assisted drafting severs the evidentiary link between a consequential record and the information, human judgment, and controls that produced it. Under the GDPR, the accountability principle in Article 5(2) does not merely require controllers to comply with the data-protection principles; it requires them to be able to demonstrate that compliance when scrutinised. Article 30's record of processing activities is one part of that accountability framework, but a modest one: it does not require every prompt or draft to be retained, nor does it become a decision log simply because a model was involved upstream. What matters is more disciplined than either extreme: proportionate controls capable of showing how the processing was governed and, where the risk warrants it, assessed.

The timing of the EU AI Act makes that distinction more than academic. The Regulation now generally applies, while its core high-risk requirements on risk management, data governance, technical documentation, logging, and human oversight have been postponed by Regulation (EU) 2026/1744. Annex III high-risk systems are subject to those requirements from 2 December 2027; high-risk systems linked to regulated products under Annex I from 2 August 2028. Organisations are therefore deploying AI-assisted workflows today while some of the Act's strongest statutory traceability controls remain pending. The practical governance question is broader than formal AI Act compliance: has enough reliable evidence been preserved to reconstruct what the AI contributed, what a human verified, and why the final record was accepted?

ISO/IEC 42001 offers an operational bridge across that gap through structured AI governance, risk management, defined responsibilities, monitoring, and continual improvement. In financial services, DORA adds a documented ICT-risk and governance framework, including management accountability and technology-risk controls. The governance objective is not indiscriminate retention. It is more surgical: preserve the right evidence, under the right controls, for the right period, so that a consequential record can still account for itself when someone eventually asks it to."""

WORKING_REFERENCES = ("GDPR Articles 5(2), 24, 30 and 35; the EU AI Act and "
                      "Article 113 as amended by Regulation (EU) 2026/1744; "
                      "DORA Articles 5 and 6; and ISO/IEC 42001:2023.")

# Citations that this assistant cannot verify. Recorded, never silently used
# as though checked.
UNVERIFIABLE = [
    ("Regulation (EU) 2026/1744",
     "postdates this assistant's knowledge; no repository source references it"),
    ("2 December 2027", "Annex III high-risk application date, per the above"),
    ("2 August 2028", "Annex I high-risk application date, per the above"),
    ("EU AI Act Article 113 as amended",
     "the amendment depends on the regulation above"),
]

# Everything outside Section V must survive untouched.
UNTOUCHED_ANCHORS = [
    ("title", "# The Evidentiary Deficit in AI-Assisted Record-Keeping"),
    ("I. Introduction", "## I. Introduction"),
    ("II. Documentation as Legal Evidence", "## II. Documentation as Legal Evidence"),
    ("III. How AI-Assisted Records Fail in Practice",
     "## III. How AI-Assisted Records Fail in Practice"),
    ("IV. Pattern Risk and Proxy Language", "## IV. Pattern Risk and Proxy Language"),
    ("VI. Oversight and Review", "## VI. Oversight and Review"),
    ("VII. Litigation and Regulatory Exposure",
     "## VII. Litigation and Regulatory Exposure"),
    ("VIII. Practitioner's Checklist", "## VIII. Practitioner's Checklist"),
    ("IX. Conclusion", "## IX. Conclusion"),
    ("About JRS", "## About JRS"),
    ("Acknowledgment", "## Acknowledgment"),
    ("About the Authors", "## About the Authors"),
]

# Phrases the new section must carry, so a later edit cannot quietly drop them.
REQUIRED = [
    ("GDPR Article 5(2) accountability",
     "the accountability principle in Article 5(2)"),
    ("Article 30 is modest, not a decision log",
     "nor does it become a decision log simply because a model was involved "
     "upstream"),
    ("AI Act postponement", "postponed by Regulation (EU) 2026/1744"),
    ("Annex III date", "from 2 December 2027"),
    ("Annex I date", "from 2 August 2028"),
    ("the practical question is reconstruction",
     "has enough reliable evidence been preserved to reconstruct what the AI "
     "contributed, what a human verified, and why the final record was "
     "accepted?"),
    ("ISO/IEC 42001 bridge", "ISO/IEC 42001 offers an operational bridge"),
    ("DORA in financial services",
     "In financial services, DORA adds a documented ICT-risk and governance "
     "framework"),
    ("not indiscriminate retention",
     "The governance objective is not indiscriminate retention."),
    ("the record accounts for itself",
     "so that a consequential record can still account for itself when someone "
     "eventually asks it to"),
]

BANNED_PROSE = [("—", "em-dash, CLAUDE.md III.7"),
                ("Designed for ", "AI fingerprint, CLAUDE.md III.7"),
                ("frequently", "filler adverb, CLAUDE.md III.7"),
                ("no policy change required", "CLAUDE.md III.7")]


def sha(p):
    return hashlib.sha256(io.open(p, "rb").read()).hexdigest()


def split_sections(text):
    """Return (before_V, section_V_block, after_V)."""
    i = text.find(OLD_HEADING)
    if i < 0:
        i = text.find(NEW_HEADING)
    if i < 0:
        raise AssertionError("Section V heading not found")
    j = text.find("## VI.", i)
    if j < 0:
        raise AssertionError("Section VI heading not found")
    return text[:i], text[i:j], text[j:]


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()

    base_hash = sha(SRC)
    src_path = DST if (args.check and os.path.isfile(DST)) else SRC
    body = io.open(src_path, encoding="utf-8").read()
    baseline = io.open(SRC, encoding="utf-8").read()

    try:
        before, oldV, after = split_sections(body)
        b_before, b_oldV, b_after = split_sections(baseline)
    except AssertionError as e:
        sys.stderr.write("BLOCKED: %s\n" % e)
        return 1

    newV = NEW_HEADING + "\n\n" + NEW_BODY + "\n\n"
    applied = oldV != newV
    body = before + newV + after

    req_missing = [(l, n) for l, n in REQUIRED if n not in body]
    banned = [(t, why) for t, why in BANNED_PROSE if t in body]
    anchors_missing = [(l, n) for l, n in UNTOUCHED_ANCHORS if n not in body]

    _, curV, _ = split_sections(body)
    outside_before = (before == b_before)
    outside_after = (after == b_after)

    h_src = len(re.findall(r"^#+ ", baseline, re.M))
    h_dst = len(re.findall(r"^#+ ", body, re.M))

    integrity = (outside_before and outside_after and not anchors_missing
                 and h_src == h_dst and not banned)
    ok = integrity and not req_missing

    if args.apply:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(base_hash, applied, b_oldV, curV, req_missing, banned,
                  anchors_missing, outside_before, outside_after, body,
                  baseline, h_src, h_dst)

    W = sys.stdout.write
    W("source sha256 : %s\n\n" % base_hash)
    W("Section V %s\n" % ("REPLACED" if applied else "ALREADY CURRENT"))
    W("  heading : %s\n" % NEW_HEADING)
    W("  words   : %d -> %d\n"
      % (len(b_oldV.split()), len(curV.split())))
    W("\nrequired content        : %s  (%d checked)\n"
      % ("PASS" if not req_missing else "FAIL", len(REQUIRED)))
    for l, n in req_missing:
        W("  MISSING  %s\n" % l)
    W("house prose rules       : %s\n" % ("PASS" if not banned else "FAIL"))
    for t, why in banned:
        W("  BANNED   %r (%s)\n" % (t, why))
    W("sections outside V      : before %s  after %s\n"
      % ("byte-identical" if outside_before else "CHANGED",
         "byte-identical" if outside_after else "CHANGED"))
    for l, n in anchors_missing:
        W("  ANCHOR LOST  %s\n" % l)
    W("headings                : %d -> %d\n" % (h_src, h_dst))
    W("\nCITATIONS NOT VERIFIED BY THIS PASS, carried exactly as drafted:\n")
    for c, why in UNVERIFIABLE:
        W("  %-32s %s\n" % (c, why))
    W("\nRESULT: %s\n" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(base_hash, applied, oldV, newV, req_missing, banned,
              anchors_missing, outside_before, outside_after, body, baseline,
              h_src, h_dst):
    L = []
    A = L.append
    A("# Evidentiary Deficit article: Section V revision")
    A("")
    A("**Date:** %s" % STAMP)
    A("**Source:** `research/Evidentiary_Deficit_Article_Hekim_Version.md` "
      "(preserved, not overwritten)")
    A("**Source sha256:** `%s`" % base_hash)
    A("**Output:** "
      "`research/Evidentiary_Deficit_Article_Hekim_Version_rev2026-08-18.md`")
    A("**Contributed by:** Hekim Colpan, covering note of %s" % STAMP)
    A("**Script:** `scripts/apply_hekim_sectionV.py`")
    A("")
    A("Section V replaced in full. Nothing else in the article was touched.")
    A("")
    A("---")
    A("")
    A("## 1. The change")
    A("")
    A("| | Before | After |")
    A("|---|---|---|")
    A("| Heading | `V. Data Protection and the European Frame` | "
      "`V. Data Protection and the European Governance Frame` |")
    A("| Words | %d | %d |" % (len(oldV.split()), len(newV.split())))
    A("| Paragraphs | %d | %d |"
      % (len([p for p in oldV.split("\n\n") if len(p.strip()) > 80]),
         len([p for p in newV.split("\n\n") if len(p.strip()) > 80])))
    A("")
    A("### Replaced text")
    A("")
    for p in [x.strip() for x in oldV.split("\n\n") if x.strip()
              and not x.strip().startswith("##")]:
        A("> " + p)
        A(">")
    A("")
    A("### Replacement text, as contributed")
    A("")
    for p in [x.strip() for x in newV.split("\n\n") if x.strip()
              and not x.strip().startswith("##")]:
        A("> " + p)
        A(">")
    A("")
    A("---")
    A("")
    A("## 2. Two deviations from the submitted draft")
    A("")
    A("Both are recorded here rather than made silently. Neither changes the "
      "sense of anything Hekim wrote.")
    A("")
    A("**Deviation 1: one em-dash replaced by a colon.**")
    A("")
    A("| | |")
    A("|---|---|")
    A("| Submitted | \"What matters is more disciplined than either extreme "
      "[em-dash] proportionate controls capable of showing...\" |")
    A("| In the article | \"What matters is more disciplined than either "
      "extreme: proportionate controls capable of showing...\" |")
    A("| Reason | `CLAUDE.md` section III.7 bans the em-dash in body prose "
      "across this repository. The article carried zero before this revision "
      "and carries zero after it. |")
    A("")
    A("**Deviation 2: the working-references line was not inserted into the "
      "article body.**")
    A("")
    A("In the covering note it addresses the co-author rather than the reader, "
      "and the article carries no references apparatus of any kind: no "
      "footnotes, no endnotes, no bibliography. Inserting a bare citation "
      "string into the body would be the only such element in the piece. It is "
      "reproduced here so it is not lost:")
    A("")
    A("> " + WORKING_REFERENCES)
    A("")
    A("**If the authors want these carried in the published piece, say so and "
      "they can be added as a short notes block.** That is a structural "
      "decision for the two of you, not a copy-edit.")
    A("")
    A("---")
    A("")
    A("## 3. Citations this pass did not verify")
    A("")
    A("**These are carried exactly as drafted. Nothing was corrected, "
      "softened, hedged or invented.**")
    A("")
    A("| Citation | Status |")
    A("|---|---|")
    for c, why in UNVERIFIABLE:
        A("| %s | **NOT VERIFIED**: %s |" % (c, why))
    A("")
    A("This assistant's knowledge ends before the instrument Hekim cites, and "
      "no source in this repository references it. The claim that the AI Act's "
      "high-risk requirements were postponed, and the two application dates "
      "that follow from it, therefore rest on his authority as the contributing "
      "co-author and an ISO/IEC 42001 auditor working in this area. **They "
      "should be checked against the Official Journal before publication**, "
      "because a wrong date in a compliance-facing article is the kind of error "
      "a reader will find.")
    A("")
    A("The GDPR, DORA and ISO/IEC 42001 references are stable instruments and "
      "raise no such issue.")
    A("")
    A("---")
    A("")
    A("## 4. What the revision changes about the argument")
    A("")
    A("The previous Section V argued that public AI tools create a processing "
      "risk and an integrity risk, and that both converge on provenance. The "
      "replacement is narrower and better aimed at the article's own question. "
      "Three things are new:")
    A("")
    A("1. **Article 30 is explicitly bounded.** The old text let a reader "
      "infer that records-of-processing obligations reach prompts and drafts. "
      "The new text says directly that they do not, and that a record of "
      "processing does not become a decision log because a model was involved "
      "upstream. That is a concession, and it makes the surrounding argument "
      "harder to dismiss.")
    A("2. **The AI Act is dated rather than invoked.** The old text described "
      "high-risk logging duties as though they were in force. The new text "
      "separates what applies now from what applies later, which is the "
      "distinction a practitioner reading this in 2026 actually needs.")
    A("3. **ISO/IEC 42001 and DORA are added** as the operational bridge "
      "across the interval, which the previous version did not address at all.")
    A("")
    A("**The central argument is unchanged and still rests on the record "
      "rather than the regulation.** The closing sentence makes that explicit: "
      "the objective is not indiscriminate retention but preserving the right "
      "evidence so a consequential record can account for itself.")
    A("")
    A("---")
    A("")
    A("## 5. Integrity")
    A("")
    A("| Check | Result |")
    A("|---|---|")
    A("| Text before Section V | %s |"
      % ("byte-identical" if outside_before else "**CHANGED**"))
    A("| Text after Section V | %s |"
      % ("byte-identical" if outside_after else "**CHANGED**"))
    A("| Heading count | %d to %d |" % (h_src, h_dst))
    A("| Em-dashes in the article | %d |" % body.count("—"))
    A("| Source file overwritten | no |")
    A("")
    A("| Section that must survive untouched | Present |")
    A("|---|---|")
    for l, n in UNTOUCHED_ANCHORS:
        A("| %s | %s |" % (l, "yes" if n in body else "**NO**"))
    A("")
    A("| Required content in the new Section V | Present |")
    A("|---|---|")
    for l, n in REQUIRED:
        A("| %s | %s |" % (l, "yes" if n in body else "**NO**"))
    A("")
    A("| House prose rule | Violations |")
    A("|---|---|")
    for t, why in BANNED_PROSE:
        A("| %s | %d |" % (why, body.count(t)))
    A("")
    A("**Sections I to IV and VI to IX, the JRS block, the Acknowledgment and "
      "the About the Authors block are byte-identical to the source.**")
    A("")
    A("---")
    A("")
    A('"Section V replaced with the contributed draft. Two recorded '
      'deviations, both formatting rather than substance. Four citations '
      'carried as drafted and flagged as unverified. No other section of the '
      'article was changed."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
