# Round E — V-4 and V-9 Decomposition, and the Finding They Surfaced

Date: 2026-09-16 · Mode: development remediation · Phase: II (locked) · Gate: 1 (not open)
Authority: Category A delegation (methodology, architecture, privacy/security posture, documentation, reversible operations)

Round D closed eight questions and left three. V-10 was answered there. This
record processes **V-4** and **V-9**. Both were carried as "low, legal-adjacent."
Decomposing V-9 against executable code produced a production-live contradiction
that neither question anticipated, and it is recorded here as **B-016**.

---

## 1. V-4 — does a stated 90-day window create an expectation of deletion on request inside it?

The directive requires this to be decomposed before it is answered, and not
answered as a legal conclusion. Decomposed into three components:

### Component 1 — FACT. Does the retained data contain personal information?

**NOT PERSONAL INFORMATION, on the evidence.** Established from the schema and
the write path, not from inference:

`supabase-engine-reviews-setup.sql:7-18` declares `engine_reviews` with eleven
columns: `id`, `created_at`, `request_id`, `determination`, `conditions`,
`finding`, `runs`, `overall_consistency`, `input_preview`, `engine_version`.
There is no name, email, IP, account, session or device column.

`api/v1/review-engine.js:177-206` is the only writer. It supplies
`request_id`, `determination`, `conditions`, `finding`, `runs`,
`overall_consistency`, `engine_version`. It does **not** supply `input_preview`;
that column still exists in the DDL and nothing writes it, a residue of the
2026-08-14 removal.

`request_id` is `crypto.randomUUID()` (`api/v1/review-engine.js:85-87`),
generated server-side per request. It is not derived from the caller, not
derived from the record, and carries nothing of either.

**Consequence.** The `privacy.html` §7 Delete right runs over "the personal
information we hold about you." JRS holds nothing in `engine_reviews` that
identifies a person and has no means of linking a row to one. The right has no
subject matter in that table, so the 90-day window does not narrow, delay or
condition it.

### Component 2 — ARCHITECTURE AND WORDING. Is the disclosure placed where it implies otherwise?

**NO. No correction required. This component is Board-decidable and the decision is: no change.**

The BD-12 sentence sits at `privacy.html:214`, inside §5 — the service-provider
section, under "Services that can receive data from your visit," in the
**Anthropic** entry. It is a statement about where data goes and what is kept of
the model's output.

It does **not** sit in §6 "How long we keep it," which is the section that
governs personal information and the one a reader consults before exercising §7.
§6 is unchanged and still enumerates only enrollment and certification records,
study submissions, and form submissions. §7 is unchanged.

Had the 90-day sentence been placed in §6, it would have read as a retention
period **over personal information**, and the implication V-4 warns about would
have been created by our own layout. It was not. The placement is correct as
published and is left alone.

### Component 3 — LEGAL RESIDUE. Narrow, and it is real.

One question survives components 1 and 2 and cannot be answered here.

`request_id` is returned to the caller in every response body
(`api/v1/review-engine.js:89-91`). A caller who retains their own `request_id`
therefore holds a value that points at their own row, even though JRS cannot
make that link. Whether a random identifier held **only by the data subject**
renders the row identifiable — and so brings it inside a deletion right — is an
interpretive question about identifiability, not an engineering one.

**CLASSIFIED: COUNSEL REVIEW REQUIRED. Joins the B-004 channel. Severity LOW.**
It is stated narrowly on purpose. The question is *not* "do we owe deletion
rights"; it is the single sentence above. Nothing is blocked on it: no row
exists, and the disclosure is accurate either way.

### V-4 disposition

**BOARD DECIDED, in part. No change to `privacy.html`.** Components 1 and 2 are
resolved on repository evidence. Component 3 is escalated as a narrow named
question rather than answered. V-4 is **CLOSED as an engineering question** and
**OPEN as one sentence for counsel**.

---

