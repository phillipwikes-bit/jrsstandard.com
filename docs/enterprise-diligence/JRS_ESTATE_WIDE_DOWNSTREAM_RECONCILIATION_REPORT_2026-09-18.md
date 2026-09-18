# JRS Estate-Wide Downstream Dependency Reconciliation — 2026-09-18

> **SCOPE SUPERSEDED THE SAME DAY — READ THIS FIRST.**
> This report reconciled a **25-record scope** and said so in terms. A second cycle on
> 2026-09-18 performed **repository-wide discovery** and established the estate at **294
> records**: this scope was **8.5%** of it, and eight material findings lay outside it —
> including all three conditions of the live gate file being stale and an owner queue asking
> for a safety fix that had already shipped.
>
> **Everything in this report remains accurate about what it examined.** Its conclusion —
> *synchronization complete on the stated scope* — was correctly bounded and is not withdrawn.
> **It is simply not a statement about the estate.**
>
> The current statement is
> **`JRS_ESTATE_DISCOVERY_COMPLETENESS_REPORT_2026-09-18.md`**, with the method and
> classification at Part II of `JRS_ESTATE_WIDE_SYNCHRONIZATION_MATRIX_2026-09-18.md`.

**Task.** Prove, rather than assume, that the authoritative-state corrections of 2026-09-18
propagated through the entire downstream dependency estate.

**Mode.** Autonomous execution under the JRS Enterprise Asset Orchestrator.
**Phase.** Pre-Gate-1. **Gate.** Gate 1, not reached.

---

## Objective

A correction is recorded in one place. The estate has many places. The question this cycle
asked is not "was the correction made" but **"did it reach everything that depended on it"** —
and the answer had to be produced by an instrument, not by recollection.

## Current state at the start of this cycle

Seven authoritative corrections were on record: E-029 through E-036, plus the X-15 closure.
Six downstream corrections had already been applied earlier in the cycle. **Nothing had swept
the estate to see what else still carried the old state.**

## Evidence inspected

25 current-state records: `BLOCKERS.json`, the human decisions register, the question
resolution matrix, the counsel packet, the board decision register, the dependency graph, the
owner resolution batch, the Master Register, the Evidence Ledger, the chain-of-title status,
the phase-0 closure determination, the pre-Gate-1 readiness audit, the deployment readiness
report, the continuity index, the next-steps instructions, the missing-evidence register, the
owner questionnaire, the rights-evidence gap memo, the gate remediation report, two gate
reports, and four registries.

---

## Factual findings

**FINDING 1 — THE FIRST SWEEP WAS WRONG, AND IT WAS WRONG IN THE DANGEROUS DIRECTION.**
It classified each occurrence by whether a superseding marker appeared within a 600-character
**window**. Three live stale claims sat within 300 characters of an unrelated `CLOSED` or
`OWNER-CONFIRMED` marker belonging to a different sentence, and all three were reported clean.
**They were found by hand.** Proximity is not scope.

**FINDING 2 — SIX RECORDS TOLD THE READER TO WAIT FOR SOMETHING THAT HAD ALREADY HAPPENED.**
Production operations were described as "queued behind B-001" in the blocker registry, two
board records, the dependency graph, the question matrix and the readiness audit. B-001 closed
on 2026-09-18. **None of those six used the word OPEN**, so no status-word search could see
them. A queue that names a closed blocker is how a queue stops being believed.

**FINDING 3 — THE DEPENDENCY GRAPH'S ROOT NODE HAD CLOSED.** Both calculations in that
document placed B-001 at the head of the critical path. Correcting individual edges would have
left the document's central claim false. A controlling recalculation was added and the earlier
calculations stamped historical.

**FINDING 4 — TWO REVISIONS OF THE READINESS AUDIT EACH SAID "THIS REVISION CONTROLS."**
Both cannot. The earlier was stamped superseded.

**FINDING 5 — A BOARD DECISION WAS CORRECTED AS TO ONE LIMB ONLY.** BD-01 recorded two
residual questions. E-031 answers the de-identification limb. **It does not reach the
readability-disclosure limb**, which asks whether submitters were told their rows would be
anonymously readable, and no attestation addresses that. The record now says so explicitly.
**One limb answered is not the question answered.**

