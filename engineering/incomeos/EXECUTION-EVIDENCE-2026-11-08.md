# IncomeOS controlled engineering evidence, 8 November 2026

## Remaining staged workspace controls and explicit reversals

Baseline `5bbc434606a6c16990413c7e3d6a1d885867196a`, same draft PR #180 and branch. The coordinator now stages changes made by existing workspace engines, including programme-cost entry, account records and nonfinancial controls. Each transformation receives a detached copy. The coordinator validates the resulting ledger, preserves the programme unless its separate update validator is used, requires valid chronology and retained change history, prevents reentrant edits, and checks the bound session. Existing bounded 5000-entry history rollover is permitted; arbitrary history replacement is refused. No editing operation writes to the server.

The existing Undo control now requests an explicit reversal of an unsaved edit. It restores prior content while retaining current history and appending WORKSPACE_EDIT_REVERSED. A saved revision cannot be silently rewound. Programme changes still require their separate validator; generic reversal cannot replace that programme record.

Targeted local accounting/recovery/runtime/release-gate verification passed nine tests with zero failures. Browser coverage extends the existing staged host exercise to native account entry, programme-cost entry and native Undo with retained history, followed by explicit save and concurrent-owner conflict recovery. Exact-commit CI remains required for browser certification. All 16 accounting dispositions remain unchanged; real migration/recovery, original DS-A/Codebook authenticity and commercial approval are not established by these source checks.

## Staged Owner Desk host connection

Baseline `a2e0f68102b1062e87fb6d4c46f1e58f681dddfe`. The existing briefing host now permits explicit staging-only coordinator attachment before any local workspace is open. Existing accountant ledger-replace and programme-update events route through the coordinator. The existing new/save controls initialize a verified empty revision and explicitly save encrypted revisions. Recovery inspection, confirmation, encrypted draft rescue, discard and close remain explicit host operations.

Legacy vault saves, local-file installation, history rewind and unsupported workspace mutations are refused while attached, preventing competing save paths and divergence from the coordinator. Late local-file recovery cannot replace a subsequently attached revision workspace. No staged modules are loaded by index.html, no login or server operation occurs on attachment, and no live migration or activation is claimed.

Local combined security/revision/programme verification passed 30 tests, zero failed. The full existing Owner Desk mobile browser test is extended to attach a synthetic authenticated CAS service, initialize via the existing button, edit through the existing ledger event, save via the existing button, provoke a competing-writer conflict, reject further edits, rescue the draft encrypted and reopen/confirm the newer revision. Current-commit CI must establish that browser result. All 16 accounting dispositions and original-product/commercial holds remain unchanged. Non-ledger/non-programme editing and staged undo are deliberately refused until their coordinator integration is implemented.

## Follow-on shared programme revision integration

Baseline: `868dc636f6dd77368671d24e3f062c3d89ed862d`, same draft PR #180 and branch. The staged coordinator previously exposed ledger edits but no validated way to commit programme-management changes alongside them. `updateProgram` now calls the existing workspace/Decision Spellchecker validator, retains the current ledger, requires the bound owner session and a confirmed revision, and marks only an unsaved draft. It performs no network write. An explicit save commits programme and accounting rows in the same encrypted workspace revision.

Targeted local verification passed eight tests, zero failed: programme changes survive encrypted ledger restoration; malformed gate approvals are refused without altering the workspace; unconfirmed newer revisions and revoked sessions cannot edit the programme; the existing accounting runtime and original-SP gate regressions remain passing. These are synthetic management/control checks, not execution or acceptance of original DS-A. The staged browser exercise now also checks the programme record after encrypted save and ledger restoration. CI on the resulting exact commit is required before claiming browser verification.

All 16 accounting dispositions remain unchanged. This extends the shared data integration; it does not activate staged RPCs, connect the live Owner Desk UI, migrate a database or authorize a release. Previously recorded staging credentials, hosting capacity, original Codebook/source identity, real owner recovery and commercial approval dependencies remain open.

## Continued execution: public vault API serialization

Starting source: `27d9b7b5fc653db310843ce1877e33c8155f44df`, same branch and draft PR #180. The vault UI interlock did not cover direct calls from another owner panel. A new synthetic regression initially reported three failures and one pass: overlapping saves before SHA-256 completed, recovery during an upload and a save during recovery were not rejected by the API.

The vault API now acquires one operation lock before asynchronous hashing or HTTP. It rejects overlapping saves/recovery reads, releases the lock on success and failure, and preserves the separate uncertain-save quarantine after failed uploads. Sign-out still revokes the session immediately. This is a same-page ordering control, not cross-device CAS or durable recovery.

