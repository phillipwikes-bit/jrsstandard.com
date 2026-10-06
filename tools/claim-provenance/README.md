# Claim provenance

**Internal, local only, not deployed** (`tools/` is excluded by `.vercelignore`). An internal claim-control system for material claims about JRS research and the Engine. For each claim it records:
- what is claimed;
- the source that supports it;
- what that source measures;
- its limitation;
- whether it may be used in public;
- whether it transfers methodology evidence to the Engine;
- the denominator, scope and date that must stay with it.

**What it is not.** It does not validate the research, the Engine, privacy controls, commercial readiness or production use. A register of claims is a control over wording, not new evidence. No figure is recalculated, and no historical record is altered.

## Commands
| Command | What it does |
|---|---|
| `node tools/claim-provenance/build.mjs [--write] [--check]` | Builds and validates the register. Writes the register, its Markdown, the limitation matrix and the claim cards. |
| `node tools/claim-provenance/scan.mjs [--write] [--check]` | Scans public pages, public routes and readable public downloads. Writes the scan results and the repair proposals. |
| `node tests/claim-provenance/run-all.mjs` | Every test, then the mutation run (`--quick` to skip it). |

## Files
| File | Role |
|---|---|
| `lib/evidence.js` | Evidence sources. Each is bound to the hash it was reviewed at: the whole file, or one anchored line for append-only logs. |
| `lib/claims.js` | The claim records, with the scan patterns that recognise each claim in public text |
| `schema/claim-record.schema.json` | The record schema. A SUPPORTED_WITH_LIMITATION claim must have a source, hash, evidence class, limitation and date. |
| `lib/rules.js` | The governing claim rules (G01 to G13) |
| `lib/scan.js`, `scan.mjs` | The public-claim scanner |
| `lib/repairs.js` | Proposed public repairs. Proposals only. |
| `lib/categories.js`, `lib/render.js` | The limitation matrix and the claim cards |
| `current-claim-evidence-register.json`, `generated/scan-results.json` | Generated machine records |

Generated documents:
- `docs/architecture/CLAIM_EVIDENCE_REGISTER.md`
- `docs/architecture/PUBLIC_CLAIM_LIMITATION_MATRIX.md`
- `docs/architecture/claim-cards/*.md`
- `docs/architecture/PUBLIC_CLAIM_REPAIR_PROPOSALS_2026-10-06.md`

## When something changes
- **An evidence source changes.** The builder refuses to run. Review the source, then update its `reviewed_sha256` in `lib/evidence.js` and rebuild. Re-binding is a deliberate edit.
- **A public page changes.** `scan.mjs --check` reports stale outputs. Re-run `scan.mjs --write`. A new unsupported or repair-needed sentence fails the check until a proposal covers it, the page is repaired, or the register records the claim.
- **A proposal is applied** (after the publication process). Its target sentence disappears and the proposal becomes stale. Remove it from `lib/repairs.js` in the same change.

## Limits
The scanner is a sentence-level heuristic with a fixed window of three sentences on each side. It recognises a claim only through the register's patterns. It reads visible page text and route string literals, not PDFs or images. Restricted surfaces (CLAUDE.md 36.3) are excluded and never quoted.
