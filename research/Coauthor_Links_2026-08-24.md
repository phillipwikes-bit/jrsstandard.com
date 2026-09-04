# Co-author confirmation links

**Created 2026-08-24.** Three links, one per co-author. **NOT DEPLOYED YET.** They resolve
only after `coauthor.html`, `api/coauthor.js`, `api/_coauthor-roster.js`,
`api/coauthor-stats.js`, the `api/asset-stats.js` change and the `vercel.json` route are
deployed to `main`.

---

## The links

| Person | Code | Paper | Link |
|---|---|---|---|
| Ubayet Hossain, FRM | `M-01` | detection study | https://www.jrsstandard.com/coauthor.html?k=ggo2vm8jja |
| Tanvi Pokhriyal | `V-HR-01` | employment records study | https://www.jrsstandard.com/coauthor.html?k=8277t7qv5r |
| Stacyann Young | `E-08` | public records study | https://www.jrsstandard.com/coauthor.html?k=mt8yhlx1yg |

Keys derived deterministically by `scripts/add_coauthor_links.py` from a fixed seed and
collision-checked against all 81 existing keys in `_contributor-roster.js` and `honor.js`.
**They can be regenerated if the roster file is ever lost.**

---

## What "discreet" means here, and what it does not

You asked for something that covers the commercial question discreetly. **The page is calm,
short and unalarming. It is not concealed, and it must not be.**

**A buried consent is worth less than no consent at all.** If a co-author later says they
never understood they were agreeing to commercial use, a permission they had to hunt for
proves nothing and reads badly. The version that protects you is the one where the question
was obviously put and freely answered. That is what is built.

**So the commercial question is stated plainly**, in the words a person would use:

> The paper and the underlying study may at some point be used beyond academic publication:
> in training material, in a licensed product, or in materials shown to an organisation
> paying for the work. **That would mean the work earns money and you would not receive a
> share of it.** This asks whether you are willing for your contribution to be used that way.
> You can say no and remain a full author.

**The discretion is in the framing, not the disclosure.** The page is headed "How you are
credited", the credit questions come first because that is what they actually care about, and
the use question sits inside the same short form as one of three ordinary questions. There is
no legal language, no signature block, no threat, and no implication that authorship depends
on the answer. **A co-author reading it should feel asked, not cornered.**

---

## What the page collects

**Credit.** Name spelled and punctuated exactly as they want it printed, title, organisation,
and a contact email that is never printed.

**Three permissions, each an explicit yes or no.**

| # | Question | Why it is there |
|---|---|---|
| 1 | Print me as shown above | The naming election |
| 2 | May this work be used commercially? | Closes the gap the claims assessment found: the existing consent covers "publications and materials about this study" and says nothing about licensing |
| 3 | Does your answer travel with the work? | Closes the successor question. Without it, a permission ends at a sale |

**A free-text note**, for conditions or corrections they want on the record.

**Nothing is pre-selected and a blank is rejected.** `api/coauthor.js` returns
`answer_required` if any of the three is missing. A permission inferred from silence is
exactly the thing that fails when tested.

---

## Two design decisions worth knowing

**Every stored answer carries a terms version.** `TERMS_VERSION = 'coauthor-v1.0-2026-08-24'`
is written into every row. This closes **gap 1** of `CONSENT_AND_RELEASE_AUDIT_2026-08-13.md`:
"no stored copy of the terms as they read on the day each person ticked." **If you change a
word on that page, bump the version.** Editing the wording without bumping it destroys the
only thing that makes the record provable.

**Stacyann Young's organisation field is deliberately blank, with a note beside it** quoting
her own policy back to her: *"Left blank on purpose. You asked on 9 August that your title and
agency stay off every surface, and that still stands. Fill this in only if you want that to
change."* Without that note a blank field reads as an omission she should correct, which is
the opposite of what she asked for.

---

## What this does not do

**It is not an assignment and it does not claim to be.** The page says so: "Nothing here
transfers ownership of your work, and none of it affects your authorship." A licence to use
is not a transfer of title, and pretending otherwise in a web form would not survive counsel.

**It does not bind the 36 detection panel reviewers.** You are right that it is too late to
reach them through this instrument. Their position is unchanged and is set out in
`research/Contributor_Claims_Exposure_2026-08-23.md` Tier 2: a revocable publication consent
that does not mention commercial use. **The remedy there is a separate notice with an honest
opt-out, and it is item 4 on that document's action list.**

**It does not bind Kyle McMullan.** He declined authorship on 2026-08-23 and holds no
authorship interest, so no link is issued to him.

---

## Before sending

| # | Step |
|---|---|
| 1 | Deploy the six files. Nothing resolves until then |
| 2 | Test the flow with `?k=selftest00`, which exercises the whole path and stores no row |
| 3 | Confirm all three real links return 200 |
| 4 | Send Stacyann and Tanvi first. They built the case corpora |
| 5 | Send Ubayet's separately from the manuscript sign-off ask. **Two different permissions, and bundling them makes both harder to refuse** |