Observed local verification after correction: `node --test` over vault concurrency, network, expiry, revision-session, envelope and cloud-client regressions passed 9 tests, 0 failed. All identities, payloads and responses were synthetic. The concurrency test is included in isolated-security CI. Hosted staging, current-commit CI and real owner recovery are not established by these local results. No accounting acceptance status, deployment, commercial authority or original-product acceptance is upgraded.

### Repository verification of the serialization correction

Published engineering commit: `4c58fec77d6aca4993666b086718e24a1c66e9d1`. Its tree is identical to locally tested tree `e055f6ae0b18187ac03b624d03bc32646b1c7519`. All seven applicable workflows completed SUCCESS: isolated security `42471706246`, accounting source `42471706250`, disposable PostgreSQL `42471706259`, private prototype `42471706294`, accounting/DS-N1 browser `42471706203`, anonymous probe `42471706198`, mobile/staging browser `42471706181`.

### Staged accounting backup restoration

The existing revision bridge now verifies a supplied encrypted revision backup's size, revision shape, SHA-256, decryption and workspace schema without server I/O. The existing accounting coordinator validates its ledger through the existing accountant, stages its rows against the current opened server head, preserves current nonfinancial sections and Decision Spellchecker programme, and appends restoration provenance to current change history. The owner must explicitly save the resulting draft. A backup does not decrement a server revision. The supplied backup revision/checksum identifies its bytes; it does not independently authenticate source ownership or provenance.

An owner can inspect a cloned, session-bound current workspace before confirming a newer revision. Snapshots cannot mutate the authoritative draft. Restore refuses pending drafts, unresolved conflicts, unconfirmed newer revisions, wrong passphrases, tamper, invalid accounting rows, invalid dates and revoked sessions. Other operations are excluded during restoration. These modules remain staged and are not loaded in the live Owner Desk.

Observed local verification: accounting/source command from CI passed 41 tests, 0 failed. The combined vault/revision/original-gate suite passed 23 tests, 0 failed, including four encrypted-backup restoration tests and four vault API concurrency tests. The deterministic soak again completed 120 concurrent-owner races and denied all 120 stale writes. This is deterministic synthetic execution, not an unattended owner observation window. The browser regression is extended to exercise actual AES-GCM backup restoration and explicit new-revision saving; its current-commit CI result is still required.

Acceptance evaluation: A06/A07/A14 gain source-evidence references and A07 gains its precise restoration scope. All 16 dispositions remain unchanged: A01 OWNER ACCEPTANCE PENDING; A02/A15 PROTECTED PREVIEW VERIFIED on historical evidence; A03 through A13 SOURCE TESTED; A14/A16 BLOCKED. No requirement is PRODUCTION VERIFIED and `milestoneComplete=false`.

### Expanded disposable PostgreSQL reliability exercise

The existing disposable concurrency script now prepares 24 successive two-writer races, checks exactly one commit and one explicit stale-revision refusal per cycle, verifies contiguous owner history, rolls back a completed append transaction and then explicitly appends against the unchanged head. It emits actual counts and elapsed time only after all assertions pass. This is synthetic PostgreSQL fixture execution, not a live Supabase migration, network lost-ACK simulation or owner-operation measurement. The previous source soak separately covers commit-then-timeout recovery. `bash -n` passes locally; no local PostgreSQL executable is available. Actual database results must be read from the resulting CI commit before claiming success.

### Continued original-source custody inspection

The current native saved-version metadata again identifies the historical 0.7 candidate source commit recorded in the earlier custody note. All 18 declared local candidate file hashes again match its provenance manifest, whose SHA-256 remains `171f365c784176979d56067ec1a7bdb71a17985caf1b095425bc977225e71cd7`. The local candidate tar's SHA-256 differs from the native saved archive's recorded SHA-256. The local tar must therefore not be described as a byte-identical copy of that archive. Matching individual manifest files does not settle archive custody or original-product identity.

Authorized native source retrieval was attempted with a freshly issued credential. The supported source-opening workflow returned `Unable to prepare the Site` and did not create a source checkout. No source push, deployment, access change or private-source publication occurred. No clean rebuild or original SP acceptance run is claimed. The original source/Codebook gate remains open.

