# Decision Spellchecker / JRS: Inquiry Record Integrity Repair

**Prepared:** 2026-10-31  
**Classification:** Development branch, not production; controlled public-resource site transition.  
**Base:** draft PR #48, exact baseline SHA `6ec11a2ef2bf1bc0eccb669409e88bfb33778b07`.

## Observed defect and consequence

Before this increment, both `api/site-inquiry.js` and `api/enterprise-inquiry.js` cleaned message text with a generic function that stripped newline characters and silently limited the resulting text to 1,200 characters. An otherwise accepted inquiry could therefore be stored with an altered paragraph structure or without its final substantive information. This is a record-preservation defect affecting organisational inquiries and potential Decision Spellchecker licensing/acquisition screening, not proof of product inference failure.

## Changes, bounded scope

- Reject a field whose submitted string exceeds its documented limit before cleaning or storage; a 1,201-character note is rejected rather than accepted in truncated form.
- Preserve user-authored message paragraphs and text, normalizing only CRLF and bare CR line endings to LF.
- Reject prohibited control characters instead of silently deleting them from the note.
- Require 12 non-whitespace characters in the site-inquiry note.
- Leave Turnstile verification, same-origin JSON enforcement, contact consent, source partition, service-key handling, durable-save-before-alert and existing record schema unchanged.
- Do not modify already stored historical rows. No false claim that previously truncated text can be recovered.

## Test cases

Existing source tests `tests/site-inquiry.mjs` and `tests/enterprise-inquiry-gates.mjs` include added explicit checks of oversized field refusal, newline preservation, CRLF normalization and control-character refusal. Each test uses synthetic data and mocked external operations.

The development increment is not accepted on source inspection alone. Require a passing GitHub Actions run for the exact new SHA, inspect the PR diff and capture any failure. A passing CI run is developer-controlled regression evidence only.

## Release and buyer-evidence boundaries

This repair neither configures Turnstile, owner authentication, Gmail alerts, Supabase RLS, or production recovery nor proves a buyer exists. It does not change Decision Spellchecker v0.6.11 source, private workflow 0.7.0, the JRS Codebook, the 156-record study or the historical Engine `NO_GO_NOT_VERIFIED` decision.

Production release of draft PR #48 or this branch still requires owner authorization and the independent operational checks in the 30 October integrated programme. No live contact submission, deployment, credential action, data migration, outreach or rights transaction is authorized by this document.

## Follow-up gate

After current-regression acceptance, preserve a versioned test sample showing original user message, transmitted JSON message and stored mock message are the same, except declared newline normalization. Live database reconciliation and owner-screen device review remain separate unverified gates.
