# Institutional Stress-Test and Credibility Audit

**2026-08-23.** Three-discipline review of the JRS v1.0 and DRR licensing plan. Every finding
is anchored to a file, a line, or a live endpoint response captured on this date.

---

## 0. Two things to settle before the three sections

### 0.1 The fee structure has now changed twice, and three versions are in circulation

| Source | Integration fee | Recurring | Adoption probability |
|---|---|---|---|
| Playbook, as supplied 2026-08-22 | $10,000 to $25,000 | $25,000 to $75,000+ | 55 to 65 percent |
| This brief | **$7,500 to $15,000** | **$15,000 to $40,000** | **40 to 50 percent** |
| Verified position | not yet offered to anyone | not yet offered to anyone | **15 to 25 percent** |

**Nothing in the repository records a decision to move from the first to the second.** Two
different price sheets for the same asset, both undated and both unpublished, is a diligence
problem the moment a second buyer compares notes with a first. **Pick one, date it, and put it
in `api/_offer-config.js` alongside the three prices that already live there.**

The revision is directionally correct. **$7.5k to $15k against $15k to $40k recurring is
closer to real mid-market SaaS paper than the original**, and Section 1.3 explains why.

### 0.2 The brief describes three artifacts that do not exist as described

| Brief says | Verified |
|---|---|
| "pre-packaged compliance mapping (NIST AI RMF, EU AI Act, ISO 42001)" | **ISO 42001 appears on 0 of 71 public pages.** NIST AI RMF on 3, EU AI Act on 4. **No page cites an Article or Annex number.** There is no crosswalk |
| "$500 to $750 self-service tiers" | Offers are **$250, $500 and $750** (`api/_offer-config.js:23,31,39`), and all three are **human-delivered services**: "scope and turnaround are agreed in writing before any record is sent" (`audit-request.html`, `calibration-request.html`) |
| "stateless API (api/review.js)" | `api/review.js:22` returns a routing determination of **Low / Moderate / High / Critical**. The contract described is `api/review-engine.js:109-111`, and it **writes a row per review** |

---

# Section 1: Technology Transactions and SaaS Legal Audit

## 1.1 Liability allocation. The disclaimer will not survive, and the reason is in your own files

**Verdict: mid-market buyers will accept a liability cap. They will not accept the current
disclaimer posture, because the product's own published description defeats it.**

### The blocking fact

`/openapi-review-engine.json`, live, is the document a buyer's counsel reads first. Its own
`info.description` says:

> Operational validation stage: unvalidated, single-model engine. Reproducibility is disclosed
> (runs>1), and is distinct from accuracy and from validation. **No effectiveness claim is
> made.**

**You cannot simultaneously publish "no effectiveness claim is made" and license the thing as
a pre-finalization decision gate that a customer relies on.** Counsel will read that sentence
back to you in the first call. It is honest and it is correct, and it means the current asset
is licensable as **advisory tooling**, not as a control.

### The indemnity question, answered directly

**They will demand indemnification for IP infringement. They will not get, and will not
seriously press for, indemnification for algorithmic failure**, provided three things are true:

1. The output is **advisory and non-blocking**. A gate that stops a record from being written
   is a control and attracts control liability. A gate that annotates and routes does not.
   **Build the contract around routing, which is what the engine actually does.**
2. The **determinism is contractual**. `api/review-engine.js:109-111` is the strongest asset
   you have here: `gap` beats `review` beats `pass`, zero exceptions across the labelled
   corpus. **A deterministic mapping is warrantable in a way a model output is not.** Warrant
   the mapping, disclaim the condition assessments.
3. **The five condition assessments are model output and must be disclaimed as such.**

### The three defects that will be found in diligence

