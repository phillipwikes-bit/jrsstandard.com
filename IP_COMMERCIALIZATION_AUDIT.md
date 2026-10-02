# IP COMMERCIALIZATION AUDIT

**Prepared 2026-08-13. Every figure read live from production or from the file named. Nothing carried from memory.**

---

## 0. The demand disconnect, stated first

The public surface asks a stranger to **become a research subject or a certificate holder**. Measured live today:

| Public offer | All-time result |
|---|---|
| Reviewer evaluation | **1 open, 0 submissions, 0 contacts** |
| Organization pilots | **0 organizations, 0 sessions, 0 records run** |
| Revenue | **$0.** No payment mechanism exists anywhere on the site |
| Training certificates | 4 row-verified completions |

**Every public call to action asks the reader to give time before receiving value.** "Complete a nine-question evaluation." "Enrol in six modules." "Register for a guide." A General Counsel with a live exposure will not do any of those.

**Meanwhile the assets an enterprise buyer would actually pay for are not on the public site at all.** That is the disconnect: the shop window sells participation, and the stockroom holds diagnostics.

---

## 0b. The funnel was measured on 2026-08-13, and it fails at the door

The first version of this audit recorded "1 open, 0 submissions" as a flat fact. **Per-CTA click attribution went live the same day, and it locates the failure precisely.** All-time, read from production:

| Stage | Count | What survives to the next stage |
|---|---|---|
| Reached the reviewer landing page | **7** | |
| Clicked "Take the 4-minute reviewer evaluation" | **1** | **1 of 7** |
| Opened the instrument | **1** | 1 of 1 |
| **Submitted anything** | **0** | **0 of 1** |
| Answered all nine | **0** | |
| Left contact details | **0** | |

**Six of seven people who reached the page never clicked the button.** The single person who did click is in India, and the click came from `/reviewer/index.html`.

### Why this matters more than the raw zero

The zero was previously open to a comfortable reading: *the instrument is too long, or the questions are wrong, or people start and give up.* **The measurement rules that out.** The loss is almost entirely upstream of the instrument. Nobody is abandoning the evaluation. **Almost nobody agrees to begin it.**

That distinction decides what to build:

| If the failure were | The fix would be | Evidence |
|---|---|---|
| Inside the instrument | Shorten it, cut questions, save progress | **Contradicted.** 1 of 1 who opened it did not abandon partway, they never submitted at all, and only 1 person ever opened it |
| At the door | **Change the offer, not the form** | **Supported.** 6 of 7 refused at the click |

**Every one of the three packages below is a door-level fix.** That is not a coincidence and it is not hindsight: the ranking was written before this measurement and the measurement did not change it. It raised the confidence behind Rank 1 specifically, because Rank 1 is the only proposal that removes the door entirely by delivering the value on the page.

### The honest caveat on these seven

Landing-page logging began **2026-08-11**. Arrivals before that date are **unknown, not zero**, and the endpoint says so itself. So 7 is a floor on arrivals, not a total, and the 1-in-7 click rate is drawn from a sample small enough that it indicates a direction and nothing more. **It is not a conversion rate and must not be quoted as one.**

### One thing still unmeasurable

**Nothing records partial progress inside the instrument.** Someone who answers six of nine and closes the tab leaves no row. Their place is saved in `localStorage` and never leaves the browser. Reporting it would mean new telemetry on a research instrument whose participants consent at submission, not before it, so it was flagged rather than built. `[REQUIRES USER INPUT]`.

---

## 1. Asset index, and where each one lives

| # | Asset | Location on disk | Public surface today |
|---|---|---|---|
| 1 | **The seven AI failure modes** | `research/JRS_Validation_Report.md` §4 | **ZERO public pages** |
| 2 | **Cross-vendor consistency harness** | `api/run-study.js` | **ZERO public pages** |
| 3 | **24-record benchmark + verified answer key** | `api/bench-admin.js`, `bench_records`, `bench_labels` | Named, never offered |
| 4 | Five conditions + Decision Defensibility Score | `api/review.js`, `api/review-engine.js` | 3 pages |
| 5 | Partner review API + OpenAPI spec | `api/v1/review-engine.js`, `openapi-review-engine.json` | 2 pages, vendor preview only |
| 6 | 36-completer international panel | `/api/panel-stats` | Cited, not offered |
| 7 | Investigator Field Guides, 3 editions | repo root PDFs | Free download |
| 8 | Training and certification | `training.html` | Free |
| 9 | Simulation library | `simulations.html` | Free |
| 10 | Validation Report, 36,731 bytes | `research/JRS_Validation_Report.md` | **Confidential, NDA only** |

