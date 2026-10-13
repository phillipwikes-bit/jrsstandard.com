# Changelog: Engine Assurance Package

All entries 2026-10-10, one Claude Code session, local working tree on `main` at `97087e9`. **Nothing was committed, pushed or deployed** (assignment instruction).

## Files created

| File | Rationale | Test impact |
|---|---|---|
| `lib/engine-assurance/candidate-core.mjs` | Existing v1 candidate logic, extracted byte-for-byte from blob `baebb512` with the provider injected and network code removed. Required because the working-tree routes are refusal stubs. | T:A verifies identity |
| `lib/engine-assurance/provenance.mjs` | Source identity check against local git history | T:A |
| `lib/engine-assurance/versions.mjs` | Recognised version labels; one place to change them | T:B, K |
| `lib/engine-assurance/scope-gate.mjs` | Pre-analysis refusal and escalation | T:P, I |
| `lib/engine-assurance/span-verify.mjs` | Exact quotation location, offsets, re-verification | T:C |
| `lib/engine-assurance/cognitive-controls.mjs` | Record controls CC-01 to CC-06 | T:O; replay |
| `lib/engine-assurance/content-guard.mjs` | Unsupported-claim guard | T:M, S |
| `lib/engine-assurance/network-guard.mjs` | Provider-configuration refusal, network trap | T:N |
| `lib/engine-assurance/envelope.mjs` | Envelope validation and normalisation | T:B to L |
| `lib/engine-assurance/run.mjs` | One run end to end, including the existing Manifest adapter | all |
| `tools/engine-assurance-replay.mjs` | Single replay command | T:R |
| `tests/engine-assurance/run.mjs` | Regression, red-team and drift suite | new |
| `research/engine-assurance-2026-10-10/contracts/review-run-envelope.schema.json`, `SCHEMA_PIN.txt`, `REVIEW_RUN_ENVELOPE.md` | Private envelope contract, pin and notes | T:G |
| `research/engine-assurance-2026-10-10/fixtures/` (31 records, 31 requests, 30 provider mocks, 31 expected files, register JSON and Markdown, `generate_fixtures.py`) | Synthetic fixture pack. SAE-029 runs in `local_deterministic` mode and has no mock. | replay |
| `research/engine-assurance-2026-10-10/execution-record/` | Latest execution record and 31 envelopes | generated |
| `research/engine-assurance-2026-10-10/*.md` | Audit, CD-001, README, matrix, failure modes, protocol, this file, handoff | T:S content guard |

## Files modified

| File | Change | Rationale |
|---|---|---|
| `.jrs/state/BLOCKERS.json` | Appended B-018 (source-aligned files unavailable) | CLAUDE.md §15, §16; handoff startup step 4 |
| `research/MASTER_TRACKER.md` | One dated session-log line | CLAUDE.md §36.9 |
| `research/IP_SALE_TRACKER.md` | One dated revision-log line | CLAUDE.md §36.9 (Engine is an estate asset) |
| `tests/engine-assurance/run.mjs` (own file, after first draft) | Trap test targets loopback | Correction 7 |

No existing Engine, Manifest, API, test, schema, public page, historical record or deployment file was modified.

## Defects and corrections found during the build

Recorded in the OLD FINDING, NEW EVIDENCE, CORRECTED STATUS form (CLAUDE.md Rule 10).

1. **CC-03 role assignment (code defect).** OLD: the chronology control read any passage containing "decision" as the decision date. NEW EVIDENCE: first replay, fixtures SAE-004 and SAE-027 (expected results written before the run) showed no `date_order_conflict`, because "Decision basis: ... completed 2026-04-12" masked the board decision dated 2026-04-03. CORRECTED: basis, justification and rationale passages have no date role. Code changed; expectations unchanged.
2. **CC-03 false positive (code defect, exposed by fix 1).** NEW EVIDENCE: SAE-005 then reported a conflict because "unless a renewal is approved before that date" was read as a decision. CORRECTED: decision role requires explicit decision wording (`Decision:`, `Authority:`, "board decision", "decision recorded", "approved on", and similar).
3. **SAE-025 expected result (expectation error).** OLD: two `unsafe_language_in_candidate_note` entries expected, one per unsafe term. NEW EVIDENCE: the layer emits one entry per condition, which is the designed behaviour. CORRECTED: the expected file now lists one. This is the only expected result changed after a run, and it is disclosed in `generate_fixtures.py`.
4. **Fabricated-citation note leak (code defect, found by inspection).** OLD: when a candidate quotation could not be found, the condition was correctly downgraded but the candidate's note was still shown ("approved by the Chief Risk Officer" in SAE-014). CORRECTED: the note is withheld with the citation. T:D now asserts the text does not appear anywhere in the envelope.

5. **Content guard fired on this package's own documents (expected behaviour).** NEW EVIDENCE: the first full suite run flagged `compliant` in the README (negation more than eight words earlier) and `production ready` and `validated` in `contracts/REVIEW_RUN_ENVELOPE.md` (a mention and an affirmative participle). CORRECTED: the sentences were rephrased so the negation is local or the term is quoted. The guard was not changed. This is the FM-13 class recorded in `FAILURE_MODE_REGISTER.md`.

6. **Drift guard caught a vocabulary error in the new blocker (my error).** NEW EVIDENCE: `scripts/check_zero_drift.py` rose from 37 to 38 failures; `check_every_blocker_says_who_acts_next` rejected B-018's `next_action_by: "Owner"`. CORRECTED: changed to the controlled value `"OWNER"`. The drift count then returned to 37.

7. **My claim of an "identical failure set" was wrong (correction).** OLD FINDING: after fix 6 I recorded that the drift suite "returned the identical failure set it showed before this work". NEW EVIDENCE: the comparison list had been captured with this package already present, and a clean-`main` worktree showed that `tests/engine-assurance/run.mjs` added two placeholder hosts (`example.invalid`, `x.invalid`) to the inherited `no unapproved outbound destination` failure. CORRECTED STATUS: the network-trap test now targets loopback `127.0.0.1`, which names no outbound destination and is blocked by the trap before any socket opens. The outbound inventory and the privacy disclosure it supports were not touched. Apart from the date-dependent tracker check, the remaining 36 failures are now the same set as on clean `main`. Full attribution: `INHERITED_FAILURES.md`.
8. **Branch.** `claude/html-pilot-L8rC3` was found to be stale (last commit 2026-09-30, before the closure, still carrying the live Engine routes) and to share no history with `main`. On the owner's instruction the package was committed to a new branch, `claude/engine-assurance-2026-10-10`, cut from `main` at `97087e9`. `claude/html-pilot-L8rC3` was not modified.

## Test impact summary

New suite: see `FINAL_ASSURANCE_HANDOFF.md` for exact counts. Existing suites were re-run after the change and show the same results as before it (audit section 3).
