# Deployment Candidate Audit — 2026-09-15

Candidate `9343124` against production `0d94ce6`. **25 deployable files.**

| File | Change | Public | Runtime | Security | Privacy | IP | Research | Approval |
|---|---|---|---|---|---|---|---|---|
| `api/_model.js` | new module | no | **yes** | none | none | none | none | Deployment |
| `api/review.js` | literal → `jrsModel()` | no | **yes** | none | none | none | none | Deployment |
| `api/review-engine.js` | same | no | **yes** | none | none | none | none | Deployment |
| `api/v1/review-engine.js` | same | no | **yes** | none | none | none | none | Deployment |
| `api/sandbox.js` | same ×2 | no | **yes** | none | none | none | none | Deployment |
| `api/bench-admin.js` | same | no | **yes** | none | none | none | none | Deployment |
| `privacy.html` | processor disclosure; Fonts caveat | **yes** | no | none | **material, corrective** | none | none | **Section 23 publication** |
| `security.html` | names Anthropic; retention corrected | **yes** | no | **material, corrective** | material | none | none | **Section 23 publication** |
| `review-engine.html` | D-11 correction | **yes** | no | material | material | none | none | **Section 23** |
| `terms.html` | D-13, D-17 | **yes** | no | none | material | none | none | **Section 23** |
| `engagement.html` | D-13, RANK 8 | **yes** | no | none | material | none | none | **Section 23** |
| `pilot.html` | **sanitize screen before both destinations** | **yes** | **yes (client)** | **material, corrective** | **material** | none | none | **Section 23** |
| `index.html` | validation status; retention; Gumroad | **yes** | no | none | material | none | none | **Section 23** |
| `training.html` | validation status; retention | **yes** | no | none | material | none | none | **Section 23** |
| `enterprise.html` | retention corrections | **yes** | no | none | material | none | none | **Section 23** |
| `jrsstandard.html` | Gumroad; track bridge | **yes** | no | none | none | none | none | **Section 23** |
| `check.html`, `codebook.html`, `investigator-guides.html`, `simulations.html` | track bridge | **yes** | no | none | material | none | none | **Section 23** |
| `audit-request.html`, `calibration-request.html`, `governance-request.html` | isolation scoping; retention | **yes** | no | none | material | none | none | **Section 23** |
| `engine-activity.html` | isolation heading scoped | **yes** | no | none | material | none | none | **Section 23** |
| `.vercelignore` | five exclusions | n/a | **build-time** | **material, protective** | none | **material, protective** | none | Deployment |

## Mandatory verifications

| Check | Result |
|---|---|
| `openapi.json` unchanged | **CONFIRMED.** Not in the diff |
| Research records unchanged | **CONFIRMED.** `research/` shows 2 files, both the tracker and an inventory snapshot; **no figure, study row or participant record altered** |
| Rights records unchanged | **CONFIRMED** |
| Production database unchanged | **CONFIRMED.** No migration, no grant, no row |
| No new outbound destination | **CONFIRMED.** Inventory guard passes at 21 hosts |
| Protected implementation excluded | **CORRECTED 2026-09-15: this row was FALSE when written.** Ten root `.sql` files and `supabase/functions/` were deployable, and `/supabase-engine-reviews-setup.sql` and `/supabase/functions/run-study/index.ts` both returned **200 on production**. `*.sql` and `supabase/` are now excluded. The original five paths were correct; the row over-generalised from them. **Effect still unverified** |
| Disclosure changes documented | **CONFIRMED** |
| No credentials introduced | **CONFIRMED for the candidate: zero credential-shaped additions across all 151 changed files.** Corrected 2026-09-15: an earlier wording said "zero token-shaped strings on disk", which is **false as a blanket claim** — the Supabase **publishable** key appears in 17 HTML files by design and is deliberately not matched by the secrets guard. The supported proposition is about what this candidate *introduces*, not about the whole tree |
| No production authorization implied | **CONFIRMED** |

## The one thing a reviewer should look at hardest

**Eighteen public pages change their privacy, security and engine representations in a single
deployment.** Each correction is individually evidenced, but they ship together. If any one is
wrong, it goes live with seventeen that are right.

**Mitigation available and not taken:** splitting the candidate. Not proposed, because the
current wording is the accurate wording and staging it would leave known-false statements live
for longer. **Recorded so the choice is visible rather than implicit.**
