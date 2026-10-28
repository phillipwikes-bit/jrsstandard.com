# Stage A Credential Exposure and Restart Record

**2026-10-25. Recovery record. Not an authorization.** It authorizes no provider access,
credential use, dispatch-lock release, live-model request, release, deployment or public
use. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Stop event

| Field | Entry |
|---|---|
| Authorization | `STAGE-A-AUTH-20261025-01` (signed 2026-10-25, expiry 2026-11-08) |
| Outcome | Stopped before any request |
| Trigger | A provider credential was entered into session chat |
| Stop condition | SR-LP-14; Pilot Decision Rule section 3, item 3 (credential exposure) |
| Requests made | 0 |
| Spend | USD $0 |
| Dispatch lock | Remained engaged (`LIVE_DISPATCH_ENABLED = false`) |
| Exposed credential | Not used, stored, tested, or written into the repository or any file. Scans of the session scratchpad and the repository found no copy |
| Original stop record | `research/live-pilot-authorization-2026-10-24/STAGE_A_STOP_RECORD_SR-LP-14.md`, SHA-256 `0d8d906f5f2cfa67de22663dd860bcfe469234640e206d7e644bffcd26c6e7a6` |

## 2. Owner confirmation (recorded before any repository action)

The owner confirmed in session on 2026-10-25, in these exact words: "The provider key
exposed in the earlier session has been revoked. No replacement key has been entered into
chat, a repository file, or the current session."

This is an owner statement. Claude Code did not and could not verify revocation.

## 3. Effect on the signed authorization

The original signed authorization (`research/live-pilot-authorization-2026-10-24/STAGE_A_OWNER_AUTHORIZATION_FINAL_DRAFT.md`,
SHA-256 `96df3dfb1a13895f6e4245a042371c0743b5ce585dc242ed77529100c4428816`) is preserved unchanged as a record. **It cannot be used to resume the
pilot.** Its Gate 4 direction is spent by the stop.

## 4. Clean-restart conditions (all required)

1. The replacement key is configured in a new session, supplied only through the
   session's secret settings. It is never placed in chat, a file, Git history, a log,
   output or a prompt.
2. A new owner restart authorization is given in that new session, after the replacement
   key is configured.
3. The new session verifies every manifest of the preserved packages:
   - `research/stage-a-offline-preparation-2026-10-24/STAGE_A_OFFLINE_PREPARATION_MANIFEST_SHA256.txt`, SHA-256 `2c1e934b7facc22735826eab170b0c9a9fb789dbb032f643970cd482b865cbb8`;
   - `research/live-pilot-authorization-2026-10-24/STAGE_A_FINAL_DECISION_PACKAGE_MANIFEST_SHA256.txt`, SHA-256 `8e746c392e177c188bcddedabc0d095d99cc37c11bd0cc7fe452994581b670d1`;
   - the history manifests in that package.
4. The new session reruns every offline suite: mapping, mapping mutations, adapter,
   adapter mutations, live boundary, boundary mutations, cognitive controls and
   cognitive-controls mutations, all with 0 network attempts.
5. The new session completes readiness items 1 through 11 before any Gate 4 execution.
   The provider host must be allowed by the network policy, and the credential's value
   must never be read or displayed.
6. Gate 4 execution happens only under the new restart authorization, at most ten
   requests and USD $5, under the Pilot Decision Rule and SR-LP-01 to SR-LP-15.

## 5. Status

- B-018 remains OPEN.
- `NO_GO_NOT_VERIFIED` remains in effect.
- No release, deployment, production, commercial, reliability or validation claim is
  authorized.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
