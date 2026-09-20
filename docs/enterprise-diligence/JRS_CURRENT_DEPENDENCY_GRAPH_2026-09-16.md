# JRS Dependency Graph — 2026-09-16

> **HISTORICAL FROM HERE TO THE LAST SECTION, 2026-09-18.** The controlling calculation is
> **RECALCULATED — 2026-09-18** at the end of this document. Both calculations below place
> **B-001 at the root of the graph**, and B-001 closed on 2026-09-18 (E-030). They are retained
> because a superseded graph is evidence of how the dependencies were understood; they do not
> state current state.

**Resolving one blocker does not resolve those below it. Each edge is a prerequisite, not a
cascade.**

```
B-001  external credential rotation          [OWNER EXTERNAL ACTION]
  |
  +--> B-006  silent-skip root cause         [needs the rotated credential]
  |       |
  |       +--> deployment readiness          [one of seven prerequisites]
  |
  +--> B-014  .sql + supabase/ exposure      [remediated in config; LIVE on production
  |                                           until a deployment occurs]
  +--> B-005 / B-008 / B-009 / B-015         [remediated; production verification]
  +--> D-11 / D-13 / D-14 / D-15 / D-16 / D-17

B-013A  engine_reviews grant     [BOARD DECIDED -> production grant change]
B-013C  telemetry retention      [BOARD DECIDED -> production data operation]
  |
  +--> security / privacy readiness          [both, not either]

B-013B  contributor scope        [risk DOWNGRADED on new evidence]
  |
  +--> residual owner confirmation -> (conditional) counsel

B-004   rights                   [COUNSEL] --> commercial / transfer position
B-007 / D-1  published contract  [COUNSEL] --> API contract action
D-3     Codebook mapping         [3 of 4 BOARD DECIDED] --> API reconciliation option D
  |
  +--> D-2 cold_reviewer_clarity  [INTENTIONALLY UNRESOLVED — blocks nothing, and is
                                   the reason option D cannot proceed]

D-12    verify-drift             [BOARD DECIDED -> IMPLEMENTED] --> architectural coherence
D-18    STUDY-001 presentation   [BD-07 DECIDED -> wording CORRECTED 2026-09-20 ->
                                 BOARD RATIFICATION OPEN] --> research integrity
D-3     [CLOSED 2026-09-20 on BD-04; it was decided 2026-09-16 and this graph
         already said so while the owner queue went on asking]
```

## What each edge actually means

**B-001 → B-006.** The diagnostic cannot run without a credential. **Hard.**

**B-001 → B-014.** Not logical but operational: the exposures are closed in configuration and
**live on production until a deployment**, and ~~deployment waits on B-001. **This is the edge
that makes B-001 urgent rather than merely first.**~~ **EDGE REMOVED 2026-09-18 (E-030):**
deployment waits on **owner authorization**. B-014 is still live on production, so the urgency
is unchanged — only the name of what it waits for.

**B-001 → production verification of nine controls.** None can be VERIFIED without deployment.

**B-013A and B-013C → readiness.** Both are Board-decided and **both stop at the production
boundary**. A decision is not an implementation.

**D-3 → API option D.** Option D requires emitting `Needs work`, which appears nowhere in the
Codebook. Three mappings are now declared; **the fourth is D-2 and is not the Board's to
invent**, so option D still cannot proceed.

**D-2 blocks nothing on its own.** It is the reason a *different* option is blocked, which is a
different thing from being a blocker.

**B-004 and B-007/D-1 do not block deployment.** Neither touches a deployable file. They block
the commercial and contract positions.

## Critical path to a readiness determination

**B-001 → B-006 → (B-013A, B-013C implementations) → deployment authorization → production
verification → B-014, B-005, B-008, B-009, B-015, D-11, D-13, D-14, D-15, D-16, D-17 close.**

**B-004 and B-007/D-1 run in parallel and gate nothing on this path.**

---

# RECALCULATED — 2026-09-16, after BD-02 and BD-03 were implemented

**What changed in the graph, and what did not.**

```
B-001  external credential rotation          [OWNER EXTERNAL ACTION]
  |
  +--> B-006                                 [unchanged, hard]
  +--> B-014 production verification         [unchanged; exposures LIVE until deployed]
  +--> production verification of 11 controls
  |
  +--> B-013A GRANT REVOCATION               [NEW EDGE]
          ^
          |  the replacement read path now EXISTS, so revocation no longer
          |  breaks a public surface. The blocker moved from
          |  "needs an architecture" to "needs a deployment".
```

