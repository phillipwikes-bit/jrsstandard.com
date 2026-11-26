# Decision Spellcheck: blind-spot register

Started 25 November 2026; second round 25 to 26 November with a sealed hold-out (benchmark `FH_PROTOCOL.md`, `FH_RESULT.md`); third round 26 November with a second sealed hold-out (`FH2_PROTOCOL.md`, `FH2_RESULT.md`) and a review of what the serious flags are (`FLAG_REVIEW.md`). One line per gap a competitor, buyer or reviewer could point to: what it was, what was done, how it was measured, and what is left. "Seen" means the number was taken after changes made by looking at the same items, so it is not a clean test.

## Closed or narrowed in the tool

| Blind spot | What was done | Measured | Left |
|---|---|---|---|
| A changed amount, percentage, period or count passed unnoticed (word overlap cannot see "$5,000" become "$50,000") | New findings `NUMBER_MISMATCH` (serious) and `NUMBER_NOT_ESTABLISHED` (review). Figures read with what they count; the same value written another way ("thirty", "5,000 dollars", "45 percent") is not a change; figures compared in order inside a restated sentence | Track E, 40 passages from 32 public EEOC decisions not used before: first run 80/80 unchanged passed, 33/40 changes caught; after fixes 39/40 (seen). Number-diff baseline 16/40. 180 study 014 AI drafts: no new serious flag | Totals and worked-out figures ("four days after") not checked; a change to a figure that also appears, for the same thing, in a neighbouring sentence can be missed |
| Dates in British, European, abbreviated or ordinal form were not read ("3rd March 2024", "Sept. 5, 2023", "25/03/2024") | Date reader widened; all-number dates read only when they cannot be read two ways | Track A dropped dates named 238 to 244 of 265; unit tests | Dates without a year are used only to clear a date, not to raise one; relative dates not read |
| An all-number date that reads differently by country (03/04/2024) | New review finding `DATE_FORMAT_AMBIGUOUS`; the date is never guessed | Raised on 9 of 180 AI drafts, every one a real two-way date (for example 1/9/2014) | Review question only |
| A wrong date in a reworded sentence was only ever a review question | A date that appears nowhere in the source, cited to a passage that dates the matter differently, is `DATE_MISMATCH` (serious); a source date without a year ("On June 22, ...") counts as giving it. Round 2: a date one to three days from the cited sentence's date (with or without a year); a wrong date in a line's label or the heading above it; an impossible date (`DATE_IMPOSSIBLE`) | Track F changed dates caught 2 to 24 (round 1) to 29 of 34 (round 2, seen). **Sealed hold-out: 18 of 18** | 5 of 34 on track F still missed |
| A record in another language passed silently, because every check reads English words | New review finding `LANGUAGE_NOT_SUPPORTED`, raised when common words of another language outnumber English ones or most letters are not Latin script | Spanish, German, French and Chinese text reported; terse English notes not (the first version wrongly flagged 5 of 180 English drafts; fixed before commit) | English only. Checking other languages is not built |
| Double negatives read as negative ("did not fail to report", "not unreasonable"); one-word negatives missed ("unsure" against "not sure"); "did not request ... until August 5" read as a denial; an aside "(not a supervisor)" read as a denial; a heading phrased as a question read as a statement | Polarity reads these correctly | Track F good drafts clean 11 to 16 of 60 together with the next two rows (seen) | Paraphrased negation ("recovers more slowly" against "does not recover") still flagged |
| Round 2: "undisputed" against "did not dispute"; "denying" not read as a negative; "no denial" against "not denied"; a negation reaching past a comma; a negation about something the statement never mentions; the matching side of "but" and "and"; "S1 said no"; "denial of reasonable accommodation claim"; "failure to state a claim"; an outcome statement cited against a reported allegation (now a review question) | Polarity reads these correctly | Track F good drafts clean 16 to 24 of 60 together with the next row (seen). **Sealed hold-out: 0 of 30 before and after** | Did not carry over to formally reworded drafts |
| "was not the Nurse Manager" against "was the Nurse Manager" was cleared, because roles and names were left out of the negation test | A reversed "is / is not" of the same role is a contradiction | Track F negations caught 12 to 13 of 20 (seen); **sealed hold-out 0 of 10** | Inserted negations in reworded drafts are mostly missed. A word-by-word reversal test was tried and removed: good drafts 24 to 18 of 60 for 3 more catches, every false alarm a fair rewording |
| Writer's notes about the summary itself ("This summary uses only what the record contains", "No ROI page cites"), citation lines ("Source: Affidavit A, Bates No. 92"), clauses left over from a split, sentences split at "29 C.F.R. §", and reported findings ("The AJ therefore found that ...") treated as the writer's own claims or conclusions | Listed for the reviewer or read as reported facts | Part of the track F gain above | |
| "The Agency stated" and "the Chief stated" were not recognised as attributed speakers | Added to the speaker list used by study 014's anchor definition | Track A dropped speakers named 61 to 80 of 88; review questions on 180 AI drafts 36 to 58, no change in which drafts reach READY | 8 of 88 still missed |
| Headings, laws, documents and the adjudicator ("Procedural Background", "Rehabilitation Act", "Report", "the AJ") were treated as people, so a statement could be "about a different person" | The wrong-person check compares only people and organisations | Wrong-person flags on good drafts in track F: 13 to 6 drafts | Entity extraction itself is unchanged |