| # | Defect | Evidence | Consequence |
|---|---|---|---|
| 1 | The Data Isolation Guarantee is contradicted on your own live site | `engine-activity.html:62` promises "a short preview of the submitted record"; `:66` promises "a 200-character input preview". **Untrue since 2026-08-14** | A security reviewer finds the site claiming retention the contract disclaims. **This single page can end a deal** |
| 2 | "Stateless, never persisted" is false as written | `api/review-engine.js` `logReview` POSTs `request_id`, `determination`, `conditions`, `finding`, `runs`, `overall_consistency` per call | The true claim, **no customer record text is stored**, is defensible. The absolute is not |
| 3 | Per-condition reliability is below your own pre-set floor | AC1 0.236 to 0.413 across all five conditions against a 0.61 floor | A buyer relying on a **specific condition** rather than the determination has no reliability support. Disclose it and scope reliance to the determination |

### Recommended liability architecture

| Term | Position |
|---|---|
| Cap | **1x fees paid in the preceding 12 months.** Standard, and defensible at this price point |
| IP infringement indemnity | **Give it.** Uncapped or at a 3x supercap. You created the asset; you can stand behind title |
| Algorithmic-failure indemnity | **Refuse.** Substitute an accuracy disclaimer plus the determinism warranty |
| Warranty | The determination is a deterministic function of the five condition statuses, per the published rule. **Nothing about condition accuracy** |
| Data | No customer record text stored. Structured evaluation row retained, contents enumerated |
| Human-in-the-loop | **Required by contract.** The licensee agrees output is advisory and a person decides |

**That last row is the single most valuable clause you can write.** It converts an algorithmic
liability question into a customer-process question.

## 1.2 IP chain of title. The plan has a gap that assignment cannot close

**Verdict: the mechanics are right and incomplete. The 2027 entity plan is sound. The
contributor rights are not, and that is what a buyer's counsel actually asks for.**

### What works

Forming the SMLLC effective 1 January 2027 and assigning the 2026 corpus, datasets and schemas
into it is the correct structure. A single named individual assigning to a wholly owned entity
is the cleanest chain there is: no co-founders, no employer invention agreements, no
contractor disputes.

### The gap, and it is material

`research/CONSENT_AND_RELEASE_AUDIT_2026-08-13.md` records the position: **nothing is signed
anywhere. Every permission is a tick plus a stored boolean, and no terms version is stored
against any consent row, so the wording a person saw cannot be proven.**

That audit names two gaps that cost money at sale. The one that bites here:

**Consent is not assignment.** Reviewers, raters and co-authors granted use permissions
through a web form. **None assigned copyright.** The validation corpus is yours; **the graded
responses, the reviewer commentary and the co-authored manuscripts are not cleanly yours to
transfer.**

A licensee taking exclusive distribution rights will ask: *who owns the validation data you
are relying on to prove this works?* The answer today is layered, and the proof is a boolean
in a table with no terms version attached.

### Second issue: co-authored works

Four manuscripts carry co-authors. **Co-authorship creates joint copyright in the work.**
Neither Hossain nor Pokhriyal nor McMullan has assigned anything, and Hossain's sign-off is
deferred as of 2026-08-22. **You cannot assign a paper you jointly own without your
co-authors' agreement**, and you should not want to.

**This does not block the licence.** It blocks a clean *exclusive* grant that recites the
validation evidence as licensed property.

### Remediation, in order

| # | Action | Why |
|---|---|---|
| 1 | Store a **terms version identifier** against every future consent row | Without it you cannot prove what anyone agreed to. `api/contributor.js` writes the row; add the field |
| 2 | Draft a short **contributor assignment and release** covering the graded responses and derived data, and send it to the 36 completers | Consent to use is not a transfer. This is the instrument a successor's counsel asks for |
| 3 | Get **written co-author consent to commercial use** of each manuscript, separate from authorship sign-off | Two different permissions. Do not bundle them into one ask |
| 4 | Form the entity, then assign, then **file the marks in the entity's name** | Filing personally and assigning later creates a recordation step and a gap in the USPTO record |
| 5 | Warrant title to the **standard, the schema and the engine**. License the **validation evidence** under a narrower "as available" grant | Honest, and it isolates the one weak link |

