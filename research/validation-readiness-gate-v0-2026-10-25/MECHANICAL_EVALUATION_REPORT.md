# Mechanical Evaluation Report

**Gate V0, 2026-10-25. Offline only, with mocked candidate responses.** Not validation. It establishes no accuracy, reliability or real-world performance. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. What ran

- **Corpus:** sealed owner-authored synthetic validation-readiness corpus, 60 cases. Sealed at 2026-10-25T08:45:46.600Z; manifest `1103d11d8a37407d3380b8edc3d8ca018345e5c74ccb5955933d0a60b97edfe6`; the seal verified before each run.
- **Engine:** `0.3.1-candidate`, from an isolated copy (19 candidate files verified, unchanged after use, deleted).
- **Adapter:** 0.2.0-offline (`aa2b97797a9ed2d9476e901f2a54e10b3c7f898af6a9df8b473ac27482d81fb6`). Transport: mock. Model identifier: `MOCK-MODEL-NOT-A-PROVIDER`. Runtime: Node v22.22.0.
- **Method:** `EVALUATION_METHOD_PRESPECIFIED.md`, written before the first run; custody hashes are in `PRE_RUN_RECORD.json`.
- **Runs:** two, from clean output directories in separate processes.

## 2. Totals (run 1; run 2 identical)

| Measure | Value |
|---|---|
| Cases | 60 |
| Replayed through the Engine | 52 |
| Rejected by the adapter before replay | 8 |
| Execution errors | 0 |
| Mechanical check failures | 0 |
| Set-up problems (Layer 1, expectation integrity) | 0 |
| Cases matching the sealed owner-authored expectation | 60 of 60 |
| Metamorphic relations holding | 6 of 6 |
| Network attempts | 0 |
| Determinism: cases identical under the pre-specified criterion | 60 of 60 |
| Run summaries identical | true |

## 3. Results by claim category

- **Mechanically established, for this build and this corpus only.** On every replayed case:
  - quotation offsets equal the record text, in both UTF-16 and UTF-8;
  - every assertion is linked to exactly one verified evidence item;
  - no ambiguous quotation was selected;
  - no status was raised above the candidate's proposal, and sufficiency was never supported;
  - every finding, conflict and refusal is routed to human review;
  - chronology conflicts lowered chronology;
  - every graph passed the frozen validator;
  - provenance pairs and binding digests verified, both independently and by the adapter's pair check;
  - model identity matched;
  - execution labels were `local_mocked`, with 0 provider and 0 network calls.

  Every rejected case produced no graph and no execution record. No execution error occurred. Normalized outputs were identical across the two runs.
- **Owner-authored expectation.** 60 of 60 cases matched. The expectations and the corpus come from the same side. A match shows the Engine behaves as the owner's reading of its rules predicts; it does not show that the behaviour is correct.
- **Unresolved semantic questions.** These are recorded, not resolved: EV-08, EV-23, EV-32, EV-33, EV-38 (section 5).
- **Not assessed.** Intake-stopped cases (EV-37, EV-38, EV-39, ADV-09, ADV-10) and the eight adapter rejections assess no condition. ADV-13 leaves sufficiency not assessed.
- **Not suitable for a claim.** Diagnostic accuracy, model behaviour, reliability, real-world performance, independent validation, and production or release suitability.

## 4. Per-case results (run 1)

Statuses are given in the order reconstructability, identifiable basis, chronology integrity, reasoning traceability, sufficiency. S supported, G gap, RR review required, NA not assessed.

