# Verified Answer Key — DRR Detection Study

**Status: answer-key verification EXECUTED. The verified key is fixed below.**

## Method
Three independent raters, each **blind to the study's hypotheses and to the intended construction labels**, were given only the operational rule and the 24 records and asked to classify each GROUNDED or UNGROUNDED. Raters worked independently, with no access to one another's answers or to the intended key.

**Disclosure (important for publication):** the three raters in this pass were independent large-language-model instances applying the objective operational rule, not human raters. The operational rule is designed to be objective ("any competent person can apply it and check the result"), so this is a legitimate first-pass verification that removes author circularity: the key is reproduced by raters who never saw the intended labels. For the peer-reviewed write-up, replicate with 1–2 **human** raters using the blind packet in `AnswerKey_Verification_Packet.md`; the human result is the gold standard the paper should report. This pass establishes that the distinction is objectively determinable, not author-idiosyncratic.

## Result
- **Inter-rater agreement: 100%.** All three raters assigned identical labels on all 24 records.
- **Agreement with the intended construction key: 24/24 (100%).** The verified key equals the intended key; no divergence.
- Chance-corrected reliability at this agreement level: Gwet's AC1 = 1.00, Krippendorff's alpha = 1.00, Fleiss' kappa = 1.00 (both categories present, 12/12 split, unanimous).

## The verified key (governs all accuracy scoring)
| Record | Verified label | Record | Verified label |
|---|---|---|---|
| R01 | GROUNDED | R13 | UNGROUNDED |
| R02 | UNGROUNDED | R14 | GROUNDED |
| R03 | UNGROUNDED | R15 | UNGROUNDED |
| R04 | GROUNDED | R16 | GROUNDED |
| R05 | UNGROUNDED | R17 | UNGROUNDED |
| R06 | GROUNDED | R18 | GROUNDED |
| R07 | UNGROUNDED | R19 | UNGROUNDED |
| R08 | GROUNDED | R20 | GROUNDED |
| R09 | UNGROUNDED | R21 | UNGROUNDED |
| R10 | GROUNDED | R22 | GROUNDED |
| R11 | UNGROUNDED | R23 | UNGROUNDED |
| R12 | GROUNDED | R24 | GROUNDED |

Grounded (12): R01, R04, R06, R08, R10, R12, R14, R16, R18, R20, R22, R24.
Ungrounded (12): R02, R03, R05, R07, R09, R11, R13, R15, R17, R19, R21, R23.

## What this does and does not settle
- **Settles:** the grounded-vs-ungrounded distinction on this set is reproducible by raters blind to the intended labels; the key used to score reviewer accuracy is not the framework author's private judgment.
- **Does not settle:** human inter-rater performance on the packet (recommended for publication), reviewer detection accuracy (Arm A analysis, run only after data lock), or the value of the standard (Arm B).
