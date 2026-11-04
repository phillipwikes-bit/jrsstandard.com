# JRS Accessibility and Release-Quality Acceptance Record

**Date:** 3 November 2026 (America/New_York)  
**Control:** Candidate micro-adjustment, not a conformance certificate  
**Scope:** Two new public guide pages, cross-site published-PDF inventory, and release evidence. The protected owner dashboard, closed Review Engine, source research, and published PDF files are outside this change.

## Implemented correction

The publication-editions and organizational-guidance pages now use a single page-level H1 and second-level headings for their four article cards. A narrowly scoped stylesheet retains the original article-card appearance without presenting a skipped H2 level to assistive technology. Existing skip links, native navigation, responsive layout, accessible-format contact category and edition wording are preserved.

The practitioner-release workflow executes `tests/jrs-accessibility-acceptance.test.mjs`. This checks the heading order, publication access link, valid accessibility inquiry routing and structural status of each of the nine protected published PDFs. The test reports missing PDF structure markers rather than misclassifying a normal source-test pass as an accessibility certificate.

## Evidence and disposition

| Acceptance condition | Evidence and limitations | Status |
| --- | --- | --- |
| Source-level heading sequence, skip links and accessible-format route on editions and organization pages | Current branch regression checks; heading order repaired | Test required on exact PR head |
| Sampled desktop/mobile behavior | Prior 58-route Chrome review at widths 320, 390, 768 and 1440 px passed on PR #102; it is historical evidence and does not automatically certify this branch | Prior sampled result, not full conformance |
| Protected preview identity and hosted screenshots | Existing hosted visual job cannot authenticate to protected Vercel preview because its dedicated GitHub Actions bypass secret is absent. Do not disable deployment protection or include the bypass value in a URL or repository file | **NOT VERIFIED** |
| PDF tagging and reading order | On 3 November 2026, six publicly served PDFs, including the Standard, Rapid Review Card, three investigator supplements and Reviewer Reference, contained no detectable `/StructTreeRoot` marker. Nine published original-file identities remain locked. Text extraction or valid PDF delivery is not tag validation | **NOT CONFORMANT EVIDENCE; REMEDIATION REQUIRED** |
| Physical VoiceOver, keyboard-only user journeys, zoom, contrast exceptions and dynamic-content announcements | Automated checks cover a subset of these requirements; no completed independent, device-specific user acceptance record supplied | **NOT VERIFIED** |
| Independent WCAG 2.2 Level AA evaluation for claimed site scope | Success criteria, complete pages, alternate versions and essential workflows must all be evaluated. There is no independent criterion-by-criterion sign-off | **NOT VERIFIED** |
| PDF/UA or equivalent accessible-PDF acceptance | Requires a controlled, accessible edition and examination of tags, reading order, links, headings, language and assistive-technology output. Tag-marker presence alone would not be sufficient | **NOT VERIFIED** |
| Production source and release identity | Earlier PR #102 commit `8e12c5978e0a1e2028d7b45dbd949e5f44b6337e` was READY and aliased to the public domains. Newer merge commits require independent live verification; PR #103 separately improved source-aware production checks | Verify exact newly published commit |
| Cloudflare legacy Worker check | Separate failed check without evidence that the Worker serves the production public domains. Do not deploy/enable a Worker to clear a status | **UNRESOLVED** |

## Minimum controlled completion sequence

1. Pass this branch's source and responsive-browser workflows at the exact head, with no source or PDF identity regressions.
2. Verify an exact-commit hosted preview through an approved authenticated route and preserve redacted, immutable visual and static/PDF delivery evidence. The GitHub Actions preview bypass secret must be configured by an authorized account operator, not written into project source or logs.
3. Perform documented keyboard and physical screen-reader acceptance on all primary JRS journeys, including menu open/close, Standard navigation, resource filtering, training exercises, contact inquiry and accessible-format request. Record tested device, browser, assistive technology, version, steps, actual outcome, severity and reviewer.
4. Prepare properly tagged accessible PDF **reissues** from verified editorial masters, preserving the original titles, edition provenance and archived bytes. Record content comparison, applicable edition/reissue identifier, language, heading/tag structure, logical reading order, link and table behavior, human reading review and approval. Do not silently substitute another edition or assume the online v1.0 methodology is equivalent to the published Standard PDF v2.0.
5. Complete an independent criterion-by-criterion WCAG 2.2 AA evaluation and an accessibility claim scoped to the actual tested pages and formats. Record the evaluator, date, exclusions, known exceptions, remediation and a review date.
6. Resolve the separate Cloudflare check by examining its actual authority and build logs. Preserve Vercel production routing and the closed Engine boundary.
7. Record the exact release commit, CI and Vercel deployment identities, live route results, PDF hashes and dated owner acceptance. A source-audit pass or visual grade does not replace any mandatory acceptance condition.

**Current disposition: NOT CERTIFIED.** The existing A- editorial/source assessment is provisional and must not be converted into a WCAG/VoiceOver/PDF/UA certification on this evidence.

Standards reference: W3C [WCAG 2.2 Conformance](https://www.w3.org/TR/WCAG22/#conformance) and [PDF Reading Order Technique](https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF3). Testing requires both automation and human evaluation; an automatically passed test is not an independent conformance statement.
