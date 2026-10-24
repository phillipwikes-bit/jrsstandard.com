# Live-Model Adapter Contract (Minimal)

**NON-OPERATIVE SPECIFICATION. Prepared 2026-10-24. No adapter exists and building one is
not authorized by this document.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect.


**Revision 2 (2026-10-24, on owner direction).** Two-part provenance labeling outside the
frozen graph; mandatory graph and execution-record pairing; narrowed pilot question;
counts and observed failure modes only. Revision 1 is preserved unchanged in
`history/rev1/`. Still non-operative; nothing is authorized.

## 1. Purpose and boundary

The adapter translates exactly one synthetic Engine request into exactly one provider
request, validates the provider response, and hands the validated candidate response
text to the frozen local compiler. It adds no Engine feature, changes no rule, and does
not modify the frozen candidate package (SHA-256 `815c5d56...25c3`).

## 2. Design: record, then replay

The frozen compiler accepts only `local_mocked` and `local_deterministic` execution
modes. To avoid modifying it, the adapter works in two separated steps:

1. **Capture.** Send one request; store the raw provider response, unaltered, with its
   execution record.
2. **Replay.** Run the frozen compiler locally on the stored candidate response text in
   `local_mocked` mode.

**Labeling (owner decision LP-OD-07, revision 2).** The frozen compiler's graph keeps
its own label, `execution_mode: local_mocked`, unchanged. No provenance field is added
to the graph. Provenance is carried only in the execution record, outside the graph, as
two separate facts:

- `response_origin: live_provider_captured`
- `engine_execution_mode: recorded_response_replay`

The graph's `local_mocked` label is accurate for the compiler path but does not
distinguish a real provider response from a wholly synthetic mock. A graph is therefore
never read or used without its paired execution record (section 8A). The alternative,
adding a live mode to the compiler, changes the frozen package and creates a new
candidate version.

## 3. Inputs (one request)

| Field | Rule |
|---|---|
| Record text | 40 to 8,000 characters; marked synthetic; from the approved ten-record set |
| Scope declaration | `record_type: supplier_access_exception_draft`, `record_state: completed_draft`, `content_origin: synthetic_engineering_fixture`, `hr_content: false` |
| Prompt | Loaded from the pinned prompt file; SHA-256 must equal `0ceda888...eec2`, otherwise refuse |
| Model configuration | Exactly the values in the signed authorization; any difference refuses |
| Authorization | Signed file present, hash matches the recorded value, not expired, enable flag set |
| Record identifier | From the pilot set register; must be one of the ten |

## 4. Pre-request checks (all must pass, else refuse with no network activity)

1. Authorization valid (section 3).
2. Request count so far below 10.
3. Record identifier in the set register and not yet run.
4. Record passes the candidate intake gate locally first (`local_deterministic` dry run);
   a refusal there stops before any provider request.
5. Prompt hash matches.
6. No provider-routing or base-URL override present in the environment.
7. Destination equals the single approved destination.
8. Cost so far plus the maximum cost of one request is within the ceiling.

## 5. Provider request

- One request, system and user content taken from the pinned prompt with the record
  inserted at the single placeholder (the existing loader refuses records containing the
  delimiter).
- Configuration as authorized; timeout as authorized.
- Credential read from the environment at call time; never logged, stored or echoed.
- Network guard: only the approved destination may be contacted; any other attempted
  destination stops the pilot.

## 6. Response validation before compilation

Order of checks. The first failure classifies the response; nothing is repaired.

| Step | Check | Failure code |
|---|---|---|
| V1 | Transport completed within the timeout | `transport_timeout` |
| V2 | Provider status indicates success | `provider_error` |
| V3 | Provider stop reason is normal completion, not a length cut-off | `response_truncated` |
| V4 | Exactly one text content block; no tool use or other content types | `unexpected_content_type` |
| V5 | Text size at most 64 KB | `response_too_large` |
| V6 | Not a refusal (no JSON object and refusal language, or an empty body) | `model_refusal` |
| V7 | Strict JSON with no prose around it, no duplicate keys (existing strict parser) | the parser's reason code |
| V8 | Quote-only contract (existing `validateCandidate`): exact top-level keys; `contract_version` and `prompt_version` match; 1 to 25 observations; no untrusted fields; required fields present; valid condition and status values; note at most 400 characters | the validator's reason code |

A response failing V1 to V8 is not compiled. It is stored, classified and counted.

## 7. Compilation

A response that passes V1 to V8 is passed unchanged to the compiler in `local_mocked`
mode. The compiler repeats its own validation and resolves every quotation against the
record; quotation failures (absent, ambiguous, malformed) are the compiler's findings,
not the adapter's.

## 8. Outputs per request (execution record)

Input identifier; input SHA-256; Engine version; candidate package SHA-256; prompt SHA-256;
adapter SHA-256; model and provider identifier; configuration; UTC timestamps (sent,
received); latency; raw provider response (stored); response SHA-256; validation result
(V-step and code); compiler outcome (graph SHA-256, or refusal or error code); token usage
reported by the provider; computed cost; authorization file SHA-256; lineage label `L3`;
`response_origin: live_provider_captured`; `engine_execution_mode: recorded_response_replay`.

## 8A. Graph and execution-record pairing

Each graph is stored together with its execution record. The pair is bound by all of:

| Binding field | Source |
|---|---|
| Graph SHA-256 | Computed over the stored graph file |
| Captured-response SHA-256 | Computed over the stored raw provider response |
| Request identifier | Assigned by the adapter, unique per request |
| Model identifier | As sent in the request and as reported by the provider |
| Adapter version and SHA-256 | From the frozen system-under-test tuple |
| Timestamps | UTC sent and received |
| Synthetic-record identifier | From the pilot set register |

The execution record also stores a binding digest: the SHA-256 of the canonical
concatenation of the seven fields above. Before any review, the pair is checked: every
hash recomputed, every field matched, the digest recomputed.

**An unpaired graph, a pair with any mismatched field, or a graph or record altered after
capture is unusable pilot evidence and is an immediate stop condition (SR-LP-15).** It is
preserved as found and reported; it is never repaired, re-paired or replaced by a rerun
without a new owner decision.

## 9. Prohibitions

The adapter never: retries a content failure; edits, trims or repairs a response; sends
more than one request per record; sends any file other than the record and prompt; writes
inside the repository; runs without a valid authorization; contacts any destination
other than the approved one.

## 10. Acceptance tests for the adapter (offline, before any live use)

Every row of `DEFECT_INJECTION_MATRIX.md` part A is run against the adapter with a
mocked provider (no network) and must produce the expected code. An adapter that accepts
any contract-violating response is not used (stop rule SR-LP-07).

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
