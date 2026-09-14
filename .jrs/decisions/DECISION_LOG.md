# Decision Log

| Date | Decision | Rationale | Authority |
|---|---|---|---|
| 2026-09-14 | Adopt the JRS Enterprise Asset Orchestrator as root `CLAUDE.md` | Owner instruction | Phillip Wikes |
| 2026-09-14 | Preserve the prior instruction set verbatim as `docs/repository-operations/OPERATIONS_ANNEX.md` rather than replacing it | Rule 10. The prior file carried drift-critical operational knowledge that no part of the master prompt contains | Claude, under Rule 10 |
| 2026-09-14 | Carry the drift-critical invariants INLINE in `CLAUDE.md` Section 36 rather than by reference only | `CLAUDE.md` loads automatically each session; an annex does not. Every item in Section 36 has caused real drift here | Claude, recorded for review |
| 2026-09-14 | Do not reorganize the repository to match Section 4's tree | Section 4 itself instructs preservation of a functioning structure; the tree is a logical model, not a migration order | Claude, under Section 4 |
| 2026-09-14 | Do not modify `api/review.js` to unpin the model during initialization | Section 3 Step 7 forbids modifying substantive assets during initialization. Recorded as blocker B-005 instead | Claude, under Section 3 |
| 2026-09-14 | Advance to Phase 1 with Gate 0 at PASS WITH CONDITIONS | Owner directive of 2026-09-14 STEP 4 permitted advance where conditions do not prevent Phase 1 proceeding safely. The six blockers were classified: none touches a credential, a production surface or a rights-sensitive artifact that Phase 1 writes | Phillip Wikes (directive), classified by Claude |
| 2026-09-14 | **Process defect, recorded rather than hidden** | The rationale above was recorded in conversation and NOT in this log, `CHANGE_LOG.md` or `CURRENT_PHASE.json`, all of which still read phase 0 throughout Phase 1. Section 18 says never rely on conversation memory. Found by the adversarial pass as R-1 | Claude |
| 2026-09-14 | Gate 1: **FAIL** | Fourteen findings from the independent adversarial pass, including a research-evidence deletion that reached a commit, a Rule 1 failure to read a baseline document that already answered the question Phase 1 "discovered", and two false statements labelled FACT | Claude, on the red team's recommendation |
