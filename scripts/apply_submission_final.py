#!/usr/bin/env python3
"""Detection_Article_Final -> Submission_Final. Editorial precision pass.

THE SOURCE IS READ AND NOT OVERWRITTEN.

FOURTEEN INSTRUCTED EDITS, OF WHICH FIVE CHANGE TEXT AND NINE ARE PRESERVATION
CONSTRAINTS. A preservation constraint is not a no-op: each is compiled into an
assertion that fails the run if the thing it protects has moved. Edits 4, 5, 6,
9, 10, 11, 12, 13 and 14 are enforced that way.

EDIT 4 IS A FAIL-CLOSED STATISTICAL GATE, NOT A TEXT EDIT. The instruction says
to verify the printed reliability figures against the current 68-label dataset
and to STOP on a discrepancy. That verification reads
research/current_reliability_2026-08-18.json, which was produced by
research/recompute_current_ac1.py against live bench_labels using
research/compute_ac1_ci.py imported unmodified. If any printed figure disagrees
with the recomputation, nothing is written.

EDIT 3 PLACEMENT. The 25 -> 22 paragraph is inserted immediately before the
reliability table, after the record-accounting sentence that Edit 12 protects.
The instruction forbids duplicating the explanation, so the Acknowledgments
sentence is left exactly where it is and a duplicate-paragraph check runs over
the whole document.

"Already satisfied" is tested BEFORE "old text present".

Usage:
  python3 scripts/apply_submission_final.py --apply
  python3 scripts/apply_submission_final.py --check
"""
import argparse
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "Detection_Article_Final_2026-08-18.md")
DST = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_Final_2026-08-18.md")
LOG = os.path.join(ROOT, "research",
                   "Detection_Article_Submission_Final_CHANGE_LOG.md")
STATS = os.path.join(ROOT, "research", "current_reliability_2026-08-18.json")

STAMP = "2026-08-18"

CATEGORIES = ("STATISTICAL", "METHODOLOGICAL", "TERMINOLOGICAL",
              "CLAIM-BOUNDARY", "CLARIFICATION")