## 2. V-9 — does disclosing a retention period constitute a commercial representation to a future licensee?

The directive requires two facts to be established first, and forbids assuming
future commercial reliance merely because reliance is theoretically possible.

### Fact A — is JRS currently licensed to an external customer?

**NO. NOT LICENSED. Zero.** `research/IP_SALE_TRACKER.md` records zero buyer
conversations held, organizations 0, sessions 0, revenue $0. Every
`checkout_url` in `api/_offer-config.js` is empty and all three fixed-scope
offers are `retired:true`. No payment gateway is wired and no gateway
environment variable is referenced anywhere in `api/`.

Confirmed independently against the deployment: a POST to
`https://www.jrsstandard.com/api/v1/review-engine` returns **401** with detail
**"A token is required. Contact info@jrsstandard.com"** — the branch taken when
`REVIEW_API_TOKEN` is unset **and** `JRS_SANDBOX_OPEN` is not `true`. The route
is closed to every caller. No token has been provisioned to anyone.

### Fact B — does any licence draft exist?

**NO LICENCE AGREEMENT DRAFT EXISTS.** A search of `research/` for contractual
form — "this agreement", "the parties", "hereby grants", "term and termination",
"governing law", "warranty", "indemnif" — returns no draft instrument. What
exists is **plans**: `research/ENTERPRISE_LICENSING_PLAN_2026-08-25.md` and
`research/Licensing_Plan_Addendum_Training_2026-08-22.md`. A plan describing
what a licence should contain is not a draft licence.

`terms.html` is a published contractual surface, but it governs **founder-delivered
engagements closed to new requests on 4 September 2026**, and its §4 "Your records"
is expressly scoped: "That is a statement about those closed engagements only. It
is not a statement about this website." It does not reach the engine.

### The answer V-9 actually has

On Facts A and B the narrow question dissolves: **a published data-handling
statement made when no licence and no licensee exists is not a commercial
representation to anybody.** There is no counterparty and no instrument. Recording
a future obligation to carry retention into a licence when one is drafted is
sufficient, and the drafting is counsel's.

**V-9 disposition: BOARD DECIDED. The BD-12 disclosure is not a commercial
representation. It is a published data-handling statement, accurate as of this
date, with no counterparty.** Filed as a drafting obligation against any future
licence. **CLOSED.**

### But the decomposition found something else

Establishing Fact A required tracing what a licensee would actually receive. That
trace reached the published API contract, and the contract does not say what the
code does.

---

## 3. B-016 — the published API contract denies a write path the code contains

**FACT. PRODUCTION-VERIFIED BY BYTES.**

`https://www.jrsstandard.com/openapi.json` returns HTTP 200 with sha256
`b89e7fea904cd32db78c05625cd501abb43607c7fa5ddc7dd0fa3134c1e047d3`, byte-identical
to the repository copy. It describes exactly one path: `/api/v1/review-engine`.

It states, in `info.description`:

> "**The call is stateless.** Record text is assessed in memory and discarded: **it
> is not written to any table**, not echoed back, and not logged, so **no
> data-residency or retention obligation transfers to the operator of this API**."

and in `info.summary`:

> "**Stateless** pre-finalization decision gate for one record."

`api/v1/review-engine.js:272` reads:

```js
if (AUTHENTICATED) await logReview(SERVICE, rid, out);
```

`logReview` POSTs a row to `engine_reviews` carrying `conditions` — which the
prompt requires to hold a per-condition `note` grounded in the record text — and
`finding`, which carries `compliant_version`, a model rewrite of the passage.

### What is true, and what is not

Read strictly, one clause survives: the grammatical subject of "it is not written
to any table" is **record text**, and record text genuinely is not written
(`input_preview` was removed 2026-08-14 and the column is now unwritten). That
clause is accurate.

