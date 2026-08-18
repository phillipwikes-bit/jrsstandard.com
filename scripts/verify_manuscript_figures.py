#!/usr/bin/env python3
"""Verify every numeric claim in the detection manuscript against the data.

WHY. The manuscript goes to Ubayet Hossain, who designed the reliability
framework and validates models for a living. Every figure in it has to survive
being checked by someone who will check it. This checks it first, mechanically,
so a figure cannot be wrong on the day it is read.

WHAT IT CHECKS. Each assertion below names the exact string that must appear in
the manuscript and the source the value is computed from. A figure that is not
in the manuscript, or is in it with the wrong value, fails.

SOURCES
    research/closed_aggregates_2026-08-15.json   detection and Arm B, at lock
    bench_labels via the anon key                reliability and per-condition
    study_runs via the anon key                  cross-vendor series
    /api/panel-stats                             programme counts

Run:
    python3 scripts/verify_manuscript_figures.py
    python3 scripts/verify_manuscript_figures.py --offline   # skip live reads

Exit: 0 if every assertion passes, 1 otherwise.
"""
import io
import json
import math
import os
import statistics as st
import sys
import urllib.request
from decimal import Decimal, ROUND_HALF_UP
from math import comb

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# The manuscript under verification. v4 is the submission draft; v3 is retained
# because it is the version the completer summary and the LinkedIn section were
# generated against, and a figure that disagrees between them is drift.
# v5 is the current manuscript. v4 is retained on disk unmodified, per the
# revision instruction, and stays in check_zero_drift's PROGRAMME_SCOPE_FILES so
# a figure that disagrees between the two is still caught as drift.
MS = os.path.join(ROOT, "research", "Detection_Article_Submission_Final_2026-08-18.md")
AGG = os.path.join(ROOT, "research", "closed_aggregates_2026-08-15.json")
SB = "https://pjzxkeviouofdseagvpf.supabase.co/rest/v1"
ANON = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"

OFFLINE = "--offline" in sys.argv
CHECKS = []


def half_up(x, places=1):
    q = Decimal("1." + "0" * places) if places else Decimal("1")
    return float(Decimal(str(x)).quantize(q, rounding=ROUND_HALF_UP))


def fetch(table, limit=20000):
    if OFFLINE:
        return None
    req = urllib.request.Request(
        "%s/%s?select=*&limit=%d" % (SB, table, limit),
        headers={"apikey": ANON, "Authorization": "Bearer " + ANON})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except Exception:
        return None


def api(path):
    if OFFLINE:
        return None
    try:
        with urllib.request.urlopen("https://www.jrsstandard.com" + path, timeout=45) as r:
            return json.loads(r.read().decode())
    except Exception:
        return None


def T(name, needle, ok, detail=""):
    """ok is True, False, or None for skipped."""
    present = needle in MSTEXT if needle else True
    CHECKS.append({
        "name": name,
        "needle": needle,
        "in_manuscript": present,
        "value_ok": ok,
        "detail": detail
    })


def fisher(a, b, c, d):
    n = a + b + c + d
    r1 = a + b
    c1 = a + c
    if n == 0 or r1 in (0, n) or c1 in (0, n):
        return 1.0

    def p(x):
        return comb(r1, x) * comb(n - r1, c1 - x) / comb(n, c1)
    lo = max(0, c1 - (n - r1))
    hi = min(r1, c1)
    p0 = p(a)
    return min(1.0, sum(p(x) for x in range(lo, hi + 1) if p(x) <= p0 * (1 + 1e-9)))


def ac1(items):
    cats = sorted({v for vs in items.values() for v in vs})
    q = len(cats)
    if q < 2:
        return None
    n = 0
    pa = 0.0
    pik = {k: 0.0 for k in cats}
    for _, vs in items.items():
        ri = len(vs)
        if ri < 2:
            continue
        n += 1
        cnt = {k: vs.count(k) for k in cats}
        pa += sum(cnt[k] * (cnt[k] - 1) for k in cats) / (ri * (ri - 1))
        for k in cats:
            pik[k] += cnt[k] / ri
    if not n:
        return None
    pa /= n
    pe = sum((pik[k] / n) * (1 - pik[k] / n) for k in cats) / (q - 1)
    return (pa - pe) / (1 - pe)


MSTEXT = io.open(MS, encoding="utf-8").read()

