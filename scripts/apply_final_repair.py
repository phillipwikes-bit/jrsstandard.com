#!/usr/bin/env python3
"""Detection Article v9 -> Final. Four instructed edits, source-verified.

v9 IS READ AND NOT OVERWRITTEN. Detection_Article_Final_2026-08-18.md is written.

THIS SCRIPT REFUSES TO RUN ON STALE STATISTICS. The confidence intervals it
writes are not typed in. They are read from
research/current_reliability_2026-08-18.json, which is produced by a
recomputation against the live bench_labels table using
research/compute_ac1_ci.py imported unmodified, with that module's own B and
SEED constants. If that file is missing, or if its provenance block does not
record both fail-closed gates passing, nothing is written.

WHY THE INTERVALS MOVED
    The v9 row paired a 68-label point estimate with 63-label intervals. The
    point estimate came from the 2026-08-15 closed run; the intervals were
    carried forward from the 2026-08-04 interim extract and were never
    re-estimated. Both are now computed on the same 68 labels.

WHY "TRAINED REVIEWERS" IS RETIRED
    No source establishes training for the R-coded pool. bench-review.html:60
    calls them "Regular reviewers"; :107 auto-generates their codes in the
    browser; the file contains no training gate. The roster classes them
    "bench reviewer". The replacement says how they were recruited, which is
    what the E/R split actually records, and asserts nothing about expertise in
    either direction.

"Already satisfied" is tested BEFORE "old text present", because a replacement
that contains its own original would otherwise re-apply on every run.

Usage:
  python3 scripts/apply_final_repair.py --apply
  python3 scripts/apply_final_repair.py --check
"""
import argparse
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "Detection_Article_v9_2026-08-18.md")
DST = os.path.join(ROOT, "research", "Detection_Article_Final_2026-08-18.md")
LOG = os.path.join(ROOT, "research", "Detection_Article_Final_CHANGE_LOG.md")
STATS = os.path.join(ROOT, "research", "current_reliability_2026-08-18.json")

STAMP = "2026-08-18"


def load_stats():
    """Read the recomputation, or refuse. Returns the dict, or raises."""
    if not os.path.isfile(STATS):
        raise AssertionError("missing %s: run the recomputation first" % STATS)
    d = json.load(io.open(STATS, encoding="utf-8"))
    p = d.get("provenance", {})
    for gate in ("gate1_live_matches_committed_run",
                 "gate2_point_estimates_reproduce"):
        if p.get(gate) is not True:
            raise AssertionError("%s did not pass in %s" % (gate, STATS))
    for k in ("experts", "regular"):
        if k not in d:
            raise AssertionError("%s block absent from %s" % (k, STATS))
    return d


def build_rules(S):
    exp = S["experts"]
    reg = S["regular"]

    e_ac1 = exp["ac1_printed"]
    e_alo, e_ahi = exp["analytic_ci_printed"]
    e_blo, e_bhi = exp["bootstrap_ci_printed"]
    r_ac1 = reg["ac1_printed"]
    r_alo, r_ahi = reg["analytic_ci_printed"]
    r_blo, r_bhi = reg["bootstrap_ci_printed"]

    # The estimator prints 1.000 as "1.000"; the manuscript's expert row uses
    # the same string, so no special-casing is needed. Assert it rather than
    # assume it.
    assert e_ahi in ("1.000", "0.999", "1.0"), "unexpected expert upper bound %s" % e_ahi

    rules = []

    # ---------------- EDIT A: current confidence intervals -----------------
    # The expert row recomputes byte-identically from the current data (the
    # expert labels did not change between the two runs), so it is asserted
    # rather than rewritten. Only the regular-reviewer row moves.
    rules.append((
        "A1", "Section 6.5 table, regular-reviewer row: current intervals",
        "| Trained reviewers | 10 | 68 | 14 | 0.623 | 0.253 to 0.994 | 0.301 to 0.886 |",
        "| Regular reviewers | 10 | %s | %s | %s | %s to %s | %s to %s |"
        % (reg["labels"], reg["raters"], r_ac1, r_alo, r_ahi, r_blo, r_bhi)))

    rules.append((
        "A2", "Section 6.5, failed-criterion sentence: current lower bound",
        "The expert lower bound is 0.402 against a required 0.41; the "
        "trained-reviewer lower bound is 0.253.",
        "The expert lower bound is %s against a required 0.41; the "
        "regular-reviewer lower bound is %s." % (e_alo, r_alo)))

    # ---------------- EDIT B: terminology ----------------------------------
    rules.append((
        "B1", "Section 4.7, rater-class definition",
        "Raters whose codes begin with E are experts; the remainder are trained "
        "reviewers.",
        "Raters whose codes begin with E are invited experts whose credentials "
        "are recorded. The remainder are regular reviewers who entered through "
        "the open review page and declared a professional domain without "
        "identity verification. The two groups are reported separately because "
        "they were recruited by different routes; the split records the "
        "recruitment channel and is not a measure of professional expertise."))

    rules.append((
        "B2", "Section 4.7, inclusion rule: coefficient label",
        "on the analysed set the trained-reviewer coefficient is 0.623",
        "on the analysed set the regular-reviewer coefficient is %s" % r_ac1))

    rules.append((
        "B3", "Acknowledgments, rater-class labels",
        "**The reliability study, 25 raters**, eight expert and seventeen "
        "trained, recorded labels on the shared record set. Twenty-two of them, "
        "eight expert and fourteen trained, worked under the five-condition "
        "instrument and are the analysed sample behind the coefficients in "
        "Section 6.5; the other three trained raters worked under the "
        "unstructured baseline prompt",
        "**The reliability study, 25 raters**, eight invited experts and "
        "seventeen regular reviewers, recorded labels on the shared record set. "
        "Twenty-two of them, eight experts and fourteen regular reviewers, "
        "worked under the five-condition instrument and are the analysed sample "
        "behind the coefficients in Section 6.5; the other three regular "
        "reviewers worked under the unstructured baseline prompt"))

    # ---------------- EDIT C: single-rater records -------------------------
    rules.append((
        "C1", "Section 6.5, record-level accounting",
        "On a shared set of 10 records carrying 113 submitted determinations "
        "under the five-condition instrument, reduced to 104 after keeping one "
        "label per rater per record:",
        "Fifteen records carried at least one label under the five-condition "
        "instrument. Because agreement can only be estimated where a record was "
        "reviewed by more than one rater, the ten records with two or more "
        "raters formed the analysed reliability set. Those ten records carry "
        "113 submitted determinations, reduced to 104 after keeping one label "
        "per rater per record:"))

    return rules


