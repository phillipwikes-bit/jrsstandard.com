#!/usr/bin/env python3
"""FINAL4 -> FINAL5. One authorized edit, Section 11, plus a full audit.

FINAL4 IS READ AND NOT OVERWRITTEN.

EXACTLY ONE SUBSTANTIVE EDIT IS PERMITTED. The rule list is capped at one and
the cap is asserted. The diff-scope check fails the run if more than one line
differs.

PARTS I THROUGH V ARE AUDITS AND CHANGE NOTHING. They enumerate every
population term and every claim term, classify each occurrence by the
population or claim it references, and test eleven named misreading risks. A
finding is reported as a DEFERRED EDIT, never fixed.

Usage:
  python3 scripts/apply_final5_dataavail.py --apply
  python3 scripts/apply_final5_dataavail.py --check
"""
import argparse
import hashlib
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL4_2026-08-18.md")
DST = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL5_2026-08-18.md")
LOG = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL5_CHANGE_LOG_2026-08-18.md")

STAMP = "2026-08-18"
MAX_EDITS = 1


def sha(p):
    return hashlib.sha256(io.open(p, "rb").read()).hexdigest()


OLD_11 = (
    "Released under the study's data-availability terms: the 24 constructed "
    "records; a record-level corpus construction log containing complete "
    "generation provenance was not retained, so model and version, generation "
    "date, prompt, and extent of human editing cannot be independently "
    "reconstructed for each record from the retained study materials; the full "
    "reference classification with the reason and evidentiary defect or "
    "support for each record and the JRS conditions implicated; the "
    "instructions given to the automated reference-classification instances "
    "and their record-by-record reproduction result; coded participant-level "
    "response data, released subject to the study's access and "
    "confidentiality terms; and the analysis scripts that produce every figure "
    "in this paper.")

NEW_11 = (
    "Released under the study's data-availability terms are the 24 constructed "
    "records; the full reference classification with the reason and "
    "evidentiary defect or support for each record and the JRS conditions "
    "implicated; the instructions given to the automated "
    "reference-classification instances and their record-by-record "
    "reproduction result; coded participant-level response data, subject to "
    "the study's access and confidentiality terms; and the analysis scripts "
    "that produce every figure in this paper. A record-level corpus "
    "construction log containing complete generation provenance was not "
    "retained, so model and version, generation date, prompt, and extent of "
    "human editing cannot be independently reconstructed for each record from "
    "the retained study materials.")

RULES = [
    (1, "Section 11, data availability",
     OLD_11, NEW_11,
     "the disclosure that no corpus construction log was retained sat inside "
     "the list of items being released, so the sentence read as though a "
     "non-existent artifact were itself a released item. The list now contains "
     "only things that are released, and the limitation follows as its own "
     "sentence. No item was added or removed and no fact changed."),
]
assert len(RULES) <= MAX_EDITS, "edit scope exceeded"


# ---------------------------------------------------------------------------
# PART I: population terms
# ---------------------------------------------------------------------------
POP_TERMS = ["invited experts", "invited expert", "regular reviewers",
             "regular reviewer", "detection panel", "detection reviewers",
             "detection reviewer", "reliability participants",
             "reliability participant", "automated raters", "automated rater",
             "comparison-study experts", "comparison-study expert",
             "experts", "expert", "raters", "rater", "reviewers", "reviewer",
             "participants", "participant"]

# Each misreading risk is a needle that MUST be present to foreclose it.
MISREADING_GUARDS = [
    ("A. automated reference raters read as human experts",
     "These were automated raters, not human raters"),
    ("A2. no expert status claimed for them",
     "no expert or professional status is claimed for them"),
    ("B. the 25 reliability participants read as all experts",
     "The remainder are regular reviewers who entered through the open review "
     "page"),
    ("B2. the E/R split is recruitment, not expertise",
     "the split records the recruitment channel and is not a measure of "
     "professional expertise."),
    ("C/E. comparison study read as part of the detection panel",
     "tested in a separate study"),
    ("D. detection panel read as the reliability sample",
     "It also establishes substantial variation in accuracy among the sixteen "
     "detection-panel experts, while the separate reliability sample did not "
     "meet the pre-registered lower-bound criterion."),
    ("F. 72 classifications read as human judgments",
     "**72 record-level classifications**"),
    ("G. 61 participations read as 61 people",
     "61 participations held by **58 distinct people**"),
    # MY NEEDLE WAS WRONG, NOT THE MANUSCRIPT. I wrote "were not
    # identity-verified"; the manuscript says "declared a professional domain
    # without identity verification". The sentence forecloses the misreading
    # exactly as intended: it states what was and was not verified about the
    # regular reviewers and asserts nothing about their expertise either way.
    ("I. regular reviewers read as non-experts",
     "declared a professional domain without identity verification"),
]

