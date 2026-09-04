# Commercial Plan Feasibility Audit

**Date:** 2026-08-24
**Auditor scope:** technical architecture, pricing and funnel mechanics, procurement and
invoicing, compliance and trust infrastructure.
**Input:** the Executive Board Report text was **not supplied**. The prompt carried an
unfilled placeholder, `[Insert the full Executive Board Report text here, or analyze the
current repository context if running inside the project directory]`. Per that instruction
this audit runs against the **live repository**, and every finding is anchored to a file
path and line number rather than to the plan's own description of itself.

---

## 1. Executive feasibility score

**6 / 10.**

The engineering is mostly done or genuinely easy. The plan's real risk is that two of its
four vectors describe things this repository has already deliberately decided **against**,
and one of them would put the site in conflict with its own written disclaimers.

Three findings sit above everything else.

**The plan's price tiers do not exist in this codebase.** `api/_offer-config.js:20-44`
declares three offers at **$250, $500 and $750**, plus a free tier at `check.html`. There is
no $195, no $495, no $1,995 and no $7,500 anywhere in the repository. The plan is not adding
an NGO tier to an existing ladder. It is replacing the ladder.

**The PDF delivery the plan asks to build already exists.** `JRS-Reference-9d4f2a7c.pdf` is
present at 2,308,034 bytes, routed through the alias map at `api/dl.js:44`, labelled for
analytics at `api/geo-stats.js:24`, and linked from `training.html:1755`, `training.html:1797`
and the kit table at `training.html:2983-3020`.

**The compliance markers the plan wants on `training.html` would contradict `terms.html:139`**,
which states in writing that JRS "does not establish compliance with the EU AI Act, NIST AI
RMF, ISO/IEC 42001 or any other framework."

---

## 2. Core architectural bottlenecks

### Stripe is not integrated, and the empty checkout URLs are a decision rather than an oversight

`api/_offer-config.js:9-18` documents why every `checkout_url` is blank: nothing in this
repository can mint a real payment link, and a plausible-looking one is a fabricated payment
destination, "at best a dead link shown to a paying customer, at worst money sent somewhere
unintended." `api/checkout.js` fails closed to a scoping-and-invoice page rather than
guessing a destination.

The only occurrence of the string "Stripe" in the entire repository is inside that comment
block. There is no SDK, no webhook handler, no price object, no API key reference.

The bottleneck is not code. Someone must create the links in the payment dashboard and paste
them into one file. `isConfigured()` at `api/_offer-config.js:63-66` and the redirect branch
at `api/checkout.js` require no modification.

**The cost of the current state is measurable.** `interaction_events` holds two
`checkout-click` rows in `state: unconfigured`, one $750 calibration and one $500 governance.
Two buyers reached the pay screen and received an email address.

### There is no exam grading engine, and `reviewer-cert.js` says so deliberately

`api/reviewer-cert.js:9-15` states that the completion code "is a receipt, not a password,"
and that the endpoint "checks the code for shape only."

`api/reviewer-cert.js:32-40` records a correction made on **2026-08-16**. The certificate
had asserted that the holder "completed the six-module JRS Reviewer Training." On the day
that was found, the one person holding a rendered certificate had **no training-enroll row
and no training-complete row** in `pilot_contacts`. The file's own comment names the defect:
"a document stating a conclusion its own evidence does not support," which is the exact
failure mode this programme measures in other organisations' records.

`api/reviewer-eval.js` contains **zero** occurrences of `score`, `correct`, `answer_key`,
`grade`, `threshold` or `pass`. There is no grading logic to extend.

Building exam grading therefore means new scoring logic, an answer key, a pass threshold, a
retake policy, and a re-audit of what the certificate is permitted to assert. The last item
is where the schedule risk sits, not the first.

### A grading engine exists, but reusing it would break a deliberate containment

`api/bench-score.js:3-14` scores submitted determinations against a held-out key and is
explicitly built never to return the key, per-record correctness, the five-condition scoring
logic, or any per-record label. The stated reason: "Per-record feedback is exactly how a
licensee reconstructs the key across a" set of runs. Repointing this at training exams would
dismantle that containment, because a training exam has to tell the candidate which answers
were wrong.

### `api/complete.js` cannot support a credential of any kind

`api/complete.js:31` writes `message: JSON.stringify({ kind:'training-complete', ts, country })`
with `name: ''` and `organization: ''`. There is no score field, no module list, no attempt
count, no duration. Any CEU or CLE claim requires an attendance and assessment record this
schema does not hold and cannot be made to hold without a payload change.

---

## 3. Strategic and pricing alignment

