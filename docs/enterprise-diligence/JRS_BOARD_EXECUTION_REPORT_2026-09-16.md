# JRS Board Execution Report — 2026-09-16

## JRS BOARD DETERMINATION

**STATE 1 — DEVELOPMENT REMEDIATION. DEPLOYMENT NOT READY. NOT READY FOR GATE 1
RECONSIDERATION. PHASE II LOCKED.**

Three Board decisions moved from **DECIDED** to **IMPLEMENTED → TESTED** this cycle. **None
moved to PRODUCTION VERIFIED, and none could.**

## ARCHITECTURAL BASIS

The authorized architecture is unchanged: methodology public, implementation controlled, record
text transmitted but not stored, model-written output about a record stored and disclosed,
human review required. This cycle built the **replacement read path** that lets the
`engine_reviews` grant be revoked without breaking a public surface, and a **retention policy**
for the one table that had none.

## EVIDENCE BASIS

**KNOWN FACTS.** `openapi.json` sha256 **identical before and after** this cycle. Guards
**offline 131/0/2 · online 135/0/1**. Engine suites: **auth-matrix 18/0 · activity-projection
17/0 · retention 15/0 · manifest 68/0**. Production `0d94ce6`, unchanged.

**INFERENCES.** None material this cycle.

**BOARD DECISIONS IMPLEMENTED.** BD-02 read path · BD-03 retention · BD-07 presentation ·
BD-04 mapping declaration.

**NOT ESTABLISHED.** Whether contributors were told stored rows are readable (S-1 adjacent);
whether de-identification review ran on all 54 rows (**S-1**); whether anyone received the
superseded figure (**S-6**).

## QUESTION RESOLUTION

| Item | Transition |
|---|---|
| B-013A | BOARD DECIDED → **IMPLEMENTED → TESTED**. Grant revocation **not performed** |
| B-013C | BOARD DECIDED → **IMPLEMENTED → TESTED**. Deletion **not performed**; first run is a no-op |
| D-18 | BOARD DECIDED → **IMPLEMENTED** on six surfaces; Study 001 badge Active → **Closed 21 Aug 2026** |
| D-3 | BOARD DECIDED → **recorded in the mapping control**. `openapi.json` untouched |
| B-001, B-006 | **OWNER EXTERNAL ACTION REQUIRED**, unchanged |
| B-004, B-007/D-1 | **COUNSEL REVIEW REQUIRED**, unchanged |
| S-1, S-6 | **OWNER FACTUAL CONFIRMATION REQUIRED**, unchanged |
| D-2 | **INTENTIONALLY UNRESOLVED**, unchanged |

## EXPERT BOARD ANALYSIS

**Security.** The replacement endpoint reads with the service role, so revoking anonymous
SELECT will not break it — that is the ship-together rule made real. It drops every free-text
field **twice**: absent from the select list, and dropped again in the projection, because one
of those is a string someone could edit.

**Privacy.** `compliant_version` no longer has a public render path anywhere. Timestamps are
truncated to the hour, because an exact timestamp on a low-volume endpoint is a correlation
handle back to a submission.

**Research integrity.** **No source record was altered.** Six presentation surfaces now carry
the distribution rather than a single run, and `enterprise.html`'s "86.7% page depth" was
**left alone** because it is scroll telemetry, not the study figure — checked in context rather
than replaced by pattern.

**API.** Untouched, and verified untouched by hash.

## RISKS / GAPS

1. **B-014's exposures remain live on production** until a deployment.
2. **The `engine_reviews` grant is still open.** The decision and the replacement exist; the
   revocation is a production operation.
3. **Retention is policy, not practice.** Nothing has been deleted.
4. **Nothing is PRODUCTION VERIFIED.**

## DECISION

# DEPLOYMENT NOT READY · NOT READY FOR GATE 1 RECONSIDERATION

## REQUIRED ACTION

**Rotate the Vercel credential externally and confirm in one line.**

## STOP CONDITIONS

External action (B-001, B-006) · legal judgment (B-004, B-007/D-1) · personal knowledge (S-1,
S-6) · production verification (eleven controls) · production authorization.

## RECORDING REQUIREMENT

`BLOCKERS.json` · `OUTBOUND_DESTINATIONS.json` · `METHODOLOGY_TO_API_MAPPING.md` · Board
Decision Register · Dependency Graph · Second-Order Audit · `MASTER_TRACKER.md`.

## STATUS

**STATE 1 — DEVELOPMENT REMEDIATION.**
