# JRS Licensing Data Room Index v1.0

**Status:** CONTROLLED DILIGENCE INDEX — evaluation/licensing preparation  
**Date:** 2026-09-20  
**Principle:** PUBLICIZE THE STANDARD. PROTECT THE IMPLEMENTATION.

## Purpose
This index organizes the stabilized JRS assets for prospective licensing or transaction diligence. Inclusion is an inventory/disclosure decision only. It does not establish ownership, licensability, legal sufficiency, market demand, validation, or transfer rights.

## 1. Standard and methodology — public/evaluation layer
- JRS Standard and the five review conditions.
- Current intentionally released JRS Codebook.
- JRS Adjudication Protocol v1.0.
- JRS External Challenge Pilot Protocol v1.0.
- Published methodology, field guides, and research pages subject to their stated limitations.

## 2. Decision Reconstruction Manifest — public interface layer
- `schemas/jrs-decision-reconstruction-manifest.schema.json`
- `docs/architecture/JRS_EVIDENCE_DECISION_RECONSTRUCTION_MANIFEST_SPEC_v1.0.md`
- Current manifest implementation/test evidence where disclosure is necessary for evaluation.

The existing v1.0 Manifest is the current architecture. No v1.1 expansion is authorized by this index. The unresolved Codebook-to-engine condition mapping remains unresolved and must not be hidden by a new schema.

## 3. Challengeability and validation
- `docs/architecture/JRS_ADJUDICATION_PROTOCOL_v1.0.md`
- `docs/research/JRS_EXTERNAL_CHALLENGE_PILOT_PROTOCOL_v1.0.md`
- Existing research evidence and provenance registers.
- E-037/E-038/E-039 and their exact limitations.
- External Challenge Pilot results only after real external execution. Until then: NOT MEASURED.

## 4. Provenance and evidence
- Master Asset / Evidence / Chain-of-Title Register.
- Evidence Ledger.
- Claims Register.
- Provenance Register.
- Research Integrity Register.
- Historical records remain historical; diligence packaging must not rewrite them.

## 5. Rights and chain of title — controlled
B-004 remains OPEN / COUNSEL. No Level A executed signed instrument is established in the accessible corpus. A recipient may be shown the factual rights inventory and provenance necessary for diligence, but this data room must not represent chain of title as established until competent review and evidence support that conclusion.

## 6. Technology — controlled
Disclose by minimum necessity:
- Review Engine interface/capability descriptions that match actual implementation and evidence;
- Manifest schema/interface;
- architecture diagrams or derived descriptions needed to evaluate integration;
- test/guard results necessary to substantiate a technical representation.

Do not default-disclose:
- server-side source;
- prompts/execution logic;
- credentials or environment configuration;
- adversarial fixtures;
- private deployment internals;
- unpublished datasets;
- proprietary commercial training templates.

## 7. Security/privacy diligence
Include current blocker/status records and production-verification evidence. Do not convert Vercel deployment success into proof of every live behavior. B-013/B-017 external Supabase permission operations remain separately verifiable production-control-plane actions until actually completed and evidenced.

## 8. Commercial/API contract caveat
B-007/B-016 remain COUNSEL matters. The published `openapi.json` and deployed implementation are not to be represented as reconciled until the licensed/public interface question is resolved and any authorized correction is implemented.

## 9. Disclosure sequence
1. Public standard/methodology.
2. Public research and limitations.
3. Public Manifest/interface material.
4. Controlled evidence/provenance extracts necessary for diligence.
5. Controlled implementation/security material only when the recipient's evaluation requires it.
6. Rights/transaction materials only under the appropriate review and transaction process.

Evaluation access does not itself convey ownership, source-code rights, derivative rights, trademark rights, publication rights, transfer rights, or any other license beyond what an executed instrument expressly provides.

## 10. Current diligence gates
- Production deployment: Vercel SUCCESS for current main; live byte/content equivalence remains separately evidenced.
- External Challenge Pilot: READY FOR EXTERNAL EXECUTION; results NOT MEASURED.
- Chain of title: OPEN / COUNSEL.
- API contract reconciliation: COUNSEL.
- Supabase permission operations: external production operation/verification required.
- Manifest: stabilized at current v1.0; no architecture expansion through this package.
