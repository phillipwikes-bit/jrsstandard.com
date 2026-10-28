# Corpus Construction Log

**Sealed owner-authored synthetic validation-readiness corpus, V0, 2026-10-25.** Not a holdout corpus and not an independent corpus. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## Method

- Author: Claude Code, drafting under the owner's direction (AI-assisted provenance, CLAUDE.md Rule 7). Every record, candidate response, Layer 1 fact and expectation is in `build-corpus.mjs`.
- Material: synthetic only. Every record begins with the label "SYNTHETIC DEVELOPMENT MATERIAL. NOT VALIDATION MATERIAL." All supplier names are invented and marked (fictional). No real person, organisation, record, source document, holdout or public material was used, and none of the three controlling source files was read.
- Expectations: written by hand from the frozen 0.3.1-candidate rules (sections, dated events, quote resolution, assertion markers, conflict detectors K1 to K6 and RP rule packs, condition rules, intake gate). **The Engine was not run, imported or consulted while building the corpus.** Expectations are owner-authored specifications, not ground truth.
- Candidate responses: mocked envelopes authored to exercise the compiler. They do not represent any model.
- Construction QA, without the Engine: every record carries the label; every quotation expected to resolve uniquely occurs exactly once; ambiguous and disambiguated quotations occur twice; absent quotations occur zero times. Result: 0 problems.
- Seal: `seal-corpus.mjs` writes `CORPUS_SEAL_MANIFEST_SHA256.txt` and `SEAL.json` (UTC timestamp). After sealing, `build-corpus.mjs` refuses to run, and the evaluator refuses to run unless the seal verifies with no added, missing or changed file.

## Composition

- Total 60: 40 protected evaluation records (EV-01 to EV-40), 20 adversarial or metamorphic records (ADV-01 to ADV-20).
- All five conditions are targeted: reconstructability, identifiable basis, chronology integrity, reasoning traceability, sufficiency.
- Per case: `cases/<id>.record.txt`, `cases/<id>.candidate.json` (mock transport behaviour), `truth/<id>.layer1.json` (Layer 1 facts), `expectations/<id>.expected.json` (expected mechanical behaviour, kept separate from the facts).

## Cases