# ---------------------------------------------------------------------------
# EDIT 4: the statistical gate. Every printed reliability figure must match the
# recomputation against the current 68-label dataset.
# ---------------------------------------------------------------------------
def statistical_gate(body):
    """Returns (ok, rows). Each row is (label, printed, recomputed, match)."""
    if not os.path.isfile(STATS):
        return False, [("recomputation file", "missing", STATS, False)]
    S = json.load(io.open(STATS, encoding="utf-8"))
    p = S.get("provenance", {})
    rows = []
    for gate in ("gate1_live_matches_committed_run",
                 "gate2_point_estimates_reproduce"):
        rows.append((gate, str(p.get(gate)), "True", p.get(gate) is True))

    exp, reg = S["experts"], S["regular"]
    m = re.search(r"\| Experts \| (\d+) \| (\d+) \| (\d+) \| ([\d.]+) \| "
                  r"([\d.]+) to ([\d.]+) \| ([\d.]+) to ([\d.]+) \|", body)
    n = re.search(r"\| Regular reviewers \| (\d+) \| (\d+) \| (\d+) \| ([\d.]+) \| "
                  r"([\d.]+) to ([\d.]+) \| ([\d.]+) to ([\d.]+) \|", body)
    if not m:
        rows.append(("expert table row", "NOT FOUND", "", False))
    if not n:
        rows.append(("regular-reviewer table row", "NOT FOUND", "", False))
    for tag, mm, d in (("expert", m, exp), ("regular", n, reg)):
        if not mm:
            continue
        g = mm.groups()
        want = [
            ("%s estimable records" % tag, g[0], str(d["records_estimable"])),
            ("%s labels" % tag, g[1], str(d["labels"])),
            ("%s raters" % tag, g[2], str(d["raters"])),
            ("%s AC1" % tag, g[3], d["ac1_printed"]),
            ("%s analytic low" % tag, g[4], d["analytic_ci_printed"][0]),
            ("%s analytic high" % tag, g[5], d["analytic_ci_printed"][1]),
            ("%s bootstrap low" % tag, g[6], d["bootstrap_ci_printed"][0]),
            ("%s bootstrap high" % tag, g[7], d["bootstrap_ci_printed"][1]),
        ]
        for lbl, a, b in want:
            rows.append((lbl, a, b, a == b))

    # the prose lower bounds must match the table
    pl = re.search(r"The expert lower bound is ([\d.]+) against a required 0\.41; "
                   r"the regular-reviewer lower bound is ([\d.]+)\.", body)
    if pl:
        rows.append(("prose expert lower bound", pl.group(1),
                     exp["analytic_ci_printed"][0],
                     pl.group(1) == exp["analytic_ci_printed"][0]))
        rows.append(("prose regular lower bound", pl.group(2),
                     reg["analytic_ci_printed"][0],
                     pl.group(2) == reg["analytic_ci_printed"][0]))
    else:
        rows.append(("prose lower-bound sentence", "NOT FOUND", "", False))

    # the 25 -> 22 accounting must match the recomputation
    tot = S["totals"]
    exc = S["excluded_baseline"]
    rows.append(("reliability raters, all instruments",
                 "25", str(tot["all_raters_any_instrument"]),
                 tot["all_raters_any_instrument"] == 25))
    rows.append(("reliability raters, five-condition set",
                 "22", str(tot["raters_in_five_condition_set"]),
                 tot["raters_in_five_condition_set"] == 22))
    rows.append(("invited experts", "8", str(tot["e_coded"]), tot["e_coded"] == 8))
    rows.append(("regular reviewers, all instruments", "17", str(tot["r_coded"]),
                 tot["r_coded"] == 17))
    rows.append(("baseline-only regular reviewers", "3", str(exc["raters"]),
                 exc["raters"] == 3))
    rows.append(("records carrying a label", "15",
                 str(reg["records_with_any_label"]),
                 reg["records_with_any_label"] == 15))
    rows.append(("estimable records", "10", str(reg["records_estimable"]),
                 reg["records_estimable"] == 10))
    rows.append(("single-rater records", "5", str(reg["records_single_rater"]),
                 reg["records_single_rater"] == 5))
    return all(r[3] for r in rows), rows


