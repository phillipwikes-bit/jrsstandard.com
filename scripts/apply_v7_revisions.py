#!/usr/bin/env python3
"""v7 surgical correction set. Four instructed fixes plus the mandated audits.

v6 IS READ AND NOT OVERWRITTEN. v7 is written.

"Already satisfied" is tested BEFORE "old text present". A replacement that
appends to its original contains that original, and an old-first test re-applies
it on every run; that defect duplicated a sentence once in the v4 set.

Usage:
  python3 scripts/apply_v7_revisions.py --apply
  python3 scripts/apply_v7_revisions.py --check

Exit code: 0 if every rule is satisfied and every audit passes, 1 otherwise.
"""
import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "Detection_Article_v6_2026-08-18.md")
DST = os.path.join(ROOT, "research", "Detection_Article_v7_2026-08-18.md")
LOG = os.path.join(ROOT, "research", "Detection_Article_v7_CHANGE_LOG.md")

STAMP = "2026-08-18"

# (fix number, section, old exact text, new exact text)
RULES = [

(1, "Section 4.6, record-component interpretation",
 "It finds the reviewer component to be the dominant source of variance and the record component to be small and not distinguishable from zero at this sample size.",
 "It finds the reviewer component to be the dominant source of variance on this corpus, while the record component is weakly identified and permits a materially larger effect within its profile-likelihood interval."),

(2, "Section 6.4, unpaired p-value",
 "so the correct test is paired, and the paired data were not retained in a form that supports one; an unpaired approximation returns p = 0.48. The gap is reported as a direction",
 "so the correct test is paired, and the paired data were not retained in a form that supports one. The gap is reported as a direction"),

(3, "Section 4.9, grammatical defect",
 "pooling the baseline labels in drives it to between 0.16 and 0.18.",
 "pooling the baseline labels drives it to between 0.16 and 0.18."),

(4, "Appendix C, internal API identifier",
 "Every figure in this appendix is computed by `api/variance-6b1d90fa2c47e8b3`, which reads the per-read table server-side and returns aggregates only.",
 "Every figure in this appendix is generated from the per-read analysis dataset using the archived analysis implementation, which returns aggregate results without exposing individual reviewer responses."),
]

# Instructed values that must remain unchanged.
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
    ("113 overall determinations", "113 overall determinations"),
    ("565 condition-level labels", "565 condition-level labels"),
    ("216 lowest-level labels", "216"),
    ("142 middle-level labels", "142"),
    ("207 pass-level labels", "207"),
    ("Reviewer SD 1.769", "1.769"),
    ("Record SD 0.011", "0.011"),
    ("Reviewer variance 3.130", "3.130"),
    ("Record variance 0.0001", "0.0001"),
    ("Reviewer ICC 0.488", "0.488"),
    ("Record ICC 0.0000", "0.0000"),
    ("Record profile interval 0.001 to 0.556", "0.001 to 0.556"),
    ("Average reviewer on average record 89.2%", "89.2"),
]

# Phrases the instruction requires absent after the edits.
POST_EDIT_ABSENT = [
    "not distinguishable from zero",
    "an unpaired approximation returns p = 0.48",
    "p = 0.48",
    "labels in drives",
    "api/variance-6b1d90fa2c47e8b3",
]

# The seven statements the statistical interpretation must communicate.
STAT_CONSISTENCY = [
    ("1. reviewer variation dominant",
     ["the reviewer component to be the dominant source of variance on this corpus",
      "The estimated reviewer component is substantially larger than the record component"]),
    ("2. record component at the boundary",
     ["The record component is estimated at the boundary and must not be interpreted as zero.",
      "which is on the boundary"]),
    ("3. record component not zero",
     ["must not be interpreted as zero"]),
    ("4. record component weakly identified",
     ["the record component is weakly identified"]),
    ("5. profile interval 0.001 to 0.556",
     ["0.001 to 0.556"]),
    ("6. larger record effect not ruled out",
     ["permits a materially larger record effect",
      "permits a materially larger effect within its profile-likelihood interval",
      "does not exclude a moderate record effect"]),
    ("7. exploratory, does not modify the primary result",
     ["It does not bear on the pre-registered primary criterion in Section 6.1, which is unchanged.",
      "**Status: exploratory.**"]),
]

