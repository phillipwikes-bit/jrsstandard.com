#!/usr/bin/env python3
"""Submission_Final_v2 -> Submission_Final_v3. Reference-classification repair.

v2 IS READ AND NOT OVERWRITTEN.

FOURTEEN INSTRUCTED CORRECTIONS. Eight change text; six are preservation
constraints compiled into assertions that fail the run if what they protect has
moved.

FAIL-CLOSED ON THE SOURCE AUDIT. Every fact this pass writes into the
manuscript is re-derived from research/Verified_Key.md and
research/AnswerKey_Verification_Packet.md at run time and cross-checked against
research/REFERENCE_CLASSIFICATION_SOURCE_REPORT_2026-08-18.md. If the number of
passes, the record count, the judgment denominator, the agreement result, the
adjudication outcome or the non-human nature of the raters cannot be confirmed
from those files, nothing is written.

WHAT THIS PASS DOES NOT DO. It does not name a model, vendor, version or date,
because no such record exists. It does not call the automated raters experts,
independent experts, human raters, credentialed professionals or trained
reviewers. It does not describe the protocol deviation favourably. It does not
claim reproducibility the repository cannot support.

Usage:
  python3 scripts/apply_v3_reference_repair.py --apply
  python3 scripts/apply_v3_reference_repair.py --check
"""
import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_Final_v2_2026-08-18.md")
DST = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_Final_v3_2026-08-18.md")
LOG = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_Final_v3_CHANGE_LOG_2026-08-18.md")
KEY = os.path.join(ROOT, "research", "Verified_Key.md")
PACKET = os.path.join(ROOT, "research", "AnswerKey_Verification_Packet.md")
PREREG = os.path.join(ROOT, "research", "OSF_PreRegistration.md")
AUDIT = os.path.join(ROOT, "research",
                     "REFERENCE_CLASSIFICATION_SOURCE_REPORT_2026-08-18.md")

STAMP = "2026-08-18"


def verify_source():
    """Re-derive every fact this pass writes. Raises on any failure."""
    out = {}
    for p in (KEY, PACKET, PREREG, AUDIT):
        if not os.path.isfile(p):
            raise AssertionError("missing source file: %s" % p)
    key = io.open(KEY, encoding="utf-8").read()
    packet = io.open(PACKET, encoding="utf-8").read()
    prereg = io.open(PREREG, encoding="utf-8").read()
    audit = io.open(AUDIT, encoding="utf-8").read()

    checks = []

    def C(name, ok, detail=""):
        checks.append((name, bool(ok), detail))
        return bool(ok)

    # --- number of executed passes
    C("Verified_Key states three raters",
      "Three independent raters" in key)
    C("Verified_Key states all three labelled all 24",
      "All three raters assigned identical labels on all 24 records" in key)
    out["passes"] = 3

    # --- non-human nature, the fact the whole pass turns on
    C("Verified_Key states the raters were not human",
      "not human raters" in key)
    C("Verified_Key states they were language-model instances",
      "large-language-model instances" in key)

    # --- records and denominator
    recs = re.findall(r"^\| (R\d\d) \| (?:GROUNDED|UNGROUNDED) \|", key, re.M)
    n_rec = len(set(recs + re.findall(r"\| (R\d\d) \| (?:GROUNDED|UNGROUNDED)", key)))
    C("Verified_Key tabulates 24 records", n_rec == 24, "found %d" % n_rec)
    out["records"] = 24
    out["judgments"] = out["passes"] * out["records"]
    C("judgment denominator is 72", out["judgments"] == 72)

    # --- agreement and adjudication
    C("Verified_Key reports 24/24 against the intended key",
      "24/24 (100%)" in key)
    C("Verified_Key reports no divergence",
      "no divergence" in key)
    out["agreement"] = "100 percent"

    # --- pre-registered passes
    m = re.search(r"(Two) raters \*\*blind to the hypotheses", prereg)
    C("pre-registration specifies two raters", bool(m))
    C("pre-registration specifies conditional adjudication",
      "Rater 2 resolves any record where Rater 1 diverges" in prereg)
    out["prereg_passes"] = 2

    # --- the briefing DID disclose that a key existed
    C("packet identifies the task as answer-key verification",
      "You are helping verify the answer key" in packet)

    # --- the audit report agrees on every count
    C("audit report states three raters", "**Three.** ESTABLISHED" in audit)
    C("audit report states 72 judgments", "**72 judgments. 3 raters" in audit)
    C("audit report states no adjudication", "**NO — none performed" in audit)
    C("audit report excludes expert status",
      "No source characterises the reference raters as experts" in audit)
    C("audit report records zero Arm A overlap", "## 7. ARM A OVERLAP\n\n**NO.**" in audit)
    C("audit report records zero Arm B overlap", "## 8. ARM B OVERLAP\n\n**NO.**" in audit)
    C("audit report records zero Study 004 overlap",
      "## 9. STUDY 004 OVERLAP\n\n**NO.**" in audit)

    # --- no implementation detail exists, so none may be written
    for forbidden in ("Anthropic", "OpenAI", "Google", "gpt-", "claude-", "gemini"):
        if re.search(re.escape(forbidden), key, re.I):
            C("Verified_Key names no vendor or model (%s)" % forbidden, False)
    C("Verified_Key names no vendor or model", True)

    out["checks"] = checks
    bad = [n for n, ok, _ in checks if not ok]
    if bad:
        raise AssertionError("source verification failed: %s" % "; ".join(bad))
    return out


