# JRS Review Engine: buyer brief

**DRAFT 2026-10-01. NOT SENT. Status: HOLD (decision sheet O-05).**

## The problem
Approvals for exceptions, such as a supplier getting access that policy would normally refuse, can be recorded in a few lines. When an auditor, a regulator or a successor asks later why access was granted, on what evidence, and until when, the record may not answer. The person who knew may have left.

## What JRS does
The JRS Review Engine reads one completed record and asks five documentation questions:
- Is the basis for the conclusion identifiable?
- Can the decision process be traced?
- Could a reviewer with no prior knowledge reconstruct it?
- Is the evidence in the record enough to support the conclusion?
- Can the chronology be followed?

It returns pass, review or gap for each question, a route, and short notes, and it can export a versioned evidence Manifest. It flags documentation for a person to act on. It does not judge whether the decision was right.

## What has been tested, honestly
- **Tested offline:** the token gate, refusal of malformed model output, the routing rule, Manifest export, and the evaluation package's call, cost and data controls.
- **Not yet tested:** accuracy on real records, stability across repeated runs, and fit with your workflow.
- **Live test on five fictional records (2026-10-02):** the thin records were flagged and the complete one passed, on both runs. Two records with hidden instructions did not change the result. This is fixture behavior, not accuracy. See the limitations page.

## The evaluation we propose
A paid, 30-day evaluation in your own sandbox, using your own model-provider account, on up to 100 of your permitted records. The details are in the evaluation offer. It may conclude that JRS does not fit your workflow, and that is a legitimate outcome.

## Who is behind it
Phillip Wikes, creator of the Justification Review Standard. Contact: info@jrsstandard.com.
