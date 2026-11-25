# Decision Spellcheck: blind-spot register

Started 25 November 2026. One line per gap a competitor, buyer or reviewer could point to: what it was, what was done, how it was measured, and what is left. "Seen" means the number was taken after changes made by looking at the same items, so it is not a clean test.

## Closed or narrowed in the tool

| Blind spot | What was done | Measured | Left |
|---|---|---|---|
| A changed amount, percentage, period or count passed unnoticed (word overlap cannot see "$5,000" become "$50,000") | New findings `NUMBER_MISMATCH` (serious) and `NUMBER_NOT_ESTABLISHED` (review). Figures read with what they count; the same value written another way ("thirty", "5,000 dollars", "45 percent") is not a change; figures compared in order inside a restated sentence | Track E, 40 public EEOC decisions not used before: first run 80/80 unchanged passed, 33/40 changes caught; after fixes 39/40 (seen). Number-diff baseline 16/40. 180 study 014 AI drafts: no new serious flag | Totals and worked-out figures ("four days after") not checked; a change to a figure that also appears, for the same thing, in a neighbouring sentence can be missed |
| Dates in British, European, abbreviated or ordinal form were not read ("3rd March 2024", "Sept. 5, 2023", "25/03/2024") | Date reader widened; all-number dates read only when they cannot be read two ways | Track A dropped dates named 238 to 244 of 265; unit tests | Dates without a year are used only to clear a date, not to raise one; relative dates not read |
| An all-number date that reads differently by country (03/04/2024) | New review finding `DATE_FORMAT_AMBIGUOUS`; the date is never guessed | Raised on 9 of 180 AI drafts, every one a real two-way date (for example 1/9/2014) | Review question only |
| A wrong date in a reworded sentence was only ever a review question | A date that appears nowhere in the source, cited to a passage that dates the matter differently, is now `DATE_MISMATCH` (serious); a source date without a year ("On June 22, ...") counts as giving it | Track F changed dates caught 2 to 24 of 34 (seen) | 10 of 34 still missed, mostly where the changed sentence is not linked to a passage |
| A record in another language passed silently, because every check reads English words | New review finding `LANGUAGE_NOT_SUPPORTED`, raised when common words of another language outnumber English ones or most letters are not Latin script | Spanish, German, French and Chinese text reported; terse English notes not (the first version wrongly flagged 5 of 180 English drafts; fixed before commit) | English only. Checking other languages is not built |
| Double negatives read as negative ("did not fail to report", "not unreasonable"); one-word negatives missed ("unsure" against "not sure"); "did not request ... until August 5" read as a denial; an aside "(not a supervisor)" read as a denial; a heading phrased as a question read as a statement | Polarity reads these correctly | Track F good drafts clean 11 to 16 of 60 together with the next two rows (seen) | Paraphrased negation ("recovers more slowly" against "does not recover") still flagged |
| "The Agency stated" and "the Chief stated" were not recognised as attributed speakers | Added to the speaker list used by study 014's anchor definition | Track A dropped speakers named 61 to 80 of 88; review questions on 180 AI drafts 36 to 58, no change in which drafts reach READY | 8 of 88 still missed |
| Headings, laws, documents and the adjudicator ("Procedural Background", "Rehabilitation Act", "Report", "the AJ") were treated as people, so a statement could be "about a different person" | The wrong-person check compares only people and organisations | Wrong-person flags on good drafts in track F: 13 to 6 drafts | Entity extraction itself is unchanged |

## Measured openly, not solved

| Blind spot | Measure | Result |
|---|---|---|
| Clearing a good, long, reworded AI draft without a serious flag | Benchmark track F | 16 of 60 pass (first run 11). Remaining causes: a fair rewording that could not be linked to one passage ("no source found", 25 drafts) and a possible contradiction on a paraphrase (28 drafts). Making an unlinked reworded sentence a review question was tried and reverted: no gain, and it broke 4 tests that encode the rule that an unsourced statement is serious |
| Telling decisions that later failed from those that held up, from the decision text alone | Track D and the employment test | Only a procedural signal (p 0.0005); the record-quality signal did not reach significance (p 0.067); employment test 3 of 7 |

## Needs a person or money, not code

| Gap | Why it matters | What it needs |
|---|---|---|
| Every answer key was written by the developer | The main objection any buyer or rival will raise | An independent checker for a sample of keys (unpaid volunteer or paid reviewer) |
| No real-phone test | Pages are tested in emulated phones only | One person with a phone, about 15 minutes |
| Scanned PDFs are refused | Common in older records | OCR without outside code is not practical; a licensee would add its own OCR step |
| 18 New York court documents could not be downloaded (bot check) | Wider public-record coverage | A person downloading them by hand |
| No hidden test set | Public keys allow tuning to the test | An outside party holding a sealed set |
