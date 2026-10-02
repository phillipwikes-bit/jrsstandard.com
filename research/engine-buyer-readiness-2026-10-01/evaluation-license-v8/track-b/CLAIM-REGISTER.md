# Claim register: buyer-facing documents

**Checked 2026-10-02 (updated after the live run)** against BUYER-BRIEF.md, EVALUATION-OFFER.md, DEMO-LIMITATIONS.md, DEMO-SCRIPT.md, INTEGRATION-AND-QUICKSTART.md, DATA-FLOW-AND-LIMITATIONS.md and SUPPORT-AND-ACCEPTANCE.md. Format: CLAIM, EVIDENCE, LIMITATION, STATUS (CLAUDE.md section 24).

| # | Claim as worded | Evidence | Limitation | Status |
|---|---|---|---|---|
| C-01 | Access is token-gated (Engine HTTP route) | tests/engine/auth-matrix.mjs, 26 checks | Offline; not run against production | SUPPORTED, offline |
| C-02 | The route follows a fixed rule from the five statuses | api/review-engine.js `deriveDetermination`; runner tests 1 and 9 | Says nothing about judgment quality | SUPPORTED |
| C-03 | Malformed model output is refused, not repaired | runner test 9 | Mocked output | SUPPORTED, offline |
| C-04 | A versioned evidence Manifest can be exported | tests/manifest 68 checks; runner test "a Manifest is produced for every call" | Mocked output; a hash checks bytes, not truth | SUPPORTED, offline |
| C-05 | Nothing is written to JRS systems in the package | runner tests 1 and 7 | Tested for the runner configuration | SUPPORTED, offline |
| C-06 | Records longer than 8,000 characters are rejected, not shortened | runner test 8; clean-install test | The Engine HTTP route itself still truncates (defect ED-01) | SUPPORTED for the package only |
| C-07 | Only api.anthropic.com is reachable; no retries; 60-second timeout | runner tests 1, 5, 6, 7 | Inside the runner process only | SUPPORTED, offline |
| C-08 | Worst-case cost of the 10-call demo is about USD 0.10 | Anthropic pricing page read 2026-10-01; runner test 11 | List price; bound assumes 2 characters per token | SUPPORTED |
| C-09 | On five fictional records the Engine flagged the thin ones and passed the complete one | runs/2026-10-02-smoke-2; METRICS.json | Five AI-constructed fixtures; not real records | SUPPORTED as fixture behavior only |
| C-10 | On two records with hidden instructions, the Engine ignored them | runs/2026-10-02-smoke-2 (S4, S5) | Two cases; the Engine did not flag the attempt; not general resistance | SUPPORTED, narrowly worded |
| C-11 | Fixed USD 1,000 fee | Owner decision 2026-10-01 (O-03) | A test price, not evidence of willingness to pay | SUPPORTED as a decision |

**Banned wording scan** (guaranteed, eliminates, prevents, compliant, court-proof, liability-proof, industry standard, validated without scope): none found in the checked documents, except negations such as "does not establish compliance".
