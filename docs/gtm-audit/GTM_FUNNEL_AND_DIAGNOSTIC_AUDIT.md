# JRS GTM Conversion Funnel and Diagnostic Audit

**2026-09-13.** Code-level and content-architecture audit of `jrsstandard.com` against
the three GTM pillars. All findings are measured against the repository and the live
site, not inferred.

---

# STOP FIRST: the 70% deficit metric does not exist

**The brief asks me to verify that content "clearly illustrates the institutional
vulnerability where the majority of automated records fail retrospective legal
reconstruction," and calls it "The 70% Deficit Metric."**

**No such metric exists in the evidence base, and building the funnel on one would
fabricate a research finding.**

**What the site actually says.** `70%` appears on exactly **2 of 54 pages**, and in both
cases it is the **pre-registered detection threshold that reviewers CLEARED**:

> "Clears the pre-registered threshold of **70%** fixed before any data were seen."
> — `research.html`

> "A point estimate of at least **70 percent**, and a lower confidence bound above
> chance. Both fixed before any data were seen, and **both cleared**." — `research-summary.html`

**That is the inverse of a deficit.** It is a success threshold for *detection by human
reviewers*, cleared at 83.9%. It says nothing about what proportion of real records fail.

**Why no deficit percentage can be derived.** The study corpus is **24 constructed
records, balanced by design** (twelve with traceable support, twelve without). A 50/50
constructed corpus cannot yield a population estimate. The manuscript itself states the
claim is **detectability** and states where its evidence stops, and the pre-registered
**reliability** criterion was **not met**.

**Risk if this is ignored.** A "70% of records fail" claim on a public page would be a
fabricated statistic on a site whose entire credibility rests on not overclaiming. A
sweep of all 54 pages for `enterprise-grade`, `production-ready`, `audit-ready`,
`certified` and `independently reproducible` returns **zero**. That discipline is the
asset. **Do not spend it on a number that does not exist.**

**What to use instead**, all evidenced and quotable:

| Claim | Evidence |
|---|---|
| **83.9%** mean reviewer accuracy, 95% CI 72.7 to 95.1, n = 16, 384 graded judgments | Detection study, data lock 2026-08-15 |
| **16 independent experts, 11 countries, 5 continents** | Same |
| Sensitivity 87.0%, specificity 80.7% | `research.html` |
| **The pre-registered reliability criterion was not met** | Reported, and reporting it is the credibility |

**The honest and stronger GTM frame is not "70% of your records fail." It is: "trained
experts can tell the difference, and here is what they caught."** That is defensible in
a deposition. A fabricated deficit rate is not.

---

# Phase 1: architectural friction and entry-point audit

## 1.1 Frictionless diagnostic access — **STRONG, with one structural gap**

| Check | Result |
|---|---|
| "Contact Sales" | **0 of 54 pages** |
| "Request a Demo" | **0 of 54 pages** |
| "Book a demo" / "Talk to sales" / "Schedule a call" / "Get a quote" | **0 of 54 pages each** |
| Diagnostic exists | **Yes**: `check.html`, "The Seven-Point Record Defensibility Check", 33,801 bytes |
| Diagnostic discoverability | **42 of 54 pages link to it** |

**This is already a low-friction architecture.** There is no gated sales motion anywhere
on the site, and the founder-delivered engagements are retired in code with an explicit
retired-offer guard.

**The gap is primacy, not existence.** On `index.html`:

| Element | Position |
|---|---|
| Training CTA ("Open the Free Training") | 9% down |
| Diagnostic link | 9% down |
| Pilot CTA ("Request Pilot Participation") | 10% down |
| SCS calculator | 15% down |

**Neither hero CTA is the diagnostic.** A General Counsel landing cold is offered
*training* or *pilot participation* first. Both are higher-commitment than a two-minute
self-check.

**Recommendation R-1 (high value, low risk).** Promote the Seven-Point Check to the
primary hero CTA and demote training to secondary. This is a content change in
`index.html` only, no new code, and it costs nothing to reverse.

## 1.2 Field guide integration — **PARTIAL**

Four guide PDFs are published and served (EEO, Fair Housing, International, combined).
Live telemetry: **163 downloads across 19 countries**.

**Gap:** the guides are terminal assets. They are downloaded and the journey ends. **No
guide routes the reader into the diagnostic.**

**Recommendation R-2.** Add a single closing page or footer line to each guide PDF
pointing at the Seven-Point Check. This is an upstream change to whatever generates the
guides, not an edit to the served PDFs.

## 1.3 Telemetry and state tracking — **THE MATERIAL GAP**

**20 distinct event sources exist** (`checkout-click`, `gate-view`, `eval-view`,
`link-click`, `support`, `honor-*`, `reviewer-*`, and others). The instrumentation
culture is strong.

**None of them tracks the diagnostic.** Searching `api/*.js` and `check.html` for
`check-view`, `check-start`, `check-complete` or `seven-point` returns **nothing**.

| Question the business needs answered | Answerable today? |
|---|---|
| How many people opened the Check? | **No** |
| How many completed it? | **No** |
| Where do they abandon it? | **No** |
| Which page or guide sent them? | **No** |

**`check.html` also sets no `localStorage`**, so a visitor who leaves mid-assessment
loses their place, and returning traffic is indistinguishable from new.

