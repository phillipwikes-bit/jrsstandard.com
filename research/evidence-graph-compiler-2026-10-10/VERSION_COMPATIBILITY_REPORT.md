# Version Compatibility Report

Local ID: EGC-DOC-12 (NON-CANONICAL). See also `version-lineage/`.

## Claim
v0.3 was added without changing v1, v0.1 or v0.2, and no prior result was migrated into v0.3.

## Local engineering evidence
| Check | Result |
|---|---|
| v0.1 replay (`tools/engine-assurance-replay.mjs --no-write`) | 31/31 pass, unchanged |
| v0.1 suite (`tests/engine-assurance/run.mjs`) | 148/148 pass, unchanged |
| v0.2 replay (`tools/engine-evidence-contract-replay.mjs --no-write`) | 52/52 pass, unchanged |
| v0.2 suite (`tests/engine-evidence-contract/run.mjs`) | 123/123 pass, unchanged |
| Prior paths, `.jrs/` and `docs/enterprise-diligence/` diffed against `882e4f5` | No change (suite section A) |
| Historical v1 copy | Hashes to git blob `baebb512` |
| Public routes | Still 503 refusal stubs |

## Differences a reviewer would see
| Behaviour | v0.2 | v0.3 |
|---|---|---|
| Who computes offsets | Candidate; contract verifies | Compiler only; candidate offsets invalidate the response |
| Output shape | Findings with evidence list | Typed graph with fixed edge meanings |
| Duplicate quotations | Offset picks one | Ambiguous unless disambiguated |
| Conflicts | Not modelled | K1 to K6 conflict nodes; affected conditions lowered |
| Reworded injection and mixed-scope phrasing (GC-021, GC-023) | Missed | Detected |
| Evaluation readiness | Protocol text | Registry, separation checks, authority matrix |

## Interpretation
The versions can be compared side by side; they cannot be pooled.

## Limitation
The v0.2 comparison in the workbench is behavioural on three synthetic cases (EC-001 to EC-003).

## External evidence still required
None for compatibility of local code. Any comparative accuracy claim needs independent labels.
