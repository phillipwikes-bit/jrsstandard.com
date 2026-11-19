# Execution evidence: enterprise workspace reference implementation (2026-11-19)

Owner directed that the commercial specification's enterprise requirements be built. Built locally, on fictional data, without hosting:

- `lib/ds-n1/enterprise/workspace.mjs`: organisations and matters; users with admin, reviewer, approver and auditor roles; access tokens stored as scrypt hashes, revocable; only approvers may finalise or override; real records refused (only `constructed_fictional`), refusals logged; retention period per organisation with purge and content-free tombstones; audit log hash-chained with every entry signed (Ed25519); offline verifier.
- `lib/ds-n1/enterprise/server.mjs`: local HTTP interface on 127.0.0.1 with bearer tokens.
- Tests: `tests/ds-n1/enterprise-workspace.test.mjs` (7): role enforcement, organisation separation, real-record refusal, token revocation and no plain-text tokens, retention purge and tombstone, signature and tamper detection (edit, reorder, wrong key), HTTP enforcement.
- Test-first finding: the verifier initially accepted two swapped log entries; the verifier was fixed (ordering check), not the test.

Not built, and why: hosting, TLS and persistent storage (need the owner's hosting account and spend); single sign-on; key custody and external log storage; processing real records (needs legal and security approval). No security certification is claimed.

## Update: persistence (2026-11-19)
- `enterprise/store.mjs`: workspace state (including the signing key and token hashes) saved to an AES-256-GCM encrypted file, key derived by scrypt from an operator passphrase; written atomically with owner-only permissions. Loading refuses a wrong passphrase or altered file, and verifies the signed audit log before accepting state.
- `enterprise/run.mjs`: starts the server on 127.0.0.1 with the store; first run prints the admin token once; every state-changing request is saved before the reply.
- Tests (2 more): encrypted round trip with nothing readable on disk; wrong passphrase and altered file refused; edited audit log refused on restore. Manual smoke test: create, add a matter over HTTP, restart, store verified.
- Still not built: hosting, TLS, key management service, backups.
