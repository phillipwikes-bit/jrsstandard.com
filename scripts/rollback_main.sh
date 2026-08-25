#!/usr/bin/env bash
# Roll production back to any earlier commit on main. One argument, one action.
#
#   bash scripts/rollback_main.sh --list            # show today's deploys
#   bash scripts/rollback_main.sh <sha>             # dry run, shows the diff
#   bash scripts/rollback_main.sh <sha> --confirm   # actually deploy the rollback
#
# HOW IT ROLLS BACK. It does NOT rewrite history. It creates a new commit on
# main whose tree is exactly the tree of <sha>, so the site returns to exactly
# what it served at that moment and every intermediate commit stays in the log.
# A rollback that erases the record of what happened is not a rollback, it is a
# cover-up, and it makes the next diagnosis impossible.
#
# research/ is never touched: it is not on main and this script only ever
# writes trees that came from main.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

git fetch origin main -q

if [ "${1:-}" = "--list" ] || [ -z "${1:-}" ]; then
  echo "Deploys on main, newest first:"
  echo
  git log origin/main --format='  %h  %ad  %s' --date=format:'%Y-%m-%d %H:%M' -20
  echo
  echo "Roll back with:  bash scripts/rollback_main.sh <sha> --confirm"
  exit 0
fi

TARGET="$1"
CONFIRM="${2:-}"

if ! git cat-file -e "$TARGET^{commit}" 2>/dev/null; then
  echo "error: $TARGET is not a commit in this repository" >&2
  exit 1
fi

CURRENT="$(git rev-parse --short origin/main)"
echo "current main : $CURRENT  $(git log -1 --format=%s origin/main)"
echo "rollback to  : $(git rev-parse --short "$TARGET")  $(git log -1 --format=%s "$TARGET")"
echo
echo "Files that would change:"
git diff --stat "origin/main" "$TARGET" -- . ':(exclude)research' || true
echo

if [ "$CONFIRM" != "--confirm" ]; then
  echo "DRY RUN. Nothing was pushed."
  echo "Re-run with --confirm to deploy this rollback."
  exit 0
fi

WORK="rollback-tmp-$$"
git checkout -q -B "$WORK" origin/main
# Take the target's tree wholesale for every path that is on main.
git checkout "$TARGET" -- .
STAGED_RESEARCH="$(git diff --cached --name-only | grep -c '^research/' || true)"
if [ "$STAGED_RESEARCH" != "0" ]; then
  echo "error: refusing to push, $STAGED_RESEARCH research/ paths were staged" >&2
  git checkout -q -
  git branch -D "$WORK" -q
  exit 1
fi

if git diff --cached --quiet; then
  echo "nothing to roll back: main already matches that tree"
  git checkout -q -
  git branch -D "$WORK" -q
  exit 0
fi

git commit -q -m "Roll production back to $(git rev-parse --short "$TARGET")

Restores the exact tree that commit served. History is preserved: every
commit made since remains in the log, this is a forward commit that undoes
their effect rather than a rewrite."
git push origin "$WORK:main"
echo
echo "rolled back. main is now $(git rev-parse --short HEAD)"
git checkout -q -
git branch -D "$WORK" -q
