#!/usr/bin/env bash
# Study continuation (0.3.5): every offline step, in order. Sends nothing; dispatch stays disabled.
# Usage: bash tools/run-all.sh <scratch> [<private run dir of RUN-LIVE-AUTH-20261028-01, diagnostic only>]
set -euo pipefail
unset ANTHROPIC_BASE_URL
S="$1"; ORIG="${2:-}"; mkdir -p "$S"
cd "$(dirname "$0")/.."
node tools/build-live-set.mjs "$S/liveset"
node tools/build-plan.mjs
node tools/live/test-live.mjs "$S/testlive"
node tools/live/rehearse-enable.mjs "$S/rehearse"
node tools/live/mutate-live.mjs "$S/mutate"
node tools/test-corrections.mjs "$S/corrections" $ORIG
node tools/freeze-continuation.mjs
node tools/write-manifest.mjs
echo "study continuation: all offline steps passed"
