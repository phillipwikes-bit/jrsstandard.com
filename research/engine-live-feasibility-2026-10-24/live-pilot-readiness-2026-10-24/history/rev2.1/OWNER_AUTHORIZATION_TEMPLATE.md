# Owner Authorization: Ten-Record Live-Model Feasibility Pilot (Template)

**BLANK TEMPLATE. Prepared 2026-10-24. No authorization exists until every field is
completed and signed.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect. This authorization, if
given, is not a release, validation, commercial, licensing, deployment or
independent-evaluation authorization, and does not open Gate 4.

Authorization identifier: LP-AUTH-__________


**Revision 2 (2026-10-24, on owner direction).** Two-part provenance labeling outside the
frozen graph; mandatory graph and execution-record pairing; narrowed pilot question;
counts and observed failure modes only. Revision 1 is preserved unchanged in
`history/rev1/`. Still non-operative; nothing is authorized.

## 1. Provider and model

| Field | Entry |
|---|---|
| Approved provider | __________ |
| Pinned model identifier | __________ |
| Availability confirmed from the provider's documentation on (date) | __________ |
| Temperature | __________ |
| Maximum output tokens | __________ |
| Timeout per request | __________ |
| Approved destination (recorded here by the owner) | __________ |
| Credential source (environment variable name only, never the value) | __________ |

## 2. Classification

- [ ] Remote provider access is **external controlled use** (default under the
  assignment of 2026-10-24).
- [ ] Remote provider access is classified otherwise. Classification and reasoned
  basis: __________

## 3. Gate status

| Field | Entry |
|---|---|
| Gate 1 archive verification | [ ] Cleared by exact SHA-256 match on (date) ______ [ ] Not cleared (pilot may not begin) |
| B-018 G1 statement reference | __________ |
| Applicable Gate 3 prerequisites (G1, G2, G3, G4 decision, G9, stop rules, custody) recorded as satisfied | [ ] Yes, references: __________ |
| Counsel review of the provider data flow | [ ] Not required, basis: ______ [ ] Required and completed, reference: ______ |
| Adapter build authorization and adapter SHA-256 | __________ |
| Provenance labeling accepted: graph label `execution_mode: local_mocked` unchanged; execution record carries `response_origin: live_provider_captured` and `engine_execution_mode: recorded_response_replay`; graph and record paired and bound as in the adapter contract section 8A | [ ] Yes [ ] No (alternative: ______) |

## 4. Limits

| Field | Entry |
|---|---|
| Maximum requests (no more than ten) | __________ |
| Synthetic-only confirmation | [ ] I confirm all ten records are synthetic development material with no personal, confidential, source-controlled or holdout content |
| Budget ceiling (currency and amount) | __________ |
| Prices used for the ceiling, and the date checked | __________ |

## 5. Retention

| Field | Entry |
|---|---|
| Approved retention location (outside the repository) | __________ |
| Outputs may be retained | [ ] Yes, until (date) ______ [ ] No, delete after review |
| Who may access the outputs | __________ |

## 6. Start and expiry

| Field | Entry |
|---|---|
| The pilot may begin | [ ] Yes [ ] No |
| Authorization expires on | __________ |

## 7. Required statement (do not alter)

This authorization covers at most ten requests, one per synthetic development record,
under the stop rules in `LIVE_PILOT_STOP_RULES.md`. It permits observation only. No
accuracy, agreement, performance, reliability, validation or readiness figure may be
derived from it. It does not close B-018, does not change release status
NO_GO_NOT_VERIFIED, does not open Gate 4, and does not authorize any public, commercial,
release or licensing statement. Restart after any stop requires a new written decision.

## 8. Signature

Owner: __________________________ Date: __________