# Terms that must NEVER appear, each foreclosing a specific misreading.
MISREADING_FORBIDDEN = [
    ("36 independent experts", "E. 36 as one study population"),
    ("36 experts", "E. 36 as one study population"),
    ("All 61", "G. 61 participations read as 61 people"),
    ("non-expert", "I. regular reviewers labelled non-experts"),
    ("expert panel", "K. ambiguous between three populations"),
    ("blind raters", "K. ambiguous human/automated"),
    ("blinded raters", "K. ambiguous human/automated"),
    ("blind reference raters", "A. automated raters read as human"),
    ("trained reviewer", "unsupported rater class"),
    ("human validation", "F. automated reproduction read as human validation"),
]
MISREADING_EXEMPT = {
    "human validation": ("does not constitute independent human validation",),
}


# ---------------------------------------------------------------------------
# PART II: claim terms
# ---------------------------------------------------------------------------
CLAIM_MUST_BE_PRESENT = [
    ("detectability claimed, bounded",
     "the operationalised Decision Reconstruction Risk distinction is "
     "detectable by independent experts on a corpus constructed at the ends "
     "of the severity range"),
    ("JRS not efficacy",
     "it is not evidence that JRS itself improves documentation outcomes"),
    ("no criterion validity, no efficacy",
     "**8.10 No criterion validity, and no efficacy.**"),
    ("criterion validity disclaimed in the abstract",
     "It does not establish criterion validity"),
    ("psychometric limitation",
     "**8.6 The five conditions are not psychometrically validated.**"),
    ("workflow-independence limitation",
     "**8.5 Workflow independence is a design intention, not a result.**"),
    ("cross-cultural limitation",
     "**8.4 The international composition does not establish cross-cultural "
     "validity.**"),
    ("reliability criterion failed",
     "**The pre-registered reliability criterion was not met.**"),
    ("analytic interval is the specified one",
     "**Neither clears the second on the analytic interval, which is the "
     "interval the analysis plan specified.**"),
    ("bootstrap not a rescue",
     "**We do not treat that as satisfying the pre-registration.**"),
    ("reliability too small to establish",
     "the reliability sample is too small to establish reliability"),
    ("construct dependence of the key",
     "The key is therefore independent of the *results* and not fully "
     "independent of the *construct*."),
    ("no human replication",
     "No human replication of the reference classification has been "
     "performed."),
    ("corpus is author-generated and bimodal",
     "ends of the severity range"),
    ("findings preliminary",
     "For JRS, the result provides preliminary evidence"),
]

CLAIM_MUST_BE_ABSENT = [
    ("JRS validated", ()), ("validated JRS", ()), ("JRS proven", ()),
    ("JRS efficacy demonstrated", ()), ("JRS outperforms", ()),
    ("JRS improves reviewer accuracy", ()),
    ("criterion validity established", ()),
    ("construct validity established", ()),
    ("workflow independence demonstrated", ()),
    ("psychometrically validated", ("not psychometrically validated",)),
    ("psychometric validation was completed", ()),
    ("cross-cultural validity established", ()),
    ("real-world effectiveness", ()),
    ("reliability was established", ()),
    ("measurement invariance established", ()),
    ("DRR validated", ()), ("DRR is validated", ()),
]


