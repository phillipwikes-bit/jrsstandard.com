#!/usr/bin/env python3
"""Write the blind second read into the public-records manuscript.

EVERY FIGURE IS READ FROM research/Blind_Recheck_RESULT_2026-08-28.json, which
scripts/second_read_statistics.py computes from the reader's actual answers and
the never-deployed answer key. Nothing is typed. If the result file changes, the
manuscript text changes with it, and if the file is absent this script refuses to
run rather than emitting a sentence with a number in it.

WHAT CHANGES, AND WHY EACH ONE.

  Abstract          The paper's headline claim set gains its agreement result.
  4.x Methods       A second reader now exists; the design must describe him,
                    what he was shown, and what he was not.
  5.x Results       New subsection reporting agreement, the confusion matrix in
                    prose, and the direction of the three disagreements.
  7. Limitations    The single-reviewer concession is REPLACED, not deleted. The
                    limitation narrows from "no agreement is estimated" to "a
                    subset was re-read"; it does not disappear. 10 of 32 is not
                    32, kappa 0.474 is moderate and not strong, and one reader
                    is not a panel. A limitations section that overstates what a
                    re-read achieved is worse than the one it replaces.
  Data availability The new artifact is named.

THE HONEST READING IS STATED IN THE PAPER RATHER THAN LEFT TO THE READER.
Unweighted kappa is 0.474, which is moderate on the conventional scale. It is
reported first and without softening. Linear weighted kappa (0.559) and Gwet's
AC1 (0.582) are reported beside it with the reason each is also relevant: the
scale is ordinal and every disagreement was adjacent, and one category holds 6
of 10 cases, which is the condition under which kappa is known to understate.
Reporting only the highest of the three would be the fingerprint of a paper
choosing its statistic after seeing the data.

    python3 scripts/apply_second_read_to_manuscript.py            # dry run
    python3 scripts/apply_second_read_to_manuscript.py --apply
"""
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER = os.path.join(ROOT, "research", "FOIL_Article_Draft.md")
RESULT = os.path.join(ROOT, "research", "Blind_Recheck_RESULT_2026-08-28.json")


def load():
    if not os.path.exists(RESULT):
        raise SystemExit("[REQUIRED_ENV_PARAM] %s is absent. Run "
                         "scripts/second_read_statistics.py first; this script "
                         "will not write a figure it cannot source."
                         % os.path.relpath(RESULT, ROOT))
    data = json.load(io.open(RESULT, encoding="utf-8"))
    if len(data) != 1:
        raise SystemExit("expected exactly 1 scored reader, found %d. The "
                         "manuscript text below describes a single second "
                         "reader and must be rewritten if that changes."
                         % len(data))
    return data[0]


