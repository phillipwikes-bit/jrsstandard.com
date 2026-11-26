# Practitioner blind-review protocol (DS-N1)

Purpose: collect early, honest evidence of whether DS-N1 reports the issues an independent practitioner finds in a decision record. It is not an accuracy study.

## Rules
1. **Fictional material only.** Every record is constructed. No real person, organisation, case or customer data.
2. **Records stay private while in use.** Records, predictions and coded answers are kept outside this public repository (owner's private store). Only aggregate counts may be published, and only with the practitioner's agreement.
3. **Record DS-N1's output first.** Commit the engine, then run `preregister.mjs` on the record and note the printed SHA-256 before the record is sent. A prediction file is never overwritten.
4. **One question, no hints.** Send the record and its supporting documents with one question: "What can't you rebuild from it?" Do not say what DS-N1 found or how many gaps were planted.
5. **Code the answer, then compare.** Code each distinct point the practitioner raised to one category in `lib/ds-n1/practitioner-trial.mjs` (`other` if none fits; mark `partial: true` only where DS-N1 reported a narrower version of the point). Coding is done by someone other than the developer where possible; when the developer codes, say so.
6. **Never tune on a used record.** A record that exposed a miss cannot be used as evidence for the fix. Fixes are tested on a new constructed record.
7. **Report with denominators.** Use `compare.mjs`. Report raised, matched, partial, missed, DS-only, and the Wilson interval. Partial matches are never counted as matches.
8. **Consent and credit.** Feedback is used and credited only with the practitioner's written agreement on the exact wording, and only after they see where it will appear. Credit is updated or removed if validation claims change.

## Commands
```
node tests/ds-n1/practitioner/preregister.mjs <private>/AR-81.json <private>/AR-81.prediction.json
node tests/ds-n1/practitioner/compare.mjs <private>/AR-81.prediction.json <private>/AR-81.R2.coded.json [...]
```
Coded file: `{ "record_id": "AR-81", "reviewer": "R2", "points": [{ "category": "sequence", "text": "approval before evaluation" }] }`.
Reviewers are identified by code (R1, R2, ...) in coded files; the key to names is kept privately.
