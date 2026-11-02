# JRS Public Website: A-Level Release Acceptance Register
Status: open for verification
Baseline: 2026-11-02 production main at `b8664b37fd9ab5c77c1b1f3fa2a2b8a6505a76e0`
Corrective branch: `fix/jrs-training-mobile-a11y-quality-2026-11-02`
Scope: public web pages, practitioner resources and optional reviewer training.

## Evidence rule

A successful source test, HTTP 200 response, preview build, screenshot, or nominal numeric score is not by itself an accessibility or training-acceptance pass. Mark a criterion **PASS** only when the required measured evidence exists for the exact release commit. Do not merge, promote, or claim an A-grade site from a partial test set. Protect private owner routes, training consent, the Review Engine restrictions and all published PDF binary identities.

## Required benchmarks

| Category | A / PASS condition | Current verification boundary |
| --- | --- | --- |
| Typography | Normal body copy legible at 16px or greater; mobile form controls 16px; captions and labels remain legible; 200% text enlargement without loss of content or function; no important text clipped at 320px | Shared CSS now enlarges 7.5-11px inline training labels; 232 viewport samples cover 320, 390, 768 and 1440px. Device enlargement unverified |
| Appearance | Institutional navy/light/gold presentation consistent across all current public pages, including retained legacy pages; no visual regressions at 320, 390, 768 and 1440px; correct semantic emphasis | 26 computed-theme samples on 13 routes, 21 focused local layout samples, 232 source-rendered viewport checks; full manual review unverified |
| Mobile usability | Main actions visible early; no horizontal overflow; site menus operable by touch/keyboard; form fields, tabs and actionable controls satisfy target-size acceptance; portrait and landscape mobile tested | Chrome checks at 320, 390, 768 and 1440px; target-size candidates are logged; touch, orientation and physical devices unverified |
| Accessibility | Target WCAG 2.2 AA. Correct headings, names, roles, state, contrast, focus, live announcements and keyboard flows; iOS Safari VoiceOver, Android TalkBack and 200% zoom tested. Do not claim independent certification without it | Training modal, focus, module progress and representative source checks implemented; independent tests outstanding |
| Relevance | All four principal practitioner pathways open the method, resources, evidence and training with accurate editions, limitations and functional internal links | 47-page link/asset source gate; professional review remains discretionary |
| Institutional credibility | Source/edition identity, provenance, research limitations, non-certification wording and protected owner/data boundaries are consistent; no credential is represented as independently verified unless server-validated | Edition and PDF identity guards pass. Historical reviewer receipt now requires private issuer-record code/name match; live database compatibility still needs protected-preview acceptance |
| Training | Six free modules open without enrollment; progress survives reload locally; disclosure, simulations and keyboard transitions work; optional consented enrollment and completion receive explicit durable acknowledgements; locally generated PNG renders and downloads safely; no remote write without consent | Local source/browser behavior test and PNG harness; authenticated live enrollment-to-database write and iPhone acceptance unverified |
| Public PDFs | Nine linked PDFs respond 200/application/pdf, retain exact approved identities, and satisfy separately assessed tags/reading order/contrast/alternative-text requirements where applicable | HTTP and exact identity verified; accessibility/tagging/controlled master reissue unverified |

## Release-gate checklist

- [x] Existing production commit and preview protection preserved during corrective development.
- [x] Source gates for core routes, documents, mobile structure and training completion regression are configured.
- [x] Regression coverage for keyboard enrollment dialog, six-module completion and a live-announced progressbar added.
- [x] Training API responses do not reveal service-key existence or raw database error diagnostics.
- [x] Historical reviewer evaluation receipts now fail closed on fabricated codes, unmatched names, missing issuer records and database failures; input title cannot override the recorded title. Privacy-preserving POST is supported while historical GET links remain readable.
- [x] Public historical receipt form no longer claims self-issued training competence or promotes unsupported LinkedIn professional credentials.
- [x] Four responsive widths (320, 390, 768, 1440px) and all 58 enumerated public/retained routes are included in the 232-case source-rendered Chrome audit.
- [ ] Supporting GitHub checks successful on final PR head.
- [ ] Protected Vercel preview `READY` for exact PR head; authenticated hosted source, CSS and nine PDF checks.
- [ ] Browser viewport visual review at 320, 390, 768 and 1440px, plus 200% text enlargement and keyboard-only traversal.
- [ ] iPhone Safari VoiceOver and Android TalkBack acceptance by human testers.
- [ ] Consent-controlled end-to-end enrollment and completion verified without writing fabricated participant records.
- [ ] Audit of all nine PDF editions for tagging, reading order and readable print; authoritative master required before any reissue.
- [ ] Manual review of the full current sitemap, including redirect, private, historical and study-only routes by correct category.
- [ ] Explicit release approval for final exact commit; verify canonical aliases and owner sign-in after production build.

## Outstanding risks

1. **Server-side training completion is self-attested.** The public six-module participation record is not a scored assessment of competence. Continue to describe it as a completion record, not accreditation or third-party certification.
2. **Historical reviewer receipt authenticity:** The print endpoint now validates codes and names against the private historical `pilot_contacts` issuer record and takes name, title and issue date only from that record. Its acceptance still requires a consent-controlled protected-preview lookup of authentic historical data without disclosing identities or writing research records. Do not represent this historical evaluation receipt as independently assessed training competence.
3. **Accessibility:** The presence of accessible markup and passing automated checks does not replace screen-reader interaction testing.
4. **PDF version integrity:** Standard PDF v2.0 and related public PDFs are versioned publications. Do not silently overwrite them merely to harmonize typography.
5. **Vercel preview quota:** An exact-head preview can be blocked by the Hobby deployment limit even when source tests pass. Do not disable authentication or change billing without authorization.

## Grading and closure

The previous overall 83/100 is a provisional professional judgment, not a reproducible WCAG result. An institutional A grade requires category scores of at least 90/100 on a published reproducible rubric **and** PASS on accessibility, training data handling, edition identity and hosted-release gates. Any unverified mandatory gate is reported as **NOT VERIFIED**, not converted to a passing numeric score.
