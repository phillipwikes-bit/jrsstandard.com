# D-10 — Status Reconciliation

**The substantive Google Fonts question is NOT re-decided here.** The owner's decision stands:
**ACCEPT AND DISCLOSE FOR NOW.**

---

## The three records, all preserved

| Source | Says | Authority |
|---|---|---|
| `.jrs/state/BLOCKERS.json` B-009 | *"RESTRICTED-SURFACE FONTS DECISION OPEN"*, and the finding ends **"REQUIRES HUMAN DECISION"** | **AUTHORITATIVE for control state** (CLAUDE.md §18) |
| `HUMAN_DECISIONS_REQUIRED.md` | *"D-10 · Restricted surfaces load Google Fonts — NEW, OPEN"* | Decision log |
| `JRS_BOARD_OWNER_DECISION_REGISTER` | *"Decision: ACCEPT AND DISCLOSE FOR NOW"* | **Control layer only** |

## CURRENT STATE

**Two different questions were being tracked under one label.**

1. **Google Fonts on public pages** — **DECIDED.** Accept and disclose. Disclosed on
   `privacy.html`, including that the request is not stopped by opting out of analytics.
2. **Google Fonts on the three RESTRICTED surfaces** — **OPEN.** This was discovered *after*
   the Fonts decision was first stated. Whether that decision was intended to cover a
   confidential buyer page disclosing a visitor's IP to Google is **NOT ESTABLISHED**.

## HISTORICAL STATE

The Board register's "decided" entry is accurate for question 1 and was written before question
2 existed. **It is not wrong; it is answering the earlier question.**

## CORRECTION

`PRE_DEPLOYMENT_STATE_RECONSTRUCTION_2026-09-15.md` placed B-009 and "D-10 to D-17" under
**"Engineering completed"** and omitted them from the owner-action line. **That converted an
owner action into engineering closure**, which the directive prohibits. The earlier
`PRE_GATE_1_READINESS_AUDIT` had it right.

## AUTHORITY

`.jrs/state/BLOCKERS.json` governs. **Question 2 remains OPEN / OWNER ACTION REQUIRED.**

## EVIDENCE

All three restricted surfaces reference `fonts.googleapis.com` and `fonts.gstatic.com`; each
carries `noindex`; each has zero analytics tags. Analytics was deliberately removed from the
owner page; **the font request was never considered**.

**No record was edited to match another. `CONTRADICTION_002.md` remains open.**

**OWNER ACTION:** confirm whether the Fonts decision covers the restricted surfaces.
