# JRS accessibility and release witness protocol

**Control:** Independent acceptance worksheet  
**Prepared:** 3 November 2026  
**Applies to:** The final accepted GitHub commit and its exact, protected Vercel deployment, not an earlier or merely source-rendered version.

This protocol does not itself establish conformance. The evaluator must enter a dated observation for each test. A missing observation remains **NOT ASSESSED**, never PASS.

## Required audit identity

Record the GitHub commit SHA, Vercel deployment ID and immutable URL, production alias and assigned commit, evaluator name/role, test date, operating system, browser version, assistive technology/version and test data. Do not store bypass tokens, authentication state, real case records or personal submissions in artifacts.

## Independent web journeys

| ID | Scope and steps | Objective acceptance criterion |
| --- | --- | --- |
| W-01 | Homepage at 320, 390, 768 and 1440 CSS pixels. Visit the primary record check using keyboard alone. | Visible focus throughout; route opens without trapping focus; no unintended content loss or horizontal page scroll. |
| W-02 | Open and close the global site menu by keyboard, pointer and iPhone VoiceOver. Test Escape, moving focus outside, and current-page identification. | Menu state accurately announced; Escape returns focus; closing does not leave an invisible focus target. |
| W-03 | Resources: use search, select responsibility and format, clear filters and produce zero matches. | Visible items match criteria; status changes are announced; no focus loss; links remain operable without JavaScript. No query data is sent to analytics. |
| W-04 | Read the Standard and the editions table, including under 400% zoom and with a screen reader. | Heading order and table associations are meaningful; online method v1.0 is not falsely presented as Standard PDF v2.0. |
| W-05 | Training: open module zero, read questions, close it, then open and dismiss the optional named-record dialog using Escape and the Close action. | Accordion expanded state announced; modal has an accessible name, initial focus, contained focus and restored focus. No registration is required to study. |
| W-06 | Contact with `?category=accessibility`: inspect all labels and consent, deliberately trigger native validation on an empty form; do not submit. | Accessible-format category is preselected; validation and status are understandable without color alone. No personal details or inquiry delivered. |
| W-07 | Research summary and implementation scenarios at mobile width and 400% zoom. Navigate formula scroll regions and workflow strip using a keyboard. | Complete content is available and operable; any two-dimensional scroll is confined to legitimate data/diagram regions. |
| W-08 | Disable animation, enable system high contrast/forced colors and test both light and dark system preferences on key routes. | Focus is visible, contrast remains usable, and motion preferences are respected; no reliance on hue alone. |
| W-09 | Screen-reader navigation using iPhone VoiceOver + Safari and a desktop screen reader (NVDA + Firefox or another documented combination). | Logical headings, landmarks, link names, dynamic updates and interactive focus order across all primary journeys. |
| W-10 | Verify accessibility request and privacy statements on publicly linked pages. | Users can identify a usable assistance route, known PDF limitations, publication editions and data-handling restrictions without uploading records. |

Use separate dated observations for Chrome and Safari. Automated axe-core results are supporting evidence only and cannot substitute for W-01 through W-10.

## Published PDF acceptance

Nine published PDF identities are presently locked. In source audits, all nine lacked detectable structure trees. **A PDF will not be marked accessible on the basis of text extraction or the mere presence of tagging markers.** Each approved edition-aware reissue requires a verified editorial master, human text comparison against the original, a new controlled publication identifier or amendment record, tagged reading order and semantic headings, language metadata, links and tables, alternative text where needed, PDF/UA-capable validation, and actual screen-reader review. Keep the archived source publication available under its original edition identity. Do not assume the online method is a certified transcription of a different PDF edition.

For each reissue, record: original title, edition and SHA; reviewed master source; candidate SHA; page count; tag-tree validation; language; logical reading order; heading/table/link tests; screen reader and version; editor and reviewer sign-off; publication authorization and new destination. **No automatic reissue is approved by this protocol.**

## Hosted release identity and security

The release witness must verify the **same commit** in the GitHub head, immutable Vercel preview and final production deployment. Run the existing source-aware static byte checker against hosted assets and confirm all required PDF routes. Confirm public Review Engine remains closed to record submissions and that the private owner dashboard returns only the protected sign-in route for an unauthenticated visitor. Inspect any legacy Cloudflare failure independently. Do not disable preview protection, bypass SSO in source, or publish internal files to obtain a pass.

## Decision record

| Field | Recorded result |
| --- | --- |
| Tested GitHub SHA | NOT ENTERED |
| Hosted preview URL and verified SHA | NOT VERIFIED |
| Production deployment ID and matching SHA | NOT VERIFIED |
| Automated pages and dynamic states at exact accepted SHA | Await final candidate evidence |
| W-01 through W-10 witnessed results | NOT ASSESSED |
| Nine accessible PDF reissue results | NOT ASSESSED |
| Open severity-1/2 defects | NOT DISPOSITIONED |
| Independent evaluator and acceptance signature/date | NOT ENTERED |
| Release quality certification | **NOT ESTABLISHED** |

**Decision rule:** An internal design score or successful test suite cannot override a missing release identity, manual accessibility acceptance, or unresolved PDF structure requirement. A-grade readiness is a target to be established by complete evidence, not by numerical adjustment.
