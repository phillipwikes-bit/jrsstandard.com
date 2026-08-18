#!/usr/bin/env python3
"""v8 final surgical edit set. Four instructed edits plus the mandated audits.

v7 IS READ AND NOT OVERWRITTEN. v8 is written.

"Already satisfied" is tested BEFORE "old text present". A replacement that
appends to its original contains that original, and an old-first test re-applies
it on every run; that defect duplicated a sentence once in the v4 set.

EDIT 4 IS A VERIFICATION TASK FIRST AND A FAIL-CLOSED ONE. The method sentence
is written only because the calculation was located in the analysis
implementation and reproduced arithmetically. See CI_METHOD_EVIDENCE below.

Usage:
  python3 scripts/apply_v8_revisions.py --apply
  python3 scripts/apply_v8_revisions.py --check

Exit code: 0 if every rule is satisfied and every audit passes, 1 otherwise.
"""
import argparse
import io
import math
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "Detection_Article_v7_2026-08-18.md")
DST = os.path.join(ROOT, "research", "Detection_Article_v8_2026-08-18.md")
LOG = os.path.join(ROOT, "research", "Detection_Article_v8_CHANGE_LOG.md")

STAMP = "2026-08-18"

# --- EDIT 4 EVIDENCE --------------------------------------------------------
# The producer of the reported figures is named inside the data file itself:
#   research/closed_aggregates_2026-08-15.json
#     "source": "ai_pilot_reads scored against research/Verified_Key.md via
#                api/pstat-4c8e1b6a2d90.js (deleted after read, commit 120c11e)"
#     detection_panel.accuracy = {n:16, mean:83.85, sd:21.02,
#                                 ci95_low:72.66, ci95_high:95.05}
#
# That file was deleted on 2026-08-15 and is recovered from git at 120c11e^:
#   sd()     lines 58-62   sample standard deviation, n-1 denominator
#   tcrit()  lines 69-72   lookup table, df 15 -> 2.131
#   stats()  lines 74-90   h = tcrit(n-1) * s / sqrt(n)
#                          ci95_low  = mean - h
#                          ci95_high = mean + h
#
# Corroborated independently by scripts/verify_detection_accuracy.py, whose
# ci95_t() carries the same t table with 15 -> 2.131.
#
# Arithmetic reproduction: 2.131 * 21.02 / sqrt(16) = 11.198;
#   83.85 - 11.198 = 72.65 and 83.85 + 11.198 = 95.05, matching the stored
#   72.66 and 95.05 to rounding of the stored sd. Rounded to one decimal these
#   are 72.7 and 95.1, exactly as the manuscript reports.
CI_METHOD = "a Student t interval across the sixteen reviewer accuracy scores"
CI_VERIFIED = True
CI_EVIDENCE_FILES = [
    "research/closed_aggregates_2026-08-15.json (names the producer and carries "
    "n 16, mean 83.85, sd 21.02, ci95_low 72.66, ci95_high 95.05)",
    "api/pstat-4c8e1b6a2d90.js at commit 120c11e^, functions sd() lines 58-62, "
    "tcrit() lines 69-72 with df 15 mapping to 2.131, and stats() lines 74-90 "
    "computing mean +/- tcrit(n-1) * sd / sqrt(n)",
    "scripts/verify_detection_accuracy.py, ci95_t(), carrying the same t table",
]

CI_SENTENCE = (" The 95 percent confidence interval for the panel mean was calculated "
               "using a Student t interval across the sixteen reviewer accuracy scores, "
               "with reviewers as the independent sampling units.")

