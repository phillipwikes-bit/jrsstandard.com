# Enterprise Licensing: What Needs To Be Done

**Date:** 2026-08-25
**Decision taken by Phillip, recorded here:** guides and training stay **free**. This plan
assumes that permanently and does not propose gating either.
**Scope:** everything else that can be licensed commercially, what is already built, and
what is blocking it.
**Method:** live repository, live endpoint probes, live telemetry. Every claim below is a
file path, a line number, or a query result.

---

## THE ONE FINDING THAT MATTERS

**Your commercial surface is invisible, and it is invisible by accident rather than by
design.**

Three facts, each verified independently:

**1. The three paid offer pages have zero inbound links from anywhere on the site.**
`audit-request.html`, `governance-request.html` and `calibration-request.html` are linked
from **no** page. Not from `index.html`, not from `enterprise.html`, not from the footer.

**2. They are also absent from `sitemap.xml`.** So is `engagement.html` and so is
`terms.html`. Search engines are not being told the commercial pages exist.

**3. Thirteen people found them anyway and clicked through to pay.** Every one of the 13
`checkout-click` rows in `interaction_events` carries a `src` of `audit-request`,
`governance-request` or `calibration-request`. **Thirteen purchase attempts, $6,500 of stated
intent, from pages that nothing links to and no search engine is told about.**

That is the whole commercial thesis in one paragraph. The demand is arriving through a door
you have not built yet.

**And the most licensable asset you own is not on the public site at all.** The JRS Review
Engine, a working token-authenticated API, is referenced only in
`acquisition-9f3c2a7d4b.html`, `vp-7c1f9a4e8d2b6035.html` and
`programme-status-9872fb93cc94.html`. All three are private or acquisition surfaces. **No
public page mentions it, links it, or documents it.**

---

## 1. What you already own that can be licensed

### The Review Engine. This is the asset.

`api/review-engine.js` (257 lines) and its mirror `api/v1/review-engine.js` (250 lines).
Probed live on 2026-08-25, both routes are deployed and behaving correctly:

```
POST https://www.jrsstandard.com/api/v1/review-engine
{"request_id":"f90a631d-...","api_version":"v1","error":"unauthorized",
 "detail":"Endpoint requires a token. Set REVIEW_API_TOKEN, or set JRS_SANDBOX_OPEN=true..."}
```

What is already built into it, without any further work:

- **Per-partner token authentication.** `REVIEW_API_TOKEN` accepts a comma-separated list, so
  each licensee gets their own token and can be revoked individually.
- **Fail-closed by default.** No token means no access. Open mode requires an explicit
  `JRS_SANDBOX_OPEN=true`.
- **A versioned route.** `/api/v1/review-engine` is the contract a corporate integrator
  expects to see before they will build against you.
- **A `request_id` on every response**, in the body and the `X-Request-Id` header, for audit
  correlation on the partner's side. This is the single feature that makes it sellable into a
  regulated function.
- **Per-IP rate limiting**, documented in the source as best-effort rather than overstated.
- **Variance disclosure.** `runs>1` returns the spread rather than hiding it.
- **An honest stage label in the source:** "Unvalidated, single-model engine. Reproducibility
  is disclosed, not hidden; it is not accuracy and not validation."

This is a licensable product that has been finished and then left undiscoverable.

### The Benchmark and Calibration set

`api/bench-score.js:3-14` scores a licensee's determinations against a held-out key and
returns an aggregate calibration report while withholding the key, per-record correctness and
the scoring logic. **That containment is what makes it sellable more than once**, because a
licensee cannot reconstruct the key and stop paying. `api/bench-admin.js` gives you record
bank, gold key and scoring administration behind `BENCH_ADMIN_TOKEN`.

This is the $750 calibration offer and it is complete.

### The Organization Mini-Pilot

`api/org-pilot.js` (166 lines) records what happened when a real organisation ran the standard
on its own records: sector, role, country, record count, routing bands, per-condition pass and
fail counts. **It never stores record text**, by design, which is what makes it usable on
confidential or privileged material.

Its own header states the commercial point exactly: this is "the field-usage evidence the
validation program otherwise lacks, and it is the one form of evidence a buyer or an
enterprise prospect actually prices."

