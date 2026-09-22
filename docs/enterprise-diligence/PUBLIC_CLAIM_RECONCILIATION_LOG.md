# Public Claim Reconciliation Log

**No public page was modified.** Every correction below is **DEFERRED** at the approval
gate: publishing changes to the public website, and changing legal, privacy,
commercial, licensing or security language, both require owner approval.

**Corrected statements are not published until the supporting evidence is verified or
the statement is explicitly labelled an operator assertion.**

## A finding that is not a defect, recorded first

**The public site does not overclaim on security or validation.** A sweep of all 54
public pages for `enterprise-grade`, `production-ready`, `audit-ready`,
`chain-of-custody`, `certified` and `independently reproducible` returned **zero**
pages. The three near-hits are all correct **negations**:

- "It does not address whether the basis was sound, **legally sufficient**, or consistent with policy."
- "does not require the standard to be **fully validated** first"
- "Live, **unvalidated engine** · operational validation"

**VERIFIED.** This is unusual and it is worth an evaluator's attention: the site
disclaims in the places where overclaiming would be easiest.

## Reconciliation items

### R-1 Record text versus result telemetry

| Field | Content |
|---|---|
| **Page/file** | `audit-request.html:195,225`, `calibration-request.html:195,225`, `engagement.html:199`, `contributor.html:270` |
| **Existing statement** | "not written to any table"; "never stored" |
| **Conflict or ambiguity** | The statements are **accurate about record text**. They sit alone, with no adjacent statement that **result telemetry is written and retained** (`logReview()`). A reader may generalise "never stored" to the whole interaction |
| **Corrected statement** | Add, adjacent to the existing wording: "Record text is assessed in memory and discarded. Per-condition results and routing outcomes are retained as service telemetry." |
| **Evidence** | `api/v1/review-engine.js:174` (text not stored), `:176,254` (`logReview` writes results) |
| **Publication status** | **DEFERRED** |
| **Approval required** | Owner. This is privacy language |

### R-2 Undated research figures

| Field | Content |
|---|---|
| **Page/file** | `acquisition-9f3c2a7d4b.html`, `pilot.html`, `research-summary.html`, `research.html`, `results.html` |
| **Existing statement** | "83.9%" quoted with no data-lock date or study status |
| **Conflict or ambiguity** | A live figure with no date reads as current indefinitely. `check.html` and `engagement.html` already carry a dateline, so the site is **internally inconsistent** about this |
| **Corrected statement** | Append to each figure: "(n = 16, 95% CI 72.7 to 95.1; data lock 15 August 2026; detection study, group level)" |
| **Evidence** | Manuscript: data lock 15 August 2026; 384 graded judgments; n = 16 |
| **Publication status** | **DEFERRED** |
| **Approval required** | Owner |

### R-3 Two conflicting API contracts — **RESOLVED 2026-09-22**

| Field | Content |
|---|---|
| **Page/file** | Current `openapi.json`; former `/openapi-review-engine.json` compatibility path |
| **Prior statement** | Two documents described the same endpoint with different schemas |
| **Resolution** | One current contract now describes the implemented `result` and `evidence_stage` response. The former path permanently redirects to it |
| **Corrected statement** | `openapi.json`, OpenAPI 3.1.0 and API version `0.1.0-validation`, is the sole current public contract. It states that the endpoint does not currently emit a Manifest |
| **Evidence** | `openapi.json`, `vercel.json`, implementation correspondence check, and `JRS_PUBLIC_API_CONTRACT_RECONCILIATION_2026-09-22.md` |
| **Publication status** | **IMPLEMENTED** |
| **Rights boundary** | Technical correction only. Ownership and commercial-rights determinations remain with counsel |

### R-4 No published subprocessor list

| Field | Content |
|---|---|
| **Page/file** | `terms.html`, `privacy.html`, `security.html` |
| **Existing statement** | None. Neither Anthropic, Vercel nor Supabase appears on any of them |
| **Conflict or ambiguity** | Three processors are evidenced in code. A privacy or security page that names none of them is thinner than the architecture it describes, and this is normally the first item an enterprise reviewer asks for |
| **Corrected statement** | Publish a subprocessor list: Anthropic (model inference), Vercel (hosting and edge execution), Supabase (data storage), each with its role |
| **Evidence** | `api/v1/review-engine.js` (Anthropic), `vercel.json` (Vercel), service-role usage across `api/` (Supabase) |
| **Publication status** | **DEFERRED** |
| **Approval required** | Owner **and counsel**. This is privacy language with contractual consequences |

### R-5 Codebook-to-API terminology is not explained anywhere public

| Field | Content |
|---|---|
| **Page/file** | `codebook.html` versus `openapi.json` |
| **Existing statement** | Codebook publishes five condition names; the API publishes five different keys. **Exactly one name appears in both** |
| **Conflict or ambiguity** | Nothing public declares the correspondence. An integrator must guess or ask |
| **Corrected statement** | Publish the mapping table once the owner declares the intended correspondence (see `METHODOLOGY_TO_API_MAPPING.md`) |
| **Evidence** | Both sources, compared without normalisation |
| **Publication status** | **DEFERRED**, and **blocked** on owner input rather than on approval alone |
| **Approval required** | Owner |

### R-6 Legacy engagement terms versus current licensing

| Field | Content |
|---|---|
| **Page/file** | Retired offer pages and `terms.html` |
| **Existing statement** | Legacy terms written for founder-delivered engagements remain the only commercial terms on the site |
| **Conflict or ambiguity** | Those engagements are **closed and the code enforces it**. A reader could mistake legacy terms for current API-licence terms. There is no API licence |
| **Corrected statement** | State that founder-delivered engagements are closed and that API licensing terms are not yet published |
| **Evidence** | `api/checkout.js` retired-offer guard; live `/api/checkout-stats` all zero; no licence template located |
| **Publication status** | **DEFERRED** |
| **Approval required** | Owner **and counsel**. This is commercial and licensing language |

## Priority order

1. **R-3** (conflicting API contracts) is the only item that can silently break a real integration.
2. **R-4** (subprocessors) is the item most likely to stall an enterprise review.
3. **R-1** (retention wording) is a small edit that removes a real ambiguity in privacy language.
4. **R-2** (undated figures) is the most widespread, across five pages.
5. **R-5** and **R-6** need an owner decision before any wording can be drafted.
