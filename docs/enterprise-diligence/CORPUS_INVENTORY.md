# Corpus Inventory

Built 2026-09-09. Full accessible working tree, excluding `.git` internals and caches.

**Total files: 1162**

## By extension

| Extension | Count | Binary? | Text-extracted |
|---|---|---|---|
| `.md` | 478 | no | n/a |
| `.docx` | 169 | yes | **yes, 259/259** |
| `.py` | 161 | no | n/a |
| `.pdf` | 90 | yes | **yes, 259/259** |
| `.html` | 76 | no | n/a |
| `.js` | 56 | no | n/a |
| `.png` | 40 | yes | not required |
| `.txt` | 19 | no | n/a |
| `.csv` | 19 | no | n/a |
| `.json` | 17 | no | n/a |
| `.sql` | 14 | no | n/a |
| `.sh` | 6 | no | n/a |
| `.mjs` | 4 | no | n/a |
| `(none)` | 3 | no | n/a |
| `.zip` | 3 | yes | not required |
| `.svg` | 2 | no | n/a |
| `.tsv` | 2 | no | n/a |
| `.xml` | 1 | no | n/a |

## By top-level directory

| Directory | Files | Deployed? |
|---|---|---|
| `research` | 755 | **no** |
| `(root)` | 144 | yes (except excluded types) |
| `scripts` | 144 | **no** |
| `api` | 56 | yes (except excluded types) |
| `docs` | 35 | **no** |
| `reference` | 18 | yes (except excluded types) |
| `reviewer` | 3 | yes (except excluded types) |
| `cep-article-prep` | 3 | **no** |
| `supabase` | 1 | yes (except excluded types) |
| `content` | 1 | yes (except excluded types) |
| `templates` | 1 | **no** |
| `claude` | 1 | yes (except excluded types) |

## Evidence categories searched

| Category | Where | Status |
|---|---|---|
| Rights and consent instruments | `api/contributor.js`, `api/_coauthor-roster.js`, `contributor.html` | **Searched. Two instruments located** |
| Executed consent records | `pilot_contacts` where `source='contributor-confirm'` | **Searched. 37 rows / 33 people** |
| Master Tracker and variants | 9 tracker records | Searched, full text |
| Binary documents | 90 PDF + 169 DOCX | **Extracted, 0 failures, 7.31 MB** |
| Git history | 2,031 commits | Searched with -S |
| Live application state | 3 endpoints | Read |
| External communications | LinkedIn/DM/email references | Searched; originals outside boundary |