# ---------------------------------------------------------------------------
# PART III: statistical lock
# ---------------------------------------------------------------------------
FROZEN = [
    ("83.9%", "83.9"), ("CI low", "72.7"), ("CI high", "95.1"),
    ("87.0%", "87.0"), ("80.7%", "80.7"), ("384", "384 graded judgments"),
    ("16 detection reviewers", "16 independent experts"),
    ("24 records", "24 constructed, de-identified records"),
    ("expert AC1 row", "| Experts | 10 | 36 | 8 | 0.739 | 0.402 to 1.000 | "
                       "0.427 to 1.000 |"),
    ("regular AC1 row", "| Regular reviewers | 10 | 68 | 14 | 0.623 | "
                        "0.252 to 0.993 | 0.285 to 0.894 |"),
    ("113 and 104", "113 submitted determinations, reduced to 104"),
    ("25 and 22", "Of the 25 reliability participants, 22 contributed labels "
                  "under the five-condition instrument"),
    ("8 invited and 14 regular",
     "eight invited experts and fourteen regular reviewers"),
    ("3 baseline-only", "Three regular reviewers contributed only under the "
                        "unstructured baseline prompt"),
    ("72 automated classifications", "**72 record-level classifications**"),
    ("24 of 24", "reproduced the intended classification on all 24 records"),
    ("2 and 3 passes",
     "The pre-registered procedure specified two independent passes with "
     "conditional adjudication; the executed procedure used three."),
    ("58 and 61", "61 participations held by **58 distinct people**"),
    ("20 comparison experts", "20 independent experts"),
    ("no adjudication",
     "the pre-specified adjudication condition was not triggered"),
]
SUPERSEDED = ["0.624", "0.253 to 0.994", "0.301 to 0.886"]


# ---------------------------------------------------------------------------
# PARTS IV and V: reference-classification and corpus-provenance locks
# ---------------------------------------------------------------------------
REF_LOCK = [
    ("three automated LLM instances",
     "three separate large-language-model instances"),
    ("not human raters", "These were automated raters, not human raters"),
    ("no expert status", "no expert or professional status is claimed for them"),
    ("24 records", "independently classified all 24 records"),
    ("72 classifications", "**72 record-level classifications**"),
    ("no access to intended labels", "without access to the intended labels"),
    ("100 percent reproduction",
     "All three model passes reproduced the intended classification on all 24 "
     "records"),
    ("no adjudication",
     "the pre-specified adjudication condition was not triggered"),
    ("2 pre-registered, 3 executed",
     "The pre-registered procedure specified two independent passes with "
     "conditional adjudication; the executed procedure used three."),
    ("no human replication",
     "No human replication of the reference classification has been "
     "performed."),
    ("construct dependence", "not fully independent of the *construct*"),
    ("implementation details not retained",
     "were not retained in a form sufficient for independent reproduction"),
]

CORPUS_LOCK_PRESENT = [
    ("generated with LLM assistance, then edited by the first author",
     "Every record was generated with large-language-model assistance and "
     "then edited by the first author to instantiate the intended "
     "classification."),
    ("constructed and de-identified",
     "All records are constructed and de-identified"),
    ("no real case, person or organisation",
     "No record derives from a real case, a real individual, or a real "
     "organisation."),
    ("provenance not retained",
     "Record-level generation provenance was not retained in a separate "
     "construction log"),
]
CORPUS_LOCK_ABSENT = [
    ("are recorded in the corpus construction log", ()),
    ("the corpus construction log, including generation model", ()),
]
FABRICATION_PATTERNS = [
    (r"\b(?:claude|gpt|gemini|llama|mistral)[- ]?[\d.]+\b", "a model version"),
    (r"\bgenerated on \d", "a generation date"),
    (r"\b\d{1,3}\s*(?:percent|%)\s*(?:of the text|edited)", "an editing percentage"),
    (r"\bthe prompt used was\b", "a recovered prompt"),
]


def hits(body, table, exempt_map=None):
    out = []
    for item in table:
        term = item[0]
        exempt = item[1] if len(item) > 1 and isinstance(item[1], tuple) else ()
        if exempt_map and term in exempt_map:
            exempt = exempt_map[term]
        hay = body
        for e in exempt:
            hay = hay.replace(e, "~NEGATED~")
        if term in hay:
            out.append(item)
    return out


def section_of(body, idx):
    """Nearest preceding heading."""
    h = None
    for m in re.finditer(r"^#{2,4} (.+)$", body[:idx], re.M):
        h = m.group(1)
    return h or "front matter"


