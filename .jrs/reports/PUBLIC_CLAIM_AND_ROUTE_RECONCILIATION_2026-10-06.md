# Public claim and route reconciliation

**Date:** 2026-10-06. **Status:** REPORT ONLY. No public page, route, redirect, sitemap, register or CLAUDE.md line has been changed.
**Authority:** owner instruction 2026-10-06, item 5; `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`.
**Measured on:** `main` at `97087e9`.

**Limitation (handoff startup step 4).** The three 3 October source-aligned files are **not yet in the repository**. A container-wide filename search on 2026-10-06 found none of them. This report therefore records what the repository says and what its evidence files show. Every item that turns on claim, release-status, rights or privacy judgement is marked **PENDING SOURCE-ALIGNED REVIEW**, to be completed once the files are placed and their SHA-256 values match the handoff.

Labels: FACT (inspected), INFERENCE, PROPOSAL, NOT ESTABLISHED, REQUIRES HUMAN REVIEW.

---

## 1. Study 014 language and evidence availability

**Where:** `decision-reconstruction-risk.html` line 133, paragraph "What a first test found." Published 2026-10-03 (`0177c51`, byte-verified that day), unchanged on `main` since.

### 1.1 What Study 014 is, and what it is not
- **FACT.** Study 014 measured AI *drafting* models (Claude Sonnet 5.5 and Claude Haiku 4.5) summarising public EEOC decision backgrounds. It counted which dates, citations, attributions and quotations each draft kept, and tested whether a reader could answer masked factual questions from the draft. Evidence: `research/study-014-drr/PROTOCOL.md`, `RESULTS.md`, `CONFIRMATORY_RESULTS.md`, all on branch `claude/engine-eval-v8-2026-10-01` only.
- **FACT.** Study 014 did not run the JRS Review Engine on the records it reports, and the page paragraph does not mention the Engine. Study 014 Part 2 ran the production Engine as one detection arm, but that part is reported only in `PART2_RESULTS.md` and `PART2B_RESULTS.md` on the branch, not on the page.
- **Classification:** the page paragraph is **historical study reporting** about AI drafts. It is **not** Engine output, and **not** a DRR score assigned to any record. The handoff's prohibition on "numerical DRR scoring before formal reference interpretations and calibration data are locked" applies to scoring records with DRR. No research percentage in the paragraph is presented as a DRR score.
- **Not to be inferred:** Study 014 does not validate the Engine. The Part 2 Engine arm showed the Engine cannot report missing citations, and the v0.3 and v0.4 Engine changes were rejected (branch: `research/engine-v0.3/`, `research/engine-v0.4/DESIGN_CHECK.md`). No result in Study 014 supports an Engine accuracy, readiness or validation claim.

### 1.2 Each claim in the paragraph, against its evidence

| # | Page claim | Evidence (branch files) | Status |
|---|---|---|---|
| S1 | "two current AI models summarized 53 unique EEOC federal-sector decision backgrounds" | 29 unique practice texts (RESULTS.md, duplicate correction 2026-10-03: S014-09 and S014-11 byte-identical) plus 24 unique held-out texts (CONFIRMATORY_RESULTS.md: 29 drawn, 5 duplicates) | **SUPPORTED** |
| S2 | "Asked for a concise summary, they kept none of the record citations (median) and almost none of the quotations" | Practice set, P1, 29 unique: Sonnet citations 0.00, quotes 0.04; Haiku 0.00 and 0.00. Held-out set agrees (CONFIRMATORY_RESULTS.md) | **SUPPORTED.** Retention medians use the pre-registered extractor v1.0 (RESULTS.md line 30), and H1 holds under the pre-registered rule (line 13). The post-hoc extractors v1.1 and v1.2 bear only on the fabrication counts, which the page does not report. *Draft correction, same day: an earlier draft of this row said the medians came from the post-hoc extractors. That was wrong and was corrected before commit.* |
| S3 | "On 29 of those texts, a reader given only the summary answered 77% of masked factual questions correctly, against 97% from the original" | RESULTS.md Part 3 and duplicate correction: source 140/145 (0.966), Sonnet P1 112/145 (0.772) | **PARTLY SUPPORTED. Three omissions:** (a) the reader was an AI model (Sonnet 5.5), not a person, and the page says only "a reader"; (b) only Sonnet's summaries were given to the reader, not Haiku's, though the sentence follows one about "two current AI models"; (c) the 29 are the practice texts, not held-out texts. The figures themselves match. |
| S4 | "Given a drafting instruction built on JRS, the same models kept a median of every date, citation and quotation" | P4 medians 1.00 for dates, citations and quotes for both drafters, on both sets | **SUPPORTED.** Attributions are not claimed, which is right: Sonnet's P4 attribution median was 0.67. |
| S5 | "and the reader's accuracy matched the original" | Sonnet P4 141/145 (0.972) against source 0.966 | **SUPPORTED** for Sonnet P4 only. Same "a reader" omission as S3. |
| S6 | "one text family and one provider's models, with small samples" | Correct | **SUPPORTED** |
| S7 | "the drafting instruction reduced it in this test; they do not show that every AI tool behaves this way" | Correct and appropriately limited | **SUPPORTED** |
| S8 | "Methods and data are available on request from info@jrsstandard.com" | The methods and data exist, on branch `claude/engine-eval-v8-2026-10-01` (`research/study-014-drr/`, `research/drr-suite-v0.9/`). The repository is public (B-018), so the branch is readable by anyone without a request. Not on `main`. | **ACCURATE BUT INCOMPLETE.** PR #38 is being closed without merging (owner item 4), so the data will stay on that branch only. The branch must be preserved for as long as the page makes this statement. |
| S9 | Paragraph carries no automatic fabrication result | H4 and H4c failed (automatic fabrication tests); the manual reading attributed the flags to scorer errors, unchecked by a person (`review/FLAGGED_ITEMS_REVIEW_PACKET.md`, 35 items, not yet reviewed) | **CORRECTLY OMITTED.** Nothing to change. |

