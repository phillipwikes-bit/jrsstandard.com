# Rule-Pack Specification

**LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.**

Phase 7 rules enter the candidate only through rule packs: JSON files in `lib/engine-evidence-graph-v0.3.1-candidate/rule-packs/`, checked by `rule-packs.mjs` on every compilation. A rule is active only while its pack is loaded and the whole pack set is valid. Rule code exists in the candidate, but it runs only for active rule identifiers.

## Pack schema

| Field | Requirement |
|---|---|
| `pack_id` | Unique across the set |
| `pack_version` | Semantic version `n.n.n` |
| `candidate_version` | Must equal the candidate compiler version `0.3.1-candidate` |
| `purpose` | Non-empty |
| `rules` | Non-empty list of rules |
| `signature` | `{ method: "sha256-canonical-content-seal", content_sha256 }`, a SHA-256 seal over the canonical pack content without the signature. It is an integrity seal, not a cryptographic identity. |

No other pack field is accepted.

## Rule schema

| Field | Requirement |
|---|---|
| `rule_id` | Unique across the set, and one of the nine identifiers the candidate implements |
| `purpose`, `trigger`, `limitation`, `false_positive_risk` | Non-empty text |
| `expected_safe_outcome` | One of `review_required`, `refusal`, `conflict_and_review`, `assertion_withheld_and_review` |
| `linked_scenarios` | Non-empty list |
| `owner_decision_for_expansion` | Non-empty text |

No other rule field is accepted. A field name suggesting release, approval, production, deployment, go-live or readiness is refused.

## Rejection is total and fails closed

The set is rejected if any pack is:
- malformed;
- unsigned or carrying a wrong signature;
- a duplicate (pack or rule identifier);
- incomplete;
- version-mismatched;
- naming an unimplemented rule;
- carrying an unsafe outcome or a forbidden field.

An empty set is also rejected. On rejection no rule is active, and the candidate refuses every record with `rule_pack_rejected`: all conditions not assessed, a refusal recorded against each, every finding routed to review. It never falls back to a partial set.

Every candidate graph records `rule_packs`: validity, problem count, pack identities with their seals, and the active rules.

## Packs (version 1.0.0)

| Pack | Rules | Safe outcome |
|---|---|---|
| RPK-STR structural integrity | RP-STR-01 motive label | assertion withheld and review |
| RPK-CHR chronology integrity | RP-CHR-01 assessment after decision; RP-CHR-02 two expiry dates; RP-CHR-03 no dated decision; RP-CHR-04 duration against dates | conflict and review; review_required |
| RPK-NEG negation and rationale | RP-NEG-01 negated rationale | review_required |
| RPK-EVL evidence link | RP-EVL-01 linked-section abstention | review_required |
| RPK-CON conflict | RP-CON-01 log-review paraphrase family | conflict and review |
| RPK-SCO scope | RP-SCO-01 keep or lose + possessive + job | refusal |

Exact triggers, limitations, false-positive risks and linked scenarios are in `RULE_PACK_REGISTER.json` and on `workbench/rule-packs.html`. No pack can cause release, approval or a production designation. Any widening requires a recorded owner decision and a new sealed scenario set.
