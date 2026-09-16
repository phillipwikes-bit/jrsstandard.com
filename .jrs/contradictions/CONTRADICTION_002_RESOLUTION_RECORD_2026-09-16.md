# CONTRADICTION 002 — Resolution Record

**Opened 2026-09-15 · Resolved as to the DECISION on 2026-09-16 · The contradiction record
itself is NOT deleted.**

---

## Original contradictory statuses

| Source | Stated | Date |
|---|---|---|
| `.jrs/state/BLOCKERS.json` B-009 | *"RESTRICTED-SURFACE FONTS DECISION OPEN"*, finding ends **"REQUIRES HUMAN DECISION"** | 2026-09-15 |
| `HUMAN_DECISIONS_REQUIRED.md` D-10 | *"NEW, OPEN"* | 2026-09-15 |
| `JRS_BOARD_OWNER_DECISION_REGISTER_2026-09-15.md` | *"Decision: ACCEPT AND DISCLOSE FOR NOW"* | 2026-09-15 |

## Chronology — why they diverged

1. The owner stated a Google Fonts decision **on the public-page question**, which the Board
   register recorded faithfully.
2. **Afterwards**, an audit found that all three **restricted surfaces** also load Google Fonts.
   That was a **new question about a different surface class**, recorded in B-009.
3. The Board register was never updated, because the new finding did not change the decision it
   had recorded. **Neither record was wrong. They were answering different questions.**
4. A later state reconstruction of mine then filed B-009 and D-10 under *"engineering
   completed"* — **converting an owner action into engineering closure**, which is the one
   genuinely incorrect step in the sequence.

## Current controlling interpretation

**Two questions existed under one label.**

| Question | State |
|---|---|
| Fonts on public pages | **DECIDED** by the owner, 2026-09-15. Accept and disclose |
| Fonts on the three restricted surfaces | **DECIDED** by the Board, 2026-09-16, as **BD-05** under delegation. Accept and disclose. Do not self-host. Do not alter access architecture |

## Effective state

**D-10 is decided in both halves.** The Board could take the second half because privacy
posture is delegated, the surfaces already carry `noindex`, are absent from `sitemap.xml`, and
are linked only from each other, and self-hosting remains available as deferred hardening.

**B-009's disclosure half remains NOT DEPLOYED**, which is a different matter and is unchanged.

## Authority

`.jrs/state/BLOCKERS.json` governs control state (CLAUDE.md §18). Its B-009 status is updated
**today, with the reason recorded**, rather than edited to match the Board register
retroactively.

## What was NOT done

**Neither side was silently edited to eliminate the appearance of disagreement.** The original
statuses above are preserved verbatim. `CONTRADICTION_002.md` remains in place. The incorrect
"engineering completed" filing is recorded here as an error rather than deleted from the
reconstruction.

**STATUS: DECISION RESOLVED (BD-05). RECORD RETAINED AS EVIDENCE OF HOW A STATUS DRIFTED.**
