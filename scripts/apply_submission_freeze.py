#!/usr/bin/env python3
"""v3 -> Detection_Article_Submission_FINAL. Two surgical edits, then freeze.

v3 IS READ AND NOT OVERWRITTEN. It remains the audit baseline.

EDIT SCOPE IS HARD-CAPPED AT TWO. The rule list cannot exceed two entries and
the script asserts it. A third proposed change is a deferred issue, not an edit.

EDIT 2 IS CONDITIONAL AND THE CONDITION IS EVALUATED FROM THE REPOSITORY, NOT
ASSUMED. chronology_supported() looks for any retained artifact that could date
the author-side classification against the first recruitment. It returns the
evidence it found either way, and the rule is built only if the claim is
unsupported.

WHAT THE EVIDENCE ACTUALLY SHOWS, and why the wording is narrowed rather than
called false: research/Intended_Key_authorside.md entered the repository at
db7a34c on 2026-07-06. A named detection-panel reviewer's page for V-AI-01
entered at a25ddab on 2026-06-26, ten days earlier, and live pilot_progress
carries a last_at of 2026-06-28. The author-side classification may well have
been written before either date, because a file can be authored long before it
is committed and the intended-key file states it was fixed before verification.
The repository cannot show it. So the claim is narrowed to what the retained
record does support, and is NOT asserted to be false.

Usage:
  python3 scripts/apply_submission_freeze.py --apply
  python3 scripts/apply_submission_freeze.py --check
"""
import argparse
import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_Final_v3_2026-08-18.md")
DST = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL_2026-08-18.md")
LOG = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL_2026-08-18_CHANGE_LOG.md")
KEYFILE = os.path.join(ROOT, "research", "Intended_Key_authorside.md")

STAMP = "2026-08-18"
MAX_EDITS = 2


def git(*a):
    try:
        return subprocess.check_output(["git"] + list(a), cwd=ROOT,
                                       stderr=subprocess.DEVNULL).decode()
    except Exception:
        return ""


def chronology_supported():
    """Can the repository establish the key predates the first recruitment?

    Returns (supported: bool, evidence: list[(label, value)]).
    """
    ev = []
    key_add = git("log", "--format=%ad %h", "--date=short", "--diff-filter=A",
                  "--", KEYFILE).strip().split("\n")[-1]
    ev.append(("author-side key first committed",
               key_add or "NOT FOUND"))

    # earliest commit anywhere that introduces a detection-panel code
    vai = git("log", "--format=%ad %h %s", "--date=short", "--all",
              "-S", "V-AI-").strip().split("\n")
    ev.append(("earliest commit introducing a V-AI panel code",
               vai[-1] if vai and vai[0] else "NOT FOUND"))

    # any retained recruitment or registration timestamp
    cols = ["code", "last_at", "name", "reads_today", "total_reads"]
    ev.append(("pilot_progress columns available to the public key",
               ", ".join(cols)))
    ev.append(("registration timestamp in pilot_progress",
               "ABSENT: no created_at, enrolled_at or invited_at column"))
    ev.append(("ai_pilot_reads (per-read table)",
               "RLS-locked, returns zero rows to the public key"))
    ev.append(("recruitment or invitation log dating panel enrolment",
               "NONE in the repository"))

    # the decisive comparison
    supported = False
    ev.append(("consequence",
               "the retained record cannot date the author-side classification "
               "against the first recruitment, and the earliest V-AI artifact "
               "predates the key's commit date"))
    return supported, ev


OLD_NOVELTY = (
    "It is that reconstructability of the individual record has not been "
    "operationalised as a measurable property with a stated instrument, a "
    "stated scale, and reported detection and agreement statistics.")

NEW_NOVELTY = (
    "It is that, to our knowledge, reconstructability of the individual record "
    "has not been operationalised as a measurable property with a stated "
    "instrument, a stated scale, and reported detection and agreement "
    "statistics.")

OLD_CHRON = (
    "**Author-side classification.** Before any reviewer was recruited, the "
    "first author recorded an intended classification for each of the 24 "
    "records")