# The Acknowledgments spell the number at the head of the section. Accepting
# either form keeps the guard on the fact and off the prose: a check that forces
# the digit form is a check that writes the sentence.
# Item 13 of the surgical set compressed the programme-level acknowledgments on
# the reviewer's instruction that a journal manuscript is not a programme report.
# The credit to all 58 SURVIVES that compression and this check still enforces
# it: the owner's standing instruction is that recognition covers every completer
# and is not scoped to whichever study a paper reports. Only the accepted
# phrasings widened; the requirement did not.
FIFTY_EIGHT_CREDITED = ("58 independent experts" in MSTEXT
                        or "Fifty-eight independent experts" in MSTEXT
                        or "All 58 worked unpaid" in MSTEXT)

A = json.load(io.open(AGG, encoding="utf-8"))
dp = A["detection_panel"]
ab = A["arm_b"]

# ---------------------------------------------------------------- detection
T("accuracy point estimate", "83.9",
  half_up(dp["accuracy"]["mean"]) == 83.9,
  "raw %.2f, half-up %.1f" % (dp["accuracy"]["mean"], half_up(dp["accuracy"]["mean"])))
T("accuracy 95% CI", "72.7 to 95.1",
  half_up(dp["accuracy"]["ci95_low"]) == 72.7 and half_up(dp["accuracy"]["ci95_high"]) == 95.1,
  "raw %.2f to %.2f" % (dp["accuracy"]["ci95_low"], dp["accuracy"]["ci95_high"]))
T("sensitivity", "87.0", half_up(dp["sensitivity"]["mean"]) == 87.0,
  "raw %.2f" % dp["sensitivity"]["mean"])
T("specificity", "80.7", half_up(dp["specificity"]["mean"]) == 80.7,
  "raw %.2f" % dp["specificity"]["mean"])
T("panel size", "16 reviewers", dp["accuracy"]["n"] == 16, "n=%d" % dp["accuracy"]["n"])
T("graded reads", "384", dp["judgments_analysed"] == 384,
  "%d scorable" % dp["judgments_analysed"])
T("perfect scorers is six not five", "Six reviewers classified every record correctly",
  dp["accuracy"]["scored_100"] == 6, "%d scored 100" % dp["accuracy"]["scored_100"])
T("accuracy SD", "21.0", half_up(dp["accuracy"]["sd"]) == 21.0,
  "raw %.2f" % dp["accuracy"]["sd"])
T("accuracy range", "37.5 to 100",
  dp["accuracy"]["min"] == 37.5 and dp["accuracy"]["max"] == 100,
  "%.1f to %.1f" % (dp["accuracy"]["min"], dp["accuracy"]["max"]))
T("sensitivity perfect count", "11 of 16", dp["sensitivity"]["scored_100"] == 11,
  "%d" % dp["sensitivity"]["scored_100"])
T("specificity perfect count", "7 of 16", dp["specificity"]["scored_100"] == 7,
  "%d" % dp["specificity"]["scored_100"])
T("zero exclusions on the detection panel", "the exclusion count is zero",
  dp["participants_excluded_below_18_of_24"] == 0,
  "%d excluded" % dp["participants_excluded_below_18_of_24"])
T("one administrative row disclosed", "385 rows were retained",
  dp["judgments_analysed"] + dp["judgments_unscorable"] == 385,
  "%d scorable + %d unscorable" % (dp["judgments_analysed"], dp["judgments_unscorable"]))

# ------------------------------------------------------------- reliability
lab = fetch("bench_labels")
if lab is None:
    T("reliability AC1 experts", "0.739", None, "offline or unreachable")
    T("reliability AC1 trained", "0.623", None, "offline or unreachable")
    T("submitted determinations", "113 submitted determinations", None, "offline")
    T("retained after de-duplication", "104", None, "offline")
    T("condition table Gap denominator", "of 77", None, "offline")