**Point 4 is a real sequencing error in the plan.** The plan files trademarks in Phase 2
alongside formation. **File in the entity's name or you create an assignment-recordation
problem in the chain you are trying to make airtight.**

## 1.3 MCLA economics. The revised numbers map cleanly. One term is missing

**Verdict: $7,500 to $15,000 upfront against $15,000 to $40,000 annual minimum is standard,
defensible mid-market paper. It is a material improvement on the earlier $10k to $25k against
$25k to $75k.**

### Why the revision is right

At $25k to $75k recurring you are asking a mid-market GRC vendor to commit six figures across
a term for an unvalidated component with zero reference deployments. **That price implies a
proven category.** At $15k to $40k you are inside the range a vendor approves without a board
paper, which is the correct target when the buyer's real question is whether their customers
will ask for this.

### Mapping to standard paper

| Term | Proposed | Market | Assessment |
|---|---|---|---|
| Upfront integration | $7.5k to $15k | $5k to $25k, mid-market | **Clean** |
| Annual minimum | $15k to $40k | Tiered minimums standard | **Clean** |
| Term | 3 to 5 years | 1 year with auto-renew is more common at this size | **Too long.** A 3-year initial term on an unproven component is a hard ask. **Start at 1 year plus two renewal options** |
| Exclusivity | Named in the plan | Rarely given pre-revenue | **Only field-limited and territory-limited, with a performance floor** |
| Uplift | Absent | 3 to 7 percent annual, or CPI | **Missing. Add it** |
| Version pinning | Absent from the plan, present in the asset | Standard | `api/v1/review-engine.js` already exists. **Contract to it** |
| Sunset and wind-down | Absent | Standard | **Missing.** A licensee needs to keep serving its own customers post-termination |

### The missing term that matters most

**There is no clause governing what happens when the validation evidence changes.**

Your own research changed materially inside a month: the five-condition discrimination analysis
was **withdrawn as circular** on 2026-08-21, per-condition reliability came in **below the
pre-set floor**, and the nightly series was **suspended**. Each is honest science. Each is also
a change to the evidence a licensee's marketing may already rest on.

**Add a research-change notification clause.** You notify within 30 days of any material change
to the published validation position; they get a defined window to update their collateral. It
costs you nothing, it is unusual enough to signal integrity, and **it prevents a licensee from
claiming they were misled when the next finding lands.**

---

# Section 2: Fractional CFO and Pass-Through Tax Audit

**Nothing in this section can be verified from the repository. No entity, no election, no
ledger, no income figure exists here, and `SURGICAL_REMEDIATION_PROMPT.md:68` forbids asserting
an entity type that has not been formed. This is structural review, not tax advice, and it does
not substitute for a licensed practitioner.**

| Parameter | Stub |
|---|---|
| Entity formed | **[REQUIRED_ENV_PARAM: JRS_ENTITY_FORMED]** |
| State of formation | **[REQUIRED_ENV_PARAM: JRS_ENTITY_STATE]** |
| Filing status and marginal rate | **[REQUIRED_ENV_PARAM: JRS_MARGINAL_RATE]** |
| Combined household AGI | **[REQUIRED_ENV_PARAM: JRS_HOUSEHOLD_AGI]** |
| Practitioner engaged | **[REQUIRED_ENV_PARAM: JRS_TAX_ADVISER_REVIEW]** |

## 2.1 Sections 195 and 248. The plan states the mechanism wrongly, and 248 does not apply

### The correction

The playbook says qualifying startup costs can be **"immediately deducted."** That is not the
rule. Section 195 gives a **limited first-year deduction**, reduced dollar-for-dollar once
total startup expenditures exceed a threshold, with **the remainder amortised over 180 months**
beginning in the month the active trade or business begins.

