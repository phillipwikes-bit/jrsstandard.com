# T-4 — `engine_reviews` Retention · BOARD DECISION — OWNER-DELEGATED

**Decision ID: BD-10 · 2026-09-16 · Prior status: OPEN (raised by Round B as the one genuinely
new question this cycle created)**

**This is a data-governance architecture decision. No legal question arose during the analysis,
so it is decided rather than escalated.**

---

## Evidence reviewed

Schema `supabase-engine-reviews-setup.sql`; write path `logReview()` in both engine routes;
read paths `api/engine-activity.js` and `research-data.html`; `lib/retention/policy.js`;
reproducibility reporting in `research.html` and `research-data.html`; every repository
reference to the table.

## Field-by-field classification — the table has no single governance class

| Field | Class | Record-derived? | Needed for |
|---|---|---|---|
| `id`, `created_at`, `request_id` | Metadata | No | Audit trail, correlation |
| `runs`, `engine_version` | Metadata | No | Reproducibility context |
| `determination` | Evaluation result | No | Activity reporting |
| `conditions[].status` | Evaluation result | No | Activity reporting, per-condition rates |
| `overall_consistency` | Reproducibility metric | **No** (T-3) | Reproducibility reporting |
| **`conditions[].note`** | **Model output about the record** | **YES** — the prompt requires it "grounded in the record text" | Operational debugging |
| **`finding.compliant_version`** | **Model rewrite of the passage** | **YES**, up to 600 chars | Operational debugging |
| `finding.condition_triggered` | Evaluation label | No | Debugging |
| **`input_preview`** | **Raw record excerpt** | **YES** | **Nothing. Column exists; no longer written since 2026-08-14** |

**FACT: this is a MIXED table.** Treating it as one governance object is what produced the
question in the first place.

## Does deleting a row destroy research evidence?

**No — established, not assumed.** Reproducibility reporting reads `findings_history` and
`study_runs`. **No research script reads `engine_reviews`**, and the table holds **zero rows**.

**But it IS listed in the research data room** (`research-data.html`) as *"Automated Engine
Reviews"* with `select=*`. **That export would return the notes and `compliant_version`.**
Recorded below as a new finding.

## Options evaluated

| | Option | Assessment |
|---|---|---|
| A | No retention rule | **REJECTED.** This is the unchosen indefinite default that BD-03 exists to correct. It cannot be justified affirmatively for a table holding rewrites of customer passages |
| B | Apply the 24-month `interaction_events` rule | **REJECTED.** Page-view telemetry and a model rewrite of someone's disciplinary record are not the same risk. Adopting it by inference is precisely what Round B warned against |
| C | A single shorter period for the whole table | **REJECTED.** It would delete the reproducibility metrics and per-condition rates along with the sensitive text, losing evidence to solve a privacy problem |
| D | Field-level retention | **Close, and folded into F** |
| E | Stop persisting record-derived content entirely | **REJECTED, with reasons.** It removes the only means of investigating a disputed evaluation, and a customer querying *"why did you flag my record"* would get statuses and nothing else. It also weakens the manifest architecture's debugging story. Privacy-sounding is not the test |
| **F** | **Hybrid: retain metadata and evaluation results; expire record-derived fields on a short clock** | **ADOPTED** |

## THE DECISION

**Record-derived fields expire at 90 days. The rest of the row is retained.**

| Treatment | Fields |
|---|---|
| **Expire at 90 days** (nulled in place, row retained) | `conditions[].note`, `finding.compliant_version`, `input_preview` |
| **Retained** | `id`, `created_at`, `request_id`, `determination`, `conditions[].status`, `finding.condition_triggered`, `runs`, `overall_consistency`, `engine_version` |

**Why 90 days.** Long enough that a customer or partner can query a specific evaluation and get
a substantive answer within an ordinary support window. Short enough that a rewrite of someone's
record does not sit in a database for years serving no purpose. **Beyond 90 days the debugging
value of the exact wording is close to nil, while the privacy cost is unchanged.**

**Why null in place rather than delete the row.** The row's metadata and statuses are the
reproducibility evidence. Deleting rows would destroy the per-condition rate history to remove
text that can be removed on its own. **Minimum necessary deletion, not maximum.**

## Satisfaction of the ten criteria

Data minimization **yes** · privacy **yes, on the sensitive fields specifically** · evidentiary
preservation **yes, statuses and metrics survive** · research integrity **yes, no research
source touched** · security **yes, shrinks the window on the most sensitive field in the
estate** · operational necessity **yes, 90 days covers a support window** · independent
reviewability **yes, the manifest carries what a reviewer needs** · reversibility **partial,
and stated: expiry is irreversible once run, which is why it is 90 days and not 30** ·
architectural simplicity **one rule, two classes** · transferability **yes**.

## NEW FINDING arising from this analysis — T-11

**`research-data.html` offers `engine_reviews` as a public data-room export with `select=*`.**
That export would return `conditions[].note` and `finding.compliant_version` in full, to anyone
with the publishable key. **It is a second exposure path alongside the one B-013A addresses,
and nobody had flagged it.**

**Latent, not realised: the table holds zero rows.**

**BOARD DECISION (BD-11): narrow the data-room export to the same projection the activity
endpoint uses.** A research data room should offer the evaluation record, not the model's prose
about a customer's passage. **Implemented below.**

## Implementation boundary

The policy module computes; **it does not delete**. Applying expiry to production rows is a
production data operation and is **not authorized here**. With zero rows, the first application
would affect nothing.

**STATUS: BOARD DECIDED → IMPLEMENTED → TESTED. Production operation NOT performed.**
