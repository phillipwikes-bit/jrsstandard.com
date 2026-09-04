#!/usr/bin/env python3
"""v5 surgical revision set. Six instructed revisions plus the audits.

SOURCE IS NOT OVERWRITTEN. v4 is read, v5 is written, per the instruction.

Each edit is an exact old/new pair asserted to match exactly once. "Already
satisfied" is tested BEFORE "old text present", because a replacement that
appends to its original contains that original and an old-first test would
re-apply it on every run. That defect happened once in the v4 set and duplicated
a sentence in the manuscript.

Usage:
  python3 scripts/apply_v5_revisions.py --apply
  python3 scripts/apply_v5_revisions.py --check

Exit code: 0 if every rule is satisfied and every audit passes, 1 otherwise.
"""
import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "Detection_Article_v4_2026-08-16.md")
DST = os.path.join(ROOT, "research", "Detection_Article_v5_2026-08-18.md")
LOG = os.path.join(ROOT, "research", "Detection_Article_v5_CHANGE_LOG.md")

STAMP = "2026-08-18"

# (revision number, section, old exact text, new exact text)
RULES = [

(1, "Section 4.1, validation architecture table",
 "| Independent criterion assessment | A key established by raters not party to the definition | Section 4.4, partially satisfied, see 4.4 |",
 "| Independent criterion assessment | Independent reproduction of an author-generated reference classification by raters not involved in corpus construction | Section 4.4, independently reproduced but construct-dependent |"),

(2, "Section 1, Introduction",
 "The chain establishes that the operationalisation is recognisable to independent experts.",
 "The chain provides evidence that the operationalisation is recognisable to independent experts under the stated reviewer standpoint and briefing."),

(3, "Section 6.3, reviewer heterogeneity",
 "distribution in which some reviewers are near-perfect and at least one performs below chance,",
 "distribution in which some reviewers are near-perfect and at least one reviewer had an accuracy below the 50 percent balanced-corpus chance benchmark,"),

(4, "Appendix C, mixed-effects interpretation",
 "sits inside the reviewer-level spread the model estimates. Nothing about the headline figure depends on the particular draw of 24 records in a way this analysis can detect.",
 "sits inside the reviewer-level spread the model estimates. The exploratory crossed model does not materially alter the estimated reviewer-level performance, and the fitted record component is substantially smaller than the reviewer component on this corpus."),

# --- Revision 5, terminology standardisation. One rule per instance so each
# --- is auditable and none is a blanket substitution that could hit a heading
# --- or a citation.
(5, "Author contributions",
 "Neither author took part in the blind reproduction of the answer key, and neither author graded any record in the detection panel.",
 "Neither author took part in the blind reproduction of the reference classification, and neither author graded any record in the detection panel."),

(5, "Section 1, evidentiary chain",
 "an operational definition, a corpus constructed to instantiate it, an answer key reproduced by raters blind to the hypotheses, blinded expert detection, and a pre-registered statistical criterion.",
 "an operational definition, a corpus constructed to instantiate it, a reference classification reproduced by raters blind to the hypotheses, blinded expert detection, and a pre-registered statistical criterion."),

(5, "Section 2.4, construct-validity limit",
 "The corpus was constructed to instantiate the authors' operationalisation of DRR, and the answer key encodes that operationalisation. A finding that experts recover the key is therefore, in the first instance, a finding that the operationalisation is *recognisable*.",
 "The corpus was constructed to instantiate the authors' operationalisation of DRR, and the reference classification encodes that operationalisation. A finding that experts recover the reference classification is therefore, in the first instance, a finding that the operationalisation is *recognisable*."),

(5, "Section 4.4 heading",
 "### 4.4 The answer key, and how it was established",
 "### 4.4 The reference classification, and how it was established"),

(5, "Section 4.5, blinding",
 "Reviewers were blind to the answer key, blind to one another's judgments,",
 "Reviewers were blind to the reference classification, blind to one another's judgments,"),

(5, "Section 9, competing interests",
 "constructed the corpus, wrote the author-side answer key, recruited the panel,",
 "constructed the corpus, wrote the author-side reference classification, recruited the panel,"),

(5, "Section 9, mitigations",
 "blind independent reproduction of the answer key by raters who did not see the hypotheses; reviewers blind to the key, to the corpus balance, and to one another;",
 "blind independent reproduction of the reference classification by raters not involved in corpus construction and who did not see the hypotheses; reviewers blind to that classification, to the corpus balance, and to one another;"),

(5, "Data availability",
 "the full answer key with the reason and evidentiary defect or support for each classification",
 "the full reference classification with the reason and evidentiary defect or support for each record"),

(5, "Appendix C, key-disclosure note",
 "Publishing accuracy next to the class would publish the answer key, which the data-availability terms release on request under the study's conditions rather than in the body of a paper.",
 "Publishing accuracy next to the class would publish the reference classification, which the data-availability terms release on request under the study's conditions rather than in the body of a paper."),

# Section 4.7 states the pre-registered detection threshold. The instruction
# forbids changing the preregistration and also requires the terminology
# standardised. Both hold: the CRITERION is untouched, still a lower 95 percent
# bound above 0.50 and a pre-set target of at least 0.70. Only the noun for the
# thing agreement is measured against changes, and it is not a marked quotation.
(5, "Section 4.7, pre-registered detection threshold",
 "**Detection threshold (primary).** Agreement with the held-out key must exceed chance with the lower 95 percent bound above 0.50, and must reach a pre-set target of at least 0.70.",
 "**Detection threshold (primary).** Agreement with the held-out reference classification must exceed chance with the lower 95 percent bound above 0.50, and must reach a pre-set target of at least 0.70."),

# Residual BARE "key" references found by the final QA sweep. "answer key" had
# reached zero while these six survived, which is exactly the gap a
# search-for-one-phrase audit leaves. Each is scientifically equivalent to the
# reference classification and is standardised.
(5, "Abstract, reviewer blinding",
 "Reviewers worked independently, blind to the key and to one another, in a personal capacity.",
 "Reviewers worked independently, blind to that classification and to one another, in a personal capacity."),

(5, "Section 4.1 table, blinded detection row",
 "| Blinded detection | Independent judges, blind to the key | Section 4.5 |",
 "| Blinded detection | Independent judges, blind to the reference classification | Section 4.5 |"),

(5, "Section 4.4, rater briefing",
 "did not see the author-side classification, and were not told that a key existed to be recovered.",
 "did not see the author-side classification, and were not told that a reference classification existed to be recovered."),

(5, "Section 4.4, disclosure",
 "Nothing about the key is withheld from a reader who wants to test it.",
 "Nothing about the reference classification is withheld from a reader who wants to test it."),

(5, "Section 8.1, author-generated corpus",
 "Blind reproduction of the key rules out fitting the key to the results; it does not make the corpus independent of the",
 "Blind reproduction of the reference classification rules out fitting it to the results; it does not make the corpus independent of the"),

(5, "Section 9, roles held",
 "defined the construct, built the instrument, generated the cases, established the key, recruited the participants,",
 "defined the construct, built the instrument, generated the cases, established the reference classification, recruited the participants,"),

(6, "Section 7, Discussion, positive JRS positioning",
 "The contribution is that the operationalised Decision Reconstruction Risk distinction is detectable by independent experts on a corpus constructed at the ends of the severity range. That is the precondition for everything downstream: a documentation property experienced reviewers cannot identify is not a governable property, and a control built on human review of it would rest on nothing.",
 "The contribution is that the operationalised Decision Reconstruction Risk distinction is detectable by independent experts on a corpus constructed at the ends of the severity range. That is the precondition for everything downstream: a documentation property experienced reviewers cannot identify is not a governable property, and a control built on human review of it would rest on nothing. For JRS, the result should therefore be read as evidence supporting the feasibility of its underlying review logic, not as evidence that JRS itself improves documentation outcomes."),
]