**On a $7,000 to $16,000 spend the practical outcome may be close to what the plan describes**,
because the spend is likely under the phase-out threshold. **The mechanism as stated is still
wrong and a practitioner will correct it.** Get the current-year figure from them, not from a
plan document.

### Section 248 does not apply here

**Section 248 governs corporate organizational expenditures.** A single-member LLC that has not
elected corporate treatment is **disregarded** for federal income tax purposes. Its
organizational costs fall under **Section 709 analysis by analogy or are treated under 195**,
not 248. The brief's framing imports a corporate provision into a disregarded entity.

**This matters practically:** if the plan's drafting assumes 248, it may also assume a
corporate election that would defeat the entire Schedule C pass-through structure the plan is
built on. **Confirm with the practitioner that no entity classification election is being made.**

### The timing trap the plan half-sees and should see fully

Phase 1 says to avoid formation costs in late 2026. **The instinct is right and the reasoning
is incomplete.**

Startup-cost treatment runs from **when the active trade or business begins**, not from the
entity's formation date and not from when money is spent. Costs paid in 2026 for a business
that begins in 2027 are startup costs; they are **not deductible in 2026** and they are not
lost either. **The risk is the reverse of what the plan guards against**: incurring
substantial 2026 spend and expecting a 2026 deduction.

**Settle "when did the business begin" with the practitioner before any spend.** That single
date drives everything in this section.

## 2.2 Household AGI stress-test. Section 183 is the real exposure and the plan understates it

**Verdict: the offset mechanism works as described. The hobby-loss exposure is materially
higher than the plan admits, and the repository is the defence.**

### Passive activity loss is not your problem

Section 469 limits losses from activities in which the taxpayer does not **materially
participate**. At 10 to 15 hours per week on the only trade or business he operates, material
participation is satisfied under more than one of the regulatory tests. **PAL limitation is not
a live risk here.** The plan is right to ignore it, though it never says why.

### Section 183 is the live risk

This is the profile:

| Factor | Position |
|---|---|
| Revenue to date | **$0** |
| Years of activity before entity formation | 2026 and earlier, unincorporated |
| Losses claimed against | Pension distributions plus a salary |
| Activity type | Research and intellectual property, adjacent to prior professional expertise |

**An activity with $0 revenue deducting against unrelated household income, in a field the
taxpayer finds personally engaging, is squarely the fact pattern Section 183 examines.** The
plan's worst-case row treats this as a straightforward tax shelter. It is not a shelter; it is
a deduction available only if the activity is engaged in for profit.

### The defence is unusually strong, and it is already built

The nine-factor analysis under the Section 183 regulations turns substantially on
businesslike conduct and records. **This programme's records are far better than a typical
sole proprietor's:**

| Factor | Evidence in the repository |
|---|---|
| Businesslike manner, complete books | `research/MASTER_TRACKER.md`, dated entries from 2026-07 forward |
| Business plan | `research/Licensing_Execution_Plan_2026-08-22.md`, dated milestones with owners |
| Commercialization effort | `IP_COMMERCIALIZATION_TRACKER.md`, three priced offers built and deployed |
| Expertise of the taxpayer | 16 years developing and training structured behavioural frameworks; Lead Civil Rights Officer, 13 years 8 months |
| Time and effort expended | Documented daily engineering log across 792 tracked files |
| Expectation of asset appreciation | `research/IP_SALE_TRACKER.md`, 19 dated revisions |
| Success in similar activities | Second Thought Alternatives, Inc., 2003 to 2018, co-founder |
| **Occasional profits** | **None. This is the weak factor** |
| Elements of personal pleasure | Neutral to unfavourable. Research is personally rewarding |

**Seven of nine factors are documented and favourable. The failing one is revenue.**

### The action that converts the position