It is linked from five pages already: `investigator-guides.html`, `supported.html`,
`contributor.html`, `org-pilot.html`, `training.html`.

### The written legal and boundary surface

`terms.html`, `engagement.html`, `enterprise.html`, `check.html` already carry the
non-establishment clauses and the scope limits. **Nothing in this plan requires touching
them**, and their existence is worth real money in an enterprise review, because the buyer's
counsel will look for exactly this and usually does not find it.

### Pricing that cannot drift

`api/_offer-config.js:20-44` holds all three prices in one place, with
`isConfigured()` at `:63-66` gating the redirect. A price exists once in the codebase.

---

## 2. What is blocking commercial licensing right now

### Blocker 1. The Review Engine has no public existence

No public page names it. There is no endpoint documentation, no request or response example,
no error table, no rate-limit statement, no sandbox. A technical buyer cannot evaluate what
they cannot read. **This is the largest single gap in the entire commercial estate**, because
the product is finished and the sales surface is missing.

### Blocker 2. The paid pages are orphans

Zero inbound links, absent from the sitemap. The 13 clicks prove people who reach them convert
to intent. Nobody is being sent there.

### Blocker 3. No payment link exists

Every `checkout_url` in `api/_offer-config.js` is empty. `api/checkout.js` takes the invoice
branch every time. Fifteen minutes in a payment dashboard and one file edit.

### Blocker 4. The fallback captures no contact detail

The unconfigured branch of `api/checkout.js` renders a static page with an email address. **All
13 were lost this way and none can be recovered**, because no name, email or organisation was
ever captured.

### Blocker 5. No entity, which caps deal size rather than blocking it

`SURGICAL_REMEDIATION_PROMPT.md:68` prohibits naming an entity type unless one has been formed.
Sole-trader invoices clear at $250 and usually at $750. They are rejected by large
institutional accounts payable, and **four of the 13 were EU (3 DE, 1 FR), where a VAT
identifier is asked for early**.

### Blocker 6. The sitemap is duplicated

67 `<loc>` entries, 43 unique. **24 URLs are listed twice**, including `enterprise.html`,
`training.html`, `pilot.html` and every `/reference/` page. `scripts/fix_sitemap_duplicates.py`
exists in the repository and has never been deployed.

### Not a blocker

The compliance disclaimers obstruct none of this. Nothing here adds a framework claim, a
certification claim or an accreditation claim.

---

## 3. What to do, in order

### Step 1. Link the commercial pages. One hour, no new code.

Add links to `audit-request.html`, `governance-request.html` and `calibration-request.html`
from `enterprise.html` and from the footer. Right now `enterprise.html` has **one heading** and
its outbound links go to `check.html`, `training.html`, `investigator-guides.html` and two
`mailto:` addresses. **Every path off your enterprise page currently leads to something free or
to an email client.**

Add all three, plus `engagement.html` and `terms.html`, to `sitemap.xml`. Run
`scripts/fix_sitemap_duplicates.py` while you are in there.

### Step 2. Turn on payment. Fifteen minutes.

Create three payment links. Paste them into `api/_offer-config.js:26`, `:33`, `:40`. Deploy.
Test with `/api/checkout?o=audit&src=selftest`; the `CHECK_TAGS` filter in `api/checkout.js`
keeps the test out of the purchase record.

### Step 3. Stop losing the ones who will not pay by card. Half a day.

Replace the static unconfigured page with a capture form: name, email, organisation, record
type, volume. Post it to `pilot_contacts` under a new source, `checkout-fallback`. Keep it even
after Step 2, because enterprise buyers routinely will not use a card.

### Step 4. Publish the Review Engine. This is the highest-value item on the list.

Create one page, `api.html` or `review-engine.html`, containing:

- What the engine does and what it does not claim, using the honest stage language already
  written in `api/review-engine.js`.
- The `POST /api/v1/review-engine` contract: request shape, response shape, a worked example.
- The error table, including the 401 the endpoint already returns.
- The rate limit, described as best-effort exactly as the source describes it.
- `request_id` and `X-Request-Id`, explained as the audit-correlation feature they are.
- How to obtain a token, which is an email to you.

