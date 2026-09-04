# Is the citation system correct, and did one of Stacy's cases end up in the employment study

**2026-08-24, revised.** Both corpora pulled from `bench_outcomes` and graded by
`scripts/build_case_citations.py`.

> **WITHDRAWN: my flag on Stacy's rows 28 to 32.** I said her paper described 32 FOIL cases
> without disclosing that five were compliance audits. **That was wrong. Her methods declare
> it.** `FOIL_Article_Draft.md:75` names all four document classes with counts: New York
> appellate and trial decisions 18, Committee on Open Government advisory opinions 7,
> Connecticut FOIC final decisions 2, compliance audits 5. **I checked all four counts
> against the database and every one matches exactly.** The audits are not an undisclosed
> inclusion; they are the basis of her convergent-validity finding at line 23, where all five
> received a Gap read and the Comptroller had independently recorded the same failure.
> **Nothing in her article needs changing on this point.**

---

## 1. Did one of Stacy's cases get mixed in

**No. Nothing was duplicated.** I compared all 54 rows. Her 32 public-records cases and the
22 employment cases share **zero** identical sources. Nothing of hers was copied across.

**But one employment case is a public-records document, and your instinct was right.**

Employment case 15 is **FOIL-AO-19774**, a New York Committee on Open Government advisory
opinion. Its record reads: *"A FOIL request for disciplinary records concerning a retired
law-enforcement employee ... Whether disciplinary records could be withheld in their entirety
merely because the employee had retired."*

**That is a public-records access question, decided by a public-records body.** It is about
employment records, which is why it is a close call rather than an obvious error, but the
forum and the legal question are FOIL, not employment.

**Stacy's corpus contains seven advisory opinions from the same series**: FOIL AO 19516,
19639, 19646, 19721, 19746, 19780 and 19854. Case 15 is FOIL AO 19774. **It sits numerically
in the middle of hers.** It was never copied from her set, but it is plainly the same kind of
document and it landed in the wrong study.

**What this costs you: nothing, and that is already proven.** Endnote 6 of the manuscript
recomputes the result with case 15 removed: 6 of 8 against 2 of 13, p = 0.0176, odds ratio
16.50, against p = 0.0073 on all 22. **The finding holds either way.** You can leave it in
with the disclosure, or drop it to n = 21 and report the cleaner number. Both are defensible;
leaving it in and disclosing it is the more conservative choice and is what the manuscript
currently does.

---

## 2. Is the citation system correct, in plain English

**Her system is correct. The employment system has two bad rows out of 22, and I had the
grader wrong about hers.**

### Stacy's 32 cases: all 32 locatable

Every one of her rows carries **a direct link to the primary source**: nycourts.gov for the
NY Slip Opinions, dos.ny.gov for the Committee on Open Government advisories, osc.ny.gov for
the Comptroller audits. **Anyone can click straight through to the decision.**

**My grader marked 15 of her 32 as weak, and that was the grader being wrong, not her data.**
It only recognised formal reporter citations, so it penalised a row for linking directly to
the decision instead of citing a volume number. **A working link to the primary source
locates a document at least as well as a citation does, and arguably better.** The grader now
accepts either. Her corpus grades **32 FULL, 0 PARTIAL, 0 NONE.**

**Two cosmetic things in her set, neither affecting whether a case can be found.** Row 10
reads "OIL AO 19746", a dropped F. Row 1 gives a description and a URL but no case name.
Neither is a defect in the evidence.

**One composition question in her set, which is hers to answer and not a citation problem.**
Rows 28 to 32 are **audits and reviews** rather than adjudicated determinations: four New York
State Comptroller FOIL-compliance audits and one New York City Comptroller review of the NYPD
body-worn camera programme. Her paper describes 32 real FOIL cases. **Five of them are audits
of FOIL compliance rather than determinations of FOIL requests.** That may be exactly what she
intended, since an audit finding is an outcome, but it should be stated in her methods rather
than left for a referee to notice.

### The employment 22: twenty are fine, two are not

| Grade | Count | Meaning |
|---|---:|---|
| FULL | 20 | Named decision with a reporter citation, docket or appeal-board number |
| PARTIAL | 1 | Case 5: *Jones v Vale Curtains and Blinds Ltd*, named but no tribunal case number |
| NONE | 1 | Case 4: identifies no decision at all |

**Case 4 is the only genuinely broken row in either study.** Its full record is a narrative
account of a capability dismissal with no party, no forum, no date and no case number
anywhere. **There is nothing to look up.** It cannot be cited because there is no identified
decision behind it.

**Case 5 needs one field.** The tribunal case number, the way case 3 carries "Case No.
2500506/2017".

---

## 3. Plain answer

**Your citation system is sound. Stacy's is the stronger of the two** because every row links
to the primary source, and my first grading of it was unfair. The employment set is good for
20 of 22, needs a case number for one, and has one row that cannot be cited at all.

**Nothing here threatens either finding.** The employment association survives removing both
weak rows, and that is already computed and disclosed in the manuscript.

---

## 4. What to do

| # | Action | Whose | Effort |
|---|---|---|---|
| 1 | Decide whether case 15 stays in the employment corpus or moves out | Yours | A decision, not work. Both defensible, both disclosed |
| 2 | Supply the tribunal case number for case 5 | Yours | One field |
| 3 | Resolve case 4: identify the decision, or drop it to n = 21 | Yours | The manuscript already reports both outcomes |
| 4 | Fix "OIL AO 19746" to "FOIL AO 19746" in row 10 of the public-records set | Mine, on your say-so | One character |
| 5 | State in Stacy's methods that 5 of the 32 are compliance audits rather than determinations | Hers to approve | One sentence |

**Items 4 and 5 are the only ones touching her study, and neither changes a number.**