**FINDING 6 — A GUARD COULD BE DELETED FROM THE CALL LIST AND THE SUITE WOULD STAY GREEN.**
The architecture baseline counted guard *definitions*. Removing one name from the dispatch
tuple left the definition in place, the count unchanged, and the control gone.

**FINDING 7 — TWO NAMED PROPOSITIONS HAD NO STANDING CONTROL.** Reopening `CT-SEC-2.1` in the
structured rights register, and un-striking the chain-of-title section that predates E-036,
both produced a fully passing suite.

**FINDING 8 — THE NEGATION TEST INSIDE THE STANDING GUARD WAS ITSELF WINDOW-SCOPED.** A
demonstration suite defeated it twice in one run: "was expressly REJECTED rather than taken"
and "That is no longer true", each two sentences away, excused live claims. **This is the
third place in that one guard where proximity had been standing in for scope.**

---

## Changes made

**Sixteen downstream corrections**, itemised in
`JRS_ESTATE_WIDE_SYNCHRONIZATION_MATRIX_2026-09-18.md` §2. Every superseded wording is
**struck through and retained**, or, in JSON where a strikethrough cannot exist, **quoted as
prior text**. Nothing was deleted.

**Six standing controls added or corrected**, matrix §4.

**One new repository script**, `scripts/estate_state_sweep.py`, so the conclusion below can be
re-derived rather than believed.

---

## Tests

**Twelve-case mutation suite** — `APPLIED` verified by byte comparison on every case, restored
by explicit saved-byte comparison, never by `git checkout`.

| Result | Count |
|---|---|
| Cases run | 12 |
| `APPLIED = YES` | 12 |
| `PASS` | **12** |
| Post-suite state identical to baseline | **yes**, both detectors |

**Six-site demonstration** of the new dependency proposition: **6 of 6 fired**, baseline clean
afterwards.

**Guard suite:** **152 checks, 0 failed, 1 skipped.** 123 guards defined, **all 123
dispatched**.

**Sweep, final:** 25 records, 87 occurrences — **36 historical, 46 no assertion in unit,
5 flagged**. All five triaged as false positives in matrix §3.

---

## Results

**ESTATE-WIDE SYNCHRONIZATION COMPLETE, on the scope defined above.**

The statement this cycle was asked to reach — *no material stale current-state representation
remains* — **is supported**, and it is supported on the corrected sweep, not the first one.
The scope is the ten propositions and twenty-five records listed; the claim does not extend
past them.

## Rights / IP impact

**None created.** No ownership, assignment or licence is asserted in any direction. The Ubayet
row now carries E-034 and states, in the same breath, that **absence of a prohibition is not a
grant** and that the "Not located" cells are unchanged. Section 2.1's closure preserves
V-AI-08's separate panel participation.

## Security / privacy impact

**None.** No credential was requested, displayed, stored, tested, reconstructed or committed.
No production operation was performed. No database row was read or altered.

## Regulatory impact

None. No compliance conclusion is drawn.

## Commercial impact

None. No claim was added to any surface.

## Unresolved issues

- The **readability-disclosure limb** of BD-01 is open and is not treated as closed.
- Five sweep flags are triaged as false positives and are re-triaged on each run by a person.
- The sweep's scope is 25 records. It is not the whole repository.

## Blockers

**No new blocker.** B-004, B-007/D-1, B-016 and V-4(3) remain counsel matters, untouched.
B-006 is DIAGNOSTIC READY and unexecuted. B-014 is live on production and closes on deployment.

## Human approval required

**Deployment authorization.** It now stands alone at the head of the critical path, with no
blocker above it. **This report does not request it and does not advance it.**

The **production control-plane operations** — the B-013 limb A and B-017 revocations — queue
behind nothing and remain unperformed owner actions.

## Gate impact

**None. Gate 1 is not reached.** The estate is better synchronized; it is not readier.
A shorter dependency graph is the same state with one fewer person to wait for.

## Next action

Owner decision on deployment authorization. Nothing in this repository advances it.
