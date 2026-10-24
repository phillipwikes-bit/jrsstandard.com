# Role Separation and Contamination Plan

**NON-OPERATIVE. Prepared 2026-10-23. No named person is assigned by this package. All
roles are contingent on formal authorization at gate G5.** Independent evaluation is not
authorized. B-018 remains OPEN. Release status remains NO_GO_NOT_VERIFIED.

## 1. Roles

| Role | Permitted access | Prohibited access | Conflict restrictions | Required records | Escalation trigger |
|---|---|---|---|---|---|
| Owner and product sponsor | Gate decisions; final results after adjudication | Labeling; adjudication; sealed labels before G10; operating the candidate | May not hold any labeling, adjudication or custody role | Written gate decisions | Any request to view labels or results before G10 |
| Engineering author | Frozen candidate package; synthetic development fixtures | Sealed evaluation material; labels; adjudication notes | May not label, adjudicate, hold custody or review results | Freeze record; change log (empty after freeze) | Any request to change the candidate after G2 |
| Evaluation coordinator | Schedules; role list; independence and deviation logs | Label content; sealed material content | May not label or adjudicate | Independence checks; deviation log; access log | Any separation failure or unlogged access |
| Independent labeler one | Assigned evaluation items; labeling form; protocol | Candidate output; the other labeler's labels; adjudication notes | Independent of the engineering author, owner and labeler two | Locked labels with rationale and timestamps | Exposure to candidate output or another label |
| Independent labeler two | As labeler one | As labeler one | Independent of the engineering author, owner and labeler one | As labeler one | As labeler one |
| Adjudicator | Disputed items; both labels and rationales; protocol | Candidate output before adjudication; items not in dispute | Does not label the same item; independent of the engineering author and both labelers | Adjudication record with reasons; first-pass labels preserved unchanged | A dispute the written rule cannot resolve |
| Data custodian | Sealed material and labels in custody outside the repository | Candidate development; result interpretation | May not label, adjudicate or operate the candidate | Custody chain; release and destruction log | Any access outside the approved list |
| Results reviewer | Adjudicated results; limitations; deviation log | Changing labels, adjudications or the candidate | Independent of the engineering author | Review record listing limits and any deviations | Any proposed statement beyond G10 authority |

A technical operator, if one is needed to run the frozen candidate, follows the
engineering-author restrictions and never sees labels before adjudication (consistent with
the existing protocol's technical_operator role).

## 2. Material separation

| Material | Where held | Who may access | Separation rule |
|---|---|---|---|
| Synthetic engineering fixtures | Repository (existing) | Engineering author | Development and regression only; never reported as evaluation results |
| Future synthetic calibration material | Outside the repository | Labelers, adjudicator, coordinator | Disjoint from evaluation material; calibration outcomes never reported as performance |
| Future evaluation material | Outside the repository, in custody | Data custodian; labelers for labeling only | Created only after G3 to G6; never copied into the repository |
| Any future holdout | Outside the repository, sealed | Data custodian | No developer access; never reused for development or calibration once unsealed |
| Labels | Custody, locked on submission | Data custodian; adjudicator for disputed items | No developer or owner access before G10 |
| Adjudication notes | Custody | Adjudicator; results reviewer after adjudication | First-pass labels preserved; adjudication added, never substituted |
| Results | Custody until G10 | Results reviewer; owner and counsel at G10 | No external representation without separate authorization |

## 3. Contamination controls

- No material moves from evaluation or holdout custody into development or calibration.
- Any exposure of evaluation material, labels or results outside its approved access is
  logged and triggers the stop rules.
- The candidate package hash and environment are recorded at freeze and at execution; any
  difference stops the evaluation.
- Labelers do not see candidate output before their labels are locked.
- Calibration items and evaluation items are drawn from disjoint pools recorded before
  labeling.