### 1.3 Proposed changes (for approval; none made)
- **P-1.** In S3 and S5, say that the reader was an AI model and that only Sonnet's summaries were tested. Suggested wording: "On 29 of those texts, an AI reader given only one model's concise summary answered 77% of masked factual questions correctly, against 97% from the original."
- **P-2.** None needed. The retention figures use the pre-registered scorer (see S2).
- **P-3.** Keep S8 only if the branch is preserved. Otherwise change it to describe where the record is held.
- **PENDING SOURCE-ALIGNED REVIEW:** whether the 3 October Evidence Ledger and Asset Register record Study 014 at all, and whether the page claim needs an entry in `.jrs/registries/CLAIMS_REGISTER.json`.

---

## 2. Deleted VP page still referenced in vercel.json
- **FACT.** `vp-7c1f9a4e8d2b6035.html` was deleted on `main` by commit `0fb5c07` (2026-10-04, author `phillipwikes-bit`).
- **FACT.** `vercel.json` lines 267 to 271 still rewrite `/vp-7c1f9a4e8d2b6035` to `/vp-7c1f9a4e8d2b6035.html`, a file that no longer exists. INFERENCE: the clean slug now returns 404. NOT ESTABLISHED on production; not probed.
- **FACT.** CLAUDE.md 36.3 still says both confidential buyer surfaces "are deployed", and requires "separate authorization" to change their access architecture. `.jrs/state/BLOCKERS.json` (B-010) and `.jrs/registries/ASSET_REGISTER.json` still list the page.
- **FACT.** The private owner page `programme-status-9872fb93cc94.html` line 464 still describes it as "Live, HTTP 200". That surface is not to be modified without instruction, so this is recorded only.
- **REQUIRES HUMAN REVIEW.** The deletion was made from the owner's GitHub account. CLAUDE.md Rule 4 bars treating commit authorship as proof of the recorded "separate authorization" 36.3 requires. One line from the owner confirming the 4 October removal closes this.
- **PROPOSAL.** Once confirmed: remove the dead rewrite; record the removal against B-010 and in the Asset Register as OLD FINDING, NEW EVIDENCE, CORRECTED STATUS. The file's history stays in git.

## 3. Redirected acquisition page
- **FACT.** `acquisition-9f3c2a7d4b.html` still exists but was rewritten on 4 and 5 October (404 lines removed). Its title is now "JRS Method Information", and its robots tag changed from `noindex,nofollow` to `noindex,follow`.
- **FACT.** `vercel.json` redirects both `/acquisition-9f3c2a7d4b.html` (line 33) and `/acquisition-9f3c2a7d4b` (line 78) to `/enterprise.html`. INFERENCE: Vercel applies redirects before the filesystem, so the page is unreachable at either address. NOT ESTABLISHED on production.
- **FACT.** Guard `no redirect shadows a page that exists` fails on this, rightly: a file that cannot be served is either dead or meant to come back.
- **Same authorization question as section 2.** CLAUDE.md 36.3 and B-010 still describe it as a deployed confidential buyer surface.
- **PROPOSAL.** The owner chooses one of two: (a) retired, so delete the file in a recorded change and keep the redirect; or (b) held for later use, so keep the file and record it as an undeployed draft. In either case, correct 36.3, B-010 and the Asset Register. Making a buyer surface live again is outside the handoff and is not proposed.

