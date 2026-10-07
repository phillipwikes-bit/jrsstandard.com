# Frozen synthetic demonstration package

**Local-only. SYNTHETIC records only. Mock adapter only. Not deployed** (`tools/` is excluded by `.vercelignore`). Status: `DEMO_PREPARATION_COMPLETE_NOT_RELEASED`. This package prepares material for a future demonstration review. It is not a public demonstration, a pilot, a production deployment or a release authorization, and it advances no release gate.

Protocol: `docs/architecture/FROZEN_DEMONSTRATION_REPLAY_PROTOCOL.md`. Capability matrix: `docs/architecture/FROZEN_DEMONSTRATION_CAPABILITY_MATRIX.md`. Evidence record: `docs/architecture/FROZEN_DEMONSTRATION_EVIDENCE_RECORD.md`.

## Use
| Command | Effect |
|---|---|
| `node tools/frozen-demo/verify-demo-manifest.mjs` | Replay and verify the frozen package; exit 0 only on exact replay |
| `node tools/frozen-demo/run-demo.mjs --table` | Replay and print one line per case |
| `node tools/frozen-demo/run-demo.mjs --check` | Fail if a generated output is stale (without `--check`, rewrite them) |
| `node tools/frozen-demo/serve-viewer.mjs` | Read-only viewer at `http://127.0.0.1:4318/`, loopback only |
| `node tests/frozen-demo/run-all.mjs` | Tests and the mutation run (`--quick` skips the mutations) |

## Files
| File | Role |
|---|---|
| `corpus/v0.1.0/` | The five frozen SYNTHETIC records and their index (committed alone, `1717f1b`) |
| `demo-manifest.json` | Package identity, status, version binding, adapter identity, record hashes, expected behaviour and digests, limitations and prohibitions |
| `demo-evidence-record.json` | What the package does and does not show, in machine-readable form |
| `lib/replay.js` | Replays the corpus through the candidate with the deterministic mock adapter and the reviewer workspace core |
| `lib/verify.js` | The fail-closed verifier |
| `lib/render.js` | Renders `generated/replay-output.json` and `viewer/demo-data.js` |
| `viewer/` | The read-only viewer. It reuses the workspace's `core.js` and `correspondence.js`, served unchanged. |
| `serve-viewer.mjs` | Loopback-only static server with `connect-src 'none'` |

The viewer shows synthetic cases only. It has no record submission, network, login, API, token, analytics, storage or telemetry function, and it makes no pass, ready or approval decision.
