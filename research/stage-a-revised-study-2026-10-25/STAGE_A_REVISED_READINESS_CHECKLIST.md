# Stage A Revised Readiness Checklist (new session)

**Completed by Claude Code in the new session, immediately before the first request. Any unchecked item blocks execution.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

| # | Item | Evidence |
|---|---|---|
| 1 | Restart authorization signed, within its expiry | Signature page complete |
| 2 | Same-day model availability confirmed by the owner | Owner statement dated the run date |
| 3 | Exact model `claude-haiku-5-5`; no fallback | Configuration; mapper model check active |
| 4 | SDR-01 to SDR-10 hashes match the register | Hash check |
| 5 | USD $5 cap and 10-request cap set; no retries | Configuration of `0.2.1-live` |
| 6 | Retention location, access list and deletion method approved | Signature page |
| 7 | All manifests verify (repository, Stage A, V0, correction, differential) | Manifest checks |
| 8 | All earlier offline suites and mutations pass; `0.2.1-live` offline tests pass against the stub sender | Test results, 0 network attempts |
| 9 | Frozen packages unchanged (0.3.1 manifest, prompt, adapter 0.2.0, mapping, validator) | Hash checks |
| 10 | No unapproved material; input set is exactly SDR-01 to SDR-10 | Input listing |
| 11 | `JRS_STAGE_A_PROVIDER_KEY` is present by name (the value is not read or displayed); `ANTHROPIC_API_KEY` is not used by the pilot; `ANTHROPIC_BASE_URL` is absent from the pilot process | Name-only environment check |
| 12 | The network policy allows `api.anthropic.com`; the guard allows only that host, for the sender only | Policy confirmation; guard test |
| 13 | Gate 4 start direction received in this session | Owner message |

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
