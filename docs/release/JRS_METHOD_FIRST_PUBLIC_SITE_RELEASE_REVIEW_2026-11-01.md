# JRS Public Method-First Site: Release Readiness Review

**Date:** 2026-11-01  
**Candidate:** PR #86, `fix/jrs-public-method-first-remove-engine-promotion-2026-11-01`  
**Assessment:** A-level **source candidate**, not a passed production release  
**Authority:** Public JRS methodology, reference material, constructed training, research. No Review Engine production offering.

## Institutional acceptance criteria

| Criterion | Evidence | Status |
| --- | --- | --- |
| Method is the public offering | Home positions the five-condition documentation-review method, existing-workflow application, free tools, research | Passed, source |
| Engine no longer marketed | Site-wide scanner covers every nonarchival HTML page, including nested reference and reviewer pages | Passed, source |
| No public record-entry assessment | Training form, text-entry API call and implied automated results removed; anchored practice guidance retained | Passed, source |
| No unsupported public licensing or integration | Obsolete offer pages noindexed, historical copy preserved by Git history; present navigation and scenario copy corrected | Passed, source |
| Research remains independently reviewable | Research summary, methods, evidence ledger, questions, full register and limitations retained | Passed, source |
| Practitioner downloads and inquiry remain available | Three PDF guide files and direct links intact; public reference/PDF routes and Formspree contact action intact | Passed, source |
| Manifest technical record accessible | Removed Vercel redirect of `/manifest.html` to retired Engine route, preserved v1.0.1 JSON Schema and sample | Passed, source |
| Search/navigation continuity | Sitemap no longer advertises discontinued Engine and retired offer routes; obsolete Engine redirects lead to current resources | Passed, source |
| Training scripts parse | Inline training JavaScript compiled by Node VM test after removing public assessment block | Passed, source |
| Regression assurance | New site-wide method-first gate plus navigation, research/accessibility, investigator PDF integrity and contact-safety workflows | Passed at source head before this documentation commit |
| Exact build and live redirect checks | READY Vercel preview of exact tested SHA, HTTP 200 on open materials, no promotion in rendered DOM, 3 PDF downloads, Formspree end-to-end | **Not completed** |
| Mobile assistive/accessibility | Mobile and keyboard tests on actual deployed pages, Lighthouse/axe manual review, iOS Safari smoke | **Not completed** |
| Owner-only confidentiality | Dashboard/API anonymous denied and Supabase RLS evidence | **Separate P0 issue remains unresolved, PR #84** |

## Operating decision

**Code-content quality:** A-level candidate based on source and automated regression coverage.  
**Production quality:** Not graded A. Do not claim site has changed until deployment and live acceptance checks pass.  
**Release disposition:** HOLD, pending Vercel deployment capacity and exact-commit preview/production checks.

This release does not merge private dashboard security work, record any new study results, enable the Review Engine, grant licensing, or certify legal or regulatory effectiveness.

## Deployment acceptance check

1. Confirm the deployable SHA and available Vercel quota. A failed 402 build is not a release.
2. Preview homepage, resources, training, constructed simulations, research, investigator guides, Manifest, contact, and historical technical URL on desktop and mobile.
3. Confirm the published source contains no public Review Engine promotion, no record-entry assessment form, no prospective API/licensing offer, and no reference link to a retired product page.
4. Confirm `/manifest.html` serves the specification, does not redirect to technical status, and schema/example links resolve.
5. Confirm all three direct investigator PDFs download without sign-up. Verify research links and versioned archive remain accessible.
6. Verify Formspree contact delivery without generating a fake research or pilot submission. Record test data separately.
7. Independently verify previously identified private dashboard/API access concerns. Treat this as a P0 gate for overall site risk acceptance.
8. Record browser results, timestamp, environment, observed response codes and rollback deployment. Seek owner release authorization only after the above gates are evidenced.

## Change interpretation

This change corrects **publication positioning and visitor paths**, not validation status. Constructed-document results do not establish real-world organizational effectiveness; an ordinary download redirect is not evidence of reader understanding or methodological adoption. Historic technical code and research are preserved in the development record and should not be silently erased or recast as commercial availability.
