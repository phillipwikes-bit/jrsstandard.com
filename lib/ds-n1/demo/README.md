# Decision Spellcheck demo: from plain documents to a review

Run from the repository root:

    node lib/ds-n1/demo/run-demo.mjs lib/ds-n1/demo/case-harbourline

The folder holds the decision record (`record.txt`) and the documents it relies
on (every other `.txt` file). Each file starts with `Title:` (and optionally
`Version:` or, for the record, `Class:`), then a blank line, then the text.

The demo extracts claims, dates and citations automatically, runs the review,
and writes three files to `<folder>/out/`: the extracted record package, the
extraction report (what was inferred and needs confirming), and the review
report as HTML. Everything runs on this computer; nothing is sent anywhere.

The case is fictional. What the demo shows (status HOLD):

- **Caught:** the approval sentence gives the approver a job title and a scope
  that the approval document does not state, so the approval is not fully
  supported.
- **Caught:** "The supplier holds a current external certification" has no
  supporting document at all.
- **Flagged as advisory:** the request says session logging is "recommended";
  the record says it is "required".
- **Flagged as advisory (added 24 November 2026):** the assessment had two
  medium findings open, and the record leaves them out. The omission check
  (`omissions.mjs`) asks whether this was considered. It is advisory: it does
  not change the status, and it works from warning words ("open", "failed",
  "subject to", "not reviewed"), so a gap phrased without one is missed.
