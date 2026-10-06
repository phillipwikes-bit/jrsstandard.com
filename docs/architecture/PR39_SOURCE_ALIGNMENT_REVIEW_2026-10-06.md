# PR #39 source-alignment review

**Date:** 2026-10-06. **Branch:** `claude/engine-local-candidate-2026-10-06`, reviewed at `5870042`, base `main` `97087e9`. **Status:** review document. It changes no Engine code, guard, public page, route or setting.

## Labels used
- **VERIFIED:** inspected in the repository or run in this session.
- **SOURCE-REPORTED:** stated in the controlling materials available to this review (see below), not independently verified.
- **PROPOSED:** a recommended future action. Nothing has been done.
- **UNRESOLVED:** needs an owner decision or evidence not available here.

## Controlling sources: availability (VERIFIED)
The three 3 October source-aligned documents could not be read, so this review is **NOT ASSESSED against their text.** Searched on 2026-10-06:

| Location | Result |
|---|---|
| Repository, every branch and full history (the clone is shallow: 114 commits, earliest 2026-09-21) | Not found |
| Container files under `/root`, `/home`, `/tmp`, `/mnt`, `/srv` and `/var/tmp`, by SHA-256 | No file matches any of the three hashes recorded in the handoff |
| `/mnt/user-data/uploads` and `/mnt/attach` | Empty |
| Session upload folder (`/root/.claude/uploads/`) | Only the **1 October** "Revised" versions of the asset register, evidence ledger, chain of title and buyer checklist. Their hashes do not match, and they predate 3 October, so they are not used as controlling. |
| Google Drive, by title and full text | Not found. The connector works, and its newest file is dated 2026-09-22. |
| The owner's claude.ai artifacts | Not found |

**Controlling basis actually used:**
1. `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md` (VERIFIED, read in full).
2. The "non-negotiable current position" in the owner's instruction of 2026-10-06 (SOURCE-REPORTED, owner statement).
3. Owner decisions recorded in the repository, in particular D-2 and D-3 in `docs/enterprise-diligence/CODEBOOK_API_CORRESPONDENCE_REVIEW.md` (VERIFIED).

Every disposition below should be re-checked once the 3 October text is available.

## Review table

