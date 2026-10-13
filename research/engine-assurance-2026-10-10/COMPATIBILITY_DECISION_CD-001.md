# Compatibility Decision CD-001: Assurance Layer over the v1 Candidate

**Date:** 2026-10-10 · **Status:** PROPOSED BY ENGINEERING, local only. Owner approval is required before any of this reaches a route, contract or public page.

This record exists because the assignment's condition vocabulary and refusal behaviour differ from the existing candidate. Nothing in the existing candidate was replaced. The existing candidate remains the subject under test.

## 1. Current behaviour (v1 candidate, `0.1.0-validation`)

- Provider is asked for five conditions with `status` in `pass | review | gap` and a one-sentence `note` "grounded in the record text".
- Any other status throws (`invalid_model_condition_status`); the route returned 502.
- `determination` is derived: any gap gives `gap_identified`, else any review gives `review_required`, else `ready`.
- Records under 40 characters are refused; records over 8000 characters are **truncated** and evaluated.
- No exact source spans, no pre-analysis scope gate, no refusal of regulated content, no injection detection.
- Optional Manifest via `api/_manifest/from-engine.js`.

## 2. Proposed change

An **assurance layer** that wraps the unchanged v1 pipeline and emits a private Review Run Envelope:

| v1 candidate status | Assurance outcome | Condition |
|---|---|---|
| `pass` | `supported` | Only if the candidate supplied at least one exact quotation for that condition, every quotation is found verbatim in the record, the note is present, and the note asserts no unsupported status. Otherwise `review_required`. |
| `gap` | `gap` | Same conditions as above. |
| `review` | `review_required` | Always. Never promoted. |
| (gate refused or escalated) | `not_assessed` | Provider never invoked. |
| (invalid candidate output) | `not_assessed` | Run fails closed. |
| (local_deterministic mode) | `not_assessed` | No candidate run. |

Additional behaviour: a deterministic pre-analysis gate; record controls (CC-01 to CC-06); oversize records are **refused** rather than truncated; a Manifest is produced only when nothing was downgraded.

**Quotation source.** The v1 parser ignores unknown fields. The assurance layer reads an optional `conditions.<key>.evidence` array (strings, or objects whose `quote` is used) from the same provider JSON. Provider-supplied offsets are ignored; offsets are always recomputed from the record.

## 3. Reason

The assignment requires that a supported or gap finding be traceable to exact record text and that the package fail closed. v1 notes cannot be verified against the record, so a v1 `pass` cannot be reported as `supported` without an anchor.

## 4. Affected schemas, tests and outputs

| Item | Effect |
|---|---|
| Public routes `api/*.js` | **None.** Still refusal stubs. |
| `openapi.json` | **None.** Frozen under B-016. |
| v1 prompt, keys, normaliser, determination, parser | **None.** Carried byte-identical; verified against git blob on every run. |
| Manifest schema and adapter | **None.** The adapter is called unchanged. The Manifest keeps v1 vocabulary and routing. |
| New: Review Run Envelope schema `0.1.0` | Private, in `contracts/`. |
| New tests | `tests/engine-assurance/run.mjs` |
| Existing tests | Unchanged. Two were already failing before this work (see audit section 3). |

## 5. Migration or versioning approach

- The envelope has its own version (`jrs-review-run-envelope/0.1.0`) and the layer has its own (`assurance_layer_version: 0.1.0-local`). Neither changes `ENGINE_VERSION`.
- **Prompt not changed.** The v1 prompt does not ask for quotations. Under this layer, real v1 output would therefore yield `review_required` on every condition (demonstrated by fixture SAE-023). For the candidate to produce `supported` or `gap` in a future live evaluation, a prompt addition asking for `evidence` quotations would be required. **That is a change to the system under test**, would need a new `ENGINE_VERSION`, and was **not made**, because it cannot be exercised without a live provider call, which is prohibited here. Recorded as an open decision for the owner (handoff item 3 in `FINAL_ASSURANCE_HANDOFF.md`).
- Oversize refusal versus v1 truncation: the v1 behaviour is preserved in `candidate-core.mjs` (`V1_TRUNCATION_LIMIT = 8000`); the gate refuses before the core is reached. If the layer is ever placed in front of a route, the change from truncate to refuse is user-visible and must be versioned.

## 6. Regression evidence

- `node tools/engine-assurance-replay.mjs`: 31 of 31 fixtures match their pre-authored expected results.
- `node tests/engine-assurance/run.mjs`: provenance (byte identity with blob `baebb512...`), adapter continuity (Manifest validates offline with `tools/validate-manifest.js`), v1 truncation constant preserved.
- Exact counts and commands: `FINAL_ASSURANCE_HANDOFF.md`.

## 7. Remaining limitations

- No model has been asked for quotations. Whether a model complies, and how often its quotations are verbatim, is **NOT ESTABLISHED**.
- Verbatim presence of a quotation does not establish that it supports the finding (fixture SAE-027).
- The Manifest's `pass` and `routing: ready` are v1 vocabulary; a reader of the Manifest alone could take `ready` as an overall result. The envelope carries no overall result and records the Manifest as `represents: unmodified_v1_candidate_output`.
