# Study 013 feasibility round: case selection rule

**Fixed 2026-10-02, before any candidate decision was read or classified.** Owner direction: "Can we use historical or public records ... pick out real public cases that are considered normal or edge." Method context: assessment Appendix E.4.

## Source
EEOC federal-sector appellate decisions, from the search at `https://www.eeoc.gov/federal-sector/appellate-decisions` (parameter `appellate_keywords`). Only PDFs filed under `/sites/default/files/decisions/2026_*` are used, which means decisions posted in 2026. That lowers the chance a model has seen them in training.

## Fixed queries
- Q1 (gap pool): `"supplemental investigation" inadequate`
- Q2 (pass pool): `"final agency decision" AFFIRM "investigative record"`
- Each query is read through every result page. No query is added or changed after results are seen. A change would be recorded here as a dated amendment.

## Ordering
All candidates are pooled, de-duplicated by URL, and sorted by posting folder date, then by appeal number. Classification runs in that order. The first qualifying decisions are taken until the quotas fill.

## Inclusion (all must hold, by rule on the decision text)
1. The appeal is from a **final agency decision issued without a hearing**, so the EEOC reviewed the investigative record itself. The text says the complainant requested a final agency decision, or did not request a hearing.
2. The decision addresses the **merits**. It is not a procedural dismissal, a timeliness ruling, a request for reconsideration, a settlement-breach claim or a class action.

## Labels (taken from the EEOC's own ruling, never from a model)
- **GAP (record inadequate):** the EEOC vacates the decision and remands for a supplemental investigation because the record was inadequate or not sufficiently developed on the merits.
- **PASS (record adequate):** the EEOC affirms the decision on the merits on the investigative record.
- **EDGE:** a mixed ruling (affirmed in part, remanded in part), or a remand limited to damages after liability was found. Each edge case also carries its GAP or PASS label for the issue decided.

## Quotas
30 decisions: 15 GAP and 15 PASS, with up to 6 of the 30 flagged EDGE. If a pool runs out, the shortfall is reported, not filled by changing the rule.

## Text given to the model
The decision's BACKGROUND section only, which describes the investigation and the agency's decision. Removed: the caption, appeal and agency numbers, names, contentions, standard of review, analysis, conclusion, order and rights statements. Any remaining sentence that states the EEOC's ruling is also removed. Every removal is logged by case.

## Known limits
- A decision **summarizes** the record; it is not the investigative file. Results apply to this kind of text.
- An affirmance means the record was adequate **for the issues the EEOC decided**, not that it has no gap of any kind.
- The two pools are chosen by different queries, so their wording may differ in ways a model could pick up on. The owner's review of the stripped texts (Appendix E.4, control 7) checks for this.
- Rights: works of the US federal government are generally not protected by copyright (17 U.S.C. 105). REQUIRES HUMAN REVIEW; not a legal conclusion.
- The repository is public (B-018), so the key is public. The outcomes are public on eeoc.gov anyway. Models get no web access during the run.

## Amendment 1, 2026-10-02 (before any candidate was classified or read)
**Reason:** the first harvest returned only counts. Q1 gave 20 candidates posted in 2026 and Q2 gave 4, so the PASS pool cannot fill 15. No decision text had been read.
**Change:** queries added. Q1 and Q2 are unchanged.
- Q3 (pass pool): `"did not request a hearing" AFFIRM`
- Q4 (pass pool): `"requested a final agency decision" AFFIRMS`
- Q5 (gap pool): `"supplemental investigation" "adequately developed"`

## Amendment 2, 2026-10-02 (after classification counts were seen)
**What had been seen:** label counts per pool and flag values per decision. One PASS decision (2024002416) was opened to check its layout. No GAP decision text had been read.
**Reason:** under the rule, the 2026 pool gave 2 GAP and 165 PASS. Merits remands for an inadequate record are rare, so the GAP quota cannot fill.
**Changes:**
- Posting window widened for **both** pools to folders `2025_07_*` onward. That is still after the Engine model's published training period, which is *Source-reported*: Anthropic lists Haiku 4.5's training data as reliable to February 2025.
- Q6 (gap pool) added: `VACATES "supplemental investigation" "final decision"`.
- Duplicates removed by appeal number, keeping the earliest posting.
- PASS sampling: when the PASS pool exceeds its quota, it is taken in the same fixed order (folder date, then appeal number).
- If GAP still falls short of 15, the round runs with the GAP decisions available, and the PASS count is matched to that number so the pools stay balanced. The shortfall is reported.

## Amendment 3, 2026-10-02 (after amendment 2 added no candidates)
**Observed:** the EEOC search index returns few decisions posted in 2025. For the gap queries, most results are older migrated text files or dated folders from 2020 and 2021.
**Changes:**
- Any dated posting folder (`YYYY_MM_DD`) is eligible, for both pools.
- Ordering becomes **newest first** (folder date descending, then appeal number), so recent decisions fill the quotas before older ones.
- Each case records its posting year. The memorization analysis compares results on decisions posted before and after February 2025, and arm A (no JRS) serves as the recognition check.
- Undated migrated `.txt` files stay excluded: their posting dates are unknown.

## Amendment 4, 2026-10-02 (after the GAP candidate list was seen, before any case text was given to a model)
- **GAP tightened:** it needs a vacate or remand, with no reversal (a reversal finds discrimination, which is not an inadequate record), and no remand limited to damages. The EEOC sentence stating the inadequacy is stored as the label's evidence.
- **Text unit applied as written:** only decisions with a BACKGROUND section of at least 250 words can supply text. This applies to both pools.
- **Date matching:** for each GAP selected (newest first), the PASS chosen is the eligible PASS nearest in posting date, without replacement. This stops posting year from separating the pools.

## Amendment 5, 2026-10-02 (stripping correction, before any model call)
The first strip removed witness testimony ("S2 affirmed that ...") because it matched "affirm" in any case. The fix: ruling verbs are matched in capitals only, as the EEOC writes its rulings. Procedural phrases are still removed in any case: remand, vacate, supplemental investigation, the EEOC's finding phrases, appeal references, inadequacy wording. The pseudonym footnote is also removed.
