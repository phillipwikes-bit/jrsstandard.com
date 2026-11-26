# Decision Spellcheck (DS-N1): hosting design

Date: 24 November 2026. Status: a design for discussion. Nothing here is built or deployed beyond the local reference workspace.

## Recommendation: three deployment options, in order of fit

| Option | Who runs it | Data location | Best for |
|---|---|---|---|
| **A. Embedded library** | The licensee, inside its own product | The licensee's systems | Software vendors (GRC, HR case management, eDiscovery, AI governance) |
| **B. Single-organisation server** | The customer, on its own network | The customer's network | A compliance or investigations team buying directly |
| **C. Managed service** | The owner or a hosting partner | A dedicated region per customer | Smaller customers with no IT support; only after real-record terms exist |

Option A is the recommended first offer: it needs nothing new from the engine, keeps records in the buyer's systems, and matches the licensing package.

## Option B: single-organisation server

Built from `enterprise/server.mjs` with these additions:

1. **Network**: bind to a private interface behind the customer's reverse proxy, with TLS terminated at the proxy. The engine needs no outbound access, so egress can be blocked entirely.
2. **Identity**: replace bearer tokens with the customer's single sign-on (OIDC or SAML) at the proxy, mapping groups to the four existing roles.
3. **Keys**: hold the store passphrase and the Ed25519 audit key in the customer's secret manager, not in environment variables; rotate on a schedule with the audit log recording each rotation.
4. **Backups**: back up the encrypted store file as is; it is unreadable without the passphrase, and restores are verified by the existing audit-log check.
5. **Monitoring**: health endpoint plus log forwarding of audit events (event type and identifiers only, never record text).

## Option C: managed service

Only after: written terms for handling real records, an independent security review, and a data processing agreement template. Design: one isolated instance per customer (no shared database), customer-chosen region, the same controls as option B, and deletion on contract end with a signed deletion record from the audit log.

## What each option needs from the engine

| Need | A | B | C |
|---|---|---|---|
| Accept real records (currently refused by design) | Licensee decision under its terms | Customer decision | Owner decision plus terms |
| Single sign-on | Licensee's | Added at the proxy | Added at the proxy |
| Extraction from documents | Included (`extract.mjs`) | Included | Included |
| PDF (Word .docx is read directly) | Licensee converts | A converter step to add | A converter step to add |

## Not decided

Pricing, support levels, uptime commitments and the real-record policy are business decisions for the owner and are not part of this design.
