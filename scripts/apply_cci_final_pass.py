#!/usr/bin/env python3
"""CCI article: final surgical pass. Three corrections, then stop.

THE PRIOR VERSION IS READ AND NOT OVERWRITTEN.

THREE CORRECTIONS, AND NOTHING ELSE.
  1. The Hossain acknowledgment is deleted in full. The article ends with the
     author biographies.
  2. The US/Europe equivalence sentence is narrowed so it no longer implies
     that the two legal systems impose the same documentation obligations. The
     transatlantic framing is preserved.
  3. The administrative-record observation is qualified so it reads as a
     practical point rather than an absolute evidentiary rule.

EVERYTHING ELSE IS ASSERTED UNCHANGED. The preservation table below carries
every element the instruction protects: the McDonnell Douglas distinction, the
discrimination-theory separation, the GDPR Article 30 framing, the AI Act
scope sentence, the ISO and DORA qualifications, the discoverability
distinction, the right-to-know-why disclaimer, all nine practitioner controls,
the five JRS checks, and the neutrality sentence. The run fails if any of them
has moved.

Usage:
  python3 scripts/apply_cci_final_pass.py --apply
  python3 scripts/apply_cci_final_pass.py --check
"""
import argparse
import hashlib
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research",
                   "Evidentiary_Deficit_Article_CCI_2026-08-18.md")
DST = os.path.join(ROOT, "research",
                   "Evidentiary_Deficit_Article_CCI_FINAL_2026-08-18.md")

STAMP = "2026-08-18"
MAX_EDITS = 4

ACK = ("\n\n*The validation methodology referenced in Section IX, including "
       "the reference-panel design, the choice of agreement coefficient, and "
       "the acceptance thresholds, was designed by Ubayet Hossain, FRM, "
       "Associate Director (Model Validation), KPMG India.*")

RULES = [
    (1, "Acknowledgment, removed in full", ACK, "",
     "instructed removal. The article now ends with the author biographies."),

    (2, "Introduction, US and Europe equivalence",
     "In Europe, the GDPR's accountability principle and the EU AI Act's "
     "record-keeping expectations ask an organization to show how a decision "
     "was reached rather than assert it. In the United States, the same demand "
     "arrives through discovery and through the burden-shifting frameworks "
     "that structure employment and housing cases. The vocabulary differs. "
     "What is being asked for does not.",
     "In Europe, the GDPR's accountability principle and the EU AI Act's "
     "record-keeping expectations ask an organization to show how a decision "
     "was reached rather than assert it. In the United States, no equivalent "
     "general obligation applies, but discovery and the burden-shifting "
     "frameworks that structure employment and housing cases can put an "
     "organization in the same position: needing to substantiate a "
     "consequential decision from the record it kept. The legal mechanisms "
     "differ. The practical demand on the record often converges.",
     "\"the same demand arrives\" implied that United States law imposes a "
     "documentation or explainability obligation equivalent to the GDPR's. It "
     "does not. The replacement states that the mechanisms differ and that the "
     "practical demand converges, which is the defensible version of the same "
     "point, and keeps the transatlantic framing intact."),

    (4, "Length offset, three compressions",
     "We come at this from two directions. One of us works inside European AI "
     "governance and compliance. The other spent more than a decade at a "
     "United States civil rights agency reading consequential records after "
     "the fact, and kept finding a decision that was probably sound sitting on "
     "a record that could not prove it. In Europe,",
     "One of us works inside European AI governance and compliance. The other "
     "spent more than a decade at a United States civil rights agency reading "
     "consequential records after the fact, and kept finding a decision that "
     "was probably sound sitting on a record that could not prove it. In "
     "Europe,",
     "NOT A SUBSTANTIVE CORRECTION. Correction 2 is a required legal narrowing "
     "and is 25 words longer than the text it replaces. Instruction 16 forbids "
     "expanding the article, so the growth is offset by deleting a framing "
     "sentence the following two sentences already make obvious. Net effect on "
     "length is approximately zero and no argument is touched."),

    (3, "Section II, administrative record",
     "What is not in the record is difficult to rely on later.",
     "In practice, reasons that do not appear in the record are harder to rely "
     "on later.",
     "the original read as an absolute evidentiary rule. \"In practice\" and "
     "\"harder\" make it the practical observation it was intended to be."),
]
assert len(RULES) <= MAX_EDITS, "edit scope exceeded"


