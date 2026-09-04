# Outline: What We Learned When We Asked Sixteen Experts to Find It

**Working title.** Alternatives, in order of preference:
1. What We Learned When We Asked Sixteen Experts to Find It
2. The Record Reads Well. Can Anyone Tell?
3. Detectable, Unevenly: What a Reviewer Panel Found in AI-Assisted Records

**Target.** *CEP Magazine* (SCCE), a later issue. **Not November 2026**: that
issue carries *When the Record Cannot Speak for Itself*, accepted 2026-07-16 and
in copy-editing since 2026-07-21.

**Positioning against the accepted piece.** The November article names the
problem and gives compliance officers questions to ask. This one reports what
happened when the problem was measured, and it is written so it can be read
without having read the first. One sentence of callback, no recap.

**Author.** Phillip Wikes, MS. Bio line as printed in the accepted piece.

**Length.** 1,700 to 1,900 words, matching the accepted piece at 1,731.

**House format, taken from the accepted piece.** Short H2 sections, most of them
three to five sentences. A scenario cold open with no heading. A closing
"Takeaways" list. No subheads deeper than H2. No tables in the body: this
magazine's readers get the numbers in prose, and prose forces the qualification
to travel with the figure.

**Editorial stance.** The finding that sells this piece to a compliance audience
is not the accuracy number. It is the dispersion. A panel mean says the construct
is real; the spread says a single reviewer is not a control. The second is what
changes a program design, and it is what a magazine full of accuracy claims
will not have printed before.

---

## Cold open, no heading (approx. 180 words)

Reuse the shape of the accepted piece's opening, not its text. A compliance
officer has a file that reads well. She wants to know whether anyone can tell,
from the record alone, that the reasoning was never there.

Close the open on the actual question the study asked: give trained professionals
records built so that some carry their reasoning and some only appear to, tell
them nothing about which is which, and see what they find.

State immediately, in the open, that the answer has a boundary attached, and that
the boundary is the more useful half. This sets the contract for the piece and
stops a skimming reader carrying away a bare percentage.

## What was measured, and on what (approx. 200 words)

The corpus: 24 constructed AI-generated decision records, `corpus_split`.
Reviewers read them cold and blind to a reference classification fixed before any
scoring. `graded_reads` graded reads in total.

**Say the corpus is artificial in this section, not in a limitations paragraph at
the end.** A compliance reader who discovers it late feels handled. A reader told
at the point of first contact treats the rest as candid, which is the whole
reason the piece can be published under this author's name.

Name what a constructed corpus buys: a known answer, which is the only condition
under which detection can be measured at all. Name what it costs: records built
at the two ends of a range that real documentation occupies continuously.

## The result (approx. 180 words)

Panel accuracy `panel_accuracy` percent against the reference classification,
95 percent confidence interval `panel_ci`. Sensitivity `sensitivity` percent for
unsupported records, specificity `specificity` percent for grounded ones. The
threshold was fixed in advance and both parts of it were cleared.

Then, in the same section and before any implication is drawn, define the number:
it is the **mean of the individual reviewer scores**, not a pooled rate over
reads, and not an estimate of what a reviewer would achieve on a real file.

One sentence on why the definition matters to this audience: a pooled rate over
correlated reads would have produced a tighter interval and a more impressive
sentence, and it would have been wrong.

## The finding that should change a program (approx. 260 words)

**This is the centre of the piece.** Individual reviewer accuracy ranged
`reviewer_range` percent, standard deviation `reviewer_sd`. Six of the panel
scored 100 percent. The panel mean conceals that entirely, and at the point of
use the spread is invisible: an organization routing one record to one reviewer
does not know which part of the distribution it has drawn from.

Draw the consequence explicitly, because a compliance reader will otherwise draw
a weaker one: **group-level detectability does not license individual-level
reliance.** A control built on a single pass by a single reviewer inherits the
whole spread, not the mean.

Name the three design responses this licenses, and no others: reviewer
calibration, sampled double review, adjudication of disagreements. Say plainly
that the study supports the need for them and does not test whether they work.

Close the section on the honest version: this result argues for a review process
with redundancy in it, and argues against treating any single reviewer's read as
determinative. That is a smaller claim than "AI documentation risk is
detectable" and it is the one the data carries.

## Whether reviewers agreed with each other (approx. 240 words)

