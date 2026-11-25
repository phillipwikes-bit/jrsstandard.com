# Outcome rules, fixed on the development set before the hold-out was scored (2026-11-25)

Outcome label: `prep.py` `outcome()`: capitalised operative words after the BACKGROUND section (REVERSE, VACATE, REMAND, MODIFY: not affirmed; else AFFIRM: affirmed). Checked by hand on 3 development decisions.

Development set (206 labelled decisions, 63 not affirmed):

| Rule (background text only) | Flagged | Not affirmed, flagged vs not | Fisher p |
|---|---|---|---|
| Record-gap wording (did not provide / failed to investigate / incomplete / insufficient ...) | 109 | 31% vs 30% | 0.88 |
| Two or more record-gap phrases | 44 | 34% vs 30% | 0.58 |
| Record-gap wording and no summary judgment | 85 | 35% vs 27% | 0.22 |
| **No mention of a decision without a hearing or summary judgment** | 160 | 34% vs 17% | 0.03 |

**Primary rule (sealed): flag a decision when its background does not mention a decision without a hearing or summary judgment.** It is a procedural signal, not a measure of record quality; it was the only rule with a development signal.
**Secondary rule (sealed, for comparison): record-gap wording and no summary judgment.** The record-quality signal closest to the JRS method.
