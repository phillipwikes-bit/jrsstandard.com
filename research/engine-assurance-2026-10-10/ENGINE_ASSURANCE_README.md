# JRS Engine Assurance Package (local)

**Status.** This work supports local engineering assurance and validation preparation only. It does not establish independent accuracy, production readiness, legal compliance, security effectiveness, commercial readiness, licensing readiness, or sale readiness. Production status remains **NO_GO_NOT_VERIFIED**.

## What it is

A set of local controls wrapped around the **existing** JRS Review Engine candidate (`0.1.0-validation`), so that a reviewer can answer, for any run:

| Question | Where the answer is |
|---|---|
| What input is within scope? | `lib/engine-assurance/scope-gate.mjs`; `gate` and `refusals` in each envelope |
| What version of the Engine and codebook produced this output? | `engine_version`, `codebook_version`, `source_identity`, `artifact_hashes.code` |
| What exact record text supports each finding? | `source_spans` (quotation plus offsets, re-verified against the record) |
| What did the Engine refuse to infer? | `refusals` (pre-analysis refusals, escalations, withheld citations and notes) |
| What conditions require human review? | Every output (`human_review_required: true`); `review_required` outcomes; record controls |
| What changes in the record would change the finding? | `what_would_change_this_finding` on every condition |
| What shows the candidate fails safely? | `tests/engine-assurance/run.mjs` and the 31-fixture replay |

The candidate's prompt, condition keys, status rule, determination rule and response parser are carried byte-for-byte from the last executable version in git history and checked against it on every run. Nothing here is a new or substitute Engine, and the public routes still refuse all record text.

## What it does not do

- It does not call a model. Candidate output comes from fixed, engineering-authored mock responses.
- It does not measure accuracy. The fixtures, mock outputs and expected results were written by the same session; agreement shows internal consistency only.
- It does not decide whether a decision was correct, justified, fair, approved or lawful. It does not decide whether a decision is compliant, and it gives no overall pass.
- It does not describe or assess the person who wrote a record.
- It does not touch deployment, the public site, public contracts, commercial terms or historical evidence records.

## How to run it

From the repository root, with no provider credential or endpoint in the environment:

```sh
env -u ANTHROPIC_BASE_URL node tools/engine-assurance-replay.mjs          # writes execution-record/
env -u ANTHROPIC_BASE_URL node tools/engine-assurance-replay.mjs --clock 2026-10-10T00:00:00Z --no-write
env -u ANTHROPIC_BASE_URL node tests/engine-assurance/run.mjs             # regression, red-team, drift
```

`env -u ANTHROPIC_BASE_URL` is needed only where the host sets that variable (it is set in the Claude Code cloud environment). If any provider credential or endpoint variable is present, the harness prints the variable **names** and exits with code 3 without running anything. That refusal is intended.

To regenerate the fixture pack (only as a recorded change): `python3 research/engine-assurance-2026-10-10/fixtures/generate_fixtures.py research/engine-assurance-2026-10-10`.

## Layout

| Path | Contents |
|---|---|
| `lib/engine-assurance/candidate-core.mjs` | Existing v1 candidate logic, provider injected, no network |
| `lib/engine-assurance/provenance.mjs` | Byte-identity check against git blob `baebb512...` |
| `lib/engine-assurance/scope-gate.mjs` | Deterministic pre-analysis gate |
| `lib/engine-assurance/span-verify.mjs` | Exact quotation location and re-verification |
| `lib/engine-assurance/cognitive-controls.mjs` | Record controls CC-01 to CC-06 |
| `lib/engine-assurance/content-guard.mjs` | Unsupported-claim guard with negation and quotation handling |
| `lib/engine-assurance/network-guard.mjs` | Provider-configuration refusal and network trap |
| `lib/engine-assurance/envelope.mjs` | Envelope validation (structural and R1 to R12) and normalisation |
| `lib/engine-assurance/run.mjs` | One run, end to end |
| `tools/engine-assurance-replay.mjs` | The single replay command |
| `tests/engine-assurance/run.mjs` | Test suite |
| `research/engine-assurance-2026-10-10/contracts/` | Envelope schema, pin, notes |
| `research/engine-assurance-2026-10-10/fixtures/` | 31 synthetic fixtures, expected results, register, generator |
| `research/engine-assurance-2026-10-10/execution-record/` | Latest execution record (JSON, Markdown) and per-fixture envelopes |

All of `lib/`, `tools/`, `tests/` and `research/` are excluded from deployment by `.vercelignore`.

## Reading an envelope: Claim, Evidence, Interpretation, Limitation

- **Claim:** "basis_identification: supported."
- **Evidence:** the `source_spans` quotation, found verbatim at the stated offsets.
- **Interpretation:** the candidate said this condition is addressed and pointed to text that exists in the record.
- **Limitation:** the quotation is present; whether it actually supports the finding in context is a human judgment (fixture SAE-027 shows a `supported` chronology on a record whose dates conflict, which record control CC-03 then flags).

## Further documents

`REPOSITORY_AND_CONTRACT_AUDIT.md`, `COMPATIBILITY_DECISION_CD-001.md`, `CAPABILITY_AND_LIMITATION_MATRIX.md`, `FAILURE_MODE_REGISTER.md`, `VALIDATION_READINESS_PROTOCOL.md`, `CHANGELOG.md`, `FINAL_ASSURANCE_HANDOFF.md`, `INHERITED_FAILURES.md`, `contracts/REVIEW_RUN_ENVELOPE.md`, `fixtures/FIXTURE_REGISTER.md`.