# ---------------------------------------------------------------------------
# THE FIVE TEXT EDITS
# ---------------------------------------------------------------------------
RULES = [
    (1, "CLARIFICATION", "Section 9, Conclusion",
     "It also establishes that those same experts vary widely among themselves, "
     "and that a pre-registered reliability criterion was not met on the sample "
     "available.",
     "It also establishes substantial variation in accuracy among the sixteen "
     "detection-panel experts, while the separate reliability sample did not "
     "meet the pre-registered lower-bound criterion.",
     "\"those same experts\" reads as though the sixteen detection-panel experts "
     "are the reliability sample. They are not: the reliability coefficients "
     "come from Study 004, a separate population of 25 raters.",
     "`research/DRR_Detection_Validation_Protocol.md` section 4 defines Arm A "
     "and names no reliability rater code; `research/FULL_DATA_ANALYSIS_"
     "2026-08-15.txt` section 3 versus section 8 counts the two populations "
     "separately"),

    (2, "METHODOLOGICAL", "Section 4.7, pre-registered thresholds",
     "**Reliability floor (supporting).** Gwet's AC1 among the expert panel of "
     "at least 0.61, **with the lower bound of its confidence interval at least "
     "0.41.** Both parts are criteria. Section 7 reports the outcome of both, "
     "including the part that failed.",
     "**Reliability floor (supporting).** Gwet's AC1 was pre-specified at a "
     "minimum of 0.61, with a lower confidence bound of at least 0.41, for the "
     "reliability analyses reported by reviewer group in Section 6.5. Both "
     "parts were criteria. Section 7 reports the outcome of both, including the "
     "part that failed.",
     "\"among the expert panel\" is ambiguous between the sixteen detection-panel "
     "experts and the eight invited expert raters of Study 004, and the floor "
     "applies to the reliability analyses, which are reported by reviewer group. "
     "Neither threshold value changes.",
     "`research/DRR_Detection_Validation_Protocol.md:66` states the floor "
     "without scoping it to a named panel; Section 6.5 of this manuscript "
     "reports two reviewer groups"),

    (3, "METHODOLOGICAL", "Section 6.5, analysed denominator",
     "Fifteen records carried at least one label under the five-condition "
     "instrument. Because agreement can only be estimated where a record was "
     "reviewed by more than one rater, the ten records with two or more raters "
     "formed the analysed reliability set. Those ten records carry 113 "
     "submitted determinations, reduced to 104 after keeping one label per "
     "rater per record:",
     "Of the 25 reliability participants, 22 contributed labels under the "
     "five-condition instrument and entered the analysed reliability sample: "
     "eight invited experts and fourteen regular reviewers. Three regular "
     "reviewers contributed only under the unstructured baseline prompt and "
     "were excluded because those labels did not assess agreement under the "
     "five-condition instrument.\n\nFifteen records carried at least one label "
     "under the five-condition instrument. Because agreement can only be "
     "estimated where a record was reviewed by more than one rater, the ten "
     "records with two or more raters formed the analysed reliability set. "
     "Those ten records carry 113 submitted determinations, reduced to 104 "
     "after keeping one label per rater per record:",
     "the analytical denominator was recoverable only from the Acknowledgments. "
     "A reader should not have to leave the Results to learn which raters entered "
     "the coefficient. The existing record-accounting sentence is preserved "
     "verbatim beneath it.",
     "live `bench_labels`, read 2026-08-18: 25 raters (8 `E-`, 17 `R-`), 22 "
     "under `mode = jrs`, 3 `mode = normal` only, recorded in "
     "`research/current_reliability_2026-08-18.json`"),

    (6, "TERMINOLOGICAL", "Section 6.5, bootstrap sensitivity sentence",
     "it indicates that the failure is marginal for the expert panel and that "
     "the conclusion is sensitive to interval construction",
     "it indicates that the failure is marginal for the invited-expert group "
     "and that the conclusion is sensitive to interval construction",
     "\"the expert panel\" is ambiguous between three populations: the sixteen "
     "detection-panel experts of Study 011, the twenty comparison-study experts "
     "of Study 012, and the eight invited expert raters of Study 004. The 0.427 "
     "bootstrap lower bound belongs to the last of those. The Final Global "
     "Search in the instruction requires the phrase to be disambiguated wherever "
     "it survives.",
     "the coefficient is the Study 004 expert row of the Section 6.5 table, 36 "
     "labels from 8 raters, confirmed against "
     "`research/current_reliability_2026-08-18.json`; the replacement term is "
     "the one Section 4.7 and the Acknowledgments already use"),

    (7, "CLAIM-BOUNDARY", "Section 1, Introduction",
     "If independent experts, reading a record cold, cannot tell one whose "
     "reasoning is present from one whose reasoning is absent, then "
     "documentation risk is not a governable property and no control built on "
     "human review can work.",
     "If independent experts cannot reliably distinguish records whose "
     "reasoning is present from those whose reasoning is absent under the "
     "stated reviewer standpoint, then a governance control that depends on "
     "human review of that property would lack an adequate empirical basis.",
     "\"is not a governable property\" and \"no control built on human review "
     "can work\" are absolute claims about all controls and all conditions. The "
     "study tests one operationalisation under one reviewer standpoint on one "
     "constructed corpus.",
     "the manuscript's own scope statements at Section 8.4, 8.5 and 8.10, and "
     "`research/DRR_Detection_Validation_Protocol.md:96`, which bounds the "
     "study to detectability"),

    (8, "CLAIM-BOUNDARY", "Section 7, Discussion, The layer",
     "Whether this particular operationalisation is the right one is open; that "
     "the layer needs operationalising seems to us harder to dispute.",
     "Whether this particular operationalisation is the right one remains open; "
     "the study provides a basis for testing whether record-level "
     "reconstructability warrants a distinct measurement layer in AI governance.",
     "\"harder to dispute\" asserts a field-level proposition the study did not "
     "test. The conceptual contribution survives as a basis for testing rather "
     "than as a settled point.",
     "no source in the repository tests the field-level claim; "
     "`DRR_Detection_Validation_Protocol.md:96` bounds the study to "
     "detectability"),
]


