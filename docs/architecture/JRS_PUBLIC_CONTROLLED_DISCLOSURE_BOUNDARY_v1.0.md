# JRS Public / Controlled Disclosure Boundary v1.0

**Status:** CONTROLLED ARCHITECTURAL BOUNDARY  
**Date:** 2026-09-20  
**Principle:** PUBLICIZE THE STANDARD. PROTECT THE IMPLEMENTATION.

## 1. Public layer

Public disclosure may include the JRS Standard; Decision Reconstruction Risk definitions; the five review conditions; Codebook material intentionally released for independent use; practitioner field guides; rapid-review materials; public training resources; published research and explicit limitations; public examples and simulations; methodology explanations; public Review Engine capability descriptions that match current evidence; the Decision Reconstruction Manifest schema where intentionally released; and implementation guidance that does not reveal controlled execution details.

Public material must support professional familiarity, reproducibility of the disclosed methodology, independent criticism, and accurate evaluation. Public does not mean unowned, unprotected, or licensed for every use.

## 2. Controlled layer

Keep non-public unless a deliberate transaction, research, security, or licensing purpose requires disclosure:
- Review Engine source code;
- server-side API implementation;
- prompts and execution logic not required to understand the public methodology;
- internal test harnesses and adversarial fixtures;
- unpublished datasets and benchmark-construction materials;
- private implementation documentation;
- deployment architecture details whose disclosure creates avoidable security or operational risk;
- credentials, secrets, environment configuration, internal infrastructure identifiers;
- proprietary commercial training templates;
- non-public research records;
- internal operating procedures and optimization methods;
- diligence materials containing confidential rights, contributor, security, or transaction information.

## 3. Minimum-necessary rule

Before disclosing a controlled artifact, identify the purpose and disclose only the fields, excerpts, interface contract, or derived representation necessary for that purpose. Prefer schema, interface, test result, or redacted evidence over source code when the recipient does not need source code.

## 4. Research reproducibility rule

Do not use proprietary status to hide information necessary to understand a published empirical claim. Publish enough method, sample definition, measurement rule, denominator, analytic method, limitations, and where appropriate de-identified supporting material to permit meaningful scrutiny. This does not require publishing credentials, production source code, private participant data, or unrelated implementation details.

## 5. Manifest boundary

The machine-readable Manifest schema is an integration/evidence contract and may be public when intentionally released. Manifest-generation implementation, internal canonicalization code, signing infrastructure, engine prompts, and customer-specific deployment logic remain controlled unless separately authorized.

## 6. Trade-secret caution

A controlled item is not automatically a trade secret. The repository may call an item confidential, controlled, or a trade-secret candidate only when the factual basis supports that classification. Legal trade-secret status is not inferred from this boundary document.

## 7. Transaction disclosure

Prospective licensees may receive progressively more information under an appropriate disclosure process. Evaluation access does not automatically convey source-code rights, methodology ownership, derivative rights, trademark rights, research/publication rights, or transfer rights.

## 8. Prohibited public representations

Do not publish:
- target architecture as current implementation;
- compliance certification or legal-compliance conclusions not established by competent authority;
- unsupported effectiveness, accuracy, reliability, reproducibility, security, privacy, ownership, market-demand, or customer-outcome claims;
- sensitive participant or customer information;
- credentials or secrets;
- controlled implementation merely to create an appearance of openness.

## 9. Review rule

A new public artifact that mixes methodology and implementation must be reviewed against this boundary before release. When uncertain, preserve the public methodology and withhold only the implementation detail whose disclosure is unnecessary to understand or evaluate the methodology.
