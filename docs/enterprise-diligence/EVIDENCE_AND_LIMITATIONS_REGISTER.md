# Evidence and Limitations Register

One row per material claim or asset. **Classification is against evidence, not against
intent.** A claim appearing on a public JRS page is recorded as operator disclosure
unless independent implementation evidence exists.

Verified date for all rows: **2026-09-08**, against repository commit recorded in
`_PREFLIGHT_STATE.txt`, unless a row states otherwise.

## A. Engine, API and technical claims

| # | Claim or asset | Category | Exact source | Classification | Evidence excerpt | Conflict | Owner | Public/private | Notes |
|---|---|---|---|---|---|---|---|---|---|
| A-1 | A review-engine API exists at `/api/v1/review-engine` | API | `api/v1/review-engine.js`; `openapi.json` path block | **VERIFIED** | Handler present; OpenAPI declares the single path `/api/v1/review-engine` | none | Owner | public | Existence of a route is not evidence of production readiness |
| A-2 | The API is token-gated by bearer token | API | `api/v1/review-engine.js:217-218` | **VERIFIED** | `var bearer = (req.headers.get('authorization')...)`; `if (allowed.indexOf(bearer) === -1) return J({error:'unauthorized'}, 401)` | none | Owner | public | Token issuance process is not documented in-repo: see A-3 |
| A-3 | A partner token was obtained and a successful authorized call observed | API | none located | **NOT AUDITABLE** | No token available in this environment; authentication was not bypassed | none | Owner | private | The single largest technical-assurance gap in this package |
| A-4 | A token-free open mode exists behind an explicit flag | API | `api/v1/review-engine.js:13` | **VERIFIED** | "Token-free open mode requires the explicit flag `JRS_SANDBOX_OPEN=true` (rate limit still applies)" | none | Owner | private | Whether the flag is set in production is **OWNER INPUT REQUIRED** |
| A-5 | Record text is not retained | privacy | `api/v1/review-engine.js:174`; `openapi.json` description | **VERIFIED (source)**, operator-disclosed as to production | Source comment: the record text "is deliberately not" stored or passed in; `logReview` writes result fields only | none | Owner | public | Source-verified. Independent confirmation in a production tenant is **NOT AUDITABLE** |
| A-6 | Result telemetry **is** written | privacy | `api/v1/review-engine.js:176,254` | **VERIFIED** | `async function logReview(SERVICE, rid, out)`, called after a successful review | Public pages emphasise non-retention of record text; they should not be read as "nothing is stored" | Owner | public | Drives reconciliation item R-1 |
| A-7 | Model provider is Anthropic; model is `claude-haiku-4-5-20251001` | API | `api/v1/review-engine.js:26,116-120` | **VERIFIED** | `const MODEL = 'claude-haiku-4-5-20251001'`; POST to `https://api.anthropic.com/v1/messages` | none | Owner | public | A model provider is a subprocessor: see S-4 |
| A-8 | The provider API key is server-side only | security | `api/v1/review-engine.js:207` | **VERIFIED** | Read from `process.env.ANTHROPIC_API_KEY` inside an edge function; no client reference located | none | Owner | private | Key custody in the hosting account is **NOT AUDITABLE** from the repository |
| A-9 | Rate limiting is production-grade | API | `api/v1/review-engine.js:94-97` | **GAP** | Source states the limiter is "best-effort, per-instance" and carries `TODO: production volume needs a shared store (KV/Redis)` | Contradicts any "enterprise-grade" reading | Owner | private | Edge isolates do not share state; a determined caller can exceed the intended limit |
| A-10 | Two OpenAPI documents describe the same endpoint at different versions | API | `openapi.json` (3.1.0, info.version `1.0.0`) vs `openapi-review-engine.json` (3.0.3, info.version `0.1.0-validation`) | **VERIFIED conflict** | Same server and same single path; different response schemas (`conditions`/`routing` vs `result`/`evidence_stage`) | **Direct conflict, unresolved** | Owner | public | A reviewer fetching the wrong file will mis-integrate. See reconciliation item R-3 |
| A-11 | The engine declares its own stage as unvalidated | API | `api/v1/review-engine.js:19,244-245` | **VERIFIED** | `evidence_stage: 'operational_validation'`; disclaimer "Unvalidated engine in development... No effectiveness claim is made" | none | Owner | public | This is a strength for diligence: the payload states its own limit |

