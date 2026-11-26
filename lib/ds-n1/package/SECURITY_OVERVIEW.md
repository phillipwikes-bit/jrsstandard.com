# Decision Spellcheck (DS-N1): security overview for a buyer's security team

Date: 24 November 2026. Scope: the DS-N1 engine, the document extractor, the reviewer pages and the enterprise reference workspace in this package. Every statement names the file that implements it, so it can be checked. This is a description of the design, not a certification, penetration test or compliance attestation; none of those has been done.

## 1. Data flow

| Step | Where it runs | What leaves the machine |
|---|---|---|
| Plain-text documents to a record package (`extract.mjs`) | Local process | Nothing |
| Review, findings, report (`assess.mjs`, `session.mjs`, `report.mjs`) | Local process or browser | Nothing |
| Word files to text (`docx.mjs`) | Local process or browser | Nothing; reads only `word/document.xml`, refuses files over 20 MB or a document body over 10 MB, and checks the unpacked size against the archive's own record |
| Reviewer, author and reading pages (`ui/`) | Browser, served from local files | Nothing; no analytics, fonts or scripts from other hosts |
| Starter edition (one HTML file, `build-starter.mjs`) | Browser, opened from disk | Nothing; all code is embedded in the file, and a browser test confirms it makes no network request |
| EU AI Act lens and omission check (`eu-ai-act.mjs`, `omissions.mjs`) | Local process or browser | Nothing; read-only, never change a status |
| Enterprise reference workspace (`enterprise/server.mjs`) | Local HTTP server bound to 127.0.0.1 | Nothing; it refuses connections from other machines |

There are no network calls and no AI model calls anywhere in the engine or the extractor. A test asserts this for the extractor (`tests/ds-n1/extract.test.mjs`). Records therefore never reach a third-party AI provider.

## 2. Input controls

- **Scope gate before analysis** (`record.mjs`): unsupported record types, excluded domains (employment outcomes, housing, lending, insurance, medical, legal outcomes) and any record not marked fictional are refused before any processing. Exceptions, each an owner decision: investigation reports may contain employment wording, and AI authorization records may concern any of these domains (EU AI Act Annex III areas), documentation quality only.
- **Identifier screen** (`record.mjs`): email addresses, national identifiers, phone and account numbers cause a refusal; the matched value is never echoed in errors or logs.
- **Size limits** (`record.mjs`): record text 200,000 characters; source text 500,000; 50 sources; 200 claims.
- **Instruction-like content** (`assess.mjs`): sentences addressed to a model or tool ("Instruction: ignore …") are flagged for review, never followed.

## 3. Integrity and audit

- **Review event log** (`session.mjs`): every reviewer action is appended to a hash chain over canonical JSON; `verifyChain` detects any edit, deletion or reordering.
- **Enterprise audit log** (`enterprise/workspace.mjs`): every administrative and review event is hash-chained and signed with Ed25519; verification checks signatures, the chain and the ordering.
- **Export check** (`verify.mjs`): an exported evidence pack can be re-verified independently of the tool that made it.
- **Reproducibility** (`tests/ds-n1/REPRO_BASELINE.json`): the same input yields byte-identical reports; the baseline is re-checked by tests.

## 4. Access and storage (enterprise reference workspace)

- **Roles** (`enterprise/workspace.mjs`): admin, reviewer, approver, auditor, scoped to an organisation.
- **Tokens**: 24 random bytes, shown once, stored only as scrypt hashes; compared in constant time.
- **Storage at rest** (`enterprise/store.mjs`): AES-256-GCM with a key derived by scrypt from an operator passphrase of at least 16 characters, a random salt and IV per save, and an authentication tag that detects alteration.
- **Retention** (`enterprise/workspace.mjs`): reviews older than an organisation's retention period can be purged; each purge leaves a content-free entry in the signed audit log.

## 5. What is not in place

- Single sign-on, multi-tenant hosting, rate limiting at the network edge, key rotation and hardware key storage.
- An independent security review or penetration test.
- A formal vulnerability disclosure process.
- Processing of real records: deliberately refused today (section 2).

A licensee embedding the engine supplies hosting, identity, network controls and monitoring; the engine needs no outbound network access, which keeps that integration simple.

## 6. Dependencies

The engine, extractor and workspace use only the Node.js standard library (`node:crypto`, `node:fs`, `node:http`, `node:path`, `node:url`); there are no third-party runtime packages. One optional feature, PDF export (`export-pdf.mjs`), loads Playwright if it is installed; without it, reports are still produced as HTML and JSON. Browser checks in the test suite also use Playwright, which is not shipped.
