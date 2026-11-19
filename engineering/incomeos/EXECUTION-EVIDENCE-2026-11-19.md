# Execution evidence: three practitioner-derived advisory templates (2026-11-19)

## What changed
- `lib/ds-n1/detection-templates.mjs` (0.2.0-dev): three advisory templates.
  - `approver_role_not_stated`: an authority claim names its actor, and no sentence of the record names that actor with a role.
  - `conclusory_evidence_summary`: a claim reports a bare result ("no material issues were identified") and the record never says what was tested or examined.
  - `no_stop_or_redress_path` (`ai_action_authorization` only): the record states no way to stop the action or for an affected person to ask for it to stop.
- All three are advisory: reported to the reviewer, `changes_review_status: false`. No finding, status or frozen evaluation result changes.

## Origin
A practitioner reviewed constructed record AR-52 blind and raised these three points; DS-N1 had not flagged them. The practitioner agreed in writing that the points may be turned into checks and that they may be credited as a practitioner who gave feedback, on conditions: they see the attribution wording before publication; it must not read as an endorsement; fictional material only. Their name is therefore not recorded in this repository until the wording is approved. Practitioner credit: REQUIRES HUMAN REVIEW (owner and practitioner).

## Evidence boundary
- AR-52 was used to design these checks, so it is not evidence that they work. It stays out of the repository.
- Tests use a separate constructed record, AR-61, in `detection-templates.test.mjs`: each template fires on the deficient form and clears when the missing statement is added; a role stated for a different person does not clear the role check; the stop-route check does not apply to other record classes.
- Fixture `AUTH-P01` (the supported authorization exemplar) lacked an approver role and a stop route, so two of the new templates fired on it. Two supported statements (C6, C7, cited to memo S3) were added so it remains a fully supported exemplar. Status is unchanged (READY_FOR_HUMAN_FINALIZATION).
- Lexical word lists only. False-warning rates are NOT ESTABLISHED.
- The date-order check (`assessment_after_decision`) stays advisory. Making it a status-changing finding changes frozen evaluation results and needs owner authorization.

## Runs
- Workflow suites: 20/20 and 118/118 pass. UI browser checks: 28/28 (Chromium emulation).
