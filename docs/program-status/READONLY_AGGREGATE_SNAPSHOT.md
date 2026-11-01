# Owner-only, read-only historical aggregate snapshot

This utility supports Program Status preservation gates PST-05 and PST-06. It is
not a replacement for the original owner dashboard or a live research audit.

It issues **HEAD** requests with **Prefer: count=exact** to two existing
Supabase tables using an owner-held service-role environment secret. It returns
only raw row counts for eleven explicitly identified source families at a
specific UTC cutoff. It does not request names, emails, source record bodies,
case material or individual identifiers; no database write is performed.
The tool does not commit snapshots or transmit them to ChatGPT.

Do not store the service-role key in source control, a GitHub Action, a shell
history command argument, a website form, or a PDF. The key is provided only
as an already configured protected environment variable on the owner's local
machine or secured execution environment. Do not run on untrusted computers.

Example, with the secret already supplied privately:

    node scripts/snapshot-public-program-counts.mjs --cutoff=2026-10-31T00:00:00.000Z > owner-private-before.json

After a proposed website deployment, use **the exact same cutoff**:

    node scripts/snapshot-public-program-counts.mjs --cutoff=2026-10-31T00:00:00.000Z --compare=owner-private-before.json > owner-private-reconciliation.json

No zero is returned for missing service credentials, broken HTTP status,
missing Content-Range, incomplete count, malformed time or lost connectivity.
A difference exits with status code 3 and requires historical-row correction
review. Read failure exits 2; no output file should be treated as a valid
snapshot unless exit status is 0 and all families are present.

Count grain: raw database rows at UTC created_at < cutoff. Historical bot,
internal-test, duplicate and synthetic rows are **not** automatically excluded.
No figure is a unique visitor, completed file transfer or validated adoption.
The source families are partial, not exhaustive. Historical reviewer counts
and consent records still need their own owner-controlled reconciliation.

This captures database count consistency only. It cannot prove successful
writes during the monitoring period, private API authentication, Supabase
anonymous RLS, lawful retention, provider delivery, or mobile operation.
Never paste a service-role credential into a prompt.
