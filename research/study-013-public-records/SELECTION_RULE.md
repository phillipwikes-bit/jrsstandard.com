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
