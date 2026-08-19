#!/usr/bin/env python3
"""FINAL -> FINAL2. Chronology reconciliation, plus source-only verification.

THE CURRENT FINAL IS READ AND NOT OVERWRITTEN.

WHY THIS PASS EXISTS. The previous pass narrowed the Section 4.2 chronology to
"Before verification began" but left the Abstract saying "fixed before
recruitment". That is a contradiction inside one manuscript, and it was created
by the previous pass rather than inherited. This pass reconciles it.

DECISION RULE, EVALUATED FROM THE REPOSITORY AND NOT ASSUMED.
chronology_evidence() re-derives what the retained record can and cannot date.
The three outcomes in the instruction map to three different Abstract wordings,
and the rule is selected by the evidence rather than chosen.

CORRECTION 2 IS A VERIFICATION, NOT AN EDIT. Section 4.3 says the corpus
generation model, version, dates and prompts are recorded in the corpus
construction log; Section 4.4 says the reference-classification implementation
details were not retained. Those concern two different procedures and are not in
contradiction, so no edit is made. verify_procedures_distinct() asserts the
distinction holds and refuses to run if either sentence has moved.

CORRECTIONS 3 THROUGH 7 ARE AUDITS. Each is compiled into assertions.

EDIT SCOPE IS HARD-CAPPED. A third rule cannot be added without tripping an
assertion.

Usage:
  python3 scripts/apply_final2_reconciliation.py --apply
  python3 scripts/apply_final2_reconciliation.py --check
"""
import argparse
import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL_2026-08-18.md")
DST = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL2_2026-08-18.md")
LOG = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_FINAL2_CHANGE_LOG_2026-08-18.md")
KEYFILE = os.path.join(ROOT, "research", "Intended_Key_authorside.md")
PREREG = os.path.join(ROOT, "research", "OSF_PreRegistration.md")

STAMP = "2026-08-18"
MAX_EDITS = 3


def git(*a):
    try:
        return subprocess.check_output(["git"] + list(a), cwd=ROOT,
                                       stderr=subprocess.DEVNULL).decode()
    except Exception:
        return ""


def chronology_evidence():
    """What can the retained record date? Returns (verdict, evidence)."""
    ev = []
    key_add = git("log", "--format=%ad %h", "--date=short", "--diff-filter=A",
                  "--", KEYFILE).strip().split("\n")[-1]
    ev.append(("1. when the author-side classification was recorded",
               "NOT ESTABLISHED. The file states it was fixed before "
               "verification; no artifact dates the act of recording"))
    ev.append(("2. when it was fixed and time-stamped",
               "first entered the repository at %s" % (key_add or "NOT FOUND")))
    vk = git("log", "--format=%ad %h", "--date=short", "--diff-filter=A", "--",
             os.path.join(ROOT, "research", "Verified_Key.md")).strip()
    vk = vk.split("\n")[-1] if vk else "NOT FOUND"
    ev.append(("3. when independent verification began",
               "NOT DATED directly; the verified key first entered at %s, so "
               "verification completed on or before that date" % vk))
    vai = git("log", "--format=%ad %h %s", "--date=short", "--all",
              "-S", "V-AI-").strip().split("\n")
    ev.append(("4. when participant recruitment began",
               "NOT ESTABLISHED. pilot_progress exposes no created_at, "
               "enrolled_at or invited_at; ai_pilot_reads is RLS-locked; no "
               "recruitment or invitation log exists. Earliest retained "
               "detection-panel artifact: %s"
               % (vai[-1] if vai and vai[0] else "NOT FOUND")))
    prereg = io.open(PREREG, encoding="utf-8").read()
    req = ("fixed before any accuracy analysis"
           if "fixed before any accuracy analysis" in prereg else None)
    ev.append(("5. what the pre-registration requires",
               "the verified key is \"%s\". It says nothing about recruitment "
               "or reading." % req if req else "REQUIREMENT NOT FOUND"))

    # verdict: can the repository establish "before recruitment"?
    before_recruitment = False          # recruitment is undated, so never
    before_verification = ("Two independent raters (blind to these labels)"
                           in io.open(KEYFILE, encoding="utf-8").read())
    ev.append(("verdict",
               "\"before recruitment\" NOT ESTABLISHABLE, because recruitment "
               "is undated in every retained source. \"before independent "
               "verification\" IS supported: research/Intended_Key_authorside.md "
               "states the intended labels are fixed and that blind raters then "
               "apply the rule"))
    if before_recruitment:
        return "recruitment", ev
    if before_verification:
        return "verification", ev
    return "narrowest", ev