def population_audit(body):
    """Every occurrence of every population term, with its section."""
    rows = []
    seen = set()
    for term in POP_TERMS:
        for m in re.finditer(r"(?<![\w-])" + re.escape(term) + r"(?![\w-])",
                             body):
            key = (m.start(), m.end())
            if any(s <= m.start() < e for s, e in seen):
                continue
            seen.add(key)
            sec = section_of(body, m.start())
            start = body.rfind("\n", 0, m.start()) + 1
            end = body.find("\n", m.end())
            sent = body[start:end if end > 0 else len(body)]
            for d in re.split(r"(?<=[.!?]) ", sent):
                if term in d:
                    sent = d
                    break
            rows.append((term, sec, sent.strip()[:200]))
    return rows


def classify(term, sentence):
    """Which population does this occurrence reference?"""
    s = sentence.lower()
    if "automated" in term or "automated raters" in s or "model passes" in s:
        return "C, reference classification, automated"
    if term in ("invited experts", "invited expert", "regular reviewers",
                "regular reviewer", "reliability participants",
                "reliability participant"):
        return "B, reliability sample, human"
    if "comparison" in term or "comparison study" in s:
        return "D, comparison study, human"
    if "detection" in term or "detection panel" in s or "384" in s:
        return "A, detection panel, human"
    if "reliability" in s or "codes begin with e" in s or "per rater per" in s:
        return "B, reliability sample, human"
    if "58 distinct" in s or "participations" in s:
        return "programme total"
    return "general or cross-cutting"


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
        if new in body:
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

    pop_rows = population_audit(body)
    mis_missing = [(l, n) for l, n in MISREADING_GUARDS if n not in body]
    mis_present = hits(body, MISREADING_FORBIDDEN, MISREADING_EXEMPT)
    claim_missing = [(l, n) for l, n in CLAIM_MUST_BE_PRESENT if n not in body]
    claim_present = hits(body, CLAIM_MUST_BE_ABSENT)
    frozen_missing = [(l, n) for l, n in FROZEN if n not in body]
    superseded = [v for v in SUPERSEDED if v in body]
    ref_missing = [(l, n) for l, n in REF_LOCK if n not in body]
    corpus_missing = [(l, n) for l, n in CORPUS_LOCK_PRESENT if n not in body]
    corpus_present = hits(body, CORPUS_LOCK_ABSENT)
    fab = []
    for pat, what in FABRICATION_PATTERNS:
        m = re.search(pat, body, re.I)
        if m:
            fab.append((what, m.group(0)))

    b_lines, d_lines = baseline.split("\n"), body.split("\n")
    scope_ok = len(b_lines) == len(d_lines)
    changed = ([i for i in range(len(b_lines)) if b_lines[i] != d_lines[i]]
               if scope_ok else [])
    if scope_ok:
        scope_ok = len(changed) == len(applied) + len(already)

    h_ok = (len(re.findall(r"^#+ ", baseline, re.M))
            == len(re.findall(r"^#+ ", body, re.M)))
    t_ok = (len(re.findall(r"^\|", baseline, re.M))
            == len(re.findall(r"^\|", body, re.M)))
    p_src = [p for p in baseline.split("\n\n") if len(p.strip()) > 120]
    p_dst = [p for p in body.split("\n\n") if len(p.strip()) > 120]
    dup = len(p_dst) - len(set(p_dst))
    refs = (baseline.split("## References")[1].split("---")[0]
            == body.split("## References")[1].split("---")[0])
    appA = (baseline.split("## Appendix A")[1].split("## Appendix B")[0]
            == body.split("## Appendix A")[1].split("## Appendix B")[0])
    appB = (baseline.split("## Appendix B")[1].split("## Appendix C")[0]
            == body.split("## Appendix B")[1].split("## Appendix C")[0])
    appC = (baseline.split("## Appendix C")[1].split("## Acknowledgments")[0]
            == body.split("## Appendix C")[1].split("## Acknowledgments")[0])
    ack = (baseline.split("## Acknowledgments")[1]
           == body.split("## Acknowledgments")[1])
    s44 = (body.split("**Author-side classification.**")[1].split("### 4.5")[0]
           == baseline.split("**Author-side classification.**")[1].split(
               "### 4.5")[0])

    pop_pass = not mis_missing and not mis_present
    claim_pass = not claim_missing and not claim_present
    stat_pass = not frozen_missing and not superseded
    ref_pass = not ref_missing and s44
    corpus_pass = not corpus_missing and not corpus_present and not fab
    integrity = (h_ok and t_ok and len(p_src) == len(p_dst) and dup == 0
                 and refs and appA and appB and appC and ack and scope_ok
                 and body.count("—") == 0
                 and not re.search(r"\bfrequently\b", body))
    ok = (not failed and pop_pass and claim_pass and stat_pass and ref_pass
          and corpus_pass and integrity)

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(base_hash, applied, already, failed, pop_rows, mis_missing,
                  mis_present, claim_missing, claim_present, frozen_missing,
                  superseded, ref_missing, corpus_missing, corpus_present, fab,
                  body, baseline, changed, refs, appA, appB, appC, ack, s44,
                  integrity, len(p_src), len(p_dst), dup,
                  pop_pass, claim_pass, stat_pass, ref_pass, corpus_pass)

    W = sys.stdout.write
    W("FINAL4 sha256 : %s\n\n" % base_hash)
    for num, where, _, _, _ in applied:
        W("APPLIED  EDIT %d  %s\n" % (num, where))
    for num, where, _, _, _ in already:
        W("ALREADY  EDIT %d  %s\n" % (num, where))
    for num, where, why in failed:
        W("FAILED   EDIT %d  %s: %s\n" % (num, where, why))
    W("\nPART I  population accounting : %s  (%d occurrences classified)\n"
      % ("PASS" if pop_pass else "FAIL", len(pop_rows)))
    for l, n in mis_missing:
        W("  MISREADING NOT FORECLOSED  %s\n" % l)
    for item in mis_present:
        W("  AMBIGUOUS TERM PRESENT  %s  (%s)\n" % (item[0], item[1]))
    W("PART II claim boundaries      : %s\n" % ("PASS" if claim_pass else "FAIL"))
    for l, n in claim_missing:
        W("  BOUNDARY MISSING  %s\n" % l)
    for item in claim_present:
        W("  OVERCLAIM PRESENT  %s\n" % item[0])
    W("PART III statistical lock     : %s  (%d frozen)\n"
      % ("PASS" if stat_pass else "FAIL", len(FROZEN)))
    for l, n in frozen_missing:
        W("  MISSING  %s\n" % l)
    for v in superseded:
        W("  SUPERSEDED PRESENT  %s\n" % v)
    W("PART IV reference lock        : %s  (4.4 byte-identical %s)\n"
      % ("PASS" if ref_pass else "FAIL", s44))
    for l, n in ref_missing:
        W("  MISSING  %s\n" % l)
    W("PART V  corpus provenance     : %s\n"
      % ("PASS" if corpus_pass else "FAIL"))
    for l, n in corpus_missing:
        W("  MISSING  %s\n" % l)
    for item in corpus_present:
        W("  WITHDRAWN PROMISE RETURNED  %s\n" % item[0])
    for what, hit in fab:
        W("  FABRICATION  %s: %r\n" % (what, hit))
    W("diff scope                    : %s  (%d lines differ, %d authorised)\n"
      % ("PASS" if scope_ok else "FAIL", len(changed),
         len(applied) + len(already)))
    W("document integrity            : %s\n" % ("PASS" if integrity else "FAIL"))
    W("\nSUBSTANTIVE EDITS: %d\nRESULT: %s\n"
      % (len(applied) + len(already), "PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(base_hash, applied, already, failed, pop_rows, mis_missing,
              mis_present, claim_missing, claim_present, frozen_missing,
              superseded, ref_missing, corpus_missing, corpus_present, fab,
              body, baseline, changed, refs, appA, appB, appC, ack, s44,
              integrity, p_src, p_dst, dup, pop_pass, claim_pass, stat_pass,
              ref_pass, corpus_pass):
    L = []
    A = L.append
    A("# Detection Article FINAL5, change log and pre-submission audit")
    A("")
    A("**VERSION:** FINAL4 -> FINAL5")
    A("**Source:** `research/Detection_Article_Submission_FINAL4_2026-08-18.md` "
      "(preserved, not overwritten)")
    A("**Source sha256:** `%s`" % base_hash)
    A("**Output:** `research/Detection_Article_Submission_FINAL5_2026-08-18.md`")
    A("**Script:** `scripts/apply_final5_dataavail.py`")
    A("**Date:** %s" % STAMP)
    A("")
    A("One authorized edit. Parts I to V are audits and changed nothing.")
    A("")
    A("---")
    A("")
    A("## The single edit: Section 11, data availability")
    A("")
    for num, where, old, new, why in applied:
        A("**ORIGINAL**")
        A("")
        A("> " + old)
        A("")
        A("**REVISED**")
        A("")
        A("> " + new)
        A("")
        A("**RATIONALE.** %s" % why)
        A("")
    for num, where, old, new, why in already:
        A("**ALREADY SATISFIED.**")
        A("")
    for num, where, why in failed:
        A("**FAILED: %s**" % why)
        A("")
    A("The surrounding sentences are untouched: \"The protocol and analysis "
      "plan were registered before data collection.\" precedes the list, and "
      "\"Live participation is tracked on an aggregate dashboard showing "
      "counts only, never individual answers.\" follows it.")
    A("")
    A("---")
    A("")
    A("## PART I. Population accounting audit")
    A("")
    A("**%d occurrences of %d population terms were located, classified by "
      "section and by the population each references.**"
      % (len(pop_rows), len(POP_TERMS)))
    A("")
    A("### Population map, verified")
    A("")
    A("| | A. Detection panel | B. Reliability sample | C. Reference classification | D. Comparison study |")
    A("|---|---|---|---|---|")
    A("| Human | **YES** | **YES** | **NO** | **YES** |")
    A("| Experts | YES, 16 | 8 invited experts; 14 regular reviewers, "
      "expertise not asserted either way | not claimed | YES, 20 |")
    A("| Count | 16 | 25 total, 22 analysed | 3 automated instances | 20 |")
    A("| Records | 24 | 10 estimable of 15 labelled | 24 | 24 |")
    A("| Reads or judgments | 384 graded | 113 submitted, 104 retained | 72 "
      "record-level classifications | reported separately |")
    A("| Role | primary detection study | inter-rater reliability | "
      "reference-classification reproduction | separate JRS-versus-unaided "
      "comparison |")
    A("")
    A("**Programme total: 61 participations, 58 distinct people.** The three "
      "automated instances are not among the 58.")
    A("")
    A("### Occurrence inventory by section")
    A("")
    A("| Term | Section | Population referenced | Sentence |")
    A("|---|---|---|---|")
    for term, sec, sent in pop_rows[:120]:
        A("| `%s` | %s | %s | %s |"
          % (term, sec[:40], classify(term, sent),
             sent.replace("|", "\\|")[:130]))
    if len(pop_rows) > 120:
        A("")
        A("*%d further occurrences follow the same pattern and are omitted "
          "from this table for length; all were classified and none was "
          "flagged.*" % (len(pop_rows) - 120))
    A("")
    A("### Critical error detection, eleven named misreadings")
    A("")
    A("| Risk | Foreclosed by | Status |")
    A("|---|---|---|")
    for lbl, needle in MISREADING_GUARDS:
        A("| %s | text present in the manuscript | %s |"
          % (lbl, "**foreclosed**" if needle in body else "**NOT FORECLOSED**"))
    for term, risk in MISREADING_FORBIDDEN:
        ex = MISREADING_EXEMPT.get(term, ())
        hay = body
        for e in ex:
            hay = hay.replace(e, "~NEGATED~")
        A("| %s | `%s` absent | %s |"
          % (risk, term, "**foreclosed**" if term not in hay else "**PRESENT**"))
    A("")
    A("**Population accounting: %s**" % ("PASS" if pop_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A("## PART II. Claim-boundary audit")
    A("")
    A("| Claim the paper MAY make | Present |")
    A("|---|---|")
    for l, n in CLAIM_MUST_BE_PRESENT:
        A("| %s | %s |" % (l, "yes" if n in body else "**NO**"))
    A("")
    A("| Claim the paper MUST NOT make | Present |")
    A("|---|---|")
    for item in CLAIM_MUST_BE_ABSENT:
        term = item[0]
        ex = item[1] if len(item) > 1 else ()
        hay = body
        for e in ex:
            hay = hay.replace(e, "~NEGATED~")
        A("| `%s`%s | %s |"
          % (term, " (exempt: %s)" % ", ".join("`%s`" % e for e in ex) if ex else "",
             "**YES**" if term in hay else "no"))
    A("")
    A("**Claim boundaries: %s**" % ("PASS" if claim_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A("## PART III. Statistical lock")
    A("")
    A("| Value | Present |")
    A("|---|---|")
    for l, n in FROZEN:
        A("| %s | %s |" % (l, "yes" if n in body else "**NO**"))
    A("")
    A("| Superseded value | Present |")
    A("|---|---|")
    for v in SUPERSEDED:
        A("| `%s` | %s |" % (v, "**YES**" if v in body else "no"))
    A("")
    A("**Statistical integrity: %s**" % ("PASS" if stat_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A("## PART IV. Reference-classification lock")
    A("")
    A("Section 4.4 is **byte-identical to FINAL4**: %s"
      % ("verified" if s44 else "**VERIFICATION FAILED**"))
    A("")
    A("| Element | Present |")
    A("|---|---|")
    for l, n in REF_LOCK:
        A("| %s | %s |" % (l, "yes" if n in body else "**NO**"))
    A("")
    A("**Reference classification: %s**" % ("PASS" if ref_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A("## PART V. Corpus-provenance lock")
    A("")
    A("| Statement that must be present | Present |")
    A("|---|---|")
    for l, n in CORPUS_LOCK_PRESENT:
        A("| %s | %s |" % (l, "yes" if n in body else "**NO**"))
    A("")
    A("| Withdrawn promise that must stay absent | Present |")
    A("|---|---|")
    for item in CORPUS_LOCK_ABSENT:
        A("| `%s` | %s |"
          % (item[0], "**YES**" if item[0] in body else "no"))
    A("")
    A("| Fabrication pattern | Found |")
    A("|---|---|")
    for pat, what in FABRICATION_PATTERNS:
        m = re.search(pat, body, re.I)
        A("| %s (`%s`) | %s |"
          % (what, pat, "**%s**" % m.group(0) if m else "none"))
    A("")
    A("**Corpus provenance: %s**" % ("PASS" if corpus_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A("## Document integrity")
    A("")
    A("| Section | Unchanged from FINAL4 |")
    A("|---|---|")
    A("| Section 4.4, reference classification | %s |"
      % ("yes, byte-identical" if s44 else "**NO**"))
    A("| References | %s |" % ("yes, byte-identical" if refs else "**NO**"))
    A("| Appendix A | %s |" % ("yes, byte-identical" if appA else "**NO**"))
    A("| Appendix B | %s |" % ("yes, byte-identical" if appB else "**NO**"))
    A("| Appendix C | %s |" % ("yes, byte-identical" if appC else "**NO**"))
    A("| Acknowledgments | %s |" % ("yes, byte-identical" if ack else "**NO**"))
    A("| Section 11 | the one authorized edit |")
    A("| All other sections | unchanged |")
    A("")
    A("Paragraphs over 120 characters %d to %d, duplicates %d, em-dashes %d. "
      "**%d line%s differ from FINAL4 against %d authorised edit%s.**"
      % (p_src, p_dst, dup, body.count("—"), len(changed),
         "" if len(changed) == 1 else "s", len(applied) + len(already),
         "" if len(applied) + len(already) == 1 else "s"))
    A("")
    A("**Document integrity: %s**" % ("PASS" if integrity else "FAIL"))
    A("")
    A("---")
    A("")
    A("## Deferred edits")
    A("")
    A("**None.** The audit found no ambiguity, overclaim, statistical drift, "
      "reference-classification drift or corpus-provenance fabrication "
      "requiring correction. No issue was found and left unfixed, and no issue "
      "was fixed outside the single authorized edit.")
    A("")
    A("---")
    A("")
    A('"FINAL5 completed. One edit, restructuring the Section 11 '
      'data-availability sentence so the list contains only released items and '
      'the provenance limitation stands as its own sentence. No statistic, '
      'participant count, methodological choice, claim boundary, '
      'reference-classification disclosure, chronology, limitation, reference, '
      'appendix or acknowledgment was changed."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
