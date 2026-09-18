# Final Pre-Gate-1 Readiness Audit — 2026-09-16 (superseding the earlier version of this date)

# NOT READY FOR GATE 1 RECONSIDERATION.

**The earlier version of this audit, written before BD-02 and BD-03 were implemented, is
superseded. It is retained in git history; its conclusion is unchanged.**

---

## Authoritative state

**STATE 1 — DEVELOPMENT REMEDIATION** · Production `0d94ce6`, unchanged · **DEPLOYMENT NOT
AUTHORIZED** · **PHASE II LOCKED**.

## Blockers, by proper transition state

| State | Items |
|---|---|
| ~~**OPEN — OWNER EXTERNAL ACTION**~~ **SUPERSEDED 2026-09-18** | ~~B-001, B-006~~ **B-001 OWNER-CONFIRMED (E-030); B-006 DIAGNOSTIC READY** |
| **OPEN — COUNSEL** | B-004, B-007/D-1 |
| **BOARD DECIDED → IMPLEMENTED → TESTED** | B-013A read path, B-013C retention, D-12, D-18, F-8 |
| **BOARD DECIDED** (no implementation possible here) | B-013A revocation, D-3, D-10/BD-05 |
| **REMEDIATED — PRODUCTION VERIFICATION REQUIRED** | B-005, B-008, B-009, B-014, B-015, D-11, D-13, D-14, D-15, D-16, D-17 |
| **OWNER FACTUAL CONFIRMATION** | B-013B residual, S-1, S-6, T-6 |
| **INTENTIONALLY UNRESOLVED** | D-2 |
| **OPEN — BOARD DECISION REQUIRED NEXT CYCLE** | **T-4** (`engine_reviews` retention) |
| **CLOSED** | B-010, B-011, B-012 |
| **PRODUCTION VERIFIED** | **None** |

## Assessment against each required dimension

| Dimension | Finding |
|---|---|
| **Production verification** | **None exists.** Eleven controls await a deployment |
| **Contradictions** | CONTRADICTION_002 **resolved as to the decision** (BD-05), record **retained**. CONTRADICTION_001 unchanged |
| **Research integrity** | **No source record altered.** Presentation corrected on six surfaces; superseded figures preserved in the audit trail |
| **Rights** | **Unchanged.** No Level A instrument. Counsel |
| **Privacy** | Improved: `compliant_version` now has **zero render paths**; retention policy adopted for the one table that had none |
| **Security** | Improved: unauthenticated persistence closed in code (B-015); service-role read replaces a public table read |
| **API** | **`openapi.json` sha256 identical.** Verified this cycle |
| **Manifest** | 68/0. Oracle independent |
| **Public/private** | New artifacts classified correctly; `api/` verified executed not served (405 on `review.js`) |
| **Testing** | **offline 131/0/2 · online 135/0/1 · auth 18/0 · projection 17/0 · retention 15/0 · manifest 68/0** |
| **Red team** | Round B produced **10 second-order questions**; one (**T-4**) is a genuine new open item |
| **Deployment diff** | Reviewed; now includes one new Edge Function |
| **Rollback** | Re-trigger, never revert. Unchanged |

## Why not ready

1. **B-001 external.** Unchanged.
2. **Nothing PRODUCTION VERIFIED.** Structural.
3. **Two counsel matters.**
4. **Four owner facts** (B-013B residual, S-1, S-6, T-6).
5. **T-4 is newly open** — created by this cycle's own decisions.

**Point 5 is the honest reason this audit does not read better than the last one.** The work
closed design questions and opened a new one. That is what building things does, and pretending
otherwise would be the failure this framework exists to prevent.

---

# REVISION 2 — 2026-09-16, after BD-10 and BD-11

> **HISTORICAL 2026-09-18.** This revision is superseded by **Round G**, the last revision in this document, which controls. Nothing under this heading states current state. It is retained because deleting a superseded assessment destroys the evidence of what was believed when.


**The prior revision is preserved in git history. Its conclusion is unchanged.**

## What this revision adds

