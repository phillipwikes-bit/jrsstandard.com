# JRS / DRR / Decision Spellchecker
## Implementation Increment 11: integrated release-evidence admission control
**Date:** 31 October 2026.  **Status:** Offline implementation verified; draft-only repository change planned. Production HOLD.  **Governing source:** Uploaded 186-page bundle containing Issue 3.2 (173 pages) and Increments 04 and 05 (13 pages). Later Increment 10 summary is a separate owner-reported source, not an inspected 223-page master document.

### 1. Controlling determination
The JRS/DRR public-interest program may continue in controlled development, with free materials remaining available under their existing release conditions. The original private Decision Spellchecker remains **NO_GO_NOT_VERIFIED**; the independent H2-versus-H3 study is **NOT_ESTABLISHED**; the R6 commercial transfer is **NOT_AUTHORIZED**; the public-site production transition is **HOLD**.

This increment provides an executable, fail-closed evidence-state preflight. It does not issue a release authorization, authenticate submitted evidence, grant rights, validate outcomes, or replace review by an authorized operator, counsel, or independent examiner.

### 2. Inspected evidence and provenance
| Source | Observation | Evidence boundary |
|---|---|---|
| GitHub PR #62 | Open, draft, unmerged; head `ff07784c5666c6a89ea50e59b83fef2f484a8c87` | Direct GitHub metadata. Scope is named-registry consent and recording safeguards, not original software. |
| GitHub Actions on that head | Runs `41209094463` and `41209094479` completed successfully | Source-level CI. Does not verify real owner login, Supabase RLS, controlled history, or exact-preview behavior. |
| Vercel latest listed preview | READY deployment `dpl_7iXvGvYCx7uEQi33ek4RTH4EPfWw` carries earlier Git SHA `e2182eaa1cea04c2961310bdc512ccd602017074` | Preview not identical to PR #62 head. READY is not production authorization. |
| GitHub commit status | Vercel failure target references build-rate-limit | Does not establish a new exact-head deployment or valid owner session. |
| Vercel secret metadata | Branch-scoped `OWNER_DASHBOARD_TOKEN` present for an earlier branch only; values were not retrieved | No evidence of secret available to PR #62 preview or of actual login, revocation, or RLS. Previously exposed credential must be rotated in owner-controlled custody. |
| Owner Increment 10 report | R9 80/80 tests, 16 adversarial; R6 71/71 hashes; fictional 156-case admission BLOCKED with 21 findings | Owner-reported numbers, not rerun against the R9 archive here; not software authenticity or study accuracy. |
| Owner Increment 10 rights statement | 0 of 32 R6 items authorized for transfer | Reported disposition. No file-by-file signed grant received or manufactured. |
| Uploaded PDF | 186 pages, SHA-256 `e41a83b08f8b4c9503cc2af9c89fac5ec6f1bc702b57d9bb46e4829c06cab3ae` | Issue 3.2 + Increments 04/05 only; cannot certify preservation of a later claimed 223-page master not supplied as bytes. |

### 3. Implemented offline preflight
Added `tools/check-integrated-release-evidence.mjs`, an evidence snapshot and 14 adversarial regression tests. It requires exactly twelve uniquely identified PST gates and separately evaluates website, original software, independent study, and transfer rights. It refuses false PASS entries without recorded source pointer, full SHA-256, scoped reviewer, and exact-candidate designation. It tests for open/unmerged PRs, mismatched commit identities, unavailable preview, lack of owner decision and postrelease watch planning.

The preflight refuses to promote 80 synthetic R9 test successes or 71 matching R6 archive hashes to original source authentication; it refuses to count a fictional blocked 156-record demonstration as an actual human study; and it refuses to convert 0/32 transfer authorizations into a cleared commercial lot. All numerical source reports remain visibly tagged as owner-reported.

**Locally executed regression:** `node --test tests/integrated-release-evidence.test.mjs`: 14 passed; 0 failed. `node tools/check-integrated-release-evidence.mjs evidence/increment11_observed_snapshot.json` produced four separate HOLD/NOT VERIFIED assessments. No external API, database, confidential record, credential, participant, provider model, or buyer contact was used by the tests.

