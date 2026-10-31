# Issue 3.2, Increment 05: voluntary initiative navigation and support-count semantics

**Date:** 31 October 2026. **Status:** Draft, proposed for owner review.  
**Related sections:** 3.2-03, 3.2-04.2/04.3, 3.2-05 (PST-04, PST-06, PST-07), 3.2-07.
**Stack:** New narrow branch based on draft PR #58, not production.

## Observed routing defect
The prechange `vercel.json` mapped `/right-to-know-why` to
`/api/support?c=rtkw` and `/decisions-you-can-defend` to
`/api/support?c=defend`. The legacy support endpoint can record a
`support/endorse` interaction on a browser GET. A visitor opening
a short educational URL could therefore be treated as a support
interaction without making the explicit voluntary selection now used by
the two new initiative pages. The old GET endpoint also contains
historical deduplication and test-tag behavior. Its past records must
not be rewritten as unique supporters or organizational endorsements.

## Narrow candidate changes
- The two short paths now redirect with status 302 to their respective
  ungated `.html` educational pages.
- The original `/api/support?c=rtkw` and `/api/support?c=defend`
  direct links, old writer code, historical database rows, privacy
  flags and prior reporting families are **unchanged**. This is
  intentionally not a retrospective migration.
- A user voluntarily selecting support on the new page uses the
  explicitly POST-only `/api/initiative-support` route, with
  preview write isolation, storage acknowledgement, and truthful
  already-recorded / unavailable states.
- A source test verifies exact short-link targets and that the direct
  historical writer still exists and the new writer rejects GET.

## Backward-compatibility and evidence caveats
External emails, older website links and bookmarks could have used the
two short paths as campaign *support* links rather than educational
reading links. Changing their destination changes that historical
behavior for future visits, even though their direct underlying API
links still work. This is an intentional proposed user-consent
improvement, but **owner review of the historical distribution inventory
is required before release**. Preservation of old event counts does
not mean the old link's future semantics remain identical.

Expected measurement transition if released: short-link visits will
be counted as page navigation (where existing page analytics allow),
not new support endorsements. Explicit new support events will
continue in the existing support/endorse source family. Before/after
comparisons must be segmented by route, event grain and date.
Do not interpret a fall in support counts as lost visitors.

## Acceptance and rollback
1. Authoritative source and exact SHA for the two route edits documented.
2. No historical collection/owner-dashboard source changes.
3. Automated tests pass on the complete PR stack.
4. Vercel preview shows short links resolve to the correct `.html`
   page without contacting the support writer; no event writes.
5. Owner verifies historical distributed links and confirms the
   revised meaning is appropriate.
6. Program Status owner auth, live count baseline, private APIs, RLS,
   inquiry delivery and mobile gates remain independently unresolved.
7. Reversion is limited to the two redirect destinations; no database
   record is deleted, merged or backfilled.

**Decision:** DEVELOPMENT-ONLY; production release HOLD. No outreach,
source transfer or sale authorization follows from this change.
