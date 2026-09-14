---
description: Run the validation architecture. Never adjust criteria to pass.
---
Run `python3 scripts/check_zero_drift.py` and the relevant tests.

A new guard must be demonstrated to fire against the pre-fix state before it is trusted. Never weaken or delete a guard to obtain green. When a test fails, determine whether the implementation or the test is wrong, document the conclusion, fix the correct layer, rerun.

Record negative findings. Update `VALIDATION_REGISTER.json`.
