# D-3 — Codebook / API Correspondence Decision Matrix

> **SUPERSEDED IN PART BY BOARD DECISION BD-04, 2026-09-16. STAMPED 2026-09-20.**
> **Nothing below was rewritten.** The rows marked Open / OWNER for
> **Reconstructability**, **Chronology** and **Decision-Process Traceability** were correct on
> this document's own date and are **no longer current**. BD-04 **DECLARED** all three:
> `reasoning_traceability`, `temporal_reconstructability` and **`accountability_support`**
> respectively. **Declared is not upgraded** — all three remain SEMANTIC / INFERRED, and the
> prohibition on describing the engine as a restatement of the Codebook stands.
>
> **One row is still genuinely unresolved and it is not D-3's.** Evidentiary Sufficiency /
> `cold_reviewer_clarity` is **D-2, INTENTIONALLY UNRESOLVED**, which BD-04 declined to decide
> because it is a question about what the engine computes, not about what a field is called.
>
> **AUTHORITATIVE:** `JRS_BOARD_DECISION_REGISTER_2026-09-16.md` (BD-04) and the BD-04 section
> of `METHODOLOGY_TO_API_MAPPING.md`. **D-3 is CLOSED. Do not route it to the owner again.**

**Authoritative source: `docs/enterprise-diligence/METHODOLOGY_TO_API_MAPPING.md`, read before
this matrix was built. Classifications are carried forward unchanged.**

Vocabulary is **EXACT / SEMANTIC-INFERRED / UNRESOLVED only.**

---

| # | Codebook condition | API key | Manifest key | Relationship | Evidence | Status | Authority |
|---|---|---|---|---|---|---|---|
| 1 | **Basis Identification** | `basis_identification` | same | **EXACT** | Name and sense both correspond | Settled | — |
| 2 | **Reconstructability** | `reasoning_traceability` | same | **SEMANTIC / INFERRED** | Plausible rendering; **declared nowhere** | Open | **OWNER** |
| 3 | **Chronology** | `temporal_reconstructability` | same | **SEMANTIC / INFERRED** | "Temporal" corresponds in sense; not the Codebook name | Open | **OWNER** |
| 4 | **Decision-Process Traceability** | `accountability_support` | same | **UNRESOLVED** | Two keys plausibly map to two conditions both containing "traceability". **Swapping rows 2 and 4 would be equally consistent with the evidence** | Open | **OWNER** |
| 5 | **Evidentiary Sufficiency** | `cold_reviewer_clarity` | same | **UNRESOLVED** | Codebook calls this the **aggregate**; the engine treats the key as a peer | Open | **OWNER** |

**Five conditions, five keys, and exactly one name appears in both lists.**

## Record-level vocabularies — a separate question, often conflated with this one

| Source | Values |
|---|---|
| Published `openapi.json` | `Ready` · `Needs work` · `Gap` |
| Implemented engine | `ready` · `review_required` · `gap_identified` |

**`Needs work` appears nowhere in the Codebook.** Emitting it to satisfy the published contract
would put a **fourth** record-level vocabulary into production. That is why the API
reconciliation's recommended option cannot proceed until this matrix is settled.

## Control rules, restated because they are the point

1. A SEMANTIC relationship is **never** upgraded to EXACT for software convenience.
2. **No translation table exists in the manifest builder, and it throws rather than guessing.**
3. The engine's keys must not be represented publicly as a restatement of the Codebook.

## Owner decision required

> **Declare the intended correspondence for rows 2, 3, 4 and 5 — in particular whether
> `cold_reviewer_clarity` is the aggregate or a distinct dimension.**

**Until then: UNRESOLVED, visibly, in the artifact and in the code.**
