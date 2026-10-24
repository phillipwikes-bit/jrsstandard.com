# Known Limitations

**LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.**

These limitations hold for the v0.3.1 candidate as built in Phase 7. They are part of the result, not a list of future work. Release status stays `NO_GO_NOT_VERIFIED`.

## What Phase 7 does not establish

- Nothing about accuracy, semantic correctness, real records, real users or any live model. Every input is synthetic and every response is mocked or a fixture.
- No independent evaluation. The scenarios, transforms, probes and mutations were written by the same session that wrote the rules.
- Small synthetic benign samples (one or two per rule). The over-refusal table shows no degradation on those cases only; it does not estimate a false-positive rate.
- Mutation testing shows the probes detect 79 specific deliberate defects. It does not show they detect every defect.

## Rule-level limitations

| Rule | Limitation |
|---|---|
| RP-STR-01 | Renames one inference label (`attributed_purpose`). Other inference labels whose reason text could trip self-validation are untested (backlog P7B-001). A general self-validation catch was rejected (P7B-012). |
| RP-CHR-01 | Reads only "risk assessment" events outside action sections. Other assessment wordings are not read. |
| RP-CHR-02 | Flags any two distinct expiry dates. A record that legitimately states an original and an extended expiry is routed to review. |
| RP-CHR-03 | Only reports a gap; it never infers a decision date. |
| RP-CHR-04 | Reads "for N days" only, with a one-day tolerance. Months, weeks and business days are not read. |
| RP-NEG-01 | Bounded lexical negation within two words of a reason word. Hedges, double negation and wider context are not interpreted. |
| RP-EVL-01 | Section linkage is not semantic support. A quotation in a linked section can still be unrelated to the condition. Phase 4 ST-06 is degraded to review because a rationale moved into the residual-risk section. |
| RP-CON-01 | One paraphrase family ("review of access logs"), and only when no other control conflict is found. |
| RP-SCO-01 | "Keep or lose" plus possessive plus job. Person-directed contract language (Phase 4 AR-040) is deferred pending an owner decision (P7B-010). |

## Carried defects and gaps

- Invalid calendar dates such as 2026-02-30 are ignored by the date reader; a cited quotation containing one can still carry a stated-date assertion (P7B-011, deferred).
- The Phase 4 AR-035 legal-conclusion note is not covered by the candidate's claim guard (P7B-014, deferred).
- P6K-001 semantic support is addressed by abstention only. Semantic matching was rejected because it would need a live model or an unbounded system (P7B-013).
- The Phase 6 router fails closed on refusal supersession (P6K-011). Phase 7 qualifies an intended intake refusal as a complete refusal state instead of relying on the router (contract rule 3).

## Process limitations

- Several harness corrections and two test-coverage repairs were made after the seal, each disclosed in `EXECUTION_RECORD.md`. None changed a sealed expectation or candidate logic.
- The rule-pack signature is a content seal (SHA-256 over canonical content). It detects accidental or careless change; it is not a cryptographic identity and does not prove who authored a pack.
- Two declared cross-package conflicts remain in earlier suites (`execution-record/PRIOR_SUITE_RESULTS.json`).
