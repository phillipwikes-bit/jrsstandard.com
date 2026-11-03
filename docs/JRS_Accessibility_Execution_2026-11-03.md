# JRS accessibility execution status

**Date:** 3 November 2026  
**Candidate:** PR #117 following GitHub main `40989da675265894850463f99195971d9cc0f934`.  
**Test provenance:** Scripts imported without claims of independent authorship from PR #106 commit `332158028c49620eb21c5eb354e36faa4be53866`.  
**Scope:** Automated source-rendered checks, exact-candidate evidence preservation and release restrictions.

The source-rendered workflow runs 40 reflow observations (20 routes at widths 320 and 400 CSS px), 40 pinned axe-core scans (20 routes at 390 and 1440 CSS px), and 14 dynamic interaction scans (seven states at two widths), with a strict JSON evidence parser and archived results. Passing these tests does not constitute physical 400% zoom, VoiceOver, PDF/UA or independent WCAG conformance certification.

The existing nine PDF original editions remain locked and must not be silently replaced. The source inventory tests only marker presence and original Git blob identities. Tagged accessible reissues require verified masters, editorial equivalence, reading-order tests, language and link structure, human screen-reader inspection, edition controls and separate release approval.

The previous PR #117 exact-commit Vercel preview `dpl_8iRbPnnNzkPVTh4puRTGbnMpdPN2` was READY. Authenticated Vercel-connected HTTP fetches of homepage, seven-point check, Resources, Standard, Training and Research returned HTTP 200. The private dashboard returned HTTP 503 `owner_access_unavailable` (fail closed; owner login NOT VERIFIED); public Engine GET returned 405 (closed). These observations belong to the previous exact commit, not this new commit.

The GitHub hosted visual workflow failed because its dedicated protected-preview credential was not configured in Actions. Vercel connector access does not authorize GitHub Actions. Never disable protection or embed a bypass credential in a URL, log, commit or artifact.

**Uncompleted independent gates:** Approved GitHub Actions preview access, actual iPhone VoiceOver and desktop screen reader, witnessed 400% browser zoom, tagged and tested nine-PDF reissues, independent criterion-level WCAG review, exact production comparison, and dated owner acceptance. Release status: HOLD / NOT CERTIFIED.