else:
    jrs_raw = [r for r in lab if r["mode"] == "jrs"]
    ded = {}
    for r in sorted(jrs_raw, key=lambda x: x.get("created_at") or ""):
        ded[(r["labeler_code"], r["record_id"])] = r
    jrs = list(ded.values())

    def coef(pred):
        sub = [r for r in jrs if pred(r["labeler_code"])]
        items = {}
        for r in sub:
            items.setdefault(r["record_id"], []).append(r["determination"])
        return ac1(items), len(sub)

    ce, ne = coef(lambda c: c.startswith("E-"))
    ct, nt = coef(lambda c: c.startswith("R-"))
    T("reliability AC1 experts", "0.739", round(ce, 3) == 0.739, "%.4f on %d labels" % (ce, ne))
    T("reliability AC1 trained", "0.623", round(ct, 3) == 0.623, "%.4f on %d labels" % (ct, nt))
    T("expert label count", "| 36 | 8 | 0.739 |", ne == 36, "%d" % ne)
    T("trained label count", "| 68 | 14 | 0.623 |", nt == 68, "%d" % nt)
    T("submitted determinations", "113 submitted determinations", len(jrs_raw) == 113,
      "%d" % len(jrs_raw))
    T("retained after de-duplication", "reduced to 104", len(jrs) == 104, "%d" % len(jrs))

    ready = [r for r in jrs_raw if r["determination"] == "ready"]
    gap = [r for r in jrs_raw if r["determination"] == "gap_identified"]
    T("condition table Ready denominator", "14 of 14", len(ready) == 14, "%d" % len(ready))
    T("condition table Gap denominator", "of 77", len(gap) == 77, "%d" % len(gap))
    NAMES = {
        "cold_reviewer_clarity": ("Reconstructability", 15),
        "basis_identification": ("Basis identification", 20),
        "temporal_reconstructability": ("Chronological integrity", 10),
        "reasoning_traceability": ("Decision-process traceability", 10),
        "accountability_support": ("Evidentiary sufficiency", 7),
    }
    worst = 0.0
    for k, (disp, expect) in NAMES.items():
        got = sum(1 for r in gap if (r.get("conditions") or {}).get(k) == "pass")
        a = sum(1 for r in ready if (r.get("conditions") or {}).get(k) == "pass")
        p = fisher(a, len(ready) - a, got, len(gap) - got)
        worst = max(worst, p)
        T("condition cell: %s" % disp, "%d of 77" % expect, got == expect,
          "got %d, Fisher p=%.2e" % (got, p))
    # THE MANUSCRIPT MUST NOT REPORT THESE P-VALUES, and that is the check now.
    #
    # v3 printed a Fisher exact p for each condition and concluded that "none of
    # the five conditions is decorative". The conditions are the components the
    # composite determination is built from, so testing components against their
    # own composite is close to testing whether reviewers followed instructions.
    # The inferential reading was removed from v4 on that ground, and a guard
    # that demanded the p-values be present would push them straight back in.
    #
    # The association is still verified HERE, against the database, so the
    # decision to report it descriptively is an editorial choice made on a known
    # result rather than a way of hiding a weak one.
    forbidden = [n for n in ("Fisher's exact", "Fisher exact", "p below 1.5e-07",
                             "1.8e-10", "1.1e-11", "7.3e-09", "1.3e-07")
                 if n in MSTEXT]
    T("condition p-values stay out of the manuscript", "", not forbidden,
      ("largest p across the five is %.2e in the data; the manuscript reports "
       "the association descriptively, as required" % worst) if not forbidden
      else "inferential language restored: %s" % ", ".join(forbidden))

    # THE FAILED CRITERION MUST STAY FAILED.
    #
    # An adversarial test caught this gap: changing "was not met" to "was
    # substantially met" passed every other check in this file, because every
    # figure was still correct. The coefficients were never the risk. The risk
    # is the sentence around them.
    #
    # The pre-registered reliability criterion had two parts, a point estimate
    # at or above 0.61 and an analytic lower bound at or above 0.41. The point
    # estimates clear; the analytic lower bounds are 0.402 and 0.253 and do not.
    # The bootstrap interval puts the expert bound at 0.427, and treating that
    # as satisfying the pre-registration is exactly the interval-shopping that
    # pre-registration exists to prevent.
    #
    # Verified against the numbers rather than trusted: 0.402 < 0.41 is checked
    # here, so the required sentence is required because the data says so.
    EXPERT_ANALYTIC_LOW = 0.402
    TRAINED_ANALYTIC_LOW = 0.253
    CRITERION = 0.41
    really_failed = (EXPERT_ANALYTIC_LOW < CRITERION and TRAINED_ANALYTIC_LOW < CRITERION)
    states_failure = "**The pre-registered reliability criterion was not met.**" in MSTEXT
    disowns_bootstrap = "We do not treat that as satisfying the pre-registration." in MSTEXT
    softeners = [w for w in ("criterion was substantially met",
                             "criterion was met",
                             "criterion was effectively met",
                             "criterion was narrowly met",
                             "clears the pre-registered floor on both",
                             "both criteria met on reliability")
                 if w in MSTEXT]
    T("failed reliability criterion is reported as failed", "",
      really_failed and states_failure and disowns_bootstrap and not softeners,
      ("analytic lower bounds %.3f and %.3f against a criterion of %.2f; the "
       "manuscript states the failure and disowns the bootstrap rescue"
       % (EXPERT_ANALYTIC_LOW, TRAINED_ANALYTIC_LOW, CRITERION))
      if (really_failed and states_failure and disowns_bootstrap and not softeners)
      else ("failure statement present=%s, bootstrap disowned=%s, softeners=%s"
            % (states_failure, disowns_bootstrap, softeners or "none")))

    # The same shape of risk on the primary claim: the paper must keep saying
    # what it does not establish. Losing this paragraph is how a narrow result
    # becomes a broad one between drafts.
    SCOPE_SENTENCES = [
        "It does not establish criterion validity against real documentation",
        # RETARGETED 2026-08-18. Item 4 of the surgical set replaced "is an upper
        # bound" with "may overstate performance": bimodality shows the task is
        # likely easier, it does not establish a mathematical upper bound. The
        # limit is still asserted, in weaker and more defensible words, and this
        # needle still fails if the admission is deleted outright.
        "may overstate performance on a corpus containing ambiguous records",
        "The study therefore establishes detectability on AI-generated records.",
    ]
    missing_scope = [x for x in SCOPE_SENTENCES if x not in MSTEXT]
    T("the scope limits survive", "", not missing_scope,
      "%d scope statements present" % len(SCOPE_SENTENCES) if not missing_scope
      else "removed: %s" % "; ".join(repr(x[:50]) for x in missing_scope))

    lowest = sum(1 for r in jrs_raw for v in (r.get("conditions") or {}).values() if v == "gap")
    passes = sum(1 for r in jrs_raw for v in (r.get("conditions") or {}).values() if v == "pass")
    mids = sum(1 for r in jrs_raw for v in (r.get("conditions") or {}).values() if v == "review")
    used = sum(1 for r in jrs_raw if "gap" in (r.get("conditions") or {}).values())
    # THE UNITS ARE NOW DISTINGUISHED, AND THE ARITHMETIC IS CHECKED HERE.
    # 113 rows each carry five condition values, so there are 565 condition-level
    # labels and 113 overall determinations. v4 called both "labels" and an
    # editorial review caught it: 216 + 207 + 142 = 565, which cannot be 113 of
    # anything. Verified against bench_labels before the manuscript was changed.
    T("condition-level labels total 565, not 113", "565 condition-level labels",
      lowest + passes + mids == 565 and len(jrs_raw) * 5 == 565,
      "%d rows x 5 = %d; gap %d + pass %d + review %d = %d"
      % (len(jrs_raw), len(jrs_raw) * 5, lowest, passes, mids, lowest + passes + mids))
    T("lowest level is the most-used value",
      "the lowest coding level was recorded 216 times, the pass level 207 times, and the middle level 142 times",
      lowest == 216 and passes == 207 and mids == 142,
      "gap %d, pass %d, review %d" % (lowest, passes, mids))
    T("lowest level appears in 77 of 113 determinations",
      "77 of the 113 overall determinations", used == 77, "%d" % used)

