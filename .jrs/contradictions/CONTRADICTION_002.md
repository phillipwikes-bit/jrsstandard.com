# CONTRADICTION 002 — D-10 / B-009 status

**Opened:** 2026-09-15 · **Status: OPEN** · Found by an adversarial pass, not by me.

## The conflict, between same-level sources

| Source | States |
|---|---|
| `.jrs/state/BLOCKERS.json` B-009 `status` | `DISCLOSURE WRITTEN — NOT DEPLOYED; **RESTRICTED-SURFACE FONTS DECISION OPEN**`, and `new_finding_2026_09_15` ends **REQUIRES HUMAN DECISION** |
| `docs/enterprise-diligence/HUMAN_DECISIONS_REQUIRED.md` | `D-10 · Restricted surfaces load Google Fonts — **NEW, OPEN**` |
| `docs/enterprise-diligence/JRS_BOARD_OWNER_DECISION_REGISTER_2026-09-15.md` | `Decision: **ACCEPT AND DISCLOSE FOR NOW**` — recorded as decided |

CLAUDE.md §18 makes `.jrs/state/BLOCKERS.json` the authoritative control state. §5 requires a
contradiction record and a STOP when same-level sources conflict materially.

## How it got worse

`PRE_DEPLOYMENT_STATE_RECONSTRUCTION_2026-09-15.md` placed **B-009 and "D-10 to D-17" under
"Engineering completed"** and omitted both from the owner-action line. **That is an owner action
converted into engineering closure**, which is the specific thing the directive prohibits. The
earlier `PRE_GATE_1_READINESS_AUDIT` correctly listed "B-003 and B-009 publication" as OWNER
ACTION REQUIRED.

## Not resolved here

The owner did state a D-10 decision in an earlier directive ("Current decision: ACCEPT AND
DISCLOSE FOR NOW"), which is why the Board register records it as decided. Whether that
statement also disposes of the **restricted-surface** finding recorded in B-009 — which was
discovered *after* the Fonts decision was first stated — is **NOT ESTABLISHED**.

**Both records are preserved. Neither was edited to match the other.**

**OWNER ACTION:** confirm whether the Fonts decision covers the restricted surfaces, or whether
that remains open.
