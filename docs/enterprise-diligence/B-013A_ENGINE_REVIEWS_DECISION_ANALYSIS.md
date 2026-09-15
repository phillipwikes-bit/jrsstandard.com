# B-013A — `engine_reviews` Decision Analysis

**STATUS: OPEN / OWNER ACTION REQUIRED. No option was selected. No grant was altered.**

**This is a pre-first-real-use control, not a post-deployment cleanup.** The table is empty
today. That is a window, and it closes on the first real engine call.

---

## Current technical state

| | |
|---|---|
| RLS | enabled |
| Anon policy | `SELECT` with `qual = true` |
| **Rows** | **0** |
| Write path | `logReview()` in `api/review-engine.js` and `api/v1/review-engine.js`, on every successful call |
| Read path | `engine-activity.html`, from the browser, with the publishable key |

## Exact fields

| Field | Sensitivity |
|---|---|
| `determination` | Low. A routing value |
| `conditions[k].status` | Low |
| **`conditions[k].note`** | **The prompt requires it to be "grounded in the record text"** (≤400 chars × 5) |
| **`finding.compliant_version`** | **A model rewrite of the customer's passage, up to 600 characters** |
| `runs`, `overall_consistency`, `engine_version` | Low |

## Data flow

```
customer record
  -> Vercel edge function
    -> Anthropic (record text transmitted)
      <- model output
        -> response to caller          (record text NOT stored)
        -> logReview() -> Supabase engine_reviews
             conditions[].note        <- grounded in the record text
             finding.compliant_version <- a rewrite of the passage
                 |
                 +-- anon SELECT qual=true --> anyone holding the publishable key
```

## Threat model

**Adversary:** anyone who views source on any of 22 pages. **No authentication, no
rate-limiting relevance, no skill required.**

**The unlinked `noindex` page is not the control.** `engine-activity.html` being unlinked
protects the page, not the table. The key is public by design and the REST endpoint is
directly addressable.

**Not a defence:** obscurity of the table name, the page being unlinked, or `noindex`.

## Consequences

**Privacy.** Record-derived text becomes world-readable. `compliant_version` is the most
sensitive field in the system's entire persistence layer, because it is a model's rendering of
the customer's own passage. **NOT ESTABLISHED, and not asserted: what any privacy regime makes
of that.** That is counsel's.

**Security.** No credential, no escalation, no integrity impact. **This is a confidentiality
issue only.**

**Operational.** Removing the anon read breaks `engine-activity.html` until it reads through a
server route. That page is a public activity log, not a control surface.

**Reproducibility reporting.** Option C, which stops persisting the notes and the rewrite,
**would remove the per-condition telemetry the reproducibility reporting uses.** That is a
research-capability cost, not just an engineering one, and it is the reason C is not the
cheapest option despite sounding like it.

## Options

| | Option | Reversible | Deployment impact | Cost |
|---|---|---|---|---|
| **A** | Revoke anon `SELECT` | **Yes**, trivially | None to the site; `engine-activity.html` shows an error until B | Page breaks |
| **B** | Server-mediated read via an Edge Function | Yes | One new function, one page edit | ~1 function; gives one place to control what is shown |
| **C** | Stop persisting notes and `compliant_version` | Yes going forward, **not retroactively** | Engine code change | **Loses reproducibility telemetry** |
| **D** | Disclose the exposure as intended | Yes | Wording change on several pages | Requires telling customers a rewrite of their passage will be publicly readable |

## Engineering recommendation

**A now, B when convenient.**

A is one policy change, instantly reversible, and closes the window **while the cost of being
wrong is zero, because there is nothing in the table**. B restores the public activity log
properly. C is a research-capability decision, not a security fix. D is defensible but is the
only option that requires a customer-facing promise nobody has yet made.

**THIS IS AN ENGINEERING RECOMMENDATION. IT IS NOT AN OWNER DECISION.** No grant was altered,
and altering one is a production operation outside this authority.

## Critical operational rule, refined against production evidence

**A correction to my own framing, in the less alarming direction, because an overstated risk is
as much a defect as an understated one.**

An earlier statement of this analysis said the window closes on "the first real engine call".
**That is not accurate.** Verified against production on 2026-09-15:

| Route | Production response | Writes `engine_reviews`? |
|---|---|---|
| `/api/review` (free, public; used by `index.html`, `training.html`, `check.html`) | **400** on a bad request, so live | **NO.** Zero occurrences of `logReview` or `engine_reviews` in `api/review.js` |
| `/api/review-engine` | **401** | **Yes**, but token-gated |
| `/api/v1/review-engine` | **401** | **Yes**, but token-gated |

**Both writing routes are token-gated and fail closed.** Public traffic on the free route
cannot populate this table.

**CORRECTED STATEMENT OF THE WINDOW.** The table populates when **a partner or token holder**
calls a review-engine route. That is narrower and less urgent than "any real use" — **and it is
precisely the paid, commercial path**, which is the one a licensing conversation would exercise
first.

**The recommendation is unchanged.** The window is still open, it still closes without warning,
and the fix is still free while the table holds zero rows. **It is simply less likely to close
by accident than the earlier wording implied.**

**Verified 2026-09-15:** `content-range: */0` — still zero rows.

**No test production data was created to demonstrate any of this.** The analysis rests on the
schema, the policy, the write path and unauthenticated probes that returned only status codes.
