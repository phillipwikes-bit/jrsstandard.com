# JRS public website: accessibility and release acceptance record

Record date: 3 November 2026. Scope: public practitioner pages and nine published PDF identities. This record is an engineering acceptance aid, not an independent accessibility certificate.

## Evidence-based release posture

The production site had a READY Vercel release for merge commit `8e12c5978e0a1e2028d7b45dbd949e5f44b6337e` when the present remediation began. Later changes must be checked against their own exact deployment identity. A passed local or GitHub source check is not proof of a matching hosted release.

The latest source enhancements address the edition and organizational guide heading hierarchy, keyboard focus treatment under high contrast, and an expanded Chromium fixture for four widths. The fixture tests the published guides' heading levels, skip link, table caption/header scope, menu disclosure state, Escape behavior and horizontal reflow. Passing it does not constitute independent WCAG 2.2 AA acceptance.

An inventory of the **nine unchanged published PDF files** now reports visible structural-marker presence and identifies missing evidence. It never asserts reading order, correct semantic tagging, alternative text, screen-reader performance or PDF/UA conformance from the existence of marker bytes. Missing markers are a blocker for claiming tagged accessible PDFs. The existing edition identities and binary hashes remain locked.

## Open acceptance gates

| Gate | Required acceptance evidence | Current disposition |
| --- | --- | --- |
| Web keyboard operation | Sequential focus, activation, modal escape, return focus and active states tested by a competent reviewer on representative routes | Automated test coverage; independent review NOT ASSESSED |
| Screen reader | iPhone VoiceOver with Safari and at least one desktop screen reader/browser, headings/landmarks, announcements, controls, error messages | NOT ASSESSED |
| Zoom and reflow | Browser zoom at 200% and 400%, no omitted information or two-dimensional scrolling except legitimate tabular cases; capture screenshots and defects | NOT ASSESSED |
| Visual appearance and contrast | Exact release-commit hosted screenshots reviewed at 320/390/768/1440, text contrast measured, focus and high-contrast modes inspected | Source tests available; protected-hosted visual check NOT COMPLETE |
| Published PDFs | Controlled accessible reissue from authoritative source; validate tags, reading order, tables, alt text, bookmarks, language and text extraction; inspect with assistive technology | NOT CERTIFIED; source editions remain unchanged |
| Release identity | Confirm live custom-domain deployment SHA, static assets, final PDF destinations, no unexpected public files, safe owner sign-in and Review Engine closure | Must be repeated for final merge SHA |
| Competing deployment checks | Dispose of separate Cloudflare status with evidence. Do not alter DNS or activate Cloudflare merely to obtain a green status | Open |
| Independent release acceptance | Reviewer identity, date, tested build SHA, device/software versions, defect log, retest record and explicit accept/reject decision | NOT RECORDED |

## Procedure for accessible PDF reissue

1. Identify the authoritative editable source and existing PDF edition. The Standard PDF v2.0 is not silently interchangeable with online method v1.0.
2. Generate a separately reviewed, semantic-tagged candidate with document language, heading hierarchy, tables and alternative text. Retain source-to-output correspondence.
3. Check PDF structure using a PDF/UA-capable validator and manually inspect reading order, bookmarks, tables and links. Validate actual screen-reader operation. A machine-readable text extraction check alone does not suffice.
4. Obtain owner approval for an edition-aware, separately labeled accessible reissue. Update the version/asset manifest and any affected download, citation and historical crosswalk deliberately. Preserve the previous PDF binary and source history.

## Decision rule

**Full accessibility and release-quality certification is NOT ESTABLISHED.** Do not issue a new grade, WCAG certificate, PDF/UA declaration, or final acceptance solely from green CI. Maintain an explicit distinction between implemented engineering controls, repeatable automated checks, independent accessibility results and the owner-authorized production release.
