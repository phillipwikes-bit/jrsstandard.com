# JRS / DRR / Decision Spellchecker, Issue 3.3: Increment 16 G0 cumulative release-candidate lineage
**Record date:** 31 October 2026. **Evidence status:** Actual Git comparison, Vercel deployment metadata and successful draft-branch CI, plus 18 fabricated regression cases. **Authority:** Development evidence only. **Production:** HOLD.

## 1. Newly established G0 facts
The latest READY production-target deployment listed for the connected Vercel project was `dpl_HgHqE1fZ8ZdPJirPYPGDRKdBs8Sf`, associated with Git commit `97087e915245a15808f121e2263a7385a6bf5a04` on `main`. The repository's observed `main` commit was the **same SHA**. The connection is Vercel metadata, not a tested canonical-domain or production database snapshot.

GitHub's actual cumulative compare of that main SHA and the prior PR #67 draft head `a97db02f2770156ea382850274a58cc992b4103e` established **262 additional commits and 121 changed paths**, with no behind/divergence. The first Increment 16 code/CI candidate, `b23361cc33119b6585c2266ebe032a69fae992c7`, was **266 commits ahead and 124 changed paths**. These figures are commit-specific, not final build totals after this report commit.

At `b23361cc...` the cumulative path inventory comprised:
- 33 runtime, authentication, data writer or private owner interface paths, for independent privacy/RLS/behavioral review.
- 23 public-site or other paths, including public route/content and free resources.
- 38 developer tests and tools.
- 28 evidence documentation paths.
- 2 CI configuration paths.

These are path classifications, **not risk probabilities, test passes, actual data changes, or independent acceptance**. The complete source diff is available from the GitHub comparison, and the classifier may misclassify a novel sensitive path. Every included file still requires appropriate review. The path total will change as documentation commits are added.

## 2. Verified stack and release significance
GitHub compare directly established that the PR #57 head `55f119b4e200fcf4cf749b7c1eec7f5f0a7f963f` is an ancestor of the PR #67 head, with 53 intervening commits. The broader stack includes PR #56, #57, #62, #63, #64, #65, #66 and #67. A completed full-history GitHub Actions run on Increment 16 validates all eight exact ancestor identities, rather than merely trusting PR descriptions.

**Release-designation recommendation:** Treat the Increment 16 head as a **single candidate for owner review**, not as a production-ready artifact. Review the entire main-to-head diff and all 33 runtime-sensitive paths. Do not separately approve isolated child PR tests as a blanket approval for the parent/child chain. All current PRs remain draft and require individually appropriate closure. No merge was performed.

## 3. Implemented evidence control
- `tools/check-release-lineage.mjs` uses actual `git rev-parse`, `git merge-base --is-ancestor`, `git diff --name-status -z`, `git rev-list`, and Git blob refs. It records current exact head and main SHA, file groups and runtime-sensitive path list.
- `docs/program-status/INCREMENT_16_CANDIDATE_LINEAGE_POLICY_2026-10-31.json` pins the observed main baseline, the prior reviewed PR #67 head and eight required ancestry anchors. The policy explicitly prohibits automatic release approval.
- The immutable 24-file baseline is checked at the exact candidate tree; only `api/support.js` and `api/support-stats.js` may carry their existing named `PROPOSED_NOT_RELEASE_APPROVED` Git blob exceptions. The historical 24-file original manifest is **not reset or overwritten**.
- `tests/release-lineage.test.mjs` contains 18 fabricated failure/safety cases: original source drift, extra exception, deleted path, moved main, branch divergence, ancestor omission, false approval, Git rename parsing and sensitive path inventory.
- `.github/workflows/public-interest-continuity.yml` now checks out the **actual PR head SHA** with full Git history before running the new real-tree audit and prior regression steps. It does not need or use owner credentials.
- GitHub Actions [run 41224840737](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41224840737) completed **SUCCESS** on code/CI head `b23361cc33119b6585c2266ebe032a69fae992c7`. Eighteen of eighteen synthetic regressions passed; the actual source lineage step passed and all inherited continuity steps succeeded. The next report commit requires another exact-head run.

## 4. Material residual acceptance gaps
1. **G0 baseline limits:** GitHub/Vercel metadata matching is stronger source identification, but not the actual canonical-domain routing, complete production source history or an accepted recovery backup. The separately indexed 223-page historical master remains unavailable as raw bytes for incorporation in Issue 3.3; do not alter its identity.
2. **G1 owner preview:** A newly rotated 32+ character owner token must be set privately in Vercel for the selected exact Preview branch; rebuild exact SHA; directly verify both valid and denied sessions and all private routes. Increment 15's observed 503 remains only a negative refusal and the stateless-cookie logout replay limitation remains open.
3. **G2 data:** Direct anonymous Supabase RLS, all original 11 fixed-UTC source-family counts, historical reviewer/training/guide cohorts, correct missingness and source read/write integrity remain unaccepted.
4. **G3 user journeys:** Real iPhone Safari, resource URLs, accessibility, notification provider acceptance, historical aliases, and rollback have not been accepted.
5. **G4 release:** PST-01..PST-12 have no owner-approved production PASS; exact-head signed approval is absent.
6. **G5 through G7, independent product and rights:** Original DS-A source/build not authenticated; SP acceptance 0/18; H2-vs-H3 independent study not conducted; R6 transfer authorization 0/32, with one separate original commercial schedule digest discrepancy. No new source, study, right or sale evidence was produced.

## 5. Decision and next scope
**Development control:** G0 Git ancestry and 24-file identity audit passed for the inspected candidate. **Operational release:** HOLD. **DS-A:** NO_GO_NOT_VERIFIED. **Independent comparison:** NOT_ESTABLISHED. **Commercial transfer:** NOT_AUTHORIZED.

The next meaningful implementation requires the owner's **private** secret rotation and exact-preview deployment selection, then positive/negative access checks and direct permitted RLS evidence. Engineering should not substitute further generic regression counts for those owner-controlled prerequisites. No contact lists, database rows, secrets, actual case records or original private software were read or changed during Increment 16.
