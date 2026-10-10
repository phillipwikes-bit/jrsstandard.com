# PR #39 merge recommendation

**Date:** 2026-10-06. **PR:** #39, branch `claude/engine-local-candidate-2026-10-06`, draft. **Labels:** VERIFIED (inspected or run here), SOURCE-REPORTED (the 5 October handoff or the owner's instruction of 2026-10-06), PROPOSED, UNRESOLVED.

## 1. Current PR status
- VERIFIED:
  - Draft and unmerged.
  - The base is `main` `97087e9`, and `main` has not moved since the branch was created.
  - 83 files changed (79 before this review, plus its four documents), all under `lib/engine-candidate/`, `tests/engine-candidate/`, `.jrs/`, `research/` and `docs/architecture/`. Every one of these paths is excluded by `.vercelignore` (`lib/`, `tests/`, `.jrs/`, `research/`, and `*.md` for `docs/`).
  - No public page, route, `vercel.json`, sitemap, OpenAPI file, schema or guard is changed.
  - Its checks are Vercel Preview Comments (success) and Cloudflare Workers (skipped, as expected).
- **Controlling-source limitation:** the three 3 October source-aligned documents are not reachable from this session (searched; see `PR39_SOURCE_ALIGNMENT_REVIEW_2026-10-06.md`). This recommendation rests on the handoff, the owner's stated position and the repository's recorded owner decisions.

## 2. What PR #39 safely adds
- A local-only Review Engine candidate (0.4.0-local.1), scoped to completed, non-HR supplier-access exception drafts:
  - deterministic source preparation, refusing partial and unreadable input;
  - a fail-closed adapter boundary, with a mock adapter only;
  - a versioned result contract with per-finding human disposition and a separate sign-off;
  - a reviewer packet;
  - a contamination screen;
  - a consistency harness.
- Constructed development material, with expectations committed before the code they test: 3 fixtures, 24 regression cases, a 15-record corpus and 47 confirmation cases.
- A single test command: 16 suites and 405 checks, plus the case sets and 63 of 63 mutations caught (VERIFIED this session).
- Documentation (README, ARCHITECTURE, RUNBOOK) and four review packages.

**Effect on what is served:** none. INFERENCE from `.vercelignore`, consistent with the preview check, which could not be inspected because it sits behind Vercel sign-in.

## 3. What PR #39 does not establish
- Engine accuracy, reliability, robustness or validity on any record.
- Behaviour of any real model provider. No provider has been called.
- Independent evaluation. Every corpus is constructed by the same author, and the confirmation corpus is not independent in authorship.
- Operation of any privacy, retention, backup, deletion or security control. The isolation tests show how the candidate code behaves in this container only.
- That an exact quotation supports a finding. An anchor shows only presence in the record.
- Any Engine-to-Codebook correspondence.
- Production readiness, workplace readiness, licensing readiness or sale readiness.

## 4. Conflicts requiring revision before merge
1. **`lib/engine-candidate/review-candidate.js` lines 66 to 72 (`SYSTEM_PROMPT`).**
   - **The conflict:** the prompt calls the five engine keys "five JRS documentation review conditions", including `cold_reviewer_clarity`. It also gives `accountability_support` the Evidentiary Sufficiency question.
   - **What it conflicts with:**
     - Owner decision D-2: `cold_reviewer_clarity` is "not an additional JRS condition … not equivalent to another JRS condition".
     - The correspondence review, which records the non-exact pairs as unresolved (D-3).
     - The handoff's prohibition on "an asserted exact Engine-to-Codebook mapping without a versioned correspondence record".
   - **Fix:** the exact replacement wording is in `PR39_SOURCE_ALIGNMENT_REVIEW_2026-10-06.md` (CONFLICT row). It needs a code change, which this task did not permit, so it remains open.
   - **The same revision should cover:**
     - the matching `CONDITION_CATEGORY` pairing in `explanations.js`;
     - a `PROMPT_VERSION` bump;
     - the "supporting quotations" note in `reviewer-packet.js` line 82.

No other conflict was found.

## 5. Non-blocking limitations
- The source-preparation, inference and domain screens are heuristics or word lists.
- The contamination screen misses paraphrase, and its thresholds are judgement. No holdout builder exists, so separation is detected, not enforced. The ARCHITECTURE wording was corrected in this commit.
- `result_digest` is not authentication.
- The reviewer packet holds record quotations, so it is as confidential as the record.
- The harness code name `unsupported_quotation` should become `quotation_not_in_record`.
- The README should say that an exact quotation is not semantic support, and that the inference screen is a word list (PROPOSED wording).