**Recommendation R-3 (highest priority in Phase 1).** Emit three events —
`check-view`, `check-step`, `check-complete` — through the existing
`interaction_events` pipeline, carrying a step index and the `?src=` tag already parsed
elsewhere. **No new infrastructure**: this reuses the pattern `gate-view` already uses.
Aggregate counts only, no record text, consistent with the existing privacy posture.

---

# Phase 2: "expose the gap" mechanism assessment

## 2.1 Diagnostic logic and scoring — **STRONG**

Two independent mechanisms exist:

1. **`check.html`** — a seven-point scored self-assessment with scoring logic present.
2. **The Review Engine** (`api/v1/review-engine.js`) — tests a record against **five
   conditions** and returns a per-condition status (`pass`/`review`/`gap`) plus a routing
   determination (`Ready`/`Needs work`/`Gap`).

**The engine does exactly what the brief asks**: it tests whether a record can explain
its own rationale, and it returns a structured, per-condition verdict.

**Two caveats the brief should absorb rather than paper over:**

- The engine **declares itself unvalidated in every response**: `evidence_stage: 'operational_validation'`, with the disclaimer "No effectiveness claim is made." **This is a credibility asset, not a liability**, and should be shown, not hidden.
- **Two conflicting OpenAPI documents** describe the same endpoint at different versions with different response schemas. An integrator fetching the wrong one builds the wrong client. **This is the single most likely cause of a failed first enterprise integration.**

## 2.2 The 70% deficit metric — **DOES NOT EXIST**

See the section at the top of this report. **Classification: claim not evidenced. Do not
implement.**

## 2.3 Cognitive impact — **WEAK, and fixable without any new claim**

The diagnostic scores, but nothing translates a score into institutional consequence.
There is no "what this means if you are deposed" framing, no comparison to the study
result, and no severity banding tied to the five conditions.

**Recommendation R-4.** On completion, show the user's own condition-by-condition result
against **what the 16-expert panel caught at 83.9%**. That is a true, sourced,
personally relevant comparison, and it creates the risk alignment the brief wants
**without inventing a deficit rate**.

---

# Phase 3: policy standardization and institutional adoption flow

## 3.1 Standardized protocol delivery — **PARTIAL**

Field guides, training modules and a simulation library exist and are ungated.
`procurement` language appears on 10 pages and `SOP` on 12.

**Gap:** these are practitioner assets, not deployment assets. Nothing is packaged for
**enterprise-wide rollout across business units or a vendor ecosystem**.

## 3.2 Frictionless mandate architecture — **ABSENT**

| Asset | Pages |
|---|---|
| "policy language" | **0** |
| "governance checklist" | **0** |
| "standard operating procedure" (spelled out) | **0** |
| "implementation kit" | **1** |

**There is no turnkey language a compliance team can lift into an SOP.** This is the
largest Phase 3 gap and the one most directly tied to institutional adoption.

**Recommendation R-5.** Publish a single page carrying: a paragraph of adoptable policy
language, a governance checklist mapped to the five conditions, and a vendor-requirement
clause. **Scope discipline: this is documentation, not a product claim**, and it must
carry the same "not certification, not accreditation, not a credential" disclaimer the
training already uses.

## 3.3 B2B self-generation loop — **WEAK**

`check.html` carries 2 `Blob` references and 2 `download` affordances, but **no clipboard
support and no print stylesheet**. `index.html` has print rules; the diagnostic does not.

**A General Counsel cannot currently finish the Check and hand a clean one-page summary
to a board.** That is precisely the self-generating loop the brief is built on.

**Recommendation R-6.** Add a print stylesheet and a "copy summary" affordance to
`check.html`, producing a dated, source-attributed executive summary. **The download must
not be the only route**: the site's own governance notes that sandboxed contexts block
script-driven downloads, so clipboard and print are the reliable paths.

---

# Consolidated findings

| # | Pillar | Finding | Severity |
|---|---|---|---|
| **1** | 2 | **The 70% deficit metric does not exist and must not be created** | **Critical** |
| 2 | 1 | No diagnostic funnel telemetry; drop-off is unmeasurable | **High** |
| 3 | 3 | No turnkey policy language or governance checklist | **High** |
| 4 | 3 | Diagnostic produces no board-ready export (no clipboard, no print) | **High** |
| 5 | 2 | Two conflicting OpenAPI documents | **High** |
| 6 | 1 | Diagnostic is not the primary hero CTA | Medium |
| 7 | 1 | Field guides do not route into the diagnostic | Medium |
| 8 | 2 | Score is not translated into institutional consequence | Medium |
| 9 | 1 | `check.html` has no state persistence | Low |

## What is already right, and should not be "optimized" away

- **Zero sales-friction language across 54 pages.** Rare, and the whole premise of this funnel.
- **42 of 54 pages link to the diagnostic.** Distribution is already solved.
- **The engine discloses its own limits in every response.** Keep it.
- **The site does not overclaim.** Zero hits for six superlatives; the three near-misses are all correct negations.
- **The reliability criterion that was not met is published.** That is what makes the 83.9% believable.

## Recommended sequence

1. **R-3 telemetry** — you cannot optimise a funnel you cannot measure.
2. **R-6 export** — completes the self-generation loop the model depends on.
3. **R-5 policy language** — converts an individual finding into an institutional mandate.
4. **R-1 hero primacy** and **R-4 consequence framing** — cheap, reversible, high leverage.
5. **R-2 guide routing** — upstream generator change.
6. **OpenAPI conflict** — resolve before any enterprise integration attempt.

**No recommendation in this report requires a new claim, and none requires weakening an
existing disclaimer.**
