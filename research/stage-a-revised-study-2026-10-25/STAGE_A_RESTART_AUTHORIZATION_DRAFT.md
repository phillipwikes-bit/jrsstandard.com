# Stage A Restart Authorization (Draft, Unsigned)

**UNSIGNED. Prepared 2026-10-25. Not effective until signed in the new session.** Replaces the spent authorization `STAGE-A-AUTH-20261025-01`. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

Authorization identifier: STAGE-A-AUTH-__________

## Terms

| Term | Value |
|---|---|
| Study | `STAGE_A_REVISED_STUDY_PROTOCOL.md` revision 2 |
| Provider and model | Anthropic API; `claude-haiku-5-5`; no fallback or substitution |
| Requests | At most 10, one per record, no retries |
| Spend | At most USD $5 (estimated about $0.03) |
| Material | SDR-01 to SDR-10 at their registered SHA-256 values; synthetic development material only |
| Credential | Environment secret `JRS_STAGE_A_PROVIDER_KEY`, set only through the environment's secret settings. It is never pasted in chat, written to a file, committed, logged or displayed |
| Engines | 0.3.1-candidate is the engine of record; 0.3.2-candidate is an offline replay of the same captures only (not adopted) |
| Live build | Adapter `0.2.1-live`, built and tested offline in the new session before any request |
| Retention | Approved external location for 30 days, then deletion by the approved method |
| Decision rule | `PILOT_DECISION_RULE.md` with the clarifications in the revised protocol, section 5 |
| Readiness | `STAGE_A_REVISED_READINESS_CHECKLIST.md`, items 1 to 13; any unchecked item blocks |
| Counsel determination | Not required for this synthetic-only pilot; no effect on B-018 or any real-data work |
| Expiry | 14 calendar days after signature |
| Start condition | Separate Gate 4 start direction in the new session |
| Prohibited uses | No release, deployment, production, commercial, licensing, ownership, validation, reliability or public claim |

By signing, the owner classifies this pilot's provider access as external controlled use and permits it while B-018 remains OPEN.

## Signature page

| # | Decision | Owner entry |
|---|---|---|
| 1 | I approve SDR-01 to SDR-10 at their registered SHA-256 values | [ ] Approved |
| 2 | I approve the revised protocol, decision rule and readiness checklist | [ ] Approved |
| 3 | I will confirm `claude-haiku-5-5` availability on the run date | [ ] Confirmed |
| 4 | I approve 10 requests and USD $5, checked against current prices | [ ] Approved |
| 5 | Retention location / access list / deletion method | __________ / __________ / __________ |
| 6 | I confirm the key is stored only as the environment secret `JRS_STAGE_A_PROVIDER_KEY`, and has not been entered into chat, a file or the repository | [ ] Confirmed |
| 7 | Expiry date (14 days after signature) | __________ |
| 8 | Owner signature and date | __________ |
| 9 | Gate 4 start direction (new session, after readiness items 1 to 12) | __________ |

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
