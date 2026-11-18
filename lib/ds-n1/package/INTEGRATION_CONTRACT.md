# DS-N1 integration contract

Version: record `ds-n1.record/1.0`, event `ds-n1.event/1.0`, report `ds-n1.report/1.1`, export `ds-n1.export/1.0`, rules `ds-n1.rules/0.2.0`. Local library only: there is no network API, and the engine makes no network or model calls.

## 1. Input: a record package (JSON)

| Field | Required | Meaning |
|---|---|---|
| `schema` | yes | `ds-n1.record/1.0` |
| `record_id`, `record_version`, `title` | yes | Identifiers, 1 to 64 characters `[A-Za-z0-9._-]` for IDs |
| `record_class` | yes | One of the five record types in `README.md` |
| `data_classification` | yes | Must be `constructed_fictional`. Real records are refused. |
| `text` | yes | The decision record as written |
| `entities[]` | no | `{entity_id, name, aliases[]}`: people or organisations named in the record |
| `sources[]` | yes | `{source_id, title, version, text, events[]}`; each event `{role, date, actor}` (date `YYYY-MM-DD`) |
| `claims[]` | yes | `{claim_id, kind, quote, citations[], event?, actor?, reasoning?}`. `kind` is `fact`, `chronology`, `authority` or `conclusion`. `quote` must appear in `text`. Each citation is `{source_id, quote}` and its `quote` should appear in that source. |

Limits: record text 200,000 characters; source text 500,000; 50 sources; 200 claims; 20 citations per claim; 5,000 events.

Refusals happen before any analysis: an unsupported or excluded `record_class`, a non-fictional classification, excluded-domain content, or identifier-like data (e-mail addresses, national identifiers, phone or account numbers) returns status `REFUSED_SCOPE` and the matched value is never echoed.

## 2. Calls

```js
import { openReview, deriveState, applyAction, buildReport, buildExport, serializeExport, verifyExport } from './lib/ds-n1/index.mjs';
import { buildCognitiveControls } from './lib/ds-n1/cognitive-controls.mjs';
import { buildCognitiveObservations } from './lib/ds-n1/cognitive-observations.mjs';

let session = openReview(record, { at: '2026-11-18T12:00:00Z' });   // caller supplies UTC time
const state = deriveState(session);                                  // status, claims, findings
const questions = buildCognitiveControls(state);                     // one question per finding
const lenses = buildCognitiveObservations(state);                    // wording and reasoning lenses
session = applyAction(session, { type: 'request_evidence', at: '...Z', reviewer: { reviewer_id, name }, finding_id, request });
const report = buildReport(session, { generated_at: '...Z' });
const exported = serializeExport(buildExport(session, { generated_at: '...Z' }));
verifyExport(exported);                                              // VERIFIED_INTERNALLY_CONSISTENT or a reason
```

All functions are pure and deterministic for the same inputs. A session is the record plus an append-only, hash-chained event list; state is always derived by replaying it.

## 3. Output

**Status:** `READY_FOR_HUMAN_FINALIZATION` (no unresolved finding under these rules; not sufficiency or approval), `REVIEW_REQUIRED`, `HOLD`, `INCOMPLETE`, `REFUSED_SCOPE`, `ERROR`.

**Findings** carry `finding_id`, `claim_id`, `code`, `severity` (`critical`, `review` or `blocking`), `condition`, `explanation`, `question`, source location and `status`. Codes: `UNSUPPORTED_CLAIM`, `UNTRACEABLE_AUTHORITY`, `REASONING_NOT_TRACED`, `UNMAPPED_ASSERTION`, `RELEVANCE_NOT_ESTABLISHED`, `SOURCE_MISSING`, `QUOTE_NOT_FOUND`, `NEGATION_CONFLICT`, `SUBJECT_MISMATCH`, `INSTRUCTION_LIKE_CONTENT`, `QUALIFICATION_OMITTED`, `CONTRARY_CLAUSE_OMITTED`, `CLAIM_NOT_IN_RECORD`, `CLAIM_LOCATION_AMBIGUOUS`, `ACTOR_NOT_ESTABLISHED`, `EVENT_ROLE_CONFUSION`, `DATE_MISMATCH`, `DATE_NOT_ESTABLISHED`, `DATE_ROLE_UNVERIFIED`.

**Cognitive lenses** (read-only, never change a finding or status): observation versus inference, evidence, alternatives and state questions per finding; plus `unsupported_certainty`, `premature_closure` and `alternative_interpretation` observations.

**Safeguards and templates** (read-only): `buildSafeguards(state)` from `cognitive-safeguards.mjs` returns `{ lenses, controls }`: 14 lenses and the eight CC-* controls, each with a trigger, a question, recommended reviewer actions and, for CC-ESCALATE, a route. `runDetectionTemplates(state)` from `detection-templates.mjs` returns hits for the 23 named templates, each marked `finding`, `observation` or `advisory`; advisory hits never change status. Coverage: `FEATURE_COVERAGE.md`.

## 4. Reviewer actions

`attach_citation`, `revise_claim`, `add_reasoning`, `request_evidence`, `record_limitation`, `escalate`, `override`, `leave_pending`, `final_disposition`, `finding_feedback`. Every action names the reviewer. Rules enforced: a critical finding cannot be closed as a limitation; an override needs at least 20 characters of the reviewer's own rationale; acceptance is refused unless status is READY; acceptance of a record that is READY only by overriding critical findings must acknowledge those overrides; a later edit marks an acceptance stale.

## 5. What the log proves

The event log and export checksum show internal consistency: an edited entry is detected. They are unsigned, so they do not prove who acted or when.
