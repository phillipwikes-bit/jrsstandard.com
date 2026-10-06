# Public-claim and repository-claim reconciliation

**Date:** 2026-10-06. **Scope:** read-only inventory of `main` at `97087e9`; this branch's public files are byte-identical to it. **Status:** proposal for owner review. No page, route, redirect, sitemap, OpenAPI file, deployment setting or guard was changed.

**Labels:** VERIFIED means inspected in the file; SOURCE-REPORTED means taken from the handoff or the owner's instruction of 2026-10-06; PROPOSED means a replacement not applied; UNRESOLVED needs an owner decision or evidence not available here.

**Controlling basis:** the three 3 October source-aligned documents were searched for and are not reachable from this session (see `PR39_SOURCE_ALIGNMENT_REVIEW_2026-10-06.md`, "Controlling sources"). The basis used here is:
- the 5 October handoff;
- the owner's "non-negotiable current position" (2026-10-06);
- repository registers.

Every classification below is pending comparison with the 3 October text.

## 1. Claims that need repair

Line numbers are raw-file lines on `main`. Wording is shown with markup removed.

### P-1. `security.html`, the whole data-flow section (lines 265 to about 300). Priority: highest
- **Classification:** HISTORICAL_OR_STALE_LANGUAGE, published as current. VERIFIED: the page is indexable and listed in `sitemap.xml`.
- **Current wording, examples:**
  - Line 265: "This page summarizes the current Review Engine data flow for security review: what is transmitted, what JRS does not persist, what derived telemetry may be retained…"
  - Line 268: "Make a technical integration inquiry →"
  - Line 277: "Record text is sent over TLS to this endpoint and from there to Anthropic, the model provider… It is kept for 90 days and then removed…"
  - Line 285: "Truncated to 8,000 characters before evaluation."
  - Line 288: the stored-telemetry row.
  - Line 295: "The endpoint is fail-closed. No token means no access… Tokens are issued per organisation…"
- **Proposed replacement for lines 265 to 300:** one status section, with the integration link (268) and the field-by-field table removed:
  > **Current status.** The JRS Review Engine is a controlled local-development candidate. No public route accepts record text: every Engine route on this site refuses submissions and makes no call to any model provider. Nothing a visitor sends through this site is transmitted to a model provider or stored as an evaluation. The data-flow description previously published on this page described an earlier implementation that is no longer active; it is kept in the repository history. A future authorized implementation would publish its own data flows, retention, access controls and provider terms before any processing began.
- **Reason:**
  - VERIFIED: `api/review.js`, `api/review-engine.js` and `api/v1/review-engine.js` are stubs that return 503 with no outbound call (`scripts/test_review_incomplete.mjs` and `tests/engine/auth-matrix.mjs` pass).
  - SOURCE-REPORTED: the handoff says public review routes must refuse submissions, and that no route accepting record text may be documented.
  - The 90-day retention and token claims describe controls that no longer run. A written description is not proof that a control operates (owner position).
- **Repair type:** public-facing.

### P-2. `privacy.html` line 213
- **Classification:** HISTORICAL_OR_STALE_LANGUAGE (VERIFIED). The page is indexable, in the sitemap, and linked from 44 pages.
- **Current wording:** "Anthropic provides the model behind the record review tools. Text you paste into a review tool is sent there to be assessed. The text itself is not stored in our database. On the versioned engine route, some of what the model writes back about your record is kept as programme telemetry… It is kept for 90 days and then removed. What stays is the evaluation record…"
- **Proposed replacement:**
  > No record review tool on this site is active. The Review Engine routes refuse submissions and send nothing to any model provider. If a review tool is authorized in future, this notice will name its provider, what is sent, and what is kept, before it operates.
- **Reason:** as for P-1 (handoff: no public intake).
- **Repair type:** public-facing.

