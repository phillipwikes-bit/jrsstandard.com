# CEP article preparation

**Status of the November 2026 slot: FILLED, and this directory is not for it.**

`research/CEP_When_the_Record_Cannot_Speak_for_Itself_ACCEPTED.md` records that
*When the Record Cannot Speak for Itself* was **accepted by CEP Magazine (SCCE)
on 2026-07-16 for the November 2026 issue**, editor Bill Anholzer, advanced to
copy-editing on 2026-07-21, with a revised .docx supplied by the author on
2026-08-27. That piece is 1,731 words and carries **zero empirical figures**: it
was accepted before the detection result was reported, and it argues the problem
conceptually rather than from data.

Drafting a second November feature would be writing into a slot that is closed
and past copy-editing. So the artifact here is a **follow-on feature**, pitched
for a later issue, carrying the empirical material the accepted piece could not:
the detection result, the reliability limitations, and the corpus caveats.

That framing is a judgment call and it is recorded here so it can be overruled in
one line. If the intent was instead to supply figures for insertion into the
already-accepted November piece, that is a **copy-edit-stage change request to
the editor**, not a new outline, and it would need Bill Anholzer's agreement
before a word is written.

## Contents

| File | What it is |
|---|---|
| `OUTLINE_Detection_Feature.md` | The draft outline, structured to the accepted piece's house format |
| `FIGURES.tsv` | Every figure the outline may use, with its verbatim source |
| `../scripts/check_cep_prep_figures.py` | Asserts the outline uses no figure that is not in `FIGURES.tsv`, and that every declared figure appears verbatim in its source file |

## Why the figure sheet exists

Two figures on the public site were still the 4 August values on 2026-09-02, three
months after the 18 August manuscript replaced them: trained-reviewer AC1 printed
as 0.624 when the analysed set gives 0.623, and the reliability label total
printed as 99 when the manuscript states 113 submitted determinations reduced to
104. `research/AUDIT_1_2026-08-29.md` had already caught the label total as P0-1.
The manuscript was fixed; the site was not.

A pitch carrying a figure the manuscript has moved is the same failure with a
worse audience. The checker makes that a build failure rather than a correction
in someone else's inbox.

## Deployment

This directory is markdown only. `.vercelignore` excludes `*.md` globally and
`vercel.json` 404s `/:path*.md` as defence in depth, so nothing here reaches the
public origin. Do not add an `.html` file to this directory.