## 6. Public-boundary impact
- **None from PR #39 itself.** VERIFIED: no public file changed.
- **Note:** merging to `main` triggers a Vercel production build. The served bytes should not change, but the merge is a production deployment event, and CLAUDE.md section 26 requires the owner's authorization for it.
- **Found separately, on `main`, and not caused by PR #39:**
  - `security.html` and `privacy.html` describe a review data flow that no longer exists (`PUBLIC_CLAIM_RECONCILIATION_2026-10-06.md`, P-1 and P-2).
  - Thirteen other public-claim repairs are proposed there.

## 7. Release-gate impact
**None.** No gate is passed or affected. External controlled use remains **not verified** (SOURCE-REPORTED, handoff):
- independent labelled holdout evaluation;
- operator-control evidence;
- counsel review;
- recorded owner release authorization;
- independent production QA.

## 8. Recommendation
**REVISE_BEFORE_MERGE**

After the section 4 revision, and after a re-check against the 3 October documents once they are available, PR #39 would be a candidate for **safe merge as excluded local and internal code**. That would be a repository merge only. It would **not** be a release, a deployment authorization or a production authorization, and it would not move any release gate.

## 9. Update after the source-aligned repairs (2026-10-06, commits `afd6b44`, `3758d76`, `1aabaab`)
Sections 1 to 8 above are kept as the record of the earlier assessment (Rule 10).

### What changed
- **Section 4 conflict: fixed** (`afd6b44`).
  - Prompt `candidate-prompt/0.4.0` calls the five keys candidate review keys, says they are not the JRS Codebook conditions, and asserts no correspondence.
  - `accountability_support` no longer carries the evidence-sufficiency question.
  - Explanation set 0.2.0 unmaps `accountability_support` beside `cold_reviewer_clarity`, and declares `CODEBOOK_CORRESPONDENCE_RECORD = null`.
  - The reviewer-packet note is corrected.
  - `tests/engine-candidate/vocabulary.test.mjs` fails if any of this regresses. VERIFIED: all four of its checks fail on the pre-fix copy, and four new mutations are caught.
- **Public boundary: repaired** (`3758d76`). Sixteen public pages and `CLAUDE.md` 36.2 (dated note, no text deleted). `tests/public-boundary-claims.mjs` reports 66 violations on 14 pre-repair pages and 0 after.
- **Standard page restored** (`1aabaab`). `jrsstandard.html` had been saved truncated on `main` in `b1929b9`.

### PR #39 now changes deployable files
- 104 files in total.
- 18 of them are outside the `.vercelignore` exclusions: 17 HTML pages and `CLAUDE.md`. `CLAUDE.md` is excluded by `*.md`, so 17 served pages would change on merge.
- **Section 6 above ("None from PR #39 itself") is therefore superseded.** Merging is now a production publication of public-page changes. CLAUDE.md sections 23 and 26 require the owner's publication review and approval before that happens.

### Verification (this session)
| Command | Result |
|---|---|
| `node tests/engine-candidate/run-all.mjs` | all 17 suites passed; 67 mutations, 67 caught |
| `node tests/engine/auth-matrix.mjs` | 10 checks, 0 failed |
| `node scripts/test_review_incomplete.mjs` | PASS |
| `node tests/public-route-alignment.mjs` | 17 checks, 0 failed |
| `node tests/public-boundary-claims.mjs` | 83 pages, 0 violations |
| `python3 scripts/check_zero_drift.py` (unchanged) | 164 checks, 39 failed, 1 skipped. The two new failures (rows 38 and 39 of the guard package) are guards that require the retired wording. |
| `git diff --check` | clean |

### Recommendation
**MERGE_SAFE_AS_LOCAL_INTERNAL_WORK.** The only conflict identified (section 4) is fixed, and the boundary tests pass. This recommendation is limited as follows:
- **It does not authorize** production release, deployment, licensing, sale, evaluation, or any use of real records.
- **It does not move any release gate.** Section 7 is unchanged.
- **The public-page changes need the owner's approval as a publication** (Section 23) before merge, because merging deploys them. This includes the `jrsstandard.html` restoration.
- **The re-check against the three 3 October source-aligned documents remains pending.** Those documents were not reachable in this session.

### Remaining blockers
- **3 October source recheck:** pending.
- **Guard reconciliation:** owner approval for the UPDATE and RETIRE rows, including the new rows 38 and 39.
- **B-010:** acquisition and VP routes, unchanged.
- **P-5:** production controls behind `privacy.html` section 4 are NOT_ASSESSED; operator evidence is required.
- **P-11 to P-13:** sitemap and redirect entries, left unchanged.
- **Earlier engine output:** whether any output stored by the earlier engine route remains is NOT ESTABLISHED. The pages now say so and make no deletion statement.