~~**EDGE ADDED.** `B-001 → B-013A revocation`. Before this cycle B-013A was blocked on *design*:
revoking the grant would have broken `engine-activity.html`. That is no longer true. It is now
blocked only on deployment, which is behind B-001.~~

> **EDGE REMOVED 2026-09-18.** `B-001 → B-013 limb A revocation` **no longer exists**: B-001 is
> **CLOSED** (E-030, owner attestation). The design blocker was already gone. What remains is
> **not a dependency on another blocker at all** — it is an **unperformed owner action in the
> production control plane**, which no repository state can satisfy, perform or verify.

**EDGE REMOVED.** `B-013A → engine-activity.html breakage`. The ship-together rule is satisfied
in the development tree.

**EDGE UNCHANGED.** `B-013C → production data operation`. The retention policy exists and is
tested; nothing has been deleted, and the first run would delete nothing.

**NEW NODE.** `T-4 engine_reviews retention` — created by this cycle, gated on nothing, and
decidable by the Board next cycle. **It does not block anything**, which is exactly why it
would be easy to lose.

**Still true, and worth restating because the graph now looks shorter:** resolving B-001 does
**not** resolve B-013A, B-014 or any production verification. It *unblocks* them. Each still
requires its own deployment and its own probe.

**Critical path unchanged:**
`B-001 → deployment authorization → production verification → eleven closures.`
**B-004 and B-007/D-1 remain parallel and gate nothing on it.**

---

# RECALCULATED — 2026-09-18, after B-001 closed. THIS SECTION CONTROLS.

**Everything above is historical.** Both earlier calculations put **B-001 at the root**, and
that root is gone: the owner completed the external credential rotation and attested to it on
2026-09-18 (**E-030**). A graph whose head node has closed does not describe the estate, and it
misdirects the reader to wait for something that has already happened.

## What the closure of B-001 did and did not do

**IT REMOVED A NODE. IT RESOLVED NOTHING BELOW IT.** The sentence preserved above — *resolving
B-001 does not resolve B-013A, B-014 or any production verification; it unblocks them* — is
still the correct reading, and it is now the whole story rather than a caveat.

## The graph as it now stands

```
OWNER DEPLOYMENT AUTHORIZATION            [NOT GIVEN - the state machine reads
  |                                        DEVELOPMENT REMEDIATION]
  +--> deployment
         |
         +--> B-014  .sql + supabase/ exposure   [LIVE on production right now,
         |                                        closes only on a deployment]
         +--> production verification of the remediated controls
                +--> B-005 / B-008 / B-009 / B-015 / D-11 / D-13 / D-14 / D-15 / D-16 / D-17

PRODUCTION CONTROL-PLANE OPERATIONS       [QUEUE BEHIND NOTHING. Unperformed owner
  +--> B-013 limb A  engine_reviews grant  actions. No repository state can perform,
  +--> B-017         finding_responses     satisfy or verify any of them]

B-006  silent-skip root cause             [DIAGNOSTIC READY, NOT EXECUTED. Its stated
                                           prerequisite is satisfied. It gates nothing:
                                           the failure mode is prevented and detected
                                           regardless of cause]

B-002 · B-004 · B-007/D-1 · B-016 · V-4(3)  [COUNSEL. Parallel. Gate nothing on this path.
                                           B-002 added 2026-09-18: it is subsumed by B-007
                                           and routes to counsel with it]
```

## Critical path

`OWNER DEPLOYMENT AUTHORIZATION → deployment → production verification → eleven closures.`

**There is no blocker at the head of that path.** What stands there is a decision the owner has
not made, and no amount of repository work advances it.

## The edges that were removed

| Edge | Why it is gone |
|---|---|
| `B-001 → B-006` | B-001 closed (E-030). B-006's prerequisite is satisfied; it moved OPEN → DIAGNOSTIC READY and was not executed, because the replacement credential lives in the owner's own shell and must never enter this repository |
| `B-001 → B-014` | B-014 closes on deployment. Deployment now waits on **authorization**, not on B-001 |
| `B-001 → production verification` | Same. The dependency was always on deployment; B-001 was merely upstream of it |
| `B-001 → B-013 limb A revocation` | Removed 2026-09-18, recorded in place above |

## What this section does NOT establish

**It does not make anything readier.** Nothing is production verified, the counsel matters are
untouched, and B-014 is still live on production. **A shorter graph is not a better state** —
it is the same state with one fewer person to wait for.
