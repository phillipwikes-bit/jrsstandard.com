# Second-Order Question Audit — 2026-09-16

> **HISTORICAL EXECUTION RECORD — STAMPED 2026-09-18.**
> Evidence of work performed on its date. **Not current-state authority.**
> `.jrs/state/BLOCKERS.json` is the authoritative registry (CLAUDE.md §15) and controls
> where the two disagree. Retained in full; nothing here states what is true now.

**Questions raised *by this cycle's decisions*, which did not exist before them.**

| # | Question | Arises from | Authority | Status |
|---|---|---|---|---|
| S-1 | Was de-identification review actually performed on all 54 `bench_outcomes` rows? `submit-validation.html` promises it as a pending step; **the instruction existing is not proof it happened** | BD-01 | **OWNER FACTUAL CONFIRMATION** | **OPEN, NEW** |
| S-2 | If `engine_reviews` read access is revoked (BD-02 A), `engine-activity.html` breaks until B is built. Is a broken public page for an interval acceptable, or must A and B ship together? | BD-02 | **BOARD** — decided: **ship together.** A alone leaves a visibly broken public page, and the window is not closing in hours | **DECIDED** |
| S-3 | A 24-month retention rule (BD-03) means the oldest `interaction_events` rows are already ~3 months inside it. Does the first application delete anything? | BD-03 | **BOARD** — the earliest rows date from 2026-06; under a 24-month rule **nothing is deleted yet**, so the first application is a no-op and the rule is purely forward-looking | **DECIDED** |
| S-4 | Declaring three mappings SEMANTIC (BD-04) makes the fourth conspicuous. Does declaring three increase pressure to guess the fourth? | BD-04 | **BOARD** — yes, and it is recorded so the pressure is visible. **Three declared does not make the fourth inferable**; it is a question about what the engine computes, not what it is called | **DECIDED, recorded as a risk** |
| S-5 | BD-06 removed the calls but **not** the CLAUDE.md §36.1 "Backend endpoint" entry. The canonical record now describes an endpoint nothing calls. Is that drift, or preserved intent? | BD-06 | **BOARD** — **preserved intent.** Deleting it would erase the architectural decision; it is contradicted by evidence in the drift analysis, which is the correct resolution | **DECIDED** |
| S-6 | BD-07 replaces five published figures. Does changing a buyer-facing figure require separate notice to anyone who saw the old one? | BD-07 | **OWNER** — the Board can decide the representation; **whether a recipient of the old figure should be told is an owner and possibly counsel matter** | **OPEN, NEW** |
| S-7 | BD-08 screens two record-paste fields but not fifteen other free-text surfaces. Does a partial screen create a *worse* expectation than none? | BD-08 | **BOARD** — no, **provided the promise describes it**, which it now does. The alternative, screening everything, was rejected as friction without matching risk | **DECIDED** |
| S-8 | `api.jrsstandard.com` is now RETIRED in the inventory but still named as canonical in CLAUDE.md. Two authoritative records disagree | BD-06 | **BOARD** — not a contradiction: one records *intent*, the other records *live destinations*. Both are true. Recorded so a reader does not treat it as drift | **DECIDED** |
| S-9 | If the owner answers S-1 "review was not performed", does BD-01's risk downgrade survive? | BD-01 / S-1 | **BOARD** — **partially.** The instruction to submit only already-public material stands regardless; the de-identification *check* would not have been applied. The downgrade rests mainly on the first, so it survives in reduced form | **CONDITIONAL** |

## The two that are genuinely new and reserved

**S-1** and **S-6**. Both require something only Phillip holds: whether a review happened, and
whether anyone received a superseded figure.

**Neither existed before this cycle**, and both are consequences of decisions the Board took
rather than of defects it found.
