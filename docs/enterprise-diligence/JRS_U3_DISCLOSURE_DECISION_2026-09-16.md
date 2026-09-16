# U-3 — Disclosure of the 90-Day Retention Period · BOARD DECISION — OWNER-DELEGATED

**Decision ID: BD-12 · 2026-09-16 · Prior status: OPEN — BOARD DECISION REQUIRED**

**No legal interpretation arose during the analysis, so this is decided rather than escalated.**

---

## Question

Does the 90-day expiry of record-derived `engine_reviews` fields (BD-10) need to be disclosed
publicly?

## Evidence — what a reader is actually told today

| Surface | Says |
|---|---|
| `security.html:279` | Record text is not stored; model output about the record "**is** stored… and it is retained" |
| `privacy.html` | Anthropic named; "some of what the model writes back about your record is kept as programme telemetry, including a short per-condition note and a suggested rewritten version of the passage" |
| `review-engine.html` | Same distinction |
| **Every public page** | **States NO retention period. Searched: "90 days", "retention period", "retained for". Zero results** |

**FACT: the estate tells a reader that model output about their record is kept, and never says
for how long.** Before BD-10 that was at least complete — there *was* no period. **Since BD-10
there is one, and it is undisclosed.**

## Facts

- Record-derived fields expire at 90 days, nulled in place (BD-10).
- The row, statuses, `determination`, `overall_consistency` and versions are **retained**.
- Expiry is irreversible once run.
- **Nothing has been expired: the policy computes and the table holds zero rows.**
- The customer-held Manifest is a **separate** artifact under the customer's control.

## Unknowns

Whether any customer or partner has asked about retention: **NOT ESTABLISHED**, and not material
to the decision — the disclosure is owed regardless.

## Options

| | Option | Assessment |
|---|---|---|
| A | Do not disclose the period | **REJECTED.** No affirmative reason exists. A retention period is not a security control whose secrecy protects anyone; it is a commitment to the person whose record it is. **"Operational" is not a justification for withholding it** |
| B | Disclose "90 days" plainly | **Insufficient alone.** Stated bare, a reader concludes the whole row is deleted at 90 days. **That is false** and would be a worse misrepresentation than silence |
| **C** | **Disclose by field category** | **ADOPTED** |
| D | Disclose the rule but not every field | **REJECTED.** The distinction between what expires and what is kept *is* the rule. Omitting it reproduces B's defect |
| E | Change the architecture before disclosing | **REJECTED.** BD-10 is not defective. Reopening a sound decision because a disclosure question exists would be the wrong order |

## THE DECISION

**Disclose by category, on the two pages that already describe the distinction.**

> Model output about your record — a short note against each condition and a suggested
> rewritten version of the passage — **is kept for 90 days and then removed**. The evaluation
> record itself is kept: the date, the five condition statuses, the routing outcome, the run
> count, the consistency figure and the engine version. **The record you submitted is never
> stored at all.**

**Three categories, stated in one sentence each**, because the failure mode of a bare "90 days"
is a reader concluding everything vanishes.

## Criteria satisfied

Truthfulness **yes** · transparency **yes** · privacy **yes** · independent reviewability
**yes, a reader can now check the claim against behaviour** · consistency with implementation
**yes, it describes BD-10 exactly** · operational practicality **yes** · customer comprehension
**yes, three categories, no schema** · reversibility **yes, wording** · maintenance **one
period in two places, guarded** · legal caution **yes, no compliance claim is made**.

## What the wording deliberately does NOT say

It does not say all data is deleted after 90 days · does not say metadata disappears · does not
mention the Manifest, which is customer-held and not JRS's to promise about · does not claim
zero persistence · does not claim compliance · does not name columns or tables · **does not
promise deletion at an exact wall-clock moment** — "kept for 90 days and then removed" describes
a policy, not a millisecond guarantee.

## Consequence

**DISCLOSURE IS NOT PRODUCTION IMPLEMENTATION.** The wording changes in development. Production
still serves the old text, and no expiry has run anywhere. **Both remain PRODUCTION
VERIFICATION REQUIRED.**

## Dependencies

BD-10 unchanged · BD-11 unchanged · B-013C unchanged · no blocker changes · **Gate 1 unaffected**
· no counsel matter arises.

**STATUS: BOARD DECIDED → IMPLEMENTED → TESTED. NOT PRODUCTION VERIFIED.**
