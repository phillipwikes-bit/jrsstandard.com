# Engine to Manifest integration, candidate implementation

**Status:** Local branch implementation. Deployment, live authentication, external security review and Engine validation are not established by these files.

## Current code behavior

The versioned `POST /api/v1/review-engine` route accepts `include_manifest: true` from an authenticated bearer-token caller. It returns the ordinary Engine response with one additional `manifest` field. Calls without the option keep the prior response shape. Open sandbox calls requesting the artifact receive a 401 response. The legacy `/api/review-engine` mirror uses the same logic.

The server-side modules are inside `api/_manifest/`, which Vercel bundles with the API route while files beginning with an underscore are not registered as endpoints. `lib/manifest/` retains compatibility exports for offline tools and remains excluded from public deployment. The handler passes the complete trimmed submitted text and its actual result to `api/_manifest/from-engine.js`. The adapter checks metadata, five condition keys and statuses, run count, and consistency between the condition statuses and the Engine determination. The builder hashes the evaluated 8,000-character portion. If the submitted text is longer, the Manifest flags truncation and includes a separate hash of the full text. It never embeds the complete raw record. The artifact may contain record-derived condition notes. An unsigned hash proves only self-consistency against a retained copy or independently stored hash.

The Engine's five keys retain the declared `review_engine_keys` vocabulary. The unresolved Codebook mapping is not inferred. The output requires human review and makes no claim that the Engine result is accurate or the underlying decision is justified.

## Local verification

From the repository root:

```sh
node tests/platform-evaluation/engine-to-manifest.mjs
node tests/manifest/run.mjs
node tests/engine/auth-matrix.mjs
node tests/platform-evaluation/run.mjs
node tests/engine/score-holdout.mjs
```

The integration test invokes the actual v1 handler with a mocked provider and no database credential. It checks explicit opt-in, old default behavior, auth boundary, condition preservation, request correlation, schema and hash validation, truncation, tampering, and fail-closed malformed model statuses. This is a local integration test, not a live inference test or an accuracy study.

`tools/score-engine-holdout.mjs` can score a separately prepared, locked JSON file after independent reviewers assign reference labels. Its input requires `protocol_id`, `locked_at`, and `cases`, each with a unique `id`, `split: "holdout"`, and `reference` and `prediction` objects. Each object has `conditions` keyed by the five Engine keys with `pass`, `review`, or `gap`, plus `determination` (`ready`, `review_required`, or `gap_identified`). It reports three-class confusion matrices and per-label sensitivity, specificity, precision and error rates with Wilson intervals. It refuses duplicate or missing labels. The file header does not prove the set was genuinely held out, and the script does not assess source fidelity, sampling, critical error severity or independence. A validation decision requires the separately dated protocol and qualified review.

## Controlled live check after deployment

Use a purpose-created synthetic record and a separately provisioned evaluation token. The operator can run:

```sh
REVIEW_API_TOKEN='[evaluation token]' node tools/run-live-manifest-evaluation.mjs \
  --record synthetic.txt --out .local-evaluations/run-001
```

The script is restricted to the designated HTTPS endpoint, requires an explicit `SYNTHETIC` marker, validates the returned Manifest locally, compares the response and header request identifiers, and writes response, Manifest and evidence files with owner-only permissions. Do not commit these outputs. Record deployment ID, current commit, model identifier, request timestamp, permitted scope and artifact hashes in the evaluation record. Revoke the token when the defined evaluation ends. This command has not been run as evidence of a deployed capability here.

## Unresolved engineering and validation gates

- No authenticated deployed run, independent operator rerun or customer workflow has been observed in this change.
- The API still logs record-derived results to Supabase for authenticated requests when a service-role credential is configured. Retention, deletion, access and processor claims require production verification.
- The provider model and prompt are not proved stable solely by the Engine version string. Pin actual provider identifiers and deployment configuration in a release record.
- The Engine still requires a locked, independently adjudicated evaluation set, predeclared pass criteria, per-condition error analysis, repeated runs, robustness tests and workflow assessment before any scoped validation claim.
- A local Manifest response is not a customer-controlled evidence store or a signed artifact. Custody and authenticity controls remain evaluator responsibilities unless separately engineered and verified.

Public pages describing the deployed endpoint must retain their existing current-state boundary until this branch has been deployed and a live check succeeds. Then reconcile them with the observed behavior and its limits.
