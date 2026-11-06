# JRS public website: six release acceptance conditions
Date: 2026-11-06
Status: OPEN. This file defines gates; it is not a test certificate.
Scope: 55 URLs in the public sitemap at https://www.jrsstandard.com/sitemap.xml, including the homepage.

## A1. Mobile legibility and operation
For each of the 55 URLs, test at CSS viewports 320, 375, 390, 430 and 768 px and at 200% text zoom; test an actual iPhone Safari session. No page-level horizontal overflow, clipped primary content, invisible or faded instructional text, or inaccessible controls. Allow contained horizontal scrolling for intrinsically tabular content with an accessible cue. Measure text contrast against WCAG 2.2 AA (4.5:1 normal, 3:1 large text); keyboard and touch targets must be usable. Record device, browser, screenshot, and outcome.

## A2. Comprehension and professional relevance
Run moderated first-visit tasks with people unfamiliar with JRS, including HR, investigations, compliance and general professional readers. Ask after 15 seconds: What is JRS? Who uses it? What does it *not* do? Record verbatim answers and misconceptions. Do not claim 100% comprehension without evidence. Preserve the approved description of the human-applied documentation-review instrument and the boundaries of operational validation.

## A3. Primary action integrity
Inventory visible primary calls to action on all 55 URLs. For each record label, destination, expected task, actual result, and mobile result. The CTA must deliver its named resource or activity without broken redirects, deceptive wording, or unnecessary intermediate steps. Include browser check, Module 1, constructed examples, contact, and research.

## A4. Download delivery and edition integrity
Inventory every advertised PDF and export link, including /api/dl routes. Check response status, MIME type, file opening on iPhone Safari, downloaded file integrity, and publication identity. Clearly distinguish online methodology v1.0, Standard PDF v2.0 and investigator guide supplements v1.1. Do not silently change edition text or claim equivalence.

## A5. Sitewide consistency
Inventory all 55 sitemap URLs, then inspect headings, nav, typography, contrast, focus, keyboard operation, responsive layout, links and terminology. Confirm that Decision Reconstruction Risk (DRR), the five-condition method, the seven-point browser aid, the published PDF and the distinct investigator supplements are not conflated. Preserve approved copy unless a verified contradiction or comprehension failure justifies an editorial change.

## A6. Critical journeys and release gate
Verify on mobile and desktop: homepage to seven-point check; homepage to constructed example; homepage to resources to PDF; homepage to training to Module 1; resources to investigator supplement; research to summary and source; contact form privacy and confirmation; reviewer reference to worksheet. Capture test date, browser/device, source commit, production/preview deployment identity, screenshots, expected/actual results, severity and disposition. No unresolved high-severity defects. A source-only or automated-only pass does not satisfy a physical-device witness requirement.

## Release register
| Condition | Source changes | Automated verification | Human/device verification | Status |
| --- | --- | --- | --- | --- |
| A1 | Shared CSS safeguards added in PR #171 | Not completed for all 55 | Not completed | OPEN |
| A2 | Approved audience wording retained | Not applicable as proof | Not completed | OPEN |
| A3 | Existing links retained | Not completed for all 55 | Not completed | OPEN |
| A4 | Edition content unchanged | Not completed for all downloads | Not completed | OPEN |
| A5 | Shared styles amended | Not completed for all 55 | Not completed | OPEN |
| A6 | Acceptance journeys defined | Not completed | Not completed | OPEN |

Release decision: HOLD until the above gates are evidenced and authorized. Do not infer production publication from a GitHub commit.


## Verification evidence, 2026-11-06: live document retrieval
Method: independent public URL content retrieval and final-URL inspection. This verifies that readable document content is returned; it does not verify iPhone Safari rendering, response MIME headers, or downloaded-byte integrity.

| Advertised URL | Resolved destination | Observation |
| --- | --- | --- |
| /api/dl?e=standard&src=acceptance-audit | /JRS-Standard.pdf | Readable JRS Standard content retrieved |
| /api/dl?e=card&src=acceptance-audit | /JRS_Rapid_Review_Card.pdf | Readable Rapid Review Card content retrieved |
| /api/dl?e=employment&src=acceptance-audit | /JRS_Investigator_Field_Guide_Employment.pdf | Readable employment/EEO guide retrieved |
| /api/dl?e=fairhousing&src=acceptance-audit | /JRS_Investigator_Field_Guide_FairHousing.pdf | Readable fair-housing guide retrieved |
| /api/dl?e=international&src=acceptance-audit | /JRS_Investigator_Field_Guide_International.pdf | Readable international guide retrieved |
| /JRS_Investigator_Field_Guide_Employment.pdf | Same direct PDF path | Readable content retrieved |