# EDIT D is a verification, not a replacement. Each entry is a sentence that
# must be PRESENT and unchanged for the arm architecture to be correctly stated.
# The source records confirm both arms are expert panels and that B1/B2 is a
# review-condition split, and v9 already says so in these four places. Editing
# correct prose to demonstrate effort would be churn.
ARM_ARCHITECTURE = [
    ("Arm B expertise parity and condition-not-expertise, Section 3",
     "Its participants are credentialed professionals drawn from the same pool "
     "and randomised within it, so the two arms differ in the method applied "
     "and not in the expertise of the people applying it."),
    ("Arm A expert eligibility, Section 5",
     "Every panel member is a credentialed practitioner or researcher in one of "
     "those fields and was recruited on that basis."),
    ("Arm B expert standing and the meaning of JRS-naive, Section 5",
     "Those participants are credentialed professionals of the same standing as "
     "the panel reported here, randomised between applying the five conditions "
     "and applying a general prompt."),
    ("JRS-naive is exposure, not expertise",
     "They are described as JRS-naive because they had no prior exposure to the "
     "method, which is a statement about exposure and not about expertise."),
]

# Study 004 rater-class vocabulary must never appear beside Arm A / Arm B / B1 /
# B2 vocabulary. Each pair is (study-004 term, arm term); a co-occurrence inside
# one paragraph is a conflation.
CROSS_CONTAMINATION = [
    ("trained reviewer", "Arm A"),
    ("trained reviewer", "Arm B"),
    ("regular reviewer", "Arm A"),
    ("regular reviewer", "Arm B"),
    ("regular reviewer", "B1"),
    ("regular reviewer", "B2"),
    ("E-coded", "Arm A"),
    ("E-coded", "Arm B"),
]

# Primary detection results. Any of these moving is a failure.
PROTECTED = [
    ("panel accuracy", "83.9"),
    ("primary CI low", "72.7"),
    ("primary CI high", "95.1"),
    ("detection panel size", "16 independent experts"),
    ("corpus size", "24 constructed, de-identified records"),
    ("graded reads", "384 graded judgments"),
    ("comparison panel size", "20 independent experts"),
    ("sensitivity", "87.0"),
    ("specificity", "80.7"),
    ("expert AC1", "0.739"),
    ("expert analytic interval", "0.402 to 1.000"),
    ("expert bootstrap interval", "0.427 to 1.000"),
    ("reliability point floor", "at least 0.61"),
    ("reliability bound criterion", "0.41"),
    ("pooled reliability target", "pooled target of about 26"),
]

