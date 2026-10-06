# Local reviewer workspace protocol (internal)

**Date:** 2026-10-06. **Status:** internal local tool, tested on synthetic fixtures only. **Code:** `tools/local-reviewer-workspace/`. **Tests:** `tests/local-reviewer-workspace/`. **Governed by:** `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md` and `docs/architecture/RELEASE_EVIDENCE_PROTOCOL.md`.

## What it is
A local, offline page for one task: reading a reviewer packet that the local candidate (`lib/engine-candidate/reviewer-packet.js`) has already produced, and recording the reviewer's own dispositions.

1. **Local only, and excluded from deployment.** The workspace lives under `tools/` and its tests under `tests/`. `.vercelignore` excludes both, and its documents are `*.md`, which are also excluded. No public page, API route, sitemap, OpenAPI file or Vercel setting refers to it, and the tests fail if one does. It is not a hosted service and has no route on any deployment, including previews.
2. **It does not run the Engine.** It has no adapter, no prompt and no provider code. It cannot produce a finding; it can only show findings already in a packet.
3. **It only presents a previously generated packet.** The packet is opened from a file on the reviewer's computer, or the built-in synthetic demonstration is used. It is never fetched from an address, never loaded automatically, and never sent to any server, including the local one.
4. **The reviewer makes every disposition.** The tool decides nothing. It offers five dispositions (`CONFIRMED_FOR_FURTHER_REVIEW`, `NOT_CONFIRMED`, `NEEDS_CLARIFICATION`, `OUT_OF_SCOPE`, `NO_DISPOSITION`), shows no score, and gives no "ready", "approved", "compliant" or "defensible" verdict.
5. **Packet content is confidential.** A packet can hold quotations from the record. The page says so. The workspace never displays the optional source text, and never exports quotations or source text.
6. **Exports are version-bound internal artifacts.** A disposition record is bound to one packet: its review ID, result digest, packet ID and a digest of the whole packet. Its export digest detects later editing. It is not an authenticated record, not a legal record, and not evidence that any disposition is correct. The reviewer reference is self-entered and marked unauthenticated.
7. **It satisfies no release gate.** Nothing it produces is release evidence under the release-evidence protocol. In particular it is not independent labeling (RG-1) and not independent production QA (RG-5).

## How it is kept offline
- **Local server only.** `serve.mjs` binds only to a loopback address and refuses any other host. It refuses requests whose `Host` header is not loopback, answers only `GET` and `HEAD`, and serves a fixed list of five files.
- **Network blocked in the browser.** Every response, and the page itself, carries a Content-Security-Policy with `connect-src 'none'`, `form-action 'none'` and `default-src 'none'`. The browser therefore blocks any network request the page might make, even to its own origin. The browser test proves this.
- **No persistence and no tracking.** The page code uses no storage of any kind: no local storage, session storage, IndexedDB, cookies, Cache API, service worker or file-system API. It sends no analytics or telemetry and imports no remote resource. The session lives in memory and is gone when the window closes. Only an explicit export writes a file, through the browser's ordinary download.
- **Packet text is never treated as HTML.** It is set only as text. Refusal messages name fields and finding identifiers only, and nothing is written to the console.

## How a packet is checked before it is shown
The core module (`app/core.js`) runs in both the browser and Node. It carries its own SHA-256 and canonical JSON, because the candidate's modules depend on `node:crypto`. The tests prove that both agree byte for byte with the candidate's functions on real packets. Codebook wording comes only from `app/correspondence.js`, generated from the methodology correspondence register (`docs/architecture/METHODOLOGY_CORRESPONDENCE_REGISTER.md`): a mapped label renders only from an owner-approved record carrying its source hash and approval date. No such record exists, so every finding and every candidate key shows "No Codebook correspondence asserted." (added 2026-10-06).

A packet is refused, and nothing from it is shown, unless all of the following hold:
1. The structure is exact. An unknown field (a `score`, a `verdict`) is refused.
2. The packet and contract versions are supported, and human review is required.
3. The `review_id` is the one its identity and source hash produce. A packet relabelled to another candidate, prompt or model version is refused.
4. The `packet_id` is the one its review ID, result digest, disposition history and sign-off state produce. An altered packet is refused.
5. Every disposition-history entry belongs to this review version and names a real finding.
6. Every anchor is well formed, lies inside the source, and spans exactly its quotation's length. If the reviewer supplies the source text, the text must match the packet's source hash, and every anchor must slice back to its quotation exactly.
7. Every explanation states that no Codebook correspondence is asserted.

The packet carries the `result_digest` but not the full result, so the workspace cannot recompute that digest. It binds to it instead: a disposition or export naming another result digest is refused.

## What the reviewer sees
Four separate sections, never blended:
1. **Source-preparation findings.** The deterministic input checks.
2. **Candidate review prompts and findings.** Labelled as candidate-internal prompts of the local candidate, not JRS or Codebook conditions.
3. **Model-output checks.** Limitations of the model output, kept apart from record findings.
4. **Human review.** The only place a disposition is recorded.

Each finding shows its identifier, any exact quotation and anchor, the plain explanation, the reviewer question, any candidate-internal category, "No Codebook mapping asserted", and the packet's disposition history. Every quotation carries this notice: *an exact quotation shows where the text sits in the record; it does not show that the text supports the finding, or that the candidate finding is correct.*

## Sign-off and export
- **Requirements for sign-off:** a reviewer reference, a real review date, a disposition other than `NO_DISPOSITION` for every finding (each acknowledged as applying only to this packet), and confirmation of the sign-off statement.
- **After sign-off:** the dispositions lock and one click exports the JSON disposition record.
- **Verifying an export later:** `node tools/local-reviewer-workspace/verify-export.mjs <record.json> <packet.json>` checks it against its packet. It rejects an altered, cross-version, malformed or other-packet record.

## Commands
| Command | What it does |
|---|---|
| `node tools/local-reviewer-workspace/serve.mjs` | Starts the workspace at `http://127.0.0.1:4317/` (loopback only) |
| `node tools/local-reviewer-workspace/verify-export.mjs <record> <packet>` | Verifies an exported disposition record |
| `node tools/local-reviewer-workspace/make-demo-packet.mjs [--check]` | Regenerates, or checks, the synthetic demonstration packet |
| `node tests/local-reviewer-workspace/run-all.mjs` | All workspace tests, then the mutation run (`--quick` to skip it) |
