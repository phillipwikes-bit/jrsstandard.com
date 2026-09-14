---
description: Prepare a controlled release. Deployment still requires human authorization.
---
Required before release: tests; evidence; version; Git state; claims review; rights review; security status; known limitations; release manifest.

Deployment on this repository is verified by BYTES, never by a status code: run `python3 scripts/preflight_deploy_check.py --ref origin/main --all`. On a mismatch, RE-TRIGGER; never revert (CLAUDE.md 36.8).

Update `RELEASE_REGISTER.json`.