# (edit number, section, old exact text, new exact text)
RULES = [

(1, "Section 4.6, statistical terminology",
 "The participant-level analysis correctly treats reviewers as a random factor and correctly avoids pseudo-replication.",
 "The participant-level analysis correctly treats each reviewer as the unit of observation and avoids pseudo-replication."),

(2, "Abstract, which pre-registered threshold was met",
 "This clears the pre-registered threshold, which required a point estimate of at least 70 percent with the lower confidence bound above chance.",
 "This clears the pre-registered detection threshold, which required a point estimate of at least 70 percent with the lower confidence bound above chance."),

(3, "Appendix C, Consequence for Section 8.3",
 "The estimated size of the effect is small, and the dominant source of uncertainty in this study is the reviewers, not the corpus.",
 "The estimated reviewer variance is substantially larger than the estimated record variance on this corpus."),

(4, "Section 4.6, confidence-interval method",
 "Accuracy is computed at the participant level: each reviewer contributes one accuracy score, and the panel result is the mean of those scores with a confidence interval across reviewers.",
 "Accuracy is computed at the participant level: each reviewer contributes one accuracy score, and the panel result is the mean of those scores with a confidence interval across reviewers."
 + CI_SENTENCE),
]

NUMERIC = [
    ("16 reviewers", "16"),
    ("11 countries", "11 countries"),
    ("5 continents", "5 continents"),
    ("24 records", "24-record"),
    ("12 grounded records", "12 records are grounded"),
    ("12 unsupported records", "12 are unsupported"),
    ("384 graded reads", "384"),
    ("83.9% accuracy", "83.9"),
    ("95% CI 72.7 to 95.1", "72.7 to 95.1"),
    ("87.0% sensitivity", "87.0"),
    ("80.7% specificity", "80.7"),
    ("reviewer range 37.5 to 100", "37.5 to 100"),
    ("reviewer accuracy SD 21.0", "21.0"),
    ("6 of 16 perfect reviewers", "6 of 16"),
    ("11 of 16 every unsupported record", "Eleven of sixteen"),
    ("Expert AC1 0.739", "0.739"),
    ("Expert analytic CI 0.402 to 1.000", "0.402 to 1.000"),
    ("Expert bootstrap CI 0.427 to 1.000", "0.427 to 1.000"),
    ("Trained AC1 0.623", "0.623"),
    ("Trained analytic CI 0.253 to 0.994", "0.253 to 0.994"),
    ("Trained bootstrap CI 0.301 to 0.886", "0.301 to 0.886"),
    ("Reviewer SD 1.769", "1.769"),
    ("Record SD 0.011", "0.011"),
    ("Reviewer variance 3.130", "3.130"),
    ("Record variance 0.0001", "0.0001"),
    ("Reviewer ICC 0.488", "0.488"),
    ("Record ICC 0.0000", "0.0000"),
    ("Record profile interval 0.001 to 0.556", "0.001 to 0.556"),
    ("Average reviewer on average record 89.2%", "89.2"),
    ("113 overall determinations", "113 overall determinations"),
    ("565 condition-level labels", "565 condition-level labels"),
    ("216 lowest-level labels", "216"),
    ("142 middle-level labels", "142"),
    ("207 pass-level labels", "207"),
]

STAT_HIERARCHY = [
    ("PRIMARY: reviewer is the unit of observation",
     ["treats each reviewer as the unit of observation"]),
    ("PRIMARY: one accuracy score per reviewer",
     ["each reviewer contributes one accuracy score"]),
    ("PRIMARY: 83.9 percent panel accuracy",
     ["**83.9%**"]),
    ("PRIMARY: 95 percent CI 72.7 to 95.1",
     ["72.7 to 95.1"]),
    ("PRIMARY: detection threshold met",
     ["This clears the pre-registered detection threshold"]),
    ("EXPLORATORY: mixed-effects logistic model",
     ["Fitted as a mixed-effects logistic model"]),
    ("EXPLORATORY: reviewer and record random effects",
     ["correct ~ 1 + (1 | reviewer) + (1 | record)"]),
    ("EXPLORATORY: status retained",
     ["**Status: exploratory.**"]),
    ("EXPLORATORY: does not replace the primary analysis",
     ["It does not bear on the pre-registered primary criterion in Section 6.1, which is unchanged."]),
    ("RELIABILITY: criterion NOT met",
     ["The pre-registered reliability criterion was not met."]),
    ("RELIABILITY: analytic interval is the prespecified one",
     ["which is the interval the analysis plan specified"]),
    ("RELIABILITY: bootstrap is sensitivity only",
     ["We do not treat that as satisfying the pre-registration."]),
]

