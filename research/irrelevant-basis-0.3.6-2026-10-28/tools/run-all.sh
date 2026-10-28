#!/usr/bin/env bash
# Irrelevant-basis investigation and 0.3.6: every offline step. Sends nothing.
# Usage: bash tools/run-all.sh <scratch> <private run dir of RUN-LIVE-AUTH-20261028-02>
set -euo pipefail
unset ANTHROPIC_BASE_URL
S="$1"; P="$2"; mkdir -p "$S"
cd "$(dirname "$0")/.."
node tools/trace-pairs.mjs "$P" "$S/trace"
node tools/test-repair.mjs "$S/repair"
node tools/compare-cost.mjs "$P" "$S/cost"
node tools/run-frozen-suites.mjs "$S/suites"
node tools/write-manifest.mjs
echo "irrelevant-basis investigation: all offline steps passed"