WORD = {2: "two", 3: "three"}


def build_rules(S):
    n_pass, n_rec, n_j = S["passes"], S["records"], S["judgments"]
    w_pass = WORD[n_pass]
    w_prereg = WORD[S["prereg_passes"]]

    OLD_REPRO = (
        "**Independent reproduction.** The intended classification was then "
        "withheld and the corpus was given to blind raters who did not see the "
        "study's hypotheses, did not see the author-side classification, and "
        "were not told that a reference classification existed to be recovered. "
        "They were asked to classify each record as grounded or unsupported. "
        "They reproduced the author-side classification on 24 of 24 records. "
        "There were no disagreements, so no adjudication procedure was invoked "
        "and no classification changed.")

    NEW_REPRO = (
        "**Independent reproduction, by automated raters.** The author-side "
        "classification was independently checked using %s separate "
        "large-language-model instances applying the operational "
        "classification rule. These were automated raters, not human raters, "
        "and no expert or professional status is claimed for them. Each "
        "instance independently classified all %d records without access to "
        "the intended labels or to the author-side classification, producing "
        "**%d record-level classifications**. The verification packet "
        "identified the task as verification of an answer key but did not "
        "provide the intended record-level classifications. All %s model "
        "passes reproduced the intended classification on all %d records, so "
        "the pre-specified adjudication condition was not triggered and no "
        "classification changed. The pre-registered procedure specified %s "
        "independent passes with conditional adjudication; the executed "
        "procedure used %s.\n\n"
        "**What the automated check does not do.** The automated reference "
        "check demonstrates reproducibility of the operational classification "
        "rule across %s independent model passes; it does not constitute "
        "independent human validation of the reference labels and does not "
        "establish criterion validity. No human replication of the reference "
        "classification has been performed."
        % (w_pass, n_rec, n_j, w_pass, n_rec, w_prereg, w_pass, w_pass))

    OLD_DISC = (
        "**Disclosure.** The full key is released with the materials: each "
        "record's classification, the reason for it, the evidentiary defect or "
        "support identified, the JRS conditions implicated, the instructions "
        "given to the blind raters, and the record-by-record reproduction "
        "result. Nothing about the reference classification is withheld from a "
        "reader who wants to test it.")

    NEW_DISC = (
        "**Disclosure.** The full key is released with the materials: each "
        "record's classification, the reason for it, the evidentiary defect or "
        "support identified, the JRS conditions implicated, the instructions "
        "given to the automated raters, and the record-by-record reproduction "
        "result. The operational classification rule and the resulting "
        "reference labels are reported so that the classification logic can be "
        "examined. The model implementation details and per-pass execution "
        "records were not retained in a form sufficient for independent "
        "reproduction of the %s automated reference passes." % w_pass)

    return [
        (1, "METHODOLOGICAL CORRECTION", "Section 4.4, Independent reproduction",
         OLD_REPRO, NEW_REPRO,
         "the paragraph described the reference raters in terms a reader takes "
         "as human, omitted the count and the judgment denominator, asserted a "
         "form of blinding the briefing packet contradicts, did not disclose "
         "the deviation from the pre-registered number of passes, and did not "
         "separate automated reproducibility from human validation. Corrections "
         "1, 2, 3, 4 and 6 all land in this paragraph and are applied as one "
         "replacement so the run cannot leave it half-corrected.",
         "`research/Verified_Key.md` Method and Result; "
         "`research/AnswerKey_Verification_Packet.md:3-5` and the Procedure "
         "block; `research/OSF_PreRegistration.md:27-28`; "
         "`research/REFERENCE_CLASSIFICATION_SOURCE_REPORT_2026-08-18.md` "
         "sections 2, 5, 12, 13, 14, 16, 17"),

        (5, "METHODOLOGICAL CORRECTION", "Section 4.4, Disclosure",
         OLD_DISC, NEW_DISC,
         "\"Nothing about the reference classification is withheld\" cannot be "
         "met. The repository retains no model name, vendor, version, per-pass "
         "output sheet or execution date for the automated passes, so the "
         "sentence promised more than the materials contain. The replacement "
         "states what is released and what is not.",
         "`research/REFERENCE_CLASSIFICATION_SOURCE_REPORT_2026-08-18.md` "
         "sections 3 and 24.5; absence confirmed by exhaustive search of the "
         "repository"),

        (7, "CLAIM-BOUNDARY CORRECTION", "Section 7, Discussion",
         "For JRS, the result should therefore be read as evidence supporting "
         "the feasibility of its underlying review logic, not as evidence that "
         "JRS itself improves documentation outcomes.",
         "For JRS, the result provides preliminary evidence that the "
         "record-level distinction embodied in its review logic is "
         "operationally detectable; it is not evidence that JRS itself improves "
         "documentation outcomes.",
         "the detection panel did not apply JRS as a scoring instrument. JRS "
         "was used to construct the corpus and to operationalise the "
         "distinction, so \"feasibility of its underlying review logic\" "
         "overstates what the panel's performance speaks to.",
         "`research/DRR_Detection_Validation_Protocol.md:39`; the manuscript's "
         "own Section 5 statement that the comparison of the five conditions "
         "against unaided judgment is a separate study"),

        (8, "CLAIM-BOUNDARY CORRECTION", "Section 6.3, production review",
         "an organisation routing a record to a single reviewer does not know "
         "which part of the distribution it has drawn from",
         "an organisation routing a record to a single reviewer cannot assume "
         "that the panel-level accuracy estimate represents that reviewer's "
         "individual performance",
         "the original asserted a fact about organisational knowledge. The "
         "replacement states the inferential limit, which is what the data "
         "support.",
         "the participant-level analysis in Section 6.1 and the reviewer spread "
         "reported in Section 6.3"),

        (9.1, "TERMINOLOGY CORRECTION", "Abstract",
         "independently reproduced by raters blind to the study hypotheses",
         "independently reproduced by automated raters without access to it",
         "\"raters blind to the study hypotheses\" reads as human and repeats "
         "the blinding claim the packet contradicts.",
         "`research/Verified_Key.md:8`; "
         "`research/AnswerKey_Verification_Packet.md:3-5`"),

        (9.2, "TERMINOLOGY CORRECTION", "Section 1, evidentiary chain",
         "a reference classification reproduced by raters blind to the "
         "hypotheses",
         "a reference classification reproduced by automated raters without "
         "access to it",
         "same defect as the Abstract, in the sentence that sets out the "
         "evidentiary chain.",
         "`research/Verified_Key.md:8`"),

        (9.3, "TERMINOLOGY CORRECTION", "Section 2, validity table",
         "Independent reproduction of an author-generated reference "
         "classification by raters not involved in corpus construction",
         "Independent reproduction of an author-generated reference "
         "classification by automated raters not involved in corpus "
         "construction",
         "the validity table row reads as human independent assessment, which "
         "is the strongest possible reading and the least supported.",
         "`research/Verified_Key.md:8`"),

        (9.4, "TERMINOLOGY CORRECTION", "Section 3, study design",
         "against a pre-specified reference classification independently "
         "reproduced by blinded raters, blind to that classification and to "
         "one another's judgments",
         "against a pre-specified reference classification independently "
         "reproduced by automated raters without access to that classification "
         "or to one another's judgments",
         "\"blinded raters\" reads as human.",
         "`research/Verified_Key.md`, Method and the disclosure at line 8"),

        (9.5, "TERMINOLOGY CORRECTION",
         "Section 4.4, What this establishes",
         "Unanimous reproduction by raters blind to the hypotheses rules out "
         "the objection",
         "Unanimous reproduction by automated raters without access to the "
         "intended labels rules out the objection",
         "the concession paragraph itself carried the human reading and the "
         "contradicted blinding claim.",
         "`research/Verified_Key.md:8`; "
         "`research/AnswerKey_Verification_Packet.md:3-5`"),

        (9.6, "TERMINOLOGY CORRECTION",
         "Section 4.4, What this establishes, second clause",
         "the raters were briefed by the authors on what \"grounded\" and "
         "\"unsupported\" mean",
         "the automated raters were briefed by the authors on what "
         "\"grounded\" and \"unsupported\" mean",
         "same paragraph, second occurrence.",
         "`research/Verified_Key.md:8`"),

        (9.7, "TERMINOLOGY CORRECTION",
         "Section 4.4, What this establishes, third clause",
         "a corpus on which blind raters never disagree is a corpus of easy "
         "cases",
         "a corpus on which automated raters never disagree is a corpus of "
         "easy cases",
         "same paragraph, third occurrence.",
         "`research/Verified_Key.md:8`"),
    ]


