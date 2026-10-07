# Pre-registration: multi-reader extension of the 32-case public-records study

Registered 2026-10-07, before any new read was collected. The commit that adds this file is the timestamp. It may additionally be registered on OSF before packets are sent.

## Purpose
To estimate inter-reader reliability on the full corpus, in place of one second reader on ten cases. This addresses the main evidentiary weakness of the SLGR manuscript.

## Design
- **Readers:** four independent volunteer readers, A to D. None may be an author, may have seen the original reads or notes, or may know the study's results.
- **Allocation:** the 32 cases are split into two halves, stratified by the original read (17 and 15 cases). Readers A and C read half 1; B and D read half 2.
- **Reads per case:** every case receives two new blind reads, plus the original.
- **Generator:** `scripts/build_multireader_study.py packets` builds the packets with a fixed seed (20261007), so the allocation can be reproduced.
- **Instrument:** the same question and the same three definitions the first second reader used, word for word.
- **What readers see:** the source type, year, citation and public link for each case. They do not see the original read, any basis note, the coded outcome or other readers' answers.
- **What readers record:** for each case, a read, a short reason, and whether they knew the outcome beforehand.

## Primary analysis
- **Statistic:** Krippendorff's alpha, ordinal metric, across the two new reads per case. This is the reliability estimate the manuscript will report.
- **Interval:** 95 percent bootstrap interval, resampling cases, 4,000 replicates, seed 20261007.
- **Code:** `scripts/build_multireader_study.py score`.

## Secondary analyses
1. Krippendorff's alpha, ordinal, with the original read included as a third reader.
2. The nominal-metric alpha for both of the above.
3. Exact agreement of each new read with the original read.
4. Agreement within each category (Ready, Needs work, Gap) and within each source class, reported descriptively.

## Interpretation, fixed in advance (Krippendorff 2004)
- **Alpha of .800 or above:** reliable for drawing conclusions.
- **.667 to .800:** tentative conclusions only.
- **Below .667:** not adequate. The manuscript will then say that the read is not yet reliable enough across readers.

## Rules fixed in advance
- Every result is reported, whichever band it falls in. No reader, case or read is dropped after the data are seen, except under the two rules below.
- A case a reader leaves blank because the source would not open is treated as missing for that reader. Alpha handles missing values.
- A read where the reader reports already knowing the outcome is kept, and flagged in a sensitivity analysis that excludes it.
- If fewer than four readers return, the analysis runs on the reads that exist, and the number of reads per case is reported.
- No change to the question, the definitions, the allocation or the analysis after any packet is sent.

## What this does not change
- The original 32 reads and basis notes, which remain the first author's.
- The existing ten-case second read, which is reported alongside as an earlier and separate estimate.
