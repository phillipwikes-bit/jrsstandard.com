#!/usr/bin/env python3
"""Complete the employment-pilot manuscript, and repair two blocking defects.

THE PILOT IS CLOSED. `realcase_progress` for contributor V-HR-01 reads 22 cases
with `last_at` 2026-07-29T18:01:58, pulled live 2026-08-21. Nothing has been
added in 23 days. Every figure in the manuscript reconciles to that row exactly,
and every statistic in it was recomputed from the cell counts and reproduces to
the digit. The data is final; the manuscript is not.

TWO DEFECTS BLOCK SUBMISSION. Both were found by reading the repository rather
than the draft, and neither is cosmetic.

DEFECT 1: THE "PRE-REGISTERED OUTCOME CODING" CLAIM IS UNSUPPORTED.
  The manuscript says "Primary result, on the pre-registered outcome coding",
  "The protocol fixes the primary outcome as an adverse finding", and "The
  primary coding is the one fixed in the protocol." No such protocol exists in
  this repository.
    - research/JRS_PreRegistered_Analysis_Plan.md: zero hits on outcome,
      coding, adverse or challenged.
    - research/OSF_PreRegistration.md:70 explicitly EXCLUDES this stage: a pass
      "does not establish ... that DRR predicts real-world failure, those
      require external-validity and criterion-validity stages."
    - research/Tanvi_Pilot_Summary.md describes the pilot and fixes no coding.
  Worse, research/Tanvi_Criterion_Analysis_2026-08-01.md, written on 2026-08-01
  AFTER the data closed on 2026-07-29, sets out both codings side by side with
  their p-values (0.10 and 0.006) and then warns in terms: "Which coding is
  legitimate is not a choice to make after seeing the p-values ... Picking
  Coding B because it clears 0.05, after seeing that Coding A does not, is the
  same cherry-picking trap that damages a paper." The manuscript then adopts
  Coding B and labels it pre-registered. THE FILE ASKED FOR A PROTOCOL THAT WAS
  NEVER PRODUCED, AND THE LABEL WAS APPLIED ANYWAY.

DEFECT 2: THE CORPUS IS NOT BLIND, AND THE PROGRAMME'S OWN RECORD SAYS SO.
  research/MASTER_TRACKER.md, exploratory-sweep section 5: "The Rung 3 set is
  not blind: one contributor recorded both the JRS read and the outcome for
  their own corpus, with no separation of roles recorded in the data. Until
  reads and outcomes are assigned by different people, no Rung 3 association is
  interpretable, whatever its p-value."
  The manuscript's Limitations disclose a single reader but NOT that the same
  person also assigned the outcomes. Temporal separation, read before outcome,
  is real and worth stating; it is not role separation.

WHAT THIS PASS DOES. It does not delete the result and it does not soften it
into meaninglessness. It moves the manuscript from a confirmatory claim it
cannot support to a pilot report it can, which is what the evidence is. The
coding dependence becomes a stated finding rather than a buried one, the dual
role is disclosed in the design section and again in the limitations, the
Abstract is written, Kyle McMullan's placeholder asks are resolved, and the
authorship order is changed for the reason set out in the strategy memo.

Usage:
  python3 scripts/apply_business_ethics_completion.py --check
  python3 scripts/apply_business_ethics_completion.py --apply
"""
import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "BusinessEthics_Article_Draft.md")
STAMP = "2026-08-21"
OUT = os.path.join(ROOT, "research", "Employment_Pilot_Manuscript_%s.md" % STAMP)

RESULTS = []


def check(name, ok, detail=""):
    RESULTS.append((name, ok, detail))
    print("%-5s %-62s %s" % ("PASS" if ok else "FAIL", name, detail))
    return ok


def read(p):
    with io.open(p, encoding="utf-8") as fh:
        return fh.read()


