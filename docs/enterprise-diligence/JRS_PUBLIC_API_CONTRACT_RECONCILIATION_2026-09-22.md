# JRS Public API Contract Reconciliation

**Date:** 2026-09-22

**Scope:** Public technical contract only

**Rights effect:** None

## Change

The prior public state contained two OpenAPI files describing the same versioned endpoint with different response structures. `openapi.json` described top-level `routing` and `conditions` fields that the deployed implementation did not return. `openapi-review-engine.json` more closely reflected the implementation but created a second public contract.

The public contract is now `openapi.json`, OpenAPI 3.1.0, version `0.1.0-validation`. It records the implemented response envelope:

`request_id`, `api_version`, `engine`, `engine_version`, `model`, `evidence_stage`, `disclaimer`, `reviewed_at`, `runs`, `result`, and optional `variance`.

It also records:

- condition vocabulary: `review_engine_keys`;
- routing vocabulary: `engine_determination`;
- current Manifest output: not emitted by the endpoint;
- input behavior: text beyond 8,000 characters is truncated rather than rejected;
- controlled bearer access;
- the implemented error statuses.

The former `openapi-review-engine.json` file was removed. Its public path redirects permanently to `openapi.json` for compatibility.

## Boundary

This record establishes technical correspondence between the public contract and the repository implementation as of this date. It does not establish ownership, licensability, trademark rights, transfer authority, commercial terms, production fitness, security certification, or validation. Those matters remain subject to their separate evidence and decision records.