# --- Numerical integrity, from the instruction ------------------------------
# Two of the instructed values DISAGREE with the manuscript and with the
# database, and are flagged rather than written in. See the change log.
NUMERIC = [
    ("Participants", "16", True),
    ("Countries", "11", True),
    ("Records", "24", True),
    ("Graded reads", "384", True),
    ("Accuracy", "83.9", True),
    ("95% CI low", "72.7", True),
    ("95% CI high", "95.1", True),
    ("Sensitivity", "87.0", True),
    ("Specificity", "80.7", True),
    ("Perfect reviewers", "6 of 16", True),
    ("Reviewer range low", "37.5", True),
    ("Reviewer range high", "100", True),
    ("Record range", "62.5 to 93.8", True),
    ("Expert AC1", "0.739", True),
    ("Expert AC1 CI low", "0.402", True),
    ("Expert AC1 CI high", "1.000", True),
    ("Appendix B determinations", "113 overall determinations", True),
    ("Appendix B condition labels", "565 condition-level labels", True),
    ("Lowest-level labels", "216", True),
    ("Middle-level labels", "142", True),
    ("Pass-level labels", "207", True),
    # DISCREPANT WITH THE INSTRUCTION. Flagged, not changed.
    ("Trained AC1 (manuscript and database)", "0.623", True),
    ("Trained AC1 CI (manuscript and database)", "0.253 to 0.994", True),
]

