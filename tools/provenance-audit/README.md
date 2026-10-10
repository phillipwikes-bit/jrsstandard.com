# Provenance audit

**Internal, local only, not deployed** (`tools/` is excluded by `.vercelignore`). A deterministic inventory of the repository's technical assets, dependencies, deployment boundary and contribution history, built only from evidence visible in the repository.

Repository metadata records contribution activity. It does not determine legal authorship, employment ownership, work-for-hire status, assignment, license grant, or transfer rights. This tool does not establish chain of title, copyright ownership, trademark clearance, legal compliance, production readiness, licensing readiness, sale readiness or release authorization, and its dependency inventory is not a license opinion.

## Commands
| Command | What it does |
|---|---|
| `node tools/provenance-audit/run.mjs` | Analyzes `HEAD` and prints a summary |
| `node tools/provenance-audit/run.mjs --write` | Also writes the reports and the JSON outputs |
| `node tools/provenance-audit/run.mjs --commit <ref>` | Analyzes another commit |
| `node tools/provenance-audit/run.mjs --check` | Fails unless the committed outputs equal a fresh run at the commit they record |
| `node tests/provenance-audit/run-all.mjs` | All provenance tests, then the mutation run (`--quick` to skip it) |

## How it works
- **Reads one commit, through git's object store only.** It reads the tree, the file contents and the commit log; never the working tree. A run against the same commit therefore always gives the same output.
- **Local git only.** Six read-only subcommands, with every transport protocol disabled. It makes no network request, and consults no package registry, repository host, vendor site or license service.
- **Writes only to excluded paths.** The reports go to `docs/architecture/*.md` (excluded by `*.md`). The JSON goes to `tools/provenance-audit/generated/` (excluded by `tools/`). JSON is not written under `docs/architecture/`, because `.vercelignore` would not exclude it there.
- **Refuses to write a report that fails a guard:**
  - legal-conclusion, license-clearance or transaction-readiness language;
  - calling an excluded file "secret";
  - credential-like values;
  - a report that does not name its source commit.
- **Keeps no content.** Reports hold paths, hashes, sizes and classifications, never file content. Opaque slugs are shown as `-<slug>` and email addresses are masked.

## Outputs
| File | Content |
|---|---|
| `docs/architecture/SOFTWARE_ASSET_AND_PROVENANCE_INVENTORY.md` | The inventory: areas, routes, Engine candidate, tests, tools, schemas, configuration, generated files, boundary map, contribution map, credential-like pattern scan, unknowns |
| `docs/architecture/THIRD_PARTY_COMPONENTS_AND_NOTICES.md` | Components and the local license evidence for each |
| `docs/architecture/AI_ASSISTED_DEVELOPMENT_DISCLOSURE.md` | What the repository can and cannot show about AI-assisted development |
| `docs/architecture/TECHNICAL_DILIGENCE_READINESS_REPORT.md` | What a reviewer could inspect now, what is unknown, and a future diligence checklist |
| `tools/provenance-audit/generated/*.json` | Machine-readable snapshot, asset inventory, boundary map, dependency inventory and contribution map |

Every output names the commit it was generated from. Regenerate after material changes. A newer commit makes the outputs out of date, but never wrong about the commit they name.