**Verified by grep across all 45 public HTML files: assets 1 and 2 have no public surface of any kind.**

---

## 2. THE TOP THREE, ranked by demand and speed to market

---

### RANK 1: The Seven AI Failure Modes

| | |
|---|---|
| **Source** | `research/JRS_Validation_Report.md` §4 |
| **Public exposure** | **None. Zero of 45 pages name a single one** |
| **Persona** | **General Counsel** and **Head of Employee Relations / Investigations** |

**The asset, verbatim from the file:** Fluent groundlessness · Basis substitution · Chronology collapse · Reasoning elision · Confident underspecification · Evidentiary overreach · Untraceable authority.

**Why this is the strongest asset in the repository.** It is a **named diagnostic vocabulary**. A GC cannot act on "your records may be weak", but can act on *"three of your last ten terminations show basis substitution."* **Naming a failure is what converts a vague worry into a work order.** The report itself says these "convert an abstract risk into concrete things a reviewer can point to."

**Urgent buyer problem.** A record drafted with AI assistance reads as complete and cannot support the decision when challenged at tribunal, in discovery, or under audit. The exposure is already created and sits in the file, undetected, until someone contests it.

**Productized packaging: *Diagnostic / Audit Blueprint***

> **The Seven-Point Record Defensibility Check.**
> One page. Seven named failure modes, each with the question that detects it and the sentence pattern that gives it away. Run it against five of your own closed matters in under an hour, with nothing sent anywhere.

**Why it converts where the current offers do not:** it delivers value **before** any exchange, it uses the reader's own files, and it requires no registration, no upload and no trust.

**LinkedIn positioning, replacing "download my PDF":**

> Pull your last five closed investigation records. Check each against seven specific failure patterns. If two or more show up in the same file, that record probably cannot explain its own decision under challenge. The seven patterns, and how to spot each one, are here. No signup, no download, nothing sent anywhere. Read it and go look at your own files.

**Speed to market: fastest of the three.** The content exists and is written. The work is extraction and one page.

---

### RANK 2: The Cross-Vendor Consistency Harness

| | |
|---|---|
| **Source** | `api/run-study.js` |
| **Public exposure** | **None. Zero pages mention it** |
| **Persona** | **Chief AI Officer**, **Head of AI Governance**, **Model Risk Management** |

**What it actually is, read from the file header:** a nightly automated runner that puts the same constructed records to **multiple independent AI vendors** (Anthropic, plus OpenAI and Gemini when keys are present) and **escalates a label only when two or more vendors agree.** Published result: **86.7% cross-vendor agreement on the latest nightly run**, range 82.2 to 93.3 across 37 runs on the 15-record set.

**This is a working multi-vendor agreement harness with a 37-run dated history. Almost nobody has one.**

**Urgent buyer problem.** Every AI governance function is asked the same question by its board and its auditors: *how do you know the model's judgment is stable?* Most answer with a policy document. **This answers with a dated raw-agreement series that a third party can re-run. It does not establish the pre-registered reproducibility criterion: that criterion requires chance-corrected AC1, and no such coefficient was computed for this cross-vendor study.** ISO/IEC 42001 and internal model-risk standards both ask for evidence of consistent behaviour over time, and a nightly cross-vendor series is exactly that evidence.

**Productized packaging: *Turnkey Governance Kit***

> **The Model-Agreement Evidence Pack.**
> The harness design, the multi-vendor escalation rule, the run schedule, and the reporting format that turns nightly runs into an auditable series. Deployable against your own decision-support outputs. What you hand an auditor instead of a policy PDF.

**LinkedIn positioning:**

> "How do you know your AI's judgment is stable?" Most governance teams answer with a policy. We answer with 37 dated nightly runs across independent vendors, agreeing 86.7% of the time, range 82.2 to 93.3. Here is the harness design and the escalation rule that produces that series. If you can't show a range, you don't have a measurement.

