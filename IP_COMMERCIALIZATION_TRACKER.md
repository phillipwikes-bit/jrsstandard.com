# IP COMMERCIALIZATION TRACKER

**The standing record of turning JRS assets into offers. Revised every turn that touches packaging, pricing, publishing an asset, or a buyer-facing surface.**

Companion to `IP_COMMERCIALIZATION_AUDIT.md`, which holds the analysis. **This file holds the state.** Where the two disagree, this file is newer.

| | |
|---|---|
| **Created** | 2026-08-13 |
| **Last revised** | 2026-08-13 (rev 3) |
| **Revisions** | 3 |
| **Packages defined** | 3 |
| **Packages built** | **0** |
| **Packages published** | **0** |
| **Revenue** | **$0.** No payment mechanism exists on the site |

**Relationship to the other trackers.** `research/IP_SALE_TRACKER.md` tracks selling the whole asset to one buyer. **This tracks selling pieces of it to many.** They are different motions and they must not be merged: the sale has a guardrail against any public "for sale" signal, and everything here is deliberately public. `MASTER_TRACKER.md` remains the per-run engineering log.

---

## 1. STATUS AT A GLANCE

| # | Package | Built | Published | Shown to anyone | Revenue |
|---|---|---|---|---|---|
| 1 | Seven-Point Record Defensibility Check | **No** | No | No | $0 |
| 2 | Model-Agreement Evidence Pack | **No** | No | No | $0 |
| 3 | Benchmark Access and Calibration | **No** | No | No | $0 |

**Nothing has been built yet. This tracker starts at zero on purpose**, so the first entry that changes is a real change and not a restatement.

---

## 2. THE THREE PACKAGES

### Rank 1: Seven-Point Record Defensibility Check

| Field | Value |
|---|---|
| **Source** | `research/JRS_Validation_Report.md` section 4 |
| **Public surface today** | **0 of 45 public HTML pages name a single failure mode** |
| **Persona** | General Counsel, Head of Employee Relations and Investigations |
| **Format** | Diagnostic blueprint. One page, no registration, nothing sent anywhere |
| **Speed** | **Days.** The content is written; the work is extraction and one page |
| **Price** | **Free.** It is the door opener and stays ungated |
| **Blocked on** | Nothing. **This is the only package with no dependency** |
| **State** | **NOT STARTED** |

**Definition of done:** one public page naming all seven modes, each with its detection question and its giveaway sentence pattern, no email gate, no download gate, reachable in one click from the home page.

### Rank 2: Model-Agreement Evidence Pack

| Field | Value |
|---|---|
| **Source** | `api/run-study.js` |
| **Public surface today** | **0 pages mention the harness** |
| **Persona** | Chief AI Officer, Head of AI Governance, Model Risk Management |
| **Format** | Turnkey governance kit: harness design, escalation rule, run schedule, reporting format |
| **Evidence it carries** | 86.7% cross-vendor agreement on the latest nightly run, range 82.2 to 93.3 across 37 runs on the 15-record set |
| **Speed** | **Weeks.** The engineering runs; the work is documenting it as a transferable design |
| **Price** | **$500 to $1,000**, set by the owner 2026-08-13 |
| **Blocked on** | A payment mechanism. Scoping is by email until one exists |
| **State** | **NOT STARTED** |

### Rank 3: Benchmark Access and Calibration

| Field | Value |
|---|---|
| **Source** | `api/bench-admin.js`; `bench_records`, `bench_labels`, `bench_outcomes` |
| **Public surface today** | Named on the prospectus, **never offered to anyone** |
| **Persona** | AI assurance vendors, model evaluation teams, audit firms building an AI practice |
| **Format** | Executive retainer / advisory entry point. Licensed access, **key held back, scoring returned by the holder** |
| **Evidence it carries** | 24-record detection set, key verified 24 of 24 by blind raters, 36 completers across 16 countries and 5 continents, Gwet's AC1 0.739 experts and 0.624 trained, detection 83.9% across 16 experts and 384 graded reads, 95% CI 72.7 to 95.1 |
| **Speed** | **Months.** Needs a licence term, a scoring workflow and a price |
| **Price** | **$750 to $1,500**, set by the owner 2026-08-13 |
| **Blocked on** | Licence terms, scoring workflow, payment mechanism |
| **State** | **NOT STARTED. Highest ceiling of the three** |

---

## 3. WHAT THE FUNNEL ACTUALLY MEASURED

Read live from production on 2026-08-13, after per-CTA click attribution went in the same day.

| Stage | All-time |
|---|---|
| Reached the reviewer landing page | **7** |
| Clicked "Take the 4-minute reviewer evaluation" | **1**, from India |
| Opened the instrument | **1** |
| **Submitted** | **0** |
| Answered all nine | **0** |
| Left contact details | **0** |

