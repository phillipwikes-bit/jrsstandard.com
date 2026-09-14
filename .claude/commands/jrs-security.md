---
description: Security and data-flow review. Never certifies compliance.
---
Inspect secrets, dependencies, APIs, storage, telemetry, logging, retention, deletion, authentication and authorization.

Verify the standing constraints in CLAUDE.md 36.2 and 36.3: no API key in any committed file; owner surfaces carry no analytics tag, no public link and no token control.

Produce `.jrs/reports/SECURITY_REVIEW.md`. Credentials are read from the environment and never from conversation.
