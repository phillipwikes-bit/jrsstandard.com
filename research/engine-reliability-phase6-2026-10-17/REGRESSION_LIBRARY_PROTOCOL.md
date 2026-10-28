# Regression Library Protocol

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

## Library

62 new synthetic scenarios. No existing fixture was changed. Each is derived from the fictional GC-001 record (asserted byte-identical by the authoring script) by one stated edit to the record, the candidate response or the submission.

| Category | Minimum | Authored |
|---|---|---|
| Evidence quotation and span integrity | 10 | 11 |
| Text presence versus semantic support | 10 | 10 |
| Chronology ambiguity, conflict and omission | 10 | 10 |
| Reasoning traceability and unsupported conclusions | 8 | 8 |
| Sufficiency and missing-decision-basis patterns | 8 | 8 |
| Cognitive Controls neutrality and bounded language | 6 | 6 |
| Excluded-domain refusal and reworded scope attempts | 4 | 4 |
| Instruction-injection and malformed-input refusal | 4 | 5 |

Expectation kinds: invariant 8, expected degradation 37, expected refusal 7, known open failure 10.

## Admission

`validateScenario` refuses a scenario unless it:
- begins with the marker `SYNTHETIC ENGINEERING FIXTURE.`;
- names its category and uses that category's identifier prefix;
- states its expected safe behaviour and a limitation, both free of forbidden status words;
- carries the fixed provenance note ("Authored for local engineering only...");
- runs only in a local mode;
- contains nothing that looks like personal data.

A known open failure must name a register entry and the exact failure it predicts.

## Expectations before execution

The authoring script never imports a compiler. Expectations were written from the v0.3 specification and source. They were then hashed into `EXPECTATION_SEAL.json` at 2026-10-17T10:43:10Z, together with every input and the evaluator code hash. The first execution followed at 10:43:26Z.

Before sealing and before any execution, one universal invariant was corrected from code reading alone. A not-assessed finding is now checked for a refusal recorded against it, rather than for the refusal limitation, which the compiler places on the refusal node.

No expectation has changed since the seal. `AUTHORING_DEFECTS.json` does not exist because no authoring defect was recorded. The seal still verifies.

## Evaluation

Every scenario is checked against its sealed expectation and against universal invariants U1 to U9:

| Invariant | Requirement |
|---|---|
| U1 | Release status unchanged |
| U2 | Exactly one limitation per finding, presence kind when assessed, and a refusal recorded against every unassessed finding |
| U3 | Every finding routed to review |
| U4 | Sufficiency never supported |
| U5 | No assessment after a stopped intake |
| U6 | No supported or gap result without an evidence trail |
| U7 | Neutral, review-routed Cognitive Controls with none withheld |
| U8 | No provider or network call |
| U9 | Instruction-risk limitation present whenever instruction risk is detected |

Results: `as_expected`, `known_open_failure_reproduced`, `known_open_failure_not_reproduced` (routed to a person) or `unexpected`.

## First-run result, unchanged since

51 as expected; 10 known open failures reproduced exactly as predicted; 0 not reproduced; 1 unexpected (P6-RT-07). The current run reproduces the first run byte for byte (`sha256:e67dc30c...43b2`).

## Adding a scenario later

Author it, admit it, seal a new library version before running it, and record any authoring defect separately with date, reason and before/after expectation. Never revise an expectation to match an output.
