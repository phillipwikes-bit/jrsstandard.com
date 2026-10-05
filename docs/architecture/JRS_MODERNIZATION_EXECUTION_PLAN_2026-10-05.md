# JRS Modernization Execution Plan

**Review version:** Public and controlled modernization review 2026-10-05.  
**Scope:** User convenience, accessibility, operational clarity, and safe internal workflow support.  
**Status:** Phase 1 and Phase 2A implemented. Remaining phases are gated.

## Purpose

Modernize the JRS experience without changing the published method, exposing controlled materials, accepting public records, or implying that the Review Engine is production-ready.

## Implemented

1. **Public-resource navigation.** The resource hub now offers four direct starting paths: the Standard, a self-guided check, training and practice, and research with limitations.
2. **Public-boundary clarity.** Technical-artifact links now lead to implementation status rather than suggesting a public Manifest service.
3. **Machine-readable refusal.** Public review endpoints now identify the controlled-development state, record-submission refusal, human-review requirement, and the four release gates in every refusal response.
4. **Regression coverage.** Boundary tests assert every new status field and every release gate, as well as the existing no-outbound-call safeguard.

## Deferred by gate

| Phase | Outcome | Required before work may proceed |
|---|---|---|
| 2B: Internal review workspace | Authenticated, local-only operator workspace for authorized constructed or otherwise approved records | Defined operator environment and access-control evidence |
| 3: Controlled evaluation workflow | Versioned review packages, independent labels, adjudication, and sealed holdout handling | Locked reference interpretations and strict holdout separation |
| 4: External controlled use | Limited, approved deployment pathway | Independent holdout evaluation, operator-control evidence, counsel review, and recorded owner authorization |

## Non-negotiable controls

- No public record submission, sandbox, token-gated API, or public evaluation result.
- No numerical DRR score until reference interpretations and calibration data are locked.
- No claim that an Engine output is an exact Codebook mapping without a versioned correspondence record.
- Extraction failure, omission, truncation, and unsupported content must remain explicit.
- Holdout data must remain sealed from development, training, and debugging.

## Verification record

The focused public-boundary tests must pass before publication. The public website and the controlled Engine remain separate release surfaces. This plan does not authorize production use, a rights grant, a commercial offer, or a transaction.
