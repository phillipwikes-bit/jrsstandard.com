#!/usr/bin/env python3
"""Surgical revision set, editorial review of v4, 2026-08-18.

CONSTRAINT SET, from the reviewer, enforced by this script's shape:
  no restructuring, no new claims, no numerical result changed, no change to
  the pre-registered primary analysis, no new literature, and item 17: no other
  substantive change.

Each edit is an exact old/new pair asserted to match exactly once. A rule that
stops matching fails loudly rather than matching something adjacent. Re-running
is a no-op: a rule whose new text is already present reports "already applied".

Usage:
  python3 scripts/apply_surgical_revisions_2026-08-18.py --check
  python3 scripts/apply_surgical_revisions_2026-08-18.py --apply
  python3 scripts/apply_surgical_revisions_2026-08-18.py --report

Exit code: 0 if every rule is satisfied, 1 if any failed to match.
"""
import argparse
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MS = os.path.join(ROOT, "research", "Detection_Article_v4_2026-08-16.md")
REPORT = os.path.join(ROOT, "research", "Surgical_Revisions_2026-08-18.md")

# (item number, short title, old exact text, new exact text, why)
RULES = [

# --- 1. Appendix B: 113 determinations vs 565 condition-level labels ---------
# VERIFIED AGAINST THE DATABASE BEFORE ACCEPTING THE CORRECTION. bench_labels
# with mode='jrs' returns 113 rows; each row carries five condition values;
# 113 x 5 = 565, and the recount is pass 207, review 142, gap 216, summing to
# 565. The reviewer's arithmetic is right and the manuscript conflated the two
# units. No number changes; the unit each number counts is corrected.
(1, "Appendix B unit: 113 determinations",
 "Across the 113 labels recorded under the five-condition instrument:",
 "Across the 113 overall determinations recorded under the five-condition instrument:",
 "113 is the count of determinations, not of condition-level labels"),

(1, "Appendix B: descriptive association wording",
 "Two descriptive observations, offered as such. Every condition moves with the determination rather than sitting alongside it, which is the minimum a multi-condition instrument must show before its composite read means anything, and which the circularity above largely predicts. And the conditions are not uniformly met: evidentiary sufficiency is the most often unmet across all 113 labels, at 77.9 percent not passing, followed by chronological integrity, decision-process traceability, reconstructability, and basis identification at 65.5, 64.6, 57.5, and 51.3 percent respectively.",
 "Two descriptive observations, offered as such. The condition-level labels vary systematically with the overall determination, as expected because the conditions contribute to that determination. This descriptive association does not establish independent discriminating validity. Across the 565 condition-level labels, evidentiary sufficiency was most often recorded as not passing at 77.9 percent, followed by chronological integrity, decision-process traceability, reconstructability, and basis identification at 65.5, 64.6, 57.5, and 51.3 percent respectively.",
 "separates the two units and drops the implicit validity claim"),

(1, "Appendix B: scale-use counts",
 "The instrument's three levels are all exercised. Across the 113 labels the lowest level is the most-used value of the three, recorded 216 times against 207 passes and 142 middle-level judgments, and it appears at least once in 77 of the 113 labels. The separations above are therefore across the full scale rather than between the top two levels.",
 "The instrument's three levels are all exercised. Across the 565 condition-level labels, the lowest coding level was recorded 216 times, the pass level 207 times, and the middle level 142 times. The lowest level appeared at least once in 77 of the 113 overall determinations. The separations above are therefore across the full scale rather than between the top two levels.",
 "216 + 207 + 142 = 565 condition-level labels, not 113"),

# --- 2. "verified key" -> pre-specified reference classification -------------
(2, "Abstract: reference classification",
 "was judged by an international panel of independent experts against an answer key fixed before recruitment and independently reproduced by raters blind to the study's hypotheses.",
 "was judged by an international panel of independent experts against a pre-specified reference classification fixed before recruitment and independently reproduced by raters blind to the study hypotheses.",
 "Section 4.4 concedes the key is not construct-independent; 'verified' partially undoes that"),

(2, "Abstract result: reference classification",
 "Panel accuracy against the key was 83.9 percent",
 "Panel accuracy against the reference classification was 83.9 percent",
 "same"),

(2, "Section 4.2: reference classification",
 "An international panel of independent experts judged a balanced corpus of constructed records against a verified answer key, blind to the key and to one another's judgments. There is no control arm by design: the panel is measured against a key, not against another group.",
 "An international panel of independent experts judged a balanced corpus of constructed records against a pre-specified reference classification independently reproduced by blinded raters, blind to that classification and to one another's judgments. There is no control arm by design: the panel is measured against a reference classification, not against another group.",
 "same"),

(2, "Section 6.1: reference classification",
 "The pre-registered criterion is cleared on both parts. Independent experts, reading constructed records cold and blind to a verified key, identified records whose reasoning cannot be reconstructed at a rate above chance and above the target set in advance.",
 "The pre-registered criterion is cleared on both parts. Independent experts, reading constructed records cold and blind to the reference classification, distinguished records constructed to instantiate the operationalised distinction at a rate above chance and above the target set in advance.",
 "removes both the 'verified key' framing and the implied external criterion"),

(2, "Results table header",
 "| Panel accuracy against the key | **83.9%** |",
 "| Panel accuracy against the reference classification | **83.9%** |",
 "same"),

# Item 2's acknowledgments instance is NOT a rule of its own. Item 13 rewrites
# that whole block and its replacement already carries the corrected wording.
# Kept as a rule, it applied cleanly on the first run and then reported FAILED on
# the second, because item 13 had removed both its old and its new text. The
# manuscript was right both times; the rule set was not idempotent. Folded into
# item 13, whose `old` below still contains the pre-item-2 phrasing so the pair
# matches on a clean manuscript.

(2, "Conclusion: reference classification",
 "reading constructed AI-generated records cold and blind to an independently reproduced answer key, identified unreconstructable records at 83.9 percent accuracy,",
 "reading constructed AI-generated records cold and blind to an independently reproduced reference classification, distinguished the constructed cases at 83.9 percent accuracy,",
 "same"),

# --- 3. remove "fatal" ------------------------------------------------------
(3, "Section 4.4: drop 'fatal'",
 "rules out the objection that the key was fitted to the reviewers' responses after the fact, which is the circularity that would be fatal. It does not rule out a weaker but real objection:",
 "rules out the objection that the reference classification was fitted to the reviewers' responses after the fact. It does not, however, remove the construct-dependence described below, and it does not rule out a weaker but real objection:",
 "naming one circularity 'fatal' invites the question of whether all forms were defined"),

# --- 4. "upper bound" -> "may overstate performance" -------------------------
(4, "Section 4.3: not an upper bound",
 "The consequence is specific and we accept it: **the accuracy reported in Section 6 is an upper bound on what the same reviewers would achieve on a corpus containing ambiguous records, and it is not an estimate of field performance.**",
 "The consequence is specific and we accept it: **the accuracy reported in Section 6 may overstate performance on a corpus containing ambiguous records and should not be interpreted as an estimate of field performance.**",
 "bimodality shows the task is likely easier; it does not establish a mathematical upper bound"),

(4, "Section 8.2: not an upper bound",
 "The reported accuracy is an upper bound on performance against realistic documentation, for the reasons in Section 4.3.",
 "The reported accuracy may overstate performance against realistic documentation, for the reasons in Section 4.3.",
 "same"),

# --- 5. drop the unsupported 0.70 "conventional floor" argument --------------
(5, "Section 4.7: 0.70 justification",
 "The 0.50 bound is the balanced-corpus chance rate and requires no justification beyond the design. The 0.70 target does. It was set before data collection on the following reasoning, which is stated so a reader can disagree with it: a governance control that is to be operated by trained reviewers must be recognisably better than a coin flip by a margin that survives the reviewer-to-reviewer variation seen in ordinary quality-assurance work, and 0.70 is the conventional floor for a screening instrument's agreement with a reference standard in several adjacent applied literatures. **It is a convention, not a derivation.** It was not chosen with reference to any decision-theoretic cost model, because no such model for this application exists yet, and building one is part of Study 5 in Section 10. A reader who considers 0.70 too low or too high should read the reported interval, 72.7 to 95.1, and apply their own criterion; the interval is given precisely so that the threshold is not load-bearing.",
 "The 0.50 bound is the balanced-corpus chance rate and requires no justification beyond the design. The 0.70 target was specified before data collection as a pragmatic performance floor rather than derived from a decision-theoretic model. No validated cost model currently exists for documentation-risk detection, and the threshold should therefore not be interpreted as an established standard of acceptable performance. Building such a model is part of Study 5 in Section 10. The observed estimate and its confidence interval, 72.7 to 95.1, are reported independently of that threshold so that readers can apply their own criterion.",
 "an uncited 'conventional floor in adjacent literatures' is an unnecessary fight the paper does not need"),

# --- 6. JRS independence claim ----------------------------------------------
(6, "Section 3: agnostic by design",
 "JRS is independent of any vendor, model, or drafting workflow. It is a governance layer that sits above the technology stack and evaluates the output the stack produces.",
 "JRS is designed to be vendor-, model-, and workflow-agnostic: it evaluates the documentary output rather than the technology or drafting process that produced it. It is a governance layer that sits above the technology stack and evaluates the output the stack produces.",
 "Section 8.5 states workflow independence is a design intention and not a result; this removes the contradiction"),

# --- 7. mixed-effects ICC interpretation ------------------------------------
(7, "Appendix C: ICC on the latent scale",
 "**How much of the variance sits between reviewers rather than between records?** Almost all of it. The reviewer intraclass correlation is **0.488**: close to half the variance in whether a read is correct is attributable to which reviewer read it, once the logistic residual is accounted for. The record intraclass correlation is **0.0000**.",
 "**How much of the modelled random-effect variation is associated with reviewers rather than records?** The estimated reviewer component is substantially larger than the record component. On the model's latent logistic scale, the estimated reviewer-level intraclass correlation is **0.488**, indicating substantially greater between-reviewer than between-record variation in this dataset. The record-level intraclass correlation is **0.0000**.",
 "a logistic-model ICC is latent-scale and depends on the residual-variance assumption"),

(7, "Section 8.3: ICC wording",
 "against a reviewer SD of 1.769 and a reviewer intraclass correlation of 0.488.",
 "against a reviewer SD of 1.769 and a latent-scale reviewer intraclass correlation of 0.488.",
 "same"),

# --- 8. remove the rhetorical line ------------------------------------------
(8, "Appendix C: drop 'no record was hard'",
 "The raw tables say the same thing without any model. Reviewer accuracy runs from 37.5 to 100 percent, a range of 62.5 points. Record accuracy runs from 62.5 to 93.8 percent, a range of 31.3 points, and every record was classified correctly by at least ten of the sixteen reviewers. **No record in this corpus was hard. Several reviewers were.**",
 "The raw tables say the same thing without any model. Record-level accuracy ranged from 62.5 to 93.8 percent, whereas reviewer-level accuracy ranged from 37.5 to 100 percent. Every record was classified correctly by at least ten of the sixteen reviewers.",
 "'hard' is not operationally defined and the hardest record at 62.5 percent is not trivial"),

# --- 9. operationalised distinction, not the construct -----------------------
(9, "Conclusion: operationalised distinction",
 "This paper establishes one link in a chain: an international panel of sixteen independent experts,",
 "This paper provides initial evidence for one link in a validation chain: an international panel of sixteen independent experts,",
 "Section 2.4 establishes recognisability of the operationalisation, not independent existence of the construct"),

(9, "Section 7: operationalised distinction",
 "The contribution is that Decision Reconstruction Risk, as operationalised, is detectable by independent experts on a corpus constructed at the ends of the severity range.",
 "The contribution is that the operationalised Decision Reconstruction Risk distinction is detectable by independent experts on a corpus constructed at the ends of the severity range.",
 "same"),

# --- 10. remove the "fourth variety" taxonomy claim --------------------------
(10, "Section 2.3: documentation-layer opacity",
 "The variety at issue here is a fourth: a record that is entirely human-readable, contains no technical artefact, and is nonetheless opaque as to the basis of its own conclusion, because fluent prose has been substituted for evidentiary content.",
 "The variety at issue here is documentation-layer opacity: a record that is entirely human-readable, contains no technical artefact, and is nonetheless opaque as to the basis of its own conclusion, because fluent prose has been substituted for evidentiary content.",
 "keeps the contribution without asking a reviewer to accept a new formal category"),

# --- 11. ethics and blinding language ---------------------------------------
(11, "Section 4.8: blinding, not deception",
 "no vulnerable population was involved; no deception was used beyond withholding the answer key and the corpus balance, which participants were told in advance would be withheld.",
 "no vulnerable population was involved. Participants were informed in advance that the reference classification and the corpus composition would not be disclosed during review, because disclosure would compromise the blinded detection task.",
 "asserting 'no deception' and then naming what was withheld is a distinction the ethics record has to support"),

# --- 12. coded, not de-identified -------------------------------------------
(12, "Data availability: coded not de-identified",
 "the instructions given to the blind key raters and their record-by-record reproduction result; the de-identified participant-level response data;",
 "the instructions given to the blind reference raters and their record-by-record reproduction result; coded participant-level response data, released subject to the study's access and confidentiality terms;",
 "with a 16-expert panel, domain, country and language can re-identify; 'de-identified' overclaims"),

# --- 13. compress programme-level acknowledgments ----------------------------
(13, "Acknowledgments: compressed",
 """**Fifty-eight independent experts have graded records for this programme.** Every one of them worked unpaid, in a personal capacity, with nothing at stake in the outcome. They are acknowledged here together, because the programme is one body of work and the people who carried it do not become less relevant to a reader depending on which study a given paper reports.

**The detection panel, 16 independent experts across 11 countries and 5 continents.** Each read the full 24-record corpus cold, blind to a verified key, and returned 384 graded judgments. This paper's result is theirs.

**The comparison study, 20 independent experts.** Each completed the same full 24-record corpus under the design described in Section 5, without knowing what the comparison was testing, which is what made the comparison possible at all. Their work closed on 15 August 2026 and will be reported in full in its own paper, whatever it shows.

**The reliability study, 25 raters.** Eight worked as expert raters and seventeen as trained reviewers on the shared record set, producing the coefficients in Section 6.5 and the per-condition analysis in Appendix B. Appendix B exists only because they recorded a judgment on each of the five conditions separately rather than only the overall read.

Across the two review studies, 36 independent experts have each completed a full 24-record set, in 16 countries across 5 continents. Every completer code resolved to a country; none was estimated.

Those wider figures are acknowledgment, not results. The detection finding in Section 6 rests on the sixteen panel members and their 384 graded reads, and on nothing else.

Reviewers in all three studies are recognised as named contributors with their consent, on the same terms and with the same standing; none is a co-author of this paper. Recognition is not scoped to the study a given paper reports. Contributors may withdraw their name at any time; one has, and her judgments remain in the analysis unnamed at her election.""",
 """**The detection panel, 16 independent experts across 11 countries and 5 continents**, each read the full 24-record corpus cold, blind to the reference classification, and returned 384 graded judgments. This paper's result is theirs. **The reliability study, 25 raters**, eight expert and seventeen trained, produced the coefficients in Section 6.5 and the per-condition analysis in Appendix B, which exists only because they recorded a judgment on each of the five conditions separately rather than only the overall read. **The comparison study, 20 independent experts**, completed the same corpus under the design described in Section 5 without knowing what the comparison was testing; their work is reported in its own paper.

All 58 worked unpaid, in a personal capacity, with nothing at stake in the outcome. Programme-level participation figures are recorded in the study repository rather than here, because they are acknowledgment and not results: the detection finding in Section 6 rests on the sixteen panel members and their 384 graded reads and on nothing else.

Reviewers are recognised as named contributors with their consent; none is a co-author of this paper. Contributors may withdraw their name at any time; one has, and her judgments remain in the analysis unnamed at her election.""",
 "a journal manuscript, not a programme report; the wider accounting moves to the repository"),

# --- 10 (second half of the reviewer's item 10): the closing leap ------------
(10, "Conclusion: no 'can be real'",
 "What the paper does not establish is longer than what it does, and Section 10 lists it. A property can be real, visible, and worth building controls around long before anyone has shown that a particular instrument beats expert intuition at spotting it, that it survives contact with ambiguous cases, or that using it improves anything. Establishing that the property can be seen at all is what makes the rest of those questions askable, and it is the only thing claimed here.",
 "What the paper does not establish is longer than what it does, and Section 10 lists it. An operationalised property can be detectable before its criterion validity, generalisability, or intervention value has been established. Establishing detectability is what makes those subsequent questions empirically testable, and it is the only thing claimed here.",
 "Section 2.4 states the study has not established the construct exists independently of the definition; 'can be real' reaches past that"),
]


