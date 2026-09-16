# Deferred Build Register

**Proposals tested against the §32 questions and deferred. Recorded so feature enthusiasm does
not become architectural drift.**

| Proposal | Purpose | Trigger to build | Dependency | Risk if built now | Value now | Reversible | Why deferred |
|---|---|---|---|---|---|---|---|
| **Rate limit on `/api/engine-activity`** | Blunt volume enumeration (T-2) | A measured abuse pattern, or a partner contract requiring it | none | Adds state to a stateless read | Low: 100-row cap and hour truncation already blunt it | Yes | **Not required for Gate 1; closes no blocker** |
| **`engine_reviews` retention rule** | Close T-4 | **None — this one is genuinely wanted next cycle** | B-013A decided (now true) | Choosing a period for record-derived content needs its own judgement | **High** | Yes | **NOT deferred on merit. It is OPEN and decidable next cycle** |
| Signature / PKI for the Manifest | Authenticity rather than integrity | A customer, transaction or regulatory requirement | none | Key management with no holder | None today | Yes | Trigger-based, unchanged |
| Server-side activity aggregation view | Reduce the 100-row read further | If volume grows | BD-02 shipped | Premature | Low | Yes | Deferred |
| Automated prohibited-term guard | Catch claim drift | A reliable assertion/negation discriminator | none | **Proven false positives twice** | Negative | n/a | **Deliberately not built** |
| Self-hosted fonts | Remove the Google IP disclosure | Owner decision, or a counsel view | D-10 decided: accept and disclose | Changes the asset pipeline | Low | Yes | Deferred hardening |
| CRM, billing, SaaS tenancy, certification, benchmarking product, IPCo/OpCo, acquisition portal, paid advertising | Commercialization | An actual license, pilot or transaction | B-004 counsel | **Would create rights and commercial claims the evidence does not support** | None | Varies | **Prohibited until a real trigger** |

**The second row is the honest one:** it is in this register because it was *considered* and
found to be wanted, not because it was rejected. It is tracked as **T-4, OPEN**, not as a
deferred build.
