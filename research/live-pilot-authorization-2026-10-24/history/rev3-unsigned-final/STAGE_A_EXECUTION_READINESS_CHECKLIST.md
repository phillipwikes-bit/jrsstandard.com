# Stage A Execution Readiness Checklist

**Completed by Claude Code immediately before the first live request, under a signed
authorization and after the separate Gate 4 start direction. Any unchecked item blocks
execution.** A failed item is recorded as found and is not worked around. B-018 OPEN.
NO_GO_NOT_VERIFIED in effect.

Authorization identifier: STAGE-A-AUTH-__________   Run date (UTC): __________

| # | Item | Evidence required | Done |
|---|---|---|---|
| 1 | Owner authorization signed, within its 14-day expiry | Signed `STAGE_A_OWNER_AUTHORIZATION_FINAL_DRAFT.md`; expiry date not passed | [ ] |
| 2 | Same-day model-availability check completed by the owner | Owner confirmation dated the run date | [ ] |
| 3 | Exact model match | Configured identifier is exactly `claude-haiku-5-5`; no fallback or alias substitution | [ ] |
| 4 | Ten-record register approved | Signature-page item 1 checked; SDR-01 to SDR-10 hashes match the register and the offline package manifest | [ ] |
| 5 | USD $5 spend cap confirmed | Owner-confirmed cap; spend computed from reported token usage at owner-confirmed prices | [ ] |
| 6 | Request cap of ten confirmed | Adapter request cap set to 10; no retries configured | [ ] |
| 7 | External retention location approved | Location, access list and deletion method entered on the signature page (the ephemeral session scratchpad does not qualify) | [ ] |
| 8 | All offline suites pass on the run date | Mapping 33 of 33 and 12 of 12 mutations; adapter; live boundary; cognitive controls; all with 0 network attempts | [ ] |
| 9 | Repository and frozen-package hashes unchanged | Repository at `235389da` with tree `82e392fed103b9e488e602b523f509e5d622d63c`; candidate package `815c5d56...25c3`; prompt `0ceda888...eec2`; adapter `aa2b9779...1fb6`; mapping `1e289b06...59b8`; cognitive-controls validator `6c5a9cf2...4bd4`; all package manifests verify | [ ] |
| 10 | Dispatch lock still engaged before the Gate 4 direction | `LIVE_DISPATCH_ENABLED = false` recorded before release; released only after item 12 | [ ] |
| 11 | No unapproved material present | Input set is exactly SDR-01 to SDR-10; no real, personal, source-controlled or holdout material; no provider-routing or base-URL override in the environment (SR-LP-13); the credential is supplied by environment only and its value is never read or logged | [ ] |
| 12 | Separate Gate 4 start direction received | Written direction entered in the Gate 4 field of the signature page | [ ] |

Completed by: Claude Code, session __________   Time (UTC): __________

All twelve items checked: [ ] Yes. If No, execution is blocked.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
