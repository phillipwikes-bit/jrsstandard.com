# Review Engine local candidate: architecture

**Candidate 0.5.0-local.1. Local development only. Not deployed, not validated, not connected to any model.** This work is governed by `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`.

## Data flow

```
 caller: { text, profile, record_ref }            adapter: describe() + examine()   (mock only)
        |                                                         ^
        v                                                         |
 1. scope gate .................. refuse: wrong type, not completed, HR not declared false
        |
 2. source preparation .......... refuse: unreadable input, partial input
    (source-prep.js,              report: omissions, unsupported content, instruction-like text,
     deterministic)                       every quotation with offset, line and column
        |
 3. content gate ................ refuse: under 40 or over 8,000 characters (never truncated),
        |                                 excluded decision domain
        v
 4. request ..................... exact original text, fenced by markers carrying its own hash;
        |                         reference prompt, prompt version and hash, adapter contract
        |---------------------------------------------------------> adapter.examine(request)
        |<--------------------------------------------------------- raw output
 5. adapter boundary ............ validateAdapterOutput(): FAIL CLOSED on any deviation
    (adapter.js)                  -> status 'incomplete', reasons recorded, nothing used
        |
 6. person-inference screen ..... emotion, intent, motive, payoff, credibility, clinical:
        |                         text withheld, withholding recorded
        v
 7. result contract ............. jrs-candidate-result/0.3.0 (contract.js)
    review_identity (hash of every version, the prompt, the model and the source)
    extraction_findings (X-nnn, deterministic)  |  contextual_findings (C-nnn, model-derived)
    each finding: explanation (explanations.js), pending human disposition
        |
 8. human review (outside the candidate)
    recordDisposition() per finding, append-only history, bound to one review_id
    signOff() separate and final; refused while any finding is pending
    both first run verifyResultIntegrity(): every finding and disposition belongs to
    this review version, and result_digest still matches the findings
        |
 9. reviewer packet (reviewer-packet.js) ... jrs-candidate-reviewer-packet/0.1.0 for a person:
    every finding shown, anchors re-checked against the source text, no verdict
```

Around the flow, and never inside it:
- `harness.js` runs a record through several mocked response variants and fails closed on any inconsistency.
- `dev-material.js` and `contamination.js` detect development texts so that a future holdout builder can exclude them. They enforce nothing on their own: no holdout builder exists, and separation depends on that builder calling them. The first catches exact copies; the second flags edited copies as possible matches for a person to judge.
- `tests/engine-candidate/eval/run-eval.mjs` compares the corpus against expected findings written in advance.
- `tools/frozen-demo/` replays five frozen SYNTHETIC records through the candidate with the mock adapter, for a future demonstration review (2026-10-07). It calls the candidate the way any caller does and changes nothing in it.

## Modules

| Module | Role |
|---|---|
| `review-candidate.js` | Steps 1 to 7. Defines the scope, the excluded domains, the inference screen and the reference prompt (0.4.0: five candidate review keys, not JRS conditions; see README). |
| `source-prep.js` | Step 2. Deterministic, with no model involved. |
| `adapter.js` | Step 5. The adapter interface and its fail-closed validator. |
| `mock-adapter.js` | The only adapter: deterministic scripted responses. |
| `explanations.js` | Human-review explanations. Candidate-internal vocabulary with no Codebook correspondence; `cold_reviewer_clarity` and `accountability_support` are explicitly unmapped. |
| `contract.js` | The result contract, disposition and sign-off. |
| `harness.js` | Adversarial consistency and integrity harness. |
| `dev-material.js` | Holdout-separation control: exact and whitespace-only copies. |
| `contamination.js` | Shingle-similarity screen for edited copies of development texts. It reads nothing; texts are passed in. |
| `reviewer-packet.js` | Reviewer packet generator. Separate from the Manifest library. |

Each module imports only its neighbours and `node:crypto`. The tests enforce this.

## Boundary table

| Capability | Status |
|---|---|
| Scope gate, excluded-domain refusal, length refusal | **Implemented** |
| Deterministic source preparation and quotation locations | **Implemented**: heuristics, characterised only on 24 constructed cases |
| Prompt-injection fencing and detection | **Implemented**: hash-fenced record, instruction-like text reported |
| Adapter contract and fail-closed validation | **Implemented** |
| Result contract, disposition and sign-off | **Implemented** |
| Human-review explanations | **Implemented**: candidate-internal, no Codebook correspondence asserted |
| Consistency harness | **Implemented**: a software control, not reliability evidence |
| Holdout-separation list | **Implemented**: exact and whitespace-only copies |
| Contamination screen for edited copies | **Implemented**: possible matches for human review, never certain; misses heavy paraphrase |
| Version binding (`result_digest`, per-finding `review_id`) | **Implemented**: catches copying and editing; not authentication |
| Reviewer packet | **Implemented**: local, machine-readable, no verdict; holds quotations, so it is as confidential as the record |
| Model behaviour | **Mocked**: `mock-adapter.js`, scripted responses |
| Corpus evaluation | **Mocked**: constructed records and scripted responses only |
| Live provider adapter | **Intentionally absent**: needs a future owner authorization for provider calls |
| Manifest output | **Intentionally absent**: incompatible (see below), left disconnected |
| Persistence, logging, telemetry | **Intentionally absent** |
| Public route, API, sandbox, page, Vercel configuration | **Prohibited** under the handoff |
| Real records, sealed holdouts | **Prohibited** under the handoff |
| Numerical DRR score, overall verdict, "ready" or "approved" determination | **Prohibited**, and rejected at the adapter boundary |
| Codebook mapping or equivalence claim | **Prohibited** (D-2, D-3); enforced by `vocabulary.test.mjs`. No correspondence record exists. |
| Inference about emotion, intent, motive, payoff, credibility or clinical condition | **Prohibited**, and withheld when a model produces it |
| Claims of accuracy, reliability, validation or production readiness | **Prohibited** |

