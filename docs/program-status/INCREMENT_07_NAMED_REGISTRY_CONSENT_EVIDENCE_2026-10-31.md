# Integrated Master Program, Increment 07: named registry consent and truthful completion
**Controlling edition:** JRS / DRR / Decision Spellchecker, Issue 3.2, sections 3.2-03 through 3.2-07 and PST-04/06/08.  
**Execution date:** 31 October 2026.  
**Authority:** Development and synthetic tests only. No owner approval for production.  
**New branch:** fix/jrs-support-registry-consent-integrity-2026-10-31, stacked on draft PR #61.

## Evidence-backed defects
Source review of the existing `supported.html` and `api/support-join.js` found:
1. The page unconditionally announced "Your support is counted" and thanked the visitor, although direct navigation, automated requests and rejected database writes could all reach a thank-you display without a verified support event. A query parameter is not an independently verifiable receipt.
2. The voluntary registry form submitted `consent_transfer:true` and `consent_listed:true` despite offering no separate transfer consent and only one optional public-listing checkbox. This is a provenance and consent-scope defect.
3. The named registry API accepted cross-origin POSTs (wildcard CORS), exposed service configuration via GET, and could return the upstream database error body to the requester. Those are avoidable data-handling risks, not evidence of a confirmed breach.
4. The existing form could write names and emails to the real contacts table from a preview inheriting a service key, contaminating records.
5. The same page invited visitors to paste up to 25 of their own records into a purported public diagnostic, contrary to the currently closed/local-only Review Engine status.
6. The form displayed a success message for `{ok:true}` without requiring an explicit storage-acknowledged `recorded:true` response.

## Targeted correction in this draft
- A plain-language, content-level statement replaces any automatic support-count receipt. The `r=1` URL hint and cookie cannot be relied upon by a static page as authoritative per-person evidence. Navigation does not automatically establish a supporter, and the page does not claim that it does.
- The named registry remains optional and independent of free JRS/DRR resources. Its form now submits private-storage/contact consent only when checked, and a distinct public-listing Boolean exactly matching the visitor's optional checkbox. `consent_transfer` is always false because this surface has no transfer-choice mechanism.
- The API enforces POST, exact same-origin, JSON, a 4 KB body ceiling, typed and bounded fields, affirmative consent, a separate optional public-listing value, server-enforced no-transfer semantics and no-writes in preview or missing/unknown deployment environments.
- HTTP/JSON responses have private non-cache headers and no wildcard CORS. Storage/network errors become a generic 502, without exposing raw database diagnostics, names, emails or credentials.
- A green API acknowledgement is required before the page reports registry completion. The public resource link remains open and does not invite submission of real or confidential records.
- The external training wording no longer implies professional accreditation. The privacy notice explains the separate named registry, individual rather than institutional assent, and the limits of historical consent.
- All existing contact/source records, original 24-file JRS source freeze, older direct campaign URLs and data tables remain untouched. This change is not a purge, backfill, reclassification or statutory compliance certification.

## Controlling interpretations and residual risks
- A recorded HTTP 2xx database write confirms that the request was accepted, not independent receipt evidence, a person identifier, organizational backing or durable delivery under disaster recovery.
- The API validates submitted Boolean consent, but a scripted client could forge those values. This is not a substitute for anti-bot/rate-limit controls or an independently verified affirmative-human act.
- Historic supporter rows with `consent_transfer:true` or `consent_listed:true` MUST NOT be retrospectively treated as rights grants or fully verified consent. Access to live original rows requires separate lawful owner-controlled review.
- The historic GET-based campaign support links still exist and retain their own semantics; direct visitors cannot be silently reclassified.
- No test of anonymous Supabase RLS, valid signed owner login, downstream email notifications, session revocation, or fixed-cutoff historical counts has been completed by this patch.
- A previously shared temporary owner credential requires protected rotation before any private dashboard is enabled. Deployment usage remains limited by the Vercel team's daily cap. Neither issue can be repaired by changing static page text.

## Release acceptance
A reviewer must confirm (1) the exact SHA and test pass, (2) no unexpected source-frozen changes, (3) privacy notice and page language match, (4) safe read-only preview behavior, (5) named registry proof under authorized isolated synthetic write/read conditions only, (6) historical counter baseline and record-level consent treatment, (7) error/no-write behavior, (8) owner authentication and RLS, and (9) exact-SHA owner production approval and rollback.

**Disposition:** DEVELOPMENT ONLY / PRODUCTION HOLD.  
**Separate Decision Spellchecker:** R6 remains constructed-case developer evidence. No original product source recovery, independent H2-versus-H3 product study, buyer offer or transferable rights lot has been established by this increment.