## Round 3 (26 November)

| Blind spot | What was done | Measured | Left |
|---|---|---|---|
| A word-for-word copy of a sentence made mostly of names and roles ("Complainant worked as a City Carrier Technician ... at the Village Station") scored no overlap and was "unsupported" | Names are compared too when they leave fewer than three words | Found in the flag review; part of the gains below | |
| A one-letter source title matched almost every sentence | Titles must appear as whole words and be at least four characters | Diagnostic setup only; benchmark numbers unchanged | |
| "was not employed as a Rural Carrier" against "worked as a Rural Carrier" was cleared | "employed" reads as "worked"; a negation that reaches a shared name or role is not cleared | FH inserted negations caught 0 to 6 of 10 (seen); FH2 2 of 10 (fresh) | Most inserted negations in reworded drafts still missed |
| Approvals told as events, "Accordingly," openers, judges granting motions or leave, lead-ins to lists, notes about the excerpt, spelled-out hundreds, two dates in one statement, ages given as bare numbers, "prevent", long "did not ... until" | Read as events, notes or the right figure | Track F clean 24 to 29 of 60 (seen); FH2 clean 4 to 7 of 30 (fresh, failed its criterion of 9) | |

## Round 4 (26 November; no fresh test set left, so measured on seen material only)

| Blind spot | What was done | Measured (all seen) | Left |
|---|---|---|---|
| A contradiction with a loose match was always softened to a review question, even "was not appointed" against "the Director appointed" | Stays serious when a plain "not" sits directly before a word the cited clause states without negation | FH2 inserted negations 2 to 3 of 10; FH2 changed sentences 19 to 21 of 30; one extra flagged statement on FH2 | 7 of 10 still missed on FH2 |
| "not insufficient", "not inadequate" were not reversed | Added to the double-negative list | Unit test | |
| A changed figure in the neighbouring sentence the statement restates ("available for download for 60 days" where the source says 30) was accepted when the new figure appeared elsewhere in the decision | Checked against the neighbouring sentence that gives the figure | FH2 figures 2 to 3 of 4 | Figures in bullet lists ("Sitting: 6 hours") are not read |
| The person reporting ("S1 stated that two coworkers ...") counted as a different subject | Left out of the wrong-person check | FH2 flagged statements 106 to 105 | |
| Tried and removed: a tie-break favouring the tighter of two equally scored passages | | Added flags on track F (61 to 64 statements) | |

## Measured openly, not solved

| Blind spot | Measure | Result |
|---|---|---|
| Clearing a good, long, reworded AI draft without a serious flag | Benchmark tracks F, FH and FH2. **FH2 (fresh): 7 of 30 pass; about one statement in ten flagged; of 20 serious flags read, 7 were real catches of added analysis** | Track F 24 of 60 pass after two rounds of tuning (first run 11). **Sealed hold-out FH: 0 of 30, before and after; failed.** On FH the serious flags come mostly from approvals narrated as events read as authority claims (24), "Accordingly," openers read as the writer's conclusions (10), and padded sentences the cited passage does not confirm (37); these were read after the run and nothing was changed for them. Earlier on F: Remaining causes: a fair rewording that could not be linked to one passage ("no source found", 25 drafts) and a possible contradiction on a paraphrase (28 drafts). Making an unlinked reworded sentence a review question was tried and reverted: no gain, and it broke 4 tests that encode the rule that an unsourced statement is serious |
| Telling decisions that later failed from those that held up, from the decision text alone | Track D and the employment test | Only a procedural signal (p 0.0005); the record-quality signal did not reach significance (p 0.067); employment test 3 of 7 |

## Needs a person or money, not code

| Gap | Why it matters | What it needs |
|---|---|---|
| Every answer key was written by the developer | The main objection any buyer or rival will raise | An independent checker for a sample of keys (unpaid volunteer or paid reviewer) |
| No real-phone test | Pages are tested in emulated phones only | One person with a phone, about 15 minutes |
| Scanned PDFs are refused | Common in older records | OCR without outside code is not practical; a licensee would add its own OCR step |
| 18 New York court documents could not be downloaded (bot check) | Wider public-record coverage | A person downloading them by hand |
| No hidden test set | Public keys allow tuning to the test | An outside party holding a sealed set |
