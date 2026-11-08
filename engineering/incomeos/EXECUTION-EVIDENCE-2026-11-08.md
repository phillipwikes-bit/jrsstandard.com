# IncomeOS controlled engineering evidence, 8 November 2026

Repository: `phillipwikes-bit/jrsstandard.com`. Draft PR #180. Branch: `verification/incomeos-accounting-ci-20261108`. Starting commit: `e55e3d38f8ffd57e2d059cd12d6b5b8faaab6e63`.

## Corrections implemented

- Enforce finite vault session expiry using the earlier supplied absolute/relative deadline. Reject a login response without usable expiry, revoke on server HTTP 401, and recheck authorization after asynchronous requests and integrity hashing. No refresh token is retained.
- Extend the staged session boundary to local accounting drafts, edits and encrypted rescue exports. Closing or explicitly discarding local drafts remains available for cleanup. Previously bound runtimes cannot be reactivated by a later login.
- Bound staged revision RPC requests, including response-body reads, to 30 seconds. Abort timed-out requests, suppress raw network/service errors and require reopen after uncertain results. No automatic retries or additional writes are introduced.
- Correct original Decision Spellchecker acceptance controls: generic evidence labelled DS-A cannot accept a check with a blank original criterion or an open original-source gate. Preserve all 18 ordered SP identities. Add a read-only verification plan and exact original-clause recording within the existing programme, without another store or test execution.
- Correct stale acceptance-register descriptions of outbound requests, hosted encrypted storage and code-versus-data rollback. A14/A16 remain BLOCKED and `milestoneComplete` remains false.

## Source recovery evidence

An authorized local historical 0.7 workflow candidate was located. Its commit identifier matches both the historical secondary custody note and the current native saved-version 5 source metadata. All 18 files named in its local provenance manifest match SHA-256; the provenance manifest itself hashes to `171f365c784176979d56067ec1a7bdb71a17985caf1b095425bc977225e71cd7`. No candidate implementation, private hosting identifier, credential or Codebook is copied into this public repository.

This establishes a source-custody lead, not authenticated DS-A equivalence, clean-build reproducibility, Codebook custody, rights or independent acceptance. The candidate itself records `NO_GO_NOT_VERIFIED`. The exact historical source, original Codebook, dependencies, permitted build configuration and independent original-product evidence must still be reconciled. DS-N1 remains experimental.

Connected document inspection located the preserved SP capability/adverse-proof tables in the historical annex of *JRS/DRR/Decision Spellchecker Comprehensive Master Issue 3.6*, native file version 2, pages 162-163 and 191-192. They support preparation, not silent replacement of the exact historical contract. No original SP acceptance test was executed. All actual original checks remain NOT_ACCEPTED.

Bounded searches also covered GitHub repository/branch names and connected Drive. No additional original executable or authoritative Codebook was resolved by those searches. Search absence is limited to those inspected scopes.

## Verification observed before commit

| Verification | Observed result | Scope |
| --- | --- | --- |
| Accounting/source validation command from CI | 41 tests passed, 0 failed | Synthetic/source checks, no owner data |
| Isolated revision/security command | 13 test files passed, 0 failed | Includes finite expiry and bounded RPC regressions |
| DS original verification preflight regression | Passed | Control-model test only; original SP tests NOT_EXECUTED |
| Existing DS programme regression | Passed | Existing programme behavior retained |
| DS evidence export and runtime bridge | 12 tests passed, 0 failed | Fictional DS-N1 cases only |
| Local Chromium vault browser launch | Could not execute | Host denied Chromium process-singleton socket creation; no browser assertion ran |
| Current-head protected preview and disposable PostgreSQL | Pending CI/authorized environment | Earlier-head success is not current-head evidence |

The existing reliability soak is included in the isolated suite: 120 synthetic CAS race cycles, 120 stale writes rejected, explicit commit-then-timeout recovery, rollback and ciphertext-substitution refusal, no automatic financial execution. This is a deterministic test run, not an unattended owner operating observation window.

## Independent evaluation of all accounting requirements

The existing `owner/incomeos/ACCOUNTING-EDITOR-ACCEPTANCE.json` remains authoritative.