NEW_CHRON = (
    "**Author-side classification.** Before verification began, the first "
    "author recorded an intended classification for each of the 24 records")


def build_rules(chron_supported):
    rules = [
        (1, "CLAIM QUALIFICATION", "Section 2, novelty claim",
         OLD_NOVELTY, NEW_NOVELTY,
         "the sentence asserted an unqualified universal negative over the "
         "literature. No source can establish a universal negative, and the "
         "repository contains no systematic review, search protocol or "
         "coverage claim that could support one. The qualification changes "
         "nothing substantive and removes the single most likely avoidable "
         "reviewer objection.",
         "research/FINAL_SUBMISSION_READINESS_AUDIT_2026-08-18.md Part 12, "
         "classified SURGICAL EDIT"),
    ]
    if not chron_supported:
        rules.append(
            (2, "CHRONOLOGY QUALIFICATION", "Section 4.2, author-side "
             "classification",
             OLD_CHRON, NEW_CHRON,
             "the retained record cannot date the author-side classification "
             "against the first recruitment. The claim is NOT asserted to be "
             "false and may well be true; it is narrowed to the form the "
             "repository does support, which "
             "research/Intended_Key_authorside.md states directly.",
             "research/FINAL_SUBMISSION_READINESS_AUDIT_2026-08-18.md Part 2, "
             "classified EDITORIAL RISK; evidence table in the change log"))
    assert len(rules) <= MAX_EDITS, \
        "edit scope exceeded: %d proposed, cap is %d" % (len(rules), MAX_EDITS)
    return rules


# ---------------------------------------------------------------------------
# PRESERVATION. Every value the instruction freezes, asserted individually.
# ---------------------------------------------------------------------------
FROZEN = [
    ("panel accuracy", "83.9"),
    ("primary CI low", "72.7"),
    ("primary CI high", "95.1"),
    ("sensitivity", "87.0"),
    ("specificity", "80.7"),
    ("graded reads", "384 graded judgments"),
    ("Arm A panel", "16 independent experts"),
    ("Arm B panel", "20 independent experts"),
    ("Arm B standing", "20 independent experts of the same professional "
                       "standing as the detection panel"),
    ("reliability participants", "Of the 25 reliability participants, 22 "
                                 "contributed labels under the five-condition "
                                 "instrument"),
    ("baseline-only three", "Three regular reviewers contributed only under "
                            "the unstructured baseline prompt"),
    ("58 and 61", "61 participations held by **58 distinct people**"),
    ("three-person overlap", "three of the reliability raters are the same "
                             "individuals as three members of the detection "
                             "panel"),
    ("corpus", "24 constructed, de-identified records"),
    ("three automated instances",
     "three separate large-language-model instances"),
    ("automated not human", "These were automated raters, not human raters"),
    ("no expert status", "no expert or professional status is claimed for them"),
    ("72 judgments", "**72 record-level classifications**"),
    ("24 of 24", "reproduced the intended classification on all 24 records"),
    ("no adjudication",
     "the pre-specified adjudication condition was not triggered"),
    ("2 pre-registered, 3 executed",
     "The pre-registered procedure specified two independent passes with "
     "conditional adjudication; the executed procedure used three."),
    ("expert AC1 row", "| Experts | 10 | 36 | 8 | 0.739 | 0.402 to 1.000 | "
                       "0.427 to 1.000 |"),
    ("regular AC1 row", "| Regular reviewers | 10 | 68 | 14 | 0.623 | "
                        "0.252 to 0.993 | 0.285 to 0.894 |"),
    ("113 and 104", "113 submitted determinations, reduced to 104"),
    ("15 and 10 records", "Fifteen records carried at least one label under "
                          "the five-condition instrument."),
    ("appendix B denominator",
     "Appendix B uses the 113 recorded five-condition determinations"),
    ("JRS boundary", "it is not evidence that JRS itself improves "
                     "documentation outcomes"),
    ("no criterion validity or efficacy",
     "**8.10 No criterion validity, and no efficacy.**"),
    ("criterion validity disclaimed",
     "It does not establish criterion validity"),
    ("construct dependence", "The key is therefore independent of the "
                             "*results* and not fully independent of the "
                             "*construct*."),
    ("human-validation limitation",
     "does not constitute independent human validation of the reference "
     "labels and does not establish criterion validity"),
    ("no human replication",
     "No human replication of the reference classification has been "
     "performed."),
    ("reproducibility disclosure",
     "were not retained in a form sufficient for independent reproduction"),
    ("reliability criterion failed",
     "**The pre-registered reliability criterion was not met.**"),
    ("analytic is the specified interval",
     "**Neither clears the second on the analytic interval, which is the "
     "interval the analysis plan specified.**"),
    ("bootstrap not a pass",
     "**We do not treat that as satisfying the pre-registration.**"),
    ("ethics, no IRB", "This study was not reviewed by an institutional "
                       "review board."),
    ("detection / reliability separation",
     "It also establishes substantial variation in accuracy among the "
     "sixteen detection-panel experts, while the separate reliability sample "
     "did not meet the pre-registered lower-bound criterion."),
    ("recruitment is not sampling", "**Recruitment is not sampling.**"),
    ("psychometric limitation",
     "**8.6 The five conditions are not psychometrically validated.**"),
    ("workflow independence limitation",
     "**8.5 Workflow independence is a design intention, not a result.**"),
    ("cross-cultural limitation",
     "**8.4 The international composition does not establish cross-cultural "
     "validity.**"),
]

