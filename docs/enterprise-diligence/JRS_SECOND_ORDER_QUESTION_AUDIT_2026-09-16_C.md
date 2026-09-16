# Second-Order Question Audit — Round C — 2026-09-16

**Search method and scope, recorded because §38 requires it.** Every field, code path and read
path touching `engine_reviews` was enumerated from source. Both new decisions (BD-10, BD-11)
were then walked against the fifteen consequence categories in §38. Rounds A and B are carried
in the matrix and not restated.

---

| # | Question | From | Authority | Disposition |
|---|---|---|---|---|
| **U-1** | BD-10 expires `input_preview`, a column that is **no longer written**. Is expiring a dead column meaningful, or does naming it imply it is still populated? | BD-10 | **BOARD** | **ANSWERED — BOARD DECISION.** Meaningful. The column still **exists**, so any row written before 2026-08-14 could carry it. Naming it costs nothing and closes the case where an old row survives. The policy comment states it stopped being written, so the record does not imply otherwise |
| **U-2** | Expiry is **irreversible** once run. A dispute arriving on day 91 cannot be investigated with the original wording. Is 90 days defensible? | BD-10 | **BOARD** | **ANSWERED — BOARD DECISION, and the trade is stated rather than hidden.** 90 days covers an ordinary support window. Past it the debugging value of exact wording is close to nil while the privacy cost is unchanged. **A customer who needs longer should be told before they submit, not after** — see U-3 |
| **U-3** | Does a 90-day expiry need **disclosing** to a customer whose record is evaluated? | BD-10 | **BOARD** | **OPEN — BOARD DECISION REQUIRED NEXT CYCLE.** `privacy.html` and `security.html` say model output about the record is retained; **neither states for how long**. A stated retention period is more useful to a reader than the fact of retention alone, and the disclosure is now the weaker half |
| **U-4** | BD-11 narrowed the data-room export. Does the research data room still serve its purpose without the engine's free text? | BD-11 | **BOARD** | **ANSWERED — BOARD DECISION.** Yes. The room's reproducibility datasets are `findings_history` and `study_runs`; `engine_reviews` contributes determination and consistency, both retained. **No research consumer of the free text exists** |
| **U-5** | Two read paths now carry the same projection, written twice. Will they drift? | BD-11 | **BOARD** | **ANSWERED — BOARD DECISION: accept, guarded.** Extracting a shared module would put implementation into a page. The new guard asserts **both** paths exclude the derived columns, so drift fails the suite rather than shipping |
| **U-6** | The retention module now holds **two** rules with different periods. Could a future caller apply the wrong one to the wrong table? | BD-10 | **BOARD** | **ANSWERED — BOARD DECISION.** Each rule names its own `table`, and the functions are separate — `selectExpired` for telemetry, `selectExpiringFields` for engine reviews. Neither reads the other's config |
| **U-7** | `request_id` is retained indefinitely and appears in engine responses. Is it a correlation handle to a specific submission? | BD-10 | **BOARD** | **ANSWERED — BOARD DECISION: retain.** It is a random per-request id carrying no record content, and it is the only means by which a customer can ask about a specific evaluation. **Removing it would make the 90-day support window unusable** |
| **U-8** | With the free text expired at 90 days, does the **Manifest** become the only durable record of what the engine said about a record? | BD-10 | **FACT** | **ANSWERED — FACT ESTABLISHED.** Yes, where a manifest was generated. That is the intended architecture: the manifest is customer-held and carries `content_class`. **It strengthens the manifest's purpose rather than creating a gap** |
| **U-9** | Does BD-10 change anything for **B-013A**? The grant revocation is still pending | BD-10 + BD-02 | **BOARD** | **ANSWERED — BOARD DECISION: no, and they must not be conflated.** Retention limits how long content exists; the grant controls who can read it while it does. **Both are required. Neither substitutes for the other** |
| **U-10** | Three governance artifacts now describe `engine_reviews` (B-013A, BD-10, BD-11). Is that a competing-authority risk? | this cycle | **BOARD** | **ANSWERED — BOARD DECISION: no.** They address read access, retention and export respectively. `.jrs/state/BLOCKERS.json` remains the single authoritative status record and carries all three |

## The one left open

**U-3.** BD-10 set a retention period and **the public disclosure does not state it.** The pages
say model-written output about the record is kept; they do not say for how long. **Having chosen
a period, not publishing it is the weaker position**, and it is decidable next cycle.

## Entered into the Question Resolution Matrix

U-1, U-2, U-4, U-5, U-6, U-7, U-9, U-10 → **ANSWERED — BOARD DECISION**.
U-8 → **ANSWERED — FACT ESTABLISHED**.
**U-3 → OPEN, BOARD DECISION REQUIRED NEXT CYCLE.**

**T-4 is no longer open. It is BD-10: DECIDED → IMPLEMENTED → TESTED.**
