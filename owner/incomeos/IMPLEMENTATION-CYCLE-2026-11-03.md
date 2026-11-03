# IncomeOS implementation cycle, 3 November 2026

**Directive:** IncomeOS Master Implementation Directive v2.0 (owner instruction, this session).
**Branch:** `feature/incomeos-owner-prototype-2026-11-01`, draft PR #91. Not merged, not deployed.
**Machine-readable inventory:** `CAPABILITY-INVENTORY.json` (18 capabilities, each with state, defects, tests, remediation and acceptance criteria).

## 1. Baseline (before any change)

- Head `feefa8a`. 31 IncomeOS test suites run locally under Node 22.
- **30 passed. 1 failed:** `tests/incomeos-project-radar.mjs` line 11.
- CI workflow `incomeos-private-prototype.yml` runs the failing suite last, so the PR check was red on the latest head.

## 2. Defect register

| ID | Severity | Defect | Evidence | Disposition |
|---|---|---|---|---|
| D-01 | High | The radar trusted listing-supplied eligibility. A listing with `eligibility:"verified"`, an evidence URL and a date reached `REVIEW`. Any imported JSON could therefore assert the owner's eligibility. | The new radar test was run against the pre-fix `project-radar.js`: result `REVIEW`, expected `HOLD`. | **Fixed.** Eligibility now comes only from an `IncomeOSEligibility.evaluate` decision object, registered in a WeakSet so a JSON copy cannot be forged. Listing claims are ignored and flagged `LISTING_ELIGIBILITY_CLAIM_IGNORED`. |
| D-02 | Medium | The test was wrong, not the engine. Line 11 reused id `job-123` for two different listings; the duplicate-ID control added in `81bb9d1` correctly holds both. | Failing assertion `0 !== 1`. | **Test corrected** with distinct ids, with an explanatory comment. No criterion weakened. |
| D-03 | Medium | (Found by the new suite.) The duplicate grouper ranked sources with `rank[x]||3`, so a primary ATS source (rank 0) was treated as rank 3, and an aggregator copy could be chosen as the primary record. | Synthetic cross-source test returned `aggregator`. | **Fixed** with an own-property lookup. |
| D-04 | Medium | Project screening was inert in staging: the panel refused every import under the financial interlock, even though nothing it processes is financial or persisted. | `project-ui.js` at `feefa8a`. | **Changed, flagged for owner review (decision R-1 below).** |
| D-05 | Info | `opportunities.json` is a dated snapshot, not a live source. | README, module headers. | Recorded in inventory RESEARCH-001. |

## 3. What was built

| Capability | Files | Classification |
|---|---|---|
| Deterministic eligibility engine (15 categories plus requirement-set completeness, conflicts, platform standing). SATISFIED only by documented, non-stale evidence. Attested items stay NOT ESTABLISHED. Contradictory requirements withhold. No probability scores. | `eligibility-engine.js` | Implemented and verified (synthetic tests) |
| Requirement extraction from untrusted text, keeping exact source sentences; optional vs mandatory; fraud and embedded-instruction signals | `listing-requirements.js` | Implemented and verified (synthetic tests) |
| Compensation engine: the directive's formula, eight payment models, FX only with dated sourced rates, taxes separate | `compensation.js` | Implemented and verified (synthetic tests) |
| Normalized record (every directive section 6 field), provenance, cross-source de-duplication, conflicting-duplicate flags, version diff, withdrawal, freshness | `opportunity-normalizer.js` | Implemented and verified (synthetic tests) |
| Hardened radar and snapshot screening: eligible, awaiting verification, excluded with reasons, alerts only when eligible and above the rate target | `project-radar.js` | Implemented and verified (synthetic tests) |
| 14-state lifecycle, owner-only steps, transaction-specific application authorization, payment verified only by bank posting or payout statement | `opportunity-lifecycle.js` | Partially implemented (engine only; persistence needs Phase 5) |
| Live connectors (Greenhouse, Ashby, Lever), USAJOBS connector (key-gated), manual import; receipts; retry with exponential backoff; per-host spacing; failure never reported as empty success | `discovery-connectors.js`, `discovery-sources.json`, `scripts/incomeos/discover.mjs` | Implemented but not yet verified live (see section 5) |
| Scheduled discovery workflow, public-data artifact, job-summary receipt | `.github/workflows/incomeos-discovery.yml` | Blocked: schedules run only from the default branch |
| Dashboard panel: system health, verified eligible, awaiting your verification, excluded | `project-ui.js`, `index.html`, `incomeos.css` | Implemented and verified locally (Playwright, iPhone 13 emulation) |
| Private profile template; private draft profile from the directive | `owner-profile.template.json`; `.incomeos-private/owner-profile.json` (git-ignored, delivered in chat only) | Partially implemented (no documented evidence yet) |