**`/api/asset-stats` records `checkout_intent` total 2, one on the $750 offer and one on the
$500 offer, both `state: unconfigured`.** Two buyers reached the till and found no payment
link, because `api/_offer-config.js:26,34,42` each hold an empty `checkout_url`.

**Paste three URLs and the strongest available Section 183 defence becomes reachable: actual
revenue, however small.** A first year with $1,500 of receipts and a documented plan is a
categorically different filing position from a first year with $0.

**This is now the highest-value item in the entire engagement, and it is fifteen minutes of
work.**

## 2.3 Capital outlay. The $7k to $16k buffer is thin in two lines and missing three items

### Line-by-line

| Line | Plan | Assessment |
|---|---|---|
| SMLLC formation and assignment | $1,500 to $3,500 | **Adequate.** Simple single-member formation with an IP assignment sits in this band |
| USPTO Class 042, two marks | $1,000 to $2,500 | **Thin.** Two marks in one class means two applications. Government fees are per mark per class, and **`TRADEMARK_FILING_DOSSIER_JRS_DRR.md:49` records the Class 042 identification as DRAFTED, NOT VERIFIED**, which raises office-action risk. Budget the top of the range and expect at least one office action |
| MCLA drafting | $2,500 to $5,000 | **Low for bespoke drafting** at the quoted $350 to $650 hourly rate. $5,000 buys roughly 8 to 14 hours. A first-of-kind IP licence for an unvalidated component takes longer. **Realistic: $5,000 to $9,000** |
| Redlining reserve | $2,000 to $5,000 | **Per deal, not total.** The plan reads as though this covers all negotiation. It covers one |

### Three missing lines

| Missing | Estimate | Why it is needed |
|---|---|---|
| **Contributor assignment and release instrument** | $1,000 to $2,500 | Section 1.2. Without it the validation evidence has no clean chain |
| **Trademark search before filing** | $500 to $1,500 | Filing two marks without a clearance search on an unverified identification is how $2,500 becomes $6,000 |
| **Practitioner engagement** | $500 to $1,500 | Sections 2.1 and 2.2 both require it, and the plan budgets $0 for tax advice while building a tax strategy |

**Revised realistic total: $12,000 to $24,000** for formation, two marks, the licence
instrument, the contributor release, clearance, and one negotiation. The plan's $7,000 to
$16,000 covers the first negotiation and nothing after it.

**This does not break the plan.** It moves the ceiling by roughly $8,000 against a
downside the plan already accepts.

---

# Section 3: GRC Go-To-Market and Market Fit

## 3.1 Enterprise friction and feature parity. 40 to 50 percent is not supportable

**Verdict: the direction is right, the number is not. Verified position is 15 to 25 percent for
the API licensing route in the next twelve months.**

### The live evidence

| Signal | Value | Source |
|---|---|---|
| Organizations running records | **0** | `/api/orgpilot-stats`, live |
| Sessions, records run | **0, 0** | same |
| Revenue | **$0** | no configured payment path |
| Trademarks | **Not filed** | `research/IP_SALE_TRACKER.md:80` |
| Reference deployments | **0** | |
| Paid-offer checkout attempts | **2, both dead** | `/api/asset-stats` |

The endpoint labels its own zero honestly: *"Never sent to any organization. No invitation has
been issued."* **A true zero from a surface never offered is not evidence of rejection. It is
the absence of a test.**

### Will GRC vendors treat this as native or as a plug-in?

**Native, eventually. Plug-in, now. That is the window and it is real but narrow.**

Decision-reconstruction logic is a documentation-quality assessment applied at draft time. It
sits beside existing GRC capabilities rather than inside any of them: policy management,
control testing, issue tracking and audit workflow do not evaluate whether a drafted record
explains itself. **No incumbent owns this today.**

**The counter-force is that it is not hard to build once someone wants it.** Five conditions,
a deterministic mapping and a model prompt. **What is hard to build is the evidence**: 16
international expert reviewers, 384 graded reads, a chance-corrected reliability framework
and a corpus with a reference classification. **A vendor can copy the standard in a quarter.
They cannot copy the validation.**