def read():
    return io.open(MS, encoding="utf-8").read()


def run(apply_changes):
    body = read()
    applied, already, failed = [], [], []
    for num, title, old, new, why in RULES:
        if old in body:
            body = body.replace(old, new, 1)
            if old in body:
                failed.append((num, title, "matched more than once; rule is not unique"))
            else:
                applied.append((num, title, old, new, why))
        elif new in body:
            already.append((num, title))
        else:
            failed.append((num, title, "no match for the old text"))
    if apply_changes and not failed:
        io.open(MS, "w", encoding="utf-8").write(body)
    return applied, already, failed, body


def write_report(applied, already, failed):
    L = []
    A = L.append
    A("# Surgical revisions, editorial review of v4")
    A("")
    A("Applied 2026-08-18 to `research/Detection_Article_v4_2026-08-16.md`.")
    A("")
    A("Constraint set enforced: no restructuring, no new claims, **no numerical "
      "result changed**, no change to the pre-registered primary analysis, no new "
      "literature, and no other substantive change.")
    A("")
    A("| Result | Count |")
    A("|---|---|")
    A("| Edits applied | %d |" % len(applied))
    A("| Already applied on a prior run | %d |" % len(already))
    A("| Rules that failed to match | %d |" % len(failed))
    A("")
    if failed:
        A("## FAILED")
        A("")
        for num, title, why in failed:
            A("- **Item %d, %s**: %s" % (num, title, why))
        A("")
    A("## The one arithmetic error, verified against the database before correcting")
    A("")
    A("Appendix B used the word \"labels\" for two different units. `bench_labels` "
      "with `mode='jrs'` returns **113 rows**, each carrying five condition values. "
      "A live recount gives **pass 207, review 142, gap 216**, which sums to **565**, "
      "and 113 x 5 = 565.")
    A("")
    A("So **113 is the count of overall determinations** and **565 is the count of "
      "condition-level labels**. The reviewer's arithmetic was right. **No figure "
      "changed**; the unit each figure counts is now stated correctly.")
    A("")
    A("## Before and after")
    A("")
    for num, title, old, new, why in applied:
        A("### Item %d. %s" % (num, title))
        A("")
        A("*%s*" % why)
        A("")
        A("**Before**")
        A("")
        A("> " + old.replace("\n\n", "\n>\n> ").replace("\n", "\n> "))
        A("")
        A("**After**")
        A("")
        A("> " + new.replace("\n\n", "\n>\n> ").replace("\n", "\n> "))
        A("")
    if already:
        A("## Already applied")
        A("")
        for num, title in already:
            A("- Item %d, %s" % (num, title))
        A("")
    A("## Not done, and why")
    A("")
    A("**Appendix A was not removed.** The reviewer raised removing the three-model "
      "analysis as an option conditional on whether automated implementation "
      "consistency is regarded as part of the validation programme, and did not "
      "include it in the numbered revision set. Item 17 of that set is \"do not make "
      "any other substantive changes\". Removing an appendix is a structural change "
      "and is the owner's call, not an editorial correction.")
    A("")
    A("**Section 6.3 is untouched**, on the reviewer's explicit instruction to retain "
      "it as a major finding.")
    A("")
    A("**No numeric result was altered.** `scripts/verify_manuscript_figures.py` "
      "re-run after the edits.")
    io.open(REPORT, "w", encoding="utf-8").write("\n".join(L) + "\n")


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    g.add_argument("--report", action="store_true")
    args = ap.parse_args()

    applied, already, failed, _ = run(apply_changes=args.apply)

    for num, title, _o, _n, _w in applied:
        print("  applied   item %-2d  %s" % (num, title))
    for num, title in already:
        print("  already   item %-2d  %s" % (num, title))
    for num, title, why in failed:
        print("  FAILED    item %-2d  %s  <- %s" % (num, title, why))
    print()
    print("%d applied, %d already applied, %d failed" % (len(applied), len(already), len(failed)))

    if args.report or args.apply:
        write_report(applied, already, failed)
        print("report: %s" % os.path.relpath(REPORT, ROOT))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
