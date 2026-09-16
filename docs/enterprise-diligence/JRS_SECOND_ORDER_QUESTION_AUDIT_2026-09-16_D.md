# Second-Order Question Audit — Round D — 2026-09-16

**Scope and method, recorded per §19.** Starting from BD-10, BD-11 and BD-12, each of the
fifteen consequence categories was walked against the implemented disclosure, the retention
module, the two projections and the new guards. Rounds A–C are carried in the matrix.

---

| # | Question | From | Category | Disposition |
|---|---|---|---|---|
| **V-1** | The disclosure says "kept for 90 days and then removed" while **nothing has ever been removed** — the policy computes and the table holds zero rows. Is the present tense a false representation? | BD-12 | Privacy / claims | **ANSWERED — BOARD DECISION.** It describes a **policy**, which is what a retention statement is, and the wording avoids a wall-clock guarantee. **But the honest position is recorded: no expiry has run anywhere, and the statement is a commitment rather than an observed behaviour until production verification.** That is stated in the decision record, not on the page, because a public page qualifying its own policy with "we have not done this yet" would confuse more than it informs |
| **V-2** | The period is disclosed in **days** and coded in **months**. Could `months: 3` ever not equal 90 days? | BD-12 | Architecture | **ANSWERED — BOARD DECISION.** Yes, by 1–2 days across month lengths, because `cutoffISO` is calendar-based. **The guard converts months × 30 for comparison and the page says "90 days", so a reader could see expiry at day 89 or 92.** Accepted: the alternative is publishing "three months", which is vaguer for the reader. **The imprecision is in the reader's favour and is recorded rather than hidden** |
| **V-3** | Two pages now carry the same period. Drift risk? | BD-12 | Documentation | **ANSWERED — BOARD DECISION.** Guarded: the new check reads the period from the policy module and requires both pages to match it, anchored to the disclosure sentence |
| **V-4** | Does disclosing a 90-day window create an **expectation of deletion on request** inside it? | BD-12 | Privacy / legal-adjacent | **OPEN — LOW. Recorded, not decided.** A retention period is not a deletion-on-request right, and `privacy.html` §7 already carries a separate Delete right. **Whether stating a period changes anything about that right is a legal question, not an engineering one** — if it is ever raised, it joins B-004's counsel channel rather than being answered here |
| **V-5** | The Manifest is deliberately **not mentioned** in the disclosure. Does omitting it mislead a reader into thinking nothing durable survives? | BD-12 | Evidence / architecture | **ANSWERED — BOARD DECISION.** No. The Manifest is **customer-held**; JRS does not retain it and must not imply it does. Mentioning it in a JRS retention statement would suggest JRS controls it. **The manifest documentation covers it in its own place** |
| **V-6** | BD-11 narrowed the data-room export. Does the research data room now under-serve a reviewer who wants to audit the engine? | BD-11 | Research / transferability | **ANSWERED — FACT ESTABLISHED.** No. Determination, runs, consistency and engine version are exported; the free text was never a research input, and no research script reads the table |
| **V-7** | With the free text expiring, does **B-013A's grant revocation** become less urgent? | BD-10 + BD-02 | Security | **ANSWERED — BOARD DECISION: NO, and conflating them would be the error.** Retention bounds how long content exists; the grant controls who can read it **during** those 90 days. **A 90-day public window is not an acceptable substitute for access control** |
| **V-8** | Three guards now touch retention (policy shape, export paths, disclosure match). Overlapping coverage or redundant maintenance? | this cycle | Testing | **ANSWERED — BOARD DECISION: distinct.** One checks the policy declares itself, one that no read path returns the fields, one that the public period matches the code. **A change that defeats one would be caught by another only by luck** |
| **V-9** | Does disclosing a retention period constitute a **commercial representation** to a future licensee? | BD-12 | Commercialization | **OPEN — LOW.** It is a published data-handling statement, and a licensee could reasonably rely on it. **It is not a contract, and no licence exists.** If one is drafted, retention belongs in it and the drafting is counsel's |
| **V-10** | Production still serves the **old** text, which says model output is retained with no period. Is production now less accurate than before this cycle? | BD-12 | Production | **ANSWERED — FACT ESTABLISHED, and it is uncomfortable.** **No: production is unchanged and was never wrong** — it stated retention without a period, which was complete before BD-10. **But since BD-10 there is an undisclosed period in force in policy, and production does not mention it.** The gap closes on deployment, and it is one more thing waiting behind B-001 |

## The two left open

**V-4** and **V-9**, both low, both edging toward counsel rather than engineering. Neither
blocks anything. **Both are recorded because a retention disclosure is the kind of statement
that acquires legal weight quietly.**

## What Round D did not find

No new exposure path. No new rights question. No API consequence. No research consequence. No
validation implication. **Stated explicitly rather than left as silence**, because the search
was run and came back clear in those categories.
