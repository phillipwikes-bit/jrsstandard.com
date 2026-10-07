# Authority and release-gate responsibility matrix (internal)

**Package `JRS-EVAL-READINESS-20261007-PR39`. Status `PLANNING_ONLY`.** Machine-readable form: `tools/evaluation-readiness/authority-matrix.json`, bound to contract 0.1.0, registry 0.1.0, the release-gate record and Engine 0.5.0-local.1.

## Current implementation, target and absent evidence
- **Current implementation:** the matrix below, checked by verifier section G against the release-gate record.
- **Target:** each human act is recorded by the person who performs it, in the ledger and, for gates, in the release-gate record.
- **Absent:** no reviewer, adjudicator, custodian, counsel, owner or independent-QA act exists.

A human role cannot be substituted by a code path, a test fixture or generated text.

## Roles
| Role | Does | May not |
|---|---|---|
| Claude Code | prepares protocols, schemas, templates, validators, the ledger, the scan, synthetic probes, questions for counsel and decision requests | attest, interpret, adjudicate, determine a legal question, authorize, verify production, or change a release-gate status |
| Independent reviewer | declares independence and conflicts; extracts and interprets blind to candidate output; records uncertainty and insufficient basis | adjudicate their own disagreement |
| Adjudicator | resolves recorded disagreements under the frozen protocol | be one of the reviewers adjudicated |
| Record custodian | attests completion and custody; holds records outside the repository | |
| Counsel | reviews lawful basis, confidentiality, data flows, retention, rights and any statement about a result | |
| Owner | authorizes intake, freezes, provider calls on evaluation records, release, deployment, publication and any gate change on recorded evidence | |
| Independent production QA | verifies an authorized production deployment | |

## Release gates (status unchanged)
| Gate | Status | Responsible | Claude Code |
|---|---|---|---|
| RG-1 Independent labeling and adjudication of an unused sealed holdout | BLOCKED | independent reviewer, adjudicator, owner | prepares, never satisfies |
| RG-2 Operator-control evidence | BLOCKED | owner | prepares, never satisfies |
| RG-3 Counsel review | NOT_ASSESSED | counsel | prepares, never satisfies |
| RG-4 Recorded owner release authorization | BLOCKED | owner | prepares, never satisfies |
| RG-5 Independent production QA | BLOCKED | independent production QA | prepares, never satisfies |

## Prohibited until
| Action | Until |
|---|---|
| Admit any record to intake | owner opening record, counsel review and attestations ATT-01 to ATT-03 |
| Run the Engine or any provider on an evaluation record | owner authorization for provider calls on evaluation records |
| Compute agreement, a DRR score or a classification | owner freeze records for all four protocols, and real independent interpretations |
| Describe any result as validation or independent evaluation | evidence from the appropriate external authority, matched to the proposition, and counsel review of the statement |
| Change any release-gate status | proposition-matched evidence from the responsible role, recorded in the release-gate record |
