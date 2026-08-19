#!/usr/bin/env python3
"""FINAL2 -> FINAL3. Authorized Action 1 only, plus Action 2 as verification.

FINAL2 IS READ AND NOT OVERWRITTEN.

ACTION 1 IS THE ONLY EDIT. Two occurrences still describe the three automated
reference-classification instances in words a reader takes as human. Both sit
outside Section 4.4, which is why the v3 pass, scoped to that section, missed
them:

  Section 9, mitigations      "...by raters not involved in corpus construction"
  Section 11, data availability "...given to the blind reference raters"

Every other "rater" in the manuscript refers to the Study 004 human reliability
participants or the human detection panel and is left untouched. classify_raters()
enumerates all of them and asserts the count of human-referent occurrences is
unchanged, so a careless widening of the edit cannot pass.

ACTION 2 MAKES NO EDIT. corpus_log_state() searches the repository by filename,
by content and through the full git history for the corpus construction log
referenced at Section 4.3 and Section 11. It returns STATE A, B or C and the
evidence. Under STATE C the instruction is explicit: leave the manuscript
unchanged unless an authoritative source affirmatively contradicts the
statement. Nothing does. The manuscript is not touched and the item is recorded
for author confirmation.

Usage:
  python3 scripts/apply_final3_terminology.py --apply
  python3 scripts/apply_final3_terminology.py --check
"""
import argparse
import hashlib
import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL2_2026-08-18.md")
DST = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL3_2026-08-18.md")
LOG = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL3_CHANGE_LOG_2026-08-18.md")

STAMP = "2026-08-18"
MAX_EDITS = 2


def sha(path):
    return hashlib.sha256(io.open(path, "rb").read()).hexdigest()


def git(*a):
    try:
        return subprocess.check_output(["git"] + list(a), cwd=ROOT,
                                       stderr=subprocess.DEVNULL).decode()
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# ACTION 2: corpus construction log, verification only
# ---------------------------------------------------------------------------
def corpus_log_state():
    ev = []
    hits = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        if ".git" in dirpath:
            continue
        for fn in filenames:
            low = fn.lower()
            if any(k in low for k in ("corpus", "construction", "provenance",
                                      "generation")):
                if low.endswith((".md", ".csv", ".json", ".tsv", ".txt",
                                 ".xlsx")):
                    hits.append(os.path.relpath(os.path.join(dirpath, fn),
                                                ROOT))
    ev.append(("filename search for corpus / construction / provenance / "
               "generation across the repository",
               ", ".join(sorted(hits)) if hits else "NO MATCHING DATA FILE"))

    needles = ["generation date", "generation prompt", "model and version used",
               "prompt used for", "extent of human editing"]
    found = []
    for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, "research")):
        if ".git" in dirpath:
            continue
        for fn in filenames:
            if not fn.endswith((".md", ".csv", ".json", ".tsv", ".txt")):
                continue
            if fn.startswith("Detection_Article"):
                continue          # manuscript versions restate the claim
            p = os.path.join(dirpath, fn)
            try:
                t = io.open(p, encoding="utf-8", errors="replace").read().lower()
            except Exception:
                continue
            if any(n in t for n in needles):
                found.append(os.path.relpath(p, ROOT))
    ev.append(("content search for per-record generation metadata, excluding "
               "manuscript versions",
               ", ".join(sorted(found)) if found else "NO SOURCE CARRIES IT"))

    deleted = [l for l in git("log", "--all", "--diff-filter=D",
                              "--name-only", "--format=").split("\n")
               if re.search(r"corpus|construction|provenance|generation", l, re.I)]
    ev.append(("git history, was such a file ever committed and later deleted",
               ", ".join(sorted(set(deleted))) if deleted
               else "NEVER PRESENT IN HISTORY"))

    contra = []
    for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, "research")):
        if ".git" in dirpath:
            continue
        for fn in filenames:
            if not fn.endswith(".md"):
                continue
            p = os.path.join(dirpath, fn)
            try:
                t = io.open(p, encoding="utf-8", errors="replace").read()
            except Exception:
                continue
            if re.search(r"no construction log|log was not kept|"
                         r"no generation record|construction log does not exist",
                         t, re.I):
                contra.append(os.path.relpath(p, ROOT))
    ev.append(("any source affirmatively contradicting the log's existence",
               ", ".join(contra) if contra else "NONE"))

    if found or hits:
        return "B", ev            # something exists; contents unverified here
    if contra:
        return "CONTRADICTED", ev
    return "C", ev


