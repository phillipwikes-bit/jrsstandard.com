# JRS accessibility execution status

**Date:** 3 November 2026  
**Candidate:** PR #117 following GitHub main `40989da675265894850463f99195971d9cc0f934`.  
**Test provenance:** Scripts imported without claims of independent authorship from PR #106 commit `332158028c49620eb21c5eb354e36faa4be53866`.  
**Scope:** Automated source-rendered checks, exact-candidate evidence preservation and release restrictions.

The source-rendered workflow is configured to run 48 reflow observations (24 routes at widths 320 and 400 CSS px), 48 pinned axe-core scans (24 routes at 390 and 1440 CSS px), and 14 dynamic interaction scans (seven states at two widths), with a strict JSON evidence parser and archived results. The four added public routes are Codebook, Review Conditions Reference, Independent Second Read and Adoption and Governance Language. Results for the enlarged route set remain pending at this change. Passing these tests would not constitute physical 400% zoom, VoiceOver, PDF/UA or independent WCAG conformance certification.

The existing nine PDF original editions remain locked and must not be silently replaced. The source inventory tests only marker presence and original Git blob identities. Tagged accessible reissues require verified masters, editorial equivalence, reading-order tests, language and link structure, human screen-reader inspection, edition controls and separate release approval.

The previous PR #117 exact-commit Vercel preview `dpl_8iRbPnnNzkPVTh4puRTGbnMpdPN2` was READY. Authenticated Vercel-connected HTTP fetches of homepage, seven-point check, Resources, Standard, Training and Research returned HTTP 200. The private dashboard returned HTTP 503 `owner_access_unavailable` (fail closed; owner login NOT VERIFIED); public Engine GET returned 405 (closed). These observations belong to the previous exact commit, not this new commit.

The GitHub hosted visual workflow failed because its dedicated protected-preview credential was not configured in Actions. Vercel connector access does not authorize GitHub Actions. Never disable protection or embed a bypass credential in a URL, log, commit or artifact.

**Uncompleted independent gates:** Approved GitHub Actions preview access, actual iPhone VoiceOver and desktop screen reader, witnessed 400% browser zoom, tagged and tested nine-PDF reissues, independent criterion-level WCAG review, exact production comparison, and dated owner acceptance. Release status: HOLD / NOT CERTIFIED.

## Additional reviewer-output verification (3 November 2026)

The seven-point check now has a separate synthetic two-selection Chrome DevTools Protocol print witness. It verifies that a populated review summary retains the two review prompts, the question count and non-scoring warning, and that navigation and website actions are excluded from the printed PDF. The companion browser test simulates clipboard denial and confirmed fallback success, verifies that temporary fields are removed and focus is restored, and checks that no answer is transmitted.

These are scripted browser and printed-text tests, not practitioner case studies, physical 400% browser-zoom evidence, human VoiceOver testing, tagged-PDF accessibility or an independent WCAG/PDF/UA certification. No real case record or participant data is used in these fixtures.

## Evidentiary boundary for portable check outputs

The seven-point check's constructed-corpus benchmark remains visible on the website as research context. It is deliberately excluded from copied and printed single-record summaries. The portable note contains the chosen review questions, instructions for source verification, the generation date and the non-certification warning. This avoids presenting group-level detection accuracy as supporting a particular record's findings. A separate extracted-PDF witness normalizes whitespace before comparing complete required phrases and rejects accidental inclusion of navigation, action controls or research accuracy statistics. The original PDFs remain unchanged.


## Expanded-scan defect and targeted correction, 3 November 2026

Source commit `2c266ee8a50ef176be77418f1193808a514f0840` expanded the test population from 20 to 24 public routes. Its GitHub Actions reflow run completed **48 of 48 layout observations successfully**. Its axe-core scan **failed**, identifying `link-in-text-block` issues on the Review Conditions Reference page (one link at both widths) and the Governance Adoption page (two inline links at both widths). The new parser correctly held the run rather than hiding those findings behind an aggregate grade.

The subsequent candidate adds persistent underlining to those in-prose links and a focused source regression while keeping the destinations, publication content and navigation controls intact. This is a **repair candidate** until the expanded browser scan is rerun successfully. It is not evidence of manual screen-reader conformance, PDF tagging or production parity.


## Third accessibility coverage expansion (3 November 2026)

This renovation candidate widens the source-rendered preflight from 24 to **34** public routes, producing **68** pinned axe WCAG-tagged observations and **68** narrow CSS-viewport reflow observations when completed. Newly included are the Reviewer Worksheet, Escalation Triggers, Record Survivability, Reviewer portal, Evidence Ledger, Datasets, Questions, Security, Results, and Finding. This is an **unverified new test scope** until exact-head CI completes. It intentionally retains fail-closed detection of violations and the separate release restrictions for a protected current-head preview, manual VoiceOver/NVDA, physical 400% browser zoom, published PDF accessibility, and owner authorization.


## Defects revealed by 34-route scan (November 3, 2026)

Commit `af1536dba6128dbacd59f05751df162b62f639a3` **passed all 68 reflow observations** but **failed** the expanded automated axe test. Issues were `link-in-text-block` on the breadcrumb links in three reference pages (two viewport widths each) and text `color-contrast` on the Reviewer primary training link, Security historical-note disclosure summary and Finding response submission button (two widths each). These are genuine new audit findings, not a failure of the release infrastructure.

The current repair candidate applies non-colour underline styling to all institutional reference breadcrumbs and explicit navy-on-white/white-on-navy contrast treatments to the three affected controls. The selected dark navy (`#173d5b`) has a computed relative contrast ratio of approximately **10.53:1** against the base institutional `#f5f7f8` background; white text against navy is approximately **11.32:1**. These calculations do not replace computed-style axe/assistive-technology verification. All fixes are provisional until exact-head 68-scan CI passes. No publication or dashboard authentication setting changed.


## Full public-route accessibility coverage candidate (November 3, 2026)

Following the 34-route source-rendered axe and reflow PASS at commit `413a94e08697bafe19cf7b588925bcdb114ed448`, the coverage expands to **60 distinct public HTML routes**. These comprise all **58 pages** in the existing source-rendered responsive inventory and two additional routes already included in the accessibility preflight (Editions and Organization). The exact-count parser now requires **120 pinned axe WCAG-tagged scans** at 390/1440 CSS px and **120 narrow-viewport reflow observations** at 320/400 CSS px. It continues to require 14 dynamic-state scans, reviewer print/privacy checks and separate PDF identity inventory.

**No pass is asserted for the enlarged matrix until CI completes on this specific revision.** All pages remain test fixtures only, with no live submissions; original PDFs, publication routes, Vercel authentication, production configuration and current release hold remain unchanged. Passing automated checks cannot certify human VoiceOver/NVDA experience, actual 400% browser zoom, PDF tagging, or production usability.
