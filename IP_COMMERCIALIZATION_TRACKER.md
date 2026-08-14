# IP COMMERCIALIZATION TRACKER

**The standing record of turning JRS assets into offers. Revised every turn that touches packaging, pricing, publishing an asset, or a buyer-facing surface.**

Companion to `IP_COMMERCIALIZATION_AUDIT.md`, which holds the analysis. **This file holds the state.** Where the two disagree, this file is newer.

| | |
|---|---|
| **Created** | 2026-08-13 |
| **Last revised** | 2026-08-14 (rev 6) |
| **Revisions** | 6 |
| **Packages defined** | 3 |
| **Packages built** | **0** |
| **Packages published** | **0** |
| **Revenue** | **$0.** No payment mechanism exists on the site |

**Relationship to the other trackers.** `research/IP_SALE_TRACKER.md` tracks selling the whole asset to one buyer. **This tracks selling pieces of it to many.** They are different motions and they must not be merged: the sale has a guardrail against any public "for sale" signal, and everything here is deliberately public. `MASTER_TRACKER.md` remains the per-run engineering log.

---

## 1. STATUS AT A GLANCE

| # | Package | Built | Published | Shown to anyone | Revenue |
|---|---|---|---|---|---|
| 1 | Seven-Point Check (free) + 5-record audit, **$250** | **Yes** | **LIVE** | No | $0 |
| 2 | Governance Documentation Review, **$500** | **Yes** | **LIVE** | No | $0 |
| 3 | Benchmark Access and Calibration, **$750** | **Yes** | **LIVE** | No | $0 |

**LIVE means the offer page, price and buy path are on the site and reachable.** It does not mean anyone has bought one. **Revenue is $0 and no offer has been shown to a named buyer.**

**One thing stands between LIVE and sellable: the three checkout URLs.** `api/_offer-config.js` holds an empty `checkout_url` per offer. Paste the real payment links and deploy; nothing else changes.

**Built and live as of 2026-08-13.** The tracker started at zero deliberately; this is the first entry that moved, and it moved because code was written and deployed, not because intent changed.

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

## 3e. PAYMENT PATH (rev 4)

| | |
|---|---|
| **Prices** | $250 / $500 / $750, declared once in `api/_offer-config.js` |
| **Buy path** | `/api/checkout?o=<offer>` from each intake page |
| **Checkout URLs** | **`[REQUIRES USER INPUT]`. Empty on purpose** |
| **Behaviour today** | 503 with the price and an invoice-by-email path. **No Location header, no guessed destination** |
| **Telemetry** | `checkout-click`, state `redirected` or `unconfigured`, read by `/api/asset-stats`, shown on the dashboard |

**Why the URLs are empty rather than filled with something plausible.** A Stripe Payment Link or Lemon Squeezy checkout can only be created inside the owner's own payment account. Nothing in this repository can mint one. **A realistic-looking URL written here would be a fabricated payment destination**: a dead link shown to a paying customer at best, money sent somewhere unintended at worst.

**The `unconfigured` counter is the number to watch.** A non-zero value means somebody tried to pay and could not.

### Going live

1. Create one payment link per offer in the provider dashboard: $250, $500, $750.
2. Paste each into `checkout_url` in `api/_offer-config.js`.
3. Deploy. `/api/checkout` starts redirecting the moment a valid https URL is present.

---

## 3f. BENCHMARK SCORING (rev 4)

`api/bench-score.js`. A licensee POSTs determinations and receives **aggregate calibration only**: agreement with the key, chance-corrected AC1, their own distribution, and the detection-panel figures read live.

**It never returns the key, per-record results, or the condition logic**, by construction rather than by filtering the response at the end. Per-record feedback across a few runs is exactly how a licensee would reconstruct the key.

**It returns 503 `key_not_provisioned` today, and that is correct.** The detection key is in `research/`, which is deliberately not deployed. The endpoint **refuses to fall back** to `bench_gold` (three synthetic placeholder rows, anon-readable) or `bench_outcomes` (the Rung 3 real-case outcome table). Either would produce a confident, meaningless number.

**To provision:** set `BENCH_KEY_JSON` and `BENCH_SCORE_TOKENS` in the server environment. `[REQUIRES USER INPUT]`

---

## 3g. COMPLETER INCENTIVE: FROM FREE GRANT TO AWARD PLUS PAID CONVERSION (rev 5)

**The outreach was giving the product away to the people most likely to buy it.**

Every one of the 36 completers was offered, on confirmation and at no charge:

- a Founding Auditor and Commercial Practice License
- Commercial Practice Rights, to use the rubrics and field guides in their own client work
- an Institutional Enterprise Grant, a 12-month organizational deployment licence

**That is a blanket giveaway of the only thing being sold, to the largest single group of qualified buyers this programme has.** Thirty-six governance and compliance professionals in 16 countries is precisely the customer list.

### What confirming unlocks now

| | |
|---|---|
| **Appointed Expert Award Citation** | Issued in their name |
| **Official Panelist Registry ID** | A verifiable reference |
| **Anything else** | **Nothing.** No licence, and the message says so plainly |

**The message states the boundary rather than leaving it to be discovered**, then routes anyone who wants to use JRS in practice to the three paid tiers, with the free seven-point check named as the way to evaluate the method first.

### Prices are read, never restated

The three tiers now appear in 36 messages. **They are parsed from `api/_offer-config.js` at generation time.** Three prices copied into 36 files is the worst possible place for a second copy of a fact.

### Honors completed