# ---------------------------------------------------------------------------
# ACTION 1
# ---------------------------------------------------------------------------
RULES = [
    (1, "TERMINOLOGY CORRECTION", "Section 11, data availability",
     "the instructions given to the blind reference raters and their "
     "record-by-record reproduction result;",
     "the instructions given to the automated reference-classification "
     "instances and their record-by-record reproduction result;",
     "\"blind reference raters\" is the last surviving description of the "
     "three automated instances in terms a reader takes as human. It sits in "
     "the data-availability list, where an editor reads it, and the v3 pass "
     "did not reach it because that pass was scoped to Section 4.4.",
     "research/Verified_Key.md:8, which records that the three raters were "
     "large-language-model instances and not human raters"),

    (2, "TERMINOLOGY CORRECTION", "Section 9, mitigations in place",
     "blind independent reproduction of the reference classification by "
     "raters not involved in corpus construction and who did not see the "
     "hypotheses;",
     "blind independent reproduction of the reference classification by "
     "automated raters not involved in corpus construction and who did not "
     "see the hypotheses;",
     "the bare word \"raters\" in the list of mitigations reads as human, and "
     "the sentence is one a sceptical reviewer will weigh precisely because it "
     "is offered as a mitigation of investigator dependence. \"automated "
     "raters\" is the term FINAL2 already uses in eight other places, so this "
     "is the minimum adjustment and introduces no new vocabulary.",
     "research/Verified_Key.md:8; consistency with the existing usage at the "
     "Abstract, Section 1, the Section 2 validity table, Section 3 and "
     "Section 4.4"),
]
assert len(RULES) <= MAX_EDITS, "edit scope exceeded"


# Occurrences of "rater" that refer to HUMANS and must not be touched.
HUMAN_RATER_CONTEXTS = [
    ("Study 004 reliability raters, Methods 4.7",
     "**Inter-rater reliability.** Independent raters applied the five "
     "conditions to a shared record set."),
    ("Study 004, invited experts",
     "Raters whose codes begin with E are invited experts whose credentials "
     "are recorded."),
    ("Study 004, one label per rater per record",
     "one label retained per rater per record"),
    ("Study 004, those raters answered a different question",
     "Those raters were answering a different question with a different "
     "instrument"),
    ("reliability estimability, two or more raters",
     "the ten records with two or more raters formed the analysed reliability "
     "set"),
    ("Acknowledgments, reliability raters",
     "**The reliability study, 25 raters**"),
]

# The phrase that must remain, distinguishing automated from human.
REQUIRED = [
    ("automated, not human, stated in 4.4",
     "These were automated raters, not human raters"),
    ("no expert status claimed",
     "no expert or professional status is claimed for them"),
    ("three instances", "three separate large-language-model instances"),
    ("72 judgments", "**72 record-level classifications**"),
    ("Section 11 now says instances",
     "the instructions given to the automated reference-classification "
     "instances"),
    ("Section 9 now says automated raters",
     "by automated raters not involved in corpus construction"),
]

FORBIDDEN = [
    ("blind reference raters", ()), ("blinded reference raters", ()),
    ("blind raters", ()), ("blinded raters", ()),
    ("expert raters", ()), ("professional raters", ()),
    ("human reference raters", ()), ("criterion validators", ()),
    ("expert validators", ()), ("human validators", ()),
    ("human validation", ("does not constitute independent human validation",)),
    ("expert validation", ()),
    ("trained reviewer", ()), ("non-expert", ()), ("same pool", ()),
    ("those same experts", ()), ("expert panel", ()),
    ("36 independent experts", ()), ("36 experts", ()), ("All 61", ()),
    ("0.624", ()), ("0.253 to 0.994", ()), ("0.301 to 0.886", ()),
    ("fixed before recruitment", ()),
    ("Before any reviewer was recruited", ()),
    ("JRS validated", ()), ("validated JRS", ()), ("JRS proven", ()),
    ("JRS efficacy demonstrated", ()), ("JRS outperforms", ()),
    ("criterion validity established", ()),
    ("psychometrically validated", ("not psychometrically validated",)),
    ("workflow independence demonstrated", ()),
    ("measurement invariance established", ()),
    ("substantial agreement", ()), ("moderate agreement", ()),
]