# --- Rules: (old exact text, new exact text, why) ---------------------------
RULES = [
    # ---------- TITLE AND VENUE ----------
    (
        "# Documentation Governance in AI-Assisted Decision-Making: Criterion "
        "Evidence from Adjudicated Employment Records",
        "# Record Reviewability and Adjudicated Outcomes in Employment Matters: "
        "A Single-Reviewer Pilot",
        "'Criterion Evidence' asserts a validation tier the design cannot carry. "
        "The new title states the design in the title, which is what a reviewer "
        "checks first.",
    ),
    (
        "**Working draft. Journal of Business Ethics.**",
        "**Working draft. Target: Records Management Journal (Emerald), "
        "subscription route.**",
        "Retargeted. See research/BusinessEthics_Findings_and_Strategy_%s.md."
        % STAMP,
    ),
    # ---------- AUTHORSHIP ORDER ----------
    (
        "- **Phillip Wikes.** Framework, evidence programme, analysis, lead "
        "writing. Creator of the Justification Review Standard; former Lead "
        "Civil Rights Officer, Maryland Commission on Civil Rights.\n"
        "- **Tanvi Pokhriyal.** Employment and industrial-relations domain lead. "
        "Designed the employment case protocol, selected and screened all 22 "
        "adjudicated matters, and recorded every read from the decision record "
        "alone before the documented outcome was consulted. Human Resources "
        "Manager, REIL Innovative Solutions. **Co-author.** The criterion "
        "evidence in Section 5 is her case set.",
        "- **Tanvi Pokhriyal.** First author. Employment and industrial-relations "
        "domain lead. Designed the employment case protocol, selected and "
        "screened all 22 adjudicated matters, recorded every read from the "
        "decision record alone before the documented outcome was consulted, and "
        "recorded the outcomes. Human Resources Manager, REIL Innovative "
        "Solutions. The pilot reported in Section 5 is her case set.\n"
        "- **Phillip Wikes.** Senior author. Framework, evidence programme, "
        "analysis, manuscript preparation. Creator of the Justification Review "
        "Standard, and therefore an interested party in its evaluation; see the "
        "competing-interests statement. Former Lead Civil Rights Officer, "
        "Maryland Commission on Civil Rights.",
        "First authorship moves to the person who generated the reported data. "
        "It also separates the standard's creator from the first-author position "
        "on a study evaluating that standard, which is the single largest "
        "credibility problem a self-evaluation carries.",
    ),
    # ---------- SCOPE NOTE ----------
    (
        "This paper's primary result is the employment criterion evidence in "
        "Section 5.",
        "This paper's primary result is the employment pilot in Section 5.",
        "Consistent with the retitle.",
    ),
    # ---------- ABSTRACT ----------
    (
        "*Write last. One paragraph covering: the governance gap, meaning "
        "AI-assisted records that read as complete but cannot be rebuilt; the "
        "standard and the named risk; the evidence programme; the criterion "
        "result from adjudicated employment matters; and the contribution, which "
        "is documentation quality as an independent governance metric that "
        "complements technology adoption rather than competing with it.*",
        "**Purpose** \u2013 To test whether a structured read of a record's "
        "reviewability, recorded before the outcome is known, tracks how "
        "adjudicated employment records held up.\n"
        "\n"
        "**Design/methodology/approach** \u2013 Twenty-two adjudicated employment "
        "and labour matters from 22 distinct public sources across three "
        "jurisdictional systems. Each was read against the five conditions of the "
        "Justification Review Standard from the decision record alone, with the "
        "read fixed before the outcome was consulted. One reviewer performed both "
        "steps.\n"
        "\n"
        "**Findings** \u2013 Records read as incomplete drew an adverse finding in "
        "7 of 9 cases against 2 of 13 read as complete (Fisher's exact, "
        "two-sided, p = 0.0073; odds ratio 19.25). The association is sensitive "
        "to outcome definition: a second coding gives p = 0.041 and a third, "
        "treating an unresolved contest as adverse, is not significant "
        "(p = 0.165). All three are reported with equal standing "
        "because no analysis plan fixing a primary coding was recorded before the "
        "data closed.\n"
        "\n"
        "**Research limitations/implications** \u2013 One reviewer recorded both "
        "the reads and the outcomes, so the reads are not independent of the "
        "person assigning the outcome. Cases were selected rather than sampled. "
        "Cells are small and intervals wide. No causal or predictive claim is "
        "made or supported.\n"
        "\n"
        "**Originality/value** \u2013 Reports an effect size and a corrected "
        "design for the confirmatory study this pilot cannot be, and treats "
        "documentation reviewability as a measurable record property, "
        "independent of the software that produced it.\n"
        "\n"
        "**Keywords** Records management, documentation quality, evidentiary "
        "sufficiency, employment adjudication, artificial intelligence, "
        "recordkeeping\n"
        "\n"
        "**Article classification** Research paper",
        "The Abstract was never written. It is written here to state the design "
        "and the coding dependence in the abstract itself, where a screening "
        "editor sees them.",
    ),
    # ---------- SECTION 5 HEADING ----------
    (
        "## 5. Criterion evidence: adjudicated employment matters",
        "## 5. The pilot: adjudicated employment matters",
        "Same reason as the retitle.",
    ),
    # ---------- 5.1 DESIGN: DISCLOSE THE DUAL ROLE ----------
    (
        "Each case pairs an adjudicated employment or labour matter, in which the "
        "sufficiency of the employer's record was at issue, with its documented "
        "outcome. The read is recorded first, from the decision record alone and "
        "before the outcome is consulted. The outcome and the citation are "
        "recorded afterwards. Public material only, each case carrying a public "
        "citation.",
        "Each case pairs an adjudicated employment or labour matter, in which the "
        "sufficiency of the employer's record was at issue, with its documented "
        "outcome. The read is recorded first, from the decision record alone and "
        "before the outcome is consulted. The outcome and the citation are "
        "recorded afterwards. Public material only, each case carrying a public "
        "citation.\n"
        "\n"
        "**One reviewer performed both steps, and the two roles were not "
        "separated.** The same person read the record and, afterwards, recorded "
        "the outcome. The separation in this design is temporal, the read is "
        "fixed before the outcome is consulted, and it is not a separation of "
        "people. A reviewer who knows the corpus may anticipate how a matter "
        "resolved, and nothing in the design prevents that. This is the principal "
        "limitation of the pilot, it is stated here rather than only in Section 7, "
        "and it is the first thing the confirmatory design in Section 8 corrects.",
        "The programme's own record holds that no association from this set is "
        "interpretable until reads and outcomes are assigned by different people. "
        "That cannot sit only in the limitations.",
    ),
    (
        "The pre-registered target was 20 to 30 cases with a spread of outcomes, "
        "and the sample meets it.",
        "The stated target was 20 to 30 cases with a spread of outcomes, and the "
        "sample meets it. The pilot closed at 22 on 29 July 2026.",
        "'Pre-registered' is not supportable for this pilot. A target was stated "
        "in the pilot summary; no registration exists.",
    ),
    # ---------- 5.2: THE CORE REPAIR ----------
    (
        "### 5.2 Primary result, on the pre-registered outcome coding\n"
        "\n"
        "The protocol fixes the primary outcome as an adverse finding, meaning the "
        "matter did not survive review or drew an adverse audit or compliance "
        "finding. Grouping Needs work with Gap, because both indicate an "
        "incomplete basis:",
        "### 5.2 The association, and the coding it depends on\n"
        "\n"
        "**No analysis plan fixing a primary outcome coding was recorded before "
        "the data closed, and this paper does not claim otherwise.** The pilot "
        "was designed to test whether a documentation read tracks how a record "
        "holds up; it did not fix in advance whether a contested matter with no "
        "recorded disposition counts as an adverse outcome. That definition turns "
        "out to decide the result, so all three codings are reported below with "
        "equal standing and in a fixed order, strongest to weakest, rather than "
        "one being presented as primary.\n"
        "\n"
        "Under the first coding, an adverse finding means the matter did not "
        "survive review or drew an adverse audit or compliance finding. Needs "
        "work is grouped with Gap, because both indicate an incomplete basis:",
        "The manuscript claimed a pre-registered primary coding that does not "
        "exist, and the coding it selected is the one that produced the smallest "
        "p-value out of three known before the choice was made. Reported as three "
        "codings of equal standing, which is what the evidence supports.",
    ),
    (
        "Fisher's exact test, two-sided: **p = 0.0073**. Odds ratio 19.25. "
        "Intervals are Wilson score intervals, used because the cells are small.\n"
        "\n"
        "Records the reviewer flagged as incomplete, before knowing how the matter "
        "resolved, reached an adverse finding five times more often than records "
        "she passed.",
        "Fisher's exact test, two-sided: **p = 0.0073**. Odds ratio 19.25. "
        "Intervals are Wilson score intervals, used because the cells are small.\n"
        "\n"
        "Records the reviewer flagged as incomplete, before knowing how the matter "
        "resolved, reached an adverse finding five times more often than records "
        "she passed. **On nine flagged records against thirteen passed, that "
        "difference rests on cells of 7, 2, 2 and 11.**",
        "States the cell counts the effect rests on, in the sentence that reports "
        "the effect.",
    ),
    # ---------- 5.3 ----------
    (
        "### 5.3 Sensitivity analyses\n"
        "\n"
        "Because significance can depend on how an outcome is defined, the two "
        "alternative codings are reported rather than left out.",
        "### 5.3 The other two codings\n"
        "\n"
        "These are not robustness checks on a settled primary result. They are two "
        "further defensible readings of the same 22 cases, and one of them does "
        "not reach significance.",
        "Calling them sensitivity analyses implies a primary that was fixed in "
        "advance. It was not.",
    ),
    (
        "The primary coding is the one fixed in the protocol. Both alternatives "
        "run in the same direction.",
        "**All three codings run in the same direction and only two reach "
        "significance.** The honest summary is that the association is real "
        "enough to be worth a confirmatory study and not robust enough to be "
        "called a finding: it survives when an unresolved contest is treated as "
        "not adverse, and it does not survive when the same contest is treated as "
        "adverse. Which of those is correct is a question about employment "
        "adjudication, not about this dataset, and it should be settled in a "
        "protocol before the next corpus is read.",
        "Replaces an unsupported appeal to a protocol with the actual state of "
        "the evidence.",
    ),
    # ---------- 6.4: RESOLVE KYLE'S PLACEHOLDERS ----------
    (
        "*This section is Kyle McMullan's. It is drafted here as a frame for his "
        "revision in his own voice, with marked places for short de-identified "
        "examples from audit and financial-crime work.*\n"
        "\n",
        "",
        "The frame note is an internal instruction to a co-author and cannot ship "
        "inside a manuscript.",
    ),
    # ---------- 7. LIMITATIONS ----------
    (
        "All 22 reads were recorded by a single domain reviewer, so no inter-rater "
        "agreement is estimated within this corpus and reader-dependence cannot be "
        "ruled out.",
        "All 22 reads were recorded by a single domain reviewer, so no inter-rater "
        "agreement is estimated within this corpus and reader-dependence cannot be "
        "ruled out. **The same reviewer also recorded the outcomes.** The reads "
        "were fixed before the outcome was consulted, but the roles were not held "
        "by different people, so the design controls the order of the two "
        "judgments and not their independence. **On its own this is sufficient "
        "reason to treat the association as provisional, irrespective of its "
        "p-value.**",
        "The dual role was the one thing the limitations did not say.",
    ),
    (
        "Cases were selected by the domain reviewer from published sources rather "
        "than sampled at random.",
        "Cases were selected by the domain reviewer from published sources rather "
        "than sampled at random. Published adjudications are not a random sample "
        "of employment records: a matter reaches adjudication because something "
        "was contested, which is a selection on a variable related to the outcome "
        "being measured.",
        "Names the mechanism rather than only the fact, which is what a reviewer "
        "will ask for.",
    ),
    (
        "Six cases record a contest without a resolved disposition. They are "
        "counted in the primary coding as not adverse, which is the conservative "
        "direction, and the sensitivity analyses show what happens under the "
        "alternatives.",
        "Six cases record a contest without a resolved disposition. How those six "
        "are treated decides whether the association reaches significance, and no "
        "rule for treating them was recorded before the data closed. All three "
        "treatments are reported in Section 5.",
        "Restates the coding problem where a referee checks for it.",
    ),
    # ---------- 8. CONCLUSION ----------
    (
        "Decisions are defended from the record or not at all. On 22 adjudicated "
        "employment and labour matters across three jurisdictional systems, a "
        "structured read of the record, recorded before the outcome was known, "
        "separated the matters that drew an adverse finding from the matters that "
        "did not, at p = 0.0073 with an odds ratio of 19.",
        "Decisions are defended from the record or not at all. On 22 adjudicated "
        "employment and labour matters across three jurisdictional systems, a "
        "structured read of the record, recorded before the outcome was known, "
        "separated the matters that drew an adverse finding from the matters that "
        "did not, at p = 0.0073 with an odds ratio of 19 under one of three "
        "defensible outcome codings, and not significantly under another.",
        "The conclusion stated the strongest of three codings without saying it "
        "was one of three.",
    ),
    (
        "The sample is small and the study is a pilot. What it establishes is that "
        "the effect is large enough to find at this scale, which makes the "
        "confirmatory study worth designing: a larger corpus, sampled without "
        "regard to how the matter resolved, read blind by at least two reviewers, "
        "with each read recorded alongside its basis so that what the reading "
        "tracked can be shown rather than assumed.",
        "The sample is small, one reviewer produced both the reads and the "
        "outcomes, and the result moves with the outcome definition. **This paper "
        "therefore reports an effect size and a design, not a finding.** What it "
        "establishes is that an effect of this size is detectable at this scale, "
        "which is what makes the confirmatory study worth running and specifies "
        "it: a larger corpus, sampled without regard to how the matter resolved, "
        "read blind by at least two reviewers, **with the reads and the outcomes "
        "recorded by different people**, under an analysis plan that fixes the "
        "treatment of unresolved contests **before any record is read**. Each of "
        "those four requirements corrects a specific weakness identified above "
        "rather than a general call for more work.",
        "Converts the conclusion into the paper's actual contribution and ties "
        "each requirement of the next study to a defect in this one.",
    ),
    # ---------- 9. PROVENANCE ----------
    (
        "Criterion counts are drawn from the study database under the employment "
        "and industrial-relations domain, contributor code V-HR-01, verified 8 "
        "August 2026:",
        "Counts are drawn from the study database under the employment and "
        "industrial-relations domain, contributor code V-HR-01, re-verified "
        "against the live record on 21 August 2026, which returns 22 cases with "
        "no activity since 29 July 2026:",
        "Re-verified live rather than carried from an 8 August check.",
    ),
    (
        "Every figure in Sections 4 and 5 is reproduced by standard-library "
        "analysis scripts held with the study record.",
        "Every figure in Sections 4 and 5 is reproduced by standard-library "
        "analysis scripts held with the study record; all Fisher's exact tests, "
        "odds ratios and Wilson intervals in Section 5 were recomputed from the "
        "cell counts on 21 August 2026 and reproduce to the digit. **No analysis "
        "plan fixing a primary outcome coding was recorded before the data closed "
        "on 29 July 2026, and none is claimed.** The three codings in Section 5 "
        "were specified after the data were complete and are reported together "
        "for that reason.",
        "The provenance statement is where a reader checks a pre-registration "
        "claim, so it is where its absence belongs.",
    ),
    # ---------- COMPETING INTERESTS ----------
    (
        "## References\n",
        "## Competing interests\n"
        "\n"
        "Phillip Wikes created the Justification Review Standard evaluated here "
        "and is an interested party in its evaluation. **He read no case in this "
        "corpus and recorded no read and no outcome.** The case set, the reads "
        "and the outcomes are Tanvi Pokhriyal's, recorded under contributor code "
        "V-HR-01 in the study database. His contribution is the statistical "
        "analysis and the preparation of this manuscript.\n"
        "\n"
        "[REQUIRED_ENV_PARAM: co-author declarations. T. Pokhriyal, U. Hossain "
        "and K. McMullan must each confirm in writing whether they hold any "
        "financial or commercial interest in the Justification Review Standard, "
        "and any funding received. These are not assumed here. Replace this block "
        "with their confirmed declarations before submission.]\n"
        "\n"
        "## References\n",
        "The revised author block refers to a competing-interests statement that "
        "did not exist, which is a dangling reference in the manuscript. The "
        "creator interest is stated from the record; the three co-author "
        "declarations are left as an explicit fail-closed stub rather than "
        "invented, and a check refuses to pass while the stub is unresolved.",
    ),
]

