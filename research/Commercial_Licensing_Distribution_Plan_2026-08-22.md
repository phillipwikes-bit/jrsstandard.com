# Commercial Licensing and Exclusive Distribution Plan

**Revision 1, 2026-08-22.** Every figure verified by `scripts/verify_licensing_plan.py`
against `origin/main` and two live endpoints. Run it before circulating this document.

---

## 0. Two blockers, stated first

### 0.1 The target text was never supplied

The instruction referenced "the full text of the Commercial Licensing and Exclusive
Distribution Plan located at the bottom of the source material". **No text arrived, and no
such document exists in this repository.** A full-file search returned
`IP_Sale_Playbook.md`, `Path_to_Sale_Action_Plan.md`, `IP_COMMERCIALIZATION_TRACKER.md`,
`IP_COMMERCIALIZATION_AUDIT.md`, `CTO_Audit_Response_2026-08-22.md` and
`JRS_Integration_Schema_2026-08-22.md`. None of them is a licensing and distribution plan.

**Nothing here is an inline edit of a prior draft, because there was no prior draft to
edit.** This is a plan built from the directives plus verified repository facts. If a
source document exists outside the repository, send it and the surgical diff will replace
this.

### 0.2 Four figures in the directives are wrong, and two of them would be caught by a
licensee in the first hour of diligence

| Directive states | Verified position | Source |
|---|---|---|
| "our deployment includes 56 PDFs and 126 Word documents" | **10 PDFs and 2 Word documents are deployed.** The larger counts are the working tree, which contains the private `research/` corpus that is deliberately absent from `main` | `git ls-tree -r origin/main`, asserted in `scripts/verify_licensing_plan.py` |
| "a model-validation **director** at a Big Four firm" | **Associate Director, Model Validation** | `api/_contributor-roster.js:75` |
| "USPTO Class 042 trademark filings" as a cost line | The marks are **drafted and not filed**. This is a future cost, not an incurred one | `research/IP_SALE_TRACKER.md:80`, `TRADEMARK_FILING_DOSSIER_JRS_DRR.md:49` |
| Trial metrics as the single reproducibility figure | **Two series exist with different denominators.** Quoting one without its denominator makes this document contradict the manuscript | Section 2.2 below |

The 71 deployed HTML pages and 45 `api/*.js` endpoints in the directives are **correct** and
verified.

---

## 1. The asset

### 1.1 What is being licensed

| Component | Location | Property that makes it licensable |
|---|---|---|
| JRS v1.0 review standard | `jrsstandard.html`, `JRS-Standard.pdf` | Five named conditions with a fixed determination rule |
| DRR construct | `decision-reconstruction-risk.html` | Operational definition, testable against a corpus |
| Review API contract | `api/review.js` | Stateless request and response, versionable |
| Partner review engine | `api/review-engine.js`, `api/v1/review-engine.js` | Token-gated, rate-limited, already running |
| Integration schema | `research/JRS_Integration_Schema_2026-08-22.md` | Input envelope, five condition outputs, error contract |
| Validation corpus and analysis plan | `research/` | The evidence a licensee's risk function will ask for |

### 1.2 The strongest technical claim, and it is verified rather than positioned

**The determination is a deterministic function of the five conditions.** Across the entire
labelled corpus: labels with all five conditions passed but determination not Ready = 0;
labels with any condition failed but determination Ready = 0. Zero exceptions.

This is what makes the mapping **unit-testable and versionable by an integrating platform**,
which is the property a vendor's engineering team cares about. It was recorded on 2026-08-21
in `research/MASTER_TRACKER.md` as a derivation test.

**It also has a cost that must be disclosed, not buried:** the same determinism means the
five-condition discrimination analysis that once sat in a manuscript was circular and was
withdrawn. A licensee's data scientist will notice this in an afternoon. Disclosing it first
converts a discovered weakness into evidence of candour.

### 1.3 Deployed surface, counted from `origin/main`

| Class | Deployed | Working tree (NOT deployed) |
|---|---:|---:|
| HTML pages | **71** | 71 |
| `api/*.js` endpoints | **45** | 45 |
| PDF documents | **10** | 56 |
| Word documents | **2** | 126 |
| Private research files | **0** | 562 |

**Quote the deployed column to a licensee. Never the working-tree column.**

---

## 2. Empirical position

### 2.1 What the programme has