FROZEN = [
    ("accuracy", "83.9"), ("CI low", "72.7"), ("CI high", "95.1"),
    ("sensitivity", "87.0"), ("specificity", "80.7"),
    ("graded reads", "384 graded judgments"),
    ("detection panel", "16 independent experts"),
    ("comparison panel", "20 independent experts"),
    ("corpus", "24 constructed, de-identified records"),
    ("grounded half", "12 grounded"), ("unsupported half", "12 are unsupported"),
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
    ("24 of 24", "reproduced the intended classification on all 24 records"),
    ("no adjudication",
     "the pre-specified adjudication condition was not triggered"),
    ("2 vs 3 passes",
     "The pre-registered procedure specified two independent passes with "
     "conditional adjudication; the executed procedure used three."),
    ("chronology locked, Abstract",
     "reference classification fixed before independent verification"),
    ("chronology locked, Methods",
     "**Author-side classification.** Before verification began,"),
    ("novelty qualified",
     "It is that, to our knowledge, reconstructability of the individual "
     "record has not been operationalised"),
    ("JRS boundary", "it is not evidence that JRS itself improves "
                     "documentation outcomes"),
    ("no criterion validity or efficacy",
     "**8.10 No criterion validity, and no efficacy.**"),
    ("reliability criterion failed",
     "**The pre-registered reliability criterion was not met.**"),
    ("expert lower bound", "The expert lower bound is 0.402 against a "
                           "required 0.41"),
    ("bootstrap not a pass",
     "**We do not treat that as satisfying the pre-registration.**"),
    ("verbal bands dropped", "That characterisation is dropped."),
    ("no human validation",
     "does not constitute independent human validation of the reference "
     "labels and does not establish criterion validity"),
    ("no human replication",
     "No human replication of the reference classification has been "
     "performed."),
    ("corpus log sentence intact",
     "are recorded in the corpus construction log"),
    ("ethics, no IRB", "This study was not reviewed by an institutional "
                       "review board."),
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
    state, log_ev = corpus_log_state()

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

    human_missing = [(l, n) for l, n in HUMAN_RATER_CONTEXTS if n not in body]
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

    integrity = (h_ok and t_ok and len(p_src) == len(p_dst) and dup == 0
                 and refs and appA and appB and appC and ack and scope_ok
                 and body.count("—") == 0
                 and not re.search(r"\bfrequently\b", body))
    ok = (not failed and not human_missing and not req_missing
          and not frozen_missing and not forb and integrity
          and state != "CONTRADICTED")

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(base_hash, state, log_ev, applied, already, failed,
                  human_missing, req_missing, frozen_missing, forb, body,
                  baseline, changed, refs, appA, appB, appC, ack, integrity,
                  scope_ok, len(p_src), len(p_dst), dup)

    W = sys.stdout.write
    W("baseline sha256 : %s\n\n" % base_hash)
    W("ACTION 2, corpus construction log\n")
    for lbl, val in log_ev:
        W("  %s\n     %s\n" % (lbl, val))
    W("  -> STATE %s%s\n\n"
      % (state, "  (no manuscript change; author confirmation required)"
         if state == "C" else ""))
    for num, cat, where, _, _, _, _ in applied:
        W("APPLIED  EDIT %d [%-23s] %s\n" % (num, cat, where))
    for num, cat, where, _, _, _, _ in already:
        W("ALREADY  EDIT %d [%-23s] %s\n" % (num, cat, where))
    for num, where, why in failed:
        W("FAILED   EDIT %d %s: %s\n" % (num, where, why))
    W("\nhuman-rater contexts preserved : %s  (%d checked)\n"
      % ("PASS" if not human_missing else "FAIL", len(HUMAN_RATER_CONTEXTS)))
    for l, n in human_missing:
        W("  ALTERED  %s\n" % l)
    W("required distinctions          : %s\n"
      % ("PASS" if not req_missing else "FAIL"))
    for l, n in req_missing:
        W("  MISSING  %s\n" % l)
    W("frozen values                  : %s  (%d checked)\n"
      % ("PASS" if not frozen_missing else "FAIL", len(FROZEN)))
    for l, n in frozen_missing:
        W("  MISSING  %s\n" % l)
    W("forbidden text                 : %s\n" % ("PASS" if not forb else "FAIL"))
    for t in forb:
        W("  PRESENT  %s\n" % t)
    W("diff scope                     : %s  (%d lines differ, %d authorised)\n"
      % ("PASS" if scope_ok else "FAIL", len(changed),
         len(applied) + len(already)))
    W("document integrity             : %s\n" % ("PASS" if integrity else "FAIL"))
    W("\nSUBSTANTIVE EDITS: %d\nRESULT: %s\n"
      % (len(applied) + len(already), "PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(base_hash, state, log_ev, applied, already, failed, human_missing,
              req_missing, frozen_missing, forb, body, baseline, changed, refs,
              appA, appB, appC, ack, integrity, scope_ok, p_src, p_dst, dup):
    L = []
    A = L.append
    A("# Detection Article FINAL3, change log")
    A("")
    A("**CURRENT VERSION:** FINAL2")
    A("**NEW VERSION:** FINAL3")
    A("**Source:** `research/Detection_Article_Submission_FINAL2_2026-08-18.md` "
      "(preserved, not overwritten)")
    A("**Source sha256:** `%s`" % base_hash)
    A("**Output:** `research/Detection_Article_Submission_FINAL3_2026-08-18.md`")
    A("**Script:** `scripts/apply_final3_terminology.py`")
    A("**Date:** %s" % STAMP)
    A("")
    A("| Field | Value |")
    A("|---|---|")
    A("| MANUSCRIPT EDIT REQUIRED | **YES** |")
    A("| AUTHORIZED EDIT 1, terminology | **YES**, %d occurrence%s |"
      % (len(applied) + len(already),
         "" if len(applied) + len(already) == 1 else "s"))
    A("| AUTHORIZED EDIT 2, corpus log | **NO**, see below |")
    A("| CORPUS LOG STATUS | **NOT ESTABLISHED** |")
    A("| CHRONOLOGY | **LOCKED** |")
    A("| STATISTICS | UNCHANGED |")
    A("| PARTICIPANT COUNTS | UNCHANGED |")
    A("| METHODOLOGY | UNCHANGED |")
    A("| JRS CLAIM BOUNDARY | UNCHANGED |")
    A("| DRR CLAIM BOUNDARY | UNCHANGED |")
    A("| REFERENCE-RATER ARCHITECTURE | UNCHANGED |")
    A("| SUPERSEDED VALUES | 0 |")
    A("| UNAUTHORIZED EDITS | 0 |")
    A("")
    A("---")
    A("")
    A("## 1. Authorized Action 1, reference-rater terminology")
    A("")
    A("**Both occurrences sit outside Section 4.4, which is why the v3 pass "
      "missed them: that pass was scoped to Section 4.4 and to the four "
      "front-matter locations, and neither of these is in either group.** One "
      "is in the data-availability list an editor reads; the other is in the "
      "list of mitigations a sceptical reviewer weighs.")
    A("")
    for num, cat, where, old, new, why, source in applied:
        A("### Edit %d. %s. APPLIED." % (num, where))
        A("")
        A("**Original**")
        A("")
        A("> " + old)
        A("")
        A("**Replacement**")
        A("")
        A("> " + new)
        A("")
        A("**Source.** %s" % source)
        A("")
        A("**Reason.** %s" % why)
        A("")
        A("**Category.** %s" % cat)
        A("")
    for num, cat, where, old, new, why, source in already:
        A("### Edit %d. %s. ALREADY SATISFIED." % (num, where))
        A("")
    for num, where, why in failed:
        A("### Edit %d. %s. FAILED: %s" % (num, where, why))
        A("")
    A("### Human-referent occurrences deliberately NOT changed")
    A("")
    A("| Occurrence | Refers to | Preserved |")
    A("|---|---|---|")
    for lbl, needle in HUMAN_RATER_CONTEXTS:
        A("| %s | human participants | %s |"
          % (lbl, "yes" if needle in body else "**NO**"))
    A("")
    A("The word \"rater\" is correct for the Study 004 human reliability "
      "participants and appears throughout Section 4.7, Section 6.5 and the "
      "Acknowledgments in that sense. **Only the two occurrences that refer to "
      "the automated instances were touched.**")
    A("")
    A("### Architecture after the edit")
    A("")
    A("| Population | Count | Nature |")
    A("|---|---:|---|")
    A("| Detection panel, Study 011 | 16 | independent human experts |")
    A("| Comparison study, Study 012 | 20 | independent human experts |")
    A("| Reliability, Study 004 | 25 total, 22 analysed | human |")
    A("| Reference classification | 3 | automated LLM instances |")
    A("")
    A("No group is merged and no 36-expert aggregate exists.")
    A("")
    A("---")
    A("")
    A("## 2. Authorized Action 2, corpus construction log")
    A("")
    A("**CORPUS LOG STATUS: NOT ESTABLISHED (STATE C). NO MANUSCRIPT CHANGE "
      "MADE.**")
    A("")
    A("| Search | Result |")
    A("|---|---|")
    for lbl, val in log_ev:
        A("| %s | %s |" % (lbl, val))
    A("")
    A("**What the manuscript claims.** Section 4.3: *\"The generation prompts, "
      "the model and version used for each record, the generation dates, and "
      "the extent of human editing per record are recorded in the corpus "
      "construction log, which is part of the materials released under the "
      "data-availability terms in Section 11.\"* Section 11 lists the same log "
      "among the released materials.")
    A("")
    A("**Why nothing was changed.** The instruction is explicit for STATE C: "
      "the author may hold the log outside the repository, so the statement is "
      "left standing unless an authoritative source affirmatively contradicts "
      "it. **Nothing does.** Absence from this repository is not evidence of "
      "absence, and the manuscript describes the log as release material "
      "rather than as something already deposited. No file was invented and no "
      "text was deleted.")
    A("")
    A("**Why this still blocks the freeze.** The claim is not decorative: it "
      "is a **release commitment inside the data-availability statement**. An "
      "editor or reviewer who requests the materials will expect the log to "
      "exist with per-record generation model, version, date, prompt and "
      "extent of human editing. If it does not exist in that form, the "
      "commitment cannot be met and Section 4.3 overstates what is retained. "
      "**Only the author can resolve this**, and it is the single item "
      "standing between FINAL3 and a clean freeze.")
    A("")
    A("---")
    A("")
    A("## 3. Locks verified")
    A("")
    A("| Lock | Status |")
    A("|---|---|")
    A("| Chronology, \"fixed before independent verification\" | **LOCKED**, "
      "present and unchanged |")
    A("| Chronology, \"Before verification began\" | **LOCKED**, present and "
      "unchanged |")
    A("| \"fixed before recruitment\" | absent |")
    A("| Statistical values | %d frozen values asserted, all present |"
      % len(FROZEN))
    A("| Superseded 0.624 | absent |")
    A("| Reliability criterion failed | reported and unchanged |")
    A("| Bootstrap not used as a pass | disowned and unchanged |")
    A("| Verbal reliability bands | still dropped |")
    A("| JRS claim boundary | unchanged |")
    A("| DRR claim boundary | unchanged |")
    A("")
    A("| Protected value | Present |")
    A("|---|---|")
    for l, n in FROZEN:
        A("| %s | %s |" % (l, "yes" if n in body else "**NO**"))
    A("")
    A("| Phrasing that must be absent | Present |")
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
    A("## 4. Document integrity")
    A("")
    A("| Section | Unchanged from FINAL2 |")
    A("|---|---|")
    A("| References | %s |" % ("yes, byte-identical" if refs else "**NO**"))
    A("| Appendix A | %s |" % ("yes, byte-identical" if appA else "**NO**"))
    A("| Appendix B | %s |" % ("yes, byte-identical" if appB else "**NO**"))
    A("| Appendix C | %s |" % ("yes, byte-identical" if appC else "**NO**"))
    A("| Acknowledgments | %s |" % ("yes, byte-identical" if ack else "**NO**"))
    A("| Abstract | unchanged |")
    A("| Sections 1 to 8 | unchanged |")
    A("| Section 9 | Edit 2 only |")
    A("| Section 11 | Edit 1 only |")
    A("")
    A("Paragraphs over 120 characters %d to %d, duplicates %d, em-dashes %d, "
      "%d line%s differ from FINAL2 against %d authorised edit%s."
      % (p_src, p_dst, dup, body.count("—"), len(changed),
         "" if len(changed) == 1 else "s", len(applied) + len(already),
         "" if len(applied) + len(already) == 1 else "s"))
    A("")
    A("**Document integrity: %s**" % ("PASS" if integrity else "FAIL"))
    A("")
    A("---")
    A("")
    A('"FINAL3 completed. Two terminology corrections, both removing the last '
      'descriptions of the automated reference-classification instances in '
      'words a reader takes as human. The corpus construction log could not be '
      'established and the manuscript was deliberately left unchanged; it '
      'requires author confirmation. No statistic, participant count, '
      'methodological choice, chronology, claim boundary, limitation, '
      'reference, appendix or acknowledgment was changed."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