**The refusal is at the door: 6 of 7 never clicked.** That rules out the comfortable explanation that the instrument is too long or badly written, and it is why all three packages are door-level fixes rather than form redesigns.

**Held honestly:** logging began 2026-08-11, so 7 is a floor and not a total, and 1 click is one person. **A direction, not a rate. Never quote it as a conversion figure.**

Verified three ways before being recorded here: the writer's source string is unchanged across every commit of `api/reviewer-eval.js`; synthetic rows through the live reader count correctly with breakdowns releasing at the pre-registered n=30; and a live check-mode POST of all nine answers returns 200 with `answered: 9, total: 9`.

---

## 3b. THE OPPORTUNITY SCOUT (rev 2)

`scripts/scout_opportunities.py`, with its assertion suite at `scripts/test_scout_opportunities.py`.

**What it is not.** It does not log into Upwork, scrape any marketplace, or fetch listings from anywhere. **Automated scraping of Upwork breaches their terms of service, needs credentials this repository does not hold, and a script that pretended to do it would be fabricating its own inputs.** That was a deliberate build decision, recorded here so it is not mistaken for an omission.

**What it does.** You paste the postings you are already reading into a JSON file. The script scores each one against what JRS can actually evidence, routes it to one of the three packages, applies the binding guardrails as hard disqualifiers, and writes a proposal opening built only from figures read live from `/api/panel-stats`.

| Capability | Detail |
|---|---|
| Signal scoring | 11 weighted signals, **every weight visible in the source** so a score can be argued with |
| Package routing | Highest-weighted package with at least one package-specific hit. Generic signals never decide it |
| Guardrail disqualifiers | 4 hard blocks: asking for the answer key or scoring internals, requiring a proven-effectiveness claim, asking for identifiable case material, ghostwriting or white-labelling the research |
| Blocked beats scored | A posting that trips a guardrail is **DO NOT BID regardless of score**, and the reason is printed rather than the posting silently dropped |
| Proposal opening | Three sentences per package, evidence figures pulled live. **If the endpoint is unreachable the cached figures are labelled in the output**, so a stale number cannot be sent by accident |
| Output modes | text, `--json`, `--markdown` for pasting into this tracker |
| Dependencies | **stdlib only.** No packages, no keys, no network required for scoring |

**Run it:**

```
python3 scripts/scout_opportunities.py postings.json
python3 scripts/scout_opportunities.py postings.json --markdown   # paste result into section 3c
python3 scripts/test_scout_opportunities.py                       # 17 assertions
```

**What it does not tell you.** It ranks reading time. **It is a keyword heuristic over text you supplied, it does not predict who will hire anyone, and it measures no demand.** The honest position in section 7 is unchanged by its existence.

---

## 3c. SCOUT RUN LOG

| Date | Postings scored | Qualified | Blocked | Bids sent | Replies |
|---|---|---|---|---|---|
| | | | | | |

**No real postings have been scored yet.** The row above is deliberately empty: the only run so far was the six-posting synthetic fixture in the assertion suite, which is test data and is not recorded as pipeline activity.

---

## 3d. OPERATIONAL ASSETS (rev 3)

Built 2026-08-13. **These are the things that had to exist before a single offer could be made.**

| Asset | Path | State |
|---|---|---|
| Offer 1 intake | `audit-request.html` | **LIVE.** $250 to $500 |
| Offer 2 intake | `governance-request.html` | **LIVE.** $500 to $1,000 |
| Offer 3 intake | `calibration-request.html` | **LIVE.** $750 to $1,500 |
| Proposal scripts | `UPWORK_PROPOSAL_TEMPLATES.md` | Written, **0 sent** |
| Deliverable template | `templates/DIAGNOSTIC_REPORT_TEMPLATE.md` | Written, **0 used** |
| Launch posts | `LINKEDIN_LAUNCH_POSTS.md` | Written, **0 posted** |

**The Data Isolation Guarantee** appears on all three intake pages, generated from one string so the wording cannot drift between them, and verified identical after generation.

**It is true because of what the pages do not contain.** There is no form and no file input anywhere on them. Nothing on those pages could store a record even by accident. Scope is agreed by email before anything is sent.

**Prices are now set.** Open items 2 and 4 of section 6 close on the offer pricing; the payment mechanism is still absent, which is the standing blocker.

**Nothing has been sent, used or posted.** That is the honest state, and the first entry that changes it will be a real change.

---

## 4. LIVE BASELINE, THE NUMBERS EVERY PACKAGE INHERITS

