# Capability and Limitation Matrix

**Date:** 2026-10-10 · Four distinct states are tracked, because they are routinely confused:

- **Implemented:** code exists in this repository.
- **Locally tested:** a named local test exercises it and passed on 2026-10-10.
- **Externally evaluated:** an independent party evaluated it on material it did not author. **No row has this.**
- **Release-approved:** a recorded owner release decision covers it. **No row has this.**

Test references: `T:<section>` is `tests/engine-assurance/run.mjs`; `R:<fixture>` is the replay harness.

| Feature | Implemented | Locally tested (evidence) | Ext. evaluated | Release-approved | Limitation | External evidence still required |
|---|---|---|---|---|---|---|
| v1 candidate logic offline (prompt, keys, normaliser, determination, parser) | Yes, extracted | T:A byte identity with blob `baebb512`; T:Q | No | No | Provider mocked; model behaviour untested | Live evaluation under an authorised protocol |
| Pre-analysis gate: scope declaration, versions, outputs, provider config | Yes | T:P; R:SAE-020, 021, 022, 028, 031 | No | No | Declarations are self-asserted by the caller | Operator controls that bind declarations to real intake |
| Gate: regulated-domain refusal | Yes, lexical | T:P (housing, lending, insurance, legal, hiring); R:SAE-012, 013 | No | No | Misses unanticipated phrasing; refuses some incidental mentions (FM-03, FM-04) | Measured miss and false-refusal rates on independent material |
| Gate: embedded-instruction refusal | Yes, lexical | T:P; R:SAE-011 | No | No | Paraphrased or encoded injections may pass (FM-05) | Red-team by a party other than the author |
| Gate: incomplete record and claimed evidence escalation | Yes | R:SAE-010, 024; T:P | No | No | Placeholder detection is token-based | Same as above |
| Size limit (8000 chars, refuse) | Yes | R:SAE-019 | No | No | Differs from v1 truncation (CD-001) | Owner decision if moved to a route |
| Four-outcome condition vocabulary | Yes | T:B, H; all replays | No | No | Mapping from v1 is engineering-proposed (CD-001) | Owner approval of CD-001 |
| Exact source spans with offsets | Yes | T:C; R9 on every replay | No | No | Presence only, not semantic support | Human or adjudicated assessment of support |
| Fabricated-citation withholding | Yes | T:D; R:SAE-014 | No | No | Detects absent text, not misattributed real text | Same |
| Unsafe-language withholding in candidate notes | Yes | T:M; R:SAE-025 | No | No | Term list is finite (FM-13) | Same |
| review never promoted | Yes | T:J (R6) | No | No | None known locally | n/a |
| Cognitive Controls CC-01 to CC-06 (record only) | Yes, lexical | T:O; R:SAE-004, 005, 007, 009, 015, 016, 017, 018, 027, 029 | No | No | Lexical; route, never decide; false positives found and fixed during build (CHANGELOG) | Usefulness study with practitioners |
| Review Run Envelope 0.1.0 | Yes | T:B, G, K, L | No | No | Private; no consumer exists yet | n/a until a consumer is defined |
| Manifest through existing adapter | Yes, unchanged adapter | T:Q; R:SAE-001 etc. (`offline_validation`) | No | No | Manifest keeps v1 `ready` routing (CD-001 section 7) | Owner decision on Manifest use |
| Deterministic replay with hashes | Yes | T:R (byte-identical records with fixed clock) | No | No | Determinism of the mock path only; a model is not deterministic | Empirical repeatability study on a live model |
| Network refusal and trap | Yes | T:N; replay `trapped_attempts: 0` | No | No | Covers Node APIs only (FM-15) | Host-level egress control evidence |
| Unsupported-claim content guard | Yes | T:M, S | No | No | Lexical negation window (FM-13) | n/a |
| Synthetic fixture pack (31) | Yes | R: all 31 match | No | No | Same author for records, mocks and labels | Independent, adjudicated holdout (VALIDATION_READINESS_PROTOCOL) |
| Engine-to-Codebook mapping | **No** | n/a | No | No | NOT ESTABLISHED | Owner-declared, versioned mapping |
| Accuracy, sensitivity, specificity | **No** | n/a | No | No | Not measurable from this pack | Release gate 1 |
| Operator controls (access, retention, recovery) | **No** | n/a | No | No | Out of scope | Release gate 2 |
| Counsel review of data flows and claims | **No** | n/a | No | No | Out of scope | Release gate 3 |

## Claim, Evidence, Interpretation, Limitation

- **Claim.** The package fails closed on out-of-scope, incomplete, injected and unsupported inputs in local runs.
- **Evidence.** 12 refusal or escalation fixtures yield no favourable outcome and no provider invocation (T:I); 138 checks in the suite, 0 failed; replay 31/31.
- **Interpretation.** For the input patterns the fixtures represent, the controls behave as designed.
- **Limitation.** The fixtures were written by the author of the controls. Inputs phrased differently from the fixtures are untested.