### 4. Results on captured evidence snapshot
| Track | Result | Distinct recorded blockers |
|---|---|---:|
| Public website release | HOLD | 16 |
| Original Decision Spellchecker | NO_GO_NOT_VERIFIED | 3 |
| Independent H2/H3 and original-record study | NOT_ESTABLISHED | 2 |
| R6 transfer | NOT_AUTHORIZED | 2 |

These are preflight failure counts, not unique program risks, validated defect prevalence, degree of completeness, or percentages. Some conditions are cross-dependent. PST-12 is a postrelease observation gate; a predeclared watch plan is required before release, but the postrelease result is not fabricated in advance.

### 5. Priority implementation sequence and measurable gates
1. **Original DS-A source and build custody (DS-01):** recover from authorized private source; freeze exact version and full file/dependency manifest; reproduce build and known failures on a clean machine. Acceptance: pinned source-to-executable lineage and direct SP-01 through SP-18 adverse probes, with independently reviewable negative results. If absent, retain DS-A unavailable rather than renaming R6.
2. **R9 source-custody independent replay:** acquire the actual R9 toolkit and change records, verify descriptor-relative no-symlink access and before/after file identity and metadata consistency; run adversarial replacement/race tests and preserve an observed interrupted-read outcome. Acceptance: exact source/test hash, executed commands, raw results and limitations; synthetic results only.
3. **Protected Program Status:** secure owner-secret rotation and exact-branch preview configuration; test valid, expired, altered and replayed sessions; direct API refusal; Supabase anonymous-role RLS; fixed-cutoff source counts; synthetic safe writer/read reconciliation. Acceptance: actual matching deployment SHA, explicit per-PST evidence, owner signoff and rollback. No password in code, chat or report.
4. **H2/H3 preregistration:** only after original DS-A is recovered, prepare sealed references and independently reviewed labels for original source cohorts; specify false-ready, false-hold, time and reconstruction outcomes before runs. Acceptance: authorized and actually executed study evidence, including noncompletion and unfavorable findings; never borrow R9 or R6 regression counts as H3 outcomes.
5. **File-specific rights and any market test:** preserve 32 R6 statuses as uncleared until actual grant review, third-party dependencies, included/excluded lot, and counsel disposition. Acceptance: 32 individually traceable decisions and signed transaction-specific evidence. No marketplace listing or valuation inferred.

### 6. Risk containment and constraints
- Do not merge PR #62 or advance Vercel production from this increment. The branch is stacked and must be evaluated with its ancestors.
- Never substitute a 503 private-route refusal for evidence of a working authenticated owner session.
- Do not modify or reset the historical 24-file collection baseline or reclassify old support/consent rows.
- Do not expose participant contacts, conduct live research, transmit documents to outside providers, recruit reviewers, or send educational outreach without separately recorded authorization.
- Retain the 21 fictional demonstration findings in their actual primary record when available, including individual reason codes and rejected cases. A count alone is not an integrity audit.
- A hash is content comparison, not authorship, independent custody, external identity, legal title, or semantic accuracy.
- The executable preflight validates the shape and internal consistency of supplied evidence, **not** whether a named reviewer truly reviewed it or whether a pointer is externally authentic. Independent evidence review and owner decisions remain required.

### 7. Completeness and source-preservation protocol
The 186-page uploaded source remains byte-for-byte unchanged. This Increment 11 report is a new standalone dated supplement, not a substitute for a later, unsupplied 223-page master or Increment 10 attachments. Integrate into the most recent authoritative master only after obtaining and hashing its exact bytes. Record the updated document hash, retained page count, crosswalk and every newly appended page. Do not claim the reported 215-page pre-Increment 10 baseline or 223-page continuation has been independently compared in this session.

**Decision:** Increment 11 local preflight implemented and tested. Existing NO_GO_NOT_VERIFIED and HOLD determinations remain. No production deployment, live study, real-record processing, owner-signoff fabrication, credential change, source assignment, paid listing or outreach took place.