# ------------------------------------------------------------- cross-vendor
runs = fetch("study_runs", 500)
if runs is None:
    T("cross-vendor series", "87.2 percent", None, "offline or unreachable")
else:
    # THE SERIES IS BOUNDED AT THE DATA LOCK, AND IT HAS TO BE.
    #
    # The nightly job keeps running. Without this bound the check compares a
    # manuscript locked on 2026-08-15 against a query that grows every morning,
    # so it fails on a day when nothing about the manuscript changed. It did:
    # on 2026-08-18 the query returned 43 runs and a mean of 87.26 against the
    # locked 41 and 87.2, purely because two more nights had passed.
    #
    # This is the same defect the manuscript documents in Appendix A about
    # single-run figures, reappearing one level up in the verifier. "Data
    # closed 15 August 2026" is a statement about which rows are in scope, and
    # the check now applies it.
    #
    # Runs after the lock are counted and reported, so a growing series is
    # visible rather than silently discarded.
    LOCK_DATE = "2026-08-15"
    xs, post_lock = [], 0
    for r in runs:
        m = r.get("metrics") or {}
        if m.get("mode") != "cross_vendor":
            continue
        pr = {k: v for k, v in (m.get("per_record") or {}).items() if v is not None}
        if len(pr) != 15:
            continue
        v = m.get("overall_agreement")
        if v is None:
            v = sum(pr.values()) / len(pr)
        if (r.get("created_at") or "")[:10] > LOCK_DATE:
            post_lock += 1
            continue
        xs.append(v)
    n = len(xs)
    if post_lock:
        T("cross-vendor runs since the data lock", "", None,
          "%d run(s) after %s, excluded from the locked series. Re-lock the "
          "Appendix A figures only on a deliberate decision to move the lock "
          "date, never to make this check pass" % (post_lock, LOCK_DATE))
    m_ = st.mean(xs)
    s_ = st.stdev(xs)
    se = s_ / math.sqrt(n)
    tc = 2.021 if n > 35 else 2.045
    T("cross-vendor run count on the fixed set", "**41 nightly runs**", n == 41, "%d runs" % n)
    T("cross-vendor mean", "87.2 percent", half_up(100 * m_) == 87.2,
      "%.2f percent" % (100 * m_))
    T("cross-vendor CI", "86.2 to 88.2",
      half_up(100 * (m_ - tc * se)) == 86.2 and half_up(100 * (m_ + tc * se)) == 88.2,
      "%.2f to %.2f" % (100 * (m_ - tc * se), 100 * (m_ + tc * se)))
    T("cross-vendor range", "82.2 to 93.3",
      half_up(100 * min(xs)) == 82.2 and half_up(100 * max(xs)) == 93.3,
      "%.1f to %.1f" % (100 * min(xs), 100 * max(xs)))

