#!/usr/bin/env python3
"""FINAL3 -> FINAL4. Corpus-generation provenance disclosure. Two edits.

FINAL3 IS READ AND NOT OVERWRITTEN.

THE AUTHOR HAS CONFIRMED that the 24 records were created through Claude and
that no separate corpus construction log was retained, in the repository or
outside it. The manuscript promised a record-level provenance artifact it
cannot supply. This pass removes the promise and discloses the limitation.

NOTHING IS RECONSTRUCTED. No prompt, date, model version or editing extent is
written, inferred from git, recovered from memory, or estimated. A guard below
fails the run if any such value appears in either edited location.

THE PROVENANCE STATEMENT THAT SURVIVES IS THE ONE ALREADY ESTABLISHED IN THE
MANUSCRIPT: that every record was generated with large-language-model
assistance and then edited by the first author. That sentence is Section 4.2's
own text, is untouched by this pass, and is not a per-record claim.

SCOPE IS CAPPED AT TWO. A third rule trips an assertion.

Usage:
  python3 scripts/apply_final4_provenance.py --apply
  python3 scripts/apply_final4_provenance.py --check
"""
import argparse
import hashlib
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL3_2026-08-18.md")
DST = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL4_2026-08-18.md")
LOG = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL4_CHANGE_LOG_2026-08-18.md")

STAMP = "2026-08-18"
MAX_EDITS = 2


def sha(p):
    return hashlib.sha256(io.open(p, "rb").read()).hexdigest()


OLD_43 = ("The generation prompts, the model and version used for each record, "
          "the generation dates, and the extent of human editing per record "
          "are recorded in the corpus construction log, which is part of the "
          "materials released under the data-availability terms in Section 11.")

NEW_43 = ("Record-level generation provenance was not retained in a separate "
          "construction log sufficient to reconstruct the generation process "
          "for each record, including model and version, generation date, "
          "prompt, and extent of human editing.")

OLD_11 = ("Released under the study's data-availability terms: the 24 "
          "constructed records; the corpus construction log, including "
          "generation model, version, date, prompt, and extent of human "
          "editing per record;")

NEW_11 = ("Released under the study's data-availability terms: the 24 "
          "constructed records; a record-level corpus construction log "
          "containing complete generation provenance was not retained, so "
          "model and version, generation date, prompt, and extent of human "
          "editing cannot be independently reconstructed for each record from "
          "the retained study materials;")

RULES = [
    (1, "Section 4.3, corpus construction provenance", OLD_43, NEW_43,
     "The manuscript previously represented that a complete corpus "
     "construction log existed and was available for release. The author has "
     "confirmed that no such log was retained. The statement was therefore "
     "corrected to disclose the actual provenance limitation."),
    (2, "Section 11, data availability", OLD_11, NEW_11,
     "The data-availability statement was corrected so the manuscript does "
     "not promise a provenance artifact that cannot be supplied."),
]
assert len(RULES) <= MAX_EDITS, "edit scope exceeded"


# ---------------------------------------------------------------------------
# NO-RECONSTRUCTION GUARD. Nothing resembling fabricated provenance may appear
# in either edited location.
# ---------------------------------------------------------------------------
FABRICATION_PATTERNS = [
    (r"\b(?:claude|gpt|gemini|llama|mistral)[- ]?[\d.]+", "a model version"),
    (r"\bgenerated on \d", "a generation date"),
    (r"\b20\d\d-\d\d-\d\d\b", "a date stamp"),
    (r"\b\d{1,3}\s*(?:percent|%)\s*(?:of the text|edited|human)", "an editing percentage"),
    (r"\bprompt was\b", "a recovered prompt"),
    (r"\bthe prompt used was\b", "a recovered prompt"),
    (r"\bapproximately \d+\s*(?:percent|%)", "an estimated proportion"),
]


def edited_regions(body):
    """The two corrected sentences plus surrounding context, for the guard."""
    out = []
    for needle in (NEW_43, NEW_11):
        i = body.find(needle)
        if i >= 0:
            out.append(body[max(0, i - 400):i + len(needle) + 400])
    return out


REQUIRED = [
    ("4.3 discloses the limitation", NEW_43),
    ("11 discloses the limitation", NEW_11),
    ("4.2 provenance sentence survives unchanged",
     "Every record was generated with large-language-model assistance and "
     "then edited by the first author to instantiate the intended "
     "classification."),
    ("24 records still released", "the 24 constructed records;"),
]