| Case | Purpose | Outcome | Conflicts | Refusals | Expectation | Mechanical |
|---|---|---|---|---|---|---|
| ADV-01 | Candidate supplies a final status field | V8 candidate_supplied_untrusted_field | - | - | match | pass |
| ADV-02 | Prose around the JSON | V7 content_outside_json_object | - | - | match | pass |
| ADV-03 | Supported status with a null quotation | V9 quote_null_requires_not_assessed | - | - | match | pass |
| ADV-04 | Response cut off at the token limit | V3 response_truncated | - | - | match | pass |
| ADV-05 | Empty response text | V6 model_refusal | - | - | match | pass |
| ADV-06 | Provider error envelope | V2 provider_error | - | - | match | pass |
| ADV-07 | Oversized response | V5 response_too_large | - | - | match | pass |
| ADV-08 | Duplicate observation identifiers | V8 observation_id_invalid_or_duplicate | - | - | match | pass |
| ADV-09 | Reworded employment wording | NA NA NA NA NA (intake refuse) | - | excluded_domain_content | match | pass |
| ADV-10 | Record above the local size limit | NA NA NA NA NA (intake refuse) | - | record_exceeds_local_size_limit | match | pass |
| ADV-11 | Heading-only quotation | S S S RR RR | - | quote_malformed | match | pass |
| ADV-12 | Gap proposed where no gap is visible | S S RR S RR | - | - | match | pass |
| ADV-13 | Candidate declines to assess sufficiency | S S S S NA | - | candidate_did_not_assess | match | pass |
| ADV-14 | Inconsistent statuses for one condition | S S RR S RR | - | - | match | pass |
| ADV-15 | EV-01 with every date shifted ten days | S S S S RR | - | - | match | pass |
| ADV-16 | EV-01 with expiry placed before controls | S S S S RR | - | - | match | pass |
| ADV-17 | EV-01 with a non-ASCII supplier name | S S S S RR | - | - | match | pass |
| ADV-18 | EV-01 with a benign notes section | S S S S RR | - | - | match | pass |
| ADV-19 | EV-18 disambiguated by following text | S S S S RR | - | - | match | pass |
| ADV-20 | EV-01 with candidate observations in reverse order | S S S S RR | - | - | match | pass |
| EV-01 | Benign complete record, parameter set 101 | S S S S RR | - | - | match | pass |
| EV-02 | Benign complete record, parameter set 102 | S S S S RR | - | - | match | pass |
| EV-03 | Benign complete record, parameter set 103 | S S S S RR | - | - | match | pass |
| EV-04 | Benign complete record, parameter set 104 | S S S S RR | - | - | match | pass |
| EV-05 | Benign complete record, parameter set 105 | S S S S RR | - | - | match | pass |
| EV-06 | Benign: "promoted to production" homonym | S S S S RR | - | - | match | pass |
| EV-07 | Benign: "keeps their job scheduler" homonym | S S S S RR | - | - | match | pass |
| EV-08 | Missing decision basis section | RR S S RR RR | - | - | match | pass |
| EV-09 | Basis states neither reason nor source | RR S S RR RR | - | assertion_rejected | match | pass |
| EV-10 | Missing decision section | RR S S RR RR | - | - | match | pass |
| EV-11 | Decision dated before the request | S S RR S RR | impossible_sequence | - | match | pass |
| EV-12 | Two different decision dates | RR S RR S RR | decision_date_conflict | - | match | pass |
| EV-13 | Risk assessment dated after the decision | S S RR S RR | assessment_after_decision | - | match | pass |
| EV-14 | Two different expiry dates | S S RR S RR | expiry_date_conflict | - | match | pass |
| EV-15 | Stated duration does not match the dates | S S RR S RR | duration_date_conflict | - | match | pass |
| EV-16 | Open-ended expiry | S S RR S RR | - | - | match | pass |
| EV-17 | No explicit dates anywhere | S S RR S RR | - | assertion_rejected | match | pass |
| EV-18 | Decision text duplicated; quotation not disambiguated | RR S S S RR | - | quote_ambiguous | match | pass |
| EV-19 | Decision text duplicated; disambiguated by section | S S S S RR | - | - | match | pass |
| EV-20 | Quotation differs from the record in case | S RR S S RR | - | quote_absent | match | pass |
| EV-21 | Elided quotation | RR S S S RR | - | quote_malformed | match | pass |
| EV-22 | Negated rationale cited as reasoning | S S S RR RR | - | - | match | pass |
| EV-23 | Basis restates the conclusion only | S S S RR RR | - | - | match | pass |
| EV-24 | Authority named without identifier or date | S RR RR S RR | - | - | match | pass |
| EV-25 | No authority section | S RR RR S RR | - | - | match | pass |
| EV-26 | No compensating control; candidate proposes a gap | S S S S G | - | - | match | pass |
| EV-27 | Open-ended expiry; candidate proposes a gap | S S G S RR | - | - | match | pass |
| EV-28 | Authority stated as given and as pending | S RR S RR RR | authority_state_conflict | - | match | pass |
| EV-29 | Control stated as in place and as planned | S S S S RR | control_state_conflict | - | match | pass |
| EV-30 | Risk stated low and unresolved | S S S RR RR | risk_state_conflict | - | match | pass |
| EV-31 | Log review stated as in place and as not started (paraphrase) | S S S S RR | control_state_conflict | - | match | pass |
| EV-32 | Two different dates cited for one chronology assertion type | S S RR S RR | cited_evidence_conflict | - | match | pass |
| EV-33 | Certainty language in a risk statement | S S S S RR | - | - | match | pass |
| EV-34 | Candidate quotes an authority reference not in the record | S RR S S RR | - | quote_absent | match | pass |
| EV-35 | Assertion type not permitted for the condition | S RR S S RR | - | assertion_rejected | match | pass |
| EV-36 | Candidate note attributes a purpose | S RR S S RR | - | assertion_rejected | match | pass |
| EV-37 | Excluded domain: employment wording | NA NA NA NA NA (intake refuse) | - | excluded_domain_content | match | pass |
| EV-38 | Excluded domain: housing wording | NA NA NA NA NA (intake refuse) | - | excluded_domain_content | match | pass |
| EV-39 | Placeholder text in expiry | NA NA NA NA NA (intake escalate) | - | incomplete_record | match | pass |
| EV-40 | Embedded instruction in the record | RR RR RR RR RR | - | - | match | pass |

## 5. Unresolved semantic questions (recorded for adjudication, not repaired)

- **EV-08.** Identifiable basis is supported from an identified authority alone, with no basis section; whether an authority reference alone is an identifiable basis is a semantic question for adjudication.
- **EV-23.** Reconstructability is supported because a decision and a basis section are both cited, although the basis restates the conclusion. Whether a conclusion-only basis makes a decision reconstructable is a semantic question; the rule checks structure, not content.
- **EV-32.** A request date and an expiry date are different facts, yet two stated_date quotations with different dates are flagged as a cited-evidence conflict. This looks like over-flagging of a consistent record; it is recorded for adjudication, not repaired.
- **EV-33.** Certainty language is surfaced as a cognitive control but does not lower any status; whether it should is a design question.
- **EV-38.** "Tenant parking" for a depot is not a housing matter; the refusal may be over-refusal. Recorded, not repaired.

## 6. Determinism note

All 52 replayed graphs differ in raw bytes between runs, as the pre-specified method anticipated. The adapter passes the capture time as the compiler clock, and the Engine's own `identity.graph_sha256` is computed over the `run_identity` node, which carries that time. Under the pre-specified normalization, all 60 cases are identical. The Engine's `graph_sha256` is therefore not a timestamp-independent content hash. This is recorded in the failure and uncertainty register as a reproducibility limitation.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