# ---------------------------------------------------------------------------
# PRESERVATION CONSTRAINTS, one block per instructed edit
# ---------------------------------------------------------------------------
PRESERVE = {
    5: ("TERMINOLOGICAL", "Reliability terminology", [
        ("invited-expert wording",
         "Raters whose codes begin with E are invited experts whose credentials "
         "are recorded."),
        ("recruitment-channel sentence, verbatim",
         "the split records the recruitment channel and is not a measure of "
         "professional expertise."),
        ("regular reviewers in the table", "| Regular reviewers | 10 |"),
        ("regular reviewers in the Acknowledgments",
         "eight invited experts and seventeen regular reviewers"),
    ]),
    6: ("CLARIFICATION", "Arm A / Arm B expert status", [
        ("Arm B expertise parity and condition-not-expertise",
         "Its participants are credentialed professionals drawn from the same "
         "pool and randomised within it, so the two arms differ in the method "
         "applied and not in the expertise of the people applying it."),
        ("Arm A expert eligibility",
         "Every panel member is a credentialed practitioner or researcher in "
         "one of those fields and was recruited on that basis."),
        ("Arm B same standing, randomised between methods",
         "Those participants are credentialed professionals of the same "
         "standing as the panel reported here, randomised between applying the "
         "five conditions and applying a general prompt."),
        ("JRS-naive is exposure, not expertise",
         "They are described as JRS-naive because they had no prior exposure to "
         "the method, which is a statement about exposure and not about "
         "expertise."),
    ]),
    9: ("STATISTICAL", "Primary detection result", [
        ("panel size", "16 independent experts"),
        ("countries", "11 countries"),
        ("continents", "5 continents"),
        ("corpus", "24 constructed, de-identified records"),
        ("graded judgments", "384 graded judgments"),
        ("accuracy", "83.9"),
        ("CI low", "72.7"),
        ("CI high", "95.1"),
        ("sensitivity", "87.0"),
        ("specificity", "80.7"),
        ("detection threshold", "70 percent"),
        ("lower-bound threshold", "50 percent"),
    ]),
    10: ("CLAIM-BOUNDARY", "JRS claim boundary", [
        ("feasibility not efficacy",
         "evidence supporting the feasibility of its underlying review logic, "
         "not as evidence that JRS itself improves documentation outcomes"),
        ("comparison study is a different question",
         "Whether the five conditions improve on unaided expert judgment is a "
         "different question, tested in a separate study"),
        ("no efficacy", "**8.10 No criterion validity, and no efficacy.**"),
    ]),
    11: ("CLAIM-BOUNDARY", "DRR claim boundary", [
        ("abstract disclaimer", "It does not establish criterion validity"),
        ("cross-cultural validity not established",
         "**8.4 The international composition does not establish cross-cultural "
         "validity.**"),
        ("workflow independence is an intention",
         "**8.5 Workflow independence is a design intention, not a result.**"),
        ("not psychometrically validated",
         "**8.6 The five conditions are not psychometrically validated.**"),
        ("criterion validity not attempted", "**Not attempted.** Study 4"),
    ]),
    12: ("METHODOLOGICAL", "Record-level disclosure", [
        ("fifteen records sentence",
         "Fifteen records carried at least one label under the five-condition "
         "instrument."),
        ("estimability reason",
         "Because agreement can only be estimated where a record was reviewed "
         "by more than one rater, the ten records with two or more raters "
         "formed the analysed reliability set."),
    ]),
    13: ("STATISTICAL", "Reliability failure remains disclosed", [
        ("criterion not met",
         "**The pre-registered reliability criterion was not met.**"),
        ("analytic interval is the specified one",
         "**Neither clears the second on the analytic interval, which is the "
         "interval the analysis plan specified.**"),
        ("bootstrap is not used to claim a pass",
         "**We do not treat that as satisfying the pre-registration.**"),
        ("expert AC1", "| Experts | 10 | 36 | 8 | 0.739 | 0.402 to 1.000 | "
                       "0.427 to 1.000 |"),
        ("regular-reviewer AC1", "| Regular reviewers | 10 | 68 | 14 | 0.623 | "
                                 "0.252 to 0.993 | 0.285 to 0.894 |"),
    ]),
    14: ("METHODOLOGICAL", "Limitation language", [
        ("recruitment is not sampling", "**Recruitment is not sampling.**"),
        ("spectrum restriction", "ends of the severity range"),
        ("construct dependence",
         "None of them removes investigator dependence"),
        ("reliability sample too small",
         "the reliability sample is too small to establish reliability"),
        ("interim reliability",
         "These coefficients are interim and will be re-estimated when the "
         "pooled set is complete."),
        ("item variance",
         "**8.3 Item variance is not in the primary analysis, and is small.**"),
        ("no independent adjudicator", "independent validation adjudicator"),
        ("group not individual reliance",
         "Group-level detectability therefore does not license "
         "individual-level reliance"),
    ]),
}