| PR file / component | What changed | Controlling source requirement | Alignment status | Evidence or limitation | Recommended disposition |
|---|---|---|---|---|---|
| `lib/engine-candidate/review-candidate.js`: scope gate | Refuses anything that is not a completed, declared non-HR supplier-access exception, and refuses excluded-domain wording | Scope is completed non-HR internal compliance records, initially supplier-access exceptions; employment, housing, lending, insurance, medical and legal-outcome decisions excluded (owner position; handoff, "Current Engine scope") | ALIGNED | VERIFIED: `candidate.test.mjs` refusal checks; mutation M09. The candidate is narrower than the permitted scope (supplier-access only), which is within it. The domain screen is a word list: it can only refuse. | Keep |
| `review-candidate.js`: `SYSTEM_PROMPT` lines 66 to 72 | Reference prompt for any future adapter | No Engine-to-Codebook mapping without a versioned correspondence record (handoff, "Prohibited work"). D-2: `cold_reviewer_clarity` is "not an additional JRS condition … not equivalent to another JRS condition". D-3: the Codebook is the authority. | **CONFLICT** | VERIFIED: line 66 reads "against five JRS documentation review conditions" and lists all five engine keys, `cold_reviewer_clarity` included. The descriptions came from `d2da83c`. Line 70 gives `accountability_support` the Evidentiary Sufficiency question ("Is the evidence in the record sufficient to support the conclusion?"), but the correspondence review records that key as UNRESOLVED (it is listed against Decision-Process Traceability). The prompt therefore asserts a correspondence the record says is unresolved. No live model has received it. | **Revise before merge.** Exact replacement for line 66: `You examine one completed supplier-access exception draft for record-level documentation flaws, using five candidate review keys. These are implementation keys of this local candidate. They are not the JRS Codebook conditions, and no correspondence to the Codebook is asserted:`. Describe the keys as candidate definitions only, so no description restates a Codebook condition. Bump `PROMPT_VERSION`. |
| `review-candidate.js`: inference screen | Withholds model text about emotion, intent, motive, payoff, credibility or clinical condition, and records the withholding | Record-level documentation conditions only; no inference about emotion, intent, motive, hidden payoff, credibility or clinical condition (owner position; handoff) | ALIGNED_WITH_LIMITATION | VERIFIED: one test per group in `candidate.test.mjs`; mutation M08. The screen is a word list, so a model could describe a person in words it does not list. | Keep. Record the word-list limit in the README (PROPOSED). |
| `source-prep.js` (0.3.0): partial and unreadable input refusal | Refuses before any model call; never truncates | Never review partial text (handoff, "extraction-failure, omission, truncation") | ALIGNED | VERIFIED: source-prep, privacy and metamorphic tests; mutations M10, M20, M21 and M55. These are heuristics: a complete record can still be refused (one such case was fixed in 0.3.0), and an incomplete record that looks complete would pass. | Keep |
| `source-prep.js`: quotation anchors | Exact offset, line and column for every quotation and located finding | Exact quotation behaviour; **exact quotation presence does not establish semantic support** (owner position) | ALIGNED_WITH_LIMITATION | VERIFIED: anchors are exact (metamorphic tests; mutation M60). An anchor proves only that the words are in the record, not that they support the finding. | Keep. Add that sentence to the README and the packet (PROPOSED; see the wording items below). |
| `adapter.js` and `mock-adapter.js` | Fail-closed adapter contract; mock only; no live provider | No provider calls (handoff); no score or verdict (owner position) | ALIGNED | VERIFIED: 65 adapter checks; mutations M01 to M06; no network imports (privacy tests M16 to M18). "Exact quotation" is checked as a character-exact substring only. | Keep |
| `contract.js` (0.3.0): identity, dispositions, sign-off | Review identity hash; per-finding `review_id`; `result_digest`; disposition separate from sign-off | Human review always required; no overall verdict (owner position; handoff) | ALIGNED_WITH_LIMITATION | VERIFIED: contract, metamorphic and packet tests; mutations M23 to M26 and M49 to M51. The digest catches copying and editing but is **not authentication**, as stated in code and tests. | Keep |
| No scores or verdicts (whole candidate) | No number except positions and sizes; no determination field; determination wording rejected | No numerical DRR score or overall "ready" verdict (owner position; handoff) | ALIGNED | VERIFIED: `scoreAudit` across results and packets; mutation M26. | Keep |
| Privacy, persistence, logging and network isolation | Candidate imports only its own modules and `node:crypto`; tests capture disk, logs, errors and network | A written policy is not proof that the underlying control operates (owner position) | ALIGNED_WITH_LIMITATION | VERIFIED: 24 privacy checks pass in this container, against mocked runs. They show how **this code** behaves here. They are **not** evidence of any operational privacy, retention, backup or deletion control, and none is claimed. | Keep. Name the suite "isolation tests" in future text (PROPOSED). |
| Constructed corpus (15 records), regression set (24), confirmation corpus (47) | Expectations committed before the code they test; all labelled development-only | Development, constructed and holdout material strictly separated (owner position; handoff) | ALIGNED_WITH_LIMITATION | VERIFIED: commits `fd6a58a`, `804f313` and `759ea86` precede the code they test. Limits: the same author wrote the confirmation cases and the 0.3.0 rules. Confirmation case K21 reuses a regression sentence; this is recorded and pinned. All results are constructed-development evidence only. | Keep |
| `contamination.js` and `dev-material.js` | Exact, whitespace and shingle-similarity screen of 89 development texts; possible matches for human review | Strict separation from sealed holdouts (handoff) | ALIGNED_WITH_LIMITATION | VERIFIED: 29 contamination checks; mutations M37 to M41, M62 and M63. Paraphrase is missed; thresholds are judgement, not measured. No holdout builder exists, so nothing yet **enforces** separation; the screen only detects. | Keep. Correct the ARCHITECTURE wording (done in this commit; see below). |
| `reviewer-packet.js` | Machine-readable packet; anchors re-checked; nothing hidden; no verdict | Human review required; no verdict or recommendation (owner position) | ALIGNED_WITH_LIMITATION | VERIFIED: 37 packet checks; mutations M43 to M48. The packet contains record quotations, so it is as confidential as the record (stated in code). The condition entries say "supporting quotations, if any, are on the flaw findings" (line 82), which could be read as semantic support. | Keep. Replace line 82 with: `A condition concerns the record as a whole. Quotations, if any, are on the flaw findings; a quotation's presence in the record does not show that it supports the finding.` (PROPOSED code text; not changed in this task.) |
| `harness.js` | Consistency harness, 13 failure codes | A software control, not reliability evidence (owner position) | ALIGNED_WITH_LIMITATION | VERIFIED: 25 harness checks; the harness labels itself in its own output. The code `unsupported_quotation` means "quotation not in the record", but the name could suggest a semantic judgement. | Keep. Rename to `quotation_not_in_record` in a later version (PROPOSED; non-blocking). |
| Manifest decision (`manifest-compat.test.mjs`, ARCHITECTURE "Manifest") | Candidate left disconnected; library unchanged | Do not force a candidate result into the existing schema (owner instruction) | ALIGNED | VERIFIED: the schema requires `routing` and `engine.api_version`, and `additionalProperties` is false. `buildManifest` refuses; the test shows each point. | Keep |
| `explanations.js` | Five candidate-internal explanation categories, `codebook_correspondence: 'not_asserted'`, and `cold_reviewer_clarity` given no category | No Codebook mapping without a versioned correspondence record (handoff; D-2, D-3) | ALIGNED_WITH_LIMITATION | VERIFIED: the code states that no correspondence is asserted. `CONDITION_CATEGORY` still pairs `accountability_support` with "insufficient evidence", which mirrors the prompt description in the CONFLICT row above. | Revise together with the prompt: keep the categories, but derive each pairing from the candidate key definitions, not from Codebook wording (PROPOSED). |
| `lib/engine-candidate/README.md`, `ARCHITECTURE.md`, `RUNBOOK.md` | Documentation of commands, limits and failure modes | No claims of validation, production, privacy execution or commercial readiness (owner position) | ALIGNED_WITH_LIMITATION | VERIFIED by reading. One inaccuracy: ARCHITECTURE said the two modules "keep development texts out of any holdout". Two omissions: the README does not say that an exact quotation is not semantic support, and does not say the inference screen is a word list. | ARCHITECTURE corrected in this commit (wording below). README additions PROPOSED. |
| `research/MASTER_TRACKER.md` and `research/IP_SALE_TRACKER.md` entries dated 2026-10-06 | Dated entries | Factual entries only | ALIGNED | VERIFIED by reading. They report test counts as counts and say "not done" for provider calls, real records, holdouts and public changes. | Keep |
| `.jrs/reports/*_2026-10-06.md` and `BLOCKERS.json` addenda | Earlier guard proposal and claim report; B-010 and B-016 addenda | Preserve history; record unresolved authorization (owner instruction) | ALIGNED | VERIFIED: neither blocker status changed. The earlier reports are superseded in substance by the three new `docs/architecture/` packages but are kept as history. | Keep |
| PR #39 description | Summary and test plan | No implied validation, production or readiness | ALIGNED | VERIFIED: it says "Not validated. Not deployed. No provider has been called" and "Keep as draft". | Keep. Add the D-2 conflict once known (done when this commit is pushed). |
| Eval records (`tests/engine-candidate/eval/records/*.json`) | Versioned JSON outcome records | Constructed-development evidence only | ALIGNED | VERIFIED: each carries the label "CONSTRUCTED-DEVELOPMENT EVIDENCE ONLY … Not a measure of accuracy, reliability or validity". | Keep |

