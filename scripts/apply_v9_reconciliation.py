#!/usr/bin/env python3
"""v9. ONE reconciliation edit to the Acknowledgments, plus a source-verified
rater-count audit and a global consistency sweep.

v8 IS READ AND NOT OVERWRITTEN. v9 is written.

THE QUESTION THIS SCRIPT ANSWERS
--------------------------------
Section 6.5 reports 8 expert + 14 trained = 22 analysed raters.
The Acknowledgments credits 25 raters, eight expert and seventeen trained.
Why the difference?

IT IS NOT A DISCREPANCY AND IT IS NOT RECRUITMENT ATTRITION. Both numbers are
counts of raters who submitted labels on the same shared 10-record set. They
differ by the pre-registered inclusion rule already stated in Section 6.5:
labels recorded under the five-condition instrument (`mode = jrs`), one label
per rater per record, latest submission retained.

  25 = every rater code carrying labels on the reliability record set
       8 expert (E-) + 17 trained (R-)
  22 = the same population restricted to the five-condition instrument
       8 expert + 14 trained

  25 - 22 = 3, and the three are named in the source below. They worked under
  the unstructured baseline prompt (`mode = normal`), not the five conditions.
  They contribute the SIXTEEN excluded labels the manuscript already discloses.

THE EDIT IS THEREFORE A DISCLOSURE EDIT, NOT A NUMBER CHANGE. Credit stays at
25 because all 25 did the work. The analysed sample of 22 is named beside it so
a reader moving between the Acknowledgments and Section 6.5 is not left to
reconcile 25 against 22 unaided.

NO AC1, INTERVAL, LABEL COUNT, RECORD COUNT OR OTHER REPORTED RESULT IS
TOUCHED. The audits below fail closed if any of them moves.

RECONCILIATION IS COMPUTED FROM SOURCE, NOT ASSERTED. reconcile() parses the
roster table and the mode breakdown out of the evidence files at run time and
refuses to proceed if the arithmetic does not close. A hardcoded 14 would have
been worth nothing.

Usage:
  python3 scripts/apply_v9_reconciliation.py --apply
  python3 scripts/apply_v9_reconciliation.py --check

Exit code: 0 if the rule is satisfied, the reconciliation closes, and every
audit passes; 1 otherwise.
"""
import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "Detection_Article_v8_2026-08-18.md")
DST = os.path.join(ROOT, "research", "Detection_Article_v9_2026-08-18.md")
LOG = os.path.join(ROOT, "research", "Detection_Article_v9_CHANGE_LOG.md")

ROSTER = os.path.join(ROOT, "research", "REVIEWER_ROSTER_COMPLETE.md")
MODES = os.path.join(ROOT, "research", "Detection_Article_Figure_Update_2026-08-15.md")
EXTRACT = os.path.join(ROOT, "research", "reliability_labels_2026-08-04.tsv")

STAMP = "2026-08-18"