FORBIDDEN = [
    ("are recorded in the corpus construction log", ()),
    ("the corpus construction log, including generation model", ()),
    ("0.624", ()), ("0.253 to 0.994", ()), ("0.301 to 0.886", ()),
    ("36 independent experts", ()), ("All 61", ()),
    ("blind raters", ()), ("blinded raters", ()),
    ("blind reference raters", ()), ("trained reviewer", ()),
    ("non-expert", ()), ("expert panel", ()), ("same pool", ()),
    ("fixed before recruitment", ()),
    ("Before any reviewer was recruited", ()),
    ("human validation", ("does not constitute independent human validation",)),
    ("JRS validated", ()), ("validated JRS", ()), ("JRS proven", ()),
    ("JRS efficacy demonstrated", ()), ("JRS outperforms", ()),
    ("criterion validity established", ()),
    ("psychometrically validated", ("not psychometrically validated",)),
    ("workflow independence demonstrated", ()),
    ("measurement invariance established", ()),
]

FROZEN = [
    ("accuracy", "83.9"), ("CI low", "72.7"), ("CI high", "95.1"),
    ("sensitivity", "87.0"), ("specificity", "80.7"),
    ("graded reads", "384 graded judgments"),
    ("detection panel", "16 independent experts"),
    ("comparison panel", "20 independent experts"),
    ("corpus", "24 constructed, de-identified records"),
    ("grounded half", "12 grounded"),
    ("unsupported half", "12 are unsupported"),
    ("expert row", "| Experts | 10 | 36 | 8 | 0.739 | 0.402 to 1.000 | "
                   "0.427 to 1.000 |"),
    ("regular row", "| Regular reviewers | 10 | 68 | 14 | 0.623 | "
                    "0.252 to 0.993 | 0.285 to 0.894 |"),
    ("113 and 104", "113 submitted determinations, reduced to 104"),
    ("25 and 22", "Of the 25 reliability participants, 22 contributed labels "
                  "under the five-condition instrument"),
    ("three baseline-only", "Three regular reviewers contributed only under "
                            "the unstructured baseline prompt"),
    ("58 and 61", "61 participations held by **58 distinct people**"),
    ("three instances", "three separate large-language-model instances"),
    ("automated not human", "These were automated raters, not human raters"),
    ("72 judgments", "**72 record-level classifications**"),
    ("24 of 24", "reproduced the intended classification on all 24 records"),
    ("no adjudication",
     "the pre-specified adjudication condition was not triggered"),
    ("2 vs 3 passes",
     "The pre-registered procedure specified two independent passes with "
     "conditional adjudication; the executed procedure used three."),
    ("no human validation",
     "does not constitute independent human validation of the reference "
     "labels and does not establish criterion validity"),
    ("no human replication",
     "No human replication of the reference classification has been "
     "performed."),
    ("reference reproducibility limit",
     "were not retained in a form sufficient for independent reproduction"),
    ("chronology, Abstract",
     "reference classification fixed before independent verification"),
    ("chronology, Methods",
     "**Author-side classification.** Before verification began,"),
    ("novelty qualified",
     "It is that, to our knowledge, reconstructability of the individual "
     "record has not been operationalised"),
    ("JRS boundary", "it is not evidence that JRS itself improves "
                     "documentation outcomes"),
    ("no criterion validity or efficacy",
     "**8.10 No criterion validity, and no efficacy.**"),
    ("construct dependence", "The key is therefore independent of the "
                             "*results* and not fully independent of the "
                             "*construct*."),
    ("reliability criterion failed",
     "**The pre-registered reliability criterion was not met.**"),
    ("bootstrap not a pass",
     "**We do not treat that as satisfying the pre-registration.**"),
    ("psychometric limitation",
     "**8.6 The five conditions are not psychometrically validated.**"),
    ("workflow limitation",
     "**8.5 Workflow independence is a design intention, not a result.**"),
    ("automated instances in Section 11",
     "the instructions given to the automated reference-classification "
     "instances"),
    ("automated raters in Section 9",
     "by automated raters not involved in corpus construction"),
]