Distinguish agreement from accuracy in one sentence: two reviewers can agree and
both be wrong, so agreement is a property of the instrument, not of the answer.

Gwet's AC1 `ac1_expert` among invited experts and `ac1_trained` among regular
reviewers, on ten shared records carrying `labels_submitted` reduced to
`labels_analysed` after keeping one label per rater per record.

**Report the failure, in the body, in the same register as the success.** The
criterion had two parts: a point estimate of at least `ac1_floor`, and a lower
confidence bound of at least `ac1_required_lb`. The point estimates clear the
first. Neither clears the second: `ac1_expert_lb` for experts and `ac1_trained_lb`
for regular reviewers. A bootstrap interval puts the expert bound above the line;
that is reported as a sensitivity analysis and is not treated as satisfying the
pre-registration, because choosing the interval that clears a criterion after
seeing both is the practice pre-registration exists to prevent.

One short paragraph on why AC1 rather than kappa, pitched at a reader who has met
kappa in an audit context: when raters agree that most items fall in the same
category, kappa collapses toward zero while raw agreement stays high, so it ends
up describing the mix of categories more than the raters.

No verbal band. Do not write "substantial". The manuscript dropped that
characterisation and the piece must not reintroduce it.

## Was it the records or the reviewers? (approx. 200 words)

The obvious objection: maybe some records were simply easy. Answer it with the
analysis rather than an assurance.

A crossed mixed-effects model over all `graded_reads` reads put an average
reviewer on an average record at `model_intercept` percent. Reviewer variation
`model_reviewer_sd` against record variation `model_record_sd`, with a latent
scale reviewer intraclass correlation of `model_icc`.

Translate once, without the jargon: **on this corpus the variation that mattered
was between the people, not between the documents.** That is the same conclusion
the raw spread reaches, arrived at a second way, which is why it is worth the
paragraph.

Then concede it properly: this analysis was added after the pre-registration and
is exploratory, the record component is weakly identified, and its interval
`model_record_profile` permits a materially larger record effect than the point
estimate suggests.

## What this does not establish (approx. 160 words)

Four items, stated flatly, no hedging verbs:

1. No criterion validity against real records. Constructed stimuli only.
2. The five review conditions are not psychometrically validated. Whether they
   are distinguishable rather than redundant is an open question.
3. Nothing here tests whether any tool prevents the problem. This measures
   detection of a property of a finished record.
4. No compliance determination under any framework, and no measured effect on
   outcomes when a record is contested.

One closing sentence: each of these is a separate study, and the programme names
them rather than implying they are done.

## What a compliance officer can do on Monday (approx. 180 words)

Keep this operational and free of product. Three moves, each traceable to a
result above:

- Ask, of a sample of closed files, whether the record explains its own decision
  without the author present. That is the construct, and it needs no tooling.
- Where a review step exists, put a second reader on a sample of it rather than a
  first reader on all of it. The dispersion is the argument.
- Record what the reviewer looked at, not only that a review happened. A review
  with no trace has the same evidentiary weight as no review.

Point once, without a pitch, to the free field guides and the seven-point check
as places the question set is written out. One link, one sentence, at the end.

## Takeaways

Match the accepted piece's closing list. Five bullets, one line each:

1. Independent experts distinguished records that carry their reasoning from
   records that only appear to, at `panel_accuracy` percent against a key fixed
   before scoring.
2. The panel mean conceals a range of `reviewer_range` percent across individual
   reviewers, so a single reviewer is not a control.
3. Agreement among reviewers cleared the pre-registered point floor and missed
   the pre-registered lower bound. Both halves are reported.
4. On this corpus the variation was between reviewers, not between records.
5. The corpus was constructed and bimodal, so these figures describe a
   measurement condition, not field performance.

---

## Submission notes

- **Figures are keyed, not typed.** Every backticked key above resolves through
  `FIGURES.tsv`. Substitute values only at final draft, from that file, and run
  `python3 scripts/check_cep_prep_figures.py` before sending anything.
- **Disclosure.** The AI-use declaration added to the manuscript at audit applies
  to this piece too and must accompany the submission.
- **Co-author position.** The detection manuscript's second author has deferred
  rather than declined. Byline for this piece is single-author unless that
  changes, and the change would be the author's call, not an editorial default.
- **Do not submit while the November piece is in copy-editing** without telling
  the editor both exist. An editor discovering a second empirical piece from the
  same author in the queue is a relationship cost with no upside.
