# IncomeOS staged revision migration and rollback

Status: preparation only. No SQL in this document has been applied to the hosted owner vault. The current Owner Desk does not load the staged revision modules. Production promotion and commercial access remain prohibited pending acceptance and explicit owner approval.

## Exact infrastructure dependency

The active execution environment provides no Supabase management/database credential or `DATABASE_URL` for an approved non-production target. The browser's publishable vault key is not a migration credential. The existing configured vault is the owner vault, not permission to create a disposable schema in production. No credential, owner UUID or passphrase belongs in this repository.

An authorized operator must provide an approved non-production Supabase project and a sufficiently scoped migration connection through protected secret injection. Source preparation, disposable PostgreSQL tests and rollback documentation can proceed independently.

## Preflight on the approved non-production target

1. Record the immutable client/source commit, target project identity in a private operations record, operator, time and explicit non-production authorization. Preserve current protected access rules and enumerate effective access exceptions. Stop if the target cannot be independently distinguished from production.
2. Inspect `pg_extension` and `pg_namespace`: the staged checksum function requires `pgcrypto` installed in the `extensions` schema. Inspect the actual Supabase `auth.uid()` interface and `anon`/`authenticated` roles. Do not infer compatibility from a different PostgreSQL fixture.
3. Inventory existing functions, signatures, grants and tables before applying `CREATE OR REPLACE`. Confirm the migration role owns the wrappers and private append function. Check table definitions and constraints explicitly: `CREATE TABLE IF NOT EXISTS` does not prove an existing table has the expected schema. Stop on drift.
4. Review owner authorization separately. The existing legacy vault reads `public.incomeos_owner`. The staged service reads `incomeos_private.allowed_owners`. These are different allowlists. A legacy vault login does not automatically authorize staged RPC access. Provision only the independently verified synthetic test identities on the non-production target. Do not automatically copy the live owner table.
5. Preserve an independently restorable encrypted backup and a metadata-only schema/grant inventory. Retain the original encrypted bytes. Do not decrypt owner records into database backups, logs or tickets.

## Controlled non-production apply

Use one reviewed transaction, applying `workspace-revision-staging.sql` before `workspace-revision-rpc-staging.sql`. Execute only after checking existing objects, extension location and deployment-role ownership. A failed transaction must roll back entirely; do not resume partway based on an assumed earlier success.

Inspect actual `pg_proc` security-definer/search-path properties and effective EXECUTE/table grants after commit. Anonymous access must be denied. Non-allowlisted authenticated callers must be denied. Two allowlisted synthetic owners must see only their own revisions. Direct table SELECT/INSERT/UPDATE/DELETE must remain unavailable to browser roles.

Run the repository's disposable PostgreSQL fixture in CI, not on this target: it creates stand-in `auth` objects and roles and is explicitly unsuitable for an existing Supabase database. Reproduce its assertions against actual Supabase identities through a separate approved integration procedure. Record actual requests, redacted outcomes and exact revisions, never JWTs.

The complete non-production exercise must include two competing revision-zero writers, stale revision rejection, interrupted response after commit, fresh-session readback, wrong passphrases, tamper refusal and owner-confirmed reconciliation. One stale writer must not result in two accepted revision-one rows. Verify retrieval and decryption independently before classifying a save as recoverable.

## Rollback and interrupted rollout

- Before client activation, an additive staging schema can remain unused. No legacy ledger or encrypted vault row needs deletion. An unapplied migration is not a completed rollout.
- If staged clients have been activated on the approved non-production target, stop new revision writes first, preserve encrypted pending drafts and inspect outstanding requests. A timed-out append may already have committed. Do not retry blindly or roll back the high-water revision.
- Restore the previous protected client version only after checking its data-format compatibility. Keep staged tables and encrypted revisions intact. Revoke staged RPC execution only through an explicitly reviewed operations action if needed to prevent additional writes. Retain the allowlist and grant inventory for investigation.
- Do not drop tables, delete revisions, decrement sequence/history, reassign owners or reverse an applied data migration as an automatic rollback. Code rollback and data recovery are distinct operations.
- To restore an earlier backup, open and verify it locally against its checksum and passphrase. Retain the newer server history. Reconcile intentionally, then append a new revision against the latest verified server head through an explicit owner save. An old backup must not be installed as a silently lower server revision.

## Required evidence before acceptance advances

Record the target, client commit, schema fingerprint, migration transaction outcome, effective grants, synthetic identity scope, concurrent-writer outcomes, interruption/recovery outcomes, encrypted-backup restoration and actual rollback rehearsal. A14 remains BLOCKED until the corresponding live owner recovery and formal acceptance evidence exist. A16 remains BLOCKED until the owner grants release approval.
