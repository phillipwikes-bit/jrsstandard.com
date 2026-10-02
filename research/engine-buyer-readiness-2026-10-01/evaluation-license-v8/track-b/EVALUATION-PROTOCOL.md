# Buyer evaluation protocol

**DRAFT 2026-10-02.** A written plan the buyer agrees **before** the evaluation starts (v8.0 sections 7 and 23). Fields left blank are agreed with the buyer; none is assumed.

## 1. Agreed before the first run
| Item | Agreed value |
|---|---|
| Workflow and record type (default: completed supplier-access exception approvals) | |
| Number of records (up to 100) and how they are chosen | |
| Who provides the reference judgment for each record, and how | |
| Error weights (default: v8.0 section 16, missed gap 10, other errors 1 to 2) | |
| What result would make the buyer consider a production licence | |
| What result would end the conversation | |

## 2. Procedure
1. The reviewer records their own judgment of each record **before** seeing the Engine's output.
2. Run the package: one call per record, or two if the buyer wants to see repeatability.
3. The reviewer then sees the output and records a final judgment, whether they accept or override the Engine, and why.
4. Measure setup time, review time per record and provider cost from the Anthropic console.

## 3. What is reported
- Paired result: **gap sensitivity together with the false-gap rate on pass records**. Neither is reported alone.
- False-ready rate on records the reviewer judged to have a gap.
- How often the reviewer overrode the Engine, kept separate from whether the override was right.
- A full three-class table (pass, review, gap) by route and by condition.
- Small numbers stay small. With fewer than about 30 records, results are described, not generalized.

## 4. What this evaluation cannot show
Legal validity, regulatory compliance, or performance on other record types, models or provider routes.
