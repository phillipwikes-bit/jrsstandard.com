# New-Session Runbook (Stage A restart)

**For the owner and for Claude Code in the new session.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## Owner, before starting the new session

1. In the cloud environment settings (environment menu in the session title bar, then Edit), store the key as a secret named **`JRS_STAGE_A_PROVIDER_KEY`**. If it was stored as `ANTHROPIC_API_KEY`, remove that entry and re-add it under the dedicated name. Never paste the key into chat.
2. Optional, recommended: set a spend limit on the key in the provider console.
3. Under Network access, allow `api.anthropic.com`.
4. Start a **new** session on branch `claude/engine-reliability-phase6-local` (PR #42). Secrets reach only new sessions.

## First message to send in the new session (suggested)

"Read `research/stage-a-revised-study-2026-10-25/`. Verify every manifest, build and offline-test adapter 0.2.1-live, and complete readiness items 1 to 12 without reading or displaying the key. Then stop for my signature and Gate 4 direction."

## Claude Code in the new session

1. Check the key by name only: confirm `JRS_STAGE_A_PROVIDER_KEY` exists, and never read, print or log its value.
2. Run every pilot process with `ANTHROPIC_BASE_URL` removed from that process's environment.
3. Follow the revised protocol section 3, steps 2 to 8, stopping where the protocol requires owner action.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