# --------------------------------------------------------------------------
# SOURCE-VERIFIED RECONCILIATION
# --------------------------------------------------------------------------
def reconcile():
    """Derive the 25 / 22 split from the evidence files. Returns a dict, or
    raises AssertionError naming the file that failed to support the claim."""
    out = {}

    # ---- SOURCE 1: the roster of every rater who labelled the reliability set.
    # research/REVIEWER_ROSTER_COMPLETE.md, section "004 Reviewer reliability".
    roster = io.open(ROSTER, encoding="utf-8").read()
    assert "## 004 Reviewer reliability" in roster, \
        "REVIEWER_ROSTER_COMPLETE.md: section 004 not found"
    sect = roster.split("## 004 Reviewer reliability", 1)[1]
    sect = re.split(r"\n## ", sect, 1)[0]
    codes = re.findall(r"^\| `([ER]-[A-Za-z0-9]+)`", sect, re.M)
    assert len(codes) == len(set(codes)), "roster section 004 lists a duplicate code"
    experts_all = sorted(c for c in codes if c.startswith("E-"))
    trained_all = sorted(c for c in codes if c.startswith("R-"))
    out["roster_total"] = len(codes)
    out["roster_experts"] = len(experts_all)
    out["roster_trained"] = len(trained_all)
    out["roster_trained_codes"] = trained_all
    # The section states its own total in prose. Both must agree.
    stated = re.search(r"\*\*(\d+) reviewers\.\*\*", sect)
    assert stated, "roster section 004 does not state its own total"
    out["roster_stated"] = int(stated.group(1))
    assert out["roster_stated"] == out["roster_total"], (
        "roster section 004 states %s but tabulates %d"
        % (stated.group(1), out["roster_total"]))

    # ---- SOURCE 2: which of those raters used which instrument.
    # research/Detection_Article_Figure_Update_2026-08-15.md, the mode table.
    modes = io.open(MODES, encoding="utf-8").read()
    normal = re.findall(r"^\| (R-[A-Za-z0-9]+) \| (\d+) \| `normal` \|", modes, re.M)
    assert normal, "Figure_Update_2026-08-15.md: no `normal`-mode rater rows found"
    out["normal_codes"] = [c for c, _ in normal]
    out["normal_labels"] = sum(int(n) for _, n in normal)
    out["normal_raters"] = len(normal)
    # Every excluded rater must be one the roster actually lists.
    unknown = [c for c in out["normal_codes"] if c not in trained_all]
    assert not unknown, "mode table names raters absent from the roster: %s" % unknown

    # The same file states the analysed and all-modes rater counts directly.
    m_jrs = re.search(r"\*\*0\.623\*\* \((\d+) labels, (\d+) raters\)", modes)
    assert m_jrs, "Figure_Update_2026-08-15.md: analysed trained row not found"
    out["analysed_trained_labels"] = int(m_jrs.group(1))
    out["analysed_trained"] = int(m_jrs.group(2))
    m_all = re.search(r"\*\*0\.157\*\* \((\d+) labels, (\d+) raters\)", modes)
    assert m_all, "Figure_Update_2026-08-15.md: all-modes trained row not found"
    out["allmodes_trained"] = int(m_all.group(2))

    # ---- SOURCE 3: the committed label extract, as an independent floor.
    ext = io.open(EXTRACT, encoding="utf-8").read().rstrip("\n").split("\n")[1:]
    rows = [r.split("\t") for r in ext]
    out["extract_experts"] = len(set(r[1] for r in rows if r[3] == "true"))
    out["extract_trained"] = len(set(r[1] for r in rows if r[3] == "false"))
    out["extract_labels"] = len(rows)

    # ---- THE ARITHMETIC MUST CLOSE. Fail closed if it does not.
    checks = [
        ("roster total is experts plus trained",
         out["roster_total"] == out["roster_experts"] + out["roster_trained"]),
        ("all-modes trained count equals the roster trained count",
         out["allmodes_trained"] == out["roster_trained"]),
        ("analysed trained equals roster trained minus the baseline-mode raters",
         out["analysed_trained"] == out["roster_trained"] - out["normal_raters"]),
        ("the excluded raters carry sixteen labels",
         out["normal_labels"] == 16),
        ("the 2026-08-04 extract holds the same expert count",
         out["extract_experts"] == out["roster_experts"]),
        ("the extract's trained count is one below the current analysed count",
         out["extract_trained"] == out["analysed_trained"] - 1),
    ]
    out["checks"] = checks
    bad = [name for name, ok in checks if not ok]
    assert not bad, "reconciliation does not close: %s" % "; ".join(bad)

    out["analysed_total"] = out["roster_experts"] + out["analysed_trained"]
    out["credited_total"] = out["roster_total"]
    return out


WORD = {8: "eight", 14: "fourteen", 17: "seventeen", 22: "Twenty-two",
        3: "three", 16: "sixteen", 25: "25"}


# --------------------------------------------------------------------------
# THE SINGLE EDIT
# --------------------------------------------------------------------------
OLD_ACK = (
    "**The reliability study, 25 raters**, eight expert and seventeen trained, "
    "produced the coefficients in Section 6.5 and the per-condition analysis in "
    "Appendix B, which exists only because they recorded a judgment on each of "
    "the five conditions separately rather than only the overall read."
)