### The ladder in the plan and the ladder in the repository are different products

Before anything is built, settle whether $250 / $500 / $750 is being repriced to
$495 / $1,995 / $7,500. That is a **4x to 10x move on the top tier**. `api/_offer-config.js:3-7`
exists precisely because this repository has repeatedly shipped a price that read one way on
one surface and another elsewhere, and the file names a price as "the worst possible place"
for that defect class.

### On the $195 NGO tier

The leakage risk is real but manageable, and it is not primarily about NGOs misrepresenting
themselves.

The larger risk is **anchoring**. A $195 public-interest price sitting visibly beside a
$7,500 enterprise price invites the enterprise buyer to ask what the other $7,305 buys.
Enterprise procurement reads a wide public spread as an invitation to negotiate, and the
NGO tier becomes the reference price for every subsequent conversation.

Two ways to avoid it, either sufficient:

1. Keep the NGO tier off the main pricing surface and issue it by application.
2. State a hard eligibility rule on the tier itself: registered nonprofit, named organisation
   on the invoice, no client work product.

### The free tier is the more important conversion question

`FREE_TIER` at `api/_offer-config.js:47-53` gives the Seven-Point Record Defensibility Check
away ungated at `/check.html`. A $195 tier sits close enough to free that it may cannibalise
the paid ladder rather than extend it downward. **The gap that needs engineering attention is
free to $195, not $195 to $495.**

### One asset already built that the plan does not use

`api/checkout.js` already accepts a `src` query tag, sanitises it, and writes it into
`interaction_events` alongside the offer key and state. Per-tier and per-campaign attribution
is available the moment the payment links go live, at zero additional build cost.

---

## 4. Procurement and invoicing complexity

### Most of this exists already, as prose rather than as a button

`api/checkout.js` already tells the buyer that "Engagements at this size are scoped in writing
before anything is sent," that "Purchase orders accepted," and that "Nothing has been charged."

Six surfaces already carry invoice, purchase-order or quote language: `api/checkout.js`,
`audit-request.html`, `governance-request.html`, `calibration-request.html`, `terms.html`
and `engagement.html`.

### The self-service proforma generator is the highest-friction item in the plan, and the friction is administrative

Generating a PDF quote at the edge is straightforward engineering.

What is not straightforward: a proforma invoice carries a **legal entity name, a registered
address, a tax identification number and payment terms**. `SURGICAL_REMEDIATION_PROMPT.md:68`
prohibits adding an entity type (LLC, Ltd, Inc.) unless one has actually been formed. A quote
issued in a personal name will be rejected by most institutional accounts-payable systems,
and W-9 and vendor-onboarding requests follow within a day of the first one being sent.

**Recommendation: do not build the button yet.** A quote-request form that emails a scoped
figure captures the same buyer, requires no entity decision, and is roughly an hour of work.
Build the generator once an entity exists.

---

## 5. Compliance and trust infrastructure

### This is the vector to change before implementing

`training.html` currently contains **zero** occurrences of NIST, AI RMF, EU AI Act,
Article 14, ISO 42001, ISO/IEC 42001, CEU, CLE or CPE. That absence is consistent with what
the rest of the site already says.

| File | Line | Existing statement |
|---|---|---|
| `terms.html` | 139 | "does not establish compliance with the EU AI Act, NIST AI RMF, ISO/IEC 42001 or any other framework, and no framework requires JRS. It is not a certification, an accredit[ation]" |
| `engagement.html` | 176 | "It does not establish compliance with any of them, and no framework requires it." |
| `enterprise.html` | 295 | "JRS is not a FOIA or public-records compliance solution, a records-retention program, a legal-compliance framework, or a substitute for obligations under the EU AI Act or state AI laws." |
| `check.html` | 186 | "may be relevant to frameworks and regulatory requirements such as the EU AI Act and NIST AI RMF. It does not establish legal or regulatory compliance, and no framework requires it." |

Adding framework markers to `training.html` without the same qualifying language puts the
site in direct conflict with its own terms page. The safe pattern is already written and
proven: the `check.html:186` formula pairs "may be relevant to" with an explicit
non-establishment clause. Reuse it verbatim rather than drafting new wording.

### CEU and CLE are a different order of problem and must be separated from the rest of the plan

CEU and CLE are **accredited** designations, not metadata.

CLE is granted per US state bar. Each jurisdiction runs its own provider application, fee
schedule, attendance-verification requirement and reporting duty. `terms.html:139` currently
states that JRS is "not a certification, an accredit[ation]."