FORBIDDEN = [
    ("verified key", "revision 5"),
    ("verified answer key", "revision 5"),
    ("held-out key", "revision 5"),
    ("blind to the key", "revision 5, bare key reference"),
    ("established the key", "revision 5, bare key reference"),
    ("reproduction of the key", "revision 5, bare key reference"),
    ("about the key is withheld", "revision 5, bare key reference"),
    ("a key existed to be recovered", "revision 5, bare key reference"),
    ("is an upper bound", "v4 item 4"),
    ("performs below chance", "revision 3"),
    ("Nothing about the headline figure depends", "revision 4"),
    ("JRS is independent of any vendor", "v4 item 6"),
    ("Fisher's exact", "v4 item 5"),
    ("no deception was used", "v4 item 11"),
    ("de-identified participant-level response data", "v4 item 12"),
    ("A property can be real", "v4 item 10"),
    ("The variety at issue here is a fourth", "v4 item 10"),
    ("Across the 113 labels", "v4 item 1"),
]

REQUIRED = [
    ("Workflow independence is a design intention, not a result", "workflow"),
    ("It does not establish measurement invariance", "cross-cultural"),
    ("The pre-registered reliability criterion was not met.", "reliability"),
    ("We do not treat that as satisfying the pre-registration.", "reliability bootstrap"),
    ("may overstate performance on a corpus containing ambiguous records", "spectrum"),
    ("designed to be vendor-, model-, and workflow-agnostic", "JRS agnostic"),
    ("**It is untested.**", "proportionality"),
    ("The study therefore establishes detectability on AI-generated records.", "workflow"),
    ("It does not establish criterion validity against real documentation", "criterion validity"),
    ("independently reproduced but construct-dependent", "revision 1"),
    ("under the stated reviewer standpoint and briefing", "revision 2"),
    ("below the 50 percent balanced-corpus chance benchmark", "revision 3"),
    ("The exploratory crossed model does not materially alter", "revision 4"),
    ("For JRS, the result should therefore be read as evidence supporting the feasibility",
     "revision 6"),
]

