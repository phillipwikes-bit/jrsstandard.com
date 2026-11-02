# Source health integration

The source-health module is a read-only control. No source health status may be interpreted as an investment authorization.

For the owner dashboard, render a HOLD state when authenticated bank-source coverage or freshness is unavailable. The static client must never fabricate source inventory or display a cash-available amount.

The capital-readiness review must remain blocked until authenticated statements, source reconciliation, obligations, reserves and explicit owner approval are established.

The source-health regression suite is `tests/incomeos-source-health.mjs` and is included in the draft PR CI workflow. Do not merge this owner prototype into public production.