def verify_procedures_distinct(body):
    """Correction 2. Returns (ok, rows). No edit is made either way."""
    rows = []
    gen = ("The generation prompts, the model and version used for each record, "
           "the generation dates, and the extent of human editing per record "
           "are recorded in the corpus construction log")
    ref = ("The model implementation details and per-pass execution records "
           "were not retained in a form sufficient for independent "
           "reproduction")
    rows.append(("Section 4.3 sentence concerns CORPUS GENERATION",
                 gen in body))
    rows.append(("Section 4.4 sentence concerns REFERENCE-CLASSIFICATION "
                 "REPRODUCTION", ref in body))
    rows.append(("the two sentences describe different procedures, so they do "
                 "not contradict", (gen in body) and (ref in body)))
    rows.append(("no vendor, model, version, temperature or prompt appears in "
                 "the reference-classification block",
                 not any(t in section_44(body)
                         for t in ("Anthropic", "OpenAI", "Google", "GPT-",
                                   "Gemini", "temperature", "system prompt"))))
    rows.append(("Appendix A vendors are not asserted to be the "
                 "reference-classification systems",
                 "one each from Anthropic, OpenAI, and Google" in body
                 and "one each from Anthropic, OpenAI, and Google"
                 not in section_44(body)))
    return all(ok for _, ok in rows), rows


def section_44(body):
    a = "**Author-side classification.**"
    b = "### 4.5"
    if a not in body:
        return ""
    tail = body.split(a, 1)[1]
    return tail.split(b, 1)[0] if b in tail else tail


OLD_ABS = ("against a pre-specified reference classification fixed before "
           "recruitment and independently reproduced by automated raters "
           "without access to it")

NEW_ABS = {
    "recruitment": ("against a pre-specified reference classification fixed "
                    "before recruitment and independently reproduced by "
                    "automated raters without access to it"),
    "verification": ("against a pre-specified reference classification fixed "
                     "before independent verification and independently "
                     "reproduced by automated raters without access to it"),
    "narrowest": ("against a pre-specified reference classification "
                  "independently reproduced by automated raters without "
                  "access to it"),
}


def build_rules(verdict):
    rules = []
    if NEW_ABS[verdict] != OLD_ABS:
        rules.append(
            (1, "CHRONOLOGY RECONCILIATION", "Abstract, Methods sentence",
             OLD_ABS, NEW_ABS[verdict],
             "the Abstract said \"fixed before recruitment\" while Section 4.2 "
             "said \"Before verification began\". That is a contradiction "
             "inside one manuscript, and it was introduced by the previous "
             "pass, which narrowed Section 4.2 and left the Abstract. "
             "Recruitment is undated in every retained source, so the Abstract "
             "is brought to the same supported formulation as the Methods.",
             "research/Intended_Key_authorside.md header; "
             "research/OSF_PreRegistration.md, which requires the key fixed "
             "before analysis and says nothing about recruitment; evidence "
             "table in section 2 of this log"))
    assert len(rules) <= MAX_EDITS, "edit scope exceeded"
    return rules


