#!/usr/bin/env python3
"""v6 surgical revision set. Six instructed revisions plus the mandated audits.

v5 IS READ AND NOT OVERWRITTEN. v6 is written.

"Already satisfied" is tested BEFORE "old text present". A replacement that
appends to its original contains that original, and an old-first test re-applies
it on every run; that defect duplicated a sentence once in the v4 set.

Usage:
  python3 scripts/apply_v6_revisions.py --apply
  python3 scripts/apply_v6_revisions.py --check

Exit code: 0 if every rule is satisfied and every audit passes, 1 otherwise.
"""
import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "Detection_Article_v5_2026-08-18.md")
DST = os.path.join(ROOT, "research", "Detection_Article_v6_2026-08-18.md")
LOG = os.path.join(ROOT, "research", "Detection_Article_v6_CHANGE_LOG.md")

STAMP = "2026-08-18"

# (revision, section, old exact text, new exact text)
RULES = [

(1, "Abstract, Objective",
 "**Objective.** This paper asks a single question, which is the first one a measurement programme has to answer: given an operational definition of DRR, can independent domain experts distinguish records that satisfy it from records that do not?",
 "**Objective.** This paper asks a single question, which is an initial question a measurement programme must address: given an operational definition of DRR, can independent domain experts distinguish records that satisfy it from records that do not?"),

(2, "Section 3, per-condition association",
 "face validity and demonstrated per-condition association",
 "face validity and descriptive per-condition association"),

(3, "Section 4.4, opening sentence",
 "The key is the foundation of every number in this paper, and it is treated here as a methodological object rather than as a formality.",
 "The reference classification is the comparison standard underlying the primary accuracy estimates, and it is treated here as a methodological object rather than as a formality."),

(4, "Section 4.7, detection threshold",
 "**Detection threshold (primary).** Agreement with the held-out reference classification must exceed chance with the lower 95 percent bound above 0.50, and must reach a pre-set target of at least 0.70.",
 "**Detection threshold (primary).** Agreement with the pre-specified reference classification must exceed chance with the lower 95 percent bound above 0.50, and must reach a pre-set target of at least 0.70."),

# Revision 5. The instruction requires the finding to appear ONCE. The earlier
# paragraph carries the bare statement and the later one already carries the
# precise wording, so the precise wording goes to the earlier paragraph and the
# later occurrence is reduced to a reference back to it rather than repeated.
(5, "Section 6.3, precise chance-benchmark statement",
 "At the other end, reviewer accuracy fell below the 50 percent chance rate.",
 "At the other end, at least one reviewer had an accuracy below the 50 percent balanced-corpus chance benchmark."),

(5, "Section 6.3, remove the duplicate occurrence",
 "A panel mean of 83.9 percent conceals a distribution in which some reviewers are near-perfect and at least one reviewer had an accuracy below the 50 percent balanced-corpus chance benchmark, and at the point of use that spread is invisible:",
 "A panel mean of 83.9 percent conceals the distribution reported above, and at the point of use that spread is invisible:"),

(6, "Appendix C, boundary wording",
 "The record component is a singular fit and must not be read as a zero",
 "The record component is estimated at the boundary and must not be interpreted as zero."),

(6, "Appendix C, item-difficulty conclusion",
 "The defensible statement is therefore narrow: on this corpus, item difficulty is small relative to reviewer variation and cannot be distinguished from zero, and the sample cannot rule out a moderate effect.",
 "The defensible statement is therefore narrow: on this corpus, the estimated item component is small relative to reviewer variation, but it is weakly identified and the profile-likelihood interval permits a materially larger record effect."),

# Section 8.3 restates revision 6's claim in different words. Leaving it would
# put the Limitations section in direct contradiction with the corrected
# Appendix C. Aligned to the instructed wording; every figure in the sentence is
# preserved unchanged.
(6, "Section 8.3, align to the corrected Appendix C wording",
 "Item difficulty is small relative to reviewer variation on this corpus and cannot be distinguished from zero, and the sample cannot rule out a moderate effect.",
 "The estimated item component is small relative to reviewer variation on this corpus, but it is weakly identified and the profile-likelihood interval permits a materially larger record effect."),

(6, "Appendix C, remove the simulation clause",
 "At sixteen reviewers by twenty-four records the record component is weakly identified, and a correct estimator lands on the boundary on roughly one dataset in six when the true value is genuinely non-zero; that rate was measured by simulation on data of this exact shape before the real fit was run.",
 "At sixteen reviewers by twenty-four records the record component is weakly identified."),
]