**One change to make while writing it:** the current 401 body names your environment variables
back to the caller. Reword the public-facing detail to "A token is required. Contact
info@jrsstandard.com" and keep the diagnostic text for your own logs.

### Step 5. Price the engine and put a number on the page.

The engine is the only offer that scales without your time. Suggested structure, to be tested
rather than assumed:

- **Evaluation:** 100 calls, one token, 30 days, free on request. This is a lead-capture
  mechanism, not a discount.
- **Single function:** annual, one token, a stated call ceiling.
- **Enterprise:** multiple tokens, higher ceiling, a named contact.

Set the numbers once in `api/_offer-config.js` beside the existing three, never in HTML.

### Step 6. Make the mini-pilot the enterprise entry point.

`api/org-pilot.js` is the strongest thing you have for an enterprise conversation, because it
produces evidence from the buyer's own records without ever holding them. Put it on
`enterprise.html` as the first call to action, above the paid tiers. A prospect who has run
their own records through it has already qualified themselves.

### Step 7. Add the guards, so none of this can silently rot.

Extend `scripts/check_zero_drift.py` to fail when:
- any price literal appears in an HTML file;
- `sitemap.xml` contains a duplicate `<loc>`;
- any of the three request pages has zero inbound links;
- a framework name appears without a non-establishment clause in the same block.

### Step 8. Form the entity, then add procurement.

Only after Step 8 does the vendor-quote or proforma path make sense. Until then invoice by
email; three of the 13 were German.

### Step 9. Reprice, last, against evidence.

The tiers floated in the board plan ($195 / $495 / $1,995 / $7,500) do not exist in this
codebase, which runs $250 / $500 / $750. **Sell three engagements at the current prices before
changing a number that has never been tested against a real buyer.**

---

## 4. The order matters, and here is why

Steps 1 and 2 together take under two hours and address the only proven demand signal you have.
Step 4 is the largest revenue upside but it is writing, not engineering, and it can be done in
parallel. Steps 8 and 9 are the ones people usually do first, and they are the two that should
be done last.

**Free guides and free training are not in tension with any of this.** They are the top of the
funnel that produced 245 PDF downloads, 195 kit downloads and 105 guide downloads. The problem
has never been that the free material is too generous. The problem is that there is no marked
path from it to anything you sell.

---

## 5. Evidence index

| Claim | Anchor |
|---|---|
| Review engine, canonical implementation | `api/review-engine.js` (257 lines) |
| Versioned mirror route | `api/v1/review-engine.js` (250 lines) |
| Per-partner tokens, fail-closed, sandbox flag | `api/review-engine.js` header |
| Live 401 with env-var names in the detail | probe of `/api/v1/review-engine`, 2026-08-25 |
| Engine referenced only on private surfaces | `acquisition-9f3c2a7d4b.html`, `vp-7c1f9a4e8d2b6035.html`, `programme-status-9872fb93cc94.html` |
| Bench scorer withholds key and per-record results | `api/bench-score.js:3-14` |
| Bench admin behind a token | `api/bench-admin.js` |
| Mini-pilot stores counts, never record text | `api/org-pilot.js` header |
| Mini-pilot linked from five pages | `investigator-guides.html`, `supported.html`, `contributor.html`, `org-pilot.html`, `training.html` |
| Three offers at $250 / $500 / $750 | `api/_offer-config.js:20-44` |
| Empty checkout URLs | `api/_offer-config.js:26`, `:33`, `:40` |
| Configured-URL guard | `api/_offer-config.js:63-66` |
| Owner bypass tags on checkout | `api/checkout.js` `CHECK_TAGS` |
| Request pages have zero inbound links | grep across all `*.html` |
| Request pages absent from sitemap | `sitemap.xml` |
| Sitemap 67 entries, 43 unique, 24 duplicated | `sitemap.xml` |
| Undeployed sitemap fix | `scripts/fix_sitemap_duplicates.py` |
| 13 checkout clicks, all unconfigured, $6,500 | `interaction_events`, source=checkout-click |
| Free-asset demand: 245 / 195 / 105 | `interaction_events` exact counts |
| Entity-type prohibition | `SURGICAL_REMEDIATION_PROMPT.md:68` |
| Non-establishment clauses | `terms.html:139`, `engagement.html:176`, `enterprise.html:295`, `check.html:186` |