A CEU or CLE marker on `training.html` is therefore not a metadata addition. It is an
accreditation application, per jurisdiction, carrying an ongoing attendance-tracking
obligation that the current `api/complete.js` payload cannot satisfy.

---

## 6. Step-by-step implementation roadmap

### Phase 0. Decisions only, no code. Blocking.

1. Confirm whether $250 / $500 / $750 becomes $495 / $1,995 / $7,500, or whether the plan's
   tiers were drafted against a different product. Nothing downstream is safe until this is
   settled.
2. Decide whether a legal entity exists or will be formed. This gates the proforma generator
   and every vendor-onboarding conversation that follows it.
3. Decide whether CEU / CLE is a real accreditation programme or is dropped. If it is real it
   leaves this plan and becomes its own project with its own timeline.

### Phase 1. Revenue. Hours, not weeks.

4. Create one payment link per offer in the payment provider's dashboard. Paste each URL into
   `api/_offer-config.js`. `isConfigured()` and `api/checkout.js` need no changes.
5. Re-check the two `unconfigured` rows in `interaction_events` and email both buyers
   directly. They are the only two confirmed purchase attempts on record.
6. If tiers are being repriced, change them **only** in `api/_offer-config.js`, then extend
   `scripts/check_zero_drift.py` to fail if any price literal appears in any HTML file. The
   single-source-of-truth property is worth more than the price change itself.

### Phase 2. Compliance language. Low risk, high protection.

7. Add framework markers to `training.html` using the exact qualifying formula from
   `check.html:186`. Never a bare marker.
8. Extend `scripts/check_zero_drift.py` to fail if NIST, AI RMF, EU AI Act, ISO 42001 or
   Article 14 appears on any page without a non-establishment clause in the same block. This
   makes the disclaimer structural rather than something a future edit can silently drop.

### Phase 3. NGO tier.

9. Add the tier to `api/_offer-config.js` with an explicit `eligibility` field. Keep it off
   the main pricing surface and issue it by application.
10. Use the existing `src` tag on `api/checkout.js` for per-tier attribution. No new
    instrumentation required.

### Phase 4. Procurement. Gated on Phase 0 item 2.

11. Ship a quote-request form that emails a scoped figure. No entity decision required.
12. Build the proforma generator only once an entity name, registered address and tax ID
    exist.

### Phase 5. Grading. Largest, and last.

13. Specify the exam: item bank, answer key, pass threshold, retake policy.
14. Extend the `pilot_contacts` payload written at `api/complete.js:31` to carry module list,
    score and attempt count.
15. Build grading as a **new** endpoint. Do not extend `api/bench-score.js`; its
    non-disclosure containment at `:9-14` is deliberate and a training exam would break it.
16. Re-audit the assertion text in `api/reviewer-cert.js` against whatever the new code
    actually proves. The 2026-08-16 correction at `:32-40` is the precedent for what happens
    when that step is skipped.

### Not required. Already built.

PDF artifact delivery. `JRS-Reference-9d4f2a7c.pdf` is present, aliased at `api/dl.js:44`,
labelled at `api/geo-stats.js:24`, and linked from `training.html:1755`, `:1797` and
`:2983-3020`.

---

## 7. Evidence index

| Claim | Anchor |
|---|---|
| Three offers at $250 / $500 / $750 | `api/_offer-config.js:20-44` |
| Free tier ungated at /check.html | `api/_offer-config.js:47-53` |
| Checkout URLs empty by design | `api/_offer-config.js:9-18` |
| Configured-URL guard | `api/_offer-config.js:63-66` |
| Checkout fails closed to invoice copy | `api/checkout.js` |
| "Stripe" appears only in a comment | `api/_offer-config.js` (sole occurrence repo-wide) |
| Completion code is a receipt, not a password | `api/reviewer-cert.js:9-15` |
| 2026-08-16 overclaim correction | `api/reviewer-cert.js:32-40` |
| No grading logic in the eval endpoint | `api/reviewer-eval.js` (zero matches) |
| Bench scorer withholds per-record results | `api/bench-score.js:3-14` |
| Completion payload has no score field | `api/complete.js:31` |
| PDF alias map | `api/dl.js:44` |
| PDF analytics label | `api/geo-stats.js:24` |
| PDF links on training | `training.html:1755`, `:1797`, `:2983-3020` |
| Zero framework markers on training | `training.html` (0 matches, 9 terms tested) |
| Compliance non-establishment clauses | `terms.html:139`, `engagement.html:176`, `enterprise.html:295`, `check.html:186` |
| Entity-type prohibition | `SURGICAL_REMEDIATION_PROMPT.md:68` |
