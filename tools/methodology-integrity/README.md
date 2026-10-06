# Methodology integrity

**Internal, local only, not deployed** (`tools/` is excluded by `.vercelignore`). Keeps the vocabulary of the Engine candidate, the local reviewer workspace, the Decision Reconstruction Manifest and the research files from acquiring a correspondence to the JRS Standard or Codebook that nobody approved.

**Governing rule.** A shared word, a similar concept or a plausible interpretation does not establish a formal mapping. A record may be `APPROVED_CORRESPONDENCE` only with the authoritative source version, the exact source location, the exact candidate term, the mapping type, the evidence basis, the status and an owner-approved interpretation date. Without one, a term is `UNMAPPED`, `PROPOSED_NOT_APPROVED`, `HISTORICAL_REFERENCE_ONLY`, `NOT_ASSESSED` or `RETIRED`, and every display reads "No Codebook correspondence asserted."

## Commands
| Command | What it does |
|---|---|
| `node tools/methodology-integrity/build.mjs` | Validates the sources and records and prints a summary |
| `node tools/methodology-integrity/build.mjs --write` | Writes the two registers, their Markdown and the workspace snapshot |
| `node tools/methodology-integrity/build.mjs --check` | Fails unless every committed output equals a fresh build |
| `node tools/methodology-integrity/scan.mjs [--write] [--check]` | Scans the scope for unsupported mapping language |
| `node tests/methodology-integrity/run-all.mjs` | Every test, then the mutation run (`--quick` to skip it) |

## Files
| File | Role |
|---|---|
| `lib/sources.js` | The methodology sources, each with the hash it was reviewed at |
| `lib/records.js` | The correspondence records (none approved) |
| `schema/correspondence-record.schema.json` | The record schema |
| `lib/validate.js` | Rules a schema cannot state: approval requirements, source-hash binding, no `EXACT_LABEL` or `DOCUMENTED_ALIAS` without approval |
| `lib/resolve.js` | The only way a mapped label can render; copied verbatim into the workspace snapshot |
| `lib/scan.js`, `scan.mjs` | The vocabulary scanner |
| `reviewed-dispositions.json` | Line-hash-bound reviews of scanner findings in files this package may not edit |
| `source-register.json`, `current-correspondence-register.json` | Generated machine registers |
| `generated/scan-results.json` | The last scan, as written by `scan.mjs --write` |

Generated Markdown goes to `docs/architecture/METHODOLOGY_SOURCE_REGISTER.md` and `docs/architecture/METHODOLOGY_CORRESPONDENCE_REGISTER.md`. The workspace snapshot goes to `tools/local-reviewer-workspace/app/correspondence.js`.

## Changing a source or approving a correspondence
- **A source file changes.** The builder refuses to run. Review the changed source, then update its `reviewed_sha256` in `lib/sources.js` and rebuild. Re-binding is a deliberate edit, never automatic.
- **The owner approves a correspondence.** Record the approval in a file in the repository first. Then set the record to `APPROVED_CORRESPONDENCE` with the source, the source term, the exact source location, a mapping type, and `owner_approval` (approver, real date, reference to that file), and rebuild. Only then does the workspace render the mapped label. This tool never creates an approval.

## Limits
The register records what the repository shows. It does not validate the Engine, does not show that any candidate output is correct, and is not a legal or compliance determination. The scanner is a line-level heuristic: what it cannot place is `AMBIGUOUS_REVIEW_REQUIRED` for a person.
