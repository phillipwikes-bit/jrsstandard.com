# Basis-note coding: correction record (2026-10-07)

**OLD FINDING.** The 28 August package (`research/JCI_SUBMISSION_2026-08-28/02_DATA/JCI_JRS_Construct_Coding_Frame.csv`) codes 6 of the 7 Needs work notes as stating a reconstructability failure, and 0 of the 17 Ready notes (Fisher p = .000052). The frame lists the coder as "S.Y. (primary reviewer)".

**NEW EVIDENCE.**
- The six Yes codes are a hard-coded citation list (`CODED_YES`, `scripts/build_submission_package.py:60`). It came from the AI-assisted analysis of 8 August 2026, recorded in `MASTER_TRACKER.md` on that date.
- The coder and coding-date fields are written by that script (line 436). No person recorded them.
- The basis notes themselves, and every read, are the first author's own, unchanged.
- Under the frame's own rule ("explicit statement required; inference not accepted"), PR-06's note ("The Commission distinguished agency-held materials from erased police and court records after in-camera review.") makes no explicit statement that the basis could not be rebuilt.

**CORRECTED STATUS.** The notes were re-coded with a fixed text pattern (`scripts/code_basis_notes.py`): a note is Yes when one sentence pairs a negation with a rebuilding verb. The result is 5 of 7 Needs work notes against 0 of 17 Ready notes, Fisher two-sided p = .00049. The new frame is `Basis_Note_Coding_Frame_RULE.csv`. The pattern reproduces every earlier code except PR-06, which moves from Yes to No.

**EXPLANATION.**
- The fixed pattern removes judgment from the coding step, so no person or model makes a coding decision.
- The pattern was specified after the notes were written, which the manuscript states.
- The 28 August package is preserved unchanged as the historical record, and its coder field is NOT relied on.
- The count "eleven of the 17 Ready notes say so directly" came from the same 8 August analysis and cannot be reproduced mechanically, so it is removed from the SLGR manuscript.