| Item | Change |
|---|---|
| **T-4** | **No longer open.** BD-10: field-level retention on `engine_reviews`, 90 days, record-derived fields nulled in place, row retained. **DECIDED → IMPLEMENTED → TESTED** |
| **T-11** | **New, found while deciding T-4.** `research-data.html` exported `engine_reviews` with `select=*`, returning the notes and the rewrite. **BD-11: narrowed. DECIDED → IMPLEMENTED → TESTED** |
| **U-3** | **New and open.** BD-10 set a retention period; the public disclosure does not state it |
| Guards | **offline 132/0/2 · online 136/0/1** (one new guard, six mutations) |
| Retention suite | 15 → **38 checks, 0 failed** |

## Why the conclusion is unchanged

The two decisions closed one open question and opened another, and **neither touches a single
deployment prerequisite.** B-001 is still external. Nothing is production verified. The counsel
matters are untouched. Four owner facts remain.

**BD-10 and BD-11 made the estate safer without making it readier**, and those are different
properties.

# NOT READY FOR GATE 1 RECONSIDERATION.

---

# REVISION 3 — 2026-09-16, after BD-12

> **HISTORICAL 2026-09-18.** This revision is superseded by **Round G**, the last revision in this document, which controls. Nothing under this heading states current state. It is retained because deleting a superseded assessment destroys the evidence of what was believed when.


**Revisions 1 and 2 are preserved in git history. The conclusion is unchanged.**

| Item | Change |
|---|---|
| **U-3** | **CLOSED.** BD-12: the 90-day period is disclosed **by category** on `security.html` and `privacy.html`. DECIDED → IMPLEMENTED → TESTED |
| **V-1 to V-10** | Round D. Eight answered; **V-4 and V-9 open, both low, both legal-adjacent** |
| Guards | **offline 133/0/2 · online 137/0/1**. One new guard; four mutations |
| Disclosure red team | Ten possible misreadings tested; **all clear** |

## Why the conclusion is unchanged, stated precisely

BD-12 corrected a **representation gap that this project's own decision created**. It closed
U-3 and opened V-4 and V-9.

**It did not touch a single deployment prerequisite.** B-001 is external. Nothing is production
verified. Counsel matters untouched. Four owner facts remain.

**V-10 is the sharpest reminder available:** production still serves text with no period, while
a period is in force in policy. ~~**That gap closes on deployment, and deployment waits on
B-001.**~~ **CORRECTED 2026-09-18:** that gap closes on deployment, and **deployment waits on
owner authorization** — B-001 is **CLOSED** (E-030).

# NOT READY FOR GATE 1 RECONSIDERATION.

---

# REVISION — Round E and Round F, 2026-09-16

~~Prior revisions above are **historical and unchanged**. This revision controls.~~

> **SUPERSEDED 2026-09-18.** This revision was later superseded by **Round G** below, which
> carries the same sentence. **Two revisions cannot both control**, and this one no longer
> does. Everything under this heading is **historical**; the controlling revision is the last
> one in this document. Corrections stamped 2026-09-18 inside this section were applied
> before the conflict was noticed and are harmless — a corrected historical claim is still
> historical.

## What changed since the last revision

| Area | Change |
|---|---|
| U-3 / BD-12 | Unchanged as a decision. **Its implementation was found defective and corrected** — see BD-13 |
| **BD-13** | NEW. The enforced retention period (3 calendar months, 89–92 days) was not the disclosed period (90 days). Unit corrected to days. DECIDED → IMPLEMENTED → TESTED |
| BD-10 | Decision intact and verified field by field. Unit corrected by BD-13 |
| BD-11 | Verified. `research-data.html` projection excludes every derived column |
| Projection boundary | **Defect found and closed.** The two public read paths were not enforcing the same rule; both are now allow-listed and a future schema column is refused by default |
| Privacy disclosure | Now accurate as **implemented** as well as as drafted |
| Public/private boundary | Probed again. Nothing from this or the last cycle is served. **Three files remain live on production under B-014** and close on deployment |
| Service-role security | Re-audited. Zero JWT-shaped strings on disk; absent credential fails closed at 503 disclosing nothing |
| API integrity | `openapi.json` sha256 **identical**. **B-016 open and blocked on authorization** |
| Research integrity | No source record, run or figure changed |
| Rights | No new assertion created. B-004 remains counsel-controlled |
| Counsel matters | B-004, B-007/D-1, and V-4 component 3 (one sentence) |
| Owner matters | B-001, B-013B, S-1, S-6, T-6 |
| Question matrix | V-4, V-9, V-10, V-11, B-016, W-1 … W-5 recorded |
| Dependency graph | One edge added: `BD-13 → BD-12 disclosure accuracy` |
| Red team | Round E ten attacks; Round F ran directed mutation tests instead, and two of them found live defects |
| Deployment candidate | Unchanged in shape; ~~**four production operations still queue behind B-001**, now five with B-014~~ **CORRECTED 2026-09-18:** B-001 is **CLOSED** (E-030). The production operations **queue behind nothing** — they are unperformed owner actions in the production control plane, which no repository state can satisfy or verify |
| Rollback | Unchanged. Every change this cycle is a constant, a function or a guard, all reversible |

