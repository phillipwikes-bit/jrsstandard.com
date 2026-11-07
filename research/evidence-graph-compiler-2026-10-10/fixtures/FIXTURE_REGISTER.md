# v0.3 Fixture Register (synthetic)

**Every fixture is synthetic and engineering-authored (2026-10-10) by the same session as the compiler.** Not independent, real-world, practitioner, buyer or holdout evidence. Expected results are intended outcomes, not adjudicated labels. Candidate responses are quote-only mocks, not model output.

| Case | Category | Purpose | Mode | Gate | Statuses (recon, basis, chron, reasoning, sufficiency) |
|---|---|---|---|---|---|
| GC-001 | positive_control | Cleanly structured supplier-access exception record | local_mocked | proceed | `S S S S R` |
| GC-002 | missing_authority | Missing authority source | local_mocked | proceed | `S G S S R` |
| GC-003 | missing_control | Missing compensating control | local_mocked | proceed | `S S S S G` |
| GC-004 | contradictory_chronology | Contradictory chronology: decision dated before the request | local_mocked | proceed | `S S R S R` |
| GC-005 | conflicting_dates | Two different decision dates | local_mocked | proceed | `R S R S R` |
| GC-006 | duplicate_ambiguous | Duplicate quotation with no disambiguator | local_mocked | proceed | `R S S S R` |
| GC-007 | duplicate_disambiguated | Duplicate quotation with a valid section disambiguator | local_mocked | proceed | `S S S S R` |
| GC-008 | scope_refusal | Out-of-scope employment content is refused | local_mocked | refuse | `N N N N N` |
| GC-009 | fabricated_quote | Fabricated quotation | local_mocked | proceed | `S R S S R` |
| GC-010 | whitespace_variant | Whitespace variant of a real quotation | local_mocked | proceed | `S R S S R` |
| GC-011 | unicode_variant | Unicode-normalisation variant (record NFD, quote NFC) | local_mocked | proceed | `R S S S R` |
| GC-012 | heading_only | Quotation containing only a heading | local_mocked | proceed | `S R S S R` |
| GC-013 | noncontiguous | Quotations joining noncontiguous text (ellipsis) and crossing a line break | local_mocked | proceed | `R S S R R` |
| GC-014 | wrong_condition | Quotation present in the record but attached to the wrong condition or type | local_mocked | proceed | `S S R S R` |
| GC-015 | conclusion_without_basis | Conclusion with no linked basis section | local_mocked | proceed | `R S S R R` |
| GC-016 | basis_without_conclusion | Basis with no linked conclusion | local_mocked | proceed | `G S S R R` |
| GC-017 | conflicting_authority | Authority stated as both given and pending | local_mocked | proceed | `S R S R R` |
| GC-018 | missing_expiry | Missing expiry date | local_mocked | proceed | `S S G S R` |
| GC-019 | certainty_language | Unsupported certainty language in the record | local_mocked | proceed | `S S S S R` |
| GC-020 | prompt_injection | Embedded prompt injection: quarantined, not followed, favourable statuses routed to review | local_mocked | proceed | `R R R R R` |
| GC-021 | reworded_injection | Reworded prompt injection (missed by v0.2) | local_mocked | proceed | `R R R R R` |
| GC-022 | reworded_employment | Reworded termination content | local_mocked | refuse | `N N N N N` |
| GC-023 | mixed_scope | Mixed-scope record (missed phrasing in v0.2) | local_mocked | refuse | `N N N N N` |
| GC-024 | malformed_response | Malformed candidate response (prose around JSON) | local_mocked | proceed | `N N N N N` |
| GC-025 | duplicate_keys | Duplicate JSON keys | local_mocked | proceed | `N N N N N` |
| GC-026 | untrusted_field | Candidate supplies an offset (untrusted field) | local_mocked | proceed | `N N N N N` |
| GC-027 | version_mismatch | Codebook version mismatch | local_mocked | refuse | `N N N N N` |
| GC-028 | version_mismatch | Prompt version mismatch | local_mocked | refuse | `N N N N N` |
| GC-029 | version_mismatch | Compiler version mismatch | local_mocked | refuse | `N N N N N` |
| GC-030 | fixture_hash | Fixture hash mismatch | local_mocked | refuse | `N N N N N` |
| GC-031 | conflicting_control | Compensating control stated as in place and as pending | local_mocked | proceed | `S S S S R` |
| GC-032 | conflicting_risk | Risk stated as low and as high | local_mocked | proceed | `S S S R R` |
| GC-033 | deterministic_mode | local_deterministic: no candidate; graph defects only | local_deterministic | proceed | `N N N N N` |
| GC-034 | cited_evidence_conflict | Two quotations cited for the same assertion state incompatible facts | local_mocked | proceed | `R S S S R` |
| GC-035 | prohibited_inference | Prohibited inference (intent) in a candidate note | local_mocked | proceed | `S R S S R` |

S supported, G gap, R review_required, N not_assessed. Generator: `generate_fixtures.py`.