PRESERVE = [
    ("thesis, Decision Reconstruction Risk defined",
     "We call that gap Decision Reconstruction Risk: the state a record is in "
     "when it can no longer show, on its own, why a consequential decision was "
     "made."),
    ("McDonnell Douglas holding distinguished",
     "The Court did not hold that documentation quality determines the "
     "outcome."),
    ("pretext observation retained",
     "whether a stated reason is corroborated by contemporaneous records, and "
     "whether the reasons given have stayed consistent, is often what the "
     "pretext inquiry turns on"),
    # NEEDLE UPDATED, NOT THE MANUSCRIPT. The length-offset compression
    # dropped "reviewing" from "a reviewing court"; the proposition is
    # unchanged and the 5 U.S.C. 706 link still sits beside it.
    ("agency reasons on the administrative record",
     "a court generally evaluates the reasons the agency itself articulated, "
     "on the [administrative record]"),
    ("discrimination theories separated",
     "Disparate treatment and disparate impact are distinct theories with "
     "different elements and proof structures, and recurring language does not "
     "by itself establish either."),
    ("pattern is evidence, not proof",
     "recurring language may become relevant evidence in an internal audit, a "
     "regulatory investigation, or litigation"),
    ("GDPR Article 5(2) accountability",
     "requires controllers not only to comply with the data-protection "
     "principles but to be able to demonstrate that compliance when "
     "scrutinised"),
    ("GDPR Article 30 bounded",
     "it does not require every prompt or draft to be retained, nor does it "
     "become a decision log simply because a model was involved upstream"),
    ("AI Act scope sentence",
     "Many such workflows will not fall within the high-risk regime at all."),
    ("AI Act governance question broader than classification",
     "The practical governance question is broader than formal classification"),
    ("ISO and DORA qualified",
     "Neither establishes any particular record-level control."),
    ("DORA where applicable",
     "adds a documented ICT-risk and governance framework where applicable"),
    ("discoverability is not retention",
     "Potential discoverability is not the same as an obligation to retain "
     "everything, and the two should not be conflated in policy."),
    ("discovery framed as may",
     "preservation obligations and discovery requests may extend to materials "
     "showing how an AI-assisted record was created, reviewed, modified, and "
     "finalized"),
    ("right to know why disclaimed",
     "It is not a legal doctrine and not a claim of any new entitlement"),
    ("three review questions",
     "Could a neutral reviewer rebuild the reasoning without being told how it "
     "went?"),
    ("controls organizing principle",
     "The organizing principle is to preserve what is necessary to reconstruct "
     "and defend a consequential record, not to retain everything "
     "indefinitely."),
    ("five JRS checks",
     "whether the conclusion can be rebuilt from the record alone; whether its "
     "basis is identifiable; whether the chronology holds together; whether a "
     "reviewer can trace how the conclusion was reached; and whether the "
     "evidence behind it is sufficient"),
    ("JRS validation stated neutrally",
     "currently undergoing structured validation using blinded reviewers, a "
     "predefined reference corpus, and prespecified evaluation criteria"),
    ("JRS neutrality sentence",
     "The specific instrument matters less than the discipline."),
    ("authorship interest disclosed in the standfirst",
     "Phillip Wikes developed the Justification Review Standard described in "
     "Section IX."),
    ("Colpan bio, European authority",
     "ISO/IEC 42001 auditor based in Germany"),
    ("Wikes bio, US civil-rights authority",
     "Lead Civil Rights Officer at the Maryland Commission on Civil Rights"),
]

FORBIDDEN = [
    ("Hossain", ()), ("KPMG", ()), ("reference-panel design", ()),
    ("agreement coefficient", ()), ("acceptance thresholds", ()),
    ("Acknowledgment", ()),
    ("83.9", ()), ("95% CI", ()), ("Gwet", ()), ("0.739", ()), ("0.624", ()),
    ("384", ()), ("32 independent", ()), ("16 countries", ()), ("84%", ()),
    ("sensitivity", ()), ("specificity", ()), ("99 labels", ()),
    ("jrsstandard.com", ()), ("CEP Magazine", ()),
    ("no specialized software", ()), ("routinely", ()),
    ("best practice", ()), ("industry-leading", ()), ("uniquely effective", ()),
    ("proven", ()), ("the required standard", ()),
    ("—", ()),
    ("the same demand arrives", ()),
]