`RR-113`, `RR-117` and `RR-127` finished after the honor roster was built on 2026-08-09 and were the only completers without one. Added as **H-2026-35 to 37**, verified live. **All 36 completers now hold an Honor.**

### Guarding the pivot

Two assertions were added so the grant language cannot creep back and a price cannot drift:

| Injection | Result |
|---|---|
| Reintroduce an Institutional Enterprise Grant | **caught in all 36 files** |
| Change a price in the config only | **caught in all 36 files** |

---

## 3h. COMMERCIAL PACKAGING STATUS, VERIFIED 2026-08-14 (rev 6)

**All four directives verified against disk and production rather than re-run.** Nothing needed repair.

| Directive | Evidence |
|---|---|
| Completer pivot enforced | **0 files** carry any of the six free-grant phrases outside the trackers that record their removal and the test that guards against their return. **36 of 36** messages carry the Award Citation and the Registry ID |
| Batch payloads regenerated | 36 files, 16 Arm A + 20 Arm B, **0 missing keys**, all 36 carry the deadline. Honors span **H-2026-02 to H-2026-37** with **no completer left without one** |
| Monetization paths intact | Live: `audit` 503 fail-safe / `$250`, `governance` 503 / `$500`, `calibration` 503 / `$750`, unknown offer 404, **zero Location headers on an unconfigured offer** |
| System integrity | **69 assertions across 5 suites, all passing.** Guard 12 of 12. **0 of 11** prohibited claims across every HTML, JS and JSON file |

**Regeneration produced no diff**, which is the property that matters: the generator is deterministic from its sources, so running it again cannot quietly change what 36 people are sent.

### Security constraints re-confirmed

| | |
|---|---|
| `/api/bench-score` without a licence | **503 `licensing_not_provisioned`** |
| Key, per-record results or condition logic in any response | **none**, by construction |
| Routes storing submitted record text | **zero.** Every remaining mention is a comment recording the removal |
| `/api/checkout` on an unconfigured offer | **503 with the price and an invoice path. No redirect, no guessed destination** |

### Adversarial validation

`OFFER_TOTAL_LEGACY = 3` injected into `api/checkout.js`: **caught, exit 1**. Reverted: **8 of 8, exit 0**. Hook runs in **0.19s**.

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
| 6 | 2026-08-14 | **Commercial packaging verified active, not re-run.** All four directives checked against disk and production: 0 free-grant phrases in any sendable or live surface, 36 of 36 messages carrying the Award Citation and Registry ID, honors spanning H-2026-02 to H-2026-37 with every completer covered, all three paid tiers routing correctly with a 503 fail-safe and no Location header, and 69 assertions across 5 suites passing with 0 of 11 prohibited claims repo-wide. Regeneration produced no diff, confirming the generator is deterministic. New section 3h. |
| 5 | 2026-08-14 | **Free promotional grants eliminated.** The outreach had offered all 36 completers a Founding Auditor and Commercial Practice License, Commercial Practice Rights and a 12-month Institutional Enterprise Grant at no charge, which gives the product away to the largest group of qualified buyers the programme has. Confirming now unlocks the Appointed Expert Award Citation and Official Panelist Registry ID only, the message states that boundary plainly, and anyone wanting practice use is routed to the $250 / $500 / $750 tiers. Prices parsed from `api/_offer-config.js`, never restated. Honors completed at H-2026-35 to 37 so all 36 completers hold one. New section 3g. Two regression assertions added and adversarially confirmed. |
| 4 | 2026-08-13 | **Packages moved to LIVE.** Prices fixed at $250 / $500 / $750 from one config; buy path, checkout telemetry and benchmark scoring endpoint written and deployed. New sections 3e and 3f. **Checkout URLs deliberately left empty**: they can only be minted in the owner's payment account, and a plausible-looking one would be a fabricated payment destination, so `/api/checkout` fails safe to an invoice path instead of guessing. `bench-score` refuses to score without the real key rather than falling back to synthetic or unrelated tables. **Revenue still $0 and no offer shown to a named buyer.** |
| 3 | 2026-08-13 | **Operational assets built**, new section 3d: three offer intake pages live with a Data Isolation Guarantee generated from one source, three Upwork proposal scripts, a four-section diagnostic report template, and five LinkedIn launch posts. **Prices set by the owner**: Offer 1 free at the door, Offer 2 $500 to $1,000, Offer 3 $750 to $1,500. The guarantee is true because the pages carry no form and no file input at all. **Nothing sent, used or posted yet, and no package has moved off NOT STARTED.** Payment mechanism remains the standing blocker. |
| 2 | 2026-08-13 | **Opportunity scout built**, `scripts/scout_opportunities.py` plus a 17-assertion suite, new sections 3b and 3c. Scores supplied postings against the asset inventory, routes them to one of the three packages, and hard-blocks anything that trips a guardrail. **Deliberately does not scrape Upwork:** that breaches their terms, needs credentials this repository does not hold, and a script that faked it would fabricate its own inputs. Two new open items: no real postings scored yet, and whether the channel is worth his time at all remains undecided. **No package moved off NOT STARTED.** |
| 1 | 2026-08-13 | Created, at the owner's instruction, alongside revision 2 of `IP_COMMERCIALIZATION_AUDIT.md`. Records all three packages at **NOT STARTED**, the live baseline every package must reconcile to, the seven binding guardrails, and seven open items of which two are the pricing and payment decisions that block Ranks 2 and 3. Integrates the funnel measurement of the same day: **the refusal is at the door, 6 of 7 never clicked**, which rules out an instrument-level explanation and supports the ranking that was already set before the measurement existed. |
