# Execution evidence: second-round advisory templates (2026-11-19)

## Origin
A practitioner reviewed constructed record AR-73 blind. DS-N1's output had been recorded, hashed and timestamped before the record was sent (engine 44a5a004). The practitioner raised seven points: DS-N1 matched three, partly matched one and missed three. DS-N1 raised nothing the practitioner missed. Comparison kept privately with the record.

## Changes (`detection-templates.mjs` 0.3.0-dev), all advisory, no status change
- `no_authority_basis_cited`: an approver is named but no policy, delegation or mandate is.
- `human_oversight_removed` (AI actions): the record removes human review.
- `amount_limit_without_volume_cap` (AI actions): an amount ceiling with no limit on how many or how often.
- `no_post_expiry_terms`: an end date with no renewal, review or automatic-stop terms.
- `date_not_in_sources`: a date the record states that no source gives.
- `conclusory_evidence_summary`: word list broadened to result phrasings such as "raised no concerns", "went smoothly", "without incident".

## Evidence boundary
- AR-73 designed these changes, so it is not evidence for them and is not used in tests.
- Tests use constructed record AR-62: each template fires on the deficient form and clears when the missing element is stated; class scoping is tested.
- `AUTH-P01` lacked a named authority basis, so `no_authority_basis_cited` fired on it. A supported statement (C8, cited to memo S3) was added; status unchanged (READY_FOR_HUMAN_FINALIZATION, no findings).
- Lexical lists only. False-warning rates NOT ESTABLISHED.
- Not addressed: order-versus-action ambiguity of a limit; the existing `no_stated_expiry_date` false negative on "thirty days overdue".
