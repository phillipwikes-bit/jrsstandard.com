# Cognitive Controls Review Guide

**Scratch-only human-review layer. Prepared 2026-10-24.** For use on synthetic material
until a pilot is separately authorized. No human review of pilot material has occurred.
B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. What this layer is

A structured review note that a human reviewer completes after the Engine has produced a
graph. It sits outside the frozen Engine: it is not part of the graph, the prompt, the
adapter's acceptance logic or any automated status. It cannot change any Engine output.

Source: the eight Phase 9 Cognitive Controls
(`research/engine-human-review-phase9-2026-10-20/COGNITIVE_CONTROLS_FOR_REVIEWERS.md`,
SHA-256 `4f08231e...7f9c`, read only and unchanged). The form's eight review items
(RC-01 to RC-08) reference all eight Phase 9 controls.

## 2. Before you start

The validator runs the nine-field provenance pair check on the graph and its execution
record. If it fails, the note is blocked (`review_blocked`) and review does not proceed.
A note cannot claim the check passed; the validator runs it itself.

## 3. The eight review items

| ID | Ask yourself | Phase 9 controls |
|---|---|---|
| RC-01 | Did I examine the record, the model response, the graph and the execution record as separate artifacts? | (procedural) |
| RC-02 | For each quotation, have I separated its presence in the record from whether its words support the proposition? | CC-PLAUSIBLE, CC-WORDS, CC-NEGATION |
| RC-03 | What is uncertain, ambiguous or missing, and which alternative readings did I consider? | CC-MISSING, CC-INTENT, CC-PLAUSIBLE |
| RC-04 | Did I give any weight to fluent wording, apparent completeness or expressed confidence? | CC-PLAUSIBLE |
| RC-05 | Is everything I wrote limited to what the record states, including its dates and stated basis? | CC-BASIS, CC-WORDS, CC-DATES |
| RC-06 | Were the graph and record complete, paired and digest-verified before review? | (provenance) |
| RC-07 | Does anything need escalation, and why? | CC-ESCALATE |
| RC-08 | What cannot be determined from the available evidence? | CC-ESCALATE, CC-MISSING |

## 4. States

Each item takes one state and a short note:

- `observed`: addressed; what was seen is recorded.
- `uncertain`: not settled by the evidence; left unresolved.
- `escalated`: needs review beyond this reviewer.
- `review_blocked`: could not be carried out.

The validator preserves these states. Its outcome is `review_blocked`, `escalated`,
`uncertain` or `observed`, in that order of precedence. It never produces a supported or
favorable outcome.

## 5. Required fields

- All eight items, each with a state and a non-empty note.
- `uncertainty_treatment`: how uncertain points were handled.
- `escalation_treatment`: `escalate` (true or false) and a reason.
- `support_observations` (optional): for a condition, the graph status exactly as the graph
  shows it, and whether the quotation's words support the proposition (`yes`, `no`,
  `uncertain`). `yes` is rejected if the graph does not show `supported`.

## 6. Not permitted

- Any field that sets or changes a status, finding or graph content (for example
  `status`, `final_status`, `override`, `findings`).
- Misreporting the graph's status.
- Clinical, diagnostic, therapeutic, performance, validation or release characterizations.

## 7. Limits

The layer checks structure, provenance and wording. It cannot check whether a reviewer
actually thought about each item, or detect bias that the wording does not show.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