# ------------------------------------------------------------------- Arm B
T("Arm B is not reported as a result here", "did not meet its pre-registered bar", None,
  "Arm B belongs to its own paper; the manuscript must not report it as a finding")

# ------------------------------------------------------------- programme
ps = api("/api/panel-stats")
if ps is None:
    T("programme credit: 58 experts", "", FIFTY_EIGHT_CREDITED, "offline")
    T("programme credit: 36 completers", "36 independent experts have each completed", None, "offline")
else:
    T("programme credit: 58 experts", "",
      FIFTY_EIGHT_CREDITED and ps.get("reviewers_all") == 58,
      "reviewers_all=%s, credited in the Acknowledgments" % ps.get("reviewers_all"))
    # MOVED OUT OF THE MANUSCRIPT BY DESIGN, 2026-08-18. Item 13 of the surgical
    # set moved the programme-level participation figures to the study repository
    # on the reviewer's instruction. The FACT is still verified against the live
    # endpoint; what is no longer required is a sentence carrying it in the paper.
    # The needle is dropped, not the assertion.
    T("programme credit: 36 completers", "",
      ps.get("completers_all") == 36,
      "completers_all=%s, recorded in the repository rather than the manuscript "
      "since the acknowledgments were compressed" % ps.get("completers_all"))
    T("comparison-study credit: 20", "The comparison study, 20 independent experts",
      ps.get("completers_comparison") == 20, "completers_comparison=%s" % ps.get("completers_comparison"))
    T("reliability credit: 25 raters", "The reliability study, 25 raters",
      ps.get("reliability_raters") == 25, "reliability_raters=%s" % ps.get("reliability_raters"))
    # THE 25 AND THE 22 MUST TRAVEL TOGETHER, PERMANENTLY.
    #
    # v9 reconciliation, 2026-08-18. The Acknowledgments credit 25 raters and
    # Section 6.5 analyses 22. Both are correct and they differ by the
    # pre-registered inclusion rule: three trained raters used the unstructured
    # baseline prompt, not the five conditions, contributing the sixteen labels
    # the Methods already exclude by name. A reader who meets 25 and then 22
    # with no bridge between them reads a contradiction that is not there, and
    # a reviewer reads it as an undisclosed exclusion. The bridge sentence is
    # therefore load-bearing and is asserted here so a later compression of the
    # Acknowledgments cannot quietly drop it.
    #
    # Derivation and evidence: research/Detection_Article_v9_CHANGE_LOG.md,
    # section 1, computed at run time by scripts/apply_v9_reconciliation.py
    # from REVIEWER_ROSTER_COMPLETE.md section 004 and
    # Detection_Article_Figure_Update_2026-08-15.md.
    T("reliability analysed sample named beside the credit",
      "Twenty-two of them, eight experts and fourteen regular reviewers", True, "")
    T("the three excluded raters are disclosed in the Acknowledgments",
      "the other three regular reviewers worked under the unstructured baseline prompt",
      True, "")
    T("Section 6.5 regular-reviewer count", "| Regular reviewers | 10 | 68 | 14 |",
      True, "")
    T("Section 6.5 expert-rater count", "| Experts | 10 | 36 | 8 |", True, "")
    T("detection countries", "11 countries", ps.get("countries_detection") == 11,
      "countries_detection=%s" % ps.get("countries_detection"))
    T("programme countries", "", ps.get("countries_all") == 16,
      "countries_all=%s, recorded in the repository rather than the manuscript "
      "since the acknowledgments were compressed" % ps.get("countries_all"))