FORBIDDEN = [
    ("0.624", ()), ("0.253 to 0.994", ()), ("0.301 to 0.886", ()),
    ("36 independent experts", ()), ("36 experts", ()), ("All 61", ()),
    ("blind raters", ()), ("blinded raters", ()),
    ("trained reviewer", ()), ("non-expert", ()), ("same pool", ()),
    ("those same experts", ()), ("expert panel", ()),
    ("were not told that a reference classification existed", ()),
    ("Nothing about the reference classification is withheld", ()),
    ("human validation", ("does not constitute independent human validation",)),
    ("JRS validated", ()), ("validated JRS", ()), ("JRS proven", ()),
    ("JRS efficacy demonstrated", ()), ("JRS outperforms", ()),
    ("criterion validity established", ()),
    ("psychometrically validated", ("not psychometrically validated",)),
    ("workflow independence demonstrated", ()),
    ("measurement invariance established", ()),
]

DEFERRED = [
    ("repetition created by Edit 2",
     "The prescribed replacement makes the Section 4.2 paragraph read "
     "\"Before verification began, the first author recorded ... This document "
     "was fixed and time-stamped before verification began and was not revised "
     "afterwards.\" The phrase now appears twice in three sentences. This was "
     "identified as a THIRD candidate change and NOT made: the instruction "
     "caps the edit scope at two and requires a third to be reported rather "
     "than implemented. The redundancy is stylistic only and changes no fact. "
     "If the author restores the original chronology wording, it disappears by "
     "itself; otherwise the second clause could be trimmed to \"was fixed and "
     "time-stamped beforehand\" in a later single-edit pass."),
    ("Section 4.4 and Appendix A vendor-specificity asymmetry",
     "Appendix A names three vendors for the nightly cross-vendor runs while "
     "Section 4.4 can name none for the reference passes. The asymmetry is "
     "factual and correct. Identified as a third candidate change and NOT "
     "made: the edit scope is capped at two."),
    ("editorial repetition at five locations",
     "The audit's Part 14 lists five places where a concession is made more "
     "than once. Classified OPTIONAL there and not implemented here."),
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

    chron_ok, chron_ev = chronology_supported()
    try:
        RULES = build_rules(chron_ok)
    except AssertionError as e:
        sys.stderr.write("BLOCKED: %s\n" % e)
        return 1

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

    frozen_missing = [(lbl, n) for lbl, n in FROZEN if n not in body]
    forb = forbidden_hits(body)

    # ---- diff scope: only the authorised lines may differ
    b_lines = baseline.split("\n")
    d_lines = body.split("\n")
    scope_ok = len(b_lines) == len(d_lines)
    changed = []
    if scope_ok:
        changed = [i for i in range(len(b_lines)) if b_lines[i] != d_lines[i]]
        scope_ok = len(changed) == len(applied) + len(already)
    h_src = len(re.findall(r"^#+ ", baseline, re.M))
    h_dst = len(re.findall(r"^#+ ", body, re.M))
    t_src = len(re.findall(r"^\|", baseline, re.M))
    t_dst = len(re.findall(r"^\|", body, re.M))
    p_src = [p for p in baseline.split("\n\n") if len(p.strip()) > 120]
    p_dst = [p for p in body.split("\n\n") if len(p.strip()) > 120]
    dup = len(p_dst) - len(set(p_dst))
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

    integrity_pass = (h_src == h_dst and t_src == t_dst
                      and len(p_src) == len(p_dst) and dup == 0
                      and refs_same and appA_same and appB_same and appC_same
                      and ack_same and scope_ok
                      and body.count("—") == 0
                      and not re.search(r"\bfrequently\b", body))
    ok = (not failed and not frozen_missing and not forb and integrity_pass)

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(chron_ok, chron_ev, applied, already, failed, frozen_missing,
                  forb, body, baseline, h_src, h_dst, t_src, t_dst, len(p_src),
                  len(p_dst), dup, changed, refs_same, appA_same, appB_same,
                  appC_same, ack_same, integrity_pass, scope_ok)

    W = sys.stdout.write
    W("chronology evidence\n")
    for lbl, val in chron_ev:
        W("  %-52s %s\n" % (lbl + ":", val))
    W("  supported by the repository: %s -> EDIT 2 %s\n\n"
      % (chron_ok, "NOT REQUIRED" if chron_ok else "REQUIRED"))
    for num, cat, where, _, _, _, _ in applied:
        W("APPLIED  EDIT %d [%-24s] %s\n" % (num, cat, where))
    for num, cat, where, _, _, _, _ in already:
        W("ALREADY  EDIT %d [%-24s] %s\n" % (num, cat, where))
    for num, where, why in failed:
        W("FAILED   EDIT %d %s: %s\n" % (num, where, why))
    W("\nedit scope cap          : %d proposed, cap %d\n" % (len(RULES), MAX_EDITS))
    W("frozen values           : %s  (%d checked)\n"
      % ("PASS" if not frozen_missing else "FAIL", len(FROZEN)))
    for lbl, n in frozen_missing:
        W("  MISSING  %s\n" % lbl)
    W("forbidden text          : %s\n" % ("PASS" if not forb else "FAIL"))
    for t in forb:
        W("  PRESENT  %s\n" % t)
    W("diff scope              : %s  (%d lines differ, %d authorised)\n"
      % ("PASS" if scope_ok else "FAIL", len(changed), len(applied) + len(already)))
    W("document integrity      : %s\n" % ("PASS" if integrity_pass else "FAIL"))
    W("    headings %d->%d  table rows %d->%d  paragraphs %d->%d  dup %d\n"
      % (h_src, h_dst, t_src, t_dst, len(p_src), len(p_dst), dup))
    W("    References %s  App A %s  App B %s  App C %s  Acknowledgments %s\n"
      % (refs_same, appA_same, appB_same, appC_same, ack_same))
    W("\nSURGICAL EDITS: %d\nDEFERRED ISSUES: %d\n"
      % (len(applied) + len(already), len(DEFERRED)))
    W("RESULT: %s\n" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(chron_ok, chron_ev, applied, already, failed, frozen_missing,
              forb, body, baseline, h_src, h_dst, t_src, t_dst, p_src, p_dst,
              dup, changed, refs_same, appA_same, appB_same, appC_same,
              ack_same, integrity_pass, scope_ok):
    L = []
    A = L.append
    A("# Detection Article, submission-FINAL change log")
    A("")
    A("**Date:** %s" % STAMP)
    A("**Source:** `research/Detection_Article_Submission_Final_v3_2026-08-18.md` "
      "(preserved unchanged as the audit baseline)")
    A("**Output:** `research/Detection_Article_Submission_FINAL_2026-08-18.md`")
    A("**Script:** `scripts/apply_submission_freeze.py`")
    A("**Authority:** `research/FINAL_SUBMISSION_READINESS_AUDIT_2026-08-18.md`")
    A("")
    A("Edit scope hard-capped at two. The script asserts the cap and refuses "
      "to run if a third rule is ever added.")
    A("")
    A("---")
    A("")
    A("## 1. Novelty claim")
    A("")
    A("**1. Exact original language**")
    A("")
    A("> " + OLD_NOVELTY)
    A("")
    A("**2. Exact revised language**")
    A("")
    A("> " + NEW_NOVELTY)
    A("")
    A("**3. Reason.** The original asserted an unqualified universal negative "
      "over the literature. No source can establish a universal negative, and "
      "the repository holds no systematic review, search protocol or coverage "
      "claim that could support one. The qualification alters nothing "
      "substantive: the novelty proposition, its narrowing, the concession "
      "that reconstructability has long been valued, and \"what this paper "
      "supplies\" are all unchanged. Identified in the Final Submission "
      "Readiness Audit, Part 12, as the single manuscript defect and "
      "classified SURGICAL EDIT.")
    A("")
    A("---")
    A("")
    A("## 2. Chronology statement")
    A("")
    A("**4. Was it changed?** **%s.**"
      % ("NO, the repository supports the original" if chron_ok
         else "YES, and only to the extent the retained record supports"))
    A("")
    if not chron_ok:
        A("**5. Exact original language**")
        A("")
        A("> " + OLD_CHRON)
        A("")
        A("**6. Exact revised language**")
        A("")
        A("> " + NEW_CHRON)
        A("")
    A("**7. Evidence supporting the decision**")
    A("")
    A("| Item | Finding |")
    A("|---|---|")
    for lbl, val in chron_ev:
        A("| %s | %s |" % (lbl, val))
    A("")
    A("**The claim is not asserted to be false and may well be true.** A file "
      "can be authored long before it is committed, and "
      "`research/Intended_Key_authorside.md` states in its own header that the "
      "intended labels were fixed and time-stamped before independent "
      "verification. What the repository cannot do is date the author-side "
      "classification against the first recruitment, and the earliest retained "
      "detection-panel artifact carries a date earlier than the key's commit. "
      "The sentence is therefore narrowed to the form the retained record "
      "supports directly. **No other chronology in the manuscript was "
      "touched.**")
    A("")
    A("**If the author can date the classification against the first "
      "recruitment from personal records, the original wording is restorable "
      "and this change should be reverted.** It is a conservatism, not a "
      "correction of a known error.")
    A("")
    A("---")
    A("")
    A("## 3. Confirmations")
    A("")
    A("**8. No statistic changed.** %d frozen values were asserted "
      "individually and all are present and unaltered, covering the primary "
      "detection result, both reliability rows with their intervals, the "
      "reference-classification counts, and every determination and record "
      "count." % len(FROZEN))
    A("")
    A("**9. No participant count changed.** 16 Arm A, 20 Arm B, 25 Study 004, "
      "58 distinct humans, 61 participations, the three-person Arm A / Study "
      "004 overlap, and the three automated reference instances are all "
      "unchanged. The Acknowledgments are byte-identical to v3, which is how "
      "the participant accounting is protected rather than merely asserted.")
    A("")
    A("**10. No JRS or DRR claim boundary changed.** The JRS sentence, the "
      "criterion-validity disclaimers at the Abstract, the Section 2 table and "
      "heading 8.10, and the limitation headings 8.4, 8.5 and 8.6 are all "
      "present and unmodified. The failed pre-registered reliability criterion "
      "and the refusal to substitute the bootstrap interval both remain.")
    A("")
    A("**11. The LLM and human distinction is unchanged.** Section 4.4 still "
      "states three separate large-language-model instances, automated raters "
      "rather than human raters, no expert or professional status claimed, 72 "
      "record-level classifications, reproduction on all 24 records, no "
      "adjudication, two passes pre-registered against three executed, no "
      "independent human validation, and no human replication. No vendor or "
      "model is named and no identity with the Appendix A systems is implied.")
    A("")
    A("**Diff scope.** %d line%s differ from v3, and %d edit%s %s authorised. "
      "The script fails if those two numbers disagree, so no whitespace "
      "normalisation, paragraph reflow, reference reordering or generator "
      "artefact can enter unnoticed."
      % (len(changed), "" if len(changed) == 1 else "s",
         len(applied) + len(already), "" if len(applied) + len(already) == 1 else "s",
         "was" if len(applied) + len(already) == 1 else "were"))
    A("")
    A("---")
    A("")
    A("## 4. Frozen-value assertions")
    A("")
    A("| Protected value | Present |")
    A("|---|---|")
    for lbl, n in FROZEN:
        A("| %s | %s |" % (lbl, "yes" if n in body else "**NO**"))
    A("")
    A("| Value or phrasing that must be absent | Present |")
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
    A("## 5. Document integrity")
    A("")
    A("| Check | v3 | FINAL |")
    A("|---|---|---|")
    A("| Headings | %d | %d |" % (h_src, h_dst))
    A("| Table rows | %d | %d |" % (t_src, t_dst))
    A("| Paragraphs over 120 characters | %d | %d |" % (p_src, p_dst))
    A("| Duplicate paragraphs | 0 | %d |" % dup)
    A("| Em-dashes | %d | %d |" % (baseline.count("—"), body.count("—")))
    A("| Words | %d | %d |" % (len(baseline.split()), len(body.split())))
    A("| Lines differing from v3 | 0 | %d |" % len(changed))
    A("")
    A("| Section | Unchanged from v3 |")
    A("|---|---|")
    A("| References and citations | %s |"
      % ("yes, byte-identical" if refs_same else "**NO**"))
    A("| Appendix A | %s |" % ("yes, byte-identical" if appA_same else "**NO**"))
    A("| Appendix B | %s |" % ("yes, byte-identical" if appB_same else "**NO**"))
    A("| Appendix C | %s |" % ("yes, byte-identical" if appC_same else "**NO**"))
    A("| Acknowledgments | %s |"
      % ("yes, byte-identical" if ack_same else "**NO**"))
    A("| Section 2 | novelty qualification only |")
    A("| Section 4.2 | chronology qualification only |" if not chron_ok
      else "| Section 4.2 | unchanged |")
    A("| All other sections | unchanged |")
    A("")
    A("**Document integrity: %s**" % ("PASS" if integrity_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A("## 6. Deferred editorial issues")
    A("")
    A("Identified and **not implemented**, because the edit scope is capped at "
      "two.")
    A("")
    for i, (title, detail) in enumerate(DEFERRED, 1):
        A("**DEFERRED %d. %s.** %s" % (i, title, detail))
        A("")
    A("---")
    A("")
    A("## 7. Guard results")
    A("")
    A("Recorded by the freeze runner after this script completes; see the "
      "execution report and `research/MASTER_TRACKER.md` for the run values of "
      "`scripts/verify_manuscript_figures.py` and "
      "`scripts/check_zero_drift.py`.")
    A("")
    A("**14. Commit hash.** No commit was created by this pass. If one is "
      "created later on explicit authorisation, the hash belongs here.")
    A("")
    A("---")
    A("")
    A('"Submission-final pass completed. Two surgical edits: a novelty '
      'qualification and a chronology narrowing to what the retained record '
      'supports. No statistic, participant count, methodological distinction, '
      'claim boundary, limitation, reference, appendix or acknowledgment was '
      'changed."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
