# JRS Issue 3.4/O1 | Investigator Guides public-interest access correction
**Observed and prepared:** 31 October 2026
**Scope:** a minimal, isolated public-page change from `main`, not the unmerged Increment 16–22 stack.
**Status:** Draft candidate, not represented as a deployed live change.

## Source-confirmed problem
The live `/investigator-guides.html` page displayed a “Building software” section promising that JRS review could run in a single software call and that a record's contents would be sent to a model provider. That did not match the published Review Engine status, which does not authorize public record submission or current software integration. The section also linked to an Enterprise inquiry, contrary to Issue 3.4's free public-resource emphasis.

All three guide-card buttons pointed to `/api/dl?e=...&src=guides`, an event-writing HTTP redirect, not to the PDF itself. Clicking a link or receiving a 302 was not proof that the final file was transferred successfully. An apparently successful hidden post-download panel described the file as already delivered and claimed that nothing was recorded about the visitor, even though the page contains site analytics and a guide-view POST. The false success language and hidden feedback prompts were unsuitable for the revised repository.

## Bounded changes in this branch
- Replace all three `/api/dl` guide buttons with direct paths to their existing public static PDFs; retain the historical `/api/dl` endpoint and database event record unchanged so prior external links are not broken.
- Add a distinct `View PDF in new tab` link to the same static file for each edition, particularly helpful when a browser handles the `download` attribute differently.
- Replace the hidden, download-completion-implying panel with an always-visible section listing optional no-registration resources, avoiding any claim that a click proves a PDF was received.
- Remove unsupported one-call/model-provider transmission and Enterprise-inquiry copy on the Investigator Guides page. Replace it with a correct statement that the guides support human review and do not process or upload case files.
- Keep page-wide canonical navigation unchanged to avoid silently editing unrelated public routes. Sitewide navigation and other legacy commercial wording remain governed by Issue 3.4 PI-1 and are NOT claimed complete here.
- Replace “free to use and share” with narrower “Free PDF / no account required” metadata, without granting unverified reproduction or redistribution rights.
- Revise the old `scripts/check_zero_drift.py` Investor Guides commercial-bridge requirement to enforce direct PDF paths and accurate free/manual-use scope. Other historical page checks remain in place.
- Add an eight-group offline regression test and a dedicated pull-request workflow. No private source, participant record, real case document, owner secret, data migration or study call is added.

## Actual public resource delivery checks
Using an authenticated Vercel read-only fetch of the existing canonical public asset URLs, without invoking `/api/dl` or database writers, the following responses were observed:

| Public static asset | HTTP | Media type | Content length | PDF header and trailer | Page count |
| --- | --- | --- | ---: | --- | ---: |
| `/JRS_Investigator_Field_Guide_Employment.pdf` | 200 | application/pdf | 19,723 bytes | %PDF and %%EOF present | 9 |
| `/JRS_Investigator_Field_Guide_FairHousing.pdf` | 200 | application/pdf | 20,032 bytes | %PDF and %%EOF present | 9 |
| `/JRS_Investigator_Field_Guide_International.pdf` | 200 | application/pdf | 20,463 bytes | %PDF and %%EOF present | 9 |

GitHub source-control file blob SHAs in `main`:
- Employment: `9c058a63cae65f99628b3175a112480d7b2bc3df`.
- Fair Housing: `4cf48a778d82db3a8d91954cc0c897b71313bb87`.
- International: `1455fa544d98709cd78926939b662789795c71ae`.

These are **three actual server-side GETs of the final static assets**, not observations of the intermediate redirect or mere landing-page 200s. PDF signature, trailer and page metadata were checked. Vercel's response text representation did not permit an independent download-byte SHA-256 comparison to the Git blobs; exact source-to-production byte identity and actual iPhone Safari human-device delivery remain open. This is transport evidence, not evidence of professional reading or adoption.

## Analytics continuity and limits
The former guide-page `/api/dl` buttons generated `guide-dl` / `guide_downloads` tracking events via a service-role writer. Direct static PDF paths deliberately stop generating those **server-side redirect-based** events on guide-page clicks. Preserve all historical records and annotate the source-definition cutoff when assessing old versus new counts. Client-side GA4 or server-request metrics, where available, are different event grains. They cannot be represented as verified readers, recipients or distinct practitioners.

The existing `/api/dl` route is not changed or re-executed in this review; it includes best-effort database operations, so verifying the final public PDF was done through the static paths only.

## Acceptance and release gate
**Developer source proof:** inspect the exact before/after page and the eight-group Node regression output on the PR head; retain any adverse test results.

**Operational publication:** a new Preview from the exact PR head, if ordinary Vercel quota permits, plus anonymous desktop and actual iPhone Safari checks. Recheck the three PDF URLs and final assets in the deployed candidate, including View-in-new-tab fallbacks, disabled network behavior and no registration. Verify on-page text by inspecting the actual deployed HTML. Collect owner approval for this narrowly scoped editorial/direct-file update and record exact SHA and rollback. Publishing the PDF file routes from current production does NOT establish that this candidate page is deployed.

**Outreach:** guide-specific invitations may use the live page only after the corrected version is published and the link/rights/equipment acceptance is recorded. Until then, link to the known verified free static PDF only if a separate rights and approved-send decision permits, or hold guide-specific external messages. No outreach is dispatched by this PR.

**Current dispositions:** Public Interest Issue 3.4/O1 governs. Proposed page repair in isolated PR, not production accepted. Full sitewide PI-W01..12 and PST controls remain independent. The original private Decision Spellchecker remains NO_GO_NOT_VERIFIED; independent H2/H3 NOT_ESTABLISHED; commercial transfer NOT_AUTHORIZED.