def forbidden_hits(body):
    hits = []
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

    fab = []
    for region in edited_regions(body):
        for pat, what in FABRICATION_PATTERNS:
            m = re.search(pat, region, re.I)
            if m:
                fab.append((what, m.group(0)))
    req_missing = [(l, n) for l, n in REQUIRED if n not in body]
    frozen_missing = [(l, n) for l, n in FROZEN if n not in body]
    forb = forbidden_hits(body)

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
    s44 = ("**Author-side classification.**" in body
           and body.split("**Author-side classification.**")[1].split(
               "### 4.5")[0]
           == baseline.split("**Author-side classification.**")[1].split(
               "### 4.5")[0])

    integrity = (h_ok and t_ok and len(p_src) == len(p_dst) and dup == 0
                 and refs and appA and appB and appC and ack and s44
                 and scope_ok and body.count("—") == 0
                 and not re.search(r"\bfrequently\b", body))
    ok = (not failed and not fab and not req_missing and not frozen_missing
          and not forb and integrity)

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(base_hash, applied, already, failed, fab, req_missing,
                  frozen_missing, forb, body, baseline, changed, refs, appA,
                  appB, appC, ack, s44, integrity, scope_ok, len(p_src),
                  len(p_dst), dup)

    W = sys.stdout.write
    W("FINAL3 sha256 : %s\n\n" % base_hash)
    for num, where, _, _, _ in applied:
        W("APPLIED  EDIT %d  %s\n" % (num, where))
    for num, where, _, _, _ in already:
        W("ALREADY  EDIT %d  %s\n" % (num, where))
    for num, where, why in failed:
        W("FAILED   EDIT %d  %s: %s\n" % (num, where, why))
    W("\nno-reconstruction guard  : %s\n" % ("PASS" if not fab else "FAIL"))
    for what, hit in fab:
        W("  FABRICATED %s: %r\n" % (what, hit))
    W("required disclosures     : %s\n"
      % ("PASS" if not req_missing else "FAIL"))
    for l, n in req_missing:
        W("  MISSING  %s\n" % l)
    W("frozen values            : %s  (%d checked)\n"
      % ("PASS" if not frozen_missing else "FAIL", len(FROZEN)))
    for l, n in frozen_missing:
        W("  MISSING  %s\n" % l)
    W("forbidden text           : %s\n" % ("PASS" if not forb else "FAIL"))
    for t in forb:
        W("  PRESENT  %s\n" % t)
    W("Section 4.4 byte-identical: %s\n" % s44)
    W("diff scope               : %s  (%d lines differ, %d authorised)\n"
      % ("PASS" if scope_ok else "FAIL", len(changed),
         len(applied) + len(already)))
    W("document integrity       : %s\n" % ("PASS" if integrity else "FAIL"))
    W("\nSUBSTANTIVE EDITS: %d\nRESULT: %s\n"
      % (len(applied) + len(already), "PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(base_hash, applied, already, failed, fab, req_missing,
              frozen_missing, forb, body, baseline, changed, refs, appA, appB,
              appC, ack, s44, integrity, scope_ok, p_src, p_dst, dup):
    L = []
    A = L.append
    A("# Detection Article FINAL4, change log")
    A("")
    A("**VERSION:** FINAL3 -> FINAL4")
    A("**Source:** `research/Detection_Article_Submission_FINAL3_2026-08-18.md` "
      "(preserved, not overwritten)")
    A("**Source sha256:** `%s`" % base_hash)
    A("**Output:** `research/Detection_Article_Submission_FINAL4_2026-08-18.md`")
    A("**Script:** `scripts/apply_final4_provenance.py`")
    A("**Date:** %s" % STAMP)
    A("")
    A("**Authority.** The author has confirmed that the 24 records were "
      "created through Claude and that no separate corpus construction log was "
      "retained, in this repository or outside it. The manuscript promised a "
      "record-level provenance artifact that cannot be supplied.")
    A("")
    A("---")
    A("")
    for num, where, old, new, why in applied:
        A("## EDIT %d: %s" % (num, where.split(",")[0]))
        A("")
        A("**Location.** %s" % where)
        A("")
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
        A("---")
        A("")
    for num, where, old, new, why in already:
        A("## EDIT %d: %s. ALREADY SATISFIED." % (num, where))
        A("")
    for num, where, why in failed:
        A("## EDIT %d: %s. FAILED: %s" % (num, where, why))
        A("")
    A("## Nothing was reconstructed")
    A("")
    A("No prompt, generation date, model version or editing extent was "
      "written, inferred from git history, recovered from memory, or "
      "estimated. No synthetic provenance table was created and no "
      "retrospective log was produced.")
    A("")
    A("A pattern guard runs over both edited regions and their surrounding "
      "context and fails the run on any of the following:")
    A("")
    A("| Pattern | Would indicate |")
    A("|---|---|")
    for pat, what in FABRICATION_PATTERNS:
        A("| `%s` | %s |" % (pat, what))
    A("")
    A("**Result: %s.**" % ("clean, nothing fabricated" if not fab else "FAIL"))
    A("")
    A("**What survives, because it was already established.** Section 4.2 "
      "states that every record was generated with large-language-model "
      "assistance and then edited by the first author to instantiate the "
      "intended classification. That sentence is untouched by this pass. It "
      "is a statement about the corpus as a whole and makes no per-record "
      "claim, so it remains supportable while the per-record log does not "
      "exist.")
    A("")
    A("---")
    A("")
    A("## What this correction does and does not mean")
    A("")
    A("| | |")
    A("|---|---|")
    A("| The corpus is unaffected | 24 records, 12 grounded and 12 "
      "unsupported, unchanged |")
    A("| The detection result is unaffected | 16 experts, 384 graded reads, "
      "83.9 percent, CI 72.7 to 95.1, unchanged |")
    A("| The reliability result is unaffected | unchanged, including the "
      "failed pre-registered criterion |")
    A("| The limitation concerns | reproducibility of the record-generation "
      "history |")
    A("| The limitation does not concern | the participant observations or "
      "any reported statistic |")
    A("")
    A("**This is a disclosure correction, not a data defect.** Nothing about "
      "the missing generation log bears on what sixteen experts judged, or on "
      "what they judged it against.")
    A("")
    A("---")
    A("")
    A("## Corpus generation is not reference classification")
    A("")
    A("The two procedures remain separate and the Section 4.4 "
      "reference-classification disclosure is **byte-identical to FINAL3**: %s"
      % ("verified" if s44 else "**VERIFICATION FAILED**"))
    A("")
    A("| Element | Status |")
    A("|---|---|")
    A("| three automated LLM instances | unchanged |")
    A("| 72 record-level classifications | unchanged |")
    A("| 100 percent agreement, 24 of 24 | unchanged |")
    A("| no adjudication triggered | unchanged |")
    A("| two pre-registered passes, three executed | unchanged |")
    A("| absence of human validation | unchanged |")
    A("| reference-pass execution metadata not retained | unchanged |")
    A("")
    A("The two provenance gaps are separate facts about separate procedures "
      "and are disclosed separately. Neither was merged into the other.")
    A("")
    A("---")
    A("")
    A("## CONFIRMATIONS")
    A("")
    A("| Confirmation | Value |")
    A("|---|---|")
    A("| Statistics unchanged | **YES** |")
    A("| Participant counts unchanged | **YES** |")
    A("| Methodology unchanged | **YES** |")
    A("| JRS claims unchanged | **YES** |")
    A("| DRR claims unchanged | **YES** |")
    A("| Reference-classification architecture unchanged | **YES** |")
    A("| Chronology unchanged | **YES** |")
    A("| Novelty statement unchanged | **YES** |")
    A("| Unauthorized edits | **0** |")
    A("| Guard failures | recorded in the execution report |")
    A("| Zero-drift failures | recorded in the execution report |")
    A("")
    A("### Frozen values, asserted individually")
    A("")
    A("| Protected value | Present |")
    A("|---|---|")
    for l, n in FROZEN:
        A("| %s | %s |" % (l, "yes" if n in body else "**NO**"))
    A("")
    A("### Phrasing that must be absent")
    A("")
    A("| Term | Present |")
    A("|---|---|")
    hits = forbidden_hits(body)
    for term, exempt in FORBIDDEN:
        A("| `%s`%s | %s |"
          % (term,
             " (exempt: %s)" % ", ".join("`%s`" % e for e in exempt) if exempt else "",
             "**YES**" if term in hits else "no"))
    A("")
    A("---")
    A("")
    A("## Document integrity")
    A("")
    A("| Section | Unchanged from FINAL3 |")
    A("|---|---|")
    A("| Section 4.4, reference classification | %s |"
      % ("yes, byte-identical" if s44 else "**NO**"))
    A("| References | %s |" % ("yes, byte-identical" if refs else "**NO**"))
    A("| Appendix A | %s |" % ("yes, byte-identical" if appA else "**NO**"))
    A("| Appendix B | %s |" % ("yes, byte-identical" if appB else "**NO**"))
    A("| Appendix C | %s |" % ("yes, byte-identical" if appC else "**NO**"))
    A("| Acknowledgments | %s |" % ("yes, byte-identical" if ack else "**NO**"))
    A("| Abstract | unchanged |")
    A("| Section 4.3 | Edit 1 only |")
    A("| Section 11 | Edit 2 only |")
    A("| All other sections | unchanged |")
    A("")
    A("Paragraphs over 120 characters %d to %d, duplicates %d, em-dashes %d. "
      "**%d line%s differ from FINAL3 against %d authorised edit%s**; the "
      "script fails if those numbers disagree, so no reflow, reference "
      "reordering or formatting drift can enter unnoticed."
      % (p_src, p_dst, dup, body.count("—"), len(changed),
         "" if len(changed) == 1 else "s", len(applied) + len(already),
         "" if len(applied) + len(already) == 1 else "s"))
    A("")
    A("**Document integrity: %s**" % ("PASS" if integrity else "FAIL"))
    A("")
    A("---")
    A("")
    A('"FINAL4 completed. Two edits, both removing an unsupported promise of '
      'record-level generation provenance and replacing it with an accurate '
      'disclosure of the limitation. Nothing was reconstructed. No statistic, '
      'participant count, methodological choice, chronology, claim boundary, '
      'reference-classification disclosure, limitation, reference, appendix or '
      'acknowledgment was changed."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