| Measure | Value | Status |
|---|---|---|
| Cross-vendor agreement, pooled series | **84.9 percent mean**, SD **6.4** points, range **66.7** to 100 percent, across **61** nightly runs | **Closed 2026-08-21** |
| Cross-vendor agreement, fixed 15-record corpus | 87.2 percent mean, SD 3.2 points, range 82.2 to 93.3, across 41 nightly runs | Closed |
| Detection panel accuracy | 83.9 percent, 95 percent CI 72.7 to 95.1 at participant level | 16 reviewers, 11 countries, 384 graded reads |
| Reliability, JRS mode | Gwet's AC1 0.664 on 104 labels | Above the 0.61 floor set before analysis |
| Reliability, per condition | AC1 0.236 to 0.413 | **All five below the floor.** Disclose it |
| Organizations deployed | **0** | `/api/orgpilot-stats`, live 2026-08-22 |
| Revenue | **$0** | No payment mechanism is live |

### 2.2 The two series, and why both must carry their denominator

The pooled series is **61 runs, 84.9 percent, SD 6.4, range 66.7 to 100**. The restricted
series is **41 runs, 87.2 percent, SD 3.2, range 82.2 to 93.3** on a fixed 15-record set.

Both are true. They differ because 15 of the cross-vendor runs scored only 2 or 3 records
while the corpus was being built, and on a 3-record run one disagreement moves the mean by
11 points. **Those short runs are the entire source of the 66.7 percent floor.**

**Use the pooled series in this document**, because it is the complete record and it carries
dispersion. State the denominator every time. A licensee who reads the manuscript and finds
87.2 percent against an unqualified 84.9 percent here will ask why, and "different
denominators, both disclosed" is a good answer only if it was disclosed first.

### 2.3 The series is closed, not live

`/api/run-study` returns `{"ok":true,"skipped":"studies_closed","closed_at":"2026-08-21"}`,
verified live 2026-08-22. **Do not describe it as a live feed.** It is a completed series of 61 runs. Restarting it is a configuration change in `api/_study-status.js`, not new
engineering, and restarting it before a diligence process is worth doing.

---

## 3. Publication position

| Item | Status |
|---|---|
| "When the Record Cannot Speak for Itself" | **Accepted**, SCCE *CEP Magazine*, November issue. Advanced to copy-editing 2026-07-21, markup expected late September |
| Additional manuscripts | **Four are submission-ready.** None has completed peer review |
| Open item | The signed SCCE/HCCA copyright form has not been returned. Publication depends on it |

**No paper in this programme has completed peer review.** *CEP Magazine* is a practitioner
publication of the Society of Corporate Compliance and Ethics. That is a real third-party
editorial credential and it must be stated as exactly that. Any claim of academic peer review
fails on the first check a licensee's counsel makes.

---

## 4. Institutional boundary, and it is absolute

The validation methodology, meaning the reference-panel design, the chance-corrected
agreement framework and the acceptance thresholds fixed before analysis, was designed by an
**Associate Director of Model Validation at a Big Four firm, acting strictly in a personal
professional capacity.**

**There is no institutional involvement, no endorsement, and no corporate relationship of any
kind.** The firm's name appears nowhere in any licensing document, deck, or conversation.

Three reasons, in order of severity. It would misrepresent the programme. It would expose the
contributor with his employer, and he has an outstanding review of the manuscript that
carries his name. It would invite a firm with substantial legal resources to object to use of
its name.

The permitted formulation is: **"a model-validation professional at a Big Four firm,
contributing in a personal capacity."** It is true and it loses nothing.

---

## 5. Commercial structure

### 5.1 Term and consideration

| Element | Position |
|---|---|
| Term | **3 to 5 years**, multi-year by design so the integration cost amortises |
| Upfront integration fee | **$10,000 to $25,000** |
| Recurring royalty | **$25,000 to $75,000 or more per partner per year** |
| Exclusivity | Field-limited and territory-limited only. **Never blanket** |
| Versioning | Semantic version on the condition set. A licensee pins a version |
| Termination | Standard for cause, plus a wind-down that lets a licensee keep serving existing customers on the pinned version |

**One structural note on exclusivity.** Blanket exclusivity on an unproven standard with zero
deployments transfers the entire distribution upside to a partner who has not yet
demonstrated they can distribute. Scope exclusivity to a named vertical and a named
territory, with a **performance floor**: the exclusivity converts to non-exclusive if the
partner has not reached an agreed deployment count by an agreed date.

### 5.2 Setup investment

| Line | Range | Status |
|---|---|---|
| IP HoldCo formation | Included in the range below | **Not formed** |
| USPTO Class 042 filings, JRS and DRR | Included | **Drafted, not filed** |
| Master licence agreement drafting | Included | Not started |
| Contract redlining reserve | Included | Not started |
| **Total** | **$7,000 to $16,000** | **[REQUIRED_ENV_PARAM: JRS_STARTUP_COST_ACTUAL]** No invoice, quote or ledger for any line exists in this repository |

### 5.3 Honest probability

**Licensing conversion in the next 12 months: 15 to 25 percent.**

Live position on 2026-08-22: organizations 0, sessions 0, records_run 0, revenue $0,
trademarks unfiled, no paying pilot. Platform vendors license standards their customers
already pull for, and nobody is pulling yet.

