# Change-Impact Classification

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

`lib/engine-reliability/differ.mjs` compares two behaviour records, two baseline manifests or two v0.3 graphs. It identifies changes; it never applies one, never edits an input (inputs may be frozen) and returns `applies_changes: false`.

## Classes

| Class | Meaning | Route |
|---|---|---|
| `presentation_only` | Offsets, quotation text or graph structure changed with a recorded explanation; no condition, refusal or limitation changed | person |
| `expected_safe_degradation` | A less favourable state declared expected by the comparison context | person |
| `expected_refusal` | A refusal gained, declared expected | person |
| `unexpected_behavioral_change` | Any behavioural change without an explanation | person |
| `favorable_transition_requiring_human_review` | A more favourable state | person; fails closed if it starts from `not_assessed` or `review_required`, or ends supported or gap with no evidence trail |
| `limitation_removed_or_weakened` | A limitation, limitation kind or review route lost | fails closed |
| `quote_or_span_integrity_defect` | A quotation, offset or quotation refusal changed or disappeared without explanation; an unusable quotation became usable without explanation | fails closed |
| `scope_boundary_defect` | A scope refusal, gate refusal, instruction-risk detection, candidate refusal or release status lost or changed; a provider or network call recorded | fails closed |
| `unknown_comparison_state` | Missing, malformed, tampered, incomplete or version-mismatched input | fails closed |

Verdict: `fail_closed` if any finding fails closed; otherwise `human_review_required` if anything other than presentation changed; otherwise `presentation_only` or `no_behavioral_difference`.

## Explanations

The comparison context may record `offsets_recomputed`, `quote_changes`, `structure_change`, `expected_degradation`, `expected_refusal` or an `expected_version_change` from one exact version to another. An explanation can classify a change as expected. It cannot remove a fail-closed result for a refusal loss, a limitation loss, a favourable transition from a low state or a scope breach.

## Known over-conservatism

When an Engine change makes intake refuse a record that earlier produced quotation refusals, those refusals and the presence limitations disappear. The router fails closed (P6-ST-18, P6K-011). The after state is more cautious. The assignment's rule "a refusal disappears" requires failing closed, so this is kept and listed for an owner decision (OD-03).

## Replay tool

`tools/engine-reliability-replay.mjs` uses these exit codes:

| Exit | Meaning |
|---|---|
| 0 | No behavioural difference |
| 10 | Human review |
| 11 | Fail closed |
| 2 | Usage error |
| 3 | Provider configuration present |

Verify mode currently exits 10 because P6-RT-07 is unexpected and is routed to a person.