### P-3. `privacy.html` line 152
- **Classification:** UNSUPPORTED_OR_OVERBROAD.
- **Current wording:** "…collect only what is needed, say plainly why, and keep it defensible."
- **Proposed replacement:** "…collect only what is needed, say plainly why, and keep a clear record of what is held."
- **Reason:** "defensible" is a determination word the current position avoids (CLAUDE.md section 24; the owner's no-readiness or defensibility verdict).
- **Repair type:** public-facing.

### P-4. `privacy.html` line 179
- **Classification:** UNSUPPORTED_OR_OVERBROAD.
- **Current wording:** "Storage. We may store your details securely for that purpose."
- **Proposed replacement:** "Storage. We may store your details for that purpose. How they are stored is described in section 4."
- **Reason:** "securely" asserts that a control operates. A written policy is not proof that the control operates (owner position), and no operator-control evidence exists (handoff gate 2, not verified).
- **Repair type:** public-facing.

### P-5. `privacy.html`, section 4 (around lines 191 to 196)
- **Classification:** NOT_ASSESSED.
- **Current wording:** "Personal records… are written and read only by our server-side functions… Row-level security is enabled on these tables with no public read access… The connection to the site is encrypted in transit."
- **Proposed action:** no wording change until the controls are evidenced. Verify each statement against the database configuration through an authorized operator check. Note that `.jrs/state/BLOCKERS.json` B-013 records that `engine_reviews` was readable with the public key on 2026-09-15 (zero rows, production fix not performed).
- **Reason:** the page states that controls operate, and the repository record points the other way for at least one table. This review cannot verify production controls.
- **Repair type:** public-facing, after evidence. UNRESOLVED.

### P-6. `index.html` line 61
- **Classification:** UNSUPPORTED_OR_OVERBROAD.
- **Current wording:** "The Review Engine is a controlled technical implementation maintained separately for evaluation and possible integration."
- **Proposed replacement:** "The Review Engine is a controlled local-development candidate. It is not available for public use, evaluation access or integration."
- **Reason:** SOURCE-REPORTED: the handoff says the Engine is "not … a sandbox, integration product, licensing offer, or acquisition pathway". "For evaluation and possible integration" implies a pathway the handoff closes.
- **Repair type:** public-facing.

### P-7. `enterprise.html` line 58
- **Classification:** UNSUPPORTED_OR_OVERBROAD. The meaning is ambiguous.
- **Current wording:** "Contact about a future controlled evaluation"
- **Proposed replacement:** "Contact JRS"
- **Reason:** SOURCE-REPORTED: the handoff prohibits evaluation access and external onboarding without a new owner instruction. A call to action offering a "future controlled evaluation" implies that one is offered. The page's own status text (line 53) is accurate.
- **Repair type:** public-facing. UNRESOLVED: the owner may prefer to keep a general enquiry route.

### P-8. `research.html`, headings: the title and heading at lines 8 and 14, line 111 and line 164
- **Classification:** UNSUPPORTED_OR_OVERBROAD.
- **Current wording:** "Research & Validation"; "Empirical Validation: Headline Metrics"; "Validation Maturity".
- **Proposed replacements:** "Research"; "Research Results: Headline Metrics"; "Research Maturity". The body text is not changed.
- **Reason:** SOURCE-REPORTED: "General-purpose validation … not established" (owner position). The body correctly says it does not validate the Engine (line 103), but the headings present the page as validation.
- **Repair type:** public-facing.

### P-9. `research.html`, reliability and cross-vendor text (around lines 122 and 126)
- **Classification:** NOT_ASSESSED.
- **Current wording, line 126:** "…Across 61 recorded runs between 12 June and 21 August 2026 agreement ranged from 66.7 to 93.3 percent, mean 85.3 percent…"
- **Proposed action:** investigate the two guards that fail here (B27 and B28 in the guard package) before any wording change. The line does state 61 runs, so why the denominator guard fails is NOT ESTABLISHED. The E-038 limitation guard also fails on the AC1 text.
- **Reason:** the figures need checking against the evidence ledger (E-038), which is not available here in its 3 October form.
- **Repair type:** guard-related, then public-facing.

### P-10. `decision-reconstruction-risk.html` line 133 (Study 014)
- **Classification:** SUPPORTED_PUBLIC_METHODOLOGY_OR_RESEARCH, with omissions. This is historical study reporting about AI drafting tools, not Engine output and not a DRR score.
- **Current wording:** "…On 29 of those texts, a reader given only the summary answered 77% of masked factual questions correctly, against 97% from the original…"
- **Proposed replacement:** "On 29 of those texts, an AI reader given only one model's concise summary answered 77% of masked factual questions correctly, against 97% from the original."
- **Reason:** VERIFIED against the branch `claude/engine-eval-v8-2026-10-01`, `research/study-014-drr/RESULTS.md`: the reader was a model (Sonnet 5.5), and only Sonnet's summaries were tested. "Research about JRS does not validate the Engine" (owner position): the paragraph makes no Engine claim, and none should be added.
- **Repair type:** public-facing.

### P-11. `sitemap.xml` lines 19, 28, 30, 31 and 172
- **Classification:** HISTORICAL_OR_STALE_LANGUAGE.
- **Current entries:** `pilot.html`, `organizational-evaluation.html`, `licensing-acquisition.html` and `controlled-evaluation-package.html`, all `noindex` historical stubs; and `org-pilot.html`, which was deleted on 4 October.
- **Proposed action:** remove all five entries.
- **Reason:** a sitemap that lists noindex or deleted pages contradicts their status. Guard B3 fails on the four noindex entries.
- **Repair type:** redirect or sitemap.

### P-12. `vercel.json`, rewrites to deleted files
- **Classification:** HISTORICAL_OR_STALE_LANGUAGE.
- **Current entries:**
  - lines 98 to 100: `/bench-admin` to `/bench-admin.html`;
  - `/bench-review`;
  - lines 143 to 145: `/platform-integration`;
  - lines 198 to 200: `/org-pilot`;
  - lines 238 to 240: `/review-status`;
  - lines 267 to 271: `/vp-7c1f9a4e8d2b6035`.
- **Proposed action:** remove each rewrite, or point it at its page's existing `.html` redirect target. INFERENCE (not probed): each currently returns 404.
- **Reason:** the routes point at files deleted on 4 October.
- **Repair type:** redirect. The VP route also needs the B-010 decision (UNRESOLVED).

### P-13. `vercel.json` lines 33 and 78 (the acquisition page)
- **Classification:** UNRESOLVED.
- **Current state:** both acquisition addresses redirect to `/enterprise.html`. VERIFIED: the file is now a 415-byte stub reading "This historical transaction route is not active."
- **Proposed action:** none until the owner records whether the 4 October change was the authorization CLAUDE.md 36.3 requires (B-010 addendum, 2026-10-06). Guard B5 ("no redirect shadows a page that exists") fails on it.
- **Repair type:** redirect.

### P-14. CLAUDE.md section 36.2
- **Classification:** HISTORICAL_OR_STALE_LANGUAGE.
- **Current wording:** "`api/review.js` is a Vercel Edge Function that accepts `POST {text}`, calls Claude, and returns routing, conditions, flags, revisions, summary." Also: "The engine currently pins `claude-haiku-4-5-20251001`."
- **Proposed replacement:** "`api/review.js` is a status stub that refuses every submission with 503 and makes no outbound call (see the 5 October handoff). The historical description is preserved in git history. `api/_model.js` still holds the historical default model identifier; no deployed route calls a model."
- **Reason:** VERIFIED stub behaviour.
- **Repair type:** documentation only (CLAUDE.md). The owner should approve it, because CLAUDE.md is an instruction file.

### P-15. CLAUDE.md section 36.3, "Both are deployed, carry noindex,nofollow"
- **Classification:** HISTORICAL_OR_STALE_LANGUAGE.
- **Current state:** VERIFIED. The VP page is deleted; the acquisition page is a `noindex,follow` stub and is redirected.
- **Proposed replacement:** UNRESOLVED, pending the B-010 decision. Do not rewrite this before that decision.
- **Repair type:** documentation only.

## 2. Claims that are aligned (VERIFIED by reading; no change proposed)

| File and lines | Claim | Classification |
|---|---|---|
| `review-engine.html` 34 to 56 | "a constrained documentation-review candidate… not a public record-processing service, production system, or autonomous decision-maker"; release gates "not verified"; the excluded domains named | CONTROLLED_IMPLEMENTATION_DESCRIPTION |
| `enterprise.html` 43 to 53 | Research does not validate the Engine; no sandbox, API, intake, licensing or acquisition pathway; local profile limited to completed non-HR supplier-access exception drafts | CONTROLLED_IMPLEMENTATION_DESCRIPTION |
| `index.html` 99 to 111 | Engine "not a public record-processing service"; three release gates listed; "No public API returns an evaluation or Manifest" | CONTROLLED_IMPLEMENTATION_DESCRIPTION |
| `privacy-notice.html` 16 to 22 | Do not submit records; does not describe a production data-processing programme, retention schedule or certification | CONTROLLED_IMPLEMENTATION_DESCRIPTION |
| `manifest.html` 36 | Schema and library "have passed repository conformance and integrity tests"; "The Engine remains unvalidated" | CONTROLLED_IMPLEMENTATION_DESCRIPTION. VERIFIED: `tests/manifest/run.mjs` 68 of 68 on 2026-10-06. |
| `manifest.html` 39 to 46 | "A valid hash demonstrates internal consistency, not … that an unsigned artifact is authentic" | SUPPORTED_PUBLIC_METHODOLOGY_OR_RESEARCH |
| `resources.html` 94 to 178 | Public materials; Engine source and evaluation not public; "does not decide whether the underlying decision is legally correct, compliant…" | SUPPORTED_PUBLIC_METHODOLOGY_OR_RESEARCH |
| `research.html` 103, 134 and 166 | Does not validate the Engine; reproducibility criterion "not established" | SUPPORTED_PUBLIC_METHODOLOGY_OR_RESEARCH. The figures are NOT_ASSESSED against the ledger. |
| `openapi.json` | `info.version` "0.1.0-local-candidate"; "Pre-release status contract… does not accept record text… does not authorize processing… deployment, licensing, or release" | CONTROLLED_IMPLEMENTATION_DESCRIPTION. `/openapi.json` redirects to `review-engine.html` (`vercel.json` line 36), so the file is not served at its own path. |
| `licensing-acquisition.html`, `controlled-evaluation-package.html`, `organizational-evaluation.html`, `platform-evaluation-001.html`, `pilot.html`, `ai-records-pilot.html`, `acquisition-9f3c2a7d4b.html` | Under 420-byte `noindex` stubs: "historical … route is not active" or "closed" | HISTORICAL_OR_STALE_LANGUAGE, correctly labelled. Only their sitemap entries need repair (P-11). |
| `terms.html` (noindex) | Governs founder engagements closed on 4 September 2026 | HISTORICAL_OR_STALE_LANGUAGE, correctly labelled |
| README files | No root README. `docs/enterprise-diligence/README.md`, `cep-article-prep/README.md` and `content/linkedin/README.md` are excluded from deployment by `.vercelignore` (`*.md`). | NOT_ASSESSED for content; not public |
| `tests/public-route-alignment.mjs` | 17 of 17 pass | VERIFIED. It does **not** cover `security.html` or `privacy.html`, which is why P-1 and P-2 went undetected. |

## 3. Proposed test addition (guard-related; PROPOSED, not added)
Extend `tests/public-route-alignment.mjs` so that no public page states, as current, that record text is sent to a model provider, retained or truncated. Shown failing first against `main` as it is now (P-1, P-2), and passing after the page repairs. This adds no guard and changes no guard count.

## 4. Unresolved
- **The 3 October documents:** every classification is pending comparison with their text.
- **B-010:** the acquisition and VP routes (P-12, P-13, P-15).
- **Production controls behind `privacy.html` section 4 (P-5):** need operator-control evidence (handoff gate 2).
- **Whether the owner wants a general enquiry route** on `enterprise.html` (P-7).

## 5. Addendum, 2026-10-06: repairs applied (`3758d76`, `1aabaab`)
Sections 1 to 4 above are kept as the earlier record (Rule 10).

**Correction to section 1 (OLD FINDING → NEW EVIDENCE → CORRECTED STATUS):**
- **OLD FINDING:** fifteen items, with P-1 and P-2 as the main stale data-flow claims.
- **NEW EVIDENCE:** `tests/public-boundary-claims.mjs` scanned all 83 deployed public pages.
- **CORRECTED STATUS:** 66 stale current-tense statements on 14 pages, most of them outside the earlier inventory. Manual inspection added three more pages: the `research.html` headings, `contributor.html` (text built by script, which the scan cannot see) and the `jrsstandard.html` restoration.
- **EXPLANATION:** the earlier pass read pages individually. It missed copies of two shared blocks (the "dual track" and "track bridge" blocks) that the owner had already corrected on other pages on 4 and 5 October.

### Repaired
| Page | What was stated as current | Now |
|---|---|---|
| `security.html` (P-1) | Record text sent to Anthropic; 8,000-character truncation; bearer tokens; rate limit; stored model notes kept 90 days; integration inquiry; OpenAPI link | The current position, a route table (503 refusal, body not read, no model call), and a short history section. That section makes no deletion statement and says whether stored output remains is not established. The meta description is updated. |
| `privacy.html` (P-2, P-3, P-4) | Anthropic receives pasted text; output kept 90 days and then removed; "keep it defensible"; "securely"; "the diagnostic is running" | Anthropic moved to "services that are not running", with the current position and the same not-established statement. P-3 and P-4 wording applied. "Last updated" changed to 6 October 2026. |
| `index.html` (P-6) | "maintained separately for evaluation and possible integration" | P-6 wording |
| `research.html` (P-8) | "Research & Validation"; "Empirical Validation"; "Validation Maturity" | "Research and Limitations" (the page's own title since the owner's change); "Research Results"; "Research Maturity". The body is unchanged. |
| `audit-request.html`, `calibration-request.html`, `governance-request.html`, `engagement.html` | Shared "Enterprise Platform Track" card: B2B API licensing, "one record in, a structured determination out", transmitted to Anthropic, telemetry kept, per-partner tokens. Banner: "the commercial pathways that remain are licensing… technical integration, and acquisition". "Request a Review Engine evaluation". "Review Engine API". "Run the Mini-Pilot". Present-tense service text on closed pages. | The card is replaced with the owner's 5 October wording from `training.html`. The banner and the closing note use the current position. Links now go to status pages. Text for the closed service is in the past tense, matching `terms.html`. |
| `check.html`, `investigator-guides.html` | Shared bridge: "commercial embedding and licensed deployment are handled through the enterprise track"; text "transmitted to the model provider". `check.html`: "licensing… inquiries are handled separately". `investigator-guides.html`: "Run one record now". | The bridge is replaced with the owner's 4 October wording from `jrsstandard.html`, and the other lines use the current position. |
| `training.html` | A "Record Review Workspace" record field that POSTed to `/api/review`, which now refuses. "Run the diagnostic on my records" carried name, organization, title and email in the URL. | The form and its three functions are removed. A status block keeps the anchor. The button now goes to `check.html` with no personal data in the URL. |
| `contributor.html`, `supported.html` | "Paste up to twenty five of your own records… get the five-condition read" | Point to the Record Defensibility Check, with the current position |
| `operational-boundaries.html` | "the licensed JRS Review Engine API can be embedded by a platform provider" | The current position |
| `research-summary.html` | "Structured Pilot… Scope a pilot"; "Licensing of the standard and the review engine… holds no record text at rest" | Both cards marked "Not offered", with the current position |
| `simulations.html` | "applies the JRS five-question framework to submitted record text and returns routing guidance"; "Open AI-Assisted Record Reviewer" (×2) | Closed, with the current position; links go to "Review Engine status" |
| `jrsstandard.html` | Not a claim. A truncated save in `b1929b9` put "Warning: truncated output" before the doctype and replaced 211 worksheet lines with "…7217 tokens truncated…". | Restored as the parent file plus that commit's two intended edits (`1aabaab`). Broken internal links fell from 11 to 4. |
| `CLAUDE.md` 36.2 (P-14) | `api/review.js` "calls Claude" | A dated status note was added. No text was deleted. |

### Retained deliberately
| Item | Reason |
|---|---|
| `enterprise.html` "Contact about future controlled evaluation" (P-7) | Prospective, and the page's own status text says no evaluation access is offered. The owner may prefer a general enquiry route, so this stays UNRESOLVED. |
| `privacy.html` section 4, row-level security statements (P-5) | NOT_ASSESSED. They need operator evidence, and B-013 points the other way for `engine_reviews`. Removing them without evidence would be as unsupported as keeping them. |
| `decision-reconstruction-risk.html` 133 (P-10), `research.html` figures (P-9) | Research accuracy, not a boundary claim. Guard rows 36 and 37 are INVESTIGATE. |
| `sitemap.xml`, `vercel.json` (P-11 to P-13) | Not directly necessary for the boundary. The `org-pilot.html` redirect to `review-engine.html` still serves old links. B-010 is unresolved. |
| `index.html` "Enterprise information and future pathway" | Owner wording of 4 and 5 October. It sits beside the release-gate list and offers no access. |
| Closed request pages: "Licensed access to the record set for one run", "One licensed run… Closed", and `engagement.html` "Retention… destroyed on delivery" | Terms of the closed founder service, on pages labelled closed and historical. They describe neither the Engine nor a current offer. |
| `coauthor.html` "licensed product", "sold or licensed" | Wording in a contributor consent instrument. Changing it would change a rights instrument (Rules 4 and 5). |
| "Research & Validation" link labels on other pages (`about.html`, `codebook.html`, `datasets.html`, `evidence-ledger.html`, `finding.html` and others) | These are labels for a link to `research.html`, not claims on the page itself. Follow-up, not a boundary claim. |
| `programme-status-9872fb93cc94.html`, `acquisition-9f3c2a7d4b.html`, `vp-7c1f9a4e8d2b6035.html` | Restricted surfaces (CLAUDE.md 36.3, B-010), excluded from the test. Not touched. |
| `training.html` record-pattern helper arrays | Dead after the form was removed and harmless. Removing them was not necessary for the repair. |
