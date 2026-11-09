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

## Interrupted revision save verification

The staged editor now retains an in-memory fingerprint of the submitted revision. An explicit readback can confirm an interrupted save only when the current server revision and ciphertext checksum equal that submission and the payload decrypts successfully. A mismatched head, wrong passphrase or expired session keeps the draft on hold. Readback does not retry an append. A failed clean reopen clears the private workspace projections until a verified reopen. Unsaved recovery drafts remain protected from replacement.

The new source regression first failed because the editor offered no exact readback action. The runtime regression passed after implementing the action. The local browser initially could not start because the executor denied Chromium socket creation. Debian headless Chromium 156 with its packaged resources and isolated launch arguments then ran the native controls. The first browser exercise caught an empty-workspace status defect in the new reopen path. The corrected browser test passed, including actual save and verify controls, one committed write after the lost acknowledgement, wrong-passphrase redaction, successful reopen and 320/375/430px layouts.

## Exact preview and original publication source follow-up

Commit `0827109e0121aba368a90d1b5fe14f8f61d3939a` passed all ten GitHub Actions workflows, including source [42612054080](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42612054080), isolated security [42612054019](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42612054019), accounting/DS-N1 browser [42612053949](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42612053949), mobile [42612054018](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42612054018) and disposable PostgreSQL [42612054405](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42612054405). Vercel built a matching protected preview. Anonymous requests to the root, accountant script, vault script and manifest each returned HTTP 302 to Vercel SSO. An authorized hosting read returned the Owner Desk HTML. This establishes the hosting protection and page availability for that preview. A separate application-level owner sign-in and recovery exercise remains outstanding.

A later authorized native Git read recovered the exact saved version 5 publication commit. Git integrity checks passed. All 18 SHA-256 entries in its provenance manifest matched the retrieved publication files and 13 JavaScript files parsed without execution. The checkout contains compiled browser assets and no authoritative original Codebook or clean-build dependency lock. The canonical development path named in the native README did not appear in the inspected history of 165 remote branches in the connected public repository. The other connected repository did not resolve the publication identifier. This is verified publication-source custody. Original DS-A equivalence, clean-build provenance, Codebook custody and rights remain unresolved. No recovered source or private access metadata was published to the public repository.

## Guarded staging entry and original acceptance controls

The source now prepares an origin-bound staging copy of the existing Owner Desk for an independently approved nonproduction Supabase project. Known live project references and non-publishable keys are refused. The staged login calls the configured isolated project. The legacy vault write and restore paths are disabled in that copy. The operator must explicitly open the revision editor and save. Session expiry and denied staging access detach the private workspace, clear credential fields and require a new sign-in. Voluntary sign-out warns when a draft is open. Unsaved edits without a prior encrypted rescue download remain session-bound.

The existing mobile CI browser entry now also exercises the prepared stage at 375 px with the actual client, AES-GCM and intercepted synthetic Auth/RPC responses. It verifies failed sign-in, allowlist denial, one explicit encrypted write, expired-session redaction, fresh sign-in after reload, correct decrypted recovery and zero browser-storage entries. The first staging browser run exposed a 459 px layout viewport when the vault opened at 375 px. Constraining the vault grid and form fields corrected the overflow and restored native bottom navigation. Both staging browser exercises and the Decision Spellchecker programme browser passed locally.

The SP harness in the authoritative programme requires separate primary source-custody, Codebook, reproduced-build and verification-rights evidence tied to the same source digest. Approval binds the exact evidence artifacts. Each of the 18 checks requires the original clause and an independently executed result tied to its build and clause digest. An adverse result for that pair reopens an accepted check and remains in the evidence record. Historical generic approvals stay inspectable while the effective gate remains blocked. The first regression reproduced acceptance of generic source-gate evidence. The corrected programme, inspection, original gate and synthetic DS-N1 integration suites passed. The harness records prerequisites and results. The underlying records still require independent authentication and adjudication.

The private publication's embedded compiler inventory was statically extracted without executing the application. All 47 compiler-file hashes matched its embedded manifest and the inventory contents matched the preceding native version. This verifies continuity of that compiler inventory. The original Codebook, the complete authoring and build checkout, the native saved tar bytes and rights remain outstanding. No original SP test has executed. Actual acceptance stays at 0 of 18. DS-N1 remains experimental and JRS remains separate.

The 120-cycle protocol run observed 240 competing attempts, 120 commits, 120 stale refusals, 247 reads, 121 simulated review confirmations and one resolved interrupted commit. After the races, the two writes were the committed save with the lost acknowledgement and a subsequent explicit append. Unexpected failures were zero. The confirmations were exercised by the test driver. The result provides a count of review steps for this workload.

The preceding interrupted-save commit `891156af71d33e51cd1379eb3a2e6a5629966d7c` passed all ten GitHub workflows. The corresponding protected preview reached READY. In the separate Vercel project, a non-decrypting branch-specific environment inventory returned no configured variables. The prepared staged copy still requires an approved nonproduction Supabase project, scoped migration access, and two operator-provisioned synthetic identities. The deployed branch preview serves the regular entry.

## Accounting acceptance dispositions on 9 November 2026

| Requirement | Disposition | Current evidence boundary |
| --- | --- | --- |
| A01 Owner authentication | OWNER ACCEPTANCE PENDING | Hosting access and isolated session behavior tested. Actual owner session remains pending. |
| A02 Unauthorized access | PROTECTED PREVIEW VERIFIED | Exact protected preview denied anonymous root and static assets. Synthetic RPC and database role denial also passed. |
| A03 Income entry | SOURCE TESTED | Shared ledger and native accounting entry tests passed with synthetic records. |
| A04 Expense entry | SOURCE TESTED | Prepared staging browser saved one synthetic expense after explicit action. |
| A05 Corrections and deletion | SOURCE TESTED | Editing, deletion and history-preserving reversal covered by accounting and staged suites. |
| A06 Preservation and retrieval | SOURCE TESTED | Exact interrupted-save readback and synthetic restart recovery verified. Trust anchors remain in page memory. |
| A07 Backup restoration | SOURCE TESTED | Encrypted restoration and compatible claim history merge tested. Actual owner backup custody remains pending. |
| A08 Calculations | SOURCE TESTED | Synthetic accounting and allocation tests passed. |
| A09 Duplicate handling | SOURCE TESTED | Existing transaction checks and reused claim payment-reference refusal passed. |
| A10 Reconciliation | SOURCE TESTED | Evidence and uncertainty classifications exercised with synthetic records. |
| A11 Accountant reporting | SOURCE TESTED | Synthetic report generation and classification exercised. |
| A12 iPhone usability | SOURCE TESTED | Chromium mobile layouts and native controls exercised. Physical Safari acceptance remains pending. |
| A13 Transmission | SOURCE TESTED | Origin-scoped, redirect-refusing, encrypted-only revision requests and absence of browser-storage entries tested. |
| A14 Secure storage and recovery | BLOCKED | Isolated hosted revision target and actual owner recovery remain prerequisites. |
| A15 Rollback readiness | PROTECTED PREVIEW VERIFIED | Protected deployments and historical rollback targets documented. Actual rollback rehearsal remains pending. |
| A16 Owner publication approval | BLOCKED | Requires formal acceptance and the owner's explicit release decision. |

Production and commercial release remain on hold. The next executable infrastructure sequence is scoped migration preflight, two-identity hosted denial and append tests, interruption recovery, and a non-destructive rollback rehearsal. Owner-only steps are physical iPhone and separate-session recovery acceptance, available original-source custody and rights attestation, and a later release decision once the gates are met.
