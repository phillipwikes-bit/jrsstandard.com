# Quote Resolution Policy

Local ID: EGC-DOC-02 (NON-CANONICAL). Code: `lib/engine-evidence-graph/quote-resolution.mjs`.

## Claim
The candidate supplies quotations only. The compiler locates each quotation by exact string match, computes UTF-16 and UTF-8 offsets itself, and assigns one of six statuses. Only `verified_unique` and `verified_disambiguated` can become evidence.

## Local engineering evidence
Probes `q.*` in `tests/engine-evidence-graph/probes.mjs`; fixtures GC-006, GC-007, GC-009 to GC-013; mutations M-01 to M-08.

## Statuses
| Status | Meaning |
|---|---|
| verified_unique | Exactly one exact occurrence |
| verified_disambiguated | Several occurrences; one valid disambiguator selects exactly one |
| ambiguous | Several occurrences and no disambiguator selects exactly one |
| absent | No exact occurrence. Reason: `unicode` (matches only after normalisation), `whitespace` (matches only after collapsing whitespace), `case`, or `not_found` |
| malformed | Rejected before search: blank, leading or trailing whitespace, under 12 or over 400 characters, over half the record, elided (`...`, the ellipsis character, `[...]`), crosses a line break, heading only, truncated mid-word, crosses a section boundary, invalid disambiguator |
| not_assessed | No candidate, or intake stopped |

Disambiguators: `section`, `context_before`, `context_after`, `near_quote` (another quotation within 300 characters). A disambiguator that selects zero or several occurrences leaves the quotation ambiguous.

No normalisation is applied when matching. Near matches are reported, never accepted.

## Interpretation
A fabricated, paraphrased or stitched quotation cannot become evidence.

## Limitation
An exact quotation can still be taken out of context or attached to the wrong idea. The assertion compiler and human review address that partly; this policy does not.

## External evidence still required
Measurement of quotation behaviour of a live model under an authorised protocol (not performed).
