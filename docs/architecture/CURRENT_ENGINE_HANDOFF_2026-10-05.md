# Current JRS Engine Handoff

**Effective date:** 2026-10-05  
**Applies to:** Claude Code and any other temporary development agent.  
**Status:** Current operating override for Engine and public-boundary work.  
**Supersession rule:** If this file conflicts with historical repository instructions, this file governs current Engine and public-site work. Historical material remains preserved and is not erased.

## Purpose

Allow bounded internal development without reopening public record intake, public Engine use, evaluation access, licensing, acquisition, or production deployment.

## Current public position

JRS is a public methodology, research, training, and practitioner-resource platform. The Review Engine is a controlled local-development candidate. It is not a public record-processing service, production system, autonomous decision-maker, public API, sandbox, integration product, licensing offer, or acquisition pathway.

Public review routes must refuse submissions. Do not restore, test, expose, or document a public route that accepts record text or returns an evaluation or Manifest.

## Current Engine scope

The local-development profile is limited to completed, non-HR supplier-access exception drafts. Human review is always required. The following uses are excluded: employment, housing, lending, insurance, medical, and legal-outcome decisions.

The Engine may identify record-level documentation flaws only, such as reasoning elisions, evidentiary overreach, chronology collapse, extraction omission, truncation, or unsupported content. It must not infer a writer's emotional state, intent, hidden payoff, or clinical condition.

## Allowed work

- Inspect, repair, and test controlled Engine code.
- Improve explicit extraction-failure, omission, truncation, and unsupported-content reporting.
- Improve local-only operator tooling that uses constructed or otherwise approved material.
- Prepare evaluation tooling, versioned review packages, audit trails, and holdout-separation controls.
- Audit stale claims, contradictions, public links, and access pathways.
- Run local and mocked regression tests.

## Prohibited work without a new explicit owner instruction

- Public record intake, public Engine/API evaluation output, sandbox access, token-gated access, public Manifest generation, or integration access.
- Deployment, live provider calls, external contact, customer onboarding, payment, licensing, acquisition, or rights transfer.
- Use of development, training, or debugging data in sealed holdouts.
- Numerical DRR scoring before formal reference interpretations and calibration data are locked.
- An asserted exact Engine-to-Codebook mapping without a versioned correspondence record.
- Claims of validation, production readiness, legal compliance, licensing readiness, sale readiness, or transferability.
- Modification of private owner surfaces, credentials, deployment settings, or external services.

## Release-gate status

External controlled use is **not verified**. Do not mark any gate complete.

1. Independent labeled and adjudicated holdout evaluation.
2. Actual operator-control evidence, including access, retention, recovery, and execution controls.
3. Counsel review of real data flows, privacy, evaluation claims, and any licensing claims.
4. Recorded owner release authorization.
5. Independent production QA, tracked as a distinct release check in the evidence ledger.

## Required startup procedure

1. Inspect `git status --short --branch`, current commit, and existing changes.
2. Read this file and the relevant code before proposing or changing anything.
3. Read the repository baseline files named in `CLAUDE.md`.
4. Obtain the October 3 source-aligned files listed below for any task involving evidence, release status, rights, privacy, deployment, or public claims. If they are unavailable, stop and report the limitation rather than relying on stale historical instructions.
5. Treat an instruction conflict as a documented stop condition. Do not resolve it by inference.
6. Before completion, run focused tests, report exact files changed, state what remains unverified, and identify any human action required.

## Source-aligned materials to provide with a Claude session

These files were supplied outside this repository for the current alignment review. Their filenames and SHA-256 values are recorded so the working copy can be verified.

| File | SHA-256 |
|---|---|
| `01_JRS_Master_Asset_Register_Source_Aligned_2026-10-03.md` | `0c64eaff74cae34b4c4fbe00c93ae80ac81007c59ecfe68d6f0a1f9ada795c5e` |
| `02_JRS_Evidence_Ledger_Source_Aligned_2026-10-03.md` | `57e2ec50fc431381b65048f978175e779481bb174993448cd1b475a218dad0e0` |
| `03_JRS_Master_Architectural_Blueprint_Aligned_2026-10-03.txt` | `a8822d7f54012dd646d822ab2eaca1b00a77e4c7f2c81522c61e6d774573efe9` |

## Minimum verification commands

```bash
node tests/engine/auth-matrix.mjs
node scripts/test_review_incomplete.mjs
node tests/public-route-alignment.mjs
git diff --check
```

## Required closing report

State: task, current commit, evidence inspected, factual findings, files changed, tests and results, public-boundary effect, security/privacy effect, unresolved contradictions, human action required, and gate impact. Label unverified matters as `NOT ESTABLISHED`.
