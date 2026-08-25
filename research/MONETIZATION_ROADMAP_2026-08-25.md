# Monetization Roadmap

**Date:** 2026-08-25
**Scope:** revenue readiness, monetization bottlenecks, and the fastest safe path to a first
payment.
**Method:** live repository plus live `interaction_events` telemetry. Every figure below is a
query result or a file and line reference, not an estimate.

---

## CORRECTION TO MY OWN PRIOR REPORTING, STATED FIRST

The feasibility audit filed yesterday (`research/COMMERCIAL_PLAN_FEASIBILITY_AUDIT_2026-08-24.md`)
said **two** buyers had reached the pay screen and been turned away. That number was carried
forward from an older figure and was never re-queried.

**The live count is 13.**

Every one of the 13 is in `state: unconfigured`. **Not one has ever been redirected to a
payment page, because no payment page exists.**

| Date | Offer | Price | Source page | Country |
|---|---|---|---|---|
| 2026-08-14 | calibration | $750 | calibration-request | US |
| 2026-08-14 | audit | $250 | audit-request | US |
| 2026-08-14 | governance | $500 | governance-request | US |
| 2026-08-14 | governance | $500 | governance-request | DE |
| 2026-08-15 | audit | $250 | audit-request | FR |
| 2026-08-15 | calibration | $750 | calibration-request | DE |
| 2026-08-15 | governance | $500 | governance-request | DE |
| 2026-08-17 | audit | $250 | audit-request | US |
| 2026-08-17 | calibration | $750 | calibration-request | US |
| 2026-08-18 | governance | $500 | governance-request | US |
| 2026-08-21 | audit | $250 | audit-request | GB |
| 2026-08-21 | governance | $500 | governance-request | GB |
| 2026-08-21 | calibration | $750 | calibration-request | GB |

**Stated intent value: $6,500.** Governance 5, calibration 4, audit 4. Countries: US 6, DE 3,
GB 3, FR 1. Activity spans **eight days**, 14 to 21 August.

**Read the 21 August row group carefully.** All three offers, same country, same day. That is
the signature of one organisation pricing the entire ladder in a single sitting, which is what
an enterprise evaluator does before opening an internal budget request. That is the single
most valuable event in the dataset and nobody followed up, because nothing captured a name.

This correction matters more than any recommendation in this document. The problem is not that
the site cannot attract buyers. **The site has already attracted buyers, in four countries,
repeatedly, and turned every one of them away.**

---

## 1. Commercial readiness score

**7 / 10.**

Everything needed to take money is built and tested except the payment link itself, which
cannot be created from inside this repository and takes about fifteen minutes to create
outside it.

The score is not higher because 13 documented buyers have already been lost, and because the
current failure mode captures no contact detail, so those 13 cannot be recovered.

---

## 2. Assets and infrastructure already built

**Pricing, as a single source of truth.**
`api/_offer-config.js:20-44` declares three offers with name, slug, price, price label and
scope: audit $250, governance $500, calibration $750. `FREE_TIER` at `:47-53` declares the
ungated Seven-Point Check at `/check.html`. `offerFor()` at `:59-61` and `isConfigured()` at
`:63-66` are the only gates any surface needs. A price exists in exactly one place, which is
the property that makes a price change safe.

**Checkout routing that fails safe.**
`api/checkout.js` resolves `?o=<offer>`, sanitises the key, honours a `src` attribution tag,
filters prefetches through `isNotAClick()`, and either redirects to the configured URL or
serves a scoping-and-invoice page. It never invents a destination. The comment at
`api/_offer-config.js:9-18` explains why, and the reasoning is correct: a guessed payment URL
is "at worst money sent somewhere unintended."

**Purchase-intent telemetry, already writing.**
Every click lands in `interaction_events` as `source='checkout-click'` with offer, state,
source tag, country and user agent. This is why the 13 lost buyers are known at all. Owner
check tags (`owner`, `verify`, `test`, `selftest`, `deploytest`) are filtered out, so the 13
are real.

**PDF artifact delivery, complete.**
`api/dl.js` serves the alias map including `JRS-Reference-9d4f2a7c.pdf` (2,308,034 bytes),
labelled for analytics at `api/geo-stats.js:24` and linked from `training.html:1755`, `:1797`
and the kit table at `:2983-3020`. Ten PDFs are committed and served as static assets.

**Demand telemetry showing what people actually want.** Exact counts from
`interaction_events`, total 1,238 rows:

| Signal | Count | What it is |
|---|---|---|
| `pdf-dl` | 245 | reference and paper downloads |
| `kit-dl` | 195 | training kit downloads |
| `gate-view` | 145 | campaign screen arrivals |
| `support` | 112 | endorsement actions |
| `guide-dl` | 105 | investigator field guide |
| `checkout-click` | **13** | **purchase attempts, all lost** |

**Three dedicated intake pages already live**: `audit-request.html`,
`governance-request.html`, `calibration-request.html`, each carrying invoice and
purchase-order language.

**A scoring engine that is already a licensable product.**
`api/bench-score.js:3-14` scores a licensee's determinations against a held-out key and
returns an aggregate calibration report while withholding the key, per-record correctness and
the scoring logic. That containment is what makes it sellable more than once. This is the
$750 calibration offer and it is built.

**Legal and compliance surface already written.**
`terms.html`, `engagement.html`, `enterprise.html` and `check.html` carry the
non-establishment clauses. Nothing in this roadmap requires touching them.

---

## 3. Immediate revenue blockers

**Blocker 1. No payment link exists. This is the only true blocker.**
Every `checkout_url` in `api/_offer-config.js` is an empty string. `isConfigured()` returns
false, so `api/checkout.js` takes the invoice branch every time. Fifteen minutes in a payment
dashboard plus one file edit clears it. No code change is required.

**Blocker 2. The failure path captures no contact detail, so lost buyers stay lost.**
The unconfigured branch of `api/checkout.js` renders a static page asking the reader to email
`info@jrsstandard.com`. If they do not email, they are gone. **All 13 were lost this way, and
none can be recovered because no name, email or organisation was ever captured.** This is a
larger practical loss than blocker 1, because blocker 1 stops future revenue while blocker 2
has already destroyed thirteen contacts.

**Blocker 3. The 4 August to 21 August cluster is going cold.**
The most recent purchase attempt is four days old. The GB three-offer cluster is four days
old. Enterprise evaluation windows close.

**Blocker 4. No legal entity, which blocks invoicing at enterprise scale but not at all.**
`SURGICAL_REMEDIATION_PROMPT.md:68` prohibits naming an entity type unless one has been
formed. A sole-trader invoice is accepted by small buyers and by most professional-services
purchases at these price points. It is rejected by large institutional accounts payable. This
blocks the $750 calibration tier with a corporate buyer far more than it blocks the $250 audit.

**Not a blocker, despite appearances.** The compliance disclaimers do not obstruct any of this.
Nothing in the roadmap below adds a framework claim, a certification claim or an accreditation
claim.

---

## 4. What the detection study result may and may not be used for commercially

The preliminary summary supplied reports **83.9% accuracy, 95% CI 72.7% to 95.1%**, across
**384 graded reads**, 16 reviewers, 11 countries, 24 records, reviewer range 37.5% to 100%,
SD 21.0 points, every record correctly classified by at least 10 of 16.

**This is a genuine commercial asset and it is also the easiest place on this site to create a
claim that cannot be defended.** The summary's own boundary list is the constraint:

**Usable in commercial copy, as written:**
- The operationalized DRR distinction was **detectable** by independent reviewers blind to the
  reference classification.
- 16 independent experts, 11 countries, five continents, 384 graded reads.
- 83.9% detection accuracy on a constructed corpus, stated as **preliminary**.

**Must never appear in commercial copy:**
- That JRS is validated, or that validation is complete.
- That JRS improves reviewer accuracy, or outperforms unaided professional judgment. **The
  study had no comparison arm for this claim.**
- Criterion validity, psychometric validation, or generalisation to real-world records.

**Two specific traps.** First, the reviewer range **37.5% to 100%** with SD 21.0 must travel
with the 83.9% wherever a technical buyer will see it, because a buyer who finds the spread
later reads the headline as concealment. Second, the corpus was **constructed and
de-identified**, not real-world; saying or implying otherwise is the exact failure mode the
programme measures in other organisations' records.

The safe commercial framing is the narrow one: **independent experts in 11 countries could see
the distinction from the records alone.** That sentence sells the calibration tier without
touching a single prohibited claim.

---

## 5. Step-by-step monetization roadmap

### Phase 1. Today. Stop the leak. Roughly one hour.

1. **Create three payment links** in the payment provider dashboard: $250 audit, $500
   governance, $750 calibration. Use the exact names from `api/_offer-config.js:22`, `:29`,
   `:36` so the receipt matches the site.