## Why the conclusion does not improve

Two decisions certified by their own test suites were found wrong by a pass that
went looking rather than re-reading:

1. a retention period published to readers that the code did not enforce, held in
   place by a guard whose unit conversion was an assumption; and
2. a drift guard that exempted the one page it existed to cover, because that page
   named the decision in its own comment.

Both are closed, and the estate is better for it. Neither had anything to do with
the obstacles that actually gate Gate 1, all of which are unchanged:

* **B-001** — owner external credential rotation. Every production verification is
  downstream of it.
* **Production-verified controls: NONE.**
* **B-016** — the published API contract still contradicts the code, and correcting
  it requires authorization this Board does not hold.
* **B-014** — three files still served on production.
* Counsel matters open. Owner factual matters open.

# NOT READY FOR GATE 1 RECONSIDERATION.

**STATE 1 — DEVELOPMENT REMEDIATION. DEPLOYMENT NOT AUTHORIZED. PHASE II LOCKED.**

---

# REVISION — Round G, autonomous execution cycle, 2026-09-16

Prior revisions are **historical and unchanged**. This revision controls.

## What this cycle did

The previous cycle produced an instruction set naming four unblocked items. This
cycle **executed them** rather than reporting on them. Four defects were found,
three of them in checks that were passing.

| Item | Outcome |
|---|---|
| **Guard-integrity sweep** | **Three defects.** A page-wide containment test passed a fresh "RFC 8785 compliant" claim (third proximity miss); the dead BD-11/BD-02 suppressor was still beside the new allow-list; and the manifest truncation cap was a third independent declaration of a number the two engine routes also carry, with nothing tying them |
| **Anon-readable table sweep** | **B-017 / BD-14.** A promise of privacy made at the point of collection contradicted by an anon SELECT grant and a published `select=*` export |
| **V-11** | **BD-15. Decided**, not recorded a third time. Both 401 branches unified |
| **D-3** | **Not reopened** — prior disposition stands. But **nothing tied the authoritative mapping to the code**, and now something does |

## The one that would have mattered most

If the engine truncation cap and `ENGINE_TRUNCATION_LIMIT` diverged, the manifest
would record `truncated: false` and omit `source_hash` for a record the engine had
truncated — **asserting that the evaluation covered text the model never
received.** That is verbatim the failure `lib/manifest/hash.js` states its design
exists to prevent, in the artifact whose entire purpose is reconstruction
integrity. Nothing was checking it.

## Testing

| Suite | Mode | Result |
|---|---|---|
| Guards | offline | **137 / 0 / 2 skipped** (was 134) |
| Guards | online | **141 / 0 / 1 skipped** (was 138) |
| Retention | dev | 60 / 0 |
| Projection | dev | 17 / 0 |
| Auth matrix | dev | **26 / 0** (was 18) |
| Manifest | dev | 68 / 0 |

Four new guards, **fourteen mutations demonstrated failing** against the pre-fix
state. Files restored by byte comparison throughout.

## Why the conclusion still does not improve

Every deployment prerequisite is untouched, and ~~**B-017 adds a sixth item to the
production queue behind B-001**~~ **CORRECTED 2026-09-18:** B-017 adds a sixth item to the
**production queue, which queues behind nothing**. B-001 is **CLOSED** (E-030); every item in
that queue is an unperformed owner action in the production control plane. `openapi.json`
sha256 identical; B-016 remains with counsel.

A production read was attempted, to establish whether any `finding_responses` rows
are anonymously retrievable, and was **correctly denied** by the environment's
production-read control. That count is **NOT ESTABLISHED** and is not inferred.

# NOT READY FOR GATE 1 RECONSIDERATION.

**STATE 1 — DEVELOPMENT REMEDIATION. DEPLOYMENT NOT AUTHORIZED. PHASE II LOCKED.**
