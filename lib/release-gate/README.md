# Internal release-gate package

**Internal and non-public.** Not deployed (`lib/` is excluded by `.vercelignore`). Not the public Decision Reconstruction Manifest. Not a legal, privacy, security or commercial clearance. The rules are in `docs/architecture/RELEASE_EVIDENCE_PROTOCOL.md`.

| Command | What it does |
|---|---|
| `node lib/release-gate/cli.mjs validate lib/release-gate/records/RG-RECORD_engine-0.5.0-local.1.json` | Validates the record and lists missing evidence |
| `node lib/release-gate/cli.mjs report <record> docs/architecture/CURRENT_RELEASE_GATE_REPORT.md` | Regenerates the report |
| `node lib/release-gate/cli.mjs check <record> docs/architecture/CURRENT_RELEASE_GATE_REPORT.md` | Fails if the report is stale or omits its limitations |
| `node tests/release-gate/run-all.mjs` | All release-gate tests, then the mutation run (`--quick` to skip it) |

The current record (2026-10-06) is for local candidate `0.5.0-local.1`. Every gate is open: RG-1, RG-2, RG-4 and RG-5 are BLOCKED and RG-3 is NOT_ASSESSED. No release gate has passed.