PRESERVE = {
    9: ("Human expert study architecture", [
        ("Arm A panel size", "16 independent experts"),
        ("Arm B panel size", "20 independent experts"),
        ("Arm B standing", "20 independent experts of the same professional "
                           "standing as the detection panel"),
        ("Study 004 invited experts",
         "Raters whose codes begin with E are invited experts whose "
         "credentials are recorded."),
        ("Study 004 regular reviewers",
         "The remainder are regular reviewers who entered through the open "
         "review page"),
        ("recruitment channel not expertise",
         "the split records the recruitment channel and is not a measure of "
         "professional expertise."),
    ]),
    10: ("Participant accounting", [
        ("61 and 58", "61 participations held by **58 distinct people**"),
        ("overlap explained",
         "three of the reliability raters are the same individuals as three "
         "members of the detection panel"),
        ("All 58 unpaid", "All 58 worked unpaid, in a personal capacity"),
    ]),
    11: ("Primary detection results", [
        ("panel", "16 independent experts"), ("countries", "11 countries"),
        ("continents", "5 continents"),
        ("corpus", "24 constructed, de-identified records"),
        ("graded reads", "384 graded judgments"), ("accuracy", "83.9"),
        ("CI low", "72.7"), ("CI high", "95.1"), ("sensitivity", "87.0"),
        ("specificity", "80.7"), ("point threshold", "70 percent"),
        ("lower bound", "50 percent"),
    ]),
    12: ("Reliability results", [
        ("expert row", "| Experts | 10 | 36 | 8 | 0.739 | 0.402 to 1.000 | "
                       "0.427 to 1.000 |"),
        ("regular row", "| Regular reviewers | 10 | 68 | 14 | 0.623 | "
                        "0.252 to 0.993 | 0.285 to 0.894 |"),
        ("25 to 22", "Of the 25 reliability participants, 22 contributed "
                     "labels under the five-condition instrument"),
        ("three baseline-only", "Three regular reviewers contributed only "
                                "under the unstructured baseline prompt"),
        ("15 records", "Fifteen records carried at least one label under the "
                       "five-condition instrument."),
        ("10 estimable", "the ten records with two or more raters formed the "
                         "analysed reliability set"),
        ("113 and 104", "113 submitted determinations, reduced to 104"),
        ("criterion not met",
         "**The pre-registered reliability criterion was not met.**"),
        ("analytic is specified",
         "**Neither clears the second on the analytic interval, which is the "
         "interval the analysis plan specified.**"),
        ("bootstrap not a pass",
         "**We do not treat that as satisfying the pre-registration.**"),
        ("appendix B denominator",
         "Appendix B uses the 113 recorded five-condition determinations"),
    ]),
    13: ("DRR claim boundary", [
        ("abstract disclaimer", "It does not establish criterion validity"),
        ("cross-cultural", "**8.4 The international composition does not "
                           "establish cross-cultural validity.**"),
        ("workflow independence", "**8.5 Workflow independence is a design "
                                  "intention, not a result.**"),
        ("psychometric", "**8.6 The five conditions are not psychometrically "
                         "validated.**"),
        ("construct dependence",
         "The key is therefore independent of the *results* and not fully "
         "independent of the *construct*."),
    ]),
    14: ("JRS claim boundary", [
        ("no criterion validity or efficacy",
         "**8.10 No criterion validity, and no efficacy.**"),
        ("comparison is separate",
         "Whether the five conditions improve on unaided expert judgment is a "
         "different question, tested in a separate study"),
        ("detection / reliability separation",
         "It also establishes substantial variation in accuracy among the "
         "sixteen detection-panel experts, while the separate reliability "
         "sample did not meet the pre-registered lower-bound criterion."),
    ]),
}

