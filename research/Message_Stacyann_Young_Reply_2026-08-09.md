# Reply to Stacyann Young, 2026-08-09

**Status: draft for Phillip to send. Not sent.**

All three of her changes are applied. Revised certificate attached to the message.

---

Stacyann,

All three changes are made.

The certificate now reads **Stacyann Young**, with no title line and no employer anywhere on it. HPD and your agency title are out of the certificate, out of the acceptance record, and out of anything public-facing. Your citation is used as you wrote it, including "voluntarily" and "public determinations".

Here is the full text as it will print:

> **Stacyann Young** was named the recipient of the Global Governance and Transparency Honor (2026), the first honoree named under this designation, in recognition of voluntarily designing and completing a public-records documentation study of 32 public determinations, advisory opinions, and compliance audits, drawn from four document classes and two states and spanning twenty-one years of decisions, each assessed from the source alone and each accompanied by a written record of the basis for that assessment.

The revised draft is attached. If anything in it still reads wrong, say so and I will change it again before it is issued.

Two related things, so nothing carries the old form by accident:

The manuscript currently lists you as Stacy Young, Deputy Records Access Officer, NYC Department of Housing Preservation and Development. Journals expect an institutional affiliation on an author line, and that is a different question from a certificate. Tell me which you want on the paper and I will set it: your full title, your agency name only, or "Independent researcher" with no employer named. Either of the last two is normal for volunteer work done in a personal capacity.

The two Chief FOIA Officers Council notes name your role in the opening line, because that is what makes a records officer's letter land with the Council. Those are still unsent and awaiting your edits. If you want your title out of those as well, they need rewriting from a different angle, and it is worth deciding that before you edit them rather than after.

Phillip

---

## Attachments

- `DRAFT_Honor_Certificate_Stacyann_Young.pdf`

## What changed in the system, not just on paper

| Item | Before | After |
|---|---|---|
| Printed name | Stacy Young | Stacyann Young |
| Certificate title line | Deputy Records Access Officer, NYC Dept of Housing Preservation and Development | *removed entirely* |
| Organization field | NYC Department of Housing Preservation and Development | *empty* |
| Citation opening | "For designing and completing the public-records documentation study" | "In recognition of voluntarily designing and completing a public-records documentation study" |
| Case description | "32 real determinations" | "32 public determinations" |
| `api/honor.js` | title and org populated from the study record | both empty, with a comment stating they are not to be repopulated |
| `api/contributor.js` | Stacy / Stacy Young | Stacyann / Stacyann Young |
| Old certificate file | `DRAFT_Honor_Certificate_Stacy_Young.pdf` | deleted, so the superseded version cannot be sent by mistake |

## Verified on the generated PDF

Text extracted from the compressed PDF streams rather than assumed from the source:

- Title line reads **Certificate of Recognition**
- Name reads **Stacyann Young**; the string "Stacy Young" does not appear
- "Deputy Records Access", "Housing Preservation", "HPD" and "New York City" all absent
- "voluntarily" present

## Open, pending her answer

1. **Manuscript author line.** Full title, agency name only, or "Independent researcher".
2. **The two Council notes.** Both open with her role. If the title comes out, they need a different opening.
