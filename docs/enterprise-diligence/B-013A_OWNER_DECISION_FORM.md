# B-013A — Owner Decision Form

**For Phillip Wikes. Tick one. No option has been implemented.**

---

## The situation in four sentences

The `engine_reviews` table is readable by anyone holding the site's publishable key, which
ships in 22 pages of HTML. It currently holds **zero rows**. When a partner or token holder
calls a review-engine route, it will hold a short note against each of the five conditions
that the model is instructed to ground in the record text, plus **a model-written rewrite of
the customer's passage, up to 600 characters**. Fixing it now costs nothing because there is
nothing in the table; fixing it later means the data was public in the meantime.

**Correction to an earlier statement of mine:** the free public route (`/api/review`, behind
the homepage, training and check) writes **nothing** to this table. Both writing routes return
**401** and are token-gated. **Ordinary site traffic cannot populate it.** The window closes on
a partner call, which is narrower than I first said — and is the paid path.

## Options

**[ ] OPTION A — Revoke anonymous SELECT**
Closes the exposure immediately and reversibly.
**Cost:** `engine-activity.html`, the public activity log, stops working until Option B is done.

**[ ] OPTION B — Server-mediated read**
A small Edge Function serves the activity log, so you control exactly which fields are public.
**Cost:** one new function and one page edit. Can follow A.

**[ ] OPTION C — Stop persisting the notes and `compliant_version`**
Removes the record-derived content at source.
**Cost: this is the telemetry the reproducibility reporting uses.** A research-capability
decision, not just an engineering one.

**[ ] OPTION D — Disclose the exposure as intended**
No engineering change.
**Cost:** the public pages must tell customers that a model-written rewrite of their passage
will be publicly readable. **No such statement exists today**, and four pages currently publish
a data-isolation statement that would sit awkwardly beside it.

**[ ] OTHER / DISCUSS:** ______________________________________________

## Engineering recommendation

**A now, B when convenient.** A is one policy change, instantly reversible, and the cost of
being wrong is zero while the table is empty.

> **ENGINEERING RECOMMENDATION — NOT OWNER DECISION. NOT IMPLEMENTED.**

## What happens after you tick a box

Whichever you choose, the change is **a production database grant or an engine change**, and
neither is authorized by this form. It would be prepared, tested in development, and held for
your separate deployment authorization.

**Signed:** ____________________  **Date:** ____________
