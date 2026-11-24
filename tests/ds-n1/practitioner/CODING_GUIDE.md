# Coding guide for an independent second coder

Date: 24 November 2026. Purpose: turn practitioners' written answers into categories so they can be compared with what Decision Spellcheck reported, by someone other than the developer. Two coders working separately, then compared, is what makes the result credible to an outside reader.

## What you receive

- The fictional record and its documents, exactly as practitioners saw them.
- A sheet of answers, one row per practitioner, identified only by a code (R01, R02, ...). No names, emails or countries.

## What you must not see before you finish

- What Decision Spellcheck reported on the record, or its locked prediction.
- The other coder's sheet.
- This repository's checks or test records.

## Steps for each answer

1. **Reliance (only where the sheet says "not asked").** Early answers were given before the page asked question 1. From the written answer alone, code `Yes`, `Not without more` or `No` if the answer makes the practitioner's position clear; otherwise code `Unclear`. Never infer from tone alone.
2. **Split into points.** One point is one distinct concern. "The risk assessment has no date and no author" is one point (the assessment's basis). "MFA was only recommended, and the expiry is not enforced" is two.
3. **Code each point** to one category below. If none fits, use `other` and write a few words. Do not stretch a category to fit.
4. **Mark `partial`** only when the point is a narrower or broader version of the category (for example, "is MFA enough?" against the category for a recommended control stated as required). When unsure, mark partial.
5. **Ignore** praise, general remarks about record-keeping, and suggestions that do not identify a gap in this record.

## Categories

| Code | The practitioner says, in effect |
|---|---|
| `approver_role` | It is not shown who approved, or that their role allows it. |
| `authority_basis` | The policy, standard, section or delegation relied on is not supplied or not shown to permit the decision. |
| `evidence_summary` | An assessment or finding is stated as a bare conclusion ("risk acceptable") with no criteria, evidence, author or scope. |
| `unsupported_statement` | A statement in the record has no source or reason behind it, or the conclusion does not follow from what is shown. |
| `source_conflict` | The record says something different from its source, including a recommendation stated as a requirement. |
| `version_traceability` | It is unclear which version of a document was relied on, or versions disagree. |
| `sequence` | Events are in an impossible or doubtful order, or a step came after the decision it should precede. |
| `inferred_date` | A date in the record is not in any source, or a document has no date, so timing cannot be checked. |
| `end_date` | There is no end or review date, or the end is not enforced. |
| `post_expiry_terms` | What happens after the end date (renewal, revocation, review) is not stated. |
| `scope_limits` | The scope, level of access, volume or compensating controls are not justified or limited. |
| `stop_redress` | There is no way to stop the action or for affected people to object. |
| `human_oversight` | Human review or sign-off is absent or was removed. |
| `certainty_language` | Overconfident wording ("clearly", "therefore controlled") not supported by the evidence. |
| `conclusion_missing` | No decision or conclusion can be found, or reasons are given with no conclusion. |
| `other` | A real gap that fits none of the above (write it in a few words). |

## Output

For each row: the reliance code if asked for, then the points, each as `category | partial (yes/no) | the practitioner's words, shortened`. Record the time you spent and anything you found hard to code.

## How the two sheets are compared

Agreement is reported per category with Cohen's kappa and the raw percentage, together with the number of points each coder found. Disagreements are discussed and resolved in writing; the original sheets are kept unchanged. Only resolved codes are compared with the tool's locked output (`compare.mjs`), and partial matches are never counted as matches.