A3 source correction: training.html primary CTA now calls the existing toggleModule(0) function when Module 1 is closed. Source inspection confirms function exists; rendered browser behavior remains unverified.
A4 remains OPEN pending edition identity inspection, MIME and byte checks, all remaining advertised documents, and physical-device verification.


## Verification evidence, 2026-11-06: additional public download routes
Method: public document-content retrieval and final destination inspection. All six requests returned readable document content; this is not a MIME/header, iPhone, or binary integrity test.

| Requested path | Final path | Observation |
| --- | --- | --- |
| /api/dl?f=JRS-Reference-9d4f2a7c.pdf&src=resources | /JRS-Reference-9d4f2a7c.pdf | Reviewer Reference v1.0 text retrieved |
| /api/dl?f=JRS-Reference-9d4f2a7c.pdf&src=training-kit | /JRS-Reference-9d4f2a7c.pdf | Reviewer Reference v1.0 text retrieved |
| /api/dl?e=standard&src=editions | /JRS-Standard.pdf | Standard text retrieved |
| /api/dl?e=card&src=training | /JRS_Rapid_Review_Card.pdf | Rapid Review Card text retrieved |
| /JRS_Investigator_Field_Guide_FairHousing.pdf | same | Fair Housing guide text retrieved |
| /JRS_Investigator_Field_Guide_International.pdf | same | International guide text retrieved |

12/12 targeted public PDF URL retrieval checks succeeded across the two test batches. This is a sample of advertised routes, not proof that every PDF and every device passes A4.


## Research page data-source inspection, 2026-11-06
Source inspection confirms results.html and datasets.html request `results.json?ts=...`. The live `/results.json` endpoint returned readable JSON with `updated: 2026-06-03`, `participants: 1`, and `reviews_completed: 1`. This is a historical challenge aggregate and must not be conflated with the separate 16-reviewer constructed-record detection study. Do not replace these figures with the research summary metrics.

questions.html and finding.html use client-side dynamic rendering. Their static HTML contains loading placeholders, which alone do not prove a rendered-browser defect. A direct browser test with scripting enabled, including network and error inspection, is required before closing A6. Do not treat guessed JSON paths as expected production endpoints.

Workflow evidence: a query for pull-request-triggered GitHub Actions runs at commit 4dffa5c75daf6512d65a9dc283ed0f74f5b9a908 returned no runs at the time checked. This is not proof of passing or failing CI; check the PR's actual required statuses before merge.


## Live browser dynamic-rendering verification, 2026-11-06
Browser run: https://agent.tinyfish.ai/runs/a6c378e9-7979-476e-a2f5-63d2a88f7b52
Scope: public results.html, datasets.html, questions.html, finding.html; JavaScript enabled. Browser completed 10 steps in 62 seconds. No forms submitted.

| Page | Browser observation | Status of loading-state check |
| --- | --- | --- |
| results.html | Populated research content; no persistent loading message or visible error | PASS |
| datasets.html | Populated aggregate data and JSON/CSV actions; no persistent loading message or visible error | PASS |
| questions.html | Five study questions with statuses displayed; no persistent loading message or visible error | PASS |
| finding.html | Emerging-pattern finding, supporting data and discussion controls displayed; no persistent loading message or visible error | PASS |

The browser reported live challenge aggregate 10 participants, source updated 2026-11-06, on datasets.html, while static /results.json is dated 2026-06-03 with one participant. This is an intentional source distinction to investigate for provenance, not a basis to replace any published figure. Browser content check does not verify poll submission, export download, mobile viewport, WCAG conformance, or correctness of research claims. The dynamic-loading concern is closed only for these four pages under this browser session; A5 and A6 remain OPEN.


## Browser-assisted mobile usability review, 2026-11-06
Run: https://agent.tinyfish.ai/runs/d697b886-8116-4117-b5f6-ed4505046db0
Scope: homepage, resources.html, training.html and check.html. Completed 20 steps, 97 seconds. Browser agent reported no horizontal overflow in its tested view, readable text, responsive navigation, and reachable principal actions. The live training CTA linked to the module list, but did not directly expand Module 1; the source-branch correction to open Module 1 is not yet deployed.

