# Live compatibility check (PRE): status, 2026-10-28

**Not run.** The owner approved the three-request compatibility check (PRE only; `claude-haiku-5-5` if confirmed available; at most 3 requests and 9 attempts; spend cap USD 0.05; credential from the environment secret `JRS_STUDY_ANTHROPIC_KEY`; captures private and outside the repository; all stop conditions in force). The approval is recorded verbatim in the private authorization record outside the repository. It is not treated as a signature. No request was sent, no credential was read, and live dispatch stayed disabled (`LIVE_DISPATCH_ENABLED = false`).

## Checks completed

| Check | Result |
|---|---|
| State, seals, candidate manifest, prompt | pass (37 of 37); candidate `b454d4b8…`, prompt `94429a14…` |
| Frozen outputs against expectations | pass (18 of 18) |
| Request set rebuilt from the frozen prompt and records | identical, `1b4644e6…`; PRE = S-001, S-003, S-008 (synthetic) |
| Plan | identical, `f5dd8e92…`; stop rules SR-01 to SR-18 |
| Transport tests (mock fetch) and enabling rehearsal | pass (42 of 42; 8 of 8) |
| Worst case per PRE attempt | about USD 0.0024; nine attempts stay under the cap |
| Model identifier | `claude-haiku-5-5` listed **Active** on the official model status page (retirement not sooner than 7 October 2027); account access NOT ESTABLISHED until a request is made |
| Credential | `JRS_STUDY_ANTHROPIC_KEY` **absent** from this session (checked by name only) |
| Provider retention for the account | NOT ESTABLISHED: no authorized record in the repository; not visible from this session |
| Private capture directory | created outside the repository and any git tree, mode 0700 (session scratch; deleted with the container) |
| Authorization record | written there; the bound verifier refuses it for: expiry, deletion rule, provider retention confirmation, owner signature, signature date |

## Remaining before the check can run

1. The owner's signature and date for authorization `PRE-LIVE-AUTH-20261028-01`.
2. An expiry for that authorization.
3. The account's provider-retention arrangement (standard or zero data retention), from the owner as account holder or a record that can be read.
4. A deletion rule for the private captures.
5. `JRS_STUDY_ANTHROPIC_KEY` added as an environment variable in the cloud environment settings; a new session picks it up.
6. Because a new session starts from GitHub, the prepared work on the local branch `claude/study-completion-0.3.4-local` must reach it (owner decision: pushing that branch, which is public on GitHub, or another route).

Network reachability of `api.anthropic.com` is not confirmed; the session proxy routes that host directly. A blocked first request would stop the check (SR-06) with no spend.

## Credential exposure, 2026-10-28

After this status was written, a credential was pasted into the session chat. It was not used, stored or copied into any file, and no request was sent. A search found it nowhere in the repository, its working tree or the private capture directory. Under CLAUDE.md section 22 it is treated as compromised: it must be revoked and replaced. The key later configured as `JRS_STUDY_ANTHROPIC_KEY` must be a newly issued one. The approved credential source remains the environment secret only.

The owner then asked for the pasted key to be used and the study run. Neither was done: CLAUDE.md section 22 and the approved credential source (the environment secret) both exclude a pasted key, and the signature, expiry, retention and deletion facts listed above were still missing. The approval covers the three-request check only, not the 401-request study. Recorded as blocker B-019 in `.jrs/state/BLOCKERS.json`.

## Update after correction C-10, 2026-10-28

Before the first push, the publication check found `results/LIVE_RESULTS.json`, labelled "live captures" and showing one PRE request as failed with a network error. It was traced to an offline rehearsal and removed (`reports/CORRECTIONS_2026-10-28.md`, C-10); no request was ever sent. The enabling rehearsal now has 9 checks (ER-09 added) and all pass; the full offline pipeline passes. The plan hash is unchanged.