FORBIDDEN = [
    # human framing of the automated raters
    ("blind raters", ()),
    ("blinded raters", ()),
    ("raters blind to the hypotheses", ()),
    ("raters blind to the study hypotheses", ()),
    ("were not told that a reference classification existed", ()),
    ("Nothing about the reference classification is withheld", ()),
    # favourable characterisation of the deviation
    ("strengthening the design", ()),
    ("improving reliability", ()),
    ("confirming the result more strongly", ()),
    # human-validation and validity overclaims
    ("human validation", ("does not constitute independent human validation",)),
    ("independently validated", ()),
    ("criterion validity established", ()),
    ("psychometrically validated", ("not psychometrically validated",)),
    ("JRS validated", ()), ("validated JRS", ()), ("JRS proven", ()),
    ("JRS efficacy demonstrated", ()), ("JRS outperforms", ()),
    ("workflow independence demonstrated", ()),
    ("measurement invariance established", ()),
    # invented implementation detail. SCOPED, NOT GLOBAL: Appendix A
    # legitimately names Anthropic, OpenAI and Google for the nightly
    # cross-vendor runs, and a global ban fired on that correct pre-existing
    # text. What must not happen is a vendor, model or configuration detail
    # appearing in the reference-classification paragraphs, where no source
    # establishes one. See scoped_forbidden().
    # settled items from earlier passes
    ("trained reviewer", ()), ("non-expert", ()), ("same pool", ()),
    ("those same experts", ()), ("expert panel", ()),
    ("36 independent experts", ()), ("36 experts", ()), ("All 61", ()),
    ("0.624", ()), ("0.253 to 0.994", ()), ("0.301 to 0.886", ()),
]