## 4. Decisions requiring owner review

**R-1. In-memory screening under the staging interlock.** OLD: project import was disabled under `IncomeOSFinancialReadOnly`. NEW EVIDENCE: the panel handles public listings plus a profile file that is read into page memory, never written to storage and never transmitted; the browser test confirms zero storage writes. CORRECTED STATUS: screening runs in memory; persistence (confirmations, lifecycle) remains blocked. EXPLANATION: this keeps the interlock's purpose (no persistent owner data on an unauthenticated surface) while making the panel usable. Reversible by restoring the early return.

**R-2. Scope conflict with the 1 November register.** OLD: `IMPLEMENTATION-REGISTER.md` says "Do not introduce paid work … Optional worthwhile paid studies and interviews remain the only participation exception." NEW EVIDENCE: the 3 November directive explicitly prioritizes contract, project and expert-consultation work. CORRECTED STATUS: this cycle follows the newer directive. The older register is preserved unedited. EXPLANATION: the owner should confirm the newer scope supersedes the older line.

**R-3. Evidence standard.** "Documented" means the profile item names a record the owner holds (`ref`) and a date it was checked. The engine cannot authenticate that record. Owner attestation alone does not satisfy a requirement, per the directive's "documented evidence" rule.

**R-4. Fail-closed defaults in the draft profile.** Work authorization, conflicts review and weekly availability are unset, so every opportunity is withheld until the owner sets them. This is intentional.

## 5. External dependencies and blockers

1. **Live connector verification.** This development container's network policy denies `boards-api.greenhouse.io`, `api.ashbyhq.com` and `api.lever.co` (proxy 403). A local run reported 6 failed, 2 disabled, `allFailed:true`, exit 2. That is the correct failure behavior and is not evidence of a live integration. The PR-triggered Actions run is the first live test.
2. **Board tokens unverified.** Each registry entry is `tokenVerified:false` until a live receipt shows `ok` or `BOARD_NOT_FOUND`.
3. **USAJOBS.** Owner registers a free API key and stores `USAJOBS_API_KEY` and `USAJOBS_USER_AGENT` (the registered email) as repository secrets.
4. **Schedule.** GitHub runs `schedule` only from the default branch. Merging the workflow to `main` requires explicit owner authorization (or repository separation, section 7).
5. **Platforms without a documented public API** (DataAnnotation, Outlier contributor work, Appen, TELUS Digital, OneForma, Mindrift): manual import only. No scraping of logged-in pages.
6. **Authentication and protected hosting** (Phase 5) remain absent. Nothing here changes the production hold.
7. **JRS outbound-destination inventory.** `scripts/check_zero_drift.py` fails the same 49 checks before and after this cycle (verified on a clean worktree of `feefa8a`). Its already-failing "no unapproved outbound destination" check now additionally names `boards-api.greenhouse.io`, `api.ashbyhq.com`, `api.lever.co` and `data.usajobs.gov` (plus synthetic test-fixture hosts). PROPOSAL for owner classification in `.jrs/registries/OUTBOUND_DESTINATIONS.json`: a distinct class such as `INCOMEOS_OWNER_TOOL_READ_ONLY`. These are unauthenticated GETs of public job-board data from a GitHub Actions runner or the owner's machine; no personal or JRS data is sent, and they are not processors for the public JRS site. Not self-approved, because the guard exists to force a human classification.

## 6. Threat-model addendum (discovery and eligibility)