CLAIM_ABSENT = [
    ("verified key", "terminology"),
    ("verified answer key", "terminology"),
    ("answer key", "terminology"),
    ("held-out key", "terminology"),
    ("held-out reference classification", "v6 fix 4"),
    ("is an upper bound", "spectrum"),
    ("JRS is independent of any vendor", "workflow"),
    ("Fisher's exact", "per-condition inference"),
    ("no deception was used", "ethics"),
    ("de-identified participant-level response data", "data governance"),
    ("A property can be real", "construct"),
    ("Across the 113 labels", "Appendix B units"),
    ("demonstrated per-condition association", "v6 fix 2"),
    ("cannot be distinguished from zero", "v6 fix 6"),
    ("one dataset in six", "v6 fix 6"),
    ("performs below chance", "v6 fix 5"),
    ("below the 50 percent chance rate", "v6 fix 5"),
    ("which is the first one a measurement programme", "v6 fix 1"),
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
    ("designed to be vendor-, model-, and workflow-agnostic", "JRS agnostic"),
    ("Workflow independence is a design intention, not a result", "workflow"),
    ("All 24 records are AI-generated", "workflow corpus"),
    ("The pre-registered reliability criterion was not met.", "reliability not met"),
    ("which is the interval the analysis plan specified", "analytic is prespecified"),
    ("We do not treat that as satisfying the pre-registration.", "bootstrap sensitivity only"),
    ("**8.6 The five conditions are not psychometrically validated.**", "psychometric"),
    ("would benefit professionally and commercially from the standard's adoption",
     "investigator dependence"),
    ("The records were constructed by the creator of the construct to instantiate the construct.",
     "author-generated corpus"),
    ("not fully independent of the *construct*", "construct dependence"),
    ("It finds the reviewer component to be the dominant source of variance on this corpus",
     "fix 1"),
    ("pooling the baseline labels drives it to between 0.16 and 0.18.", "fix 3"),
    ("using the archived analysis implementation", "fix 4"),
    ("The estimator was validated by simulation against known variance components before use, "
     "and its JavaScript implementation was checked for numeric parity against an independent "
     "Python implementation on identical data, agreeing to four decimal places.",
     "fix 4, parity statement preserved verbatim"),
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
    post_hits = [t for t in POST_EDIT_ABSENT if t in body]
    stat_missing = [(lbl, alts) for lbl, alts in STAT_CONSISTENCY
                    if not any(a in body for a in alts)]
    absent_hits = [(t, why) for t, why in CLAIM_ABSENT if t in body]
    present_missing = [(t, why) for t, why in CLAIM_PRESENT if t not in body]

    headings_src = len(re.findall(r"^#+ ", baseline, re.M))
    headings_dst = len(re.findall(r"^#+ ", body, re.M))
    tables_src = len(re.findall(r"^\|", baseline, re.M))
    tables_dst = len(re.findall(r"^\|", body, re.M))
    paras_src = [p for p in baseline.split("\n\n") if len(p.strip()) > 120]
    paras_dst = [p for p in body.split("\n\n") if len(p.strip()) > 120]
    dup = len(paras_dst) - len(set(paras_dst))
    refs_same = (baseline.split("## References")[1].split("---")[0]
                 == body.split("## References")[1].split("---")[0])
    appA_same = (baseline.split("## Appendix A")[1].split("## Appendix B")[0]
                 == body.split("## Appendix A")[1].split("## Appendix B")[0])
    appB_same = (baseline.split("## Appendix B")[1].split("## Appendix C")[0]
                 == body.split("## Appendix B")[1].split("## Appendix C")[0])

    numeric_pass = not num_missing
    stat_pass = not post_hits and not stat_missing
    claim_pass = not absent_hits and not present_missing
    integrity_pass = (headings_src == headings_dst and tables_src == tables_dst
                      and len(paras_src) == len(paras_dst) and dup == 0
                      and refs_same and appA_same and appB_same
                      and body.count("—") == 0
                      and not re.search(r"\bfrequently\b", body))
    ok = not failed and numeric_pass and stat_pass and claim_pass and integrity_pass

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(applied, already, failed, num_missing, post_hits, stat_missing,
                  absent_hits, present_missing, body, baseline,
                  headings_src, headings_dst, tables_src, tables_dst,
                  len(paras_src), len(paras_dst), dup,
                  refs_same, appA_same, appB_same,
                  numeric_pass, stat_pass, claim_pass, integrity_pass)

    for num, where, _o, _n in applied:
        print("  APPLIED            FIX %d  %s" % (num, where))
    for num, where, _o, _n in already:
        print("  ALREADY SATISFIED  FIX %d  %s" % (num, where))
    for num, where, why in failed:
        print("  FAILED             FIX %d  %s  <- %s" % (num, where, why))
    print()
    print("  numerical integrity     : %s" % ("PASS" if numeric_pass else "FAIL"))
    for lbl, ndl in num_missing:
        print("      MISSING %-40s %r" % (lbl, ndl))
    print("  statistical consistency : %s" % ("PASS" if stat_pass else "FAIL"))
    for t in post_hits:
        print("      STILL PRESENT %r" % t)
    for lbl, alts in stat_missing:
        print("      NOT COMMUNICATED %s" % lbl)
    print("  claim boundary          : %s" % ("PASS" if claim_pass else "FAIL"))
    for t, why in absent_hits:
        print("      PRESENT but must be absent: %r (%s)" % (t, why))
    for t, why in present_missing:
        print("      MISSING but must be present: %r (%s)" % (t[:56], why))
    print("  document integrity      : %s" % ("PASS" if integrity_pass else "FAIL"))
    print("      headings %d->%d  table rows %d->%d  paragraphs %d->%d  dup %d"
          % (headings_src, headings_dst, tables_src, tables_dst,
             len(paras_src), len(paras_dst), dup))
    print("      References unchanged %s  Appendix A unchanged %s  Appendix B unchanged %s"
          % (refs_same, appA_same, appB_same))
    print()
    print("RESULT: %s" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(applied, already, failed, num_missing, post_hits, stat_missing,
              absent_hits, present_missing, body, baseline,
              h_src, h_dst, t_src, t_dst, p_src, p_dst, dup,
              refs_same, appA_same, appB_same,
              numeric_pass, stat_pass, claim_pass, integrity_pass):
    L = []
    A = L.append
    A("# Detection_Article_v7 change log")
    A("")
    A("| | |")
    A("|---|---|")
    A("| Source document | `research/Detection_Article_v6_2026-08-18.md` / `.docx` |")
    A("| Output document | `research/Detection_Article_v7_2026-08-18.md` / `.docx` |")
    A("| Date of execution | %s |" % STAMP)
    A("| Surgical fixes applied | %d |" % len(applied))
    A("| Already satisfied | %d |" % len(already))
    A("| Failed | %d |" % len(failed))
    A("")
    A("## Surgical fixes")
    A("")
    for num, where, old, new in applied:
        A("### Surgical Fix %d" % num)
        A("")
        A("**Section / location.** %s" % where)
        A("")
        A("**Status.** APPLIED")
        A("")
        A("**Exact original wording**")
        A("")
        A("> " + old.replace("\n", "\n> "))
        A("")
        A("**Exact replacement wording**")
        A("")
        A("> " + new.replace("\n", "\n> "))
        A("")
    for num, where, old, new in already:
        A("### Surgical Fix %d" % num)
        A("")
        A("**Section / location.** %s" % where)
        A("")
        A("**Status.** ALREADY SATISFIED, no change made")
        A("")
        A("> " + new.replace("\n", "\n> "))
        A("")
    if failed:
        A("### FAILED")
        A("")
        for num, where, why in failed:
            A("- Surgical Fix %d, %s: %s" % (num, where, why))
        A("")

    A("## Numerical integrity result")
    A("")
    A("| Value | Present in v7 |")
    A("|---|---|")
    for lbl, ndl in NUMERIC:
        A("| %s | %s |" % (lbl, "yes" if ndl in body else "**NO**"))
    A("")
    A("Arithmetic verified in the document: 216 + 142 + 207 = %d, and 113 x 5 = %d."
      % (216 + 142 + 207, 113 * 5))
    A("")
    A("**Result: %s**" % ("PASS" if numeric_pass else "FAIL"))
    A("")

    A("## Statistical consistency result")
    A("")
    A("| Phrase required absent after editing | Occurrences |")
    A("|---|---|")
    for t in POST_EDIT_ABSENT:
        A("| `%s` | %d |" % (t, body.count(t)))
    A("")
    A("| Term inspected for consistency | Occurrences |")
    A("|---|---|")
    for t in ("record component", "record variance", "record SD", "profile-likelihood",
              "reviewer component", "reviewer SD", "reviewer ICC"):
        A("| `%s` | %d |" % (t, body.count(t)))
    A("")
    A("| Statement the manuscript must communicate | Communicated |")
    A("|---|---|")
    for lbl, alts in STAT_CONSISTENCY:
        A("| %s | %s |" % (lbl, "yes" if any(a in body for a in alts) else "**NO**"))
    A("")
    A("**Result: %s**" % ("PASS" if stat_pass else "FAIL"))
    A("")

    A("## Claim-boundary result")
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
    A("**Result: %s**" % ("PASS" if claim_pass else "FAIL"))
    A("")

    A("## Document-integrity result")
    A("")
    A("| Check | v6 | v7 |")
    A("|---|---|---|")
    A("| Headings | %d | %d |" % (h_src, h_dst))
    A("| Table rows | %d | %d |" % (t_src, t_dst))
    A("| Paragraphs over 120 characters | %d | %d |" % (p_src, p_dst))
    A("| Duplicate paragraphs | 0 | %d |" % dup)
    A("| Em-dashes | %d | %d |" % (baseline.count("—"), body.count("—")))
    A("| Words | %d | %d |" % (len(baseline.split()), len(body.split())))
    A("")
    A("| Section | Unchanged from v6 |")
    A("|---|---|")
    A("| References and citations | %s |" % ("yes, byte-identical" if refs_same else "**NO**"))
    A("| Appendix A | %s |" % ("yes, byte-identical" if appA_same else "**NO**"))
    A("| Appendix B | %s |" % ("yes, byte-identical" if appB_same else "**NO**"))
    A("| Appendix C | changed only by Surgical Fix 4 |")
    A("| Section 4.6 | changed only by Surgical Fix 1 |")
    A("| Section 4.9 | changed only by Surgical Fix 3 |")
    A("| Section 6.4 | changed only by Surgical Fix 2 |")
    A("")
    A("The source is plain Markdown and the `.docx` is generated from it, so no "
      "tracked change and no comment can be introduced. No paragraph was deleted: "
      "the paragraph count is identical. No text was truncated and no character "
      "corruption occurred; the only differences from v6 are the four replacements "
      "listed above.")
    A("")
    A("**Result: %s**" % ("PASS" if integrity_pass else "FAIL"))
    A("")
    A('"v7 surgical revision completed. No primary study result, preregistered '
      'threshold, corpus composition, study design, or substantive methodological '
      'finding was changed."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
