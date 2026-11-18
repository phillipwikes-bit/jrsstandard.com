# IncomeOS execution evidence, 18 November 2026 (E): DS-N1 licensing and integration package

Lane: DS-N1 (Claude Code). Builds on `claude/ds-n1-prospect-record-classes`. Owner instruction the same day: develop toward a prototype the owner intends to license (evidence record B), and toward the needs of a prospect list that includes legal-technology platforms.

## Change (all under `lib/ds-n1/package/` plus one test)

- `build-bundle.mjs`: copies an allowlist (engine, lenses, local pages, unit tests, developer and partner fixtures, these documents) to an empty directory outside the repository, refuses secret-like content, writes `package.json` and `ASSET_MANIFEST.json` with a SHA-256 for every file. Sealed HOLDOUT-2, isolation and stress sets, results and labelling packets are excluded.
- `verify-bundle.mjs`: reports missing files, hash mismatches and unlisted files.
- `README.md`, `INTEGRATION_CONTRACT.md` (input schema, calls, statuses, finding codes, lenses, reviewer actions and enforced rules, what the log proves; taken from the source), `ASSET_BOUNDARY.md` (inclusions, exclusions, disclosures: public history, AI-assisted development, no DS-A validation, regulated uses, no licence granted).
- `tests/ds-n1/package.test.mjs`: 4 tests, added to the DS-N1 workflow.
- Written for DS-N1. No code from the owner's separately offered product.

## Executed (local)

Built package: 67 files, 568 KB, zero runtime dependencies; `verify-bundle` ok; `npm test` inside the extracted package: 88 pass, 0 fail. Tamper test: an edited file gives HASH_MISMATCH and an added file UNLISTED_FILE. Repository suites: bridge 20/20, programme, original verification, source boundary and release gate passed.

## Not established

Validation, rights and transferability. The manifest states each as NOT ESTABLISHED. No licence is granted. Building a package is not a release.
