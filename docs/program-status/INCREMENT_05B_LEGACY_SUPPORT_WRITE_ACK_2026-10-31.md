# Increment 05B: legacy support write acknowledgement and preview isolation

Date: 2026-10-31. Status: DEVELOPMENT ONLY / PRODUCTION HOLD.
Controlling source: Issue 3.2, §§3.2-03, 3.2-04, 3.2-05 (PST-04/06), 3.2-06.
Proposed stack: previous short-link PR #59 followed by this candidate.

## Observed defect
The historical `api/support.js` writer awaited the Supabase POST but
immediately set `wrote=true`, without checking `response.ok`.
A resolved HTTP 400/401/409/429/500 could therefore cause the redirect
to report `r=1` and set `jrs_e_<campaign>=1` even though the database
had not accepted the event. This is a source-code defect, not evidence
that a specific historical row was lost.

The legacy writer could also write in Vercel previews if they inherited a
valid service-role key. A separate historic GET path can still be invoked
by human browser navigation; this candidate does not redesign that
legacy semantic, as earlier distributed direct links use it.

## Exact candidate repair
1. Only a genuine `GET` handled in `VERCEL_ENV=production` may attempt
   to store a legacy support event.
2. Storage acknowledgement is required: `wrote=true` only when the
   POST returned `response.ok===true`.
3. Existing successful event `source=support,type=endorse` shape,
   `campaign`, `src`, optional country and bounded user-agent remain
   unchanged. Previously recorded rows are untouched.
4. Existing direct support URL retains its redirect target `/access.html`,
   and the `r=1` marker still denotes an accepted write or previously
   counted browser.
5. A failed storage write does not set the cookie; it remains retriable
   through later visits. A preview write is blocked even with storage
   configuration.
6. Existing `api/initiative-support.js` explicit POST remains the only
   count-creating action on the two educational initiative pages.
7. The original immutable 24-file source manifest is preserved. The
   exact before/after Git blob SHAs are recorded as an additional
   proposed controlled exception in
   `tests/public-program-controlled-exceptions.json`, alongside the
   earlier statistics reader exception. Both remain NOT APPROVED.

## Acceptance and adverse tests
Simulated success, 401 and 500, missing configuration, preview and
unknown environments, GET versus HEAD and POST, prefetch, crawler,
internal test tags, and existing campaign marker are tested without
contacting Supabase. The complete stacked GitHub workflow must pass.

## Known limits
A successful HTTP 2xx response to a storage POST is an acknowledgement,
not an independent audit of row persistence or unique-person identity.
A redirect does not prove the visitor arrived on the next page or read
its resources. Browser cookie deduplication is not person deduplication.
Past records are not recalculated. The old GET direct campaign links
still represent a different consent experience than the newer deliberate
POST support control.

Before production: owner must approve a precise freeze exception,
capture historic counts at a fixed UTC cutoff, perform live write/read
tests using explicitly tagged synthetic events, evaluate the behavior
of previously distributed direct links, verify private auth/RLS and
notifications, and authorize an exact-SHA reversible deployment.

**Decision: draft code correction, not a production or data migration.**
No historical row deletion, backfill, personal data export, commercial
asset transfer, outreach or study execution was conducted.
