# LinkedIn recommendation: Aigul Moiseeva (CGEM AI Safety, Kazakhstan)

*Requested by the recommendee on 2026-08-16 through the optional incentive block at the end of the reviewer evaluation (`source: reviewer-eval-incentive`, `detail: "Wants a recommendation written"`). That request is the consent for this one artifact. It is not general consent to be listed publicly: `consent_public` is **false** on both of their rows, so they did not tick "list my name publicly as a JRS-trained reviewer" on `reviewer/evaluation.html:132`. Do not add them to any public reviewer list.*

*Pronouns are not on file. Written pronoun-free throughout. Confirm before posting.*

---

## VERIFIED BEFORE WRITING

`python3 research/verify_participant.py "Aigul Moiseeva"`

| Fact | Value | Source |
|---|---|---|
| Records reviewed | **0** | `records_run` on both rows, `/api/people-9dd1ecdf6f8cdfd4` |
| In the detection study | **No** | absent from `pilot_progress` (27 rows) |
| `check_completion.py JRS-R-DOGUUVV9` | **NO ROW. Do not issue recognition** | mandatory gate, CLAUDE.md VIII |
| Submitted the reviewer evaluation | **Yes**, 2026-08-16 05:42 UTC | `reviewer-cert` + `reviewer-eval-incentive` rows |
| Questions answered | **8 of 9** | `reviewer_evaluation_funnel.mean_questions_answered = 8`, `completed_all_questions = 0` |
| Completion code | `JRS-R-DOGUUVV9` | `completion_code` |
| Certificate | **Already available and rendered once** | `certificate_renders.reviewer = 1` |
| Training enrolment row | **None** | no `training-enroll` row |
| Training completion row | **None** | no `training-complete` row |
| Organization | CGEM AI Safety | `organization` on the `reviewer-cert` row |
| Country | Kazakhstan (KZ), captured at submission | `country_source: captured` |
| LinkedIn | https://www.linkedin.com/in/aigul-moiseeva-b71006406 | `linkedin_url` |

**THE 18 IS NOT THEIRS.** The "18 RECORDS" tile on the programme status page is `d.total_rows` (`programme-status-9872fb93cc94.html:1496`): 18 rows in the private contact table across 12 people. Aigul Moiseeva holds 2 of those 18 rows. Neither is a record review.

**WHAT THIS RECOMMENDATION MAY NOT SAY**, because the data does not support it: that they reviewed any record, graded records against the answer key, sat on the international detection panel, are one of the 58 independent experts, completed a 24-record set, or completed the six-module training.

**What is left is real and is enough.** They found the programme, opened the evaluation, submitted it, and asked for both artifacts on the same day, from Kazakhstan, which is the first submission the evaluation has received from anywhere.

---

## THE RECOMMENDATION

> Aigul completed the Justification Review Standard reviewer evaluation in August 2026, working through it independently and unpaid, with nothing riding on the outcome.
>
> The evaluation is not a quiz with a score. It asks a working professional to describe, honestly, how consequential records actually get reviewed where they are: how many people read a record before it becomes final, whether a second reader exists at all, whether the basis for a conclusion gets written down at the time it is reached, and whether AI-assisted drafting is governed by anything written. Those are uncomfortable questions to answer accurately about your own environment, and the value of an answer depends entirely on the respondent declining to give the flattering version.
>
> Aigul's submission is the first this evaluation has received, and it arrived from Kazakhstan, which matters more than it may sound. A standard about documentation defensibility that has only been examined inside one legal culture has not really been examined. The assumptions a reader brings about what may be left implicit, what counts as an adequate citation, and what a reader is presumed to already know are precisely what an unreconstructable record relies on to look complete. Those assumptions differ by jurisdiction and by professional tradition, and the only way to find that out is for someone outside the originating one to engage with the material seriously.
>
> Aigul's work at CGEM AI Safety sits on the question this evaluation was built around: whether a record produced with AI assistance still carries the evidence for its own conclusion, or only the appearance of it. That is not an abstract concern in AI safety practice. It is the difference between a governance control that can be audited afterwards and one that cannot.
>
> I would work with Aigul again, and I would recommend anyone building AI governance capability to speak with them.
>
> Phillip Wikes
> Creator, Justification Review Standard

*Character count: 1,966. LinkedIn's limit is 3,000.*
*No em-dashes. No banned filler. No claim of record review, panel membership, training completion, or accreditation.*

---

## THE CERTIFICATE

**They already have it. Do not create a second one.**

The certificate is self-serve. `api/reviewer-cert.js` renders it from the completion code, and `certificate_renders.reviewer = 1` confirms one has been rendered. Aigul is the only holder of a `reviewer-cert` contact row, so that render is theirs.

**Their link, unchanged:**

```
https://www.jrsstandard.com/api/reviewer-cert?code=JRS-R-DOGUUVV9&name=Aigul%20Moiseeva
```

`research/build_certificate.py` is **not** the right tool here and was not used. Its registry is the 24-record study completers, and adding a non-completer to it would put an unearned certificate into the canonical issued template.

### A defect was found while checking this, and it was corrected

The certificate said the holder **"completed the six-module JRS Reviewer Training and submitted the reviewer evaluation"** (`api/reviewer-cert.js:27`, before this change).

The training half of that sentence is not supported. The `JRS-R-` code is issued by `/api/reviewer-eval` on submission of the evaluation, and the evaluation is reachable without enrolling in the training at all. Aigul has no `training-enroll` row and no `training-complete` row. The four people with training completions on the roster are Joseph Munge, SungSoo In, Andrey Ekhmenin and Nicholas Evans, which is the "4 COMPLETED TRAINING" tile.

So the one rendered certificate asserted a credential the database contradicted. **That is the exact defect class this programme measures in other people's records: a document stating a conclusion its own evidence does not support.**

Corrected on three surfaces:

| File | Was | Now |
|---|---|---|
| `api/reviewer-cert.js` | "completed the six-module JRS Reviewer Training and submitted the reviewer evaluation" | "submitted the JRS reviewer evaluation" |
| `reviewer/index.html` | "The certificate records that you completed the training and submitted the evaluation." | "records that you submitted the reviewer evaluation... It does not certify that you worked through the six modules, because nothing here checks that you did." |
| `reviewer/completion.html` | share snippet: "I completed the JRS Reviewer Training and Certificate: six modules..." | "I submitted the JRS reviewer evaluation: a baseline on how consequential records are actually reviewed in practice..." |

Guarded by `check_certificate_claims_supported` in `scripts/check_zero_drift.py`, adversarially tested against all three restorations plus a control confirming the correction comment quoting the old wording does not trip it.

**Aigul's certificate will now render with the corrected wording.** They rendered the old one before the fix; if you want them to hold the accurate version, send the link again.

---

## OPEN ITEMS FOR THE OWNER

1. **Title is blank.** No title on file on either row. The recommendation avoids asserting one. If you want a title in it, ask them.
2. **`consent_public` is false.** They asked for a recommendation but did not consent to public listing. Post the recommendation to their profile; do not add them to any public reviewer roster.
3. **8 of 9 questions.** `completed_all_questions` is 0. Not a defect and not mentioned in the recommendation, but it is why the funnel shows a submission with no completion.
4. **`submit_to_contact_pct: 200`.** One submission produced two contact rows, because they asked for both artifacts. The percentage is arithmetically correct and reads oddly at n=1. Worth a denominator note on the funnel if it is ever shown to a buyer.
