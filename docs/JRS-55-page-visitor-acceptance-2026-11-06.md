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