**Speed to market: medium.** The engineering exists and runs. The work is documenting it as a transferable design rather than a private cron job.

---

### RANK 3: The Benchmark and the Verified Answer Key

| | |
|---|---|
| **Source** | `api/bench-admin.js`; `bench_records`, `bench_labels`, `bench_outcomes` |
| **Public exposure** | Named on the prospectus. **Never offered to anyone** |
| **Persona** | **AI assurance vendors**, **model evaluation teams**, **audit firms building an AI practice** |

**What it is, verified live:** a **24-record detection set** with a **held-out answer key fixed and independently verified 24 of 24 by raters blind to it**, graded by **36 completers across 16 countries and 5 continents**, with a **separate** measured inter-rater reliability sample (**Gwet's AC1 0.739 invited, 0.623 open enrolment; 10 analysed records; pre-registered two-part criterion not met because neither lower confidence bound reached 0.41**) and a detection result of **83.9% across 16 independent experts and 384 graded reads, 95% CI 72.7 to 95.1**.

**Why it is scarce.** Labelled evaluation data with **credentialed human raters, a pre-registered key, and published reliability** is expensive and slow to produce. A vendor claiming their tool detects weak documentation has **nothing to test against.** This is the test.

**Urgent buyer problem.** An assurance vendor cannot substantiate a detection claim without an independent benchmark. Building one means recruiting dozens of credentialed raters across jurisdictions, which is months of work and the part they cannot shortcut.

**Productized packaging: *Executive Retainer / Advisory Entry Point***

> **Benchmark Access and Calibration.**
> Licensed access to the record set and the scoring harness, with the answer key held back and scoring returned by the holder. Your tool or your team runs the set; you receive a calibration report against 36 credentialed human raters.

**The key never leaves the building.** That is what makes it repeatedly licensable rather than a one-time sale, and it is already a binding guardrail in `research/IP_Sale_Playbook.md`.

**LinkedIn positioning:**

> If your tool claims it can spot documentation that won't survive review, what did you test it against? We hold a 24-record set with a held-out key, independently verified 24 of 24, graded by 36 credentialed reviewers in 16 countries with published inter-rater reliability. You can run your tool against it and get a calibration report. The key stays with us, which is the only way the benchmark stays worth anything.

**Speed to market: slowest of the three.** Requires a licence term, a scoring workflow and a decision on pricing. **Highest ceiling of the three.**

---

## 3. What to stop doing

| Current offer | Problem | Replace with |
|---|---|---|
| "Complete the reviewer evaluation" | Asks 4 minutes before giving anything. **6 of 7 arrivals never clicked the button; of the 1 who opened it, 0 submitted.** The refusal is at the door, not inside the form | The Seven-Point Check, value first |
| "Get certified" | A certificate from an unknown issuer carries no weight with a GC | Rank 1 diagnostic |
| "Download the Field Guide" | A PDF is not a diagnosis. No urgency, no next step | Rank 1 diagnostic |
| "Request a pilot" | **0 organizations in the programme's lifetime** | Rank 3 licence conversation |

**The pattern: every current CTA asks for effort before delivering value. All three packages above invert that.**

---

## 4. Ranking

| Rank | Package | Demand | Speed | Ceiling |
|---|---|---|---|---|
| **1** | Seven-Point Record Defensibility Check | **Highest.** Names a problem the buyer already suspects | **Days** | Moderate. Door opener |
| **2** | Model-Agreement Evidence Pack | High. Answers a board question directly | **Weeks** | High |
| **3** | Benchmark Access and Calibration | Narrow audience, acute need | **Months** | **Highest** |

**Do 1 first. It costs a day and it is the only one that produces a conversation this week.**

---

## 5. Constraints that bind every package above

From `research/IP_Sale_Playbook.md` and `research/IP_Asset_Transfer_Map.md`, unchanged:

1. **The gold answer key and the five-condition scoring never enter a data room or a deliverable.** Rank 3 depends on this.
2. **NDA before specifics.**
3. **Protect the blind.** Nothing published reveals the Arm B method or the arm split.
4. **Hold every claim to the completer sample** and the pre-registered figures. **16 countries belongs to the 36 completers, never to the 58 reviewers.**
5. **No proven-effectiveness claim.** JRS is in operational validation and every package must say so.
6. **There is still no payment mechanism on the site.** None of these can be sold until that exists.

---

## 6. Honest limits

**This is a packaging audit, not a demand forecast.** Every channel tested to date has returned close to zero: federal training closed with no response from three organisations, organization pilots at zero for the programme's life, and $0 revenue. **Repackaging improves the offer. It does not prove anyone will buy it.**

The strongest evidence that Rank 1 is right is negative, and section 0b sharpened it: **the current offers have been live for weeks, and 6 of the 7 people who reached the reviewer page would not click a button that asked for four minutes.** The refusal happens before the instrument, which means the instrument is not the problem and rewriting it would not help. The asset that has never been shown is the one with a name for the buyer's problem.

**Held to its own standard, that evidence is thin.** Seven arrivals is a floor from a log that started on 11 August, and one click is one person. It points in a direction; it does not carry a rate. Any figure quoted from section 0b outside this document must carry that qualification with it.

`[REQUIRES USER INPUT]`: pricing for Ranks 2 and 3, and whether to build a payment path at all.

---

## 7. Provenance

**Revision 2, 2026-08-13.** Section 0b added from the per-CTA click attribution that went live the same day, plus the three-way verification that no evaluation has been submitted: the writer's source string is unchanged across every commit, synthetic rows through the live reader count correctly with breakdowns releasing at the pre-registered n=30, and a check-mode POST of all nine answers returns 200. Sections 3 and 6 updated to match. **The ranking is unchanged, and it was set before the funnel was measured.** Progress against this document is tracked in `IP_COMMERCIALIZATION_TRACKER.md`.

Asset index built by grep across 45 public HTML files, 36 API endpoints and the `research/` directory. Failure-mode text quoted verbatim from `research/JRS_Validation_Report.md` §4. Panel figures read live from `/api/panel-stats` on 2026-08-13: 36 completers, 16 countries, 5 continents, 58 reviewers, 48 registered, 16 detection completers across 11 countries, 20 comparison completers, 25 reliability raters. Traction figures read live from `/api/asset-stats`. Cross-vendor consistency figures read from `research.html`. **These are raw-agreement figures, not an established reproducibility result; no chance-corrected AC1 was computed for the cross-vendor study. No figure in this document was carried forward from an earlier note.**

---

# REVISION 3, 2026-10-02: revised commercialization audit

**Prepared 2026-10-02 at the owner's request. The 2026-08-13 text above is kept unchanged as the historical record (CLAUDE.md Rule 10). Each claim below is labelled Observed (checked on 2026-10-02 against production, `origin/main` or the database), Recorded (stated in an estate record), or Inference.**

## R1. What changed since 2026-08-13 (OLD FINDING, NEW EVIDENCE, CORRECTED STATUS)

| # | Old finding (2026-08-13) | New evidence (2026-10-02) | Corrected status |
|---|---|---|---|
| 1 | Assets 1 and 2 have no public surface | **Observed:** `check.html` (indexed, in the sitemap) names all seven failure modes, and 5 public pages link the Seven-Point Check. The harness is mentioned on 5 pages, including `index.html` and `check.html` | **Rank 1 is published as a free tool.** It is no longer an unshown asset |
| 2 | Three paid packages defined; the tracker (rev 6) says built and LIVE at $250, $500, $750 | **Observed:** all three are `retired: true` in `api/_offer-config.js` ("retired 2026-08-26, licensing-only model"); their pages carry `noindex` and are absent from the sitemap; every `checkout_url` is empty and was empty the whole time they were listed | **None was ever purchasable.** The tracker's "LIVE" status was stale; corrected in the tracker |
| 3 | Rank 2: a 37-run nightly cross-vendor series | **Observed:** `study_runs` holds 61 rows tagged with the three-vendor model string (Anthropic, OpenAI, Google) plus 9 single-model rows, from 2026-06-05; **last run 2026-08-21**. The 61 is a raw row count under mixed denominators. The clean 15-record series is 41 runs up to the 2026-08-15 lock (`verify_manuscript_figures.py`; guard `check_the_cross_vendor_range_carries_its_denominator`) | **The series stopped six weeks ago.** A "nightly" claim is no longer current. Quote only the 41-run, 15-record figure with its denominator |
| 4 | Rank 3: "the key never leaves the building" | **Observed:** the verified answer key is on public GitHub (`research/Verified_Key.md`, `research/Blind_Recheck_KEY_E08.md`, and inside `api/variance-*.js`); the repository is public (B-018) | **Rank 3 cannot be sold as a held-out benchmark** until a fresh, private key and record set exist |
| 5 | The Validation Report is "confidential, NDA only" | **Observed:** `research/JRS_Validation_Report.md` and `.pdf` are on public `origin/main`, as are `research/IP_Sale_Playbook.md`, `research/IP_SALE_TRACKER.md` and this audit | **The NDA-only posture no longer exists in practice** |
| 6 | Constraint 6: no payment mechanism | **Observed:** unchanged. Every checkout URL is empty; the Engine licence tiers have prices deliberately null | **Still no way to pay** |
| 7 | Demand: 0 organizations, $0 | **Observed:** `pilot_contacts` has 0 identified leads; the newest contact of any kind is 2026-09-05. `interaction_events` holds 6 checkout clicks (2026-09-09 to 09-27), all on the retired governance offer. Reviewer evaluation: opened 32 (14 crawlers excluded), submitted 1, answered all nine 0. Downloads 1,131 (646 with crawlers excluded) | **Interest exists (downloads, retired-offer clicks); conversion is zero** |
| 8 | Not in the August audit | **Observed:** a working Review Engine evaluation package, live-tested 2026-10-02 (10/10 calls, USD 0.035), with an offer at USD 1,000, an agreement draft and a technical report (`research/engine-buyer-readiness-2026-10-01/evaluation-license-v8/`) | **New sellable package** (evaluation licence), not yet offered to anyone; not reflected in `_offer-config.js` |
| 9 | Not in the August audit | **Recorded:** CEP Magazine article accepted (November issue); Corporate Compliance Insights article published (card live on `resources.html` 2026-09-29); detection article pending | **Credibility assets now exist** for outreach |

## R2. Re-ranked packages (Inference, on the evidence above)

| Rank | Package | Status now | Demand signal | Speed | Main obstacle |
|---|---|---|---|---|---|
| **1** | **Paid documentation review built on the Seven-Point Check** (the retired $250 or $500 scope, re-launched as one fixed-fee offer for GC and investigations teams) | The free tool is live; the paid scope is written but retired | Strongest available: the free tool is public, and the only checkout clicks on record (6) were for a review-type offer | **Days**, once a payment link exists | No payment link; owner time (recorded capacity 10 to 15 hours a week); HR records sit in the scope the Engine offer excludes, so counsel review is needed if employment records are reviewed |
| **2** | **Review Engine evaluation licence**, USD 1,000 | Built, tested, unsold, never shown | None yet | Ready after three owner decisions | Needs buyers willing to run software with their own API key; rights papered only by owner attestation |
| **3** | **Model-Agreement Evidence Pack** | Harness exists; series stopped 2026-08-21 | None recorded | Weeks: restart the runs and document | Raw agreement only, no chance-corrected statistic; same-vendor-family concerns; needs three provider keys |
| **4** | **Benchmark Access and Calibration** | Retired; **key public** | None | **Months:** needs a new private record set, a new key and new raters | Old key exposed; rights in rater-created material (Stacyann's corpus, contributor consents silent on licensing) |
| **5** | Training and field guides | Free; 8 enrolments, 7 completions recorded (rev 19) | Downloads 646 crawler-excluded | Fast | Low price ceiling; the federal channel closed |

**What changed in the ranking:** the Engine evaluation moves up because it now exists and is tested. The benchmark falls from "highest ceiling" to last, because its scarcity rested on a private key that is now public.

## R3. Cross-cutting findings

1. **The public repository is the largest single commercial risk** (Observed). It exposes the answer key, the validation report, the sale playbook and the Engine source. Nothing in it can be treated as a trade secret until the repository is private, and items already exposed should be treated as public permanently.
2. **The strategy has changed three times without a buyer conversation** (Recorded): participation offers (to August), three paid packages (13 August, never purchasable), licensing-only (26 August), then the Engine evaluation (1 October). **Inference:** packaging is not the binding constraint. The absence of outreach is.
3. **The offer record and the site disagree** (Observed): the v8 evaluation offer (USD 1,000) is not in `_offer-config.js`, and the Engine tiers there have null prices. Any re-launch should update that single source of truth.
4. **Rights limit every package except the free tool** (Recorded): no signed instruments (register F-4); consents silent on licensing (F-3); Hekim's prior-approval condition applies to commercial use of JRS material.

## R4. Recommended sequence (Proposed)

1. **Make the repository private** (owner, one click). Precondition for every paid package.
2. **Choose one paid offer to re-launch first.** Recommended: the fixed-fee documentation review (Rank 1), with the Engine evaluation (Rank 2) offered to platform-type buyers. Not both on the public site at once.
3. **Add one working payment link**, then update `api/_offer-config.js` and deploy with byte verification (Claude, after the owner chooses the payment service).
4. **Outreach:** a 50-organization target list (Claude) and 20 personal messages from the owner citing CEP and CCI. Review replies after 20 sends.
5. **Defer** the restart of the harness and the rebuild of the benchmark until there is a paying customer, or a buyer who specifically asks for them.

## R5. Honest limits of this revision

- Demand figures are small and partly floors (logging start dates differ by table). No conversion rate should be quoted from them.
- The ranking is a judgment from the estate's own evidence; no buyer has been asked.
- This is a packaging audit, not a valuation or a legal opinion.

**Provenance (Revision 3):** `git` against `origin/main` on 2026-10-02 (84 public HTML pages); `api/_offer-config.js`; live `/api/panel-stats` (generated 2026-10-02T06:34Z: 36 completers, 16 countries, 58 reviewers) and `/api/asset-stats`; Supabase read-only queries on `pilot_contacts`, `interaction_events` and `study_runs`; `research/IP_SALE_TRACKER.md` revisions 14 to 51; `research/engine-buyer-readiness-2026-10-01/evaluation-license-v8/`.

## R6. Correction to R4, 2026-10-02 (owner query)

The owner asked whether R4 changes the recommendation that outreach waits for published research. Checked against the record:

- **Recorded owner decision, 2026-08-15** (IP_SALE_TRACKER revision 14): the paid offer is withdrawn from the public site "until the research programme is complete". **R4 steps 2 and 3, re-launching a paid offer on the public site with a payment link, conflict with that decision.** They are withdrawn from this revision's recommendations. A public re-launch happens only if the owner reverses the 2026-08-15 decision.
- **Recorded owner decision** (register section 12): contact with Ubayet Hossain about commercial use is deferred until publication. Unchanged.
- **Recorded advice:** `research/Path_to_Sale_Action_Plan.md` says "Do not wait until publications are out. Start now", with private, exploratory conversations and no pitch (Stage 1). IP_SALE_TRACKER section 3 (2026-08-13) withdrew every gate on buyer conversations.
- **No recorded decision** holds private buyer conversations until publication. If the owner made one outside the record, it governs, and it should be written down.

**Corrected R4:** keep the public site as a research programme, per the 2026-08-15 decision. Do the preparation work now (repository private; target list). Private, one-to-one conversations remain the recorded advice, but their timing is the owner's decision.

## R7. Pointer, 2026-10-02 (full redo of the recommendations)

The sales and licensing recommendations were redone after the owner supplied six revised estate documents. The current controlling text is `research/JRS_SALES_AND_LICENSING_ASSESSMENT_2026-10-02.md`, Revision 2. It supersedes R2 to R4 and R6 of this audit only where they conflict. The material changes:

- The *AI and Ethics* rejection of 23 September 2026 is now accounted for (*source-reported*; not in this repository).
- A new privacy exposure was found: blocker B-020, public reviewer rosters.
- The answer to "what does a buyer get that the public cannot download" is given.
- Incumbent vendors that already market "defensible" AI documentation are treated as both substitutes and the most plausible licensees.
- A gated plan is given: private discovery, then a private paid evaluation, with stop rules.

The 2026-08-15 decision (no public paid offer) is unchanged. This audit's earlier text is kept as written.