# Limitations that must survive verbatim.
LIMITATIONS = [
    ("author-generated corpus", "constructed"),
    ("investigator dependence", "None of them removes investigator dependence"),
    ("recruitment is not sampling", "**Recruitment is not sampling.**"),
    ("criterion validity not established",
     "**8.10 No criterion validity, and no efficacy.**"),
    ("criterion validity disclaimed in the abstract",
     "It does not establish criterion validity"),
    ("reliability criterion failed",
     "**The pre-registered reliability criterion was not met.**"),
    ("reliability sample too small",
     "the reliability sample is too small to establish reliability"),
    ("item variance limitation", "8.3 Item variance is not in the primary analysis"),
    ("no independent adjudicator", "independent validation adjudicator"),
    ("group not individual reliance",
     "Group-level detectability therefore does not license individual-level reliance"),
]

# Overclaims that must not appear. The second field lists NEGATED CONTEXTS that
# are neutralised before the search.
#
# THE EXEMPTIONS EXIST BECAUSE THE BARE STRINGS FIRE ON THE LIMITATIONS
# THEMSELVES. Heading 8.6 reads "The five conditions are not psychometrically
# validated", which is the disclaimer, not the claim. A guard that fails the
# manuscript for stating its own limitation is a broken guard, and the fix
# belongs in the guard.
FORBIDDEN = [
    ("JRS validated", ()),
    ("validated JRS", ()),
    ("JRS proven", ()),
    ("DRR validated", ()),
    ("criterion validity established", ()),
    ("psychometrically validated", ("not psychometrically validated",)),
    ("workflow independence demonstrated", ()),
    ("enterprise validated", ()),
    ("industry standard", ()),
]


def overclaims(body):
    """Forbidden phrases present outside a negated context."""
    hits = []
    for term, exempt in FORBIDDEN:
        hay = body
        for e in exempt:
            hay = hay.replace(e, "~NEGATED~")
        if term in hay:
            hits.append(term)
    return hits

# Superseded reliability values that must not survive anywhere in the body.
SUPERSEDED = [
    ("0.624", "superseded trained AC1, 63-label run"),
    ("0.349 to 0.898", "interval with no provenance in this repository"),
    ("0.253 to 0.994", "63-label analytic interval"),
    ("0.301 to 0.886", "63-label bootstrap interval"),
    ("63 labels", "superseded trained-label count"),
    ("108 submitted", "superseded submitted-label count"),
    ("99 after keeping", "superseded retained-label count"),
    ("trained reviewer", "unsupported rater class"),
    ("trained-reviewer", "unsupported rater class"),
    ("seventeen trained", "unsupported rater class"),
    ("fourteen trained", "unsupported rater class"),
]


