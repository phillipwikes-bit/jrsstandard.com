# Stability and Over-Refusal Record

**LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.**

## Stability

Synthetic metamorphic checks in a limited local context. Not a robustness, reliability, accuracy or validation result. Source: `stability/STABILITY_RESULTS.json`, run through the unchanged Phase 6 stability runner. Results hash `sha256:97a16edbbab65d6e7874d0dc9e9c3a6863992cfae10a7096c3f379e030d40736`.

| Measure | Value | Required |
|---|---|---|
| Transforms | 32 | at least 30 |
| As expected | 32 | all |
| Invariant transforms | 17 |  |
| Invariant from non-favourable bases | 10 |  |
| All transforms from non-favourable bases | 17 | at least 12 |

| Transform | Kind | Base | Base state | Verdict | Result |
|---|---|---|---|---|---|
| P7-ST-01 wording: supplier name spelled out | invariant | P7-R07-04 | favorable | `presentation_only` | `as_expected` |
| P7-ST-02 wording: supplier name spelled out (late-assessment base) | invariant | P7-CHR-01 | non_favorable | `presentation_only` | `as_expected` |
| P7-ST-03 punctuation: hyphen and full stop in the record type (negated-rationale base) | invariant | P7-NEG-01 | non_favorable | `presentation_only` | `as_expected` |
| P7-ST-04 section reorder: risk and controls swapped (two-expiry base) | invariant | P7-CHR-05 | non_favorable | `presentation_only` | `as_expected` |
| P7-ST-05 section reorder: risk and controls swapped (unlinked-identifier base) | invariant | P7-EVL-01 | non_favorable | `presentation_only` | `as_expected` |
| P7-ST-06 section reorder: risk and controls swapped | invariant | P7-NEG-04 | favorable | `presentation_only` | `as_expected` |
| P7-ST-07 formatting: blank line after every line (scope-refused base) | invariant | P7-SCO-01 | non_favorable | `no_behavioral_difference` | `as_expected` |
| P7-ST-08 formatting: blank line after every line (no-decision-date base) | invariant | P7-CHR-09 | non_favorable | `presentation_only` | `as_expected` |
| P7-ST-09 irrelevant narrative line added (log-review conflict base) | invariant | P7-CON-01 | favorable | `presentation_only` | `as_expected` |
| P7-ST-10 irrelevant narrative line added (motive-note base) | invariant | P7-R07-01 | non_favorable | `presentation_only` | `as_expected` |
| P7-ST-11 benign pattern word: batch job keeps running | invariant | P7-EVL-04 | favorable | `presentation_only` | `as_expected` |
| P7-ST-12 benign pattern word: invoice review not started (duration-conflict base) | invariant | P7-CHR-13 | non_favorable | `presentation_only` | `as_expected` |
| P7-ST-13 benign pattern word: later access review completed (negated-rationale base) | invariant | P7-NEG-01 | non_favorable | `presentation_only` | `as_expected` |
| P7-ST-14 duplicate date: same decision date repeated (two-expiry base) | invariant | P7-CHR-05 | non_favorable | `no_behavioral_difference` | `as_expected` |
| P7-ST-15 duplicate date: same decision date repeated | invariant | P7-CHR-06 | favorable | `no_behavioral_difference` | `as_expected` |
| P7-ST-31 wording in a quoted line: granted becomes approved | invariant | P7-R07-04 | favorable | `presentation_only` | `as_expected` |
| P7-ST-32 punctuation: full stop after the exception identifier | invariant | P7-CON-03 | favorable | `presentation_only` | `as_expected` |
| P7-ST-16 omitted dates: every decision date removed | changed | P7-R07-04 | favorable | `human_review_required` | `as_expected` |
| P7-ST-17 omitted dates: expiry date removed | changed | P7-CON-03 | favorable | `human_review_required` | `as_expected` |
| P7-ST-18 negated language replaces the stated need | changed | P7-NEG-04 | favorable | `human_review_required` | `as_expected` |
| P7-ST-19 negated language replaces the stated need (basis-reference base) | changed | P7-EVL-04 | favorable | `human_review_required` | `as_expected` |
| P7-ST-20 unrelated quotation: report-view identifier cited for identifiable basis | changed | P7-CON-03 | favorable | `human_review_required` | `as_expected` |
| P7-ST-21 unrelated quotation: renewal sentence cited for reasoning (late-assessment base) | changed | P7-CHR-01 | non_favorable | `human_review_required` | `as_expected` |
| P7-ST-22 paraphrased conflict: log review not started | changed | P7-R07-04 | favorable | `human_review_required` | `as_expected` |
| P7-ST-23 paraphrased conflict: log review not started (renewal-quote base) | changed | P7-EVL-03 | non_favorable | `human_review_required` | `as_expected` |
| P7-ST-24 reworded excluded-domain language added | changed | P7-NEG-04 | favorable | `fail_closed` | `as_expected` |
| P7-ST-25 reworded excluded-domain language added (duration-conflict base) | changed | P7-CHR-13 | non_favorable | `fail_closed` | `as_expected` |
| P7-ST-26 multiple defects: late assessment, second expiry and negated need | changed | P7-R07-04 | favorable | `human_review_required` | `as_expected` |
| P7-ST-27 multiple defects: 30-day grant and log review not started (unlinked-identifier base) | changed | P7-EVL-01 | non_favorable | `human_review_required` | `as_expected` |
| P7-ST-28 output damage: chronology limitation weakened (late-assessment base) | changed | P7-CHR-01 | non_favorable | `fail_closed` | `as_expected` |
| P7-ST-29 output damage: every refusal removed (scope-refused base) | changed | P7-SCO-01 | non_favorable | `fail_closed` | `as_expected` |
| P7-ST-30 output damage: review_required chronology flipped to supported (no-decision-date base) | changed | P7-CHR-09 | non_favorable | `fail_closed` | `as_expected` |

## Over-refusal

Local engineering observations on synthetic target and nearby benign cases. Not accuracy or performance measures. Source: `results/OVER_REFUSAL_TABLE.json`.

| Rule | Target cases routed as sealed | Benign cases refused or degraded | Existing inputs triggered |
|---|---|---|---|
| RP-CHR-01 | 3 of 3 | 0 of 1 | GC-004, AR-010, LB-02, P6-CH-06 |
| RP-CHR-02 | 3 of 3 | 0 of 1 | AR-011, P6-CH-07 |
| RP-CHR-03 | 3 of 3 | 0 of 1 | P6-CH-09, P6-ST-12 |
| RP-CHR-04 | 3 of 3 | 0 of 1 | AR-009, P6-CH-02, P6-CH-10, P6-ST-14 |
| RP-CON-01 | 4 of 4 | 0 of 2 | AR-025, P6-SU-07 |
| RP-EVL-01 | 4 of 4 | 0 of 2 | ST-06, P6-SP-02, P6-SP-04, P6-SP-06 |
| RP-NEG-01 | 4 of 4 | 0 of 2 | P6-SP-07 |
| RP-STR-01 | 4 of 4 | 0 of 1 | P6-RT-07 |
| RP-SCO-01 | 4 of 4 | 0 of 2 | ST-14, P6-XD-03, P6-ST-17 |

Every triggered existing input was predicted by the sealed intended change set. The benign counts are small synthetic samples; they do not estimate a false-positive rate. The one degradation an owner may judge as over-review is Phase 4 ST-06 (P7-OD-02).