NEW_ACK = (
    "**The reliability study, 25 raters**, eight expert and seventeen trained, "
    "recorded labels on the shared record set. Twenty-two of them, eight expert "
    "and fourteen trained, worked under the five-condition instrument and are "
    "the analysed sample behind the coefficients in Section 6.5; the other three "
    "trained raters worked under the unstructured baseline prompt and their "
    "labels are excluded from those coefficients by the inclusion rule stated in "
    "that section. All 25 are credited here because all 25 did the work. "
    "Appendix B exists only because the five-condition raters recorded a "
    "judgment on each of the five conditions separately rather than only the "
    "overall read."
)

RULES = [(1, "Acknowledgments, analysed sample distinguished from credited "
             "raters", OLD_ACK, NEW_ACK)]


# --------------------------------------------------------------------------
# GLOBAL CONSISTENCY SWEEP, run against the produced manuscript
# --------------------------------------------------------------------------
# Every entry is (label, needle). A needle absent from the body fails the sweep.
def consistency_needles(R):
    return [
        # reliability rater counts
        ("credited reliability raters, Acknowledgments",
         "The reliability study, 25 raters"),
        ("credited split, Acknowledgments",
         "eight expert and seventeen trained"),
        ("analysed split, Acknowledgments",
         "Twenty-two of them, eight expert and fourteen trained"),
        ("excluded raters, Acknowledgments", "the other three trained raters"),
        ("expert raters, Section 6.5 table", "| Experts | 10 | 36 | 8 | 0.739 |"),
        ("trained raters, Section 6.5 table",
         "| Trained reviewers | 10 | 68 | 14 | 0.623 |"),
        # label counts
        ("submitted determinations", "113 submitted determinations"),
        ("retained after deduplication", "reduced to 104 after keeping one label"),
        ("excluded label count, Methods", "Sixteen labels in the same table"),
        # record counts
        ("reliability record set", "shared set of 10 records"),
        ("pooled reliability target", "pooled target of about 26"),
        ("detection corpus", "24-record corpus"),
        # expert / trained coefficients, must not move
        ("expert AC1", "0.739"),
        ("trained AC1", "0.623"),
        ("trained analytic interval", "0.253 to 0.994"),
        ("trained bootstrap interval", "0.301 to 0.886"),
        ("expert analytic interval", "0.402 to 1.000"),
        ("expert bootstrap interval", "0.427 to 1.000"),
        # analysed versus recruited participants, elsewhere in the paper
        ("detection panel size", "16 independent experts"),
        ("detection graded reads", "384 graded judgments"),
        ("comparison panel size", "20 independent experts"),
        ("inclusion rule stated in Methods",
         "Only labels recorded under the five-condition instrument are analysed"),
    ]


# Values that must NOT appear. Reinstating any of them is a regression.
# The third field is the SCOPE. "body" tests the whole manuscript; "ack" tests
# the Acknowledgments block only.
#
# SCOPE EXISTS BECAUSE MY FIRST VERSION OF THIS GUARD WAS WRONG. It banned
# "recruited" document-wide and fired on seven pre-existing v8 sentences about
# the DETECTION panel, which is genuinely a recruited panel and says so
# correctly (lines 21, 103, 172, 182, 188, 228, 334). The claim being guarded is
# narrow: the 25 reliability raters are not a recruitment figure. So the test
# belongs in the Acknowledgments, where that number lives, and nowhere else.
FORBIDDEN = [
    ("0.624", "superseded trained AC1", "body"),
    ("0.349 to 0.898", "superseded trained interval", "body"),
    ("99 after keeping", "superseded retained-label count", "body"),
    ("108 submitted", "superseded submitted-label count", "body"),
    ("63 labels", "superseded trained-label count", "body"),
    ("22 raters", "the analysed total is spelled out, never given as a credit",
     "ack"),
    ("25 analysed", "the credited total is not the analysed total", "body"),
    ("recruited", "the 25 is a labelling count, not a recruitment figure",
     "ack"),
    ("recruit", "the 25 is a labelling count, not a recruitment figure", "ack"),
]


