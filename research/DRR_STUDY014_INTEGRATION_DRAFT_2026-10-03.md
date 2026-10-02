# DRR and Study 014: integration draft and licensing assessment

**DRAFT, 2026-10-03. Not published.** `decision-reconstruction-risk.html` is public, so any change to it needs the owner's approval (CLAUDE.md sections 23 and 26). Nothing on the site was changed. The sources are `research/study-014-drr/RESULTS.md`, `CONFIRMATORY_RESULTS.md`, `PART2_RESULTS.md`, `PART2B_RESULTS.md` and `research/engine-v0.4/DESIGN_CHECK.md`.

## 1. What the DRR page says today, against the evidence
| Current sentence (decision-reconstruction-risk.html) | Evidence now | Status |
|---|---|---|
| "AI-assisted drafting produces records that are fluent ... and fluency is not evidence"; "a record that looks more finished while being less reconstructable" | Study 014 (H1, H5): concise AI summaries kept 0% of record citations and nearly no quotations (medians), and reader accuracy fell from 97% to 77% (the reader test ran on the 29 unique practice texts) | **Supported, with scope:** for concise summaries by two Anthropic models, on EEOC federal-sector decisions. Not shown for every kind of AI drafting |
| "it can be detected, reduced, and designed out of a workflow" | **Reduced:** supported (a JRS-guided drafting instruction kept a median of all anchors, in two tests). **Detected:** only for dates by the Review Engine (10/10 caught, 2/30 false flags); citations and attributions not shown. **Designed out:** not shown | **Overstates.** "Designed out" reads close to "eliminates" (banned unless established, CLAUDE.md section 24) |

## 2. Proposed text for the page (for owner approval)
### 2a. Evidence note, added after the paragraph ending "DRR now spreads while wearing the appearance of its opposite."
> **What a first test found.** In Study 014 (October 2026), two current AI models summarized 53 unique EEOC federal-sector decision backgrounds.
> - Asked for a concise summary, they kept none of the record citations (median) and almost none of the quotations.
> - On 29 of those texts, a reader given only the summary answered 77% of masked factual questions correctly, against 97% from the original.
> - Given a drafting instruction built on JRS, the same models kept a median of every date, citation and quotation, and the reader's accuracy matched the original.
>
> These results come from one text family and one provider's models, with small samples. They show that the risk is measurable and that the drafting instruction reduced it in this test. They do not show that every AI tool behaves this way. Methods and data: [link to the published study page, once approved].

### 2b. Replacement for "it can be detected, reduced, and designed out of a workflow"
> "...and it can be measured, and reduced at the drafting stage."

*Why:*
- "Measured" and "reduced" are what Study 014 shows.
- "Detected" is true only narrowly (dates, by the Review Engine), so it belongs on the Engine page with its limits, not in the definition.
- "Designed out" is not established.

### 2c. Constraint checks on the proposed text
- No em dash.
- No "designed for" opener.
- No "frequently".
- No "prevents", "eliminates" or "guarantees".
- The figures match the results files, and the 53-text count reflects the duplicate correction.

## 3. Is this positive for commercial licensing? (INFERENCE unless marked)
### Positive
1. **The problem is now shown, not just argued.**
   - A licence buyer's first question is whether DRR is real. H1 and H5 replicated on 53 unique texts, and the reconstruction loss is a number (19 points).
   - This supports the reason for both the licensed test suite and the training to exist.
2. **There is a working remedy you can show.**
   - The JRS-guided instruction kept nearly every anchor in two tests. That is a demonstrable before and after, which is the prevention niche (`research/PREVENTION_NICHE_RESEARCH_2026-10-02.md`).
3. **The test suite now has a reference run.** It has a practice set, a scorer, baselines and a documented confirmatory history. That is what a vendor-run conformance licence needs (the Khronos-style model in `research/LICENSED_TEST_SUITE_RESEARCH_2026-10-02.md`).
4. **The record is candid, and that helps diligence.**
   - Failed hypotheses, scorer corrections and duplicate corrections are all recorded with their evidence.
   - A buyer can verify the work rather than take it on trust (CLAUDE.md section 25).
5. **The Engine has one demonstrated property: specificity on dates.** That is narrow but real, and it was replicated across two text sets.

### Negative or limiting
1. **No detection claim beyond dates.**
   - Codebook prompting over-flags (Part 2).
   - Engine 0.3.0 over-flagged citations and attributions (Part 2b).
   - The rule-based 0.4.0 design fails on non-EEOC records.
   - So the Engine cannot be licensed as a general gap detector.
2. **The scorer is valid only for EEOC-format text.**
   - The likely vendor buyers (Case IQ, HR Acuity, AllVoices) draft HR investigation reports, not federal-sector decisions.
   - The suite still works mechanically, because vendors run their tools on the practice texts. But whether a good score predicts performance on their customers' records is **NOT ESTABLISHED**.
   - The beta message should say the practice set is federal-sector decisions.
3. **"Fewer inventions" cannot be claimed.** The pre-registered automatic test failed twice. Manual reading found no inventions in JRS-guided drafts, but that reading was done by an AI and has not been independently checked.
4. **Nothing is confidential.** The drafting instruction, the suite and the corpus are in a public repository (B-018), so a buyer could reuse the instruction without a licence. What remains licensable is:
   - the measurement service;
   - a sealed private set (B-023, not yet built);
   - the right to make result statements;
   - later, a mark.
5. **Scale and independence.** The samples are small, there is one model provider and one text family, and no human has independently replicated the work.

### Net assessment
**Moderately positive for a narrow licence; negative for the Engine as a detector.**
- The best-supported commercial offer is a measurement licence: "We measure what your AI drafting tool keeps, on a fixed public practice set, and show how a JRS-guided instruction changes it."
- Sell it with the limits stated, together with the free drafting specification.
- The Engine should be described only by its date specificity until a format-general method is built and tested.
- None of this is a determination of licensability, ownership or legal enforceability (CLAUDE.md Rules 4 and 8).

## 4. What would make it more positive (PROPOSED)
1. A practice and private set of **HR-style records**, with a format-general scorer, so the suite measures what the vendors actually produce.
2. A human read of the flagged items in the JRS-guided drafts (60 drafts; 19 of the original flags are already listed in `RESULTS.md`). This would turn the "no inventions" reading into independently checked evidence.
3. The sealed private set (B-023), which is what a vendor licence actually sells.
4. A second model provider, to answer "is this an Anthropic-only effect".

## 5. Owner decisions
- Approve, edit or reject the page text in section 2. Publication is an owner action.
- Whether to add the federal-sector scope line to the beta message (`research/drr-suite-v0.9/BETA_OUTREACH_DRAFT.md`). Recommended.