## Package D: claim-discipline check (VERIFIED by reading every new document and code comment)

| Improper claim | Found? | Where checked |
|---|---|---|
| Independent validation | No. Every document says "not validated" and calls the confirmation corpus not independent in authorship. | README, ARCHITECTURE, tracker, PR description |
| Real-world performance or real-provider behaviour | No. "No provider has been called" is stated throughout. | Same |
| Engine accuracy, reliability, robustness or operational validity | No. Counts are given as tallies over constructed cases, "not rates". | Regression and confirmation runners, eval label |
| Commercial readiness | No | All new files |
| Execution of privacy, retention, backup, deletion or security controls | No. Isolation tests are described as tests of the candidate code. The RUNBOOK says a retention decision is still needed. | README, RUNBOOK |
| Independent holdout evaluation | No. "Never a sealed holdout" is stated in every corpus. | Corpus `INDEX.json`, confirmation `cases.json` |
| Engine-to-Codebook mapping without a correspondence record | **Yes, implicitly: the `SYSTEM_PROMPT` CONFLICT above.** The explanations and documentation themselves assert no correspondence. | `review-candidate.js` lines 66 to 72 |

## Corrections made in this commit (new internal documentation only)
- **`lib/engine-candidate/ARCHITECTURE.md`, "Around the flow".**
  - **Old wording:** "`dev-material.js` and `contamination.js` keep development texts out of any holdout."
  - **New wording:** "`dev-material.js` and `contamination.js` detect development texts so that a future holdout builder can exclude them. They enforce nothing on their own: no holdout builder exists, and separation depends on that builder calling them."
  - **Reason:** the old wording described enforcement that does not exist. The file history is kept in git.

## Proposed wording, not applied (code or wording outside the permitted scope)
1. **`review-candidate.js` line 66:** see the CONFLICT row. Then bump `PROMPT_VERSION` to `candidate-prompt/0.4.0`. This changes the review identity by design.
2. **`reviewer-packet.js` line 82:** see the reviewer-packet row.
3. **README, "Limitations":** add "An exact quotation shows only that the words appear in the record. It does not show that they support the finding; a person must judge that." and "The person-inference screen is a word list: it withholds listed wording, and a model could describe a person in words it does not list."
4. **`harness.js`:** rename `unsupported_quotation` to `quotation_not_in_record` in the next candidate version.

## Unresolved
- **The three 3 October documents** are not available here. Every disposition above is pending comparison with their text.
- **D-2 and D-3** are recorded owner decisions. Whether the 3 October Blueprint carries a versioned Engine-to-Codebook correspondence record that changes the CONFLICT finding is NOT ESTABLISHED.