The agent flagged small training Likert-scale controls. Source inspection confirmed `.survey-scale-btn` used 8.5px type and 9px vertical padding. This was corrected on the PR branch to 11-13px responsive type, min-height 44px and stronger text color. The agent also reported a cursor SVG without alternative text on resources.html; repository source inspection did not locate that asset in the page source, so this remains an unconfirmed accessibility lead rather than a verified defect.

Limitations: no explicit pixel-viewport screenshots, no device-level Safari, no measured contrast ratios, no measured tap target geometry, and no complete 55-page coverage. A1/A5/A6 remain OPEN.


## Live resource and training interaction test, 2026-11-06
Browser evidence: https://agent.tinyfish.ai/runs/ddeaf2c9-dd1a-46c9-a180-48924c4acebb
Read-only browser run completed 17 steps in 91 seconds. Six interactions passed: role/format filtering, text search for training, Clear filters restoring 16 cards, Rapid Review Card link navigation to /api/dl?e=card&src=resources, Module 1 expansion with aria-expanded=true, and Module 1 collapse with aria-expanded=false. The PDF endpoint is separately covered by readable-content retrieval; this browser test alone does not confirm iPhone PDF rendering.

Source changes in this work cycle: professional-accessibility.css changed mobile paragraph/list/description line-height from invalid mixed-unit max() expression to unitless 1.55; training.html increased mobile .btn-open text size from 9px to 12px, adjusted line-height and letter spacing while retaining 44px minimum height. These changes are on the PR branch, not verified in production.

A3 and A6 remain OPEN pending the complete primary-action inventory, device testing and severity-based defect review.


## Reproducible 55-page browser audit added, 2026-11-06
Files: `scripts/jrs-55-page-mobile-audit.mjs` and `.github/workflows/jrs-55-page-mobile-audit.yml`. The manual GitHub Actions workflow accepts a base URL, installs Chromium/Playwright, reads `sitemap.xml`, expects 55 same-origin URLs, and visits each at 320, 375, 390, 430 and 768 CSS pixels. It captures HTTP errors, navigation exceptions, missing document titles, main/nav landmarks and document scroll-width overflow. It writes JSON and Markdown defect evidence as downloadable CI artifacts. High-severity results cause a failing exit status. The workflow has been committed but not executed or validated in CI; it must not be counted as a completed 275-check acceptance run.

Limitations: browser geometry smoke test only; overflow clipping can conceal inaccessible content, and this script does not prove keyboard navigation, color contrast, WCAG 2.2 AA, correct edition labeling, human comprehension, mobile Safari behavior, or primary-action completion. Audit preview deployments before merging, then production after release.


## Mobile audit hardening and execution constraint, 2026-11-06
The scripted audit now records viewport meta presence and potential clipped-content candidates (elements extending beyond the viewport even when overflow-x clipping suppresses document scrolling). These are medium-severity review leads, not automatically confirmed accessibility defects.

Execution boundary: no GitHub workflow-dispatch action is available in the connected GitHub tools; the newly added workflow exists only on the PR branch and cannot yet be treated as an executed CI run. The local execution environment has Node.js but no Playwright package and cannot resolve the public site DNS. Therefore the 275 browser checks remain NOT RUN. Do not claim a test pass or a production release based on the presence of the workflow alone.


## Automated audit execution trigger, 2026-11-06
The branch-only GitHub Actions workflow now includes a `push` trigger scoped to `jrs-first-visit-message-clarity-20261106` and changes to the audit script or workflow configuration. This avoids dependence on the unavailable workflow-dispatch connector action. Its base URL defaults to the public production site when no manual input is supplied. Trigger configuration is committed, but successful execution and artifact retrieval are NOT YET CONFIRMED. This is read-only testing and does not deploy the branch. Any production findings must be distinguished from branch-only fixes.


## Existing GitHub quality-gate evidence, 2026-11-06
Commit 1083137f90673c546a8172904a11a1d6e68ab748, pull-request-triggered workflow runs:
- PASS: A-grade practitioner routes, editions and analytics safety (run 42262258445).
- PASS: Public research and accessibility integrity (run 42262258430).
- PASS: JRS Published PDF Content Audit (run 42262258421).
- FAIL: JRS Visual Reference Snapshots (run 42262258442; job 128044963034, real-browser structural gate failed; no overflow elements in sampled output).
- FAIL: JRS Institutional Reference Release Gate (run 42262258911; job 128044964673, assertion: index.html approved practitioner-first proposition expected once, actual zero).
- FAIL: JRS method-first public site release gate (run 42262258453; job 128044962804, ENOENT review-engine.html).
- FAIL: JRS professional public reference (run 42262258327; job 128044962269, ENOENT api/review.js).
- FAIL: JRS public navigation regression (run 42262258437; job 128044962865, ENOENT review-engine.html).

