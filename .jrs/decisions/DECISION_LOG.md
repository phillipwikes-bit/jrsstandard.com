# Decision Log

| Date | Decision | Rationale | Authority |
|---|---|---|---|
| 2026-09-14 | Adopt the JRS Enterprise Asset Orchestrator as root `CLAUDE.md` | Owner instruction | Phillip Wikes |
| 2026-09-14 | Preserve the prior instruction set verbatim as `docs/repository-operations/OPERATIONS_ANNEX.md` rather than replacing it | Rule 10. The prior file carried drift-critical operational knowledge that no part of the master prompt contains | Claude, under Rule 10 |
| 2026-09-14 | Carry the drift-critical invariants INLINE in `CLAUDE.md` Section 36 rather than by reference only | `CLAUDE.md` loads automatically each session; an annex does not. Every item in Section 36 has caused real drift here | Claude, recorded for review |
| 2026-09-14 | Do not reorganize the repository to match Section 4's tree | Section 4 itself instructs preservation of a functioning structure; the tree is a logical model, not a migration order | Claude, under Section 4 |
| 2026-09-14 | Do not modify `api/review.js` to unpin the model during initialization | Section 3 Step 7 forbids modifying substantive assets during initialization. Recorded as blocker B-005 instead | Claude, under Section 3 |