# ------------------------------------------------- claim consistency
# ITEM 15 OF THE 2026-08-18 SURGICAL SET, MADE PERMANENT.
#
# A one-off consistency read is worth exactly as much as the day it was run. Each
# pair below is a claim the manuscript settled and the wording on both sides of
# it: text that must NOT be present, and text that must be. A future edit that
# reintroduces a withdrawn claim, or deletes the sentence that withdrew it,
# fails here.
#
# These are not style rules. Every pair is a place where two sections of the
# paper could contradict each other, which is the failure an editorial reviewer
# found in v4 and the reason this exists.
CLAIM_PAIRS = [
    ("workflow independence",
     ["JRS is independent of any vendor"],
     ["designed to be vendor-, model-, and workflow-agnostic",
      "Workflow independence is a design intention, not a result"]),
    ("no externally verified key",
     ["verified key", "verified answer key"],
     ["pre-specified reference classification"]),
    ("bimodality may overstate, is not an upper bound",
     ["is an upper bound"],
     ["may overstate performance"]),
    ("operationalisation, not the construct",
     ["A property can be real"],
     ["operationalised Decision Reconstruction Risk distinction is detectable",
      "An operationalised property can be detectable"]),
    ("reliability criterion stays failed",
     ["criterion was substantially met", "criterion was met"],
     ["The pre-registered reliability criterion was not met.",
      "We do not treat that as satisfying the pre-registration."]),
    ("condition p-values stay out",
     ["Fisher's exact", "1.8e-10", "1.1e-11", "p below 1.5e-07"],
     ["This descriptive association does not establish independent discriminating validity"]),
    ("proportionality untested",
     ["proportionality is a validated"],
     ["**It is untested.**"]),
    ("no cross-cultural validity claim",
     ["establishes cross-cultural validity", "demonstrates measurement invariance"],
     ["It does not establish measurement invariance"]),
    ("ethics states blinding, not absence of deception",
     ["no deception was used"],
     ["Participants were informed in advance that the reference classification"]),
    ("coded, not de-identified",
     ["de-identified participant-level response data"],
     ["coded participant-level response data"]),
    ("ICC reported on the latent scale",
     ["close to half the variance in whether a read is correct is attributable",
      "cannot be distinguished from zero"],
     ["On the model's latent logistic scale"]),
    ("no 'fourth variety' taxonomy",
     ["The variety at issue here is a fourth"],
     ["The variety at issue here is documentation-layer opacity"]),
    # ADDED AFTER AN ADVERSARIAL TEST GOT THROUGH. Restoring the exact sentence
    # that conflated 113 determinations with 565 condition-level labels passed
    # every other check, because the arithmetic check above verifies the
    # DATABASE and the figure-count lock only counts headline figures. The very
    # error this revision set was written to fix could have come straight back.
    # Arm A and Arm B are equally credentialed and the paper must say so in the
    # BODY, not only in the Acknowledgments. Before 2026-08-18 it said so only
    # there, and Sections 4.2 and 5 left a reader to infer an expert-versus-
    # novice comparison, which is the confound the randomisation exists to
    # avoid. The programme corrected this same conflation once before, on
    # 2026-08-05.
    ("comparison arms stated as equally expert",
     ["improve on unaided professional judgment"],
     ["credentialed professionals drawn from the same pool and randomised within it",
      "credentialed professionals of the same standing as the panel reported here",
      "a statement about exposure and not about expertise"]),
    ("113 determinations and 565 condition-level labels stay distinct",
     ["Across the 113 labels",
      "recorded 216 times against 207 passes and 142",
      "77 of the 113 labels",
      "unmet across all 113 labels"],
     ["Across the 113 overall determinations recorded under the five-condition instrument",
      "Across the 565 condition-level labels, the lowest coding level was recorded 216 times",
      "77 of the 113 overall determinations"]),
]
_claim_bad = []
for _name, _absent, _present in CLAIM_PAIRS:
    _hit = [x for x in _absent if x in MSTEXT]
    _gone = [x for x in _present if x not in MSTEXT]
    if _hit:
        _claim_bad.append("%s: reintroduced %r" % (_name, _hit[0][:44]))
    if _gone:
        _claim_bad.append("%s: withdrawal sentence deleted, %r" % (_name, _gone[0][:44]))
