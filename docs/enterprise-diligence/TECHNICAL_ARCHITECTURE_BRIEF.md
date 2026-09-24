# Technical Architecture Brief

**Every row states how the item is known.** The permitted values are: *observed*
(behaviour seen directly), *source-verified* (read in repository code), *operator-
disclosed* (asserted on a JRS surface, not independently confirmed), *owner-input
dependent*, or *unaudited*.

| Item | Description | How known |
|---|---|---|
| Request lifecycle | POST to `/api/v1/review-engine` with `{ text, runs }`. Handler authenticates, rate-limits, validates length, calls the model provider, normalises the result, writes result telemetry, returns JSON | **source-verified** |
| Client/server boundary | All review logic is server-side in a Vercel edge function. No review logic or provider credential is client-side | **source-verified** |
| API route | Single path, `/api/v1/review-engine`. Server declared as `https://www.jrsstandard.com` | **source-verified** |
| Authentication boundary | `Authorization: Bearer <token>`; token compared against an allow-list; non-match returns 401 with a message naming no environment variable | **source-verified** |
| Token scope and lifecycle | Issuance, rotation, expiry and revocation are not documented in-repo | **GAP / owner-input dependent** |
| Open mode | Token-free operation requires the explicit flag `JRS_SANDBOX_OPEN=true`; the rate limit still applies | **source-verified**. Whether it is set in production is **owner-input dependent** |
| Model-provider role | Anthropic Messages API, model `claude-haiku-4-5-20251001`, called server-to-server | **source-verified** |
| Provider-key custody | Read from `process.env.ANTHROPIC_API_KEY` inside the edge function. No client-side reference located | **source-verified** in repository; custody in the hosting account is **unaudited** |
| Record-text handling | Assessed in memory and not written to any table, not echoed, not logged | **source-verified**; production behaviour **unaudited** (see CT-6) |
| Result telemetry | `logReview()` writes result fields after a successful review | **source-verified** |
| Request identifier | `request_id` returned in the response envelope | **source-verified** |
| Truncation | Condition notes truncated to 400 characters; remediation note to 600; some finding fields to 40 | **source-verified** |
| Input floor | Requests under 40 characters rejected with 400 `record_too_short` | **source-verified** |
| Rate limits | Best-effort, per-instance, per-IP. Source carries `TODO: production volume needs a shared store (KV/Redis)`. Edge isolates do not share state | **source-verified**, and a stated limitation |
| Error behaviour | 400 on short input, 401 on bad or missing token, upstream model failure raised as `model_error_<status>` | **source-verified** |
| Versioning | Response carries `api_version`, `engine`, `engine_version`, `model` | **source-verified** |
| Contract versioning | One current contract, `openapi.json` (OpenAPI 3.1.0 / API 0.1.0-validation), describes the deployed response shape and declares that the endpoint does not currently emit a Manifest. The former contract path permanently redirects to the current file | **source-verified; reconciled 2026-09-22** |
| Change control | Guard suite `scripts/check_zero_drift.py` runs 126 checks and gates changes; deployment is by pull request to `main` | **observed** (suite executed during this build) |
| Deployment and hosting | Vercel. Static assets plus `api/*` edge functions. No build step | **source-verified** (`vercel.json`) and **operator-disclosed** (`CLAUDE.md` Section V) |
| Data store | Supabase, reached with a service-role key held server-side | **source-verified** |
| Monitoring | No monitoring or alerting configuration located | **GAP** |
| Incident response | No documented process located | **GAP** |
| Backup and recovery | Provider-level; no policy located in-repo | **unaudited** |
| Tenant isolation | No multi-tenant model located. The engine is a single-tenant service behind a token allow-list | **source-verified** as to structure; isolation properties **unaudited** |

## Statements this architecture does NOT support

Per the controlling standard, a public HTTPS response, a security header, or an
OpenAPI document is **not by itself** evidence of application security, tenant
isolation, production readiness, scalability, reproducibility, evaluation quality,
secure secrets management, or compliance certification.

**Specifically not supported by anything in this repository:**

- that the API is **secure**, **production-ready**, **enterprise-grade**, **scalable**,
  **validated**, **accurate**, **compliant**, **certified**, **independently
  reproducible**, **integrated**, **chain-of-custody capable**, **audit-ready**, or
  **legally sufficient**.

## Controlled description of the Review Engine

Use this wording unless stronger evidence is later verified:

> The JRS Review Engine is a technical implementation of JRS review logic undergoing
> operational validation. The public API contract supports technical discovery and
> integration discussion. Authorized live evaluation, production readiness,
> scalability, security assurance, and effectiveness remain subject to evidence not
> available in the current audit.

**This description is consistent with what the engine says about itself.** Its own
response payload carries `evidence_stage: 'operational_validation'` and the disclaimer
"Unvalidated engine in development... No effectiveness claim is made." The engine
disclosing its own limits in every response is a diligence strength and should be
presented as one.
