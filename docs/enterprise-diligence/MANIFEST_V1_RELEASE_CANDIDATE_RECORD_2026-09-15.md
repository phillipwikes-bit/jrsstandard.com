# JRS Manifest v1.0 — Development Release Candidate Record

**This is a DEVELOPMENT RELEASE CANDIDATE.** It is **not** production, not validated, not
certified, not compliance-ready, not legally defensible and not enterprise-certified.

**Functional scope is FROZEN.** Further Manifest features are deferred unless a defect or a
concrete requirement emerges.

---

## Identity

| | |
|---|---|
| Asset | JRS Evidence & Decision Reconstruction Manifest |
| Version | manifest `1.0` |
| Date | 2026-09-15 |
| Commit | this cycle's commit on `claude/html-pilot-L8rC3` |
| Attribution | **AI-assisted development under owner direction.** Recorded as provenance |
| **Ownership** | **NOT ESTABLISHED.** Authorship is not title (Rule 4) |
| Dependency | JRS Standard 1.0 · Codebook 1.0 · Review Engine 0.1.0-validation |
| Third-party components | **NONE** |

## Technical state

| Component | Version |
|---|---|
| Schema | `jrs-decision-reconstruction-manifest.schema.json`, manifest_version `1.0` |
| Generator | `lib/manifest/build.js` |
| Validator | `tools/validate-manifest.js`, subset JSON Schema, offline |
| Canonicalization | **`jrs-dev-canon-1`** — a development canonicalization, **not** RFC 8785 |
| Engine | `0.1.0-validation` |
| Model | `claude-haiku-4-5-20251001` |
| API | `v1` |

## Evidence

| | |
|---|---|
| Manifest checks | **63, 0 failed** |
| Guard suite | **135, 0 failed, 1 skipped (online); 131, 0 failed, 2 skipped (offline)** |
| Guard mutations | **25 across four guards, all fail correctly** (schema 6, library 4, deployable 10, outbound 5) |
| Red team | Three findings, all mine, all remediated (PMRT-1, -2, -3); one recorded false positive (PMRT-4) |
| Independent review | Cold-reviewer test under `env -i`, no network. **All 13 questions answerable. Source correspondence ESTABLISHED** by recomputing the hash |

## Deferred, trigger-based

Signatures · PKI · authentication infrastructure · external trust registry · customer
dashboard · manifest database · analytics · benchmarking · SaaS billing · account management ·
customer portal · manifest search · automated legal or compliance determinations.

**None of these is built, and none should be built without a concrete customer, transaction,
regulatory or licensing trigger.**

## Limitations, stated as the release condition

- **No accuracy claim.** None is made or supported.
- **No empirical validation claim.** The engine is unvalidated.
- **No authenticity unless signed.** Signature verification is not implemented; an unsigned
  manifest reports **SELF-CONSISTENT**, never authentic.
- **Human review remains required.** `human_review.required` defaults to `true`.
- **The original record is required** to establish source correspondence, and to judge whether
  a note is fair.
- **The implementation is required** to explain why a status was assigned; routing logic is
  declared in no contract.
- **Three of five Codebook-to-engine condition mappings are UNRESOLVED**, which is why every
  manifest declares `condition_vocabulary` and the generator refuses to relabel.
- **A deterministic manifest hash is manifest reproducibility. It is not evaluation
  reproducibility and is not evidence of accuracy.**

## Status

**REMEDIATED (development) — NOT VERIFIED IN PRODUCTION — NOT DEPLOYED — NOT PUBLISHED.**