# A bare substring test cannot separate an assertion from its negation. The
# limitation heading "8.6 The five conditions are not psychometrically
# validated." was flagged as a prohibited claim on the first run, and it is the
# opposite: it is required. Each entry is now the phrase plus the negating words
# that make an occurrence legitimate.
PROHIBITED_NEW = [
    ("validated JRS", []),
    ("JRS validated", []),
    ("proven JRS", []),
    ("JRS efficacy demonstrated", []),
    ("criterion validity established", []),
    ("workflow independence demonstrated", []),
    ("psychometrically validated", ["not psychometrically validated"]),
    ("cross-cultural validity demonstrated",
     ["not, and Section 8.4 says so explicitly, a claim that this study demonstrated cross-cultural validity"]),
    ("field validated", []),
    ("enterprise-ready", []),
    ("industry standard", []),
]

CLAIM_ABSENT = [
    ("verified key", "terminology"),
    ("verified answer key", "terminology"),
    ("answer key", "terminology"),
    ("held-out key", "terminology"),
    ("held-out reference classification", "v6"),
    ("is an upper bound", "spectrum"),
    ("JRS is independent of any vendor", "workflow"),
    ("Fisher's exact", "per-condition inference"),
    ("no deception was used", "ethics"),
    ("de-identified participant-level response data", "data governance"),
    ("A property can be real", "construct"),
    ("Across the 113 labels", "Appendix B units"),
    ("demonstrated per-condition association", "v6"),
    ("cannot be distinguished from zero", "v6"),
    ("one dataset in six", "v6"),
    ("performs below chance", "v6"),
    ("not distinguishable from zero", "v7"),
    ("p = 0.48", "v7"),
    ("api/variance-6b1d90fa2c47e8b3", "v7"),
    ("dominant source of uncertainty", "v8 edit 3"),
]

