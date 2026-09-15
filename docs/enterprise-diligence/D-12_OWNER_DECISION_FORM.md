# D-12 — Owner Decision Form

**This one has a live consequence today, not just architectural untidiness.**

---

## The situation

`api.jrsstandard.com` has **no DNS A record**. A POST returns **HTTP 000**, a connection
failure. Nothing in the repository implements `verify-drift`. CLAUDE.md §36.1 lists it as the
canonical backend endpoint.

Three pages POST to it:

| Page | Writes to Supabase first? | Consequence |
|---|---|---|
| `pilot.html` | **Yes** | Data survives |
| `training.html` | **Yes** | Data survives |
| `index.html` | **Yes** | **Data survives** |

**CORRECTION 2026-09-15.** An earlier version of this form said `index.html` did **not** write
to Supabase and that the visitor's note "reaches nobody". **That was wrong** — `index.html:5600`
writes to `interaction_events` before the call. **There is no data loss.** The correction is
recorded in full in `D-12_ARCHITECTURAL_DRIFT_ANALYSIS_2026-09-15.md`.

**What remains true:** the endpoint has no DNS record and no implementation, three live pages
POST to it and always fail, and `index.html` sets its confirmation **outside the promise
chain**, so it confirms unconditionally.

## Options

**[ ] D-12.1 — WITHDRAWN.** It proposed pointing `index.html` at Supabase, which it already
does. Listed here rather than deleted, because the form was circulated with it.

**[ ] D-12.2 — Remove the `verify-drift` calls entirely.**
Consistent, but discards a declared architecture.

**[ ] D-12.3 — Implement the endpoint.**
**Requires separate architecture and implementation authorization.** It has not been built, and
building it to make documentation true would be the wrong reason.

**[ ] D-12.4 — Retain as future architecture and document it as unbuilt.**
Honest about the intent, **leaves the homepage data loss in place**.

**[ ] OTHER:** ______________________________________________

## Engineering recommendation

**None with any urgency, now that the data-loss premise is withdrawn.** The remaining question
is whether a declared backend endpoint that does not exist should be built, removed or recorded
as unbuilt. **A defensible smallest change is to stop the three pages POSTing to a host that
cannot answer**, since the Supabase write already carries the data.

> **ENGINEERING RECOMMENDATION — NOT OWNER DECISION. NOT IMPLEMENTED.**
> `index.html` was not changed: it alters a live page's data destination.

## What was deliberately not done

**The CLAUDE.md §36.1 entry was not edited.** Deleting a canonical architecture record to make
the repository tidy is what the preservation rule forbids. It is now contradicted by evidence
in `D-12_ARCHITECTURAL_DRIFT_ANALYSIS_2026-09-15.md`, which is the correct resolution.

**Signed:** ____________________  **Date:** ____________