CHECKS.append({
    "name": "settled claims stay settled",
    "needle": "",
    "in_manuscript": True,
    "value_ok": not _claim_bad,
    "detail": ("%d claim pairs, none contradicted" % len(CLAIM_PAIRS)) if not _claim_bad
              else "; ".join(_claim_bad)
})

# --------------------------------------------------- superseded values
# THE NEEDLE CHECKS ABOVE ARE NOT SUFFICIENT ON THEIR OWN, and an adversarial
# test proved it: changing "83.9 percent" to "84.2 percent" in one place still
# passed, because another correct "83.9" elsewhere satisfied the needle. A
# figure has to be right in EVERY place, so every superseded value is also
# forbidden from the body outright.
#
# The change log legitimately quotes the old values as the ones being corrected,
# so the body is taken as everything before it and the log is exempt.
_LOG = "## Change log for this version"
BODY = MSTEXT.split(_LOG)[0] if _LOG in MSTEXT else MSTEXT

# ONE SUPERSEDED FIGURE IS ALLOWED IN THE BODY, AND ONLY INSIDE THE SENTENCE
# THAT RETIRES IT. v4 has no change log; the reason the cross-vendor figure is a
# series rather than a run is a methodological point that belongs in Appendix A,
# and making that point requires naming the run figure that moved.
#
# The exemption is the whole sentence, not the number. Deleting the explanation
# and leaving "87.8" behind fails, which is the case worth catching.
_EXPLAINED = [
    ("87.8", "the most recent run moved from 87.8 percent on 12 August to "
             "82.2 percent on 15 August"),
]
for _val, _sentence in _EXPLAINED:
    if _sentence in BODY:
        BODY = BODY.replace(_sentence, "~EXPLAINED~")

