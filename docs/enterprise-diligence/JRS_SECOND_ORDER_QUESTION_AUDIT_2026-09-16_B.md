# Second-Order Question Audit — Round B — 2026-09-16

> **HISTORICAL EXECUTION RECORD — STAMPED 2026-09-18.**
> This is evidence of work performed on its date. **It is not current-state authority.**
> An execution report saying a blocker is open does not make it open; `.jrs/state/BLOCKERS.json`
> is the authoritative registry (CLAUDE.md §15) and controls where the two disagree.
> **Nothing under this heading is retained as a statement of what is true now**, and nothing
> is deleted: an execution record's value is that it shows what was believed when it was
> written.

**Questions created by the IMPLEMENTATIONS of BD-02, BD-03, BD-04 and BD-07. Round A audited
the decisions; this audits what building them produced.**

**This is not a copy of Round A.** S-1 through S-9 are carried in the Question Resolution
Matrix and are not restated here.

---

| # | Question | Arises from | Authority | Answer / Status |
|---|---|---|---|---|
| **T-1** | `api/engine-activity.js` reads with `SUPABASE_SERVICE_ROLE_KEY`. **A public, unauthenticated endpoint now holds a service-role read.** Is that a net security improvement or a new concentration of privilege? | BD-02 | **BOARD** | **DECIDED: net improvement.** Previously *anyone* could read the whole table directly with a key shipping in 22 pages. Now one server-side route reads it and returns a projection with every free-text field removed. The privilege moved from the public to the server, which is the direction that reduces exposure. **Residual, recorded: a bug in this route is now a service-role bug.** Mitigated by the double drop — select list and projection — and 17 tests |
| **T-2** | The endpoint is unauthenticated and rate-limit-free. Could it be used to enumerate review volume over time? | BD-02 | **BOARD** | **DECIDED: accept.** It returns at most 100 rows and the hour-truncated timestamp already blunts correlation. Volume is what a public activity log exists to show. **A rate limit is recorded in the Deferred Build Register, not built** |
| **T-3** | `overall_consistency` survives the projection. Is a per-review consistency figure record-derived? | BD-02 | **BOARD** | **DECIDED: not record-derived.** It measures agreement between runs of the engine, not content of the record. It is the figure the reproducibility reporting exists to publish |
| **T-4** | The retention rule names `engine_reviews` as **excluded** because B-013A is undecided. B-013A is now **decided**. Does `engine_reviews` need a retention rule? | BD-03 + BD-02 | **BOARD** | **NOT DECIDED — genuinely new and open.** B-013A decided *read access*, not *retention*. A table holding model rewrites of customer passages with **no retention rule** is the same unchosen-default defect BD-03 was raised to fix. **Recorded as a new question, not quietly extended** |
| **T-5** | BD-03 excludes research tables from deletion on evidence-preservation grounds. Does that mean research tables have **no** retention rule at all, forever? | BD-03 | **BOARD** | **DECIDED: yes, by design, and it is not a gap.** Research evidence is retained because deleting it destroys the evidentiary record. That is a deliberate position, now stated rather than implied |
| **T-6** | The distribution now published (66.7–93.3, mean 85.3) is **wider and lower** than the figures it replaced. Could a reader who saw the old 86.7% conclude the result got worse? | BD-07 | **OWNER** | **OPEN.** The measurement did not change; the presentation did. Whether anyone needs telling is **S-6**, already reserved. **T-6 narrows S-6: the risk is not only silence, it is that the correction reads as a decline** |
| **T-7** | Three mappings are now DECLARED. Does the mapping control document become a thing an integrator could rely on, and therefore a quasi-contractual statement? | BD-04 | **COUNSEL-ADJACENT** | **OPEN, LOW.** The document is internal (`docs/enterprise-diligence/` is excluded from deployment), so nobody outside can currently rely on it. **If it is ever published, it joins the B-007 counsel question rather than being a separate one** |
| **T-8** | `engine-activity.html` now depends on a route that does not exist in production. Until deployment, the page is **broken on production**. | BD-02 | **BOARD** | **DECIDED, and stated plainly: yes, on the development branch.** Production still serves the old page reading the old way, and production is unchanged. **The two ship together (S-2), so the broken interval never reaches production** |
| **T-9** | Removing `finding` from the public page means the only remaining readers of `compliant_version` are the database and whoever holds the service key. Does anything still *display* it? | BD-02 | **FACT** | **ESTABLISHED: nothing does.** Zero render paths remain anywhere in the estate. The field is written and never shown |
| **T-10** | The retention module is dead code until someone runs it. Does shipping an unexecuted policy module create a false impression that retention is in force? | BD-03 | **BOARD** | **DECIDED: mitigated in the module itself.** Its header states it computes and does not delete, and a test asserts it contains no DELETE and no fetch. **The policy is recorded as adopted; execution is recorded as not performed.** Those are stated separately everywhere they appear |

## The one that matters

**T-4.** BD-03 excluded `engine_reviews` from retention *because B-013A was undecided*. **B-013A is now decided.** The exclusion's stated reason has expired, and a table that will hold model rewrites of customer passages currently has **no retention rule at all**.

**That is the same unchosen-indefinite-default that BD-03 existed to correct**, and it has quietly reappeared one table over. It is recorded as **OPEN**, not extended by inference, because the retention period for record-derived content is a different judgement from the retention period for page-view telemetry.

## Entered into the Question Resolution Matrix

T-1, T-3, T-5, T-8, T-9, T-10 → **ANSWERED — BOARD DECISION**.
T-2 → **ANSWERED — BOARD DECISION** (accept; rate limit deferred).
**T-4 → OPEN, BOARD DECISION REQUIRED NEXT CYCLE.**
**T-6 → OWNER FACTUAL CONFIRMATION REQUIRED** (narrows S-6).
T-7 → **OPEN, LOW**, folds into B-007 if the document is ever published.
