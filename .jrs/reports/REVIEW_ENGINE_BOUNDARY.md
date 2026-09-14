# Review Engine Boundary

**Phase 1, Step 6G** · 2026-09-14 · Documentation only. **No production change was made.**

The purpose of this document is to say where the JRS methodology ends and where implementation, provider dependency and transport begin, so that a future engineer or buyer can replace a layer without touching the layer above it.

## The seven layers

| # | Layer | Where it lives | Substitutable without changing JRS? |
|---|---|---|---|
| 1 | **JRS methodology** | `codebook.html`, `jrsstandard.html`, `JRS-Standard.pdf`, `standard/jrs-conditions.json` | No. This *is* the asset. |
| 2 | **JRS review logic** | The five Review Conditions and their test questions | No. Changing these changes the standard. |
| 3 | **Implementation code** | `api/review.js`, `api/review-engine.js`, `api/v1/review-engine.js` | Yes |
| 4 | **Model / provider dependency** | `claude-haiku-4-5-20251001` via the Anthropic API | **Yes, and it must be treated that way** |
| 5 | **API layer** | Vercel Edge Functions; `openapi.json`, `openapi-review-engine.json` | Yes |
| 6 | **Telemetry** | `api/telemetry.js`, `interaction_events` in Supabase | Yes |
| 7 | **Validation evidence** | `research/`, the detection study, the guard suite | Independent of all of the above |

## Layer 4 is the point of this document

**FACT.** The model identifier is pinned as a string literal in the engine source.

**The identifier is versioned infrastructure, not part of the JRS methodology.** A model reaching end of life must not read as a change to the standard. Nothing in layers 1 or 2 depends on which model is used; the conditions are stated in natural language and are model-independent by construction.

**No change was made.** Section 3 Step 7 forbids modifying substantive assets during initialization, and the directive governing Phase 1 says not to make an unnecessary production change merely to satisfy architectural preference. The change is specified here and recorded as blocker **B-005** for a later, approved pass:

| | |
|---|---|
| Current state | Model id is a literal in the engine source |
| Proposed state | Read from an environment variable with the current id as the documented default |
| Reason | Decouple a provider lifecycle event from the JRS asset |
| Risk | Low. A missing variable falls back to the present literal, so behaviour is unchanged by default |
| Compatibility impact | None to callers. The output contract does not change |
| Rollback | Revert one commit; the default preserves current behaviour |
| Approval | Required before any production change (Section 26) |

## Two output contracts, not one

See `.jrs/contradictions/CONTRADICTION_001.md`. `api/review.js` and the two review-engine endpoints return **different condition vocabularies and different state vocabularies**, and the two OpenAPI documents do not agree with each other either.

**This must be resolved before any engine change** (blocker B-002). A change made against one contract may silently break a caller written against the other.

## What the engine does not establish

**Functional operation is not validation.** The engine declares itself unvalidated in every response, and that self-declaration is an asset rather than a weakness: it is the reason a reader can trust the rest of the output. Any change that removes it is a claims regression, not a UX improvement.