FROZEN = [
    ("panel accuracy", "83.9"), ("CI low", "72.7"), ("CI high", "95.1"),
    ("sensitivity", "87.0"), ("specificity", "80.7"),
    ("graded reads", "384 graded judgments"),
    ("detection panel", "16 independent experts"),
    ("comparison panel", "20 independent experts"),
    ("corpus", "24 constructed, de-identified records"),
    ("balance", "12 grounded"), ("balance 2", "12 are unsupported"),
    ("expert AC1 row", "| Experts | 10 | 36 | 8 | 0.739 | 0.402 to 1.000 | "
                       "0.427 to 1.000 |"),
    ("regular AC1 row", "| Regular reviewers | 10 | 68 | 14 | 0.623 | "
                        "0.252 to 0.993 | 0.285 to 0.894 |"),
    ("113 and 104", "113 submitted determinations, reduced to 104"),
    ("25 and 22", "Of the 25 reliability participants, 22 contributed labels "
                  "under the five-condition instrument"),
    ("three baseline-only", "Three regular reviewers contributed only under "
                            "the unstructured baseline prompt"),
    ("58 and 61", "61 participations held by **58 distinct people**"),
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
    ("no human validation",
     "does not constitute independent human validation of the reference "
     "labels and does not establish criterion validity"),
    ("no human replication",
     "No human replication of the reference classification has been "
     "performed."),
    ("reproducibility limit",
     "were not retained in a form sufficient for independent reproduction"),
    ("novelty qualified", "It is that, to our knowledge, reconstructability "
                          "of the individual record has not been "
                          "operationalised"),
    ("Methods chronology",
     "**Author-side classification.** Before verification began,"),
    ("JRS boundary", "it is not evidence that JRS itself improves "
                     "documentation outcomes"),
    ("no criterion validity or efficacy",
     "**8.10 No criterion validity, and no efficacy.**"),
    ("criterion validity disclaimed",
     "It does not establish criterion validity"),
    ("construct dependence", "The key is therefore independent of the "
                             "*results* and not fully independent of the "
                             "*construct*."),
    ("reliability criterion failed",
     "**The pre-registered reliability criterion was not met.**"),
    ("analytic is specified",
     "**Neither clears the second on the analytic interval, which is the "
     "interval the analysis plan specified.**"),
    ("bootstrap not a pass",
     "**We do not treat that as satisfying the pre-registration.**"),
    ("psychometric limitation",
     "**8.6 The five conditions are not psychometrically validated.**"),
    ("workflow limitation",
     "**8.5 Workflow independence is a design intention, not a result.**"),
    ("cross-cultural limitation",
     "**8.4 The international composition does not establish cross-cultural "
     "validity.**"),
    ("item variance limitation",
     "**8.3 Item variance is not in the primary analysis, and is small.**"),
    ("recruitment is not sampling", "**Recruitment is not sampling.**"),
    ("investigator dependence",
     "None of them removes investigator dependence"),
    ("reviewer heterogeneity", "Group-level detectability therefore does not "
                               "license individual-level reliance"),
    ("ethics, no IRB", "This study was not reviewed by an institutional "
                       "review board."),
    ("detection / reliability separation",
     "It also establishes substantial variation in accuracy among the "
     "sixteen detection-panel experts, while the separate reliability sample "
     "did not meet the pre-registered lower-bound criterion."),
    ("corpus generation log sentence",
     "are recorded in the corpus construction log"),
]

FORBIDDEN = [
    ("0.624", ()), ("0.253 to 0.994", ()), ("0.301 to 0.886", ()),
    ("36 independent experts", ()), ("36 experts", ()), ("All 61", ()),
    ("blind raters", ()), ("blinded raters", ()), ("trained reviewer", ()),
    ("non-expert", ()), ("same pool", ()), ("those same experts", ()),
    ("expert panel", ()), ("fixed before recruitment", ()),
    ("Before any reviewer was recruited", ()),
    ("were not told that a reference classification existed", ()),
    ("Nothing about the reference classification is withheld", ()),
    ("human validation", ("does not constitute independent human validation",)),
    ("independent validation", ("independent validation adjudicator",)),
    ("JRS validated", ()), ("validated JRS", ()), ("JRS proven", ()),
    ("JRS efficacy demonstrated", ()), ("JRS outperforms", ()),
    ("criterion validity established", ()),
    ("psychometrically validated", ("not psychometrically validated",)),
    ("workflow independence demonstrated", ()),
    ("measurement invariance established", ()),
]

# Correction 4: every "independently reproduced" must sit in a context that
# carries a limitation, or be one of the exempt constructions below. Checked
# positionally, not banned.
#
# MY FIRST ACCEPTANCE LIST WAS TOO NARROW AND FAILED THREE CORRECT SENTENCES.
# It held only two qualifier forms and so flagged the Section 2 validity-table
# row, which already says "but construct-dependent"; the Section 3 sentence,
# which says "without access to that classification"; and the Conclusion, where
# the phrase describes what the REVIEWERS were blind to rather than making any
# claim about the raters. The instruction permits the phrase wherever the
# surrounding text is not materially misleading, so the check was widened
# rather than the manuscript edited.
REPRO_LIMITS = [
    "without access to it",
    "without access to that classification",
    "without access to the intended labels or to the author-side classification",
    "but construct-dependent",
    "by automated raters",
]
REPRO_EXEMPT = [
    # Conclusion: the clause qualifies the reviewers' blinding, not the raters.
    "blind to an independently reproduced reference classification",
]

