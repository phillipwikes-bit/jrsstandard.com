# Independent Evaluation Protocol (execution-disabled)

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Source of record: `evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json`, protocol JRS-IEP-0.1-draft, seal `sha256:26efd3a042965808fbdaf13994b6283aff60fd5f0077dad408fe2e78782dc1b3`. Execution enabled: no. Authorization: not_authorized. Conducted: no. `executeProtocol()` always refuses.

This protocol generates no material, recruits no one, contacts no one, reads no record and reaches no external system. It exists so that a future evaluation, if the owner authorizes one, does not have to be designed from scratch.

## Candidate under evaluation

phase7-candidate (0.3.1-candidate), base v0.3-evidence-graph (0.3.0-local). Identified by its Phase 8 package hash; any change before Gate D invalidates the freeze.

## Questions

| Id | Area | Question |
|---|---|---|
| Q1 | quote presence and offset accuracy | When the candidate marks a quotation as present, is the quoted text found in the record at the recorded offsets? |
| Q2 | human-review routing | Does the candidate route to human review the conditions that independent labelers judge should not receive a supported status? |
| Q3 | chronology conflict detection | Does the candidate report the chronology conflicts that independent labelers identify, and only those? |
| Q4 | exclusion and refusal behaviour | Does the candidate refuse records in excluded domains, and avoid refusing records outside them? |
| Q5 | Cognitive Controls neutrality | Do Cognitive Controls prompts stay neutral (no direction towards an outcome) as judged by independent labelers? |
| Q6 | presence versus semantic support | Where the candidate reports text presence, do labelers find that the text semantically supports the condition, and does the candidate avoid presenting presence as support? |

## Roles

| Role | Duties | May view sealed labels | Must be independent of |
|---|---|---|---|
| owner | Authorizes each gate; does not label, adjudicate or operate. | no | n/a |
| data_custodian | Holds and releases authorized material; keeps sealed labels outside the repository. | yes | n/a |
| independent_labeler | Labels material blind to candidate output; independent of the developers and of each other. | yes | developer, technical_operator, owner |
| adjudicator | Resolves disputed labels under the written rule; does not label the same item. | yes | developer, independent_labeler |
| technical_operator | Runs the frozen candidate in the recorded environment; never sees labels before Gate E. | no | n/a |
| counsel_or_privacy_reviewer | Reviews material authorization, privacy and disclosure before Gate A and at Gate F. | no | n/a |

- No person holds both a developer or technical_operator role and a labeler or adjudicator role.
- Labelers do not see candidate output before labeling.
- Developers never access sealed labels.

## Materials

| Class | Use | In repository | Developer access |
|---|---|---|---|
| synthetic_engineering_fixtures | Development and regression only. Never used to report evaluation results. | yes | yes |
| calibration_material | Labeler training and rule calibration; results not reported as performance. | no | yes |
| sealed_evaluation_material | Blind execution only, after protocol freeze. | no | no |
| real_records | Prohibited unless separately authorized in writing under Gate A with counsel review. | no | prohibited by default |

## Blinding and contamination controls

- Developers have no access to sealed evaluation labels.
- Sealed evaluation material is never copied into the repository.
- No prompt, rule pack, model or code change after the protocol freeze (Gate B); any such change voids the freeze and requires a new freeze.
- Ambiguous or disputed labels go to the adjudicator under a written rule recorded before labeling; adjudication outcomes are recorded with reasons.
- The candidate package hash, environment and clock are recorded at freeze and at execution; any difference stops the evaluation.

## Measures

Defined in `EVALUATION_MEASUREMENT_DICTIONARY.md`. None is calculated in this package.

## Stop conditions

- source or data authorization gap
- counsel objection
- labeler independence failure
- sealed evaluation material contamination
- unexplained candidate drift (package hash differs from the freeze)
- provider or environment change
- any attempt to claim performance before the evaluation is completed

## Decision gates

| Gate | Name | Requires |
|---|---|---|
| A | material authorization | Owner and counsel or privacy reviewer authorize material classes, sources and retention in writing. |
| B | protocol freeze | Candidate package hash, rule packs, prompts, environment, measures and adjudication rule frozen and sealed. |
| C | independent labeling | Labelers confirmed independent; labels completed blind and sealed by the data custodian. |
| D | blind execution | Technical operator runs the frozen candidate; package hash and environment match the freeze. |
| E | adjudication | Disputes resolved under the written rule; measures calculated only now. |
| F | owner and counsel review | Owner and counsel review results and limits before any statement is made. |

Any change to the protocol is an `evaluation-protocol change` under the change-impact model: a new seal, and invalidation of any earlier freeze.