## B. Methodology and research claims

| # | Claim or asset | Category | Exact source | Classification | Evidence excerpt | Conflict | Owner | Public/private | Notes |
|---|---|---|---|---|---|---|---|---|---|
| B-1 | A canonical Codebook of five conditions exists | Methodology | `codebook.html` | **VERIFIED** | Five named conditions with experimental definitions and detection criteria | none | Owner | public | Codebook version string located: `1.0` |
| B-2 | Codebook condition names match API keys | Methodology | `codebook.html` vs `openapi.json` `Conditions` | **GAP** | Codebook: Reconstructability, Basis Identification, Chronology, Decision-Process Traceability, Evidentiary Sufficiency. API: `basis_identification`, `reasoning_traceability`, `cold_reviewer_clarity`, `accountability_support`, `temporal_reconstructability` | **Only one name corresponds exactly** | Owner | public | Full treatment in `METHODOLOGY_TO_API_MAPPING.md` |
| B-3 | Detection study primary result | research | `research/aie_submission_2026-09-01/01_Blinded_Manuscript.md` | **VERIFIED** | Mean reviewer accuracy **83.9%**, 95% CI **72.7 to 95.1**, n = **16**, **384** graded judgments | none | Owner | public | Group-level detectability only. Not individual-level reliance |
| B-4 | The pre-registered reliability criterion was met | research | same manuscript, reliability table | **VERIFIED FALSE** | "**The pre-registered reliability criterion was not met.**" Criterion: point estimate >= 0.61 **and** lower bound >= 0.41. Invited AC1 0.739 (CI 0.402 to 1.000); open enrolment 0.623 (CI 0.252 to 0.993) | none | Owner | public | Point estimates clear; **both lower bounds fail**. Must not be reported as met |
| B-4b | Reliability was not measured / not assessed | research | proposed 2026-09-19 as a state correction to be applied estate-wide | **VERIFIED FALSE** | **Reliability WAS measured.** Gwet's AC1 on a defined sample against a two-part pre-registered criterion, with intervals computed two ways and a disclosed exclusion rule: invited **10 records, 36 labels, 8 raters, AC1 0.739**, analytic CI 0.402 to 1.000, bootstrap 0.427 to 1.000; open enrolment **10 records, 68 labels, 14 raters, AC1 0.623**, analytic CI 0.252 to 0.993, bootstrap 0.285 to 0.894 | **none located.** A targeted search across `docs/`, `.jrs/` and `research/` returned **zero** records asserting reliability was not measured or not assessed | Owner | public | **THE MIRROR OF B-4, AND IT MATTERS IN THE OPPOSITE DIRECTION.** B-4 stops the criterion being reported as met. This row stops a measured, failed criterion being rewritten as one that never happened. **A failed measurement and an absent measurement are different facts**, and recording the second would delete a reported negative result that `RESEARCH_AND_VALIDATION_STATUS.md` calls "a strength of the work rather than a weakness to be managed". Corroborated by six independent records: `RESEARCH_AND_VALIDATION_STATUS.md`, this register at B-4, `research/Data_Analysis_2026-08-01.md`, `research/AUDIT_1_2026-08-29.md`, `research/Completer_Results_Summary_2026-08-15.md` and `research/Detection_Article_v3_2026-08-15.md`. Guarded by `check_reliability_is_recorded_as_measured_and_failed`, **8 mutations fail correctly**. **The Master Register §7 wording is CORRECT and was not changed** |
| B-5 | Corpus is constructed, not real-world | research | manuscript methods | **VERIFIED** | 24 constructed records assessed without access to intended labels | none | Owner | public | Caps external validity. See B-6 |
| B-6 | Real-world criterion validity established | research | none located | **GAP** | The manuscript states the claim is detectability and states where its evidence stops | none | Owner | public | A material limitation, disclosed by the authors themselves |
| B-7 | Data lock date | research | manuscript | **VERIFIED** | "data lock of 15 August 2026, 16 reviewers had completed the full 24-record set" | none | Owner | public | Any figure quoted without this date is undated: see R-2 |
| B-8 | Independent replication | research | none located | **GAP** | No independent replication artifact located | none | Owner | public | Expected gap at this stage; record it rather than soften it |