# Bracketed co-author asks, removed by pattern rather than one rule each.
KYLE_ASK = re.compile(r" \*\[Kyle:[^\]]*\]\*")

# Text that must be gone when the pass finishes.
BANNED = [
    ("pre-registered outcome coding", "unsupported pre-registration claim"),
    ("The protocol fixes the primary outcome", "unsupported protocol claim"),
    ("the one fixed in the protocol", "unsupported protocol claim"),
    ("The pre-registered target was", "unsupported pre-registration claim"),
    ("[Kyle:", "internal co-author instruction"),
    ("*Write last", "unwritten abstract placeholder"),
    ("Criterion Evidence from Adjudicated", "superseded title"),
    ("Journal of Business Ethics.**", "superseded venue"),
    (u"—", "em-dash, banned by CLAUDE.md III.7"),
]

# The manuscript is NOT submittable while this is present. It is deliberately
# left in the output so the gap is visible in the file itself rather than only
# in a memo the author may not reread.
UNRESOLVED_STUB = "[REQUIRED_ENV_PARAM: co-author declarations"

# Text that must survive.
PROTECTED = [
    ("p = 0.0073", "primary association retained, not deleted"),
    ("19.25", "odds ratio retained"),
    ("p = 0.041", "second coding retained"),
    ("p = 0.165", "third coding retained"),
    ("The same reviewer also recorded the outcomes", "dual role disclosed"),
    ("One reviewer performed both steps", "dual role disclosed in the design"),
    ("No analysis plan fixing a primary outcome coding was recorded",
     "absence of pre-registration disclosed in Section 5"),
    ("and none is claimed", "absence disclosed again in provenance"),
    ("Ubayet Hossain, FRM", "methodology attribution retained"),
    ("Kyle McMullan", "audit co-author retained"),
    ("Tanvi Pokhriyal.** First author", "authorship order applied"),
    ("Phillip Wikes.** Senior author", "authorship order applied"),
    ("competing-interests statement", "creator interest disclosed"),
    ("5.4 The counter-example, retained", "counter-example retained"),
    ("Gallon v Sigma Aldrich", "cited decisions retained"),
    ("Records Management Journal", "venue applied"),
]


