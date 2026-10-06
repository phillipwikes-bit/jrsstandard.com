# Review Engine local development candidate 0.1.0-local.1

**Status:** local development only. Not deployed, not validated, not a public service. Owner instruction 2026-10-06, under `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`.

## What it is
`review-candidate.js` is the 0.1.0 Review Engine logic from historical commit `d2da83c` (`api/review-engine.js`), rebuilt as a plain module with no route, no network access, no environment reads and no storage. The model call is a function the caller supplies; there is no default, so the module cannot reach a provider on its own.

## Scope
- Completed, non-HR supplier-access exception drafts only. The caller must declare `record_type: "supplier_access_exception"`, `completion_status: "completed"` and `hr_related: false`.
- Records that mention employment, housing, lending, insurance, medical or legal-outcome decisions are refused. This screen is a word list: it can only refuse, and passing it does not show a record is in scope.
- Human review is always required. The output has no overall determination and no score.

## What it reports
- The five JRS documentation review conditions, each `pass`, `review` or `gap` with a note.
- Documentation flaws, limited to: reasoning elision, evidentiary overreach, chronology collapse, extraction omission, truncation, unsupported content. Each flaw must quote the record word for word.
- Extraction failures, stated explicitly, never filled in:
  - excerpts not found in the record;
  - flaw types outside the list;
  - missing or invalid conditions;
  - a cut-off model reply;
  - a reply that is not JSON.
- Notes that infer a writer's emotional state, intent, hidden payoff or clinical condition are withheld, and the withholding is recorded.

## Changes from d2da83c
- **Removed:** the HTTP route, token auth, CORS, the rate limit and the Supabase write.
- **Truncation:** records over 8,000 characters are now refused. The old code cut them silently.
- **Removed outputs:** the overall determination ("ready" and the rest) and every number.
- **Renamed:** `compliant_version` is now `revision_needed`.

The header of `review-candidate.js` lists each change with its reason.

## Not established
- Accuracy, on any record.
- Whether the prompt behaves as instructed on a real model. No provider has been called.
- Fitness for any use. Release gates: none passed (handoff, "Release-gate status").

## Tests
`node tests/engine-candidate/candidate.test.mjs`: mocked model, `fetch` trapped, one constructed fictional record (`tests/engine-candidate/fixtures/SYNTHETIC-SAE-01.txt`). Development and test material here must never be used in a sealed holdout.