## C. Legal, commercial and IP claims

| # | Claim or asset | Category | Exact source | Classification | Evidence excerpt | Conflict | Owner | Public/private | Notes |
|---|---|---|---|---|---|---|---|---|---|
| C-1 | A repository licence file exists | IP | filesystem check | **GAP** | No `LICENSE` or `LICENSE.md` at repository root | none | Owner | public | Absence of a licence is itself a diligence finding |
| C-2 | A DPA exists | commercial | filesystem check | **GAP** | No `dpa.html` or equivalent located | none | Owner + counsel | public | Required by most enterprise buyers processing personal data |
| C-3 | An SLA exists | commercial | filesystem check | **GAP** | No `sla.html` or equivalent located | none | Owner + counsel | public | Do not represent any availability commitment |
| C-4 | A published subprocessor list exists | privacy | `terms.html`, `security.html` | **GAP** | Neither page mentions Anthropic, Vercel or Supabase, all three evidenced in code as processing paths | Public privacy posture is thinner than the architecture | Owner + counsel | public | See reconciliation item R-4 |
| C-5 | Trademark filed or registered | IP | `TRADEMARK_FILING_DOSSIER_JRS_DRR.md` | **OWNER INPUT REQUIRED** | A filing dossier exists; no serial or registration number located as evidence of an actual filing | Dossier is preparation, not filing | Owner + counsel | private | Do not represent the mark as filed or registered without a USPTO record |
| C-6 | Contributor assignments executed | IP | none located | **OWNER INPUT REQUIRED** | Contributors consented to be named; consent is not assignment | Named credit could be mistaken for assigned rights | Owner + counsel | private | Recorded in `CHAIN_OF_TITLE_STATUS.md` as the principal title gap |
| C-7 | Publication accepted | publication | `research/MASTER_TRACKER.md`; `research/IP_SALE_TRACKER.md` rev 26 | **OWNER INPUT REQUIRED for external evidence** | Tracker records two acceptances, including CCI on 2026-09-03 with expected publication about a month out | none | Owner | public | Per the operating standard, acceptance requires an acceptance letter, DOI, journal record or publisher page. Cite as **accepted and in pipeline**, never as published |
| C-8 | Paid customer deployments exist | commercial | none located | **GAP** | No executed customer contract or production deployment evidence located | none | Owner | private | Do not represent commercial traction |

## D. Security posture

| # | Claim or asset | Category | Exact source | Classification | Notes |
|---|---|---|---|---|---|
| S-1 | TLS in transit | security | Live HTTPS on `www.jrsstandard.com` | **VERIFIED (transport only)** | A valid certificate is not evidence of application security |
| S-2 | Penetration test | security | none located | **GAP** | Do not claim tested |
| S-3 | Formal certification (SOC 2, ISO 27001, ISO/IEC 42001) | security | none located | **GAP** | No attestation located. Do not claim certified |
| S-4 | Subprocessor inventory | security | code-evidenced only | **GAP (published)** / **VERIFIED (in code)** | Anthropic (model), Vercel (hosting/edge), Supabase (data). Evidenced in code, not published |
| S-5 | Incident response process | security | none located | **GAP** | No documented process located |
| S-6 | Backup and recovery | security | none located | **NOT AUDITABLE** | Provider-level; outside repository access boundary |