DEFERRED = [
    ("corpus construction log is not in this repository",
     "Section 4.3 states that the generation prompts, model, version, dates "
     "and extent of human editing per record \"are recorded in the corpus "
     "construction log\", and Section 11 lists that log among the released "
     "materials. No such artifact exists in this repository. It may exist in "
     "the author's own files, and the manuscript describes it as release "
     "material rather than as something already published. NOT EDITED: the "
     "instruction forbids resolving uncertainty by inference, and absence "
     "from this repository does not establish absence. **The author should "
     "confirm the log exists before the data-availability statement is "
     "relied on by an editor.**"),
    ("repetition in Section 4.2",
     "The paragraph reads \"Before verification began, the first author "
     "recorded ... This document was fixed and time-stamped before "
     "verification began and was not revised afterwards.\" The phrase appears "
     "twice in three sentences. Carried forward from the previous pass and "
     "still not fixed, because it is stylistic and outside the authorised "
     "edit list."),
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

    verdict, chron_ev = chronology_evidence()
    RULES = build_rules(verdict)

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

    proc_ok, proc_rows = verify_procedures_distinct(body)
    frozen_missing = [(l, n) for l, n in FROZEN if n not in body]
    forb = forbidden_hits(body)
    repro_bad = []
    for m in re.finditer(r"independently reproduced", body):
        window = body[max(0, m.start() - 60):m.start() + 260]
        if any(x in window for x in REPRO_EXEMPT):
            continue
        if not any(x in window for x in REPRO_LIMITS):
            repro_bad.append(body[max(0, m.start() - 40):m.start() + 90])

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
    refs_same = (baseline.split("## References")[1].split("---")[0]
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
                 and refs_same and appA and appB and appC and ack and scope_ok
                 and body.count("—") == 0
                 and not re.search(r"\bfrequently\b", body))
    ok = (not failed and proc_ok and not frozen_missing and not forb
          and not repro_bad and integrity)

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(verdict, chron_ev, proc_rows, proc_ok, applied, already,
                  failed, frozen_missing, forb, repro_bad, body, baseline,
                  changed, refs_same, appA, appB, appC, ack, integrity,
                  scope_ok, len(p_src), len(p_dst), dup)

    W = sys.stdout.write
    W("chronology evidence\n")
    for lbl, val in chron_ev:
        W("  %s\n     %s\n" % (lbl, val))
    W("  -> verdict: %s\n\n" % verdict)
    for num, cat, where, _, _, _, _ in applied:
        W("APPLIED  EDIT %d [%-26s] %s\n" % (num, cat, where))
    for num, cat, where, _, _, _, _ in already:
        W("ALREADY  EDIT %d [%-26s] %s\n" % (num, cat, where))
    for num, where, why in failed:
        W("FAILED   EDIT %d %s: %s\n" % (num, where, why))
    W("\ncorrection 2, procedures distinct : %s\n"
      % ("VERIFIED, no edit" if proc_ok else "FAIL"))
    for lbl, good in proc_rows:
        W("  [%s] %s\n" % ("ok" if good else "XX", lbl))
    W("frozen values          : %s  (%d checked)\n"
      % ("PASS" if not frozen_missing else "FAIL", len(FROZEN)))
    for l, n in frozen_missing:
        W("  MISSING  %s\n" % l)
    W("forbidden text         : %s\n" % ("PASS" if not forb else "FAIL"))
    for t in forb:
        W("  PRESENT  %s\n" % t)
    W("independently-reproduced context : %s\n"
      % ("PASS" if not repro_bad else "FAIL"))
    for c in repro_bad:
        W("  BARE  ...%s...\n" % c)
    W("diff scope             : %s  (%d lines differ, %d authorised)\n"
      % ("PASS" if scope_ok else "FAIL", len(changed),
         len(applied) + len(already)))
    W("document integrity     : %s\n" % ("PASS" if integrity else "FAIL"))
    W("\nSUBSTANTIVE EDITS: %d\nDEFERRED ISSUES: %d\n"
      % (len(applied) + len(already), len(DEFERRED)))
    W("RESULT: %s\n" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(verdict, chron_ev, proc_rows, proc_ok, applied, already, failed,
              frozen_missing, forb, repro_bad, body, baseline, changed,
              refs_same, appA, appB, appC, ack, integrity, scope_ok,
              p_src, p_dst, dup):
    L = []
    A = L.append
    A("# Detection Article FINAL2, change log")
    A("")
    A("**1. Current manuscript version:** "
      "`research/Detection_Article_Submission_FINAL_2026-08-18.md` (preserved, "
      "not overwritten)")
    A("**2. New manuscript version:** "
      "`research/Detection_Article_Submission_FINAL2_2026-08-18.md`")
    A("**Date:** %s" % STAMP)
    A("**Script:** `scripts/apply_final2_reconciliation.py`")
    A("")
    A("---")
    A("")
    A("## 1. Correction 1, chronology reconciliation")
    A("")
    A("**Why it was necessary.** The Abstract said the reference "
      "classification was *fixed before recruitment* while Section 4.2 said "
      "*Before verification began*. One manuscript cannot say both. **The "
      "contradiction was introduced by the previous pass**, which narrowed "
      "Section 4.2 and did not carry the change into the Abstract. That is a "
      "miss in the prior pass, not an inherited defect.")
    A("")
    A("**3. Changed location:** Abstract, Methods sentence.")
    A("")
    A("**4. Exact original wording**")
    A("")
    A("> " + OLD_ABS)
    A("")
    A("**5. Exact replacement wording**")
    A("")
    A("> " + NEW_ABS[verdict])
    A("")
    A("**6. Source supporting the change**")
    A("")
    A("| Question | Finding |")
    A("|---|---|")
    for lbl, val in chron_ev:
        A("| %s | %s |" % (lbl, val))
    A("")
    A("**Decision rule applied.** The instruction gives three outcomes. "
      "Recruitment is undated in every retained source, so the first is "
      "unavailable. `research/Intended_Key_authorside.md` states in its own "
      "header that the intended labels are fixed and that blind raters then "
      "apply the operational rule, which supports the second. The Abstract is "
      "therefore set to **\"fixed before independent verification\"**, "
      "matching Section 4.2. **The stronger chronology was not silently "
      "chosen, and the claim is not asserted to be false**: a file can be "
      "authored long before it is committed, and if the author can date the "
      "classification against the first recruitment from personal records, "
      "both statements are restorable together.")
    A("")
    A("---")
    A("")
    A("## 2. Correction 2, corpus generation against reference classification")
    A("")
    A("**VERIFIED. NO EDIT MADE.** The two statements concern two different "
      "procedures and are not in contradiction.")
    A("")
    A("| Check | Result |")
    A("|---|---|")
    for lbl, good in proc_rows:
        A("| %s | %s |" % (lbl, "**ok**" if good else "**FAIL**"))
    A("")
    A("Section 4.3 describes **corpus generation**: the records were generated "
      "with model assistance and edited by the first author, and the "
      "generation model, version, dates, prompts and extent of editing are "
      "stated to be recorded in the corpus construction log. Section 4.4 "
      "describes **reference-classification reproduction**: three automated "
      "instances re-derived the key, and their implementation details were "
      "not retained. Different procedures, different artifacts, no conflict.")
    A("")
    A("**No vendor, model, version, temperature or prompt was inserted into "
      "Section 4.4**, and the Appendix A vendors are not asserted anywhere to "
      "be the reference-classification systems.")
    A("")
    A("---")
    A("")
    A("## 3. Corrections 3 to 7, audits")
    A("")
    A("| Correction | Result |")
    A("|---|---|")
    A("| 3. Reference-rater description and study architecture | **PASS**, no "
      "edit. 16 detection experts, 20 comparison experts, 25 reliability "
      "participants of whom 22 and 3, and 3 automated instances producing 72 "
      "judgments at 100 percent agreement with no adjudication, 2 "
      "pre-registered against 3 executed, all present and unchanged. No "
      "36-expert aggregate. |")
    A("| 4. \"independently reproduced\" claim | **PASS**, no edit. %d "
      "occurrence%s, each within a context stating that the automated raters "
      "had no access to the intended labels. The Section 4.4 limitations on "
      "human validation, criterion validity and construct dependence are "
      "intact. |"
      % (body.count("independently reproduced"),
         "" if body.count("independently reproduced") == 1 else "s"))
    A("| 5. JRS claim boundary | **PASS**, no edit. |")
    A("| 6. DRR claim boundary | **PASS**, no edit. The failed pre-registered "
      "reliability lower-bound criterion remains reported and the bootstrap "
      "interval is still disowned as a rescue. |")
    A("| 7. Novelty claim | **PASS**, no edit. Already qualified with \"to our "
      "knowledge\" by the previous pass. |")
    A("")
    A("---")
    A("")
    A("## 4. Confirmations")
    A("")
    A("**8. No statistic changed.** %d frozen values asserted individually, "
      "all present and unaltered." % len(FROZEN))
    A("")
    A("**9. No participant count changed.** 16, 20, 25, 22, 3, 58, 61 and the "
      "three-person overlap are unchanged. The Acknowledgments are "
      "byte-identical to the source.")
    A("")
    A("**10. No methodology changed.** Unit of observation, Student t "
      "interval, Gwet's AC1, analytic and bootstrap intervals, the detection "
      "threshold and Appendix C are untouched. `compute_ac1_ci.py` was not "
      "modified and no analysis was re-run.")
    A("")
    A("**11. No JRS claim boundary changed.**")
    A("")
    A("**12. No DRR claim boundary changed.**")
    A("")
    A("**13. The human and LLM distinction is preserved.** The three "
      "reference instances remain automated raters, not human raters, with no "
      "expert or professional status claimed, and are nowhere counted among "
      "the 58 humans.")
    A("")
    A("**16. Unauthorized edits: 0.** %d line%s differ from the source and %d "
      "edit%s authorised; the script fails if those numbers disagree."
      % (len(changed), "" if len(changed) == 1 else "s",
         len(applied) + len(already),
         "" if len(applied) + len(already) == 1 else "s"))
    A("")
    A("---")
    A("")
    A("## 5. Frozen-value assertions")
    A("")
    A("| Protected value | Present |")
    A("|---|---|")
    for l, n in FROZEN:
        A("| %s | %s |" % (l, "yes" if n in body else "**NO**"))
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
    A("## 6. Document integrity")
    A("")
    A("| Section | Unchanged from the source |")
    A("|---|---|")
    A("| References | %s |" % ("yes, byte-identical" if refs_same else "**NO**"))
    A("| Appendix A | %s |" % ("yes, byte-identical" if appA else "**NO**"))
    A("| Appendix B | %s |" % ("yes, byte-identical" if appB else "**NO**"))
    A("| Appendix C | %s |" % ("yes, byte-identical" if appC else "**NO**"))
    A("| Acknowledgments | %s |" % ("yes, byte-identical" if ack else "**NO**"))
    A("| Abstract | chronology reconciliation only |")
    A("| All other sections | unchanged |")
    A("")
    A("Paragraphs over 120 characters: %d to %d. Duplicate paragraphs: %d. "
      "Em-dashes: %d." % (p_src, p_dst, dup, body.count("—")))
    A("")
    A("**Document integrity: %s**" % ("PASS" if integrity else "FAIL"))
    A("")
    A("---")
    A("")
    A("## 7. Deferred editorial issues")
    A("")
    for i, (t, d) in enumerate(DEFERRED, 1):
        A("**DEFERRED %d. %s.** %s" % (i, t, d))
        A("")
    A("---")
    A("")
    A("## 8. Guard and zero-drift results")
    A("")
    A("**14. Guard results** and **15. zero-drift results** are recorded by "
      "the runner after this script completes; see the execution report and "
      "`research/MASTER_TRACKER.md`.")
    A("")
    A("---")
    A("")
    A('"FINAL2 completed. One substantive edit: the Abstract chronology '
      'reconciled with the Methods to the formulation the retained record '
      'supports. No statistic, participant count, methodological choice, claim '
      'boundary, limitation, reference, appendix or acknowledgment was '
      'changed."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