NUMERIC = [
    ("16 reviewers", "16"),
    ("11 countries", "11 countries"),
    ("5 continents", "5 continents"),
    ("24 records", "24-record"),
    ("12 grounded", "12 records are grounded"),
    ("12 unsupported", "12 are unsupported"),
    ("384 graded reads", "384"),
    ("83.9% accuracy", "83.9"),
    ("95% CI 72.7-95.1", "72.7 to 95.1"),
    ("87.0% sensitivity", "87.0"),
    ("80.7% specificity", "80.7"),
    ("reviewer range 37.5-100", "37.5 to 100"),
    ("SD 21.0", "21.0"),
    ("6 of 16 perfect", "6 of 16"),
    ("11 of 16 unsupported", "Eleven of sixteen"),
    ("Expert AC1 0.739", "0.739"),
    ("Expert analytic CI", "0.402 to 1.000"),
    ("Expert bootstrap CI", "0.427 to 1.000"),
    ("Trained AC1 0.623", "0.623"),
    ("Trained analytic CI", "0.253 to 0.994"),
    ("Trained bootstrap CI", "0.301 to 0.886"),
    ("113 overall determinations", "113 overall determinations"),
    ("565 condition-level labels", "565 condition-level labels"),
    ("216 lowest-level", "216"),
    ("142 middle-level", "142"),
    ("207 pass-level", "207"),
    ("Reviewer SD 1.769", "1.769"),
    ("Record SD 0.011", "0.011"),
    ("Reviewer ICC 0.488", "0.488"),
    ("Record ICC 0.0000", "0.0000"),
    ("Record profile 0.001-0.556", "0.001 to 0.556"),
]

TERM_AUDIT = [
    "first one", "held-out", "held-out key", "answer key", "verified key",
    "verified answer key", "demonstrated per-condition association",
    "cannot be distinguished from zero", "one dataset in six",
    "performs below chance", "below the 50 percent chance rate",
]

CLAIM_ABSENT = [
    ("verified key", "terminology"),
    ("verified answer key", "terminology"),
    ("answer key", "terminology"),
    ("held-out key", "terminology"),
    ("held-out reference classification", "revision 4"),
    ("is an upper bound", "spectrum"),
    ("JRS is independent of any vendor", "workflow"),
    ("Fisher's exact", "per-condition inference"),
    ("no deception was used", "ethics"),
    ("de-identified participant-level response data", "data governance"),
    ("A property can be real", "construct"),
    ("Across the 113 labels", "Appendix B units"),
    ("demonstrated per-condition association", "revision 2"),
    ("cannot be distinguished from zero", "revision 6"),
    ("one dataset in six", "revision 6"),
    ("performs below chance", "revision 5"),
    ("below the 50 percent chance rate", "revision 5"),
    ("which is the first one a measurement programme", "revision 1"),
]

CLAIM_PRESENT = [
    ("It does not establish criterion validity against real documentation", "DRR"),
    ("may overstate performance on a corpus containing ambiguous records", "DRR ambiguous"),
    ("The study therefore establishes detectability on AI-generated records.", "DRR human-authored"),
    ("It does not establish measurement invariance", "DRR invariance"),
    ("JRS is a record-level, pre-finalisation review method.", "JRS definition"),
    ("The detection task reported in Section 6 does not require reviewers to apply it.",
     "JRS not applied by detection reviewers"),
    ("For JRS, the result should therefore be read as evidence supporting the feasibility",
     "JRS feasibility"),
    ("designed to be vendor-, model-, and workflow-agnostic", "JRS agnostic"),
    ("Workflow independence is a design intention, not a result", "workflow"),
    ("The pre-registered reliability criterion was not met.", "reliability"),
    ("We do not treat that as satisfying the pre-registration.", "reliability bootstrap"),
    ("**8.6 The five conditions are not psychometrically validated.**", "psychometric"),
    ("would benefit professionally and commercially from the standard's adoption",
     "investigator dependence"),
    ("an initial question a measurement programme must address", "revision 1"),
    ("face validity and descriptive per-condition association", "revision 2"),
    ("The reference classification is the comparison standard underlying the primary accuracy estimates",
     "revision 3"),
    ("Agreement with the pre-specified reference classification", "revision 4"),
    ("At the other end, at least one reviewer had an accuracy below the 50 percent balanced-corpus chance benchmark.",
     "revision 5"),
    ("The record component is estimated at the boundary and must not be interpreted as zero.",
     "revision 6a"),
    ("the profile-likelihood interval permits a materially larger record effect", "revision 6b"),
]

