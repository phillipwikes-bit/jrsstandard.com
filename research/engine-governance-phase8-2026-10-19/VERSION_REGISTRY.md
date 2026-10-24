# Version Registry

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Source of record: `registry/VERSION_REGISTRY.json` and one `sha256sum`-format manifest per package in `registry/manifests/`. Recorded 2026-10-19T14:56:57.008Z at baseline commit `428c307`, before any Phase 8 code existed. Describes earlier packages and their file hashes. Makes no readiness, validation, ownership, commercial or release statement.

The manifests were written once and are never overwritten: `registry/build-registry.mjs` rebuilds them in memory and fails closed on any difference. A replay fails closed if a protected earlier package changes.

| Package | Status | Owner review eligible | Files | Package SHA-256 | Source paths |
|---|---|---|---|---|---|
| v1-historical | frozen | no | 1 | `sha256:70c76d942960732bbadfa16cb7e9d622ca7380397050aceaba8d9bbe93d6661d` | research/engine-evidence-contract-2026-10-10/historical-reference/v1-review-engine.0177c51.js.txt |
| v0.1-assurance | frozen | no | 183 | `sha256:bf47e7b846862232f95864e6f095bd4151b8f5707d0e052fbda4afcc6130e2f4` | lib/engine-assurance/, tests/engine-assurance/, tools/engine-assurance-replay.mjs, research/engine-assurance-2026-10-10/ |
| v0.2-evidence-contract | frozen | no | 235 | `sha256:91464918068fd336b546ca0e929f3d9da19471e555ed463b057b6fdd7dabd251` | lib/engine-evidence-contract/, tests/engine-evidence-contract/, tools/engine-evidence-contract-replay.mjs, research/engine-evidence-contract-2026-10-10/ |
| v0.3-evidence-graph | frozen | no | 218 | `sha256:ecf0c04766a4e521af7ec1ca93d194a94c6db2fd2e2c130884296863b8756b12` | lib/engine-evidence-graph/, tests/engine-evidence-graph/, tools/engine-evidence-graph-replay.mjs, research/evidence-graph-compiler-2026-10-10/ |
| phase4-change-control | frozen | no | 277 | `sha256:8b12a2384e81d727cc8eb57b12f02632a6a44d419e25e71d44ba6c2fb3a6f853` | lib/engine-change-control/, tests/engine-adaptive-reliability/, research/adaptive-reliability-2026-10-13/ |
| phase6-reliability | local_only | yes | 139 | `sha256:cdd51355e92e8a62dbdb3f2147115f17f559d92efc12a951f4c45e96c1a38576` | lib/engine-reliability/, tests/engine-reliability/, tools/engine-reliability-replay.mjs, research/engine-reliability-phase6-2026-10-17/ |
| phase7-candidate | candidate_only | yes | 147 | `sha256:815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3` | lib/engine-evidence-graph-v0.3.1-candidate/, tests/engine-remediation-phase7/, research/engine-remediation-phase7-2026-10-19/ |

The package hash is the SHA-256 of the manifest text (one line per file: file SHA-256, two spaces, path; sorted by path). "Frozen" means fixed in git history at the baseline commit; it is not a quality statement.

## Test commands, recorded results and limitations

| Package | Test command | Latest recorded result | Source | Known limitations |
|---|---|---|---|---|
| v1-historical | `none of its own; source identity is checked by tests/engine-assurance/run.mjs ("candidate core is byte-identical to the last executable v1 handler")` | no suite of its own | lib/engine-assurance/provenance.mjs | Historical only. The public v1 route now returns a refusal-only response; the historical handler is not executed by any later package. |
| v0.1-assurance | `env -u ANTHROPIC_BASE_URL node tests/engine-assurance/run.mjs` | 148/148 | research/engine-reliability-phase6-2026-10-17/execution-record/PRIOR_SUITE_RESULTS.json | research/engine-assurance-2026-10-10/FAILURE_MODE_REGISTER.md and INHERITED_FAILURES.md |
| v0.2-evidence-contract | `env -u ANTHROPIC_BASE_URL node tests/engine-evidence-contract/run.mjs` | 123/123 | research/engine-reliability-phase6-2026-10-17/execution-record/PRIOR_SUITE_RESULTS.json | research/engine-evidence-contract-2026-10-10/KNOWN_FAILURE_MODES_AND_STOP_CONDITIONS.md |
| v0.3-evidence-graph | `env -u ANTHROPIC_BASE_URL node tests/engine-evidence-graph/run.mjs` | 140/140 | research/engine-reliability-phase6-2026-10-17/execution-record/PRIOR_SUITE_RESULTS.json | research/evidence-graph-compiler-2026-10-10/FAILURE_MODE_REGISTER.md |
| phase4-change-control | `env -u ANTHROPIC_BASE_URL node tests/engine-adaptive-reliability/run.mjs` | 269/269 | research/engine-reliability-phase6-2026-10-17/execution-record/PRIOR_SUITE_RESULTS.json | research/adaptive-reliability-2026-10-13/ADAPTIVE_FAILURE_MODE_REGISTER.md |
| phase6-reliability | `env -u ANTHROPIC_BASE_URL node tests/engine-reliability/run.mjs` | 316/316 | research/engine-reliability-phase6-2026-10-17/execution-record/TEST_RESULTS.json | research/engine-reliability-phase6-2026-10-17/KNOWN_FAILURE_MODES.md |
| phase7-candidate | `env -u ANTHROPIC_BASE_URL node tests/engine-remediation-phase7/run.mjs` | 328/328 | research/engine-remediation-phase7-2026-10-19/execution-record/TEST_RESULTS.json | research/engine-remediation-phase7-2026-10-19/KNOWN_LIMITATIONS.md |

## v1 historical reference

The frozen v1 handler is the git object `0177c51:api/v1/review-engine.js` (blob `baebb512e5f2`). Its content SHA-256 `f5b4d634cb6f9adfc1ac09d8896eb7c0a07f8f504c0a6eb3dcce005163a68ebb` equals the in-repository copy in the v0.2 package. The public v1 route now returns a refusal-only response.

## Phase 7 manifest

Phase 7 kept no complete file manifest of its own. The Phase 8 manifest covers all 147 Phase 7 files with SHA-256 and reproduces byte-for-byte on rebuild. Corroboration: the Phase 7 seal verifies (yes); the latest Phase 7 file modification is 2026-10-19T13:58:05.573Z, before the final-handoff bound 2026-10-19T13:58:06Z. The Phase 6 manifest equals the snapshot Phase 7 took at its start.