## 4. Sitemap and noindex conflicts
- **FACT.** Four pages with `<meta name="robots" content="noindex,follow">` are listed in `sitemap.xml`: `pilot.html` (line 19), `organizational-evaluation.html` (28), `licensing-acquisition.html` (30) and `controlled-evaluation-package.html` (31).
- **FACT.** `sitemap.xml` line 172 lists `org-pilot.html`, which was deleted on 4 October and redirects to `review-engine.html`. The guard does not catch this.
- **FACT.** Clean-URL rewrites still point at deleted files: `/bench-admin`, `/bench-review`, `/platform-integration`, `/org-pilot`, `/review-status` (`vercel.json`). INFERENCE: each returns 404. NOT ESTABLISHED on production.
- **FACT.** Public pages still link to `org-pilot.html`: `audit-request.html`, `calibration-request.html`, `engagement.html`, `governance-request.html` (each line 250 or 282), `investigator-guides.html` 153, `contributor.html` 282 and `research-summary.html` 276. They land on `review-engine.html` through the redirect, so nothing is broken. But the link text ("Run one record now, no sign-up", "Run the diagnostic on my records") offers an action the site no longer provides.
- **PROPOSAL.** Remove the four noindex pages and `org-pilot.html` from the sitemap; remove the dead rewrites; reword the seven `org-pilot.html` links. All are public-site changes and need approval.
- **PENDING SOURCE-ALIGNED REVIEW:** the "Run one record now" link text on `investigator-guides.html` is a claim of record intake that the handoff prohibits. It is the most material item in this section.

## 5. Outdated CLAUDE.md and register references

| # | Location | Says | Current fact | Proposed correction |
|---|---|---|---|---|
| C1 | CLAUDE.md 36.2 | `api/review.js` "is a Vercel Edge Function that accepts POST {text}, calls Claude, and returns routing, conditions..." | A 6-line stub returning 503 `controlled_review_unavailable`, no outbound call (`scripts/test_review_incomplete.mjs` passes) | Mark historical. State the current refusal behaviour and point to the handoff. |
| C2 | CLAUDE.md 36.2 | "The engine currently pins claude-haiku-4-5-20251001" | No deployed route calls a model. `api/_model.js` still holds that default, with `MODEL_REVIEW_BY = '2026-10-15'`, nine days away | Mark historical. The review date still applies if the candidate is ever run against a provider. |
| C3 | CLAUDE.md 36.3 | Both buyer surfaces "are deployed, carry noindex,nofollow" | VP deleted; acquisition rewritten, `noindex,follow`, redirected | See sections 2 and 3. |
| C4 | CLAUDE.md 36.5 | Sanctioned keys include `bench-*` and `jrs-ai-pilot` | The bench pages were deleted 4 October. Whether `jrs-ai-pilot` is still used: NOT ESTABLISHED | Mark historical where no page uses the key, keeping the list (do not delete). |
| C5 | CLAUDE.md 36.8 | Development branch `claude/html-pilot-L8rC3` | This work is on `claude/engine-local-candidate-2026-10-06`; earlier work on `claude/engine-eval-v8-2026-10-01` | Record the branches in use. |
| C6 | `.jrs/registries/RELEASE_REGISTER.json` line 128 | `openapi.json` "frozen under B-016 ... Neither may be edited" | `openapi.json` edited on `main` (360 lines changed since `0177c51`), and `vercel.json` now redirects `/openapi.json` to `review-engine.html` | **CONTRADICTION, REQUIRES HUMAN REVIEW.** The freeze is owner-or-counsel controlled. Record the 4 to 5 October edit as a recorded exception or as an unreviewed change. Not resolved here. |
| C7 | `.jrs/state/BLOCKERS.json` B-010 | Two deployed confidential buyer pages | See sections 2 and 3 | Append OLD FINDING, NEW EVIDENCE, CORRECTED STATUS. |
| C8 | `.jrs/state/BLOCKERS.json` | Refers to `research-data.html` as a downstream carrier of blocker state | Deleted 4 October | Append note (also guard B23). |
| C9 | `.jrs/registries/ASSET_REGISTER.json` | Lists the VP and acquisition pages | As above | Append corrections, do not delete rows. |
| C10 | `docs/repository-operations/OPERATIONS_ANNEX.md` | Refers to `org-pilot` and `bench-admin` | Deleted | Preserved verbatim by design (2026-09-14). Leave unchanged and rely on CLAUDE.md's pointer to the handoff. |
| C11 | `.jrs/registries/MISUSE_REGISTER.json` M-3, M-10 | See guard A10 | | Correct with history. |

**PENDING SOURCE-ALIGNED REVIEW:** C1 to C11 are checked against repository files only. The 3 October Master Asset Register and Evidence Ledger may already carry different positions on C3, C6, C7 and C9. Those four are not to be written until the files are placed and compared.

---

## Summary of decisions needed
1. Approve, edit or reject P-1 and P-3 (DRR page).
2. Confirm the 4 October removal of the VP page and the rewrite of the acquisition page as the separate authorization 36.3 requires, and choose (a) or (b) for the acquisition file.
3. Approve the sitemap, dead-rewrite and `org-pilot.html` link corrections.
4. Decide how to record the `openapi.json` edit against the B-016 freeze (C6).
5. Provide the three 3 October source-aligned files, so the PENDING items can be closed.
