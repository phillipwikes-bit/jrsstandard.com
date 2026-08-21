# Employment records article: submission memo

**INTERNAL. Do not send to a publisher and do not attach to the manuscript.** The
manuscript carries no venue line by design.

---

## 1. Byline, as it now stands

**Tanvi Pokhriyal first, Kyle McMullan second, Phillip Wikes last as senior author. Ubayet
Hossain, FRM, is a named Contributor rather than a co-author.** Changed 2026-08-21 on the
owner's instruction: the research is Pokhriyal's, so she leads.

**ONE COMMITMENT TO SETTLE BEFORE THIS GOES OUT.** Hossain was promised co-authorship in
writing, twice. `BusinessEthics_Article_Draft.md:10` reads "Co-authorship final on his
review and approval of this manuscript", and `Author_Review_Package_2026-08-01.md:58` reads
"Your co-authorship is final on your review and approval of this manuscript, **as we
agreed**." He also holds honor `H-2026-38`, whose public citation names him "a co-author of
the methodology."

Moving him to Contributor is the owner's call and the credit itself is undiminished: his
methodology is described in full in the byline block and again in Section 4. **But it walks
back a written promise that used the words "as we agreed", and he should hear it from
Phillip directly before he reads it on a title page.** The manuscript's declaration stub
requires him to confirm he accepts contributor credit. If he would rather keep
co-authorship, restoring him is a one-line change and the honor citation stays accurate.

**Stacyann Young is not an author here.** She is first author of the companion
public-records paper and is cited once, in the scope note. `scripts/verify_employment_article.py` asserts the byline positionally on every run and fails if the order changes or if Young reappears in it.

**Kyle McMullan is a co-author and Section 6.4 is his.** It is written out in full in the
manuscript with his four bracketed placeholder asks removed, because internal instructions
to a co-author cannot ship inside a submission. **His de-identified examples are still
wanted** and are the one thing that would materially improve that section.

---

## 2. Venue changed, and why the design objection goes away

**Primary: *ISACA Journal*.**

The design question and the venue question are the same question, and separating them was
my error.

**In an academic criterion-validity paper**, a reviewer who applies the review and also
records the outcome is a limitation that has to be confessed, because the claim is that one
measurement predicts an independent one. That framing forced a confession into the paper and
into a co-author email, and it was the wrong framing for this evidence.

**In a practitioner audit journal, a single-practitioner field pilot is the normal unit of
contribution, not a defect.** One qualified specialist works a real caseload, applies a
review, records what happened, and reports it. Nobody asks a Chief Audit Executive writing
up 22 examinations to have had a second examiner shadow every file. The paper now makes a
field-evidence claim at that level and says so throughout, so the design is stated in the
methods as what the study is rather than apologised for in the limitations.

| Criterion | ISACA Journal |
|---|---|
| Readership | Audit, governance, risk and control practitioners. **Kyle McMullan's Section 6.4, written by a former Chief Auditor of AML and Financial Crimes International at Citi, is aimed exactly here** |
| Claim level | Practitioner field evidence, which is what 22 cases from one specialist's caseload supports |
| Design fit | Single-practitioner pilots are standard contributed work at this venue |
| Cost | Contributed practitioner articles. **No article processing charge** |
| Collision | ISACA is the second alternate on the single-authored EDPACS piece, which keeps EDPACS as its primary. Conditional only |
| Authors | An HR practitioner, a Chief Audit Executive and a governance advisor is a natural author set for this readership, which it is not for a management-theory journal |

**Second: *EDPACS* (Taylor & Francis).** Same practitioner logic, real ISSN, indexed, and
`Backup_Article_EDPACS_DRR_Control.md:7` already records that it "explicitly publishes
contributed practitioner work on audit and control topics". If this paper takes EDPACS, the
single-authored DRR piece moves down its own ladder.

**Third: *Business Information Review* (SAGE).** Practitioner-academic bridge.

**Dropped: *Journal of Business Ethics*.** FT50 and ABS 4*, normative theory and large-scale
empirical work. It would desk-reject, and the version of this paper that could survive there
does not exist because the data does not support it.

**Dropped: *Records Management Journal*.** A peer-reviewed venue puts the paper back in the
frame where the single-practitioner design is a limitation to defend rather than the study's
form. It stays free for the EDPACS piece.