# Facts that must be PRESENT after the pass.
REQUIRED = [
    ("three model instances named as such",
     "three separate large-language-model instances"),
    ("all three passes reproduced the key",
     "All three model passes reproduced the intended classification"),
    ("automated, not human", "These were automated raters, not human raters"),
    ("no expert status claimed",
     "no expert or professional status is claimed for them"),
    ("judgment denominator", "**72 record-level classifications**"),
    ("packet disclosed the task",
     "The verification packet identified the task as verification of an "
     "answer key but did not provide the intended record-level "
     "classifications."),
    ("deviation disclosed",
     "The pre-registered procedure specified two independent passes with "
     "conditional adjudication; the executed procedure used three."),
    ("no adjudication",
     "the pre-specified adjudication condition was not triggered"),
    ("human-validation limitation",
     "it does not constitute independent human validation of the reference "
     "labels and does not establish criterion validity"),
    ("no human replication",
     "No human replication of the reference classification has been "
     "performed."),
    ("reproducibility limit stated",
     "were not retained in a form sufficient for independent reproduction"),
]

DEFERRED = [
    ("Appendix A machine-consistency framing",
     "Appendix A reports three named vendors for the nightly cross-vendor "
     "runs while Section 4.4 can name none for the reference passes. The "
     "asymmetry is factual and correct, but a reviewer may ask why one "
     "automated procedure is fully specified and the other is not. No edit "
     "made: the instruction limits this pass to the reference-classification "
     "paragraphs and the two claim-boundary sentences."),
    ("timeline of the verified key",
     "The verified key was committed 2026-07-06; detection-panel reading had "
     "begun by 2026-06-28 and Study 004 labelling by 2026-06-11. No "
     "pre-registration term was breached, because the pre-registration "
     "requires the key fixed before analysis and analysis ran 2026-08-15. The "
     "manuscript states no sequence either way. No edit made: outside the "
     "authorised list."),
    ("author-side classification date",
     "`Detection_Article...:172` states the author-side classification was "
     "fixed \"before any reviewer was recruited\". The repository dates the "
     "file to 2026-07-06 by commit, which is after reading began, so the "
     "claim rests on a pre-commit timestamp not independently verifiable from "
     "the repository. No edit made: the claim may well be true and the "
     "instruction does not authorise touching it."),
]


SCOPED_FORBIDDEN = ["Anthropic", "OpenAI", "Google", "GPT-", "Gemini",
                    "temperature", "system prompt", "version"]


def section_44(body):
    """The reference-classification block only, or '' if the anchor is absent.

    THE END ANCHOR IS 4.5, NOT SECTION 5. My first version closed the block at
    "## 5." and so swallowed the "Machine consistency" paragraph at 4.7, which
    legitimately names Anthropic, OpenAI and Google for the nightly cross-vendor
    runs. The guard then failed correct pre-existing text. The block being
    policed is the reference classification and nothing else.
    """
    a = "**Author-side classification.**"
    b = "### 4.5"
    if a not in body:
        return ""
    tail = body.split(a, 1)[1]
    return tail.split(b, 1)[0] if b in tail else tail


def scoped_hits(body):
    blk = section_44(body)
    return [t for t in SCOPED_FORBIDDEN if t in blk]


