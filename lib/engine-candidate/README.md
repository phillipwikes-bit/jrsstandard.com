# Review Engine local development candidate 0.2.0-local.1

**Status:** local development only. Not deployed, not validated, not a public service. Owner instructions of 2026-10-06, under `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`.

## Files
| File | Purpose |
|---|---|
| `review-candidate.js` | Scope gate, injected model call, output checks. Rebuilt from historical commit `d2da83c` (`api/review-engine.js`, 0.1.0-validation). |
| `source-prep.js` | Deterministic source preparation, run before any model call. |
| `explanations.js` | Human-review explanation for every flagged condition, flaw and extraction finding. |
| `contract.js` | Versioned result contract (`jrs-candidate-result/0.2.0`), human disposition and sign-off. |
| `dev-material.js` | Holdout-separation control: hashes of every development and test text, and a check any future holdout builder must call. |

None of the five has network access, reads an environment variable or writes anything. The model call is a function the caller supplies, and there is no default. `lib/` is excluded by `.vercelignore`, and no file under `api/` imports these modules.

## Scope
- Completed, non-HR supplier-access exception drafts only. The caller must declare `record_type: "supplier_access_exception"`, `completion_status: "completed"` and `hr_related: false`.
- Records that mention employment, housing, lending, insurance, medical or legal-outcome decisions are refused. This screen is a word list: it can only refuse, and passing it does not show a record is in scope.
- Human review is always required. There is no overall verdict and no score.

## Order of checks
1. Declared profile.
2. **Unreadable input** is refused: not text, empty, NUL bytes, replacement characters, control characters, mis-decoded text, or mostly non-letter content.
3. Length (40 to 8,000 characters). An over-length record is refused, never truncated.
4. Excluded decision domains.
5. **Partial input** is refused: missing pages ("page 1 of 2"), a mid-sentence ending, a trailing ellipsis, an explicit truncation marker, or an unclosed quotation.
6. Reported, not refused:
   - **omissions:** placeholders, material referred to but not in the record, and expected profile elements not found;
   - **unsupported content:** off-record references and assertions presented as self-evident;
   - **every quotation**, with its exact offset, line and column.
7. The injected model call.
8. Output checks. Each of these becomes an extraction finding, and none is shown as a result:
   - a quotation not in the record;
   - a flaw type outside the permitted list;
   - text describing a person (emotion, intent, motive, payoff, clinical), which is withheld;
   - a missing or invalid condition, or a cut-off or non-JSON reply, which makes the result incomplete.

Every source-preparation check is a heuristic over the text: a finding means a pattern was seen, and no finding is not proof that nothing is wrong.

## Result contract (`jrs-candidate-result/0.2.0`)
- **`review_identity`:** the contract, candidate, source-preparation and explanation-set versions, the prompt hash, the model and the source commit. `review_id` is a hash of all of these plus the source. The examination time is outside the identity.
- **`extraction_findings`** (`X-nnn`) are deterministic and come from source preparation and output checks.
- **`contextual_findings`** (`C-nnn`) are model-derived: flagged conditions and documentation flaws, each flaw with its exact location.
- **`human_review.disposition`:** one entry per finding, starting `pending`, with an append-only history. `recordDisposition()` returns a new result and never changes the old one. A disposition carries a `review_id` and is refused on any other review version. Output-check findings are informational and need no disposition.
- **`human_review.sign_off`:** a separate final act, refused while any finding is pending. It keeps every disposition and closes further ones. It records a named person reviewing every finding; it is not an access decision and not a validation.

## Explanation categories (candidate-internal)
The five categories are a review aid for this candidate only:
- missing logical bridge;
- missing identifiable basis;
- chronology gap;
- unsupported conclusion;
- insufficient evidence.

They are **not** a mapping to the JRS Codebook. Under `docs/enterprise-diligence/CODEBOOK_API_CORRESPONDENCE_REVIEW.md` (D-2, D-3) the Codebook is the authority, and `cold_reviewer_clarity` has no established correspondence. That key therefore gets its own explanation and no category, and every explanation carries `codebook_correspondence: "not_asserted"`.

## Changes from d2da83c
- **Removed:** the HTTP route, token auth, CORS, the rate limit and the Supabase write.
- **Truncation:** an over-length record is now refused; the old code cut it silently.
- **New refusals:** partial and unreadable input, before any model call.
- **Removed outputs:** the overall determination ("ready" and the rest) and every number. Only positions and sizes remain.
- **Renamed:** `compliant_version` is now `revision_needed`.

## Source-preparation regression set (constructed records only)
`tests/engine-candidate/regression/cases.json` holds 24 constructed cases. Their expected findings were committed (`fd6a58a`) before the checker was first run on them. Seven are hard cases, written where the heuristics were expected to be wrong.

First run, against `source-prep/0.1.0`:
- **Overall:** 18 of 24 cases match their expectations.
- **Ordinary cases:** 17 of 17 match.
- **Hard cases:** 1 of 7 match.

The six divergences are recorded in `KNOWN_DIVERGENCES.json` and are not fixed:
- **Five false alarms:**
  - "clearly printed" is flagged as an unsupported assertion;
  - a complete record ending without a full stop is refused as partial, the one false refusal;
  - an ordinal date ("June 9th") is not recognised;
  - an attachment reproduced in the record is still reported as missing;
  - "asked for" is not recognised as a request.
- **One miss:** "per the phone call" is not caught.

One case, R02, is right for the wrong reason: its basis is recognised only because the word "given" appears in "Approval was given". A fix tuned on these same cases would only show that it fits them, so any fix must also be checked on new cases written before the fix is run. The runner fails if any divergence appears, disappears or changes.

These counts characterise the heuristics on 24 hand-written cases. They are not error rates for real records, and they say nothing about the model step.

## Not established
- Accuracy, on any record.
- Whether the prompt behaves as instructed on a real model. No provider has been called.
- The error rates of the source-preparation heuristics on real records. Only the 24 constructed cases above have been run.
- Whether the holdout-separation check is sufficient. It catches exact and whitespace-only copies, not edited ones.
- Fitness for any use. Release gates: none passed (handoff, "Release-gate status").

## Tests
Run `node tests/engine-candidate/run-all.mjs`. It covers:
- `source-prep.test.mjs`: 35 checks;
- `contract.test.mjs`: 29 checks;
- `candidate.test.mjs`: 91 checks;
- `dev-material.test.mjs`: 8 checks;
- `regression/run.mjs`: the 24-case regression set.

All use a mocked model with `fetch` trapped, on constructed fictional records in `tests/engine-candidate/fixtures/`. Development and test material here must never be used in a sealed holdout.
