# Release-evidence protocol (internal)

**Date:** 2026-10-06. **Status:** internal engineering control, not deployed (`*.md` and `lib/` are excluded by `.vercelignore`). **Governed by:** `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md` ("External controlled use is not verified. Do not mark any gate complete.") and the owner's instruction of 2026-10-06.

**This protocol is not a legal, privacy, security or commercial clearance.** It is a way to record evidence so that a later reviewer can see exactly what exists and what does not. It is distinct from the public Decision Reconstruction Manifest, and it creates no production, licensing, sale, evaluation or real-record authorization.

## 1. What the package is
| Part | Path |
|---|---|
| Record schema (`jrs-release-gate-record/0.1.0`) | `lib/release-gate/schema/release-gate-record.schema.json` |
| Controlled vocabulary and gate definitions | `lib/release-gate/vocabulary.js` |
| Validator (structural and cross-field rules) | `lib/release-gate/validator.js`, `lib/release-gate/schema-check.js` |
| Report generator | `lib/release-gate/report.js` |
| Command-line runner | `lib/release-gate/cli.mjs` |
| Current record | `lib/release-gate/records/RG-RECORD_engine-0.5.0-local.1.json` |
| Current report (generated) | `docs/architecture/CURRENT_RELEASE_GATE_REPORT.md` |
| Tests | `tests/release-gate/` (`node tests/release-gate/run-all.mjs`) |

The validator makes no network request, calls no provider, reads no environment variable or secret, and reads no file other than the record and report named on its command line and its own schema.

## 2. Statuses
A gate or sub-control carries exactly one of: `NOT_ASSESSED`, `PENDING`, `BLOCKED`, `PASS`, `FAIL`, `NOT_APPLICABLE`. There is no "ready", "validated", "approved", "production", "licensed" or "sale-ready" status, and the schema rejects any such value.
- **NOT_ASSESSED:** nobody has produced evidence for it yet.
- **PENDING:** work toward it is under way; nothing that satisfies it exists yet.
- **BLOCKED:** it cannot proceed until a named dependency is resolved (a prerequisite gate, a prohibited action, an owner action).
- **PASS:** evidence that meets every rule in section 5 is recorded.
- **FAIL:** evidence was produced and did not meet the criterion.
- **NOT_APPLICABLE:** permitted for a sub-control, with a stated reason. Never permitted for a release gate: all five gates are required.

Every NOT_ASSESSED, PENDING or BLOCKED entry must list what is missing. Absent evidence is recorded; it is not an error and it is not a defect in the Engine.

## 3. The five gates

### RG-1. Independent labeling and adjudication of an unused sealed holdout
- **Means:** the named Engine version and prompt are run on a holdout that was sealed before use and never used in development; people independent of the candidate's author label and adjudicate it; results are reported per condition with uncertainty, against thresholds fixed before the run.
- **Can satisfy it:** `INDEPENDENT_LABELING` evidence (holdout attestation, labeling dataset, adjudication record) and `LIVE_EXECUTION` evidence (an execution log of the named Engine version on that holdout), plus a named independent reviewer and per-condition results resting on independent labeling.
- **Cannot satisfy it:** the constructed corpora, the confirmation corpus, mocked evaluations, regression sets, mutation runs, consistency harness output, or any other material written by the candidate's author. A smoke test or a GET response is not a holdout run.

### RG-2. Operator-control evidence
- **Means:** in the real environment the Engine would run in, each control is shown to have executed: IAM and database access, credential rotation, retention execution, backup restoration, compatible rollback, monitoring, and live-operation verification.
- **Can satisfy it:** `OPERATOR_CONTROL_EVIDENCE` of the matching kind for each sub-control (an access-review export, a rotation record, a deletion execution log, a restore record, a rollback record, monitoring records) and, for live-operation verification, an execution log.
- **Cannot satisfy it:** a written policy, a retention module that computes but does not delete, a static code review, a local test, a documentation statement, a public page, a smoke test, or a GET response. A control described is not a control executed.

### RG-3. Counsel review
- **Means:** counsel, independent of the record author, reviews the actual data flows, storage terms, privacy obligations, evaluation claims, licensing claims and rights dependencies of the release as proposed, and records a written disposition for each.
- **Can satisfy it:** `COUNSEL_REVIEW` evidence (a counsel memo) for each sub-control, and a named independent reviewer.
- **Cannot satisfy it:** this package, an engineering review, a claim reconciliation, a regulatory crosswalk, or an owner authorization. This package makes no legal determination.

