# IncomeOS push and verification practice

Adopted 2026-11-03 at the owner's request: avoid unnecessary preview deployments while keeping the required final verification.

## Why pushes are expensive here

Every push to `feature/incomeos-owner-prototype-2026-11-01` starts a JRS Vercel build (cancelled by the branch's ignore step, but still a deployment record), a Cloudflare Workers build (failing until the dashboard connection is removed) and about eleven GitHub checks.

## Practice

1. **Batch.** Commit locally in logical units; push once per work cycle, not after each step.
2. **Verify locally before every push.** Run every `tests/incomeos-*.mjs` suite, including the iPhone browser tests. Do not push a failing tree.
3. **No bookkeeping-only pushes.** Tracker and report updates ride with the next code push. The tracker is still attached in chat every turn.
4. **One final push per cycle** runs the full CI. Before reporting a cycle done, read the checks on that exact head commit; report known unrelated failures by name.
5. **Fetch before pushing**: the owner also pushes to this branch. Fast-forward only; never rewrite history.
6. **Superseded runs cancel themselves** (concurrency in the IncomeOS workflows), so a newer push never waits on stale checks.

## What this does not change

JRS workflows, the JRS Vercel ignore step and release controls are untouched. The Vercel and Cloudflare records fall only by pushing less often. Disconnecting Cloudflare, or moving IncomeOS to its own Vercel project, would remove them entirely; both need the owner.