Read from `/api/panel-stats` and `/api/asset-stats` on 2026-08-13. **Anything published under these packages must reconcile to this table.**

| Figure | Value |
|---|---|
| Completers of a full 24-record set | **36** |
| Countries | **16** (belongs to the 36 completers, **never** to the 58 reviewers) |
| Continents | 5 |
| Reviewers total | 58 |
| Registered | 48 |
| Detection panel | 16 completers across 11 countries |
| Comparison panel | 20 completers |
| Reliability raters | 25 |
| Organization pilots | **0** |
| Revenue | **$0** |

---

## 5. GUARDRAILS, BINDING ON EVERY PACKAGE

Carried unchanged from `research/IP_Sale_Playbook.md` and `research/IP_Asset_Transfer_Map.md`.

1. **The gold answer key and the five-condition scoring never enter a data room or a deliverable.** Rank 3 exists only because of this.
2. **NDA before specifics.**
3. **Protect the blind.** Nothing published reveals the Arm B method or the arm split.
4. **Hold every claim to the completer sample** and the pre-registered figures.
5. **No proven-effectiveness claim.** JRS is in operational validation and every package says so.
6. **No "for sale" signal** on the public site or LinkedIn. These packages are offers, not an asset listing, and the distinction has to survive contact with the copy.
7. **Nothing published names a reviewer** while the comparison study is blind.

---

## 6. OPEN ITEMS

| # | Item | Owner | State |
|---|---|---|---|
| 1 | Build Rank 1 as a public page | Phillip to approve, then buildable in a day | **NOT STARTED. Nothing blocks it** |
| 2 | Pricing for Ranks 2 and 3 | Phillip | **`[REQUIRES USER INPUT]`** |
| 3 | Whether to build a payment path at all | Phillip | **`[REQUIRES USER INPUT]`.** Until this exists, nothing here can be sold |
| 4 | Licence terms for Rank 3 | Phillip, likely with an attorney | Not started |
| 8 | **Score a first batch of real postings** through `scripts/scout_opportunities.py` | Phillip supplies the postings | **NOT STARTED.** The engine is built and tested; it has no real input yet |
| 9 | Whether freelance marketplace work is a channel worth his time at all | Phillip | Undecided. The scout makes it cheap to test, it does not argue that he should |
| 5 | Scoring workflow for Rank 3 | unassigned | Not started |
| 6 | Partial-progress telemetry on the evaluation | Phillip | **Flagged, deliberately not built.** It is a consent-surface decision on a research instrument, not a defect |
| 7 | Whether any package replaces the current CTAs or sits beside them | Phillip | Undecided |

---

## 7. HONEST POSITION

**This tracker records packaging, not demand.** Every channel tested to date has returned close to zero: three federal training organisations silent, organization pilots at zero for the programme's life, no completed evaluations, $0 revenue. **Repackaging improves the offer. It does not prove anyone will buy it.**

The case for doing it anyway is narrow and it is the honest one: **the two strongest assets have never been shown to anyone.** A channel that has never been tried has not failed. That is the only claim being made here.

---

## 8. REVISION LOG

| # | Date | Change |
|---|---|---|
| 3 | 2026-08-13 | **Operational assets built**, new section 3d: three offer intake pages live with a Data Isolation Guarantee generated from one source, three Upwork proposal scripts, a four-section diagnostic report template, and five LinkedIn launch posts. **Prices set by the owner**: Offer 1 free at the door, Offer 2 $500 to $1,000, Offer 3 $750 to $1,500. The guarantee is true because the pages carry no form and no file input at all. **Nothing sent, used or posted yet, and no package has moved off NOT STARTED.** Payment mechanism remains the standing blocker. |
| 2 | 2026-08-13 | **Opportunity scout built**, `scripts/scout_opportunities.py` plus a 17-assertion suite, new sections 3b and 3c. Scores supplied postings against the asset inventory, routes them to one of the three packages, and hard-blocks anything that trips a guardrail. **Deliberately does not scrape Upwork:** that breaches their terms, needs credentials this repository does not hold, and a script that faked it would fabricate its own inputs. Two new open items: no real postings scored yet, and whether the channel is worth his time at all remains undecided. **No package moved off NOT STARTED.** |
| 1 | 2026-08-13 | Created, at the owner's instruction, alongside revision 2 of `IP_COMMERCIALIZATION_AUDIT.md`. Records all three packages at **NOT STARTED**, the live baseline every package must reconcile to, the seven binding guardrails, and seven open items of which two are the pricing and payment decisions that block Ranks 2 and 3. Integrates the funnel measurement of the same day: **the refusal is at the door, 6 of 7 never clicked**, which rules out an instrument-level explanation and supports the ranking that was already set before the measurement existed. |