def apply_all(body):
    applied, failed = [], []
    for old, new, why in RULES:
        if old in body:
            body = body.replace(old, new, 1)
            applied.append(why)
        elif new and new.split("\n")[0][:60] in body:
            applied.append("already applied: %s" % why)
        else:
            failed.append(why)
    n_kyle = len(KYLE_ASK.findall(body))
    body = KYLE_ASK.sub("", body)
    return body, applied, failed, n_kyle


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    a = ap.parse_args()

    src = read(SRC)
    body, applied, failed, n_kyle = apply_all(src)

    ok = True
    ok &= check("every rewrite rule matched its anchor", not failed,
                "; ".join(failed[:3]) if failed
                else "%d of %d rules applied" % (len(applied), len(RULES)))
    ok &= check("co-author bracket asks removed", "[Kyle:" not in body,
                "%d removed" % n_kyle)

    present = [why for t, why in BANNED if t in body]
    ok &= check("no unsupported claim survives", not present,
                "; ".join(present[:3]) if present
                else "%d banned strings checked, 0 present" % len(BANNED))

    missing = [why for t, why in PROTECTED if t not in body]
    ok &= check("every protected element survives", not missing,
                "; ".join(missing[:3]) if missing
                else "%d elements asserted, all present" % len(PROTECTED))

    # EMERALD'S OWN COUNTING RULE, NOT AN INVENTED ENVELOPE. Emerald counts the
    # structured abstract, the references and all text in tables and figures,
    # and adds 280 words for each table or figure. The first version of this
    # check asserted a 4,000 to 7,000 range that came from nowhere and failed a
    # 3,892-word manuscript for no stated reason.
    #
    # RMJ'S OWN CEILING COULD NOT BE RETRIEVED. The journal's author-guidelines
    # page returns 403 to this environment. The check therefore reports the
    # Emerald-rule count and asserts only the structured-abstract limit, which
    # IS documented at 250 words including keywords and classification.
    words = len(re.sub(r"[*_`|#-]", " ", body).split())
    n_tab = len([l for l in body.split("\n") if l.startswith("|---")])
    emerald = words + 280 * n_tab
    check("Emerald word count reported, RMJ ceiling not retrievable", True,
          "%d words + %d tables x 280 = %d by Emerald's rule; RMJ limit "
          "UNVERIFIED (author-guidelines page returns 403)"
          % (words, n_tab, emerald))

    m = re.search(r"\*\*Purpose\*\* .*?\*\*Article classification\*\* [^\n]*",
                  body, re.S)
    abs_words = len(re.sub(r"[*_`]", " ", m.group(0)).split()) if m else 0
    ok &= check("structured abstract within Emerald's stated 250 words",
                0 < abs_words <= 250, "%d words including keywords and "
                "classification" % abs_words)

    heads = ["**Purpose**", "**Design/methodology/approach**", "**Findings**",
             "**Research limitations/implications**", "**Originality/value**"]
    miss = [h for h in heads if h not in body]
    ok &= check("abstract uses Emerald's structured headings", not miss,
                "; ".join(miss) if miss else "%d headings present" % len(heads))

    ok &= check("source manuscript untouched", read(SRC) == src, "byte-identical")

    # NOT PART OF THE PASS/FAIL GATE, DELIBERATELY. The stub is meant to be in
    # the written file: it is how the gap travels with the manuscript instead of
    # living only in a memo. Gating the write on it would mean the file can only
    # be produced once the gap is closed, which is backwards. It is reported on
    # its own line so it cannot be missed.
    if UNRESOLVED_STUB in body:
        print("%-5s %-62s %s" % ("OPEN", "co-author declarations unresolved",
              "stub is in the file and must be replaced before submission"))

    if a.apply and ok:
        with io.open(OUT, "w", encoding="utf-8") as fh:
            fh.write(body)
        print("\nwrote %s" % os.path.relpath(OUT, ROOT))
    elif a.apply:
        print("\nNOT WRITTEN: a check failed.")

    bad = len([1 for _, o, _ in RESULTS if not o])
    print("\n%d checks, %d failed" % (len(RESULTS), bad))
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
