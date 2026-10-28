#!/usr/bin/env bash
# 0.3.4 repair package: every post-freeze run, in order, then the pre-specified analysis. Offline: no step reads a
# credential, sets a provider address or reaches a network; every Node tool installs the network guard first and
# refuses provider environment variables. Each tool refuses to overwrite an existing output.
# Usage: bash tools/post-freeze-runs.sh <scratch>      (run from anywhere; outputs go to out/ and reports/)
set -euo pipefail
unset ANTHROPIC_BASE_URL
S="$1"; mkdir -p "$S"
# Each tool gets its own scratch folder, created here: the isolation harness makes its temporary copies inside it.
sc() { mkdir -p "$S/$1"; printf '%s' "$S/$1"; }
cd "$(dirname "$0")/.."
C4=0.3.4-research-candidate; C3=0.3.3-research-candidate
node tools/verify-seal.mjs freeze
# Scored record runs: run-2 replays run-1; run-3 changes time zone and locale (as the study's run-3).
node tools/run-scored.mjs run-1 "$(sc run-1)"
node tools/run-scored.mjs run-2 "$(sc run-2)"
TZ=Pacific/Kiritimati LANG=tr_TR.UTF-8 LC_ALL=tr_TR.UTF-8 node tools/run-scored.mjs run-3 "$(sc run-3)"
# Variant runs (variant set 2.0): vrun-2 replays vrun-1.
node tools/run-variants-v2.mjs vrun-1 "$(sc vrun-1)"
node tools/run-variants-v2.mjs vrun-2 "$(sc vrun-2)"
# Corrected analysis of 0.3.3 on V5 2.0.
node tools/corrected-v5-0.3.3.mjs "$(sc corrected)"
# Repair suites on both research candidates (0.3.3 shows the original behaviour).
for v in "$C4" "$C3"; do
  node tools/regression-probes-v2.mjs "$v" "$(sc rg-$v)"
  node tests/paired-suite.mjs "$v" "$(sc paired-$v)"
  node tests/injection-suite.mjs "$v" "$(sc injection-$v)"
  node tests/wording-suite.mjs "$v" "$(sc wording-$v)"
  node tests/controls-suite.mjs "$v" "$(sc controls-$v)"
done
# The study's suites 1.0, unchanged, on 0.3.4; default-path differential (0.3.3 as a check of the copy); transport.
node tools/run-study-suites.mjs "$C4" "$(sc study-suites)" "study-suites-$C4"
node tools/run-differential-v2.mjs "$C4" "$(sc diff-$C4)"
node tools/run-differential-v2.mjs "$C3" "$(sc diff-$C3)"
node tools/transport/test-transport.mjs
# Tool-correction checks and the reproduction of the 0.3.3 failures.
node tools/check-variant-spec-v2.mjs
node tools/check-compile-row-v2.mjs "$(sc compile-row)"
node tools/reproduce-0.3.3.mjs "$(sc repro)"
# Mutation tests 2.0 (third run; the first two are in history/), then recovery tests 2.0 (needs out/run-1).
node tools/mutation-tests-v2.mjs "$(sc mutations)" > "$S/mutations.log" 2>&1 || { cat "$S/mutations.log"; exit 1; }
cp "$S/mutations.log" out/mutations-v2/run.log
node tools/recovery-tests-v2.mjs "$(sc recovery)"
node tools/analyze-v2.mjs
echo "post-freeze runs complete"
