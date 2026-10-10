# Failure Mode Register

**Date:** 2026-10-10 · Scope: the local assurance package around the Review Engine candidate. Coverage refers to `tests/engine-assurance/run.mjs` sections (T:x) and replay fixtures (R:SAE-nnn). "Human escalation route" means the item is surfaced in the envelope for the human reviewer, who is always required.

| ID | Failure mode | Trigger | Engine response | Human escalation route | Test coverage |
|---|---|---|---|---|---|
| FM-01 | Favourable result without evidence | Candidate says pass/gap with no quotation | `review_required`, basis `no_source_anchor_supplied` | Reviewer decides the condition | R:SAE-023; T:I |
| FM-02 | Fabricated citation | Candidate quotation absent from record | Quotation not reported; note withheld; `review_required`; `candidate_citation_not_found` withhold entry; no Manifest | Reviewer sees the withhold entry | R:SAE-014; T:D |
| FM-03 | Regulated content missed by the gate | Phrasing outside the lexical list (for example "staff member's termination") | **Not refused.** Proceeds to analysis | None automatic; reliant on scope declaration and human review | **Not covered.** Known gap |
| FM-04 | Incidental mention refused | In-scope record mentions, for example, "insurance" | Refused as `regulated_domain_content` | Human re-routes; refusal is recoverable | T:P positive controls cover "promotion to production" and "professional judgment" only |
| FM-05 | Paraphrased or encoded prompt injection | Injection not matching the patterns (other language, base64, homoglyphs) | **Not refused**; the mock candidate is unaffected, a live model might be | Human review of all outputs | **Not covered** beyond SAE-011 and T:P. Known gap |
| FM-06 | Incomplete record treated as complete | Gaps without placeholder tokens | Proceeds | Condition outcomes or CC controls may surface it | Partial (R:SAE-010 placeholder only) |
| FM-07 | Oversize record partially assessed | Record over 8000 characters | Refused, not truncated | Human splits or summarises under a recorded procedure | R:SAE-019 |
| FM-08 | Invalid candidate output | Unknown status label, malformed JSON | Fails closed: all `not_assessed`, `candidate_output_invalid` | Human re-runs or reviews manually | R:SAE-026; T:H |
| FM-09 | Present but non-supporting quotation | Real record text that does not support the finding | **Reported as supported or gap** (presence only) | Span limitation on every finding; CC controls may flag | R:SAE-027 demonstrates it. Inherent to the method |
| FM-10 | Unsafe claim in candidate note | Note asserts compliance, certification, validation | Note withheld; `review_required` | Withhold entry | R:SAE-025; T:M |
| FM-11 | review promoted to supported | Code or tampering | Rejected by envelope rule R6 | Envelope invalid, run errors | T:J |
| FM-12 | Version drift | Envelope, Manifest or request versions disagree or are unknown | Gate refusal or envelope rejection (R10) | Run errors | T:B, K; R:SAE-021 |
| FM-13 | Claim guard misses or over-blocks | Negation beyond 8 words; claim phrased without a guarded term (for example "ready for production use") | Missed claim passes, or a legitimate sentence fails | Human document review | T:M cases; residual risk accepted |
| FM-14 | Schema drift | Schema edited without record | Pin test fails | Change must be logged in CHANGELOG | T:G |
| FM-15 | Network use outside trapped APIs | Native addon or child process opening a socket | Not trapped | Host egress control | Not covered; package uses neither |
| FM-16 | Provider configured in environment | Credential or endpoint variable set | Harness exits 3, nothing runs | Operator unsets variable | T:N |
| FM-17 | Source identity unverifiable | Shallow clone, missing git history | `candidate_core_provenance_not_verified` recorded; run continues | Reviewer sees status in envelope | Reported path only; not exercised in this clone |
| FM-18 | Record-control false positive | Acceptable text matches a lexical pattern | Detection routed to human | Human dismisses | Two found and fixed during build (CHANGELOG); others likely |
| FM-19 | Record-control output drifts into describing a person | Template edit | Test fails | n/a | T:O vocabulary scan |
| FM-20 | Fixture pack reused as evaluation evidence | Misuse of synthetic pack | n/a | Register, envelope L-02 and protocol prohibit it | Documentary control only |
| FM-21 | Manifest read as an overall pass | Manifest `routing: ready` from v1 | Envelope gives no overall result; Manifest only when nothing downgraded | Reviewer instructed by CD-001 | Partial: T:Q |
| FM-22 | Duplicate quotation location ambiguous | Quoted text appears more than once | First occurrence offsets reported; `occurrence_count` > 1 | Reviewer checks other occurrences | Field present; no fixture exercises count > 1 |