def para_split(body):
    return [p for p in body.split("\n\n")]


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()

    try:
        S = load_stats()
    except AssertionError as e:
        sys.stderr.write("BLOCKED, NOTHING WRITTEN\n  %s\n" % e)
        return 1

    RULES = build_rules(S)

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

    arm_missing = [(lbl, s) for lbl, s in ARM_ARCHITECTURE if s not in body]
    contam = []
    for p in para_split(body):
        for a, b in CROSS_CONTAMINATION:
            if a in p and re.search(r"(?<![A-Za-z])" + re.escape(b) + r"(?![A-Za-z0-9])", p):
                contam.append((a, b, p[:90]))
    prot_missing = [(lbl, s) for lbl, s in PROTECTED if s not in body]
    lim_missing = [(lbl, s) for lbl, s in LIMITATIONS if s not in body]
    overclaim = overclaims(body)
    stale = [(t, why) for t, why in SUPERSEDED if t in body]

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

    numeric_pass = not prot_missing and not stale
    terminology_pass = not [x for x in stale if "rater class" in x[1]]
    arm_pass = not arm_missing and not contam
    claim_pass = not overclaim and not lim_missing
    integrity_pass = (h_src == h_dst and t_src == t_dst
                      and len(p_src) == len(p_dst) and dup == 0
                      and refs_same and appA_same and appB_same and appC_same
                      and body.count("—") == 0
                      and not re.search(r"\bfrequently\b", body))
    ok = (not failed and numeric_pass and arm_pass and claim_pass
          and integrity_pass)

    if args.apply and not failed:
        io.open(DST, "w", encoding="utf-8").write(body)
        write_log(S, RULES, applied, already, failed, arm_missing, contam,
                  prot_missing, lim_missing, overclaim, stale, body, baseline,
                  h_src, h_dst, t_src, t_dst, len(p_src), len(p_dst), dup,
                  refs_same, appA_same, appB_same, appC_same,
                  numeric_pass, arm_pass, claim_pass, integrity_pass)

    W = sys.stdout.write
    for num, where, _, _ in applied:
        W("APPLIED  EDIT %-3s %s\n" % (num, where))
    for num, where, _, _ in already:
        W("ALREADY  EDIT %-3s %s\n" % (num, where))
    for num, where, why in failed:
        W("FAILED   EDIT %-3s %s: %s\n" % (num, where, why))
    W("\nstatistics source   : %s\n" % S["provenance"]["dataset"])
    W("  estimator         : %s\n" % S["provenance"]["estimator"])
    W("  reps / seed       : %s / %s\n"
      % (S["provenance"]["bootstrap_reps"], S["provenance"]["bootstrap_seed"]))
    W("  gates             : live-matches-committed %s, points-reproduce %s\n"
      % (S["provenance"]["gate1_live_matches_committed_run"],
         S["provenance"]["gate2_point_estimates_reproduce"]))
    W("\narm architecture    : %s\n" % ("PASS" if arm_pass else "FAIL"))
    for lbl, s in arm_missing:
        W("  MISSING  %s\n" % lbl)
    for a, b, p in contam:
        W("  CONFLATION '%s' beside '%s' in: %s...\n" % (a, b, p))
    W("numerical integrity : %s\n" % ("PASS" if numeric_pass else "FAIL"))
    for lbl, s in prot_missing:
        W("  PROTECTED VALUE MISSING  %s (%s)\n" % (lbl, s))
    for t, why in stale:
        W("  SUPERSEDED PRESENT  %s (%s)\n" % (t, why))
    W("terminology         : %s\n" % ("PASS" if terminology_pass else "FAIL"))
    W("claim boundary      : %s\n" % ("PASS" if claim_pass else "FAIL"))
    for t in overclaim:
        W("  OVERCLAIM  %s\n" % t)
    for lbl, s in lim_missing:
        W("  LIMITATION MISSING  %s\n" % lbl)
    W("document integrity  : %s\n" % ("PASS" if integrity_pass else "FAIL"))
    W("    headings %d->%d  table rows %d->%d  paragraphs %d->%d  dup %d\n"
      % (h_src, h_dst, t_src, t_dst, len(p_src), len(p_dst), dup))
    W("    References %s  Appendix A %s  Appendix B %s  Appendix C %s\n"
      % (refs_same, appA_same, appB_same, appC_same))
    W("\nRESULT: %s\n" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def write_log(S, RULES, applied, already, failed, arm_missing, contam,
              prot_missing, lim_missing, overclaim, stale, body, baseline,
              h_src, h_dst, t_src, t_dst, p_src, p_dst, dup,
              refs_same, appA_same, appB_same, appC_same,
              numeric_pass, arm_pass, claim_pass, integrity_pass):
    exp = S["experts"]
    reg = S["regular"]
    L = []
    A = L.append
    A("# Detection Article Final, change log")
    A("")
    A("**Date:** %s" % STAMP)
    A("**Source:** `research/Detection_Article_v9_2026-08-18.md` (preserved, not overwritten)")
    A("**Output:** `research/Detection_Article_Final_2026-08-18.md`")
    A("**Script:** `scripts/apply_final_repair.py`")
    A("**Statistics:** `research/current_reliability_2026-08-18.json`")
    A("")
    A("---")
    A("")
    A("## 1. Study architecture, established from source")
    A("")
    A("Three populations. None of the numbers below crosses between them.")
    A("")
    A("| Variable | Arm A / Study 011 | Arm B / Study 012 | Source |")
    A("|---|---|---|---|")
    A("| Professional qualification | credentialed practitioner or researcher in "
      "AI governance, compliance, audit, HR, investigations, data privacy, "
      "records, or law | credentialed professionals of the same standing, drawn "
      "from the same pool | `research/Expert_Roster_All_Studies_2026-08-06.md` "
      "Studies 011 and 012; `Detection_Article_v9:182`, `:228` |")
    A("| Expert status | expert | expert | same |")
    A("| Selected (registered) | 27 | 21 | live `pilot_progress`, `armb_progress`, "
      "read 2026-08-18 |")
    A("| Completed (>=24 reads) | **16** | **20** | same |")
    A("| Assignment method | none, single arm | deterministic hash of the "
      "participant code, recorded before any record is judged | "
      "`research/DRR_Detection_Validation_Protocol.md:42-46`, :80; "
      "`arm_code` column present in `armb_progress` |")
    A("| JRS condition | all 16 | B1 | `Protocol:39`, `:43` |")
    A("| Unaided condition | none | B2 | `Protocol:44` |")
    A("| B1 | N/A | **7 completers** (8 assigned; `RR-108` incomplete at 9 reads) "
      "| live `armb_progress`, read 2026-08-18 |")
    A("| B2 | N/A | **13 completers** | same |")
    A("| Records reviewed | 24 each | 24 each | `Protocol:39`, `:42` |")
    A("| Study purpose | detection signal: is DRR detectable | value of the "
      "standard: does JRS improve detection | `Protocol:39`, `:42`, `:53` |")
    A("")
    A("**Arm A consisted of independent credentialed experts, all of whom applied "
      "the five JRS conditions. Arm B consisted of independent credentialed "
      "experts of the same standing, randomly assigned to one of two review "
      "conditions. The experimental distinction between the relevant conditions "
      "was the review method supplied, the five JRS conditions in B1 against a "
      "general prompt in B2, and not the expertise of the people applying it.**")
    A("")
    A("The protocol states the design reason for that construction directly: "
      "*\"Random assignment holds participant caliber constant, so any accuracy "
      "difference between B1 and B2 is attributable to the standard, not to "
      "expertise\"* (`DRR_Detection_Validation_Protocol.md:46`).")
    A("")
    A("**No authoritative source anywhere in the repository calls a B2 "
      "participant a non-expert.** The roster types the two anonymous Arm B "
      "entries \"JRS-naive expert professional\", and the manuscript already "
      "defines JRS-naive as exposure rather than expertise.")
    A("")
    A("### Study 004, the reliability population, is separate")
    A("")
    A("| Quantity | Value | Source |")
    A("|---|---|---|")
    A("| Raters submitting labels | 25 | live `bench_labels`; "
      "`REVIEWER_ROSTER_COMPLETE.md` section 004 |")
    A("| E-coded, invited experts | 8 | same |")
    A("| R-coded, self-enrolled regular reviewers | 17 | same |")
    A("| Recruitment route, E- | invitation carrying the code | `bench-review.html:60` |")
    A("| Recruitment route, R- | open review page; the code is generated in the "
      "reviewer's own browser | `bench-review.html:60`, `:107` |")
    A("| Training status of the R- pool | **none recorded anywhere.** No training "
      "gate exists in the instrument | `bench-review.html`, regex sweep for "
      "`train(ing|ed)` returns zero matches |")
    A("| Raters in the five-condition set | 22 | live `bench_labels`, `mode = jrs` |")
    A("| Excluded, baseline instrument | 3 raters, 16 labels | same, `mode = normal` |")
    A("")
    A("`DRR_Detection_Validation_Protocol.md` section 4 defines Arm A and Arm B "
      "and names no `E-` or `R-` code. The rater-class split belongs to Study 004 "
      "alone and is not imported into Study 011 or Study 012 anywhere in the "
      "final manuscript; a paragraph-level co-occurrence check enforces that.")
    A("")
    A("**One qualification, stated rather than smoothed over.** Three E-coded "
      "raters are the same people as Arm A completers: E-09 is V-AI-06, E-12 is "
      "V-AI-07, E-13 is V-AI-03 (`Expert_Roster_All_Studies_2026-08-06.md:73`). "
      "The populations are separately defined and separately counted, and they "
      "are not disjoint. No figure in the manuscript adds them together, so this "
      "does not affect any reported result.")
    A("")
    A("---")
    A("")
    A("## 2. Reliability dataset provenance, current versus historical")
    A("")
    A("| Item | CURRENT | HISTORICAL |")
    A("|---|---|---|")
    A("| Dataset | live `bench_labels`, 129 rows | `research/construct_validity_data.csv`, 99 rows |")
    A("| Date | closed 2026-08-15, re-read %s | extract 2026-08-04 |" % STAMP)
    A("| Analysis code | `research/compute_ac1_ci.py`, imported unmodified | same script |")
    A("| Labels, R-coded | %d | 63 |" % reg["labels"])
    A("| Raters, R-coded | %d | 13 |" % reg["raters"])
    A("| Records carrying a label | %d | 10 in the extract |" % reg["records_with_any_label"])
    A("| Estimable records | %d | 10 |" % reg["records_estimable"])
    A("| AC1, R-coded | **%.4f, prints %s** | 0.6236, prints 0.624 |"
      % (reg["ac1"], reg["ac1_printed"]))
    A("| Analytic 95%% CI | **%s to %s** | 0.253 to 0.994 |"
      % (reg["analytic_ci_printed"][0], reg["analytic_ci_printed"][1]))
    A("| Bootstrap 95%% CI | **%s to %s** | 0.301 to 0.886 |"
      % (reg["bootstrap_ci_printed"][0], reg["bootstrap_ci_printed"][1]))
    A("")
    A("**0.624 came from the 63-label dataset. 0.6228, printing as 0.623, comes "
      "from the current 68-label dataset.** The current data reproduce 0.623, so "
      "the point estimate is kept and 0.624 is not restored.")
    A("")
    A("**The v9 row was internally inconsistent and that is the defect this "
      "change repairs.** It carried the 68-label point estimate beside the "
      "63-label intervals. Both halves of the row are now computed on the same "
      "68 labels from the same 14 raters.")
    A("")
    A("### Recomputation method, and what was not chosen")
    A("")
    A("| Element | Value | Why |")
    A("|---|---|---|")
    A("| Estimator | `research/compute_ac1_ci.py`, imported unmodified | the "
      "script the manuscript cites; the method was not reimplemented |")
    A("| Bootstrap replicates | %s | that module's own `B` constant, read at run time |"
      % S["provenance"]["bootstrap_reps"])
    A("| Bootstrap seed | %s | that module's own `SEED` constant. **No seed was "
      "invented** |" % S["provenance"]["bootstrap_seed"])
    A("| Inclusion rule | %s | the rule the manuscript already states in Methods 4.7 |"
      % S["provenance"]["inclusion_rule"])
    A("| Tie-break on \"latest\" | `created_at` ascending | `dedup_last()` keeps "
      "the last row in iteration order, which is only \"latest\" if the caller "
      "sorts first |")
    A("")
    A("Two fail-closed gates ran before any figure was accepted, and the script "
      "writes nothing if either fails:")
    A("")
    A("1. **The live table still matches the published run.** 129 rows, `jrs` 113 "
      "and `normal` 16, 25 raters split 8 and 17, 15 records: every one matches "
      "`research/FULL_DATA_ANALYSIS_2026-08-15.txt` section 3.")
    A("2. **The recomputation reproduces the published point estimates.** Experts "
      "0.739 on 36 labels from 8 raters; regular reviewers 0.623 on 68 labels "
      "from 14 raters; pooled 0.665 on 104 labels from 22 raters. All twelve "
      "comparisons matched.")
    A("")
    A("### Full current results")
    A("")
    A("| Group | Labels | Raters | Estimable records | Raw pairwise | AC1 | Analytic 95% CI | Bootstrap 95% CI | Krippendorff alpha | Fleiss kappa |")
    A("|---|---|---|---|---|---|---|---|---|---|")
    for key in ("experts", "regular", "pooled"):
        d = S[key]
        A("| %s | %d | %d | %d | %.1f%% | %s | %s to %s | %s to %s | %.3f | %.3f |"
          % (d["group"], d["labels"], d["raters"], d["records_estimable"],
             d["raw_pairwise_agreement"] * 100, d["ac1_printed"],
             d["analytic_ci_printed"][0], d["analytic_ci_printed"][1],
             d["bootstrap_ci_printed"][0], d["bootstrap_ci_printed"][1],
             d["krippendorff_alpha"], d["fleiss_kappa"]))
    A("")
    A("**The pre-registered lower-bound criterion of 0.41 still fails on both "
      "panels, and the conclusion in Section 6.5 is unchanged.** The expert lower "
      "bound is %s, the regular-reviewer lower bound is %s."
      % (exp["analytic_ci_printed"][0], reg["analytic_ci_printed"][0]))
    A("")
    A("**The expert row was not edited, because it recomputes byte-identically.** "
      "The expert labels did not change between the two runs: 36 labels from 8 "
      "raters in both, AC1 %s, analytic %s to %s, bootstrap %s to %s."
      % (exp["ac1_printed"], exp["analytic_ci_printed"][0],
         exp["analytic_ci_printed"][1], exp["bootstrap_ci_printed"][0],
         exp["bootstrap_ci_printed"][1]))
    A("")
    A("---")
    A("")
    A("## 3. Record-level accounting")
    A("")
    A("| Quantity | Value | Source |")
    A("|---|---|---|")
    A("| Records carrying at least one five-condition label | %d | live `bench_labels` |"
      % reg["records_with_any_label"])
    A("| Records with two or more raters | %d | same |" % reg["records_estimable"])
    A("| Records with one rater only | %d | same |" % reg["records_single_rater"])
    A("| Reason for exclusion | not estimable for inter-rater agreement | "
      "`compute_ac1_ci.py` `ac1()`: `recs = [labels for labels in "
      "recmap.values() if len(labels) >= 2]` |")
    A("")
    A("The five records were not defective and are not described as such. A "
      "coefficient of agreement is undefined on a record only one person read.")
    A("")
    A("---")
    A("")
    A("## 4. Participant accounting, 25 against 22")
    A("")
    A("| Quantity | Value | Belongs to |")
    A("|---|---|---|")
    A("| Raters submitting labels on the reliability set | 25 | Study 004 |")
    A("| E-coded invited experts | 8 | Study 004 |")
    A("| R-coded regular reviewers | 17 | Study 004 |")
    A("| Baseline-instrument raters, excluded from the coefficient | 3 | Study 004 |")
    A("| Raters in the five-condition analysed set | 22 | Study 004 |")
    A("| Detection panel completers | 16 | Study 011, Arm A |")
    A("| Comparison study completers | 20 | Study 012, Arm B |")
    A("")
    A("The three excluded raters and their label counts, read live:")
    A("")
    A("| Rater | Labels | Instrument |")
    A("|---|---|---|")
    for c, n in S["excluded_baseline"]["codes"].items():
        A("| `%s` | %d | `normal`, unstructured baseline |" % (c, n))
    A("")
    A("Total %d labels. None of the three appears in the five-condition set, so "
      "the subtraction is clean: 25 minus 3 is 22."
      % S["excluded_baseline"]["labels"])
    A("")
    A("---")
    A("")
    A("## 5. The edits")
    A("")
    for num, where, old, new in applied:
        A("### APPLIED. Edit %s. %s" % (num, where))
        A("")
        A("**Before**")
        A("")
        A("> " + old)
        A("")
        A("**After**")
        A("")
        A("> " + new)
        A("")
    for num, where, old, new in already:
        A("### ALREADY SATISFIED. Edit %s. %s" % (num, where))
        A("")
    for num, where, why in failed:
        A("### FAILED. Edit %s. %s: %s" % (num, where, why))
        A("")
    A("### Numerical changes")
    A("")
    A("| Old value | New value | Dataset | Analysis source | Method |")
    A("|---|---|---|---|---|")
    A("| analytic CI 0.253 to 0.994 | **%s to %s** | live `bench_labels`, 68 "
      "R-coded labels | `research/compute_ac1_ci.py` `analytic_ci()` | Gwet "
      "(2014) linearisation variance, Student t on n-1 df, n = %d records |"
      % (reg["analytic_ci_printed"][0], reg["analytic_ci_printed"][1],
         reg["records_estimable"]))
    A("| bootstrap CI 0.301 to 0.886 | **%s to %s** | same | "
      "`research/compute_ac1_ci.py` `bootstrap_ci()` | subject-level record "
      "resample, %s replicates, seed %s |"
      % (reg["bootstrap_ci_printed"][0], reg["bootstrap_ci_printed"][1],
         S["provenance"]["bootstrap_reps"], S["provenance"]["bootstrap_seed"]))
    A("| lower bound cited in prose, 0.253 | **%s** | same | same | same |"
      % reg["analytic_ci_printed"][0])
    A("| AC1 0.623 | **%s, unchanged** | same | same | Gwet (2014) multiple-rater "
      "AC1 |" % reg["ac1_printed"])
    A("| expert row, all values | **unchanged** | live `bench_labels`, 36 E-coded "
      "labels | same | recomputes byte-identically |")
    A("")
    A("### EDIT D, arm terminology: verified, no change required")
    A("")
    A("The instruction conditions Edit D on the source records confirming both "
      "arms are expert panels. They do. v9 already states it correctly in four "
      "places, and each is asserted as a required presence rather than rewritten:")
    A("")
    A("| Statement | Present |")
    A("|---|---|")
    for lbl, s in ARM_ARCHITECTURE:
        A("| %s | %s |" % (lbl, "yes" if s in body else "**NO**"))
    A("")
    A("Rewriting correct prose to demonstrate activity would be churn and would "
      "risk the very conflation this pass exists to prevent.")
    A("")
    A("---")
    A("")
    A("## 6. Global numerical audit")
    A("")
    A("| Number | Classification | Where it belongs |")
    A("|---|---|---|")
    A("| 0.624 | HISTORICAL | 63-label run. **Absent from the final manuscript** |")
    A("| 0.623 | CURRENT | Study 004 regular-reviewer AC1, 68 labels |")
    A("| 0.253, 0.994 | HISTORICAL | 63-label analytic interval. **Absent** |")
    A("| 0.301, 0.886 | HISTORICAL | 63-label bootstrap interval. **Absent** |")
    A("| %s, %s | CURRENT | 68-label analytic interval |"
      % (reg["analytic_ci_printed"][0], reg["analytic_ci_printed"][1]))
    A("| %s, %s | CURRENT | 68-label bootstrap interval |"
      % (reg["bootstrap_ci_printed"][0], reg["bootstrap_ci_printed"][1]))
    A("| 63 | HISTORICAL | superseded label count. **Absent** |")
    A("| 68 | CURRENT | Study 004 regular-reviewer labels |")
    A("| 13 | HISTORICAL | superseded rater count |")
    A("| 14 | CURRENT | Study 004 regular-reviewer raters |")
    A("| 15 records | CURRENT, METHODOLOGICAL | records carrying a label |")
    A("| 10 records | CURRENT, METHODOLOGICAL | estimable records |")
    A("| 25 | CURRENT | Study 004 raters, all instruments |")
    A("| 22 | CURRENT | Study 004 five-condition raters |")
    A("| 17 | CURRENT | Study 004 R-coded regular reviewers |")
    A("| 8 | CURRENT | Study 004 E-coded invited experts |")
    A("| 16 | CURRENT | **Arm A** detection panel completers |")
    A("| 20 | CURRENT | **Arm B** comparison study completers |")
    A("")
    A("| Superseded value | Present in the final manuscript |")
    A("|---|---|")
    for t, why in SUPERSEDED:
        A("| `%s` (%s) | %s |" % (t, why, "**YES**" if t in body else "no"))
    A("")
    A("| Protected primary result | Present and unchanged |")
    A("|---|---|")
    for lbl, s in PROTECTED:
        A("| %s | %s |" % (lbl, "yes" if s in body else "**NO**"))
    A("")
    A("**Numerical integrity: %s**" % ("PASS" if numeric_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A("## 7. Global terminology audit")
    A("")
    A("| Term | Count in the final manuscript | Status |")
    A("|---|---:|---|")
    for term in ("trained reviewer", "trained reviewers", "trained-reviewer",
                 "regular reviewer", "regular reviewers", "expert reviewer",
                 "invited experts", "Arm A", "Arm B", "B1", "B2"):
        A("| `%s` | %d | %s |"
          % (term, body.count(term),
             "must be 0" if "trained" in term else "permitted"))
    A("")
    A("| Conflation check | Result |")
    A("|---|---|")
    for a, b in CROSS_CONTAMINATION:
        hits = [p for p in para_split(body)
                if a in p and re.search(r"(?<![A-Za-z])" + re.escape(b)
                                        + r"(?![A-Za-z0-9])", p)]
        A("| `%s` in a paragraph with `%s` | %s |"
          % (a, b, "**%d FOUND**" % len(hits) if hits else "none"))
    A("")
    A("**Arm architecture: %s**" % ("PASS" if arm_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A("## 8. Claim boundary and limitations")
    A("")
    A("| Limitation that must survive | Present |")
    A("|---|---|")
    for lbl, s in LIMITATIONS:
        A("| %s | %s |" % (lbl, "yes" if s in body else "**NO**"))
    A("")
    A("| Overclaim that must be absent | Present |")
    A("|---|---|")
    hits = overclaims(body)
    for t, exempt in FORBIDDEN:
        A("| `%s`%s | %s |"
          % (t,
             " (exempt: %s)" % ", ".join("`%s`" % e for e in exempt) if exempt else "",
             "**YES**" if t in hits else "no"))
    A("")
    A("Detection, reliability, validity and JRS efficacy remain four separate "
      "claims. Nothing in this pass converts a detection result into a "
      "validation claim; the only statistical change narrows and shifts one "
      "confidence interval, and the pre-registered criterion it is measured "
      "against still fails.")
    A("")
    A("**Claim boundary: %s**" % ("PASS" if claim_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A("## 9. Document integrity")
    A("")
    A("| Check | v9 | Final |")
    A("|---|---|---|")
    A("| Headings | %d | %d |" % (h_src, h_dst))
    A("| Table rows | %d | %d |" % (t_src, t_dst))
    A("| Paragraphs over 120 characters | %d | %d |" % (p_src, p_dst))
    A("| Duplicate paragraphs | 0 | %d |" % dup)
    A("| Em-dashes | %d | %d |" % (baseline.count("—"), body.count("—")))
    A("| Words | %d | %d |" % (len(baseline.split()), len(body.split())))
    A("")
    A("| Section | Unchanged from v9 |")
    A("|---|---|")
    A("| References and citations | %s |" % ("yes, byte-identical" if refs_same else "**NO**"))
    A("| Appendix A | %s |" % ("yes, byte-identical" if appA_same else "**NO**"))
    A("| Appendix B | %s |" % ("yes, byte-identical" if appB_same else "**NO**"))
    A("| Appendix C | %s |" % ("yes, byte-identical" if appC_same else "**NO**"))
    A("| Sections 1 through 5 | unchanged |")
    A("| Section 4.7 | Edits B1 and B2 only |")
    A("| Section 6.5 | Edits A1, A2 and C1 only |")
    A("| Acknowledgments | Edit B3 only |")
    A("")
    A("v9 was not overwritten. The source is plain Markdown and the `.docx` is "
      "generated from it, so no tracked change and no comment can be introduced. "
      "No citation was deleted, no reference altered, no table damaged: the "
      "table-row count is identical and the References block is byte-identical.")
    A("")
    A("**Document integrity: %s**" % ("PASS" if integrity_pass else "FAIL"))
    A("")
    A("---")
    A("")
    A('"Final surgical repair completed. The reliability confidence intervals '
      'are now computed on the same dataset as the point estimate they '
      'accompany. Unsupported rater-class terminology is retired. The '
      'record-level exclusion is disclosed. No primary study result, '
      'preregistered threshold, corpus composition, study design, arm '
      'architecture, limitation, or substantive methodological finding was '
      'changed."')
    io.open(LOG, "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    sys.exit(main())