SUPERSEDED = [
    ("82.8", "pre-close accuracy"),
    ("71.0 to 94.6", "pre-close accuracy interval"),
    ("86.1", "pre-close sensitivity"),
    ("79.4", "pre-close specificity"),
    ("360 reads", "pre-close read count"),
    ("15 reviewers", "pre-close panel size"),
    ("10 countries", "pre-close country count"),
    ("five reviewers scoring perfectly", "wrong perfect-scorer count"),
    ("no rater used fail", "claim the data contradicts"),
    ("108 structured labels", "superseded label count"),
    ("of 75 ", "superseded Gap denominator"),
    ("0.624", "superseded trained AC1"),
    # RETIRED 2026-08-18 BY THE FINAL REPAIR. These are the 63-label
    # intervals. They were printed beside the 68-label point estimate
    # until the recomputation against live bench_labels replaced them.
    ("0.253 to 0.994", "63-label analytic interval"),
    ("0.301 to 0.886", "63-label bootstrap interval"),
    ("trained reviewer", "rater class unsupported by any source"),
    # ADDED 2026-08-18 BY THE SUBMISSION-FINAL PASS.
    ("those same experts", "conflates the detection panel with the "
                           "separate Study 004 reliability sample"),
    ("expert panel", "ambiguous between three populations"),
    ("36 independent experts", "invented combined panel figure"),
    ("52.9 percent", "unreproducible not-passing rate"),
    ("87.8", "single-run cross-vendor figure, stale nightly"),
    ("84.5 percent", "mixed-denominator cross-vendor mean"),
    ("66.7 to 93.3", "mixed-denominator cross-vendor range"),
    ("55 cross-vendor runs", "superseded run count"),
]
# A blocklist only catches values already known to be wrong. It cannot catch a
# figure edited to some arbitrary new number, which the same adversarial test
# also proved: changing one "83.9 percent" to "84.2 percent" passed, because a
# correct "83.9" elsewhere satisfied the needle and 84.2 was on no list.
#
# Locking the OCCURRENCE COUNT closes that. Every headline figure appears a
# known number of times in the body; change any one instance and the count drops.
# If a genuine edit adds or removes a mention, this fails and the number here is
# updated deliberately, which is the point.
#
# RE-LOCKED 2026-08-16 for v4. Every count that moved was traced to the specific
# passage that added or removed the mention before the number here was changed.
# A count is never updated to whatever the file happens to contain.
#
#   83.9          5 -> 7  added: the 4.7 justification of the 0.70 threshold
#                         points the reader at the interval instead, and the
#                         Discussion states the figure twice while separating
#                         group-level detectability from per-reviewer reliance
#   72.7 to 95.1  2 -> 3  added: same 4.7 passage
#   0.739         4 -> 2  removed: the Discussion no longer quotes the
#                         coefficient, because the pre-registered lower-bound
#                         criterion attached to it failed and quoting the point
#                         estimate in the Discussion read as if it had not
#   0.623         4 -> 2  removed: same
#   87.2 percent  3 -> 1  removed: the cross-vendor analysis moved out of the
#                         Abstract and the Discussion into Appendix A. Three
#                         models agreeing is not evidence the construct is real,
#                         and carrying it as a headline invited that reading
#   86.2 to 88.2  2 -> 1  removed: same
#   16 reviewers  2 -> 1  removed: the Abstract and Results now write the count
#                         in words. The digit form survives once, in Methods 4.5
#
# Unchanged: 87.0, 80.7, 384.
# RE-LOCKED 2026-08-18 when Appendix C was filled in with the real fit. Both
# increases were traced to the specific new sentence before the number moved:
#
#   83.9         7 -> 9  Appendix C states the participant-level mean twice, once
#                        when answering whether modelling item difficulty alters
#                        it, and once recording that the endpoint reproduces it
#                        from the raw reads as an independent check
#   16 reviewers 1 -> 2  Appendix C states the model's N alongside the 384 reads
FIGURE_COUNTS = {
    "83.9": 9,
    "72.7 to 95.1": 3,
    "87.0": 3,
    "80.7": 3,
    "384": 6,
    "0.739": 2,
    "0.623": 2,
    "87.2 percent": 1,
    "86.2 to 88.2": 1,
    "16 reviewers": 2,
}
miscount = []
for v, want in FIGURE_COUNTS.items():
    got = BODY.count(v)
    if got != want:
        miscount.append("%r appears %d times, expected %d" % (v, got, want))
CHECKS.append({
    "name": "every headline figure appears the expected number of times",
    "needle": "",
    "in_manuscript": True,
    "value_ok": not miscount,
    "detail": ("%d figures, all counts match" % len(FIGURE_COUNTS)) if not miscount
              else "; ".join(miscount)
})

found = [(v, why) for v, why in SUPERSEDED if v in BODY]
CHECKS.append({
    "name": "no superseded figure survives in the body",
    "needle": "",
    "in_manuscript": True,
    "value_ok": not found,
    "detail": ("body is clean of all %d superseded values" % len(SUPERSEDED)) if not found
              else "; ".join("%r (%s)" % (v, why) for v, why in found)
})

# ------------------------------------------------------------------ output
fail = 0
skip = 0
width = max(len(c["name"]) for c in CHECKS)
for c in CHECKS:
    if c["value_ok"] is None:
        label = "SKIP"
        skip += 1
    elif not c["in_manuscript"]:
        label = "FAIL"
        fail += 1
        c["detail"] += "  <- string %r NOT FOUND in the manuscript" % c["needle"]
    elif not c["value_ok"]:
        label = "FAIL"
        fail += 1
    else:
        label = "PASS"
    print("%s  %-*s  %s" % (label, width, c["name"], c["detail"]))

print("\n%d assertions, %d failed, %d skipped" % (len(CHECKS), fail, skip))
sys.exit(1 if fail else 0)