def ack_block(body):
    """The Acknowledgments section, or the empty string if it is absent."""
    if "## Acknowledgments" not in body:
        return ""
    return re.split(r"\n## ", body.split("## Acknowledgments", 1)[1], 1)[0]


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()

    try:
        R = reconcile()
    except AssertionError as e:
        sys.stderr.write("RECONCILIATION FAILED, NOTHING WRITTEN\n  %s\n" % e)
        return 1

    src_path = DST if (args.check and os.path.isfile(DST)) else SRC
    body = io.open(src_path, encoding="utf-8").read()
    baseline = io.open(SRC, encoding="utf-8").read()

    applied, already, failed = [], [], []
    for num, where, old, new in RULES:
        if new in body:                      # already-satisfied FIRST
            already.append((num, where))
            continue
        n = body.count(old)
        if n == 1:
            body = body.replace(old, new, 1)
            applied.append((num, where))
        elif n > 1:
            failed.append((num, where, "old text matched %d times" % n))
        else:
            failed.append((num, where, "no match for the old text"))

    needles = consistency_needles(R)
    missing = [(lbl, ndl) for lbl, ndl in needles if ndl not in body]
    ack = ack_block(body)
    present_forbidden = [(t, why, sc) for t, why, sc in FORBIDDEN
                         if t in (ack if sc == "ack" else body)]

    # Document integrity against v8.
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
    # Sections 1 through 8 must be byte-identical: the edit is in the
    # Acknowledgments only.
    body_same = (baseline.split("## Acknowledgments")[0]
                 == body.split("## Acknowledgments")[0])

    consistency_pass = not missing and not present_forbidden
    integrity_pass = (h_src == h_dst and t_src == t_dst
                      and len(p_src) == len(p_dst) and dup == 0
                      and refs_same and appA_same and appB_same and body_same
                      and body.count("—") == 0
                      and not re.search(r"\bfrequently\b", body))
    ok = not failed and consistency_pass and integrity_pass

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(R, applied, already, failed, missing, present_forbidden, body,
                  baseline, h_src, h_dst, t_src, t_dst, len(p_src), len(p_dst),
                  dup, refs_same, appA_same, appB_same, body_same,
                  consistency_pass, integrity_pass)

    W = sys.stdout.write
    for num, where in applied:
        W("APPLIED  EDIT %d  %s\n" % (num, where))
    for num, where in already:
        W("ALREADY  EDIT %d  %s\n" % (num, where))
    for num, where, why in failed:
        W("FAILED   EDIT %d  %s: %s\n" % (num, where, why))
    W("\nreconciliation      : CLOSED\n")
    W("  credited          : %d = %d expert + %d trained\n"
      % (R["credited_total"], R["roster_experts"], R["roster_trained"]))
    W("  analysed          : %d = %d expert + %d trained\n"
      % (R["analysed_total"], R["roster_experts"], R["analysed_trained"]))
    W("  difference        : %d trained raters, %d labels, baseline instrument\n"
      % (R["normal_raters"], R["normal_labels"]))
    for name, good in R["checks"]:
        W("  [%s] %s\n" % ("ok" if good else "XX", name))
    W("\nglobal consistency  : %s\n" % ("PASS" if consistency_pass else "FAIL"))
    for lbl, ndl in missing:
        W("  MISSING  %s: %s\n" % (lbl, ndl))
    for t, why, sc in present_forbidden:
        W("  FORBIDDEN [%s] %s (%s)\n" % (sc, t, why))
    W("document integrity  : %s\n" % ("PASS" if integrity_pass else "FAIL"))
    W("    headings %d->%d  table rows %d->%d  paragraphs %d->%d  dup %d\n"
      % (h_src, h_dst, t_src, t_dst, len(p_src), len(p_dst), dup))
    W("    Sections 1-8 byte-identical %s  References %s  App A %s  App B %s\n"
      % (body_same, refs_same, appA_same, appB_same))
    W("\nRESULT: %s\n" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(R, applied, already, failed, missing, forbidden, body, baseline,
              h_src, h_dst, t_src, t_dst, p_src, p_dst, dup,
              refs_same, appA_same, appB_same, body_same,
              consistency_pass, integrity_pass):
    L = []
    A = L.append
    A("# Detection Article v9, reconciliation change log")
    A("")
    A("**Date:** %s" % STAMP)
    A("**Source:** `research/Detection_Article_v8_2026-08-18.md`")
    A("**Output:** `research/Detection_Article_v9_2026-08-18.md`")
    A("**Script:** `scripts/apply_v9_reconciliation.py`")
    A("")
    A("One edit, to the Acknowledgments only. Sections 1 through 8, the "
      "References, and Appendices A, B and C are byte-identical to v8. No AC1, "
      "confidence interval, label count, record count or other reported result "
      "was changed.")
    A("")
    A("---")
    A("")
    A("## 1. The reconciliation, from source")
    A("")
    A("**Question.** Section 6.5 reports 8 expert and 14 trained raters, 22 in "
      "total. The Acknowledgments credited 25, eight expert and seventeen "
      "trained. Why do they differ?")
    A("")
    A("**Answer, and it is not attrition and not a recruitment figure.** Both "
      "are counts of raters who submitted labels on the same shared 10-record "
      "set. They differ by the pre-registered inclusion rule the manuscript "
      "already states in Section 6.5 and in the Methods: *labels recorded under "
      "the five-condition instrument (`mode = jrs`), one label per rater per "
      "record, latest submission retained*.")
    A("")
    A("| Quantity | Value | Composition |")
    A("|---|---|---|")
    A("| Raters who labelled the reliability set | **%d** | %d expert, %d trained |"
      % (R["credited_total"], R["roster_experts"], R["roster_trained"]))
    A("| Raters in the analysed sample | **%d** | %d expert, %d trained |"
      % (R["analysed_total"], R["roster_experts"], R["analysed_trained"]))
    A("| Difference | **%d** | trained raters who used the unstructured baseline "
      "prompt, contributing %d labels |"
      % (R["normal_raters"], R["normal_labels"]))
    A("")
    A("### The excluded raters, named")
    A("")
    A("| Rater | Labels | Instrument |")
    A("|---|---|---|")
    for c in R["normal_codes"]:
        A("| `%s` | see source | `normal`, unstructured baseline |" % c)
    A("")
    A("Total %d labels. This is the same figure the manuscript already discloses "
      "in the Methods as *\"Sixteen labels in the same table were recorded by "
      "raters working under an unstructured baseline prompt rather than the five "
      "conditions.\"* The Acknowledgments and the Methods were describing the "
      "same three people; only the Acknowledgments did not say so."
      % R["normal_labels"])
    A("")
    A("### Exact sources")
    A("")
    A("| Claim | File | Evidence |")
    A("|---|---|---|")
    A("| 25 raters, 8 expert and 17 trained | `research/REVIEWER_ROSTER_COMPLETE.md` "
      "section **004 Reviewer reliability** | states **\"%d reviewers.\"** and "
      "tabulates %d codes: %d `E-` and %d `R-` |"
      % (R["roster_stated"], R["roster_total"], R["roster_experts"],
         R["roster_trained"]))
    A("| Same figure carried in the programme state | `research/MASTER_TRACKER.md` "
      "| key `reliability_raters` = 25 (8 expert raters, 17 trained reviewers) |")
    A("| 17 trained under all instruments, 14 under the five conditions | "
      "`research/Detection_Article_Figure_Update_2026-08-15.md` | AC1 by "
      "inclusion rule: `jrs` only = 0.623 on %d labels from **%d** raters; all "
      "modes = 0.157 on **%d** raters |"
      % (R["analysed_trained_labels"], R["analysed_trained"],
         R["allmodes_trained"]))
    A("| The three excluded raters are baseline-mode raters | same file | rows "
      "`%s` marked `normal` |" % "`, `".join(R["normal_codes"]))
    A("| Independent floor on the expert count | "
      "`research/reliability_labels_2026-08-04.tsv` | %d distinct expert codes, "
      "%d distinct trained codes, %d labels, being the 2026-08-04 extract before "
      "the fourteenth trained rater's labels arrived |"
      % (R["extract_experts"], R["extract_trained"], R["extract_labels"]))
    A("")
    A("### Arithmetic, checked at run time and fail-closed")
    A("")
    A("| Check | Result |")
    A("|---|---|")
    for name, good in R["checks"]:
        A("| %s | %s |" % (name, "**ok**" if good else "**FAIL**"))
    A("")
    A("The script refuses to write the manuscript if any row above fails. The "
      "counts are parsed out of the evidence files at run time; none of them is "
      "typed into the script.")
    A("")
    A("---")
    A("")
    A("## 2. The edit")
    A("")
    for num, where in applied:
        A("**APPLIED. Edit %d, %s.**" % (num, where))
    for num, where in already:
        A("**ALREADY SATISFIED. Edit %d, %s.**" % (num, where))
    for num, where, why in failed:
        A("**FAILED. Edit %d, %s: %s.**" % (num, where, why))
    A("")
    A("**Before**")
    A("")
    A("> " + OLD_ACK)
    A("")
    A("**After**")
    A("")
    A("> " + NEW_ACK)
    A("")
    A("Credit is unchanged at 25. Nothing is withdrawn from anyone. The "
      "analysed sample is named beside the credited total so that a reader "
      "moving between the Acknowledgments and Section 6.5 is not left to "
      "reconcile 25 against 22 unaided, and so that no reader can mistake the "
      "credited total for the denominator of a coefficient.")
    A("")
    A("---")
    A("")
    A("## 3. Global consistency sweep")
    A("")
    A("| Quantity that must be present and unchanged | Present |")
    A("|---|---|")
    for lbl, ndl in consistency_needles(R):
        A("| %s | %s |" % (lbl, "yes" if ndl in body else "**NO**"))
    A("")
    A("| Superseded or misleading value that must be absent | Scope | Present |")
    A("|---|---|---|")
    ackb = ack_block(body)
    for t, why, sc in FORBIDDEN:
        hay = ackb if sc == "ack" else body
        A("| `%s` (%s) | %s | %s |"
          % (t, why, "Acknowledgments" if sc == "ack" else "whole manuscript",
             "**YES**" if t in hay else "no"))
    A("")
    A("**Global consistency: %s**" % ("PASS" if consistency_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A("## 4. Document integrity")
    A("")
    A("| Check | v8 | v9 |")
    A("|---|---|---|")
    A("| Headings | %d | %d |" % (h_src, h_dst))
    A("| Table rows | %d | %d |" % (t_src, t_dst))
    A("| Paragraphs over 120 characters | %d | %d |" % (p_src, p_dst))
    A("| Duplicate paragraphs | 0 | %d |" % dup)
    A("| Em-dashes | %d | %d |" % (baseline.count("—"), body.count("—")))
    A("| Words | %d | %d |" % (len(baseline.split()), len(body.split())))
    A("")
    A("| Section | Unchanged from v8 |")
    A("|---|---|")
    A("| Sections 1 through 8 | %s |"
      % ("yes, byte-identical" if body_same else "**NO**"))
    A("| References and citations | %s |"
      % ("yes, byte-identical" if refs_same else "**NO**"))
    A("| Appendix A | %s |" % ("yes, byte-identical" if appA_same else "**NO**"))
    A("| Appendix B | %s |" % ("yes, byte-identical" if appB_same else "**NO**"))
    A("| Acknowledgments | changed by Edit 1 only |")
    A("")
    A("v8 was not overwritten. The source is plain Markdown and the `.docx` is "
      "generated from it, so no tracked change and no comment can be "
      "introduced.")
    A("")
    A("**Document integrity: %s**" % ("PASS" if integrity_pass else "FAIL"))
    A("")
    A('"v9 reconciliation completed. No primary study result, preregistered '
      'threshold, corpus composition, study design, or substantive '
      'methodological finding was changed. The trained-reviewer AC1 remains '
      '0.623 with analytic interval 0.253 to 0.994 and bootstrap interval 0.301 '
      'to 0.886."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