## Manifest

The candidate is **left disconnected** from the Manifest library (`api/_manifest/`, re-exported by `lib/manifest/`). That library cannot represent a candidate result without either inventing a verdict or being changed, and it sits in a deployable path:
- The schema requires `routing.value`, an overall verdict. The candidate has none by design, and `buildManifest()` throws "no routing value".
- The schema sets `additionalProperties: false`, so it has no place for extraction findings, contextual findings, dispositions or sign-off.
- The schema requires `engine.api_version`. The candidate has no API.

`tests/engine-candidate/manifest-compat.test.mjs` shows each point against the real builder and schema. Connecting the two would need an owner decision on a new local review-record format. Guard proposal A4 already asks where the Manifest code should live.

## Changes from d2da83c

| From the historical engine | In the candidate | Why |
|---|---|---|
| HTTP route, token auth, CORS, rate limit, Supabase write | Removed | The candidate is not a route |
| Direct provider call with the key read from the environment | Adapter boundary; mock only | No provider calls under the handoff |
| Silent truncation at 8,000 characters | Refusal | Never review partial text |
| No partial or unreadable input check | Refused before any model call | |
| Overall determination ("ready", "review_required", "gap_identified") | Removed, and rejected if a model supplies one | Human review is always required |
| `compliant_version` | `revision_needed` | CLAUDE.md section 24 |
| Prompt called the five keys "JRS documentation review conditions" (carried into 0.3.0) | Candidate review keys, no correspondence asserted (prompt 0.4.0) | D-2, D-3 |
| Model output parsed leniently | Fail-closed contract, exact quotations | |
| No screen on person-describing text | Withheld and recorded | Handoff: record-level flaws only |

## Commands

| Command | Runs |
|---|---|
| `node tests/engine-candidate/run-all.mjs` | Everything, including the mutation run |
| `node tests/engine-candidate/run-all.mjs --quick` | Everything except the mutation run |
| `node tests/engine-candidate/eval/run-eval.mjs --write tests/engine-candidate/eval/records` | The corpus evaluation, writing its JSON record |
| `node tests/engine-candidate/mutation/run-mutations.mjs` | The 67 mutations alone |
| `node tests/engine-candidate/regression/run.mjs --table` | The source-preparation regression set, case by case |
| `node tests/engine-candidate/confirmation/run.mjs --table` | The independent confirmation corpus, case by case |

See `RUNBOOK.md` for the failure-mode catalog and recovery steps.

## Release gates
The five release gates are tracked outside the candidate, in the internal package `lib/release-gate/` (`docs/architecture/RELEASE_EVIDENCE_PROTOCOL.md`). Its current record for this version shows every gate open. Nothing in the candidate, its tests or its documentation is counted as release evidence.

## Local reviewer workspace
Step 9 (the reviewer packet) can be read in `tools/local-reviewer-workspace/`, a local, offline page served on loopback only with `connect-src 'none'`. Before showing a packet it re-checks the packet against the generator's rules: the review ID, the packet ID, the history binding and the anchors (and, if the source text is supplied, its hash and every anchor slice). It then holds the reviewer's dispositions in memory, apart from the packet, and exports a version-bound disposition record only after sign-off. It does not run the candidate, and it is not release evidence. See `docs/architecture/LOCAL_REVIEWER_WORKSPACE_PROTOCOL.md`.

## Frozen synthetic demonstration package
`tools/frozen-demo/` (2026-10-07) holds a local-only frozen demonstration: five SYNTHETIC completed non-HR supplier-access exception drafts (FD-01 to FD-05), committed alone in `1717f1b` before any code that uses them. It replays them through this candidate with the deterministic mock adapter, builds reviewer packets, and runs an illustrative disposition through the local reviewer workspace. Its manifest binds the candidate version, the prompt version and hash, the adapter identity and the bytes of every module in this directory, so any change here fails `node tools/frozen-demo/verify-demo-manifest.mjs` until a new package version is frozen. Status `DEMO_PREPARATION_COMPLETE_NOT_RELEASED`. It shows exact replay of a fixed local package only, and it advances no release gate. Its five texts are listed in `dev-material.js` (0.4.0), so a future holdout builder refuses them. Protocol: `docs/architecture/FROZEN_DEMONSTRATION_REPLAY_PROTOCOL.md`.