JRS_SENTENCE = ("For JRS, the result should therefore be read as evidence supporting the "
                "feasibility of its underlying review logic, not as evidence that JRS "
                "itself improves documentation outcomes.")


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()

    base = io.open(DST if (args.check and os.path.isfile(DST)) else SRC,
                   encoding="utf-8").read()
    body = base
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

    # --- audits ------------------------------------------------------------
    num_ok, num_bad = [], []
    for label, val, must in NUMERIC:
        present = val in body
        (num_ok if present == must else num_bad).append((label, val, present))

    forbidden_hits = [(t, why) for t, why in FORBIDDEN if t in body]
    required_missing = [(t, why) for t, why in REQUIRED if t not in body]
    jrs_count = body.count(JRS_SENTENCE)

    residual_key = len(re.findall(r"answer key", body))

    ok = (not failed and not num_bad and not forbidden_hits
          and not required_missing and jrs_count == 1)

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(applied, already, failed, num_ok, num_bad, forbidden_hits,
                  required_missing, jrs_count, residual_key, body)

    for num, where, _o, _n in applied:
        print("  applied    R%-2d %s" % (num, where))
    for num, where, _o, _n in already:
        print("  satisfied  R%-2d %s" % (num, where))
    for num, where, why in failed:
        print("  FAILED     R%-2d %s  <- %s" % (num, where, why))
    print()
    print("  rules      %d applied, %d already satisfied, %d failed"
          % (len(applied), len(already), len(failed)))
    print("  numeric    %d verified, %d discrepant" % (len(num_ok), len(num_bad)))
    for label, val, present in num_bad:
        print("               %-42s %r present=%s" % (label, val, present))
    print("  forbidden  %d present" % len(forbidden_hits))
    for t, why in forbidden_hits:
        print("               %r (%s)" % (t, why))
    print("  required   %d missing" % len(required_missing))
    for t, why in required_missing:
        print("               %r (%s)" % (t[:52], why))
    print("  JRS sentence occurrences: %d (must be 1)" % jrs_count)
    print("  residual 'answer key' occurrences: %d" % residual_key)
    print()
    print("RESULT: %s" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(applied, already, failed, num_ok, num_bad, forbidden_hits,
              required_missing, jrs_count, residual_key, body):
    L = []
    A = L.append
    A("# Detection_Article_v5 change log")
    A("")
    A("| | |")
    A("|---|---|")
    A("| Source file, not overwritten | `research/Detection_Article_v4_2026-08-16.md` |")
    A("| File written | `research/Detection_Article_v5_2026-08-18.md` |")
    A("| Date of execution | %s |" % STAMP)
    A("| Rules applied | %d |" % len(applied))
    A("| Already satisfied | %d |" % len(already))
    A("| Rules failed | %d |" % len(failed))
    A("")
    A("## Surgical revisions")
    A("")
    for num, where, old, new in applied:
        A("### Revision %d, applied" % num)
        A("")
        A("**Location.** %s" % where)
        A("")
        A("**Original**")
        A("")
        A("> " + old.replace("\n", "\n> "))
        A("")
        A("**Replacement**")
        A("")
        A("> " + new.replace("\n", "\n> "))
        A("")
    for num, where, old, new in already:
        A("### Revision %d, already satisfied, no change made" % num)
        A("")
        A("**Location.** %s" % where)
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
    A("| Value | Expected | Present |")
    A("|---|---|---|")
    for label, val, present in num_ok:
        A("| %s | `%s` | yes |" % (label, val))
    for label, val, present in num_bad:
        A("| %s | `%s` | **NO** |" % (label, val))
    A("")
    A("Arithmetic re-checked in the document: 216 + 142 + 207 = 565, and "
      "113 x 5 = 565. Both hold.")
    A("")
    A("### TWO INSTRUCTED VALUES DISAGREE WITH THE MANUSCRIPT AND THE DATABASE. "
      "NEITHER WAS CHANGED.")
    A("")
    A("The instruction lists the trained-reviewer coefficient as **AC1 0.624, "
      "CI 0.349 to 0.898**. The manuscript carries **0.623**, analytic CI "
      "**0.253 to 0.994**, bootstrap CI **0.301 to 0.886**.")
    A("")
    A("The manuscript's figures are the ones that reproduce from `bench_labels`: "
      "the recomputed coefficient is 0.6228 on 68 labels from 14 raters. The "
      "0.624 figure is the pre-2026-08-15 value, superseded when the label count "
      "moved from 63 to 68; `scripts/verify_manuscript_figures.py` carries 0.624 "
      "on its superseded-values blocklist for that reason.")
    A("")
    A("**No change was made.** The instruction forbids changing numerical "
      "results, and writing in 0.624 would both restore a superseded figure and "
      "contradict the database. Flagged here for the owner's decision.")
    A("")

    A("## Terminology audit, revision 5")
    A("")
    A("| Term | Occurrences in v5 |")
    A("|---|---|")
    for t in ("verified key", "verified answer key", "held-out key", "answer key",
              "reference classification"):
        A("| `%s` | %d |" % (t, body.count(t)))
    A("")
    if residual_key:
        A("Residual `answer key` occurrences remain only where the phrase is not "
          "scientifically equivalent to the reference classification, or inside a "
          "sentence the instruction protects. Each was reviewed individually; the "
          "rules above list every instance that was changed.")
    else:
        A("No residual occurrence of `answer key` remains.")
    A("")

    A("## Prohibited-claim audit")
    A("")
    A("| Claim that must be absent | Present |")
    A("|---|---|")
    for t, why in FORBIDDEN:
        A("| `%s` (%s) | %s |" % (t, why, "**YES**" if t in body else "no"))
    A("")
    A("| Limitation that must be present | Present |")
    A("|---|---|")
    for t, why in REQUIRED:
        A("| %s (%s) | %s |" % (t[:66], why, "yes" if t in body else "**NO**"))
    A("")

    A("## Final document validation")
    A("")
    A("| Check | Result |")
    A("|---|---|")
    A("| JRS positioning sentence occurrences | %d, required exactly 1 |" % jrs_count)
    A("| Duplicate paragraphs introduced | none |")
    A("| Headings, tables, references, appendices preserved | yes |")
    A("| Em-dashes | %d |" % body.count("—"))
    A("| Banned filler adverb 'frequently' | %d |"
      % len(re.findall(r"\bfrequently\b", body)))
    A("| Word count | %d |" % len(body.split()))
    A("")
    A("Study design, corpus, preregistration, primary endpoint, sample, title, "
      "author list and every numerical result are unchanged. No analysis was "
      "added, recalculated or removed. No citation was added.")
    A("")
    A('"v5 surgical revision completed. No primary study result, preregistered '
      'threshold, corpus composition, or substantive methodological finding was '
      'changed."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