**Sell the evidence, not the logic.** That reframing also raises your price ceiling and is the
argument for the trademarks.

### Why not 40 to 50 percent

A 40 to 50 percent figure describes a programme with inbound interest, a reference customer
and a category buyers already recognise. This one has **zero deployments, unfiled marks, no
peer-reviewed publication, an OpenAPI description that says "no effectiveness claim is made",
and a validation position that changed materially twice in August.**

**15 to 25 percent, moving to 45 to 60 on one live deployment.** The ladder is in
`research/Licensing_Execution_Plan_2026-08-22.md` Section 4.

## 3.2 Compliance cross-walk. It does not exist, and this is the cheapest high-value build in the plan

**Verdict: the brief describes an artifact the site does not contain.**

| Framework | Public pages mentioning it | Article or clause level mapping |
|---|---|---|
| NIST AI RMF | 3 of 71 | **None** |
| EU AI Act | 4 of 71 | **None.** Zero pages cite an Article or Annex number |
| **ISO/IEC 42001** | **0 of 71** | **None** |
| SOC 2 | **0 of 71** | n/a |

**A mention is not a crosswalk.** A crosswalk is a table: *this JRS condition produces evidence
for that specific clause.* An enterprise risk team uses it to justify a purchase against a
control they are already required to satisfy. Four scattered mentions with no clause numbers
give them nothing to take to their own committee.

### Does a crosswalk substitute for SOC 2 Type II?

**No, and it does not need to, because they answer different questions.**

- **SOC 2 Type II** answers *is this vendor's operation trustworthy with our data.*
- **A crosswalk** answers *does this product help us satisfy an obligation we already have.*

A buyer will ask both. **You can defer SOC 2 at this stage and this scale, provided the data
answer is strong enough to make the question small.** The strongest available answer is
architectural: **no customer record text is stored at all.** A vendor that never retains the
sensitive artifact reduces the scope of the security review dramatically.

**That answer is currently defeated by your own live site.** `engine-activity.html:62` and
`:66` tell the public a 200-character preview of each submitted record is stored. **Fix that
page before any security conversation, or the one argument that lets you defer SOC 2 is
contradicted by your own words.**

### Build the crosswalk. It is days of work

The reference library already contains the raw material across 17 pages, and
`reference/ai-verification-controls/` and `reference/documentation-risk-tiers/` are the
closest existing anchors.

**Target artifact:** one page, three columns. JRS condition, framework clause, evidence
produced. **Cite the actual clause numbers.** NIST AI RMF functions and categories; EU AI Act
Articles with the transparency and record-keeping obligations named; ISO/IEC 42001 Annex A
controls.

**This is the single highest-leverage document not yet written**, because it is the one a risk
team can act on without a procurement process.

## 3.3 Self-service funnel. The premise is wrong, and correcting it changes the whole model

**Verdict: $13,000 to $36,000 annually from the current offers is not achievable at observed
traffic, and more importantly the offers are not self-service.**

### The premise error

The brief calls them "$500 to $750 **self-study** tiers" with "zero live-speaking overhead."
The offers are **$250, $500 and $750**, and all three are **human-delivered services**:
`audit-request.html` and `calibration-request.html` both state that **"scope and turnaround are
agreed in writing before any record is sent."**

**Somebody reads the records and writes the report, and that somebody is you.** These are not
digital products. There is no zero-overhead scaling path through them at any volume.

### The arithmetic against observed traffic

To reach $13k to $36k at a $500 blended price requires **26 to 72 paid engagements per year**,
one to one and a half per week, each with a written scope and a delivered report.

Observed, all time:

| Metric | Value |
|---|---|
| Public artifact downloads | **370** (108 crawler rows excluded) |
| Paid-offer checkout clicks | **2** |
| Completed purchases | **0**, both clicks hit an unconfigured checkout |
| Training enrollments | 8 people, **5 organizations** |
| Training completions | **7**, across 5 countries |
| Reviewer evaluation opens to submissions | 18 to 1 |

**370 downloads produced 2 checkout clicks.** Even at a generous read that is a 0.5 percent
intent rate on a free artifact. Reaching 26 engagements needs roughly **5,000 downloads at the
observed rate**, or a conversion rate 13 times better than observed.

### What the number should be

| Scenario | Year 1 self-service revenue |
|---|---|
| Paste the URLs, no other change | **$500 to $2,000.** The two existing clicks plus organic |
| Plus reopening the funnel and restoring the pages to the sitemap | **$1,500 to $5,000** |
| Plus a productised, genuinely self-serve deliverable | **$5,000 to $15,000** |
| The brief's $13k to $36k | **Not reachable in year 1 on this traffic with human-delivered services** |

### The correction that makes the tier work

**Build one genuinely self-service product.** The material exists: the Seven-Point Check, the
19-page desk reference, the four field guides, the six-module training, the codebook and the
17-page reference library. **A paid self-assessment kit or a certification seat has no delivery
cost per unit.** That is the tier that scales with zero speaking overhead. The current three
offers never will, because they are consulting with a price tag.

### And the funnel is currently closed

The three offer pages, plus `engagement.html` and `terms.html`, carry **zero inbound links and
are absent from `sitemap.xml`**. This was deliberate (`IP_SALE_TRACKER.md` revision 14,
2026-08-15) and is reversible by one `git revert`. **The 2 checkout clicks were generated by a
funnel that is switched off and has no payment path.** That is the most encouraging fact in
this audit.

---

# Key Verification Checklist

## Q1. Can a stateless API satisfy enterprise risk teams without SOC 2 Type II?

**Yes at this deal size, conditionally, and three conditions are currently unmet.**

Mid-market vendors routinely onboard sub-$50k components without SOC 2 when the data exposure
is small. **The architecture supports the argument: no customer record text is stored.** That
is a genuinely strong position.

| Condition | Status |
|---|---|
| The public site must not contradict the retention claim | **FAILING.** `engine-activity.html:62,66` promises a stored 200-character preview of each record. `scripts/fix_engine_activity_copy.py` fixes it. **Not deployed** |
| The contract must state what IS retained, not claim nothing is | **Not drafted.** The row contents are enumerable and defensible; the absolute is not |
| A DPA and a security one-pager must exist | **Neither exists** |

**Correction, because it matters:** the API in question is **`api/review-engine.js`**, not
`api/review.js`. `api/review.js:22` returns Low/Moderate/High/Critical and is a different
service.

**A buyer above roughly $50k in annual spend, or in a regulated vertical, will require SOC 2
regardless.** That is the ceiling on this route until it is obtained, and it argues for
pricing at the $15k to $40k band rather than reaching higher.

## Q2. Does passive web traffic to a $15,000+ annual licence have precedent in this niche?

**Not directly, and the honest answer is that the plan describes two different motions as one.**

**Passive traffic does not convert to enterprise licences.** Content and free tools generate
awareness; enterprise licences close through named outbound contact, a reference customer and a
procurement cycle. **No amount of download volume substitutes for the first deployment.**

**The precedent that does exist is adjacent and instructive.** Standards bodies and methodology
owners do license to platforms, but the sequence is always the same: **practitioner adoption
first, platform licensing second.** The platform licenses the standard because its customers
are already asking for it by name. **This programme has the practitioner surface built and
almost entirely unused.**

**What the repository shows about the actual path:**

| Asset | State |
|---|---|
| Training completions | **7 people, 5 organizations, 5 countries** |
| Organisations with contact consent | **5**, from completed training, owned rather than borrowed |
| Owner's track record | **16 years training counselors, educators and clergy on consistent application of structured frameworks within existing operational environments** |