| Threat | Control in this cycle | Test |
|---|---|---|
| Listing asserts eligibility | Ignored; engine-issued decision required; forged copies rejected | radar test, browser test |
| Prompt injection in listing | No model in the path; text is data; instruction patterns excluded as risk | intelligence suite, browser test |
| Stored XSS via listing | `textContent` only; static check bans `innerHTML`/`insertAdjacentHTML`/`document.write` | owner-profile test, browser test |
| Fraudulent recruiter, upfront fee, off-platform contact, SSN/bank request, guaranteed pay | Risk signals exclude the listing | intelligence suite |
| Source substitution / fraudulent apply link | Apply and source hosts must match the connector's board hosts or configured employer domains; redirects refused by the runner | intelligence suite |
| Aggregator copy posing as verification | Aggregators never count as independent primary sources | intelligence suite |
| Changed listing after owner review | Confirmation bound to content hash; any change requires re-confirmation | intelligence suite |
| Expired, stale or withdrawn listing | Freshness gate; listings from failed sources carried as unverified and aged out | intelligence suite |
| Connector failure hidden as no results | Receipts carry `error`; all-failed exits non-zero | intelligence suite, local run |
| Owner profile leak via public repo or CI | Template has no owner data; private path git-ignored; runner refuses `--profile` under CI; snapshot labeled public-data-only | owner-profile test |
| Unauthorized application or payment | Lifecycle requires owner actor, `apply:<id>` authorization, payment evidence and transaction id | intelligence suite |

## 7. Repository separation assessment

**Recommendation: separate IncomeOS into its own private repository.** INFERENCE from the evidence:

- The JRS repository is **public** (GitHub API `visibility: public`). Every IncomeOS file, workflow log and artifact is public, which forces owner-specific data permanently out of source and makes private configuration impossible.
- IncomeOS commits create JRS Vercel deployment records and quota pressure (PR #91 history: READY and CANCELED records despite branch rules).
- Scheduled discovery needs a default branch it can live on; merging IncomeOS workflows into JRS `main` mixes an owner tool into the public estate.

**Migration plan (prepared, not executed; needs owner authorization):**
1. Owner creates a private repository (for example `incomeos`) and grants this integration access.
2. Copy `owner/incomeos/`, `scripts/incomeos/`, the 34 `tests/incomeos-*` files and the three IncomeOS workflows with history via `git filter-repo --path` on a fresh clone. The JRS repository is not modified.
3. Run the full suite in the new repository; compare file hashes against this branch head.
4. Connect the existing `incomeos-opportunity-desk` Vercel project to the new repository with Vercel Authentication on all deployments.
5. Only after the new repository is verified, close PR #91 unmerged and remove `owner/incomeos/` from JRS in a separate reviewed PR (the root `.vercelignore` rule stays as defense in depth).
6. Rollback: the JRS branch remains intact until step 5, which is itself a revertible PR.

## 8. Next highest-value actions

1. Read the first live Actions receipt; correct `discovery-sources.json` from the evidence.
2. Owner documents profile evidence and sets work authorization, conflicts and availability (R-4).
3. Owner decides repository separation (section 7), which unblocks scheduling and protected hosting.
4. Phase 5: authentication and protected storage for confirmations, lifecycle and alerts.

## 9. Addendum: first live discovery evidence (same day)

- Run 1 (`456c3f4`) failed before any request: the GitHub runner loaded the engine files as ES modules, so `module.exports` was unset. Reproduced locally under a parent `package.json` with `"type":"module"`; fixed in `cd3764e` and verified in both module modes.
- **Run 2, GitHub Actions run 41667377096, commit `cd3764e`: success.** `gh-scaleai` 166, `gh-invisible` 23, `ashby-mercor` 105, `ashby-handshake` 84, `gh-labelbox` 10 listings (all HTTP 200, one attempt each); `lever-turing` HTTP 404 `BOARD_NOT_FOUND`; both USAJOBS sources disabled for want of a key. 388 public listings in artifact `incomeos-discovery-41667377096`.
- DISC-001 is now **implemented and verified** for pull-request runs. The registry records the five verified boards and disables `lever-turing`; its identifier is not guessed further.
- What this does NOT establish: that any listing is open to the owner, eligible, or well paid. These are unscreened public postings (most are company staff roles); eligibility requires the private profile with documented evidence.
- `visual-snapshots` fails on this PR because the workflow added to `main` on 2026-11-02 checks out this branch head, which predates its script. Not caused by this PR; remedy (merging `main`) held for owner decision because it touches root `vercel.json`.
