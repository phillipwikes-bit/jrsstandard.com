# Research Summary Page: Layout Specification and Editorial Contract

**Artifact:** `research-summary.html` (repository root, deployed at `/research-summary.html`)
**Created:** 2026-09-02
**Enforced by:** `scripts/check_zero_drift.py::check_research_summary_leads_with_its_boundaries`
**Precedence:** `research-summary.html` is canonical for every word and every figure. This file is the editorial contract that page must satisfy. Where the two disagree, the page is right and this file is stale.

---

## 1. Why this page exists separately from `research.html`

`research.html` is a study register. It answers "what is the programme running, and what is the honest status of each study." It is organised by study, it is long, and a risk officer with eight minutes does not finish it.

`research-summary.html` answers a different question: "what has been established about the construct, what has not, and what may I act on." It is organised by claim rather than by study, and it terminates in operational assets. The two pages are not substitutes, and neither restates the other's figures independently: both bind the same panel counts to `/api/panel-stats`.

The distinction that makes this page defensible to an academic peer and useful to a buyer at the same time is the ordering rule in section 2.

## 2. The ordering rule (enforced, not conventional)

> The methodological boundaries appear **above** the headline figure in document order.

This is the page's entire thesis about how to present a result of this maturity. A reader who meets 83.9% first and the limitations later has already formed the belief the limitations were written to constrain, and the disclosure becomes decorative. Placing the boundaries first costs a fraction of readers and buys the credibility of every remaining one, which is the trade this programme's audience rewards.

Because reordering is a one-line edit that changes what the page claims without changing a word of its copy, the order is asserted in the drift script rather than left to editorial memory. The guard fails the build if:

| Condition | Guard behaviour |
|---|---|
| `.headline` appears before `.bound-box` | FAIL, "inverts the whole point of the page" |
| The string `Not met` is removed | FAIL, failed pre-registered criterion no longer stated |
| The string `0.402` is removed | FAIL, the expert lower bound that missed the floor |
| The string `37.5 to 100` is removed | FAIL, reviewer dispersion no longer stated |
| The string `Exploratory` is removed | FAIL, crossed model no longer labelled exploratory |
| The string `bimodal` is removed | FAIL, corpus limitation no longer stated |
| The string `not psychometrically validated` is removed | FAIL, open psychometric structure no longer stated |

Both halves were adversarially tested at creation: the marker order was inverted and the guard failed; a concession string was deleted and the guard failed.

## 3. Section contract

Sections appear in this order. A section may be extended; it may not be moved above a section that precedes it.

| # | Section | `aria-labelledby` | Function |
|---|---|---|---|
| 1 | Hero | (none) | Defines DRR in one sentence, states the ordering rule to the reader explicitly, warns that a threshold was missed |
| 2 | Read This First: What the Result Does Not Establish | `bd-h` | Five boundaries, `.bound-box`, before any figure |
| 3 | The Result | `hr-h` | `.headline` block plus four `.card` tiles, one of which reports the failed criterion |
| 4 | How the Numbers Were Produced | `sm-h` | Four `.statrow` blocks: participant-level mean, Gwet's AC1, Wilson score intervals, crossed mixed-effects model |
| 5 | Scope of the Claim | `sc-h` | Two-column `.split`: construct and artifact-level risk on the left, tooling and prevention claims on the right |
| 6 | From Finding to Practice | `op-h` | Six `.study` cards bridging to operational assets |
| 7 | Source Documents and Underlying Data | `src-h` | Nine `.nav-tiles` plus two claim-control notes |

### The five boundaries (section 2), in fixed order

1. The corpus is deliberately bimodal (12 grounded, 12 unsupported, constructed at the extremes).
2. No criterion validity against real records.
3. The five conditions are not psychometrically validated.
4. One pre-registered criterion was not met.
5. Group-level detectability is not individual-level dependability.

Ordering rationale: 1 and 2 constrain generalisation, 3 constrains the instrument, 4 is the concession a reviewer will look for and must not have to hunt, 5 is the one a buyer will act on wrongly if it is not stated.

### The scope separation (section 5)

The left column may only contain claims about **construct detection and artifact-level risk**. The right column carries everything about **automated tooling, prevention, outcomes and compliance status**. This separation is the reason the page can be handed to a procurement reviewer without a covering note. A claim about a product never migrates left.

The section closes with the non-establishment clause required by `check_framework_names_qualified`: naming the EU AI Act, the NIST AI RMF or ISO/IEC 42001 anywhere on a page obliges that page to state that JRS establishes compliance with none of them.

## 4. Figure provenance

Every number on the page traces to one of three sources. Nothing is transcribed from a previous version of a sentence.

