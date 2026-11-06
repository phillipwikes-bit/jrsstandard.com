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
