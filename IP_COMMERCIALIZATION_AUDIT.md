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

## 1. Asset index, and where each one lives

| # | Asset | Location on disk | Public surface today |
|---|---|---|---|
| 1 | **The seven AI failure modes** | `research/JRS_Validation_Report.md` §4 | **ZERO public pages** |
| 2 | **Cross-vendor reproducibility harness** | `api/run-study.js` | **ZERO public pages** |
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

### RANK 2: The Cross-Vendor Reproducibility Harness

| | |
|---|---|
| **Source** | `api/run-study.js` |
| **Public exposure** | **None. Zero pages mention it** |
| **Persona** | **Chief AI Officer**, **Head of AI Governance**, **Model Risk Management** |

**What it actually is, read from the file header:** a nightly automated runner that puts the same constructed records to **multiple independent AI vendors** (Anthropic, plus OpenAI and Gemini when keys are present) and **escalates a label only when two or more vendors agree.** Published result: **86.7% cross-vendor agreement on the latest nightly run**, range 82.2 to 93.3 across 37 runs on the 15-record set.

**This is a working multi-vendor agreement harness with a 37-run dated history. Almost nobody has one.**

**Urgent buyer problem.** Every AI governance function is asked the same question by its board and its auditors: *how do you know the model's judgment is stable?* Most answer with a policy document. **This answers with a dated series and a reproducibility figure that a third party can re-run.** ISO/IEC 42001 and internal model-risk standards both ask for evidence of consistent behaviour over time, and a nightly cross-vendor series is exactly that evidence.

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

**What it is, verified live:** a **24-record detection set** with a **held-out answer key fixed and independently verified 24 of 24 by raters blind to it**, graded by **36 completers across 16 countries and 5 continents**, with measured inter-rater reliability (**Gwet's AC1 0.739 experts, 0.624 trained**) and a detection result of **83.9% across 16 independent experts and 384 graded reads, 95% CI 72.7 to 95.1**.

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
| "Complete the reviewer evaluation" | Asks 4 minutes before giving anything. **1 open, 0 submissions** | The Seven-Point Check, value first |
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

The strongest evidence that Rank 1 is right is negative: **the current offers have been live for weeks and produced 1 evaluation open and 0 submissions.** The asset that has never been shown is the one with a name for the buyer's problem.

`[REQUIRES USER INPUT]`: pricing for Ranks 2 and 3, and whether to build a payment path at all.

---

## 7. Provenance

Asset index built by grep across 45 public HTML files, 36 API endpoints and the `research/` directory. Failure-mode text quoted verbatim from `research/JRS_Validation_Report.md` §4. Panel figures read live from `/api/panel-stats` on 2026-08-13: 36 completers, 16 countries, 5 continents, 58 reviewers, 48 registered, 16 detection completers across 11 countries, 20 comparison completers, 25 reliability raters. Traction figures read live from `/api/asset-stats`. Reproducibility figure read from `research.html`. **No figure in this document was carried forward from an earlier note.**
