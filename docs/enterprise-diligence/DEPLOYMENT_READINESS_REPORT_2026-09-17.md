# Deployment Readiness Report — 2026-09-17

Candidate `b16582f` · Production baseline `0d94ce6` · **223 files changed,
17,127 insertions, 446 deletions.**

This is the twelve-point pre-deployment check run against the **actual diff**, not
against a description of it. It supersedes earlier readiness records as to this
candidate; those remain as history.

---

## The twelve checks

| # | Check | Result |
|---|---|---|
| 1 | Production baseline inspected | `0d94ce6` |
| 2 | Candidate HEAD inspected | `b16582f` |
| 3 | Exact diff calculated | 223 files |
| 4 | **`openapi.json` untouched** | **NOT IN THE DIFF.** sha256 `b89e7fea…` unchanged. B-016 contract lock intact |
| 5 | Rights records unchanged | `JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md` and `EVIDENCE_LEDGER.md` — **no diff at all** |
| 6 | Research source records unchanged | The only `research/` change outside the two trackers is `build_participant_inventory.py`, a **builder**. Its output is verified **byte-identical** by the guard suite, so no research datum moved |
| 7 | Protected paths excluded | 22 rules. `lib/`, `tools/`, `tests/`, `schemas/`, `scripts/`, `.jrs/`, `research/`, `supabase/`, `*.sql` all present |
| 8 | Public paths remain reachable | **No `.html` deleted or renamed**, none added. The public surface is unchanged in shape |
| 9 | Tests | guards **offline 141/0/2, online 145/0/1**; retention **60/0**; projection **17/0**; auth **26/0**; manifest **68/0** |
| 10 | Rollback confirmed | **RE-TRIGGER, NEVER REVERT.** Production stays on the previous healthy build during a skip, so there is nothing to roll back. `.github/workflows/deploy-verify.yml` byte-compares production against the commit on every push to `main` |
| 11 | **No unauthorized database operation bundled** | `supabase-ALL.sql` is in the diff. **Every changed line is a SQL comment**; zero lines touch `grant`, `revoke`, `policy` or `to anon`. The file is also `*.sql`-excluded, and Vercel does not execute SQL. **No grant change ships with this candidate** |
| 12 | This report | — |

## What check 11 needed care about

A `.sql` file in a deployment diff is the shape of a bundled grant change, which
is the single thing §30 forbids most clearly. **It is not one here.** The change
is the BD-14 correction to a stale comment that asserted a control which does not
exist — "responses stay private", written above a policy further down the same
file that grants `select to anon`. Correcting a misleading comment is not a
database operation, and the check was run line by line rather than by file name.

## Two things this candidate does NOT contain

- **No grant revocation.** B-013 limb A and B-017 both require a production
  database operation that is **not in this diff and must not be**.
- **No contract change.** The B-016 correction is drafted and **carried unapplied**
  in the counsel packet.

## Vocabulary

**The conditional-authorization wording is retired.** The state machine has four
rungs and no conditional one between them. The two historical occurrences are
preserved with superseding notes and held in place by
`check_no_conditional_deployment_state`, which fails on any new use **and** fails
if either historical record is deleted rather than superseded.

**That guard fired on the first draft of this report**, which quoted the retired
phrase while explaining that it was retired. The phrase was reworded rather than
the report registered as an exception: **registration is for historical evidence
that must survive verbatim, and a document being written now can simply be phrased
better.** Registering every document that discusses the rule would hollow out the
rule.

---

## DETERMINATION

# DEPLOYMENT NOT READY

**Not because the candidate is defective.** Checks 1 through 11 pass, and on the
evidence above the diff is clean: no contract change, no rights change, no
research datum moved, no grant bundled, no public page lost.

**It is not ready because the prerequisite is unmet.** `B-001` — external
credential rotation — is open, and `B-006` sits behind it. The deployment cannot
proceed to the authorization gate until both are resolved, and **neither is
resolvable from inside this repository.**

When B-001 is confirmed and B-006 is dispositioned on evidence, this report is
re-run. If checks 1–11 still pass, the determination becomes
**DEPLOYMENT READY — AWAITING EXPLICIT OWNER AUTHORIZATION**, which is a different
statement and still not permission to deploy.

**STATE 1 — DEVELOPMENT REMEDIATION. DEPLOYMENT NOT AUTHORIZED.
PRODUCTION-VERIFIED CONTROLS: NONE.**

---

# RE-RUN — 2026-09-18, after the B-001 owner confirmation

Candidate `d8ed7d1` · Baseline `0d94ce6` · **224 files, 17,875 insertions, 446 deletions**

**B-001 is OWNER ACTION COMPLETED.** Rotation confirmed by the owner on 2026-09-18. No
credential value was requested, displayed, stored, hashed, tested or committed, and the old
credential is not reproduced or retained.

## What changed since the 2026-09-17 run

| # | Check | Result |
|---|---|---|
| 4 | `openapi.json` untouched | **NOT IN DIFF.** sha256 `b89e7fea…` unchanged |
| 5 | Rights records | **No diff** |
| 6 | Research source | Builder only; output byte-verified by the guard suite |
| 7 | Protected paths | All eight excluded |
| 8 | Public pages | **None removed or renamed** |
| 9 | Tests | guards **offline 143/0/2, online 147/0/1**; retention 60/0; projection 17/0; auth 26/0; manifest 68/0 |
| 11 | Database operations | `supabase-ALL.sql` matched **5** grant/policy lines this run against 0 last run. **Re-checked verbatim: all five begin `--`. Zero executable grant changes.** The earlier run filtered comments in the grep; this one did not, and the discrepancy was resolved by reading the lines rather than trusting either count |

## B-001 → B-006: the prerequisite cleared, the diagnostic did not run

**B-006 moves OPEN → DIAGNOSTIC READY.** It does **not** move to DIAGNOSTIC EXECUTED.

The procedure requires the rotated token **exported in Phillip's own shell** and states the
replacement must never enter this repository or any chat. Presence was checked here **without
reading any value**: not present, which is correct. **Rotating a credential in Vercel does not
place it here, and it must not.**

**The repository-side narrowing was attempted, as the standing rule requires.** Established:
`c08b48a` is present and merged 2026-09-13T11:50:03Z; **both controls arrived later**, in
`18dba0f` / PR #35, so neither existed on 13 September and neither could have observed the
incident. **Not established: whether Vercel created a deployment record for `c08b48a`** — the
one fact that separates the four candidate causes. The available GitHub tooling offers no
list-checks-for-ref capability, and the Vercel API needs the token. **NOT ESTABLISHABLE FROM
HERE**, recorded rather than resolved by selecting the most plausible cause, which the
procedure expressly forbids.

**One new observation, and it is time-sensitive.** The procedure records that retention ageing
out the 13 September records is itself an inconclusive outcome. **Five days have passed.** The
evidentiary window is narrowing. Severity describes the consequence of the failure; it does not
describe the decay rate of the evidence about it.

## DETERMINATION

# DEPLOYMENT NOT READY

**The candidate is clean and checks 1–11 pass.** B-001 is no longer the reason.

**The reason is B-006.** Its stated prerequisite is satisfied and its diagnostic is unexecuted,
so it is neither resolved nor properly dispositioned — and a disposition of
*NOT ESTABLISHED — FAILURE MODE CONTROLLED* is available **only after the diagnostic runs and
returns inconclusive evidence**, not instead of running it.

**This is one command, not a workstream.**

**STATE 1 — DEVELOPMENT REMEDIATION. DEPLOYMENT NOT AUTHORIZED.
PRODUCTION-VERIFIED CONTROLS: NONE.**