**Estimated acceptance: 65 to 80 percent at ISACA Journal.** Higher than any academic option
because the claim now matches the evidence and the design matches the venue's normal unit of
work. Reasoned judgment, not measured.

## 3. One thing found on 2026-08-21 that has to stay in

`bench_outcomes` stores **one `created_at` per case, not separate review and outcome
timestamps**. The protocol requires the review to be recorded before the outcome is
consulted, and the reviewer's practice was to do that, but **the sequence cannot be evidenced
from the system record.** The manuscript now says so in Section 5.1 and in the provenance
statement.

This is not a criticism of anyone's work. It is a database schema that was never asked to
carry the distinction. **A larger study should timestamp the two steps separately**, and the
manuscript says that too. Do not remove it: a practitioner reviewer will not care, and an
academic reviewer who found it later would care a great deal.

## 4. Portfolio, so nothing collides

| Piece | Venue | Status |
|---|---|---|
| "When the Record Cannot Speak for Itself" | CEP Magazine (SCCE) | **ACCEPTED 2026-07-16, November issue, in copy-editing.** Phillip solo. Do not duplicate at Compliance Today (`MASTER_TRACKER.md:580`) |
| Detection, international expert study | AI and Ethics | FINAL5, frozen |
| Arm B / comparison | AI and Ethics | Collision noted at `Article1_Submission_Plan.md:38` |
| Evidentiary Deficit (Colpan and Wikes) | Corporate Compliance Insights | Locked, blocked on headshots |
| DRR as a record-level control | EDPACS, then ISACA, then RMJ, then BIR | Single-authored |
| Rungs 1 and 2 | Journal of Responsible Technology | Per `Article1_Submission_Plan.md:42` |
| Public records, Young first | Journal of Civic Information | Cited by this paper in 6.3 |
| **This paper** | **ISACA Journal** | This memo |

## 5. Order of operations

1. **Ubayet Hossain, first and separately.** Tell him about the change from co-author to
   Contributor yourself, before he sees the title page. Then confirm Section 4 represents
   his methodology accurately, including the new condition-level agreement figures.
2. **Tanvi Pokhriyal.** Send `Email_Tanvi_Pokhriyal_2026-08-21.md`. It asks for her printed
   name, confirmation of Sections 5.1 and 5.2, both declarations, and her agreement to first
   authorship, in one reply.
3. **Kyle McMullan.** Send `Email_Kyle_McMullan_2026-08-21.md`. It asks for his printed
   name, his 6.4 pass, his optional de-identified examples, and both declarations, in one
   reply. His authorship condition is that pass (`BusinessEthics_Article_Draft.md:9`).
4. Replace the `[REQUIRED_ENV_PARAM]` block with their own words. Do not write it for them.
5. Confirm ISACA Journal's current contributed-article word range and submission route.
6. Submit.

## 6. What a reviewer will attack, and the answer

**"Your reviewer scored her own outcomes."** In a practitioner venue this is unlikely to be
raised at all, because it describes how field pilots work. If it is raised: the paper states
the design in Section 5.1 as what the study is, the claim level is set to match, and a
second reviewer is scoped into the next study. **Do not apologise for it and do not describe
it as a weakness.** It is the study's form.

**"You chose the coding that worked."** The paper says so itself, in Section 5.2 and again
in Section 9. All three codings are reported with equal standing and the null is among
them. That disclosure is worth more than the p-value it costs.

**"Your companion corpus found nothing."** Section 6.3 is the answer and the Woolf test was
run before the section was written, not after: Q = 2.550 on 1 df, p = 0.110. The two
corpora are statistically consistent. **A null in a companion study, reported and explained,
is a strength here rather than a liability.**

**"Reliability is below your own floor at condition level."** Conceded in Section 4 in
terms. The determination agrees better than any single condition composing it, no claim of
separate condition reliability is made, and the earlier per-condition discrimination
analysis is explicitly withdrawn as circular.

## 7. Do not

- Do not put the venue back into the manuscript.
- Do not restore the withdrawn per-condition analysis.
- Do not add Stacyann Young to this paper.
- Do not move Hossain to Contributor on the title page before he has been told directly.
- Do not reopen the pilot to reach 30 cases. It closed at 22 on 29 July and adding cases
  after the analysis is known is a worse defect than n=22.
- Do not submit this and the single-authored DRR piece to the same venue.
