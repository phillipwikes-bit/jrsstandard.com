# Historical Reference Checks

Local ID: VL-003-HREF (NON-CANONICAL).

## Claim
v0.3 work left the historical references intact.

## Local engineering evidence
| Check | Method | Where enforced |
|---|---|---|
| v1 blob `baebb512` unchanged | `git hash-object` of the frozen copy equals `baebb512`; v0.2 suite check | `tests/engine-evidence-contract/` (re-run unchanged) |
| v0.1 package unchanged | `git diff 882e4f5 -- lib/engine-assurance research/engine-assurance-2026-10-10 tests/engine-assurance` is empty | `tests/engine-evidence-graph/run.mjs` section A |
| v0.2 package unchanged | same diff over the v0.2 paths | section A |
| Public 503 stubs unchanged | same diff over `api/` | section A |
| Canonical records and B-018 unchanged | same diff over `.jrs/` and `docs/enterprise-diligence/` | section A |

## Interpretation
Absence of a diff shows the files were not edited in this working tree. It does not show anything about deployed behaviour.

## Limitation
Production bytes were not checked; no network request was made.

## External evidence still required
Byte comparison of production against the commit, by the deploy-verify workflow, if the owner later merges.
