# JRS Red-Team Report — Manifest Architecture — 2026-09-15

Every §50 attack was attempted. **Nothing is hidden: the one that fired against my own work
is listed first.**

## Findings against my own implementation

**RT-1 — the validator rejected every valid manifest.** CONFIRMED, FIXED. The schema uses
`minLength`; the validator did not implement it and failed closed. **That is the designed
behaviour, and it is why the failure surfaced immediately instead of silently passing.** Fixed
by implementing the keyword in the validator, **not** by removing it from the schema.

**RT-2 — `source_hash` was not in the schema.** CONFIRMED, FIXED. The hasher emitted it on
truncation and `additionalProperties: false` would have rejected the result. Caught before the
first fixture ran. The schema now declares it, and `codebook_version` was made required at the
same time, which §8 requires and the first draft omitted.

## §50 attack results

| Attack | Result |
|---|---|
| Silent Codebook relabeling | **REFUSED.** `jrs_codebook_1.0` throws without an owner-declared mapping; the validator also rejects the claim on a hand-edited manifest |
| Silent routing conversion | **REFUSED.** No translation table exists; asking for a vocabulary the engine did not emit throws |
| Raw-record leakage | **NOT REPRODUCED.** Six synthetic identifiers absent from every fixture |
| Derived-content misclassification | **REFUSED twice.** The builder derives `content_class` from what is present; the validator rejects a forged `no_record_content` carrying notes |
| Missing input hash | **REFUSED.** Required by the schema and always computed |
| Incorrect truncation state | **REFUSED.** Computed by comparison, not asserted; `truncated` without `source_hash` is rejected |
| Version collapse | **REFUSED.** Five version fields are separate and three are required |
| Integrity self-hashing error | **NOT REPRODUCED.** `integrity` is excluded at the call site; tampering is detected |
| False authentication implication | **NOT REPRODUCED.** Unsigned reports `SELF-CONSISTENT (not authenticated: unsigned)`; a present signature is reported as NOT VERIFIED |
| Human-review default bypass | **REFUSED.** Hard-coded true with a reason; the reason carries no legal claim |
| Validation implication | **NOT REPRODUCED.** The reproducibility note is constrained to stability |
| Prohibited legal fields | **REFUSED.** `additionalProperties: false` at the root; a `legally_sufficient` field is rejected |
| Accidental API contract modification | **NOT REPRODUCED.** `openapi.json` untouched; `git status` clean of it throughout |
| Production configuration modification | **NOT REPRODUCED.** No route, no `vercel.json`, no grant changed |
| Public/private boundary leakage | **See below** |

## Public/private boundary — the one genuine open question

The manifest **specification** and **schema** are publishable candidates: they describe the
standard's evidence format. The **generator internals**, the fixtures and the test harness are
controlled candidates under *publicize the standard, protect the implementation*.

**They are currently in a repository that deploys to a public host.** `vercel.json` and
`.vercelignore` govern what is served, and `lib/`, `tools/`, `tests/` and `schemas/` are not
HTML and are not linked. **Whether they are served is a fact I have not verified against
production**, because nothing is deployed and the check belongs with deployment.

**RECORDED AS AN OPEN ITEM rather than assumed safe.** Before any deployment, confirm that
`lib/manifest/`, `tests/manifest/` and `tools/` are excluded from the deployable set.

## Guard mutations

`check_manifest_library_holds_its_refusals` and `check_manifest_schema_keeps_its_safeguards`
were each mutation-tested. **Ten mutations, all fail correctly**, including relaxing the
Codebook refusal, adding a routing translation table, turning `content_class` into a caller
assertion, and renaming the canonicalization to claim RFC 8785.