**"The call is stateless" is a separate, unqualified sentence, and it is false of
the code.** The call writes a row. So is the summary line. And "no data-residency
or retention obligation" is a legal conclusion (Rule 8) resting on the false
premise — it is the same proposition the 2026-09-15 claims sweep banned from ten
HTML pages, still published in JSON.

### Why production is not currently exposed, and why that is not a defence

`AUTHENTICATED` is only ever set true when `REVIEW_API_TOKEN` is provisioned. The
401 probe above establishes it is unset. **No caller can reach the model, so no
row can be written, and `engine_reviews` holds 0 rows.** Production is accurate
today by **configuration**, exactly as B-015 was.

The defect is that the contract becomes false at the moment the asset is first
licensed. Provisioning a token to a licensee is the single act that turns on the
write path the contract denies — so **the first licensee is the only person who
can make this document untrue, and they are the person it was written for.**
That is the V-9 concern arriving from the opposite direction: not the retention
disclosure creating a representation, but an existing representation contradicting
the retention disclosure.

### Two published surfaces now disagree

| Surface | Says |
|---|---|
| `privacy.html:214` (BD-12, not yet deployed) | model output about the record is kept, and kept for 90 days |
| `openapi.json` `info.description` (deployed) | the call is stateless; nothing is written to any table |

Both are public. They cannot both be right.

### Why the guard suite did not catch it

`check_data_handling_claims_match_the_implementation` bans the phrase
`"no data-residency obligation"`. `openapi.json` contains **"no data-residency
**or retention** obligation"** — the inserted words defeat the substring. It would
have been missed even had the sweep read JSON, and the sweep reads only
`_html_files()`. **Two independent misses, either of which alone was sufficient.**

### Disposition

`openapi.json` is the published API contract and this repository's standing
instruction is that it is not to be modified and the published contract is not to
be altered. §16 lists "API contracts conflict" as a stop condition.

**BLOCKED. B-016 raised. No edit made to `openapi.json`.** The correction is
drafted below for authorization; it is not applied.

**Proposed correction, NOT APPLIED, requires authorization:**

- `info.summary` — drop "Stateless".
- `info.description` — replace the three claims with what the code does: record
  text is assessed in memory and is never written to any table or echoed back;
  the engine's own output about the record is recorded, and the fields derived
  from the record are removed after 90 days; and delete the data-residency
  conclusion entirely rather than restate it, because it is a legal conclusion
  and Rule 8 forbids us reaching it.

**This is a content correction to a document version-stamped `1.0.0`.** Whether
it warrants a version increment is part of the authorization, not something to
decide unilaterally.

---

## 4. A second, smaller finding from the same probe

The two 401 branches return **different detail strings**. `"Send Authorization:
Bearer <token>."` means a token is provisioned; `"A token is required. Contact
info@jrsstandard.com"` means none is. An unauthenticated caller can therefore read
the provisioning state of the deployment from the error text — which is how the
state was established above.

This is the same category as the defect already fixed on these lines, where the
401 named the governing environment variables. It is weaker: it discloses
configuration state, not variable names. **Recorded as V-11, severity LOW, not
remediated this cycle** — merging the strings is a one-line change but it removes
a genuine operator signal, and that trade is worth deciding deliberately rather
than in passing.

---

## 5. Round E state

| Item | Status |
|---|---|
| V-4 components 1–2 | **BOARD DECIDED — no change — CLOSED** |
| V-4 component 3 | **COUNSEL REVIEW REQUIRED** (narrow, LOW, joins B-004) |
| V-9 | **BOARD DECIDED — not a commercial representation — CLOSED** |
| V-10 | ANSWERED in Round D; closes on deployment |
| **B-016** | **OPEN — HIGH — BLOCKED on authorization to correct the published contract** |
| V-11 | OPEN — LOW — recorded, deliberately not remediated |

**STATE 1 — DEVELOPMENT REMEDIATION. DEPLOYMENT NOT AUTHORIZED. NOT READY FOR
GATE 1 RECONSIDERATION. PHASE II LOCKED.**