### RG-4. Recorded owner release authorization
- **Means:** after RG-1, RG-2 and RG-3 have passed with valid evidence, the owner records a signed, dated release authorization naming the Engine version, source commit and prompt.
- **Can satisfy it:** `OWNER_AUTHORIZATION` evidence (a signed authorization) and an owner decision of `release_authorized` resting on it.
- **Cannot satisfy it:** anything recorded before the prerequisites pass. The validator refuses an owner release authorization while any prerequisite is open, and an owner authorization satisfies no other gate.

### RG-5. Independent production QA
- **Means:** a QA reviewer independent of the candidate's author examines the authorized production deployment of the named Engine version against a test plan fixed in advance, after RG-4 has passed.
- **Can satisfy it:** `INDEPENDENT_QA` evidence (a QA report) and a named independent reviewer.
- **Cannot satisfy it:** a local test, a mock, a smoke test, a GET response, a preview deployment, a status code, or QA by the candidate's author.

## 4. Evidence classes
Every evidence item names one class, one provenance and one artifact kind, and they must agree.

| Class | Provenance | Can ever pass a gate? |
|---|---|---|
| `CONSTRUCTED_FIXTURE` | constructed | No |
| `MOCKED_TEST` | mocked | No |
| `LOCAL_CODE_REVIEW` | local | No |
| `SOURCE_REPORTED` | source-reported | No |
| `LIVE_EXECUTION` | live | Only RG-1.4 and RG-2.7, as an execution log |
| `INDEPENDENT_LABELING` | independent | RG-1 only |
| `INDEPENDENT_QA` | independent | RG-5 only |
| `COUNSEL_REVIEW` | independent | RG-3 only |
| `OWNER_AUTHORIZATION` | owner record | RG-4 only |
| `OPERATOR_CONTROL_EVIDENCE` | live | RG-2 only, of the matching kind |

## 5. What a PASS requires
The validator refuses PASS unless all of these hold:
1. An acceptance criterion, an actual result, an evidence date and a limitation statement are recorded.
2. Every sub-control of the gate is PASS (or NOT_APPLICABLE with a reason), and at least one is PASS.
3. Each PASS sub-control rests only on evidence of a class and artifact kind that can satisfy it. One wrongly classed item alongside valid ones still fails.
4. Every evidence item has a real SHA-256, a real date not later than the record or gate date, a reference of the form `git:<40-character commit>:<path>` or `external:<identifier>`, and its own limitation.
5. For RG-1, RG-4 and RG-5, the evidence names the same Engine version as the record. Every gate names the record's Engine version, source commit and, where it applies, prompt identity. A record copied from one Engine version to another fails.
6. Where independence is required (RG-1, RG-3, RG-5), an independent reviewer is named who is neither the record author nor the deciding owner.
7. Its prerequisites have passed with valid evidence (RG-4 needs RG-1 to RG-3; RG-5 needs RG-4).

The package conclusion is `ALL_GATES_RECORDED_PASS` only when all five gates pass; otherwise it is `INCOMPLETE_GATES_OPEN`. Even an all-pass record is not itself an authorization: the authorization is the owner decision on RG-4.

## 6. Why local testing and public documentation are not production evidence
The local candidate's tests show how its code behaves on material its author constructed, with a scripted stand-in for the model. They cannot show how a real model behaves on real records, whether access controls operate on a real database, whether deletion runs, or whether a deployment can be restored. A public page or a written policy states an intention or a design; it is not a record that the design executed. On 13 September 2026 every route returned 200 while a deployment never ran (CLAUDE.md 36.8), which is why a status code is never treated as evidence here.

## 7. Adding a future evidence item
1. Produce the artifact outside this package (an operator export, a counsel memo, a signed authorization, a QA report).
2. Store it where it can be identified later: at a pinned path in the repository (`git:<commit>:<path>`) or with an external identifier (`external:<id>`). Do not commit confidential or personal material to this public repository; use an external identifier and keep the artifact in an access-controlled store.
3. Compute its SHA-256 over the exact bytes and record it with its class, provenance, kind, date, the Engine version it applies to, and its own limitation.
4. Attach it to the sub-control it supports, update that sub-control's status and missing dependencies, and update the gate only when every rule in section 5 holds.
5. Run `node lib/release-gate/cli.mjs validate <record>` and `node tests/release-gate/run-all.mjs`. Regenerate the report with `node lib/release-gate/cli.mjs report <record> docs/architecture/CURRENT_RELEASE_GATE_REPORT.md`.
6. A new Engine version needs a new record. Records are not copied forward.

Owner, counsel and independent-reviewer fields are filled only from the actual instrument. They are never filled in advance or by inference.