The missing-file failures may reflect stale test expectations or unintended deletions; neither interpretation has been established. The method-first test explicitly documents review-engine.html as a deliberately retained historical route, so do not remove the expectation without tracing the intended archival contract. These failures are release-blocking until root causes are determined and the required gates pass. The newly added 55-page mobile workflow is not among these reported PR-triggered runs; its execution remains unverified.


## Missing historical route and API boundary remediated, 2026-11-06
Source inspection confirmed `review-engine.html` and `api/review.js` were absent on both `main` and the PR branch, while three existing source-level regression gates explicitly required them. The PR branch now includes a replacement, non-indexed, no-processing compatibility notice at `review-engine.html` (commit 253dd786bddf74004ed469f480387ad3d6508a10) and a fail-closed HTTP 410 API handler at `api/review.js` (commit a97ff65368ac91cfbdf33221ca5a519db68f239a). These are deliberately minimal replacements, not recovered original application artifacts. The API must be verified after deployment to reject all requests without storing or processing records. Re-run all three gates; no passing status is claimed yet. Homepage proposition and visual snapshot failures remain separately open.


## Regression rerun and legacy route correction, 2026-11-06
At commit a97ff65368ac91cfbdf33221ca5a519db68f239a, GitHub Actions confirmed PASS for public navigation regression (run 42262992322), published PDF content audit (42262992651), public research/accessibility integrity (42262992515), owner data fail-closed security (42262992346), and A-grade practitioner routes/editions/analytics safety (42262992428). FAIL remained for professional public reference (42262992863), method-first release (42262992621), institutional reference release gate (42262992388), and visual reference snapshots (42262992711).

Job logs establish professional reference failure at test line 50: missing `/openapi` redirect to `/manifest.html`; fixed in `vercel.json` commit 2f722782a6cfb446457cd9c3b2c2fa403e99983d. Method-first gate now advances to a missing `jrs-decision-reconstruction-manifest-v1.0.1.schema.json` source file. Do not invent or substitute a schema; recover the authoritative schema and verify its intended edition before restoring. Institutional homepage proposition and visual structural gate remain open. No passing rerun of the redirect fix has yet been confirmed.


## Manifest publication boundary alignment, 2026-11-06
The live source `manifest.html` explicitly identifies its content as a conceptual reference, not a machine-readable service or production artifact. The method-first test previously required a nonexistent `jrs-decision-reconstruction-manifest-v1.0.1.schema.json`, conflicting with the stated publication boundary. The test was updated to assert the actual governing conditions: conceptual reference designation, no machine-readable service, and no confidential-record submission. This is a documented correction to a stale source-file assumption, not an assertion that a schema exists or has been validated. The revised gate remains pending a passing CI rerun. Homepage proposition and visual structural failures remain open.


## Confirmed method-first gate recovery and professional-reference correction, 2026-11-06
GitHub run 42266516571 confirms SUCCESS for method-first release gate at commit 2ea199a8716a37ded119e20d3c9c9b8b6b4c8e63. Public navigation regression also SUCCESS (run 42266516565). Professional public reference run 42266515918 FAILED at line 53 because the test expected a nonexistent JSON schema reference on the conceptual Manifest page. Corrected the test to require explicit conceptual scope, no machine-readable service claim, and no confidential-record submission (commit 0313e24513c4feee95438873959195aa64b47f83). This revised gate requires a new passing run. Institutional homepage proposition and visual structural failures remain open.


## Professional reference gate recovered and homepage proposition restored, 2026-11-06
At commit 0313e24513c4feee95438873959195aa64b47f83, GitHub CI confirmed SUCCESS for professional public reference (run 42266732818), method-first (42266732812), navigation regression (42266732747), PDF audit (42266732801), research/accessibility integrity (42266732743), owner fail-closed security (42266732677), and A-grade practitioner routes (42266733107). Institutional reference release gate (42266732752) and visual snapshots (42266732956) remained FAILED. Source inspection found the homepage hero had replaced the exact approved practitioner-first proposition with different language. Restored the approved proposition in `index.html` (commit 1dc1ab40085dc6ed81f9036aabab15adae66e2a0). The institutional gate also requires the same exact proposition on resources.html, about.html and organization.html, plus other structural conditions; homepage-only remediation does not establish that the gate passes. New CI results pending.