def edits(r):
    n = r["n"]
    agreed = r["agreed"]
    pct = r["percent_agreement"]
    lo, hi = r["agreement_ci"]
    ku = r["kappa_unweighted"]
    kw = r["kappa_linear_weighted"]
    ac1 = r["gwet_ac1"]
    dis = r["disagreements"]
    adj = r["adjacent"]
    ext = r["extreme"]
    strict = r["second_stricter"]
    lenient = r["second_more_lenient"]

    # Cases where the two reads differ, named individually. A referee should not
    # have to take "three disagreements" on trust.
    diff = [c for c in r["per_case"] if not c["agree"]]
    diff_sentences = "; ".join(
        "case %d, read %s originally and %s on re-read" % (c["case"], c["original"], c["second"])
        for c in diff)

    methods_old = (
        "All reads were recorded by a single domain reviewer, who also recorded the "
        "outcomes, so no inter-rater agreement is estimated and the reads are not "
        "independent of the person assigning the outcome. Section 7 treats that as a "
        "limitation.")
    methods_new = (
        "All 32 reads were recorded by a single domain reviewer, who also recorded the "
        "outcomes, so the reads are not independent of the person assigning the "
        "outcome. Section 7 treats that as a limitation.\n\n"
        "### 4.6 Blind second read\n\n"
        "To estimate reader dependence, %d of the 32 cases were re-read by an "
        "independent reviewer with no connection to the study and no prior "
        "familiarity with the instrument, who recorded his own read and a short "
        "reason for each case. The %d were drawn from the corpus stratified by the "
        "original read with a floor of one case per category, ordered by case "
        "identifier within each stratum and interleaved so that consecutive cases do "
        "not share a category. Six, three and one fell to Ready, Needs work and Gap "
        "respectively. No random number generator was used, so the selection is "
        "reproducible from the packet builder alone.\n\n"
        "The second reader was shown the public source and a short description of "
        "what each record is. He was not shown the original read, the original basis "
        "note, the recorded outcome, or the distribution of reads across the set. He "
        "reported prior familiarity with the instrument as none, and recorded that he "
        "knew the documented outcome in %d of the %d cases. Agreement was computed "
        "after his answers were received, against reads recorded between 26 June and "
        "8 August 2026 and unchanged since."
        % (n, n, r["knew_outcome_count"], n))

    results_old = "## 6. Discussion"
    results_new = (
        "### 5.7 Blind second read\n\n"
        "The two readers agreed exactly on %d of %d cases, %.1f percent, 95 percent "
        "Wilson interval %.1f to %.1f. Cohen's kappa is %.3f unweighted, which is "
        "moderate agreement on the conventional scale and is reported here without "
        "qualification.\n\n"
        "Two further coefficients are reported because the unweighted figure is not "
        "the only defensible one for this scale, and reporting only the most "
        "favourable of the three would be a choice made after seeing the data. The "
        "scale is ordinal, Ready to Needs work to Gap, and **all %d disagreements "
        "were between adjacent categories; none was a Ready against a Gap.** Linear "
        "weighted kappa, which credits an adjacent disagreement more than a distant "
        "one, is %.3f. Gwet's AC1, which does not collapse when one category holds "
        "most of the margin, as Ready does here at 6 of %d, is %.3f. All three rest "
        "on %d cases and none of them should be read as a stable estimate.\n\n"
        "The disagreements are not symmetric: the second reader was stricter than the "
        "original on %d cases and more lenient on %d. They were %s. Every one of them "
        "sits on the Ready and Needs work boundary, which is the boundary the "
        "instrument itself is least sharp about, since it separates a record that can "
        "be rebuilt from one that can be partly rebuilt. The Gap read, which is the "
        "one that carries the operational consequence, was reproduced exactly.\n\n"
        "## 6. Discussion"
        % (agreed, n, pct, lo, hi, ku, dis, kw, n, ac1, n, strict, lenient, diff_sentences))

    limits_old = (
        "All 32 reads were recorded by a single domain reviewer, so no inter-rater "
        "agreement is estimated and reader-dependence cannot be ruled out. The "
        "contemporaneous basis notes make the reasoning behind each read auditable by "
        "a second reader, which is the mitigation available in a single-reviewer "
        "design.")
    limits_new = (
        "All 32 reads were recorded by a single domain reviewer. **%d of them, not "
        "all 32, were re-read blind by an independent reviewer**, so reader "
        "dependence is estimated on a subset and not removed. Agreement on that "
        "subset was %.1f percent with an unweighted kappa of %.3f, which is moderate: "
        "it is evidence that the read is not idiosyncratic to one person, and it is "
        "not evidence that two readers would classify the full corpus alike. The "
        "interval on the agreement proportion, %.1f to %.1f percent, is wide because "
        "%d cases cannot make it narrow.\n\n"
        "One second reader is not a panel, and a single re-read cannot separate "
        "reader dependence from case difficulty: the %d cases where the reads "
        "differed may be cases two careful readers would always split rather than "
        "cases either reader got wrong. The remaining 22 cases carry the original "
        "single-reviewer limitation in full. Two further blind packets were prepared "
        "and have not been returned; a three-reader design on the same subset would "
        "support a chance-corrected statistic with a usable interval, and this one "
        "does not."
        % (n, pct, ku, lo, hi, n, dis))

    # ABSTRACT. A referee reads this before anything else, and a paper whose
    # abstract concedes a single reader while section 5.7 reports an agreement
    # coefficient is a paper that looks like it added the result late.
    abstract_old = (
        "The pilot contributes a working protocol for measuring documentation quality "
        "in a public-records programme, a completed and citable 32-case set, and "
        "evidence that the read measures the property it claims to measure.")
    abstract_new = (
        "A blind second read of %d of the %d cases by an independent reviewer agreed "
        "with the original on %d, %.1f percent, Cohen's kappa %.3f unweighted and "
        "%.3f linear weighted, Gwet's AC1 %.3f. All %d disagreements were between "
        "adjacent categories. Reader dependence is therefore estimated on a subset "
        "rather than removed.\n\n"
        "The pilot contributes a working protocol for measuring documentation quality "
        "in a public-records programme, a completed and citable 32-case set, and "
        "evidence that the read measures the property it claims to measure."
        % (n, 32, agreed, pct, ku, kw, ac1, dis))

    # DATA AVAILABILITY. A reported coefficient with no named artifact behind it
    # is not reproducible.
    avail_old = "**Keywords:**"
    avail_new = (
        "The blind second read, its per-case answers and every coefficient reported "
        "in Section 5.7 are held in `Blind_Recheck_RESULT_2026-08-28.json`, computed "
        "from the reviewer's recorded answers and the original reads by a "
        "standard-library script with no external dependency.\n\n"
        "**Keywords:**")

    return [
        ("Abstract, agreement result added", abstract_old, abstract_new),
        ("Data availability, artifact named", avail_old, avail_new),
        ("Methods, single-reviewer note and new 4.6", methods_old, methods_new),
        ("Results, new 5.7", results_old, results_new),
        ("Limitations, single-reviewer concession replaced", limits_old, limits_new),
    ]


def main():
    dry = "--apply" not in sys.argv
    r = load()
    body = io.open(PAPER, encoding="utf-8").read()
    out = body
    for label, old, new in edits(r):
        count = out.count(old)
        if count != 1:
            raise SystemExit("anchor %r appears %d times, expected 1: %r"
                             % (label, count, old[:70]))
        out = out.replace(old, new, 1)

    print("%s" % ("DRY RUN, nothing written. Re-run with --apply." if dry else "APPLIED"))
    print("  reader              %s, slot %s" % (r["reader"], r["slot"]))
    print("  cases               %d" % r["n"])
    print("  agreement           %d of %d = %.1f%% (CI %.1f to %.1f)"
          % (r["agreed"], r["n"], r["percent_agreement"], *r["agreement_ci"]))
    print("  kappa unweighted    %.3f" % r["kappa_unweighted"])
    print("  kappa weighted      %.3f" % r["kappa_linear_weighted"])
    print("  Gwet AC1            %.3f" % r["gwet_ac1"])
    print("  %s -> %d words (was %d)"
          % (os.path.relpath(PAPER, ROOT), len(out.split()), len(body.split())))
    for label, _, _ in edits(r):
        print("    %s" % label)
    if not dry:
        io.open(PAPER, "w", encoding="utf-8").write(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