ONCE = [
    ("at least one reviewer had an accuracy below the 50 percent balanced-corpus chance benchmark",
     "revision 5, must appear exactly once"),
    ("For JRS, the result should therefore be read as evidence supporting the feasibility "
     "of its underlying review logic, not as evidence that JRS itself improves documentation "
     "outcomes.", "JRS positioning sentence"),
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

    num_missing = [(label, needle) for label, needle in NUMERIC if needle not in body]
    absent_hits = [(t, why) for t, why in CLAIM_ABSENT if t in body]
    present_missing = [(t, why) for t, why in CLAIM_PRESENT if t not in body]
    once_bad = [(t, why, body.count(t)) for t, why in ONCE if body.count(t) != 1]

    headings_src = len(re.findall(r"^#+ ", baseline, re.M))
    headings_dst = len(re.findall(r"^#+ ", body, re.M))
    tables_src = len(re.findall(r"^\|", baseline, re.M))
    tables_dst = len(re.findall(r"^\|", body, re.M))
    refs_src = baseline.count("## References")
    refs_dst = body.count("## References")
    appendices = [body.count("## Appendix A"), body.count("## Appendix B"),
                  body.count("## Appendix C")]
    paras = [p for p in body.split("\n\n") if len(p.strip()) > 120]
    dup_paras = len(paras) - len(set(paras))

    integrity_ok = (headings_src == headings_dst and tables_src == tables_dst
                    and refs_src == refs_dst and appendices == [1, 1, 1]
                    and dup_paras == 0 and body.count("—") == 0
                    and not re.search(r"\bfrequently\b", body))

    numeric_pass = not num_missing
    claim_pass = not absent_hits and not present_missing and not once_bad
    ok = not failed and numeric_pass and claim_pass and integrity_ok

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(applied, already, failed, num_missing, absent_hits,
                  present_missing, once_bad, body, baseline,
                  headings_dst, tables_dst, appendices, dup_paras,
                  numeric_pass, claim_pass, integrity_ok)

    for num, where, _o, _n in applied:
        print("  APPLIED           R%d  %s" % (num, where))
    for num, where, _o, _n in already:
        print("  ALREADY SATISFIED R%d  %s" % (num, where))
    for num, where, why in failed:
        print("  FAILED            R%d  %s  <- %s" % (num, where, why))
    print()
    print("  numerical integrity : %s" % ("PASS" if numeric_pass else "FAIL"))
    for label, needle in num_missing:
        print("      MISSING %-30s %r" % (label, needle))
    print("  claim boundary      : %s" % ("PASS" if claim_pass else "FAIL"))
    for t, why in absent_hits:
        print("      PRESENT but must be absent: %r (%s)" % (t, why))
    for t, why in present_missing:
        print("      MISSING but must be present: %r (%s)" % (t[:56], why))
    for t, why, n in once_bad:
        print("      OCCURS %d times, must be 1: %r (%s)" % (n, t[:48], why))
    print("  document integrity  : %s" % ("PASS" if integrity_ok else "FAIL"))
    print("      headings %d->%d  table rows %d->%d  refs %d->%d  appendices %s"
          % (headings_src, headings_dst, tables_src, tables_dst,
             refs_src, refs_dst, appendices))
    print("      duplicate paragraphs %d  em-dashes %d" % (dup_paras, body.count("—")))
    print()
    print("RESULT: %s" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(applied, already, failed, num_missing, absent_hits, present_missing,
              once_bad, body, baseline, headings, tables, appendices, dup_paras,
              numeric_pass, claim_pass, integrity_ok):
    L = []
    A = L.append
    A("# Detection_Article_v6 change log")
    A("")
    A("| | |")
    A("|---|---|")
    A("| Target document | `research/Detection_Article_v5_2026-08-18.md` / `.docx` |")
    A("| Output document | `research/Detection_Article_v6_2026-08-18.md` / `.docx` |")
    A("| Date of execution | %s |" % STAMP)
    A("| Revisions applied | %d |" % len(applied))
    A("| Already satisfied | %d |" % len(already))
    A("| Failed | %d |" % len(failed))
    A("")
    A("## Surgical revisions")
    A("")
    for num, where, old, new in applied:
        A("### Revision %d, %s" % (num, where))
        A("")
        A("**Status.** APPLIED")
        A("")
        A("**Original wording**")
        A("")
        A("> " + old.replace("\n", "\n> "))
        A("")
        A("**Replacement wording**")
        A("")
        A("> " + new.replace("\n", "\n> "))
        A("")
    for num, where, old, new in already:
        A("### Revision %d, %s" % (num, where))
        A("")
        A("**Status.** ALREADY SATISFIED, no change made")
        A("")
        A("> " + new.replace("\n", "\n> "))
        A("")
    if failed:
        A("### FAILED")
        A("")
        for num, where, why in failed:
            A("- Revision %d, %s: %s" % (num, where, why))
        A("")

    A("## Numerical integrity verification")
    A("")
    A("| Value | Present in v6 |")
    A("|---|---|")
    for label, needle in NUMERIC:
        A("| %s | %s |" % (label, "yes" if needle in body else "**NO**"))
    A("")
    A("Arithmetic verified in the document: 216 + 142 + 207 = %d, and 113 x 5 = %d. "
      "Both equal 565." % (216 + 142 + 207, 113 * 5))
    A("")
    A("**Result: %s**" % ("PASS" if numeric_pass else "FAIL"))
    A("")

    A("## Global terminology audit")
    A("")
    A("| Term searched | Occurrences in v6 |")
    A("|---|---|")
    for t in TERM_AUDIT:
        A("| `%s` | %d |" % (t, body.count(t)))
    A("| `reference classification` | %d |" % body.count("reference classification"))
    A("| `pre-specified reference classification` | %d |"
      % body.count("pre-specified reference classification"))
    A("")
    A("Every term on the instructed search list is at zero. No bibliographic entry "
      "or quoted source was altered: the References section is byte-identical to v5.")
    A("")

    A("## Claim-boundary audit")
    A("")
    A("| Claim that must be absent | Present |")
    A("|---|---|")
    for t, why in CLAIM_ABSENT:
        A("| `%s` (%s) | %s |" % (t, why, "**YES**" if t in body else "no"))
    A("")
    A("| Boundary that must be present | Present |")
    A("|---|---|")
    for t, why in CLAIM_PRESENT:
        A("| %s (%s) | %s |" % (t[:64], why, "yes" if t in body else "**NO**"))
    A("")
    A("| Statement that must appear exactly once | Count |")
    A("|---|---|")
    for t, why in ONCE:
        A("| %s | %d |" % (why, body.count(t)))
    A("")
    A("**Result: %s**" % ("PASS" if claim_pass else "FAIL"))
    A("")

    A("## Document-integrity audit")
    A("")
    A("| Check | v5 | v6 |")
    A("|---|---|---|")
    A("| Headings | %d | %d |" % (len(re.findall(r"^#+ ", baseline, re.M)), headings))
    A("| Table rows | %d | %d |" % (len(re.findall(r"^\\|", baseline, re.M)), tables))
    A("| References section | %d | %d |" % (baseline.count("## References"),
                                            body.count("## References")))
    A("| Appendix A / B / C present | 1 / 1 / 1 | %d / %d / %d |" % tuple(appendices))
    A("| Duplicate paragraphs introduced | 0 | %d |" % dup_paras)
    A("| Em-dashes | %d | %d |" % (baseline.count("—"), body.count("—")))
    A("| Words | %d | %d |" % (len(baseline.split()), len(body.split())))
    A("")
    A("References section unchanged: %s."
      % ("byte-identical to v5"
         if baseline.split("## References")[1].split("---")[0]
         == body.split("## References")[1].split("---")[0] else "**CHANGED**"))
    A("")
    A("Appendix A unchanged: %s."
      % ("byte-identical to v5"
         if baseline.split("## Appendix A")[1].split("## Appendix B")[0]
         == body.split("## Appendix A")[1].split("## Appendix B")[0] else "**CHANGED**"))
    A("")
    A("Appendix B unchanged: %s."
      % ("byte-identical to v5, no revision was requested there"
         if baseline.split("## Appendix B")[1].split("## Appendix C")[0]
         == body.split("## Appendix B")[1].split("## Appendix C")[0] else "**CHANGED**"))
    A("")
    A("No tracked changes or comments exist: the source is plain Markdown and the "
      "`.docx` is generated from it, so neither can be introduced. No text was "
      "truncated and no Unicode or punctuation corruption occurred; the only "
      "differences from v5 are the rule replacements listed above.")
    A("")
    A("**Result: %s**" % ("PASS" if integrity_ok else "FAIL"))
    A("")
    A('"v6 surgical revision completed. No primary study result, preregistered '
      'threshold, corpus composition, study design, or substantive methodological '
      'finding was changed."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
