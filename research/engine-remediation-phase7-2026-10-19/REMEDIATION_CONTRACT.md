# Phase 7 Remediation Contract (frozen before candidate logic)

**LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.**

This contract was written, and hashed into `SEAL.json`, before any rule logic was edited in `lib/engine-evidence-graph-v0.3.1-candidate/`. At that point the candidate directory was a byte-identical copy of frozen v0.3 plus six rule-pack data files.

Phase 7 evaluates only local, deterministic behaviour on synthetic material. It establishes nothing about accuracy, semantic validity, real records, independent evaluation, release or deployment. `NO_GO_NOT_VERIFIED` is unchanged.

## Candidate

| Item | Value |
|---|---|
| Candidate | `lib/engine-evidence-graph-v0.3.1-candidate/`, compiler version `0.3.1-candidate` |
| Base | frozen v0.3 `lib/engine-evidence-graph/`, compiler version `0.3.0-local` (unchanged, byte-comparable) |
| Contract and prompt versions | unchanged (`jrs-engine-local-0.3.0-evidence-graph`, `jrs-engine-local-0.3.0/prompt-1`); the quote-only response contract is the same |
| Version mapping | For candidate runs only, a submission declaring compiler `0.3.0-local` is presented as `0.3.1-candidate`. Any other declared value is left as it is, so version-mismatch fixtures still mismatch. |
| Release status | `NO_GO_NOT_VERIFIED` |

## Core safety rule

When the candidate cannot establish a direct, bounded link between record text and a condition-level conclusion, it returns `review_required`, `not_assessed` or a refusal. No rule raises a status. Text presence remains distinct from semantic support.

## Intended behaviour by defect

| Defect | Rule | Intended behaviour | Non-goal |
|---|---|---|---|
| P6-RT-07 compiler self-validation failure on motive notes | RP-STR-01 | The note is withheld (`assertion_rejected`) and the affected condition is routed to review. The compiler never fails on these notes. | Not a general error handler; other untested inference labels are not covered. |
| P6K-003 assessment after decision | RP-CHR-01 | Conflict `assessment_after_decision`; chronology review_required | Not a calendar or workflow model; only "risk assessment" events outside action sections. |
| P6K-004 two expiry dates | RP-CHR-02 | Conflict `expiry_date_conflict`; chronology review_required | Does not choose an expiry date. |
| P6K-005 missing decision date | RP-CHR-03 | Visible gap `no_dated_decision`; chronology review_required | Does not infer a decision date from other dates. |
| P6K-006 duration inconsistent with dates | RP-CHR-04 | Conflict `duration_date_conflict` when "for N days" differs from the decision-to-expiry interval by more than one day; chronology review_required | Months, weeks and business days are not read. |
| P6K-002 negated rationale | RP-NEG-01 | Reasoning review_required unless a separate non-negated rationale or source reference is cited | No general negation or sentiment analysis. |
| P6K-001 quotation unrelated to condition | RP-EVL-01 | Supported identifiable basis, chronology or reasoning needs at least one cited quotation from a linked section; otherwise review_required | Section linkage is not semantic support; nothing is ever raised by this rule. |
| P6K-007 paraphrased control conflict | RP-CON-01 | Conflict `control_state_conflict` for the "review of access logs" family | One paraphrase family only. |
| P6K-008 reworded employment language | RP-SCO-01 | Refused at intake as excluded employment content | Contract non-renewal for a person (Phase 4 AR-040) is DEFERRED_PENDING_OWNER_DECISION: it cannot be separated from supplier-contract wording. |

## Qualification rules

1. **Isolation.** Frozen v0.3 and every earlier package stay byte-identical. Phase 6 artifacts stay byte-identical.
2. **Intended change set.** `INTENDED_CHANGE_SET.json` predicts every existing v0.3-family input on which a rule fires, and the outcomes this contract then requires. The prediction was produced before candidate logic existed, by an independent implementation of each trigger (`tooling/prescan.mjs`) over frozen v0.3 helpers and output.
3. **Differential.** On every existing input and every Phase 7 scenario, the candidate may differ from v0.3 only where the intended change set or the scenario's sealed differential expectation says so, and only towards the sealed outcome.
   - Every other input must show no behavioural difference. A version-label difference and recomputed offsets are recorded as presentation.
   - An intended intake refusal is checked as a complete refusal state (every condition not assessed, a refusal recorded against each, every finding routed to review), because the Phase 6 router fails closed on refusal supersession (P6K-011).
4. **Phase 7 scenarios.** 50 sealed scenarios. Each implemented rule has a positive, a nearby benign, a malformed-input and a duplicate-or-reordered case, with an expected limitation and route.
5. **Stability.** 32 sealed transforms (17 invariant, 10 of those from non-favourable bases), run through the unchanged Phase 6 stability runner.
6. **Rule packs.** Six packs, nine rules (`RULE_PACK_SPECIFICATION.md`). The candidate refuses every record if any pack is malformed, unsigned, duplicated, incomplete or version-mismatched. No pack can authorise release, approval or a production designation.

## Stop conditions (from the assignment)

Work stops, and is reported without repair, if:
- an earlier file changes;
- a sealed expectation would need changing;
- a rule changes an unrelated existing case;
- a benign control is degraded without a sealed expectation;
- a mutation survives;
- a deterministic run differs;
- an output loses its limitation or review route;
- any result becomes more favourable without sealed authorization;
- the work would need a live model, a real record, a source file, an external service or a deployment.
