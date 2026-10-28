# Stage A Stop Record: SR-LP-14

**2026-10-25. Authorization STAGE-A-AUTH-20261025-01. Immediate stop before any provider request.**

| Field | Entry |
|---|---|
| Stop condition | SR-LP-14 (a credential value appeared in the conversation); Pilot Decision Rule section 3, item 3 (credential exposure) |
| Trigger | A provider credential value was pasted into the session chat. The value is not recorded here or anywhere else by Claude Code |
| Requests made | 0 |
| Spend | USD $0 |
| Dispatch lock | Engaged (`LIVE_DISPATCH_ENABLED = false`); not released |
| Credential used | No. The pasted value was not used, stored, tested or written to any file or environment |
| Readiness checklist | Not rerun; the stop precedes it |
| Materials | Preserved as found |

Required before any restart (new owner decision under the Pilot Decision Rule):

1. Revoke the exposed credential at the provider console.
2. Issue a new credential and set it only through the environment's secret settings.
3. Give a new owner direction to resume.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