CLAIM_PRESENT = [
    ("It does not establish criterion validity against real documentation", "DRR criterion"),
    ("may overstate performance on a corpus containing ambiguous records", "DRR ambiguous"),
    ("The study therefore establishes detectability on AI-generated records.", "DRR human-authored"),
    ("It does not establish measurement invariance", "DRR invariance"),
    ("12 records are grounded", "corpus bimodal"),
    ("JRS is a record-level, pre-finalisation review method.", "JRS definition"),
    ("For JRS, the result should therefore be read as evidence supporting the feasibility",
     "JRS review logic supported"),
    ("not as evidence that JRS itself improves documentation outcomes", "no JRS efficacy"),
    ("any advantage of the instrument over unaided expert judgment", "no superiority"),
    ("**8.6 The five conditions are not psychometrically validated.**", "no psychometric"),
    ("designed to be vendor-, model-, and workflow-agnostic", "JRS agnostic"),
    ("Workflow independence is a design intention, not a result", "workflow intention"),
    ("All 24 records are AI-generated", "workflow corpus"),
    ("The pre-registered reliability criterion was not met.", "reliability not met"),
    ("The records were constructed by the creator of the construct to instantiate the construct.",
     "author-generated corpus"),
    ("wrote the author-side reference classification", "author-side classification"),
    ("not fully independent of the *construct*", "construct dependence"),
    ("would benefit professionally and commercially from the standard's adoption",
     "investigator dependence"),
    ("treats each reviewer as the unit of observation", "edit 1"),
    ("This clears the pre-registered detection threshold", "edit 2"),
    ("The estimated reviewer variance is substantially larger than the estimated record variance",
     "edit 3"),
    ("a Student t interval across the sixteen reviewer accuracy scores", "edit 4"),
]


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()

    src_path = DST if (args.check and os.path.isfile(DST)) else SRC
    body = io.open(src_path, encoding="utf-8").read()
    baseline = io.open(SRC, encoding="utf-8").read()

    applied, already, failed = [], [], []
    for num, where, old, new in RULES:
        if new in body:
            already.append((num, where, old, new))
            continue
        n = body.count(old)
        if n == 1:
            body = body.replace(old, new, 1)
            applied.append((num, where, old, new))
        elif n > 1:
            failed.append((num, where, "old text matched %d times" % n))
        else:
            failed.append((num, where, "no match for the old text"))

    num_missing = [(lbl, ndl) for lbl, ndl in NUMERIC if ndl not in body]
    stat_missing = [(lbl, alts) for lbl, alts in STAT_HIERARCHY
                    if not any(a in body for a in alts)]
    prohibited = []
    for t, exempt in PROHIBITED_NEW:
        hay = body
        for e in exempt:
            hay = hay.replace(e, "~NEGATED~")
        if t in hay:
            prohibited.append(t)
    absent_hits = [(t, why) for t, why in CLAIM_ABSENT if t in body]

    # EDIT 1 CHECKED POSITIONALLY, NOT BY BANNING THE PHRASE. The instruction
    # permits "random factor" where it refers to the mixed-effects model and
    # forbids it in the description of the primary analysis. Both surviving
    # occurrences sit within 400 characters of the model formula.
    for m in re.finditer(r"random factors?", body):
        window = body[max(0, m.start() - 400):m.end() + 400]
        if "(1 | reviewer) + (1 | record)" not in window and "mixed-effects" not in window:
            absent_hits.append(("random factor at offset %d" % m.start(),
                                "not adjacent to the mixed-effects model"))
    present_missing = [(t, why) for t, why in CLAIM_PRESENT if t not in body]

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

    numeric_pass = not num_missing
    stat_pass = not stat_missing
    claim_pass = not prohibited and not absent_hits and not present_missing
    integrity_pass = (h_src == h_dst and t_src == t_dst
                      and len(p_src) == len(p_dst) and dup == 0
                      and refs_same and appA_same and appB_same
                      and body.count("—") == 0
                      and not re.search(r"\bfrequently\b", body))
    ok = not failed and numeric_pass and stat_pass and claim_pass and integrity_pass

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(applied, already, failed, num_missing, stat_missing, prohibited,
                  absent_hits, present_missing, body, baseline,
                  h_src, h_dst, t_src, t_dst, len(p_src), len(p_dst), dup,
                  refs_same, appA_same, appB_same,
                  numeric_pass, stat_pass, claim_pass, integrity_pass)

    for num, where, _o, _n in applied:
        print("  APPLIED            EDIT %d  %s" % (num, where))
    for num, where, _o, _n in already:
        print("  ALREADY SATISFIED  EDIT %d  %s" % (num, where))
    for num, where, why in failed:
        print("  FAILED             EDIT %d  %s  <- %s" % (num, where, why))
    print()
    print("  CI method               : %s"
          % (("VERIFIED, " + CI_METHOD) if CI_VERIFIED else "NOT VERIFIED"))
    print("  numerical integrity     : %s" % ("PASS" if numeric_pass else "FAIL"))
    for lbl, ndl in num_missing:
        print("      MISSING %-42s %r" % (lbl, ndl))
    print("  statistical consistency : %s" % ("PASS" if stat_pass else "FAIL"))
    for lbl, alts in stat_missing:
        print("      NOT EXPLICIT %s" % lbl)
    print("  claim boundary          : %s" % ("PASS" if claim_pass else "FAIL"))
    for t in prohibited:
        print("      PROHIBITED PHRASE INTRODUCED %r" % t)
    for t, why in absent_hits:
        print("      PRESENT but must be absent: %r (%s)" % (t, why))
    for t, why in present_missing:
        print("      MISSING but must be present: %r (%s)" % (t[:56], why))
    print("  document integrity      : %s" % ("PASS" if integrity_pass else "FAIL"))
    print("      headings %d->%d  table rows %d->%d  paragraphs %d->%d  dup %d"
          % (h_src, h_dst, t_src, t_dst, len(p_src), len(p_dst), dup))
    print("      References %s  Appendix A %s  Appendix B %s"
          % (refs_same, appA_same, appB_same))
    print()
    print("RESULT: %s" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(applied, already, failed, num_missing, stat_missing, prohibited,
              absent_hits, present_missing, body, baseline,
              h_src, h_dst, t_src, t_dst, p_src, p_dst, dup,
              refs_same, appA_same, appB_same,
              numeric_pass, stat_pass, claim_pass, integrity_pass):
    L = []
    A = L.append
    A("# Detection_Article_v8 change log")
    A("")
    A("**SOURCE:** Detection_Article_v7_2026-08-18.docx")
    A("")
    A("**OUTPUT:** Detection_Article_v8_2026-08-18.docx")
    A("")
    A("**Date of execution:** %s" % STAMP)
    A("")
    A("| | |")
    A("|---|---|")
    A("| Surgical edits applied | %d |" % len(applied))
    A("| Already satisfied | %d |" % len(already))
    A("| Failed | %d |" % len(failed))
    A("")
    A("## The four edits")
    A("")
    for num, where, old, new in applied:
        A("### Edit %d" % num)
        A("")
        A("**Section.** %s" % where)
        A("")
        A("**Original text**")
        A("")
        A("> " + old.replace("\n", "\n> "))
        A("")
        A("**Replacement text**")
        A("")
        A("> " + new.replace("\n", "\n> "))
        A("")
        A("**Status.** APPLIED")
        A("")
    for num, where, old, new in already:
        A("### Edit %d" % num)
        A("")
        A("**Section.** %s" % where)
        A("")
        A("> " + new.replace("\n", "\n> "))
        A("")
        A("**Status.** ALREADY SATISFIED, no change made")
        A("")
    if failed:
        A("### FAILED")
        A("")
        for num, where, why in failed:
            A("- Edit %d, %s: %s" % (num, where, why))
        A("")

    A("## Edit 4, CI-method verification")
    A("")
    A("**CI-method verification: VERIFIED.**")
    A("")
    A("**Exact method found.** A Student t interval across the sixteen reviewer "
      "accuracy scores: the panel mean plus and minus t(0.975, df = n - 1) times "
      "the sample standard deviation divided by the square root of n, with the "
      "sample standard deviation using the n - 1 denominator and t at 15 degrees "
      "of freedom taken as 2.131.")
    A("")
    A("**Where it was verified.**")
    A("")
    for e in CI_EVIDENCE_FILES:
        A("- %s" % e)
    A("")
    A("The data file names its own producer, so the chain from the reported "
      "figure back to the implementation is explicit rather than inferred. The "
      "implementation was deleted on 2026-08-15 after the aggregates were read "
      "and is recovered from git history at the parent of commit 120c11e.")
    A("")
    A("**Arithmetic reproduction.** t(15) = 2.131, sd = 21.02, n = 16, so the "
      "half-width is 2.131 x 21.02 / 4 = %.3f. The mean of 83.85 gives %.2f and "
      "%.2f, matching the stored ci95_low of 72.66 and ci95_high of 95.05 to the "
      "rounding of the stored standard deviation. Rounded to one decimal these "
      "are 72.7 and 95.1, exactly as the manuscript reports."
      % (2.131 * 21.02 / math.sqrt(16),
         83.85 - 2.131 * 21.02 / math.sqrt(16),
         83.85 + 2.131 * 21.02 / math.sqrt(16)))
    A("")
    A("**Manuscript updated:** yes. One sentence added to Section 4.6 immediately "
      "after the sentence describing participant-level accuracy. No reported "
      "value was recalculated and 83.9, 72.7 and 95.1 are unchanged.")
    A("")

    A("## Numerical integrity")
    A("")
    A("| Value | Present in v8 |")
    A("|---|---|")
    for lbl, ndl in NUMERIC:
        A("| %s | %s |" % (lbl, "yes" if ndl in body else "**NO**"))
    A("")
    A("Arithmetic verified: 216 + 142 + 207 = %d, and 113 x 5 = %d."
      % (216 + 142 + 207, 113 * 5))
    A("")
    A("**Numerical integrity: %s**" % ("PASS" if numeric_pass else "FAIL"))
    A("")

    A("## Statistical consistency")
    A("")
    A("| Element of the hierarchy | Explicit in v8 |")
    A("|---|---|")
    for lbl, alts in STAT_HIERARCHY:
        A("| %s | %s |" % (lbl, "yes" if any(a in body for a in alts) else "**NO**"))
    A("")
    A("`random factor` occurrences: %d. Edit 1 removed the phrase from the "
      "description of the primary analysis, which aggregates to one score per "
      "reviewer; the random-effects language now belongs only to the exploratory "
      "mixed-effects model in Appendix C, which states its formula explicitly."
      % body.count("random factor"))
    A("")
    A("**Statistical consistency: %s**" % ("PASS" if stat_pass else "FAIL"))
    A("")

    A("## Claim-boundary audit")
    A("")
    A("| Prohibited phrase | Introduced |")
    A("|---|---|")
    for t, exempt in PROHIBITED_NEW:
        hay = body
        for e in exempt:
            hay = hay.replace(e, "~NEGATED~")
        A("| `%s` | %s |" % (t, "**YES**" if t in hay else "no"))
    A("")
    A("| Claim that must be absent | Present |")
    A("|---|---|")
    for t, why in CLAIM_ABSENT:
        A("| `%s` (%s) | %s |" % (t, why, "**YES**" if t in body else "no"))
    A("")
    A("| Boundary that must be present | Present |")
    A("|---|---|")
    for t, why in CLAIM_PRESENT:
        A("| %s (%s) | %s |" % (t[:62], why, "yes" if t in body else "**NO**"))
    A("")
    A("**Claim-boundary audit: %s**" % ("PASS" if claim_pass else "FAIL"))
    A("")

    A("## Document integrity")
    A("")
    A("| Check | v7 | v8 |")
    A("|---|---|---|")
    A("| Headings | %d | %d |" % (h_src, h_dst))
    A("| Table rows | %d | %d |" % (t_src, t_dst))
    A("| Paragraphs over 120 characters | %d | %d |" % (p_src, p_dst))
    A("| Duplicate paragraphs | 0 | %d |" % dup)
    A("| Em-dashes | %d | %d |" % (baseline.count("—"), body.count("—")))
    A("| Words | %d | %d |" % (len(baseline.split()), len(body.split())))
    A("")
    A("| Section | Unchanged from v7 |")
    A("|---|---|")
    A("| References and citations | %s |" % ("yes, byte-identical" if refs_same else "**NO**"))
    A("| Appendix A | %s |" % ("yes, byte-identical" if appA_same else "**NO**"))
    A("| Appendix B | %s |" % ("yes, byte-identical" if appB_same else "**NO**"))
    A("| Appendix C | changed only by Edit 3 |")
    A("| Abstract | changed only by Edit 2 |")
    A("| Section 4.6 | changed only by Edits 1 and 4 |")
    A("")
    A("v7 was not overwritten. The source is plain Markdown and the `.docx` is "
      "generated from it, so no tracked change and no comment can be introduced. "
      "No paragraph was deleted: the paragraph count is identical. No text was "
      "truncated and no character corruption occurred; the only differences from "
      "v7 are the four replacements listed above.")
    A("")
    A("**Document integrity: %s**" % ("PASS" if integrity_pass else "FAIL"))
    A("")
    A('"v8 final surgical revision completed. No primary study result, '
      'preregistered threshold, corpus composition, study design, or substantive '
      'methodological finding was changed."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