A third-party audit put this at 55 to 65 percent. **That audit is a good plan mislabelled as
a probability.** Its own recommendations, which are the integration schema, the deterministic
mapping and the vertical packaging, are the route to the deployments that would move the
number. They are not evidence that the number is already there.

**The single highest-value action is not a document. It is one deployment.** One named
organisation running records through `api/review-engine.js` moves this estimate more than
every artefact in this plan combined.

---

## 6. Tax and household structure

**Nothing in this section can be verified from this repository, and none of it is asserted.**

No entity formation record, no election, no ledger, and no household income figure exists in
this workspace. `SURGICAL_REMEDIATION_PROMPT.md:68` states the standing rule directly: do not
add an entity type unless one has actually been formed.

**No entity has been formed.** Every item below is a stub to be filled from primary documents
and reviewed by a licensed practitioner. This is a structural checklist, not tax advice, and
it should not be relied on as such.

| Parameter | Stated intent | Verification stub |
|---|---|---|
| Entity type | Single-Member LLC, pass-through, disregarded for federal income tax | **[REQUIRED_ENV_PARAM: JRS_ENTITY_FORMED]** |
| Effective date | 1 January 2027 | **[REQUIRED_ENV_PARAM: JRS_ENTITY_EFFECTIVE_DATE]** |
| State of formation | Not stated | **[REQUIRED_ENV_PARAM: JRS_ENTITY_STATE]** |
| Startup cost treatment | IRC Section 195 election | **[REQUIRED_ENV_PARAM: JRS_195_ELECTION]** |
| Reporting | Schedule C, flowing to the joint return | **[REQUIRED_ENV_PARAM: JRS_TAX_ADVISER_REVIEW]** |
| Offset target | Combined pension distributions and salary | **[REQUIRED_ENV_PARAM: JRS_HOUSEHOLD_INCOME]** |

### 6.1 Three points of substance that hold regardless of the numbers

**Timing works against a 1 January 2027 effective date if costs are incurred in 2026.**
Startup expenditure is treated by reference to when the business begins, not when the money
leaves. Costs paid in 2026 against an entity that starts in 2027 need the treatment settled
before the spend, not after.

**A deduction is not a yield.** Reducing taxable income by an amount returns that amount
multiplied by a marginal rate, not the amount itself. Any projection expressing the setup
spend as a return needs the marginal rate stated explicitly or it overstates by a large
multiple.

**Zero revenue is the risk, and it is the one worth naming.** An activity with $0 revenue
across multiple years, deducting expenses against unrelated household income, is the exact
profile that attracts scrutiny of whether the activity is engaged in for profit. The defence
is a businesslike record: the licensing plan, the pricing, the outreach log, and the
commercialization tracker. **Those already exist in this repository, and that is a genuine
asset here.** The weakness is not documentation. It is that revenue is $0 and no offer has
been shown to a named buyer.

---

## 7. Milestones

### 7.1 2026, remaining

| # | Milestone | Gate | Blocked on |
|---|---|---|---|
| 1 | Return the signed SCCE/HCCA copyright form | November publication | The form has not been received |
| 2 | Obtain manuscript sign-off from the methodology contributor | Detection paper submission | Deferred by him on 2026-08-22 |
| 3 | File USPTO Class 042, JRS and DRR | Any licence conversation | Not filed |
| 4 | Settle entity and startup-cost treatment with a practitioner **before** spending | Section 6 | No practitioner engaged |
| 5 | Land one named organisation on `api/review-engine.js` | Moves 15 to 25 percent | Nothing technical. Outreach |
| 6 | Restart the nightly cross-vendor series | A running series during diligence | One flag in `api/_study-status.js` |
| 7 | Draft the master licence agreement | First partner conversation | Not started |

### 7.2 2027

| # | Milestone | Gate |
|---|---|---|
| 8 | Entity effective, first Schedule C year | 1 January 2027 |
| 9 | November CEP publication in circulation as a credential | Q1 |
| 10 | First upfront integration fee recognised | Q1 to Q2 |
| 11 | Convert one field-limited exclusivity with a performance floor | Q2 to Q3 |
| 12 | Second and third partner conversations opened from the first deployment | Q3 to Q4 |

---

## 8. What this document does not claim

No paper in this programme has completed peer review. No organisation has deployed the
standard. Revenue is $0. The trademarks are not filed. No entity has been formed. The
validation contributor participates personally and his firm has no involvement of any kind.
The reproducibility series is complete and closed, not live. The five-condition
discrimination analysis was withdrawn as circular. Per-condition reliability sits below the
floor set before analysis on all five conditions.

**Every one of those is disclosed here because a licensee will find each of them, and finding
them first is worth more than any of them costs.**
