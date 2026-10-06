# Review Engine local candidate: failure-mode catalog and operator runbook

**Local development only.** Applies to candidate 0.4.0-local.1, with a mocked model and constructed data. Nothing here authorises a provider call, a real record or any deployment (`docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`).

## 1. What causes refusal (status `refused`; the adapter is never called)

| Reason | Cause |
|---|---|
| `out_of_scope_record_type` | The profile is not `supplier_access_exception` |
| `draft_not_completed` | The profile is not `completed` |
| `hr_status_not_declared_false` | `hr_related` is not exactly `false` |
| `unreadable_input` | The input is not text or is empty; or it contains NUL bytes, replacement characters, control characters, mis-decoded text, or mostly non-letter content |
| `record_too_short` / `record_too_long` | Under 40 or over 8,000 characters. Over-length text is refused, never truncated. |
| `excluded_domain_*` | Wording indicating employment, housing, lending, insurance, medical or legal-outcome decisions. A word-list screen: it can only refuse. |
| `partial_input` | Pages missing, a trailing ellipsis, a truncation marker, an unclosed quotation, or a final line that is cut off (a long unpunctuated prose line, or one ending on a word such as "the") |

## 2. What causes review-incomplete (status `incomplete`; no model finding is used)

| Reason | Cause |
|---|---|
| `adapter_output_rejected` | The output broke the adapter contract. Every reason is listed in `rejection_codes`, for example: not JSON, unknown fields, numbers, determination language, a missing or invalid condition, a missing or non-exact quotation, a mismatched explanation id or identity, or output that calls itself incomplete. |
| `model_call_failed` | The adapter threw. Its error text is never copied into the result. |

The consistency harness (`harness.js`) marks a record `review_incomplete` when any of these occurs:
- a variant is rejected;
- one condition is pass in one variant and gap in another;
- a pass condition sits alongside a finding of its own category;
- a preparation finding is dropped;
- the text, the record reference, the identity or the input is altered;
- a repeat run differs;
- a refused record reaches the adapter.

## 3. What always requires a human reviewer
- **Every result.** `human_review.required` is always true.
- **Each extraction finding and contextual finding** carries a pending disposition. Only a named person can record `confirmed`, `not_confirmed` or `needs_more_information`.
- **Sign-off** is a separate act by a named person, refused while anything is pending. It is not an access decision and not a validation.
- **Every `possible_development_material` result** from the contamination screen.
- **Every `instruction_like_text` finding**: is it genuinely record content?

## 4. What the candidate intentionally cannot determine
- Whether an access exception should be granted, or whether a record is "ready", "approved", "defensible" or "compliant".
- Any score, rate, DRR figure or overall verdict.
- Any correspondence to the JRS Codebook. Explanations are candidate-internal (D-2, D-3).
- Anything about a person: emotion, intent, motive, payoff, credibility or clinical condition. Model text of that kind is withheld.
- Whether a record is complete or truthful. Source-preparation checks are heuristics over the text: a finding means a pattern was seen, and no finding proves nothing.
- Whether a text is new. The contamination screen misses heavy paraphrase.

## 5. Evidence a future provider-enabled run would need to preserve
This is out of scope until the owner authorises provider calls. For each call, it would need to keep:
- **The full review identity:** candidate, source-preparation, explanation-set and contract versions; the prompt version and hash; the adapter contract; the model id and version; and the source hash.
- **The request:** prompt hash, `max_tokens`, and the fence tag. The record text may be kept only if the data-handling rules then in force allow it.
- **The raw adapter output and its validation result**, accepted or rejected with reasons. Keeping it needs a retention decision.
- **Run conditions:** the time, the provider's reported model, and stop or usage metadata.
- **The disposition history and sign-off**, with each reviewer's identity.
- **Any harness record** for repeated variants, and the `result_digest`.
- **Evidence that the input passed the contamination screen,** and that it is not development material.

Reproducibility must be measured, not assumed (CLAUDE.md section 21).

## 6. Recovery steps

| Situation | What to do |
|---|---|
| Malformed output (`not_json`, `not_an_object`, `adapter_reported_incomplete`) | Treat the review as incomplete. Re-run once with the same adapter version, then record both attempts. Never repair, trim or partly accept the output. If it recurs, the adapter or prompt needs a new version, which changes the review identity. |
| Missing or non-exact quotation (`missing_quotation`, `quotation_not_in_record`) | The whole output is rejected. Do not search for the "intended" passage. Re-run, or have a person review the record directly. A fabricated quotation is itself worth recording as an adapter defect. |
| Contradictory variants (`contradictory_classification`, `internal_contradiction`) | The record is review-incomplete. Show both variants to a person; never pick the majority or the latest. If it recurs on constructed data, record it against the prompt version. |
| Partial source text (`partial_input`) | Obtain the complete record and submit it again. Never examine the fragment, and never append text to make it pass. Check the reported truncation codes against the original. |
| Unreadable source (`unreadable_input`) | Re-export the record as plain UTF-8 text from its original system. Do not hand-clean replacement characters. |
| Contamination warning (`exact_match`) | The text is development material. It must not enter any holdout or evaluation of real-world performance. Remove it. |
| Contamination warning (`possible_development_material`) | A person compares the text with the named development source. If it is a copy or a close edit, remove it. If it is genuinely new, record that judgement and why. The screen's share figures are similarity measures, not probabilities. |
| Integrity failure (`result_integrity_failed`) | Something was copied between review versions, or a finding was edited. Discard the result and re-run. Never carry a disposition across versions. |

## 7. Commands
- `node tests/engine-candidate/run-all.mjs` runs everything.
- `--quick` skips the mutation run.
- See `README.md` for the individual runners.