2. **Paste the three URLs** into the `checkout_url` fields at `api/_offer-config.js:26`,
   `:33`, `:40`. Deploy. `isConfigured()` flips to true and `api/checkout.js` starts
   redirecting. **No other file changes.**
3. **Verify with the owner bypass tag**, `/api/checkout?o=audit&src=selftest`. `CHECK_TAGS`
   in `api/checkout.js` filters that tag, so the test does not pollute the purchase record.

### Phase 2. This week. Recover the 13, and never lose another.

4. **Replace the static unconfigured page with a capture form.** Even after Phase 1, keep the
   fallback branch and give it name, email, organisation and record volume, posting to
   `pilot_contacts` with a new source, `checkout-fallback`. A buyer who will not pay by card
   is still a buyer. **This is the change that would have saved all 13.**
5. **Add a post-purchase intake step.** A payment link alone gives you money and an email
   address but no scope. Set the link's confirmation redirect to the matching request page so
   the buyer lands on `audit-request.html`, `governance-request.html` or
   `calibration-request.html` and states record type and volume immediately.
6. **Work the GB cluster now.** Three offers, one country, 21 August. No contact was captured,
   so the only recovery route is inbound. Make sure the three request pages are the strongest
   pages on the site this week.

### Phase 3. Next two weeks. Raise revenue per visitor.

7. **Instrument the free-to-paid gap.** `FREE_TIER` at `api/_offer-config.js:47-53` is ungated
   and `pdf-dl` shows 245 downloads against 13 purchase attempts. Add a `src` tag to every
   checkout link placed on `/check.html` and on the PDF confirmation paths so the funnel from
   free artifact to paid engagement becomes measurable. `api/checkout.js` already records the
   tag; nothing new is needed server-side.
8. **Put the detection result on the calibration page only, inside its boundary.** The $750
   calibration tier is the offer the evidence actually supports, because
   `api/bench-score.js` is the thing the study measured. Use the narrow framing from section 4,
   carry the reviewer range with the headline, and label it preliminary.
9. **Add a guard to `scripts/check_zero_drift.py`** that fails if any price literal appears in
   an HTML file, and fails if the words "validated", "improves accuracy" or "criterion
   validity" appear next to a JRS claim on any commercial page. Make both structural rather
   than dependent on memory.

### Phase 4. When volume justifies it.

10. **Form the entity**, then add the proforma or vendor-quote path. Until then, invoice by
    email; three of the 13 were German and one French, and EU institutional buyers will ask
    for a VAT identifier before they ask for anything else.
11. **Only then consider repricing.** The tiers proposed in yesterday's board plan
    ($195 / $495 / $1,995 / $7,500) do not exist in this codebase. Repricing before any
    transaction has ever completed means changing a number that has never been tested against
    a real buyer. **Sell three engagements at the current prices first, then reprice against
    evidence.**

---

## 6. The one-sentence version

The site does not have a demand problem or a compliance problem. It has thirteen documented
buyers in four countries who reached the pay screen and found no way to pay, and the fix is
three payment links and a capture form on the fallback page.

---

## 7. Evidence index

| Claim | Anchor |
|---|---|
| Three offers at $250 / $500 / $750 | `api/_offer-config.js:20-44` |
| Free tier ungated | `api/_offer-config.js:47-53` |
| Configured-URL guard | `api/_offer-config.js:63-66` |
| Empty checkout URLs, and why | `api/_offer-config.js:9-18`, `:26`, `:33`, `:40` |
| Fail-safe checkout, src tag, prefetch guard | `api/checkout.js` |
| Owner bypass tags | `api/checkout.js` `CHECK_TAGS` |
| 13 checkout clicks, all unconfigured, $6,500 | `interaction_events`, source=checkout-click |
| 1,238 total interaction events | `interaction_events` exact count |
| 245 pdf-dl / 195 kit-dl / 145 gate-view / 112 support / 105 guide-dl | `interaction_events` exact counts |
| PDF alias map | `api/dl.js:44` |
| PDF analytics label | `api/geo-stats.js:24` |
| PDF links on training | `training.html:1755`, `:1797`, `:2983-3020` |
| Bench scorer withholds key and per-record results | `api/bench-score.js:3-14` |
| Entity-type prohibition | `SURGICAL_REMEDIATION_PROMPT.md:68` |
| Compliance non-establishment clauses | `terms.html:139`, `engagement.html:176`, `enterprise.html:295`, `check.html:186` |
