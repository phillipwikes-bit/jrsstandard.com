# Decision Spellchecker (DS-N1): technical package

Decision Spellchecker reads a written decision record, such as an authorization, an investigation report, a production rationale or a memo, and checks each statement against the source passage it cites. Where they diverge, it puts one targeted question to a human reviewer and records what the reviewer does. It never decides.

**Status:** experimental prototype. Constructed fictional records only. Not validated, not a production release, not legally cleared. See `ASSET_BOUNDARY.md`.

## What is in the package

| Part | Files |
|---|---|
| Engine | `lib/ds-n1/*.mjs`: record validation, deterministic checks, review session and hash-chained event log, report, export and export verifier |
| Cognitive lenses and safeguards | `cognitive-controls.mjs`, `cognitive-observations.mjs`, `cognitive-safeguards.mjs`, `reflective-guidance.mjs`, `cognitive-source-trace.mjs` |
| Detection templates | `detection-templates.mjs` (37 named templates) |
| Document reading | `extract.mjs` (plain text), `docx.mjs` (Word) |
| EU AI Act lens | `eu-ai-act.mjs`; legal text and crosswalk in `package/` |
| Omission check | `omissions.mjs` |
| Reviewer, author and reading pages | `lib/ds-n1/ui/` (local only, served by `serve.mjs`; the reading page is at `/read`) |
| Starter edition | `package/build-starter.mjs` builds one offline HTML file |
| Tests and fictional fixtures | `tests/ds-n1/*.test.mjs`, `tests/ds-n1/fixtures/`, `tests/ds-n1/fixtures-partner/` |
| Integration contract and coverage | `INTEGRATION_CONTRACT.md`, `FEATURE_COVERAGE.md` |
| Packaging | `build-bundle.mjs`, `verify-bundle.mjs`, `ASSET_MANIFEST.json` (generated) |

Runtime dependencies: none (Node.js 20 or later). Playwright is optional, for PDF export and browser tests only.

## Run

```
node lib/ds-n1/package/verify-bundle.mjs .   # check every file against the manifest
node --test tests/ds-n1/*.test.mjs           # unit tests
node lib/ds-n1/serve.mjs 4317                # local reviewer page at http://127.0.0.1:4317
```

## Record types

`supplier_access_exception`, `ai_action_authorization`, `workplace_investigation_report`, `discovery_production_rationale`, `ai_drafted_legal_memo`. Every type checks documentation quality only. Employment, housing, lending, insurance, medical and legal-outcome content is refused, except that investigation reports may contain employment wording and AI authorization records may concern any of these areas (EU AI Act Annex III; documentation quality only).