Bounded searches inspected the other connected repository's non-truncated default-branch tree (588 entries) and found no filenames matching Codebook, Spellchecker, original, provenance or source-manifest. That is a filename-scope result, not a claim about every archived byte or every historical commit. Current Library reads of the 0.6.7 crosswalk and 0.6.11 original-source gate identify those implementations as separate references and retain the missing original Codebook condition. The available Issue 3.6 document remains a controlled proposal; it does not authenticate the executable. No DS-N1 or JRS source is substituted for DS-A.

### Dependencies and next independent engineering

The process exposes no database/migration connection for an approved non-production Supabase target. Existing publishable browser credentials do not provide migration authority. Current-head protected deployment remains unverified; the previously observed provider deployment limit is not assumed resolved. Real owner save/recovery, actual iPhone acceptance and explicit production/commercial authorization remain human acceptance conditions. No production configuration or owner record was changed.

Further independent work includes a staged binding from the existing Owner Desk workspace lifecycle to the revision coordinator, full-workspace recovery reconciliation beyond accounting-row restoration, protected-deployment revalidation when capacity is available, and original-source provenance/reproducibility inspection when retrieval succeeds. Activation and owner acceptance remain subject to the documented protocol. The UI/legacy vault and staged CAS service are not represented as live-integrated by this session's source tests.

### Verified backup and database commits

Backup restoration engineering commit `8cefb87380cde9d5afa869b428a97bc3ae92a4eb` completed all seven workflows successfully: accounting/DS browser `42472007948`, mobile/staging browser `42472007968`, disposable PostgreSQL `42472007965`, anonymous probe `42472007954`, accounting source `42472007950`, isolated security `42472007959`, private prototype `42472007956`. The mobile job log explicitly records successful real AES-GCM staged accounting, CAS, recovery and ledger-backup restoration at its simulated 375px viewport.

PostgreSQL exercise commit `ec8be2baf2219883dd6dc2660bfc1d10a51e4cf6` completed all seven workflows successfully: private prototype `42472225523`, isolated security `42472225549`, anonymous probe `42472225500`, accounting source `42472225522`, accounting/DS browser `42472225486`, disposable PostgreSQL `42472225509`, mobile/staging browser `42472225476`. Database job `128705465474` records 24 race cycles, 48 attempted race writes, 24 committed race writes, 24 rejected stale writes, one rollback check, one explicit recovery append, two elapsed seconds and zero unexpected failures. The setup race is separate from those 24 cycles. These are bounded synthetic fixture results, not owner-operation or unattended-automation results.

GitHub commit statuses independently show both configured Vercel projects rejecting the commit at the provider build-rate limit. This is a current observed protected-preview blocker, not a successful deployment or an instruction to upgrade a paid plan. No deployment-protection setting was changed.

### Shared entry-path compatibility correction

Cross-component tests reproduced four failures: workspace/programme-created expenses lacked the accountant's allocation/payment fields, income lacked receipt/scope fields, explicitly supplied payment states were dropped, and deleting an older row could make the next generated identifier collide. This could quarantine the shared ledger after an otherwise accepted entry in This week or the programme panel.

The existing workspace entry engine now emits accountant-compatible rows. Income defaults to expected and expenses to scheduled; the existing forms expose an explicit owner-recorded payment choice. Expense allocation remains unknown (`null`), evidence remains missing, and no bank link is inferred. New IDs skip existing identifiers, including after deletion. Existing rows are not rewritten or automatically reclassified. Synthetic programme-finance fixtures that represent paid historical expenses now state paid explicitly; the historical missing-status case explicitly removes that field so legacy behavior remains tested.

The four new compatibility tests pass locally and are included in isolated-security CI. Existing browser checks are extended to verify that both entry panels leave the same accountant ledger editable, and that unpaid entries remain expected/scheduled. A03/A04/A05/A09 gain evidence references without a status upgrade. Current-commit browser and complete CI outcomes remain to be collected.

Compatibility commit `0b20dc8e2287d3a22979b7e017fb5f1a2a8d93a4`: local combined revision/security/programme checks passed 29 tests, 0 failed. CI source, isolated security, disposable PostgreSQL, private prototype and anonymous checks passed. Accounting/DS browser run `42472553637` failed in the product-finance fixture: it expected a paid 29.50 USD cost but did not explicitly record payment, so the corrected engine classified it as scheduled. The fixture is corrected to declare `paymentStatus: paid`; the separate scheduled 80 USD fixture and all exclusion assertions are retained. No runtime classification rule or financial assertion was relaxed. The failing run remains inspectable in CI history. Final browser and current-head workflow results must be read before claiming a pass.

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
