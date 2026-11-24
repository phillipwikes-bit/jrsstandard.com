# Decision Spellcheck

**A pre-finalisation check for decision records: it reads the record and the documents behind it, and flags anything a later reviewer could not trace, confirm or rely on, before the record is signed off.**

Date: 24 November 2026. Status: working prototype, under independent evaluation. No accuracy rate is claimed.

## The problem

Decision records (access exceptions, AI action authorizations, investigation summaries, document-production decisions) are often reviewed months later by someone who was not there. Records that read as complete regularly turn out to rest on a recommendation restated as a requirement, an assessment with no stated basis, or an approval with no cited authority. By then the people and the context are gone.

## What it does

1. **Reads plain documents.** Give it the decision record and the documents it relies on; it identifies each claim, its dates, who acted and which passage supports it. Nothing has to be prepared by hand.
2. **Checks every claim against its source.** Support, contradiction, missing sources, wrong dates, the wrong event, dropped conditions, unsupported conclusions.
3. **Flags known risk patterns.** 37 checks, including approvals with no stated authority, a "recommended" control stated as "required", conclusions with no reasoning, and AI actions with no way to pause them.
4. **Asks about what was left out.** If a document the record relies on mentions an open finding, a failed test, a condition or a step not done, and the record never mentions it, the reviewer is asked whether it was considered (advisory).
5. **Holds the record until gaps are resolved.** Each finding comes with one plain question for the reviewer; the record stays on HOLD until each is fixed or overridden with a written reason, and every step is logged.

## Why it is different

- **Same input, same answer, every time.** It makes no AI model calls, so results can be reproduced exactly for audit or dispute.
- **Nothing leaves the building.** No network calls; records stay on the organisation's own systems.
- **Shows its working.** Every finding points to the exact passage and document version.
- **Tested in the open.** Its answer for a study record was recorded and fingerprinted before any practitioner saw that record.

## Evidence to date

- **Engineering:** 168 automated tests pass; reports reproduce byte for byte.
- **Document reading:** on 26 developer test records, given only their plain text, it found 127 of 128 hand-identified claims and reached the same review outcome as the hand-built version on 19; all 7 differences are explained (most were defects planted only in hand-made citation data), and no sound record was wrongly held (`tests/ds-n1/EXTRACT_EVAL.json`).
- **Practitioner study (in progress):** independent practitioners in 12 countries reviewed a fictional record blind. Most would not rely on it as written; the prototype's locked answer passed it. The checks added since target the gaps practitioners raised most and are being tested on fresh records. This is reported as a finding, not hidden.

## Limits, stated plainly

- Fictional records only today; real-record use is a licensing decision.
- Reads plain text and Word (.docx) body text; PDF needs a conversion step, and Word headers, footers, footnotes and comments are not read.
- The check for what a record leaves out of its sources is advisory and new: on 8 fresh developer-written records it caught 3 of 4 omissions and wrongly flagged 0 of 4 sound records (`tests/ds-n1/OMISSION_EVAL.json`); far too few records to state a rate, and it misses omissions phrased without a warning word.
- Word-pattern checks can miss gaps phrased in unexpected ways.

## Ways to use it

| Option | For |
|---|---|
| Licence to embed in your product | Compliance, HR case-management, eDiscovery and AI governance software vendors |
| Single-organisation installation | Investigation, audit and compliance teams |
| Evaluation licence on fictional records | Anyone deciding whether it fits |

Contact: info@jrsstandard.com