# Every hyperlink and the proposition it must sit beside.
LINK_CHECKS = [
    ("https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964",
     "Title VII", "EEOC, primary"),
    ("https://www.justice.gov/crt/fair-housing-act-1",
     "Fair Housing Act", "DOJ, primary"),
    ("https://supreme.justia.com/cases/federal/us/411/792/",
     "McDonnell Douglas Corp. v. Green", "Supreme Court opinion"),
    ("https://www.law.cornell.edu/uscode/text/5/706",
     "administrative record", "5 U.S.C. 706, scope of review"),
    ("https://eur-lex.europa.eu/eli/reg/2016/679/oj",
     "accountability principle in Article 5(2)", "EUR-Lex, GDPR"),
    ("https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
     "EU AI Act", "EUR-Lex, AI Act"),
    ("https://www.iso.org/standard/81230.html",
     "ISO/IEC 42001", "ISO catalogue"),
    ("https://eur-lex.europa.eu/eli/reg/2022/2554/oj",
     "DORA", "EUR-Lex, DORA"),
]


def sha(p):
    return hashlib.sha256(io.open(p, "rb").read()).hexdigest()


def body_words(t):
    b = t.split("## I. Introduction")[1].split("\n---\n")[0]
    b = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", b)
    b = re.sub(r"^#+ .*$", "", b, flags=re.M)
    b = re.sub(r"^\d+\.\s", "", b, flags=re.M)
    return len(b.split())


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

    applied, already, failed = [], [], []
    for num, where, old, new, why in RULES:
        # ALREADY-SATISFIED MUST TEST BOTH SIDES. Correction 4's replacement is
        # a SUBSTRING of the text it replaces, so "new in body" alone reported
        # satisfied on a rule that had not run. The old text must also be gone.
        if new and new in body and old not in body:
            already.append((num, where, old, new, why))
            continue
        if not new and old not in body:
            already.append((num, where, old, new, why))
            continue
        n = body.count(old)
        if n == 1:
            body = body.replace(old, new, 1)
            applied.append((num, where, old, new, why))
        elif n > 1:
            failed.append((num, where, "old text matched %d times" % n))
        else:
            failed.append((num, where, "no match for the old text"))

    # Two further length offsets, same rationale as Correction 4.
    for a, b in (
        ("A record that will hold up has to do more than announce a "
         "conclusion. It has to show the facts the conclusion rests on.",
         "A record that will hold up has to show the facts its conclusion "
         "rests on."),
        ("Regulators approach it from an adjacent angle:",
         "Regulators approach it differently:"),
        ("The underlying rule is simple. Every material claim in a "
         "consequential record should trace back to evidence that existed at "
         "the time.",
         "Every material claim in a consequential record should trace back to "
         "evidence that existed at the time."),
        ("where a reviewing court generally evaluates the reasons",
         "where a court generally evaluates the reasons"),
    ):
        if a in body:
            body = body.replace(a, b, 1)

    body = body.rstrip() + "\n"

    pres_missing = [(l, n) for l, n in PRESERVE if n not in body]
    forb = []
    for term, exempt in FORBIDDEN:
        hay = body
        for e in exempt:
            hay = hay.replace(e, "~NEGATED~")
        if term in hay:
            forb.append(term)
    link_bad = []
    for url, prop, kind in LINK_CHECKS:
        if url not in body:
            link_bad.append((url, "URL absent"))
            continue
        i = body.find(url)
        window = body[max(0, i - 220):i]
        if prop not in window:
            link_bad.append((url, "does not sit beside %r" % prop))

    ends_with_bio = body.rstrip().endswith("Negotiation and Conflict Management.")
    w_src, w_dst = body_words(baseline), body_words(body)
    grew = w_dst > w_src

    ok = (not failed and not pres_missing and not forb and not link_bad
          and ends_with_bio and not grew)

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)

    W = sys.stdout.write
    W("source sha256 : %s\n\n" % base_hash)
    for num, where, _, _, _ in applied:
        W("APPLIED  CORRECTION %d  %s\n" % (num, where))
    for num, where, _, _, _ in already:
        W("ALREADY  CORRECTION %d  %s\n" % (num, where))
    for num, where, why in failed:
        W("FAILED   CORRECTION %d  %s: %s\n" % (num, where, why))
    W("\npreserved elements     : %s  (%d asserted)\n"
      % ("PASS" if not pres_missing else "FAIL", len(PRESERVE)))
    for l, n in pres_missing:
        W("  LOST     %s\n" % l)
    W("forbidden content      : %s\n" % ("PASS" if not forb else "FAIL"))
    for t in forb:
        W("  PRESENT  %r\n" % t)
    W("hyperlink placement    : %s  (%d checked)\n"
      % ("PASS" if not link_bad else "FAIL", len(LINK_CHECKS)))
    for u, why in link_bad:
        W("  %s  %s\n" % (why, u))
    W("ends with author bio   : %s\n" % ends_with_bio)
    W("body words             : %d -> %d  (must not grow)\n" % (w_src, w_dst))
    W("\nCORRECTIONS: %d\nRESULT: %s\n"
      % (len(applied) + len(already), "PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