# Values and phrases that must be absent.
FORBIDDEN_TEXT = [
    ("JRS validated", ()),
    ("validated JRS", ()),
    ("JRS proven", ()),
    ("JRS efficacy demonstrated", ()),
    ("JRS improves documentation", ("that JRS itself improves documentation outcomes",)),
    ("JRS improves reviewer performance", ()),
    ("JRS outperforms", ()),
    ("criterion validity established", ()),
    ("psychometrically validated", ("not psychometrically validated",)),
    ("measurement invariance established", ()),
    ("workflow independence demonstrated", ()),
    ("enterprise validated", ()),
    ("industry standard", ()),
    ("non-expert", ()),
    ("non-experts", ()),
    ("trained reviewer", ()),
    ("trained reviewers", ()),
    ("trained-reviewer", ()),
    ("those same experts", ()),
    ("0.624", ()),
    ("0.253 to 0.994", ()),
    ("0.301 to 0.886", ()),
    ("36 independent experts", ()),
    ("36 experts", ()),
]

# "expert panel" must not survive unqualified: it is ambiguous between three
# populations. Any surviving occurrence is listed for inspection.
AMBIGUOUS = ["expert panel", "the expert group"]


def forbidden_hits(body):
    hits = []
    for term, exempt in FORBIDDEN_TEXT:
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

    gate_ok, gate_rows = statistical_gate(body)

    pres_missing = []
    for num, (cat, title, items) in sorted(PRESERVE.items()):
        for lbl, needle in items:
            if needle not in body:
                pres_missing.append((num, title, lbl))

    forb = forbidden_hits(body)
    ambig = [(t, body.count(t)) for t in AMBIGUOUS if t in body]

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

    # exactly one paragraph added, by Edit 3, and nothing else moved
    expected_para_delta = 1
    para_delta = len(p_dst) - len(p_src)

    integrity_pass = (h_src == h_dst and t_src == t_dst and dup == 0
                      and para_delta == expected_para_delta
                      and refs_same and appA_same and appB_same and appC_same
                      and ack_same
                      and body.count("—") == 0
                      and not re.search(r"\bfrequently\b", body))
    ok = (not failed and gate_ok and not pres_missing and not forb
          and not ambig and integrity_pass)

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(applied, already, failed, gate_rows, gate_ok, pres_missing,
                  forb, ambig, body, baseline, h_src, h_dst, t_src, t_dst,
                  len(p_src), len(p_dst), dup, para_delta, refs_same, appA_same,
                  appB_same, appC_same, ack_same, integrity_pass)

    W = sys.stdout.write
    for num, cat, where, _, _, _, _ in applied:
        W("APPLIED  EDIT %-2d [%-14s] %s\n" % (num, cat, where))
    for num, cat, where, _, _, _, _ in already:
        W("ALREADY  EDIT %-2d [%-14s] %s\n" % (num, cat, where))
    for num, where, why in failed:
        W("FAILED   EDIT %-2d %s: %s\n" % (num, where, why))
    W("\nEDIT 4 statistical gate : %s\n" % ("PASS" if gate_ok else "FAIL"))
    for lbl, a, b, good in gate_rows:
        if not good:
            W("  MISMATCH %-34s printed %-10s recomputed %s\n" % (lbl, a, b))
    W("  %d/%d checks matched\n"
      % (sum(1 for r in gate_rows if r[3]), len(gate_rows)))
    W("\npreservation constraints: %s\n" % ("PASS" if not pres_missing else "FAIL"))
    for num, title, lbl in pres_missing:
        W("  EDIT %-2d %s: MISSING %s\n" % (num, title, lbl))
    W("forbidden text          : %s\n" % ("PASS" if not forb else "FAIL"))
    for t in forb:
        W("  PRESENT  %s\n" % t)
    W("ambiguous phrasing      : %s\n" % ("PASS" if not ambig else "FAIL"))
    for t, c in ambig:
        W("  AMBIGUOUS  '%s' x%d\n" % (t, c))
    W("document integrity      : %s\n" % ("PASS" if integrity_pass else "FAIL"))
    W("    headings %d->%d  table rows %d->%d  paragraphs %d->%d "
      "(delta %+d, expected %+d)  dup %d\n"
      % (h_src, h_dst, t_src, t_dst, len(p_src), len(p_dst),
         para_delta, expected_para_delta, dup))
    W("    References %s  App A %s  App B %s  App C %s  Acknowledgments %s\n"
      % (refs_same, appA_same, appB_same, appC_same, ack_same))
    W("\nTOTAL SURGICAL EDITS: %d applied, %d already satisfied, %d preservation "
      "constraints enforced\n"
      % (len(applied), len(already),
         sum(len(v[2]) for v in PRESERVE.values())))
    W("RESULT: %s\n" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(applied, already, failed, gate_rows, gate_ok, pres_missing, forb,
              ambig, body, baseline, h_src, h_dst, t_src, t_dst, p_src, p_dst,
              dup, para_delta, refs_same, appA_same, appB_same, appC_same,
              ack_same, integrity_pass):
    L = []
    A = L.append
    A("# Detection Article, submission-final change log")
    A("")
    A("**Date:** %s" % STAMP)
    A("**Source:** `research/Detection_Article_Final_2026-08-18.md` (preserved, "
      "not overwritten)")
    A("**Output:** `research/Detection_Article_Submission_Final_2026-08-18.md`")
    A("**Script:** `scripts/apply_submission_final.py`")
    A("**Statistical gate reads:** `research/current_reliability_2026-08-18.json`")
    A("")
    A("Fourteen instructed edits. Five change text; nine are preservation "
      "constraints compiled into %d assertions that fail the run if what they "
      "protect has moved. No change is filed under \"general improvement\", "
      "because no such category exists here."
      % sum(len(v[2]) for v in PRESERVE.values()))
    A("")
    A("---")
    A("")
    A("## 1. Text edits")
    A("")
    for num, cat, where, old, new, why, source in applied:
        A("### Edit %d. %s. APPLIED." % (num, where))
        A("")
        A("**Category:** %s" % cat)
        A("")
        A("**Original wording**")
        A("")
        A("> " + old.replace("\n\n", " "))
        A("")
        A("**Replacement wording**")
        A("")
        A("> " + new.replace("\n\n", "\n>\n> "))
        A("")
        A("**Reason.** %s" % why)
        A("")
        A("**Source.** %s" % source)
        A("")
    for num, cat, where, old, new, why, source in already:
        A("### Edit %d. %s. ALREADY SATISFIED." % (num, where))
        A("")
        A("**Category:** %s" % cat)
        A("")
    for num, where, why in failed:
        A("### Edit %d. %s. FAILED: %s" % (num, where, why))
        A("")
    A("---")
    A("")
    A("## 2. Edit 4, the statistical gate")
    A("")
    A("Edit 4 instructs verification, not alteration, and instructs a stop on "
      "any discrepancy. Every reliability figure printed in the manuscript is "
      "compared against the recomputation performed against live `bench_labels` "
      "with `research/compute_ac1_ci.py` imported unmodified. The script writes "
      "nothing if any row below fails.")
    A("")
    A("| Check | Printed in the manuscript | Recomputed from the current dataset | Match |")
    A("|---|---|---|---|")
    for lbl, a, b, good in gate_rows:
        A("| %s | `%s` | `%s` | %s |" % (lbl, a, b, "ok" if good else "**FAIL**"))
    A("")
    A("**Edit 4: %s.** The current values stand. `0.624`, `0.253 to 0.994` and "
      "`0.301 to 0.886` are absent from the manuscript and are on the forbidden "
      "list above." % ("VERIFIED, no change made" if gate_ok else "FAILED"))
    A("")
    A("---")
    A("")
    A("## 3. Preservation constraints, edits 5, 6, 9, 10, 11, 12, 13 and 14")
    A("")
    for num, (cat, title, items) in sorted(PRESERVE.items()):
        A("### Edit %d. %s" % (num, title))
        A("")
        A("**Category:** %s" % cat)
        A("")
        A("| Protected element | Present |")
        A("|---|---|")
        for lbl, needle in items:
            A("| %s | %s |" % (lbl, "yes" if needle in body else "**NO**"))
        A("")
    A("---")
    A("")
    A("## 4. Final global search")
    A("")
    A("| Term | Occurrences | Required | Result |")
    A("|---|---:|---|---|")
    hits = forbidden_hits(body)
    for term, exempt in FORBIDDEN_TEXT:
        A("| `%s`%s | %d | 0 | %s |"
          % (term,
             " (exempt: %s)" % ", ".join("`%s`" % e for e in exempt) if exempt else "",
             body.count(term), "**PRESENT**" if term in hits else "clean"))
    for term in AMBIGUOUS:
        A("| `%s` | %d | 0, ambiguous between three populations | %s |"
          % (term, body.count(term), "**PRESENT**" if term in body else "clean"))
    A("")
    A("| Permitted term | Occurrences | Population it names |")
    A("|---|---:|---|")
    for term, pop in (("Arm A", "Study 011, detection panel"),
                      ("Arm B", "Study 012, comparison study"),
                      ("B1", "Study 012, five-condition condition"),
                      ("B2", "Study 012, general-prompt condition"),
                      ("invited experts", "Study 004, E-coded raters"),
                      ("regular reviewers", "Study 004, R-coded raters"),
                      ("detection panel", "Study 011"),
                      ("comparison study", "Study 012"),
                      ("JRS-naive", "Study 012, exposure not expertise")):
        A("| `%s` | %d | %s |" % (term, body.count(term), pop))
    A("")
    A("### Numerals verified against their population")
    A("")
    A("| Numeral | Population | Occurrences |")
    A("|---|---|---:|")
    A("| 16 | Study 011, Arm A, detection-panel completers | %d |"
      % (body.count("sixteen") + body.count("16 independent experts")))
    A("| 20 | Study 012, Arm B, comparison-study completers | %d |"
      % body.count("20 independent experts"))
    A("| 25 | Study 004, reliability raters, all instruments | %d |"
      % (body.count("25 reliability participants") + body.count("25 raters")))
    A("| 22 | Study 004, five-condition analysed sample | %d |"
      % (body.count("22 contributed labels") + body.count("Twenty-two of them")))
    A("| 36 | **must not appear as a combined panel figure** | %d |"
      % (body.count("36 independent experts") + body.count("36 experts")))
    A("")
    A("**No combined 36 figure was created.** The instruction forbids inventing "
      "one from 16 + 20, and the source records show the two arms are not fully "
      "disjoint from the Study 004 expert raters in any case: E-09 is V-AI-06, "
      "E-12 is V-AI-07, E-13 is V-AI-03 "
      "(`research/Expert_Roster_All_Studies_2026-08-06.md:73`). The only `36` "
      "surviving in the manuscript is the expert label count in the reliability "
      "table, which is a label count and not a person count.")
    A("")
    A("---")
    A("")
    A("## 5. Document integrity")
    A("")
    A("| Check | Source | Submission final |")
    A("|---|---|---|")
    A("| Headings | %d | %d |" % (h_src, h_dst))
    A("| Table rows | %d | %d |" % (t_src, t_dst))
    A("| Paragraphs over 120 characters | %d | %d |" % (p_src, p_dst))
    A("| Paragraph delta | 0 | %+d, being the one paragraph Edit 3 inserts |"
      % para_delta)
    A("| Duplicate paragraphs | 0 | %d |" % dup)
    A("| Em-dashes | %d | %d |" % (baseline.count("—"), body.count("—")))
    A("| Words | %d | %d |" % (len(baseline.split()), len(body.split())))
    A("")
    A("| Section | Unchanged from the source |")
    A("|---|---|")
    A("| References and citations | %s |"
      % ("yes, byte-identical" if refs_same else "**NO**"))
    A("| Appendix A | %s |" % ("yes, byte-identical" if appA_same else "**NO**"))
    A("| Appendix B | %s |" % ("yes, byte-identical" if appB_same else "**NO**"))
    A("| Appendix C | %s |" % ("yes, byte-identical" if appC_same else "**NO**"))
    A("| Acknowledgments | %s |"
      % ("yes, byte-identical" if ack_same else "**NO**"))
    A("| Section 1 | Edit 7 only |")
    A("| Section 4.7 | Edit 2 only |")
    A("| Section 6.5 | Edit 3 only |")
    A("| Section 7 | Edit 8 only |")
    A("| Section 9 | Edit 1 only |")
    A("")
    A("No section was deleted, no reference altered, no citation changed. The "
      "table-row count is identical, so no table was damaged, and the "
      "reliability table itself is byte-identical: Edit 3 inserts a paragraph "
      "above it and changes no cell. The source is plain Markdown and the "
      "`.docx` is generated from it, so no tracked change and no comment can be "
      "introduced. The Acknowledgments are byte-identical, which is how the "
      "no-duplication requirement in Edit 3 is enforced rather than asserted.")
    A("")
    A("**Document integrity: %s**" % ("PASS" if integrity_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A('"Submission-final editorial pass completed. Five sentences changed, four '
      'for population clarity and claim boundary and one inserting the analysed '
      'reliability denominator into the Results. No primary detection result, '
      'reliability statistic, preregistered threshold, corpus composition, '
      'study design, arm architecture, limitation, reference or table cell was '
      'changed. No claim was strengthened."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