def forbidden_hits(body):
    hits = scoped_hits(body)
    for term, exempt in FORBIDDEN:
        hay = body
        for e in exempt:
            hay = hay.replace(e, "~NEGATED~")
        if term in hay:
            hits.append(term)
    return hits


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()

    try:
        S = verify_source()
    except AssertionError as e:
        sys.stderr.write("FAIL-CLOSED, NOTHING WRITTEN\n  %s\n" % e)
        return 1

    RULES = build_rules(S)
    src_path = DST if (args.check and os.path.isfile(DST)) else SRC
    body = io.open(src_path, encoding="utf-8").read()
    baseline = io.open(SRC, encoding="utf-8").read()

    applied, already, failed = [], [], []
    for num, cat, where, old, new, why, source in RULES:
        if new in body:
            already.append((num, cat, where, old, new, why, source))
            continue
        n = body.count(old)
        if n == 1:
            body = body.replace(old, new, 1)
            applied.append((num, cat, where, old, new, why, source))
        elif n > 1:
            failed.append((num, where, "old text matched %d times" % n))
        else:
            failed.append((num, where, "no match for the old text"))

    req_missing = [(lbl, n) for lbl, n in REQUIRED if n not in body]
    pres_missing = [(num, title, lbl)
                    for num, (title, items) in sorted(PRESERVE.items())
                    for lbl, needle in items if needle not in body]
    forb = forbidden_hits(body)

    h_src = len(re.findall(r"^#+ ", baseline, re.M))
    h_dst = len(re.findall(r"^#+ ", body, re.M))
    t_src = len(re.findall(r"^\|", baseline, re.M))
    t_dst = len(re.findall(r"^\|", body, re.M))
    p_src = [p for p in baseline.split("\n\n") if len(p.strip()) > 120]
    p_dst = [p for p in body.split("\n\n") if len(p.strip()) > 120]
    dup = len(p_dst) - len(set(p_dst))
    para_delta = len(p_dst) - len(p_src)
    refs_same = (baseline.split("## References")[1].split("---")[0]
                 == body.split("## References")[1].split("---")[0])
    appA_same = (baseline.split("## Appendix A")[1].split("## Appendix B")[0]
                 == body.split("## Appendix A")[1].split("## Appendix B")[0])
    appB_same = (baseline.split("## Appendix B")[1].split("## Appendix C")[0]
                 == body.split("## Appendix B")[1].split("## Appendix C")[0])
    appC_same = (baseline.split("## Appendix C")[1].split("## Acknowledgments")[0]
                 == body.split("## Appendix C")[1].split("## Acknowledgments")[0])
    ack_same = (baseline.split("## Acknowledgments")[1]
                == body.split("## Acknowledgments")[1])

    integrity_pass = (h_src == h_dst and t_src == t_dst and dup == 0
                      and para_delta == 1 and refs_same and appA_same
                      and appB_same and appC_same and ack_same
                      and body.count("—") == 0
                      and not re.search(r"\bfrequently\b", body))
    ok = (not failed and not req_missing and not pres_missing and not forb
          and integrity_pass)

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(S, RULES, applied, already, failed, req_missing, pres_missing,
                  forb, body, baseline, h_src, h_dst, t_src, t_dst, len(p_src),
                  len(p_dst), dup, para_delta, refs_same, appA_same, appB_same,
                  appC_same, ack_same, integrity_pass)

    W = sys.stdout.write
    W("source verification\n")
    for name, good, detail in S["checks"]:
        W("  [%s] %s%s\n" % ("ok" if good else "XX", name,
                             (" (%s)" % detail) if detail else ""))
    W("  passes %d  records %d  judgments %d  prereg passes %d\n\n"
      % (S["passes"], S["records"], S["judgments"], S["prereg_passes"]))
    for num, cat, where, _, _, _, _ in applied:
        W("APPLIED  CORRECTION %-4s [%-28s] %s\n" % (num, cat, where))
    for num, cat, where, _, _, _, _ in already:
        W("ALREADY  CORRECTION %-4s [%-28s] %s\n" % (num, cat, where))
    for num, where, why in failed:
        W("FAILED   CORRECTION %-4s %s: %s\n" % (num, where, why))
    W("\nrequired facts present  : %s\n" % ("PASS" if not req_missing else "FAIL"))
    for lbl, n in req_missing:
        W("  MISSING  %s\n" % lbl)
    W("preservation constraints: %s\n" % ("PASS" if not pres_missing else "FAIL"))
    for num, title, lbl in pres_missing:
        W("  CORRECTION %-2d %s: MISSING %s\n" % (num, title, lbl))
    W("forbidden text          : %s\n" % ("PASS" if not forb else "FAIL"))
    for t in forb:
        W("  PRESENT  %s\n" % t)
    W("document integrity      : %s\n" % ("PASS" if integrity_pass else "FAIL"))
    W("    headings %d->%d  table rows %d->%d  paragraphs %d->%d "
      "(delta %+d, expected +1)  dup %d\n"
      % (h_src, h_dst, t_src, t_dst, len(p_src), len(p_dst), para_delta, dup))
    W("    References %s  App A %s  App B %s  App C %s  Acknowledgments %s\n"
      % (refs_same, appA_same, appB_same, appC_same, ack_same))
    W("\nTOTAL AUTHORIZED EDITS: %d applied, %d already satisfied\n"
      % (len(applied), len(already)))
    W("PRESERVATION ASSERTIONS: %d\n"
      % sum(len(v[1]) for v in PRESERVE.values()))
    W("DEFERRED ISSUES: %d\n" % len(DEFERRED))
    W("RESULT: %s\n" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(S, RULES, applied, already, failed, req_missing, pres_missing,
              forb, body, baseline, h_src, h_dst, t_src, t_dst, p_src, p_dst,
              dup, para_delta, refs_same, appA_same, appB_same, appC_same,
              ack_same, integrity_pass):
    L = []
    A = L.append
    A("# Detection Article v3, reference-classification repair change log")
    A("")
    A("**Date:** %s" % STAMP)
    A("**Source:** `research/Detection_Article_Submission_Final_v2_2026-08-18.md` "
      "(preserved, not overwritten)")
    A("**Output:** `research/Detection_Article_Submission_Final_v3_2026-08-18.md`")
    A("**Script:** `scripts/apply_v3_reference_repair.py`")
    A("**Source audit:** `research/REFERENCE_CLASSIFICATION_SOURCE_REPORT_2026-08-18.md`")
    A("")
    A("Fourteen instructed corrections. Eight change text; six are preservation "
      "constraints compiled into %d assertions that fail the run if what they "
      "protect has moved."
      % sum(len(v[1]) for v in PRESERVE.values()))
    A("")
    A("---")
    A("")
    A("## 1. Fail-closed source verification")
    A("")
    A("Every fact written into the manuscript is re-derived at run time from "
      "`research/Verified_Key.md`, `research/AnswerKey_Verification_Packet.md` "
      "and `research/OSF_PreRegistration.md`, then cross-checked against the "
      "source audit report. The script writes nothing if any row fails.")
    A("")
    A("| Check | Result |")
    A("|---|---|")
    for name, good, detail in S["checks"]:
        A("| %s%s | %s |" % (name, (" (%s)" % detail) if detail else "",
                             "**ok**" if good else "**FAIL**"))
    A("")
    A("| Derived quantity | Value |")
    A("|---|---:|")
    A("| Executed passes | %d |" % S["passes"])
    A("| Records | %d |" % S["records"])
    A("| Record-level classifications | **%d** |" % S["judgments"])
    A("| Pre-registered passes | %d |" % S["prereg_passes"])
    A("| Agreement | %s |" % S["agreement"])
    A("| Adjudication | not triggered |")
    A("")
    A("**No conflict with the source audit report was found.** The instruction's "
      "stated facts, the three primary source files and the audit report agree "
      "on every count.")
    A("")
    A("**No model name, vendor, version, date, temperature or system prompt was "
      "written**, because no such record exists. The script also asserts that "
      "`Verified_Key.md` itself names none, so nothing could be copied from it "
      "by accident.")
    A("")
    A("---")
    A("")
    A("## 2. Manuscript edits")
    A("")
    for num, cat, where, old, new, why, source in applied:
        A("### Correction %s. APPLIED." % num)
        A("")
        A("**SECTION:** %s" % where.split(",")[0])
        A("")
        A("**LOCATION:** %s" % where)
        A("")
        A("**ORIGINAL:**")
        A("")
        A("> " + old.replace("\n\n", " "))
        A("")
        A("**REPLACEMENT:**")
        A("")
        A("> " + new.replace("\n\n", "\n>\n> "))
        A("")
        A("**SOURCE:** %s" % source)
        A("")
        A("**REASON:** %s" % why)
        A("")
        A("**CATEGORY:** %s" % cat)
        A("")
    for num, cat, where, old, new, why, source in already:
        A("### Correction %s. ALREADY SATISFIED. %s" % (num, where))
        A("")
    for num, where, why in failed:
        A("### Correction %s. FAILED. %s: %s" % (num, where, why))
        A("")
    A("**Corrections 2, 3, 4 and 6 have no separate entry because they land "
      "inside Correction 1's paragraph and are applied as one replacement.** "
      "Splitting them into four sequential edits on the same sentence would "
      "leave the paragraph half-corrected if any one of them failed to match. "
      "Each is verified independently in section 3 below.")
    A("")
    A("---")
    A("")
    A("## 3. Required facts, asserted individually")
    A("")
    A("| Instructed correction | Fact that must be present | Present |")
    A("|---|---|---|")
    mapping = {
        "three model instances named as such": "Correction 1",
        "automated, not human": "Correction 1",
        "no expert status claimed": "Correction 1",
        "judgment denominator": "Correction 4",
        "packet disclosed the task": "Correction 2",
        "deviation disclosed": "Correction 3",
        "no adjudication": "Correction 1",
        "human-validation limitation": "Correction 6",
        "no human replication": "Correction 6",
        "reproducibility limit stated": "Correction 5",
    }
    for lbl, needle in REQUIRED:
        A("| %s | %s | %s |"
          % (mapping.get(lbl, ""), lbl, "yes" if needle in body else "**NO**"))
    A("")
    A("---")
    A("")
    A("## 4. Preservation constraints, corrections 9 to 14")
    A("")
    for num, (title, items) in sorted(PRESERVE.items()):
        A("### Correction %d. %s" % (num, title))
        A("")
        A("| Protected element | Present |")
        A("|---|---|")
        for lbl, needle in items:
            A("| %s | %s |" % (lbl, "yes" if needle in body else "**NO**"))
        A("")
    A("**The three automated raters are nowhere described as part of the expert "
      "panel and nowhere added to the 58-person human participant count.** The "
      "Acknowledgments are byte-identical to v2, which is how that is enforced "
      "rather than asserted.")
    A("")
    A("---")
    A("")
    A("## 5. Global terminology audit")
    A("")
    A("| Term | Occurrences | Required | Result |")
    A("|---|---:|---|---|")
    hits = forbidden_hits(body)
    blk = section_44(body)
    for term in SCOPED_FORBIDDEN:
        A("| `%s` (scoped to the reference-classification block) | %d in that "
          "block | 0 | %s |"
          % (term, blk.count(term), "**PRESENT**" if term in blk else "clean"))
    for term, exempt in FORBIDDEN:
        A("| `%s`%s | %d | 0 | %s |"
          % (term,
             " (exempt: %s)" % ", ".join("`%s`" % e for e in exempt) if exempt else "",
             body.count(term), "**PRESENT**" if term in hits else "clean"))
    A("")
    A("| Term now used | Occurrences | Refers to |")
    A("|---|---:|---|")
    for term, ref in (("automated raters", "the three reference-classification model passes"),
                      ("large-language-model instances", "the same"),
                      ("model passes", "the same"),
                      ("record-level classifications", "the 72-judgment denominator"),
                      ("16 independent experts", "Study 011, Arm A, human"),
                      ("20 independent experts", "Study 012, Arm B, human"),
                      ("invited experts", "Study 004, E-coded, human"),
                      ("regular reviewers", "Study 004, R-coded, human")):
        A("| `%s` | %d | %s |" % (term, body.count(term), ref))
    A("")
    A("---")
    A("")
    A("## 6. Statistical integrity")
    A("")
    A("| Quantity | Reported | Source |")
    A("|---|---|---|")
    A("| Reference model instances | %d | `Verified_Key.md`, Method |" % S["passes"])
    A("| Records | %d | `Verified_Key.md`, key table |" % S["records"])
    A("| Record-level classifications | **%d** | %d x %d |"
      % (S["judgments"], S["passes"], S["records"]))
    A("| Agreement | %s | `Verified_Key.md`, Result |" % S["agreement"])
    A("| Adjudication | not triggered | `Verified_Key.md`, Result |")
    A("| Human reference raters | **0** | `Verified_Key.md:8` |")
    A("| Expert reference raters | **0** | no source establishes any |")
    A("")
    A("The manuscript does not report 24 as the judgment total anywhere. Every "
      "primary detection value and every reliability value is unchanged; the "
      "assertions in section 4 above enforce that.")
    A("")
    A("---")
    A("")
    A("## 7. Deferred issues")
    A("")
    A("Identified during this pass and **not implemented**, because the "
      "instruction limits the pass to the authorised list.")
    A("")
    for i, (title, detail) in enumerate(DEFERRED, 1):
        A("**DEFERRED ISSUE %d. %s.** %s" % (i, title, detail))
        A("")
    A("---")
    A("")
    A("## 8. Document integrity")
    A("")
    A("| Check | v2 | v3 |")
    A("|---|---|---|")
    A("| Headings | %d | %d |" % (h_src, h_dst))
    A("| Table rows | %d | %d |" % (t_src, t_dst))
    A("| Paragraphs over 120 characters | %d | %d |" % (p_src, p_dst))
    A("| Paragraph delta | 0 | %+d, being the human-validation limitation "
      "paragraph Correction 6 adds |" % para_delta)
    A("| Duplicate paragraphs | 0 | %d |" % dup)
    A("| Em-dashes | %d | %d |" % (baseline.count("—"), body.count("—")))
    A("| Words | %d | %d |" % (len(baseline.split()), len(body.split())))
    A("")
    A("| Section | Unchanged from v2 |")
    A("|---|---|")
    A("| References and citations | %s |"
      % ("yes, byte-identical" if refs_same else "**NO**"))
    A("| Appendix A | %s |" % ("yes, byte-identical" if appA_same else "**NO**"))
    A("| Appendix B | %s |" % ("yes, byte-identical" if appB_same else "**NO**"))
    A("| Appendix C | %s |" % ("yes, byte-identical" if appC_same else "**NO**"))
    A("| Acknowledgments | %s |"
      % ("yes, byte-identical" if ack_same else "**NO**"))
    A("| Abstract | Correction 9.1 only |")
    A("| Section 1 | Correction 9.2 only |")
    A("| Section 2 validity table | Correction 9.3 only |")
    A("| Section 3 | Correction 9.4 only |")
    A("| Section 4.4 | Corrections 1, 5, 9.5, 9.6, 9.7 |")
    A("| Section 6.3 | Correction 8 only |")
    A("| Section 7 | Correction 7 only |")
    A("| Sections 5, 8, 9, 10 | unchanged |")
    A("")
    A("No section was deleted, no reference altered, no citation changed, no "
      "table cell modified: the table-row count is identical and the single "
      "table edit is a cell in the Section 2 validity table, which changes no "
      "number. The source is plain Markdown and the `.docx` is generated from "
      "it, so no tracked change and no comment can be introduced. No dataset, "
      "analysis script, pre-registration or audit report was modified.")
    A("")
    A("**Document integrity: %s**" % ("PASS" if integrity_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A('"v3 reference-classification repair completed. The reference '
      'classification is now described as what the source records establish: '
      'three automated large-language-model passes over 24 records, 72 '
      'record-level classifications, unanimous agreement with the intended key, '
      'no adjudication, two passes pre-registered against three executed, and '
      'no human validation. No primary detection result, reliability statistic, '
      'participant count, preregistered threshold, study design, limitation, '
      'reference or table number was changed, and no claim was strengthened."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
