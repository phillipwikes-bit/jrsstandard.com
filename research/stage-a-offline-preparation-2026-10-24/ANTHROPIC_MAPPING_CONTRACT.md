# Anthropic Response-Mapping Contract (Offline)

**2026-10-24. Outside the repository. Offline only.** No network transport, endpoint,
credential access, SDK initialization or provider request code exists in this module.
The dispatch lock remains engaged. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

Module: `src/anthropic-mapping.mjs`, version `0.1.0-offline`, SHA-256
`1e289b0687d8b14a4c3dd74db1bd977af0f32d50dee2ad523da412f515a159b8`.

## 1. Position in the path

```
captured provider response (fixture)  ->  mapper  ->  adapter envelope
  ->  tested adapter boundary (adapter 0.2.0, V1 to V9, A-DUP)  ->  frozen Engine replay
  ->  graph (execution_mode: local_mocked)  +  execution record  +  mapping sidecar
```

The mapper is reachable only through `createMappedMockTransport`, a transport of kind
`mock` passed to the adapter. It never calls the Engine directly. The adapter (copied
unchanged from `feasibility-final-2026-10-24/harness-v2/src`, SHA-256 `aa2b9779...1fb6`)
remains the only route to replay.

## 2. Input

Model identifier: required, exact, supplied at mapper creation. For Stage A it is
`claude-haiku-5-5`. There is no default and no fallback.

Captured response, as a future live transport would store it:

```
{ provider_request_id: "<response request identifier>",
  body: { id, type: "message", role: "assistant", model, content: [ { type: "text", text } ],
          stop_reason, stop_sequence, usage: { input_tokens, output_tokens } } }
```

An error body (`body.type: "error"`) is mapped to an envelope with `status: "error"`,
which the adapter rejects at V2. The shape follows the provider's documented Messages
format as understood when the module was written. **It must be confirmed against the
provider's current documentation before any live use.**

## 3. Rejections (mapper)

A rejection throws; the adapter records a provider error with no replay; the mapper's
code is kept in the transport's `mappingErrors`.

| Code | Condition |
|---|---|
| `missing_response_body` | No capture, or no body |
| `provider_request_id_missing` | Missing or blank provider request identifier |
| `duplicate_provider_request_id` | The identifier was already seen in this pilot run |
| `malformed_top_level_structure` | Body is not a message (type, role, content array, model string) |
| `model_identifier_mismatch` | Body model differs from the required model |
| `empty_content` | Content array empty, or text empty or whitespace only |
| `unsupported_content_block_type` | Any block whose type is not `text` |
| `multiple_text_blocks` | More than one text block |
| `text_content_missing_or_not_string` | Text block without a string text |

## 4. Rejections (adapter, unchanged)

V1 timeout; V2 provider error; V3 length cut-off; V4 non-text content; V5 over 64 KB; V6
empty body; V7 strict JSON (unparseable structured response); V8 quote-only contract;
V9 `quote: null` with any status other than `not_assessed`; A-DUP repeated `request_id`.
Where the mapper pre-empts V4 and V6, both controls remain active in the adapter and are
tested directly.

## 5. Provenance (outside the frozen graph)

Execution record (adapter): `response_origin: mock_transport_fixture`,
`adapter_transport_mode: mocked`, `engine_execution_mode: recorded_response_replay`,
`request_id`, `model_identifier`, `captured_at_utc`, `synthetic_record_id`, adapter version
and SHA-256, and the nine-field binding digest.

Mapping sidecar (`<request_id>.mapping-record.json`): provider request identifier,
model identifier, mapping version and SHA-256, SHA-256 of the raw capture, and the same
three provenance labels.

Note on the binding: `captured_response_sha256` covers the adapter envelope that the
adapter stores. The raw capture is covered by the sidecar's `raw_capture_sha256`; the
mapping is deterministic, so the envelope can be reproduced from the raw capture.

Frozen graph: `execution_mode: local_mocked`, unchanged.

## 6. For a future live run (not authorized)

The labels become `response_origin: live_provider_captured` and
`adapter_transport_mode: live_provider`, assigned by adapter 0.2.0 only for a transport
created by the live-transport boundary, whose dispatch lock remains engaged.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
