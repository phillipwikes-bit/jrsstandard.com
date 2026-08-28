#!/usr/bin/env python3
"""Apply the owner's microedit pass to the CCI resubmission.

A MICROEDIT PASS IS NOT A REVISION. The owner's instruction is explicit: REV2
has the right argument and the next version must be a true microedit pass. Every
change below is either a named instruction from his list or a cut taken from the
four categories he authorised: transitional sentences, repeated explanations of
the same evidentiary problem, the European section, and bio length.

PROTECTED, AND ASSERTED AFTER THE PASS. Pretext, burden-shifting, side-by-side
review, the disparate-treatment and disparate-impact limitation, the Before and
After examples, the seven-point control, and the JRS "undergoing structured
validation" boundary. If any of them is disturbed, this script fails rather than
writing the file.

HEKIM'S BIOGRAPHY IS NOT TOUCHED. He has already been asked to approve changes
to his section; editing his biography on top of that, to save twenty words,
would be taking his co-author control for a rounding error.

    python3 scripts/apply_cci_microedits.py            # dry run, default
    python3 scripts/apply_cci_microedits.py --apply
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "Evidentiary_Deficit_CCI_RESUBMISSION_2026-08-28_REV2.md")
OUT = os.path.join(ROOT, "research", "Evidentiary_Deficit_CCI_RESUBMISSION_2026-08-28_V3.md")

# (item number from the owner's list, old, new)
EDITS = [
    (2, "may later become the evidence through which someone asks",
        "may later become evidence through which someone asks"),

    (5, "Documentation matters at the point where the stated reason is tested against",
        "Documentation can matter when the stated reason is tested against"),

    (7, "A workforce of records is reviewed together, and that is where AI-assisted "
        "drafting introduces a risk most organizations do not currently measure.",
        "A workforce of records is reviewed together. That is where AI-assisted "
        "drafting introduces a risk most organizations do not currently measure."),

    # The highest-value edit on his list. The previous wording asserted how a
    # drafting tool is trained, which is a broader technical claim than the
    # argument needs and the one an AI-literate editor would challenge first.
    (8, "The mechanism is ordinary: a drafting tool trained or prompted on prior "
        "records will tend to produce the same characterizations, and a reviewer "
        "approving one record at a time has no vantage point from which to notice.",
        "The mechanism is straightforward: a drafting tool prompted with prior "
        "records may reproduce similar characterizations, while a reviewer "
        "approving one record at a time may have no vantage point from which to "
        "notice the pattern."),

    (10, "and the organization cannot show the evidence behind the descriptions.",
         "and the organization cannot identify the evidence behind those descriptions."),

    (11, "whether the same subjective standards are being applied across employees, "
         "and whether the organization can produce the evidence supporting them.",
         "whether the same subjective standards are being applied across employees, "
         "and whether the organization can identify the evidence supporting them."),

    (15, "2. Preserve source materials supporting material conclusions.",
         "2. Preserve the source materials supporting material conclusions."),

    (16, "3. Link conclusions to verifiable evidence rather than AI-generated "
         "assertions alone.",
         "3. Link conclusions to verifiable source evidence rather than AI-generated "
         "assertions alone."),

    (17, "and under what legal-hold triggers.",
         "and under which legal-hold triggers."),

    (18, "asks whether an AI-assisted record will hold up under independent review:",
         "asks whether an AI-assisted record can withstand independent review:"),

    (19, "the issue may no longer be one employee's wording.",
         "the issue may no longer be an individual employee's wording."),

    # Bio, his recommended version verbatim.
    ("bio", "He served as a Lead Civil Rights Officer at the Maryland Commission on "
            "Civil Rights, evaluating discrimination complaints under federal HUD and "
            "EEOC frameworks. He developed the Justification Review Standard and named "
            "Decision Reconstruction Risk, and holds an M.S. in Negotiation and "
            "Conflict Management.",
            "He served as a Lead Civil Rights Officer at the Maryland Commission on "
            "Civil Rights and developed the Justification Review Standard and Decision "
            "Reconstruction Risk. He holds an M.S. in Negotiation and Conflict "
            "Management."),
]

# Word reduction, taken only from the categories the owner authorised. Each
# entry names which category it belongs to.
CUTS = [
    # Repeated explanation. The preceding paragraph already says the employer
    # cannot show the reason it actually applied; this restates it.
    ("repeated explanation",
     "The problem is not necessarily that the decision was wrong. It is that the "
     "record may be unable to demonstrate why the decision was made, which is a "
     "different failure and a harder one to answer years later.\n\n",
     "The problem is not necessarily that the decision was wrong. It is that the "
     "record may be unable to demonstrate why the decision was made.\n\n"),

    # Transitional sentence. The control list that follows makes the point.
    ("transitional",
     "The practical control does not require a new platform or wholesale redesign. "
     "It can be a structured review before a consequential employment record "
     "becomes final.",
     "The control does not require a new platform or a wholesale redesign. It can "
     "be a structured review before a consequential employment record becomes "
     "final."),

    # European section, authorised for trimming. The clause about what the record
    # is "weaker on" restates the article's own thesis in GDPR vocabulary.
    ("European section",
     "A record that cannot show how a consequential characterization was reached "
     "is weaker on that measure, whatever else it satisfies.\n\n",
     "A record that cannot show how a consequential characterization was reached "
     "is weaker on that measure.\n\n"),

    # European section. The three-clause tail restates the question already put.
    ("European section",
     "Organizations are therefore deploying these tools today while the strongest "
     "statutory traceability controls are either pending or inapplicable, which "
     "leaves the practical question where it started: has enough evidence been "
     "preserved to reconstruct what the AI contributed, what a human verified and "
     "why the final record was accepted?",
     "Organizations are deploying these tools today while the strongest statutory "
     "traceability controls are either pending or inapplicable. The practical "
     "question is unchanged: has enough evidence been preserved to reconstruct "
     "what the AI contributed, what a human verified and why the final record was "
     "accepted?"),

    # Transitional. Two sentences saying the same thing about the instrument.
    ("transitional",
     "The specific instrument matters less than the discipline. Any review that "
     "forces those questions before a record is finalized addresses the same "
     "failure.",
     "The instrument matters less than the discipline: any review that forces "
     "those questions before a record is finalized addresses the same failure."),

    # Repeated explanation. The JRS paragraph re-enumerates five conditions that
    # the four reviewer questions have already put to the reader in plainer
    # words. The enumeration is the single largest block of restatement left.
    ("repeated explanation",
     "runs inside existing HR, compliance, investigations, audit and legal "
     "workflows and asks whether an AI-assisted record can withstand independent "
     "review: whether the conclusion can be rebuilt from the record alone, whether "
     "its basis is identifiable, whether chronology holds, whether a reviewer can "
     "trace how the conclusion was reached and whether the evidence is sufficient. "
     "It is undergoing structured validation",
     "runs inside existing HR, compliance, investigations, audit and legal "
     # ITEM 18 IS PRESERVED INSIDE THE CUT. The first version of this compression
     # deleted the clause the owner's item 18 had just been applied to, which
     # would have silently undone his instruction. The phrase he asked for,
     # "can withstand independent review", is kept.
     "workflows and asks whether an AI-assisted record can withstand independent "
     "review before it is finalized. It is undergoing structured validation"),

    # Transitional. The paragraph's own second sentence carries the point.
    ("transitional",
     "That is where AI-assisted documentation creates exposure. The underlying "
     "history may include",
     "The underlying history may include"),

    # Repeated explanation. The following sentence states the risk precisely; the
    # first sentence sets it up twice.
    ("repeated explanation",
     "When AI helps draft that record, the risk is not simply that the prose may "
     "contain an error. The larger risk is that the record can become more polished "
     "than the evidence beneath it.",
     "When AI helps draft that record, the risk is not that the prose contains an "
     "error. It is that the record can become more polished than the evidence "
     "beneath it."),

    # European section. The Annex detail is retained; the framing around it is not.
    ("European section",
     "Timing sharpens the point. The EU AI Act now generally applies, but its core "
     "high-risk requirements on risk management, technical documentation, logging "
     "and human oversight have been postponed by Regulation (EU) 2026/1744 to "
     "2 December 2027 for Annex III systems and 2 August 2028 for high-risk systems "
     "linked to regulated products under Annex I. Many employment-drafting workflows "
     "will not fall within the high-risk regime at all.",
     "The EU AI Act now generally applies, but its core high-risk requirements on "
     "risk management, technical documentation, logging and human oversight have "
     "been postponed by Regulation (EU) 2026/1744 to 2 December 2027 for Annex III "
     "systems and 2 August 2028 for Annex I systems linked to regulated products. "
     "Many employment-drafting workflows fall outside the high-risk regime "
     "entirely."),

    # Repeated explanation. The four reviewer questions above already set this
    # out as a test; the conclusion restates it as prose.
    ("repeated explanation",
     "A defensible record should allow someone who was not present to understand "
     "what happened, identify the evidence, follow the reasoning and determine "
     "whether the stated explanation is consistent with the documented history.\n\n",
     "A defensible record lets someone who was not present follow the reasoning "
     "and test whether the stated explanation matches the documented history.\n\n"),
]

PROTECTED = [
    ("pretext", r"\bpretext"),
    ("burden-shifting framework", r"burden-shifting framework"),
    ("McDonnell Douglas in italics", r"\*McDonnell Douglas Corp\. v\. Green\*"),
    ("side-by-side review", r"[Ss]ide-by-side review"),
    ("disparate theories limitation", r"remain distinct theories with different elements"),
    ("recurring language does not establish", r"does not establish either one by itself"),
    ("Before/After example 1", r"Missed nine scheduled shifts between January and March"),
    ("Before/After example 2", r"Missed client deliverable deadlines on March 3"),
    ("seven-point control item 1", r"1\. Identify the human author"),
    ("seven-point control item 7", r"7\. Confirm that the final explanation"),
    ("JRS validation boundary", r"undergoing structured validation"),
    ("right to know why disclaimer", r"not a legal doctrine and not a claim of any new entitlement"),
    ("Hekim biography intact", r"AI Governance and Compliance Manager, Data Protection "
                               r"Manager and ISO/IEC 42001 auditor based in Germany"),
    ("equal contribution statement", r"Both authors contributed equally"),
]


def main():
    dry = "--apply" not in sys.argv
    body = io.open(SRC, encoding="utf-8").read()
    before_words = len(body.split())
    out = body
    applied = []

    for item, old, new in EDITS:
        n = out.count(old)
        if n != 1:
            raise SystemExit("item %s anchor appears %d times, expected 1: %r"
                             % (item, n, old[:70]))
        out = out.replace(old, new, 1)
        applied.append(("edit %s" % item, len(new.split()) - len(old.split())))

    for category, old, new in CUTS:
        n = out.count(old)
        if n != 1:
            raise SystemExit("cut anchor appears %d times, expected 1: %r" % (n, old[:70]))
        out = out.replace(old, new, 1)
        applied.append(("cut, %s" % category, len(new.split()) - len(old.split())))

    missing = [name for name, pat in PROTECTED if not re.search(pat, out)]
    if missing:
        raise SystemExit("this pass disturbed protected material: %s" % ", ".join(missing))

    after_words = len(out.split())
    print("%s" % ("DRY RUN, nothing written. Re-run with --apply." if dry else "APPLIED"))
    for label, delta in applied:
        print("  %-28s %+d words" % (label, delta))
    print()
    print("  %d words -> %d words  (%+d)" % (before_words, after_words,
                                             after_words - before_words))
    print("  target 1,250 to 1,350: %s"
          % ("IN RANGE" if 1250 <= after_words <= 1350
             else "OUT OF RANGE, %d" % after_words))
    print("  protected elements intact: %d of %d" % (len(PROTECTED), len(PROTECTED)))
    if not dry:
        io.open(OUT, "w", encoding="utf-8").write(out)
        print("  written: %s" % os.path.relpath(OUT, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