| Figure | Value | Source | Binding |
|---|---|---|---|
| Panel detection accuracy | 83.9% | Detection study, participant-level mean of the per-reviewer scores | Static, with its construction stated in section 4 |
| 95% CI | 72.7 to 95.1 | Student t interval, 15 df | Static, formula printed |
| Sensitivity / specificity | 87.0% / 80.7% | Detection study | Static |
| Reviewer dispersion | 37.5 to 100, SD 21.0 | Detection study, per-reviewer scores | Static |
| Detection panel size | live | `/api/panel-stats` | `data-panel="completers_detection"` |
| Detection panel countries | live | `/api/panel-stats` | `data-panel="countries_detection"` |
| Detection panel continents | live | `/api/panel-stats` | `data-panel="continents_detection"` |
| Programme reviewer base | live | `/api/panel-stats` | `data-panel="reviewers_all"` |
| Programme completers | live | `/api/panel-stats` | `data-panel="completers_all"` |
| Programme countries | live | `/api/panel-stats` | `data-panel="countries_all"` |
| Gwet's AC1 | 0.739 experts / 0.624 trained | Reliability sample, 10 records, 99 retained labels | Static |
| AC1 analytic lower bounds | 0.402 / 0.252 | Reliability sample | Static |
| Crossed model intercept | 89.2% | `correct ~ 1 + (1 \| reviewer) + (1 \| record)`, Laplace ML over 384 reads | Static |
| Reviewer SD / record SD | 1.769 / 0.011 | Same model, profile intervals 1.292 to 3.000 and 0.001 to 0.556 | Static |
| Latent-scale ICC | 0.488 reviewer / 0.0000 record | Same model | Static |

Any figure carrying panel vocabulary (`reviewers`, `completers`, `independent experts`, `countries`, `continents`) **must** sit inside a `[data-panel]` span, and the page **must** carry the canonical `JRS PANEL BINDER v2` block. `check_html_figures_bound` and `check_panel_binder_identical` enforce both. Spelled-out forms count: "sixteen reviewer scores" was caught by the guard during authoring and was bound rather than reworded.

## 5. Editorial rules applied

| Rule | Applied as |
|---|---|
| No em-dash in prose | Colons, parentheticals and full stops throughout. Verified by grep. |
| No `"Designed for [audience]"` opener | Absent. |
| No `"frequently"` as filler | Absent. |
| Tone | Declarative, past tense for results, present tense for what remains open. No adjective does work a number can do. |
| Verbal reliability bands | Deliberately absent. Landis and Koch's "substantial" was dropped from the AC1 discussion because the band boundaries are arbitrary by their own authors' account and the adjective implies an adequacy the failed lower-bound criterion contradicts. |
| Hedging | None on the limitations. A limitation stated tentatively reads as a concession being minimised, which costs more credibility than the limitation itself. |
| Statistical vocabulary | Kept exact. "Participant-level mean" is never softened to "average score", "profile-likelihood interval" is never shortened to "interval", and "exploratory" is never dropped from the crossed model. |

## 6. SEO and structured data

- `<title>`: "Research Summary: Expert Detection of Decision Reconstruction Risk | JRS™ Justification Review Standard". Leads with the artifact type, carries the construct name in full, brand last.
- Meta description front-loads the figure **and** the boundary in one sentence, so the snippet itself performs the ordering rule.
- `schema.org/ScholarlyArticle` with an `abstract` that states the limitation in its second sentence, `creativeWorkStatus: "Preprint, operational validation phase"`, and `isAccessibleForFree: true`.
- Canonical URL on `www`, matching every other page in `sitemap.xml`.
- Registered in `sitemap.xml` immediately after `research.html` at priority 0.6.
- Inbound link from `research.html` Program Layers tiles. The page is not orphaned.

## 7. Bridge targets (section 6) and why each one is licensed by the research

| Asset | The finding that licenses it |
|---|---|
| Investigator Field Guides | The construct is detectable by trained readers, so a question set is worth putting in a practitioner's hands |
| Seven-Point Record Defensibility Check | Artifact-level risk is assessable from the record alone, with nothing uploaded |
| JRS Codebook | Every reported figure was produced by applying this instrument unchanged, so the instrument is the reproducibility claim |
| Reviewer Training | The dispersion finding (SD 21.0) is the argument for calibration; the training is the calibration |
| Structured Pilot | Sampled double review and adjudication are design requirements that follow from the dispersion, not upsells |
| Enterprise and Integration | Licensing pathway. Carries the scope claim (no record text at rest) and never a compliance claim |

No bridge card asserts prevention, outcome improvement or compliance. `check_no_false_assurance_claims` fails the build on twenty-two phrasings that would.

## 8. Maintenance

- Figures move only when the study closes and the manuscript figures are recomputed. At that point the static figures in section 4 of the page and the provenance table above are updated together, in one commit.
- Bound figures need no maintenance: they follow `/api/panel-stats`, and a figure that cannot be read live is marked as a last known value rather than shown as current.
- Adding a section is permitted. Moving section 2 below section 3 is not, and the build will say so.
