#!/usr/bin/env bash
# Study completion (0.3.4): every offline step of this directory, in order, failing on the first failure. Offline: no step
# reads a credential, sets a provider address or reaches a network; every Node tool installs the network guard first and
# refuses provider variables. Nothing in the frozen packages is written. Generated outputs are rewritten; captures and
# the journal of a live run are never touched (there are none).
# Usage: bash tools/run-all.sh <scratch>
set -euo pipefail
unset ANTHROPIC_BASE_URL
S="$1"; mkdir -p "$S"
cd "$(dirname "$0")/.."
node tools/verify-state.mjs
node tools/check-results.mjs
node tools/reconcile.mjs "$S/reconcile"
node tools/build-live-set.mjs "$S/liveset"
node tools/account-156.mjs
node tools/offline-results.mjs
node tools/build-plan.mjs
git diff --no-index ../engine-repair-0.3.4-2026-10-27/tools/transport/sender.mjs tools/live/sender-bound.mjs > protocol/SENDER_BOUND.diff || [ $? -eq 1 ]
node tools/live/test-live.mjs "$S/testlive"
node tools/live/rehearse-enable.mjs "$S/rehearse"
node tools/live/mutate-live.mjs "$S/mutate"
node tools/human-review/build-batches.mjs
node tools/human-review/test-import.mjs "$S/testimport"
node tools/summarize-verification.mjs
node tools/write-manifest.mjs
echo "study completion: all offline steps passed"
