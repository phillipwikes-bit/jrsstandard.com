# IncomeOS execution evidence, 9 November 2026

Draft pull request #180 in `phillipwikes-bit/jrsstandard.com`. Branch `verification/incomeos-accounting-ci-20261108`. Starting head `df54fe2cacf29bc0778fc1b8ed87e5def3c0d222`.

## Vault request boundary and claim backup reconciliation

The legacy vault now refuses redirects on sign-in and encrypted-storage requests. The request-policy regression first rejected sign-in at the earlier implementation because it used the default redirect behavior. The corrected request path keeps the configured HTTPS endpoint, generic network errors and the existing uncertainty hold for interrupted uploads.

Encrypted backup review now uses the existing claim engine to replay the history from its opening state. Compatible extensions and additional claims may be selected for recovery. Earlier prefixes preserve the current history. Invalid or divergent transitions, repeated claim identities, ambiguous finding links and reused payment references block the claim section. Other eligible sections remain available. Applying a selection changes only the draft. It preserves the current ledger, Decision Spellchecker programme and existing workspace history. A restored bank reference is owner-recorded evidence and requires independent verification. No claim submission, bank lookup or financial transaction is part of this workflow.

The compatible claim-history regression first failed because the prior editor blocked every claim restoration. The corrected encrypted-backup suite passed 13 tests, including two dedicated claim scenarios. The accounting source suite passed 47 tests, with zero failures. The 33 isolated security commands passed. The deterministic source exercise ran 120 two-writer races, with one stale refusal per race, and covered a lost acknowledgement, rollback refusal and ciphertext equivocation.

The repository database fixture ran on a fresh local PostgreSQL 17.11 instance using synthetic owners and records. The SQL assertions passed for checksum and envelope checks, role denial, two-owner isolation and atomic append. The concurrent exercise recorded 24 races, 48 attempted writes, 24 committed race writes, 24 stale refusals, one rolled-back transaction and one explicit recovery append. Zero unexpected failures were observed. The race script measured one elapsed second. The disposable database was stopped after the run.

## Decision Spellchecker custody

The owner-scoped native project lists saved version 5 with source identifier `1a86aed4e731b3d874bced9828db52cda574e49e` and a 20-entry tar archive. The connected GitHub repositories did not resolve that identifier. Inspected source-admission branches identify candidate tooling and documentation, and the experimental branch identifies itself as DS-N1. The Library's 0.6.11 gate identifies the local 0.6.11 candidate as a separate implementation. The archived version metadata is a custody lead. Original Codebook authenticity, archive bytes, build reproducibility and rights remain open. The existing SP-01 through SP-18 source gate passed its synthetic refusal checks. No DS-A acceptance run occurred.

## Release boundaries

The Vercel IncomeOS project reports SSO protection for all deployments. The starting commit has no matching deployment. Its two GitHub Vercel statuses indicate a build-rate limit. The Vercel project lists no custom environment for this branch. The approved nonproduction Supabase target and scoped migration access remain outstanding. Historical preview evidence stays dated to the applicable prior commits.

A07 and A13 gain source evidence without a change in disposition. The register retains eleven SOURCE TESTED items, two historical PROTECTED PREVIEW VERIFIED items, one OWNER ACCEPTANCE PENDING item and two BLOCKED items. Production verification remains unset. Actual owner recovery, original DS-A acceptance and production/commercial authorization remain separate gates.
