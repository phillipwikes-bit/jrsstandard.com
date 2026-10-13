# Cognitive Controls Boundary (v0.2 remediation layer)

**Cognitive Controls are documentation controls.** They examine the record, never the person who wrote it. Code: `lib/engine-evidence-contract/remediation.mjs`, which wraps the 0.1 detectors in `lib/engine-assurance/cognitive-controls.mjs` without changing them.

## Remediation object

| Part | Content | Constraint |
|---|---|---|
| detect | The observed documentation pattern, with exact record spans | Pattern of the text only |
| reflect | Why a reviewer should pause | No statement about a person |
| correct | A neutral record-completion question | Must end with "?"; no directive, recommendation, decision, or modal of obligation |
| learn | Optional checklist or codebook improvement | Same constraints |

Corrective questions in use: "What record identifies the authority or evidence cited in this passage?", "What evidence links the stated risk to the requested access, and which risk statement does the record rely on?", "What date establishes the decision sequence, and which source document records it?", "What calendar date, or what event, does this time reference correspond to, and what event would trigger renewal, expiry, or reassessment?", "Who does the record identify as responsible for this action, and what date or follow-up point does it set?", and others listed in the code.

Each object is linked to one condition (`related_condition`) as a reviewer routing aid. A control never changes a condition status.

## What is excluded

A final decision; a recommended business action (approve, reject, deny, grant, revoke, terminate, escalate); therapeutic advice; a diagnosis; a credibility or honesty assessment; any statement about mental state, emotion, intent or motive. `checkRemediationNeutral()` runs on every object; an object that fails is **withheld and reported**, never rewritten. Result validator RV-08 re-checks every attached object.

## Findings during the build

- The first neutrality check missed "Should the access be revoked?", a recommendation phrased as a question. The guard now rejects any modal of obligation and any revocation or termination verb.
- The widened guard then withheld the 0.1 CC-04 learning note ("terms that should prompt a request"). The 0.1 package was not edited; v0.2 supplies its own wording (`LEARN_OVERRIDES`).
- Mutation M-09 (guard disabled) initially survived because the probes checked only the current, neutral outputs. A probe now tests the guard directly against advisory text.

## Claim, local engineering evidence, interpretation, limitation, external evidence

- **Claim.** Remediation output stays neutral and documentation-focused.
- **Local engineering evidence.** Test section E: remediation over all 0.1 and v0.2 fixture records, every question ends with "?", an independent vocabulary scan finds no advice or person-directed language, five drift examples are caught, the four example questions from the assignment pass. Mutations M-09 and M-17 are killed.
- **Interpretation.** For the templates in this package, drift into recommendation or personal assessment is detected.
- **Limitation.** The guard is lexical. A recommendation worded without any listed term (for example a leading question that names no action) could pass. Detection is per pattern; it does not judge whether a question is useful.
- **External evidence still required.** Reviewer assessment of whether the questions help complete records, and a review of the vocabulary lists by someone other than their author.