| ID | Retained status | Evidence boundary or unresolved dependency |
| --- | --- | --- |
| A01 | OWNER ACCEPTANCE PENDING | Finite-expiry/revocation source tests added; live owner identity and actual recovery still pending |
| A02 | PROTECTED PREVIEW VERIFIED | Historical protected denial evidence retained; full effective-access audit/current head not certified |
| A03 | SOURCE TESTED | Existing synthetic income-entry checks pass; no bank verification inferred |
| A04 | SOURCE TESTED | Existing expense-validation checks pass; owner device entry still pending |
| A05 | SOURCE TESTED | Existing correction/deletion checks retained; no owner records modified |
| A06 | SOURCE TESTED | Revision/draft source checks pass; live cross-device integration not enabled |
| A07 | SOURCE TESTED | Existing encrypted backup tests retained; actual owner restore not observed |
| A08 | SOURCE TESTED | Synthetic calculation checks pass; no accountant opinion or filing readiness |
| A09 | SOURCE TESTED | Existing duplicate controls pass within their declared matching scope |
| A10 | SOURCE TESTED | Owner-recorded reconciliation remains distinct from independently verified bank linkage |
| A11 | SOURCE TESTED | Existing reporting checks retained; accountant review pending |
| A12 | SOURCE TESTED | Local browser unavailable; current-head CI and physical iPhone acceptance required |
| A13 | SOURCE TESTED | Encrypted egress and expiry checks added; actual hosted headers not certified |
| A14 | BLOCKED | Live owner recovery, approved revision migration, durable rollback anchor and acceptance absent |
| A15 | PROTECTED PREVIEW VERIFIED | Historical release evidence retained; current-head deployment/rollback exercise absent |
| A16 | BLOCKED | Explicit owner release approval remains required |

## Release and next independent work

Retain the draft, production hold, original-product acceptance hold and commercial hold. No merge, promotion, paid access, billing, purchase, transfer or reinvestment is authorized by this evidence.

Independent tasks include current-head CI verification, additional interrupted-save regressions, mobile disclosure hit-testing, staged editor integration, disposable PostgreSQL authorization/concurrency checks and non-destructive source-custody reconciliation. A real authenticated owner recovery exercise, actual iPhone acceptance, grant/rights decisions and final production/commercial approval require their respective human evidence. Unavailable infrastructure credentials must be recorded specifically rather than bypassed.

## Follow-on correction and exact-commit CI evidence

Commit `30615d8f7f3393e459c19c80c1c833457f1ed02b` completed all seven workflows successfully: source `42467807192`, isolated security `42467807190`, disposable PostgreSQL `42467807191`, accounting/DS browser `42467807298`, mobile/staging browser `42467807254`, private prototype `42467807212`, anonymous denial `42467807245`. These are CI/source and synthetic browser/database results, not live owner acceptance.

Subsequent source work adds a 30-second legacy vault deadline covering the response body, an uncertain-save quarantine requiring a fresh integrity-verified read, and a synchronous session check immediately before staged RPC dispatch. A synthetic commit-then-lost-ACK test observed one write, zero automatic retries, a retained hold after a late ACK, rejected malformed/corrupt recovery, and read-only release of the hold after verified recovery. The uncertainty marker is memory-only and is not cross-device CAS or durable recovery across page reloads.

The Owner Desk original acceptance disclosure now projects the verification plan from the existing programme. A separate desktop browser check observed a successful pointer opening and a 44px disclosure target at 1363px width. This does not establish mobile touch acceptance. A new mobile CI test checks actual target hit-testing and emulated touch after centering the target clear of fixed navigation; its result must be read on the resulting commit.

Local process inspection found no available Supabase database/management connection variable for an approved non-production target. The migration/rollback runbook now identifies the two distinct allowlists, existing-object drift checks, actual Supabase negative authorization tests, additive rollback and preservation of encrypted revisions. No hosted migration or permission change was attempted.

Commit `0e2282551eece70c3898fe8777f9e407c1759cf3`: source, isolated security, disposable PostgreSQL, private prototype, anonymous denial and mobile/staging audit workflows passed. Accounting/DS browser run `42468364889` failed at the SP locator tap. Its accounting entry, backup, interrupted-vault recovery and 20 DS-N1 authoring checks passed before that failure. The successful center hit-test followed by locator auto-scroll intercepts did not establish usable mobile input. The next test uses freshly measured viewport coordinates for native touch dispatch, retaining an unobstructed hit-test and an actual disclosure-open assertion. No force-click, DOM click or keyboard substitute is permitted. Its outcome remains pending until CI is read.

Further failing native-touch diagnostics on `c95fd6b7e35288132e5da69c056e59acf9c8cb5f`, browser run `42468841125`, observed a 681px layout viewport for a configured 320px screen. The disabled reviewer `.smallbtn` retained the generic `white-space:nowrap` rule. This widened the mobile layout and invalidated prior overflow assertions that compared the page to the already enlarged `innerWidth`. The source correction wraps that button within its panel; regression assertions now compare both page and layout width to the configured screen width. Normal locator touch is restored as a required assertion. This correction requires successful CI before claiming a repaired simulated touch path, and does not replace physical iPhone acceptance.