| Case | Group | Purpose | Features |
|---|---|---|---|
| EV-01 | protected_evaluation | Benign complete record, parameter set 101 | benign_should_not_degrade |
| EV-02 | protected_evaluation | Benign complete record, parameter set 102 | benign_should_not_degrade |
| EV-03 | protected_evaluation | Benign complete record, parameter set 103 | benign_should_not_degrade |
| EV-04 | protected_evaluation | Benign complete record, parameter set 104 | benign_should_not_degrade |
| EV-05 | protected_evaluation | Benign complete record, parameter set 105 | benign_should_not_degrade |
| EV-06 | protected_evaluation | Benign: "promoted to production" homonym | over_refusal_trap, benign_should_not_degrade |
| EV-07 | protected_evaluation | Benign: "keeps their job scheduler" homonym | over_refusal_trap, benign_should_not_degrade |
| EV-08 | protected_evaluation | Missing decision basis section | missing_decision_basis, review_routing_trigger |
| EV-09 | protected_evaluation | Basis states neither reason nor source | missing_decision_basis, unsupported_reasoning |
| EV-10 | protected_evaluation | Missing decision section | incomplete_evidence_chain |
| EV-11 | protected_evaluation | Decision dated before the request | chronology_conflict |
| EV-12 | protected_evaluation | Two different decision dates | chronology_conflict, conflicting_sources |
| EV-13 | protected_evaluation | Risk assessment dated after the decision | chronology_conflict |
| EV-14 | protected_evaluation | Two different expiry dates | chronology_conflict, conflicting_sources |
| EV-15 | protected_evaluation | Stated duration does not match the dates | chronology_conflict |
| EV-16 | protected_evaluation | Open-ended expiry | incomplete_evidence_chain, false_reassurance_trap |
| EV-17 | protected_evaluation | No explicit dates anywhere | incomplete_evidence_chain, false_reassurance_trap |
| EV-18 | protected_evaluation | Decision text duplicated; quotation not disambiguated | ambiguous_quotation |
| EV-19 | protected_evaluation | Decision text duplicated; disambiguated by section | ambiguous_quotation, benign_should_not_degrade |
| EV-20 | protected_evaluation | Quotation differs from the record in case | ambiguous_quotation, false_reassurance_trap |
| EV-21 | protected_evaluation | Elided quotation | ambiguous_quotation |
| EV-22 | protected_evaluation | Negated rationale cited as reasoning | unsupported_reasoning |
| EV-23 | protected_evaluation | Basis restates the conclusion only | unsupported_reasoning, false_reassurance_trap |
| EV-24 | protected_evaluation | Authority named without identifier or date | incomplete_evidence_chain |
| EV-25 | protected_evaluation | No authority section | incomplete_evidence_chain, missing_decision_basis |
| EV-26 | protected_evaluation | No compensating control; candidate proposes a gap | incomplete_evidence_chain |
| EV-27 | protected_evaluation | Open-ended expiry; candidate proposes a gap | incomplete_evidence_chain |
| EV-28 | protected_evaluation | Authority stated as given and as pending | conflicting_sources |
| EV-29 | protected_evaluation | Control stated as in place and as planned | conflicting_sources |
| EV-30 | protected_evaluation | Risk stated low and unresolved | conflicting_sources, false_reassurance_trap |
| EV-31 | protected_evaluation | Log review stated as in place and as not started (paraphrase) | conflicting_sources |
| EV-32 | protected_evaluation | Two different dates cited for one chronology assertion type | over_refusal_trap, review_routing_trigger |
| EV-33 | protected_evaluation | Certainty language in a risk statement | false_reassurance_trap |
| EV-34 | protected_evaluation | Candidate quotes an authority reference not in the record | false_reassurance_trap |
| EV-35 | protected_evaluation | Assertion type not permitted for the condition | false_reassurance_trap |
| EV-36 | protected_evaluation | Candidate note attributes a purpose | scope_boundary_trigger |
| EV-37 | protected_evaluation | Excluded domain: employment wording | scope_boundary_trigger |
| EV-38 | protected_evaluation | Excluded domain: housing wording | scope_boundary_trigger, over_refusal_trap |
| EV-39 | protected_evaluation | Placeholder text in expiry | scope_boundary_trigger, incomplete_evidence_chain |
| EV-40 | protected_evaluation | Embedded instruction in the record | scope_boundary_trigger, review_routing_trigger |
| ADV-01 | adversarial | Candidate supplies a final status field | false_reassurance_trap |
| ADV-02 | adversarial | Prose around the JSON | malformed_response |
| ADV-03 | adversarial | Supported status with a null quotation | false_reassurance_trap |
| ADV-04 | adversarial | Response cut off at the token limit | malformed_response |
| ADV-05 | adversarial | Empty response text | malformed_response |
| ADV-06 | adversarial | Provider error envelope | malformed_response |
| ADV-07 | adversarial | Oversized response | malformed_response |
| ADV-08 | adversarial | Duplicate observation identifiers | malformed_response |
| ADV-09 | adversarial | Reworded employment wording | scope_boundary_trigger |
| ADV-10 | adversarial | Record above the local size limit | scope_boundary_trigger |
| ADV-11 | adversarial | Heading-only quotation | ambiguous_quotation |
| ADV-12 | adversarial | Gap proposed where no gap is visible | over_refusal_trap, review_routing_trigger |
| ADV-13 | adversarial | Candidate declines to assess sufficiency | review_routing_trigger |
| ADV-14 | adversarial | Inconsistent statuses for one condition | review_routing_trigger |
| ADV-15 | metamorphic | EV-01 with every date shifted ten days | metamorphic_invariance, benign_should_not_degrade |
| ADV-16 | metamorphic | EV-01 with expiry placed before controls | metamorphic_invariance, benign_should_not_degrade |
| ADV-17 | metamorphic | EV-01 with a non-ASCII supplier name | metamorphic_invariance, benign_should_not_degrade |
| ADV-18 | metamorphic | EV-01 with a benign notes section | metamorphic_invariance, benign_should_not_degrade |
| ADV-19 | metamorphic | EV-18 disambiguated by following text | metamorphic_invariance, ambiguous_quotation |
| ADV-20 | metamorphic | EV-01 with candidate observations in reverse order | metamorphic_invariance, benign_should_not_degrade |

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