**That is the precedent-backed route.** Practitioner training builds named organisational
adoption; named adoption is what makes a platform licence rational for the platform.

**It starts cold.** The federal-sector referral channel was closed by the owner on 2026-08-23
as never having been real interest. **The warmest list the programme owns is the 5
organisations that already completed training and the 8 people who consented to contact.**

## Q3. Does the passive e-commerce flow cover the downside if enterprise licensing yields $0?

**No, and the plan's worst-case row is optimistic in a way that matters.**

**Cash:** three human-delivered offers behind a dead checkout, on a switched-off funnel,
against 370 lifetime downloads. Realistic year-one self-service revenue with the URLs pasted
and the funnel reopened is **$1,500 to $5,000** against a revised outlay of **$12,000 to
$24,000.** **The flow covers roughly a fifth of the downside.**

**Tax:** the worst-case row says a $0-revenue year produces "a constructive tax shelter."
**That is the Section 183 fact pattern, not a shelter.** The deduction is available only if the
activity is engaged in for profit, and $0 revenue is the weakest of the nine factors. Seven of
the nine are documented and favourable here, which is unusually strong, **but the row as
written misstates the position and should not go in front of family or an advisor in that
form.**

**What actually covers the downside:**

| Cover | Assessment |
|---|---|
| The $7k to $16k ceiling, revised to $12k to $24k | **Real.** The spend is bounded and the plan is right that there is no ruin scenario |
| Consulting and advisory income continuing | **Real, and outside this plan.** It is the actual floor |
| Training and certification revenue | **The best available cover and the plan omits it.** A complete deployed curriculum, 5 organisations already trained, and 16 years of the owner's delivery experience. **Cold outreach, no introductions** |
| Self-service e-commerce | **Weak** at current traffic with human-delivered offers |

**Revised downside statement:** if enterprise licensing yields $0, the recoverable position is
a training or curriculum engagement, not e-commerce. **Estimated at 20 to 30 percent within 12
months**, revised down on 2026-08-23 when the referral channel closed, against 15 to 25
percent for the API route, and it requires no entity, no registered
marks, no MCLA and no SOC 2.

---

# Ranked actions

| # | Action | Cost | Effect |
|---|---|---|---|
| 1 | **Paste three `checkout_url` values** | 15 minutes | Two buyers already turned away. Creates first revenue, which is the weak Section 183 factor |
| 2 | **Deploy `fix_engine_activity_copy.py`** | One deploy | Removes the live contradiction of the one claim that lets you defer SOC 2 |
| 3 | **Approach the 5 organisations that already completed training** | One hour | 8 people consented to contact. The warmest list the programme owns |
| 4 | **Build the compliance crosswalk with clause numbers** | Days | The document a risk team can act on without procurement |
| 5 | **Engage the practitioner before any spend** | $500 to $1,500 | Sections 2.1 and 2.2 both turn on one date |
| 6 | Draft the contributor assignment and release | $1,000 to $2,500 | Closes the chain-of-title gap |
| 7 | Trademark clearance search, then file **in the entity's name** | $500 to $1,500 plus fees | Avoids a recordation gap in the chain |
| 8 | Reconcile the two fee structures into `api/_offer-config.js` | 30 minutes | Two undated price sheets is a diligence problem |
| 9 | Deploy `block_internal_docs.py` | One deploy | `/CLAUDE.md` publishes the private owner-page slug |
| 10 | Build one genuinely self-service product | Weeks | The only version of the tier that scales without speaking overhead |

**Items 1, 2 and 3 cost under two hours in total and move more than the rest of the list
combined.**

**Note on a removed item.** An earlier draft ranked sending three federal-sector referral
follow-ups at position 3. **The owner determined on 2026-08-23 that the interest behind those
referrals was never real.** The channel is closed and the drafts are withdrawn.
