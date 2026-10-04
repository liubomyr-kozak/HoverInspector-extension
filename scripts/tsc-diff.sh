#!/usr/bin/env bash
# Full TypeScript comparison: diagnostics on your checkout vs. the merge base with master, in every file.
# Line numbers are ignored, so moved code does not count as new. Exit 1 when your change adds diagnostics.
# Usage: bash scripts/tsc-diff.sh            (compares with origin/master)
#        BASE=some-branch bash scripts/tsc-diff.sh
set -u
export LC_ALL=C
cd "$(git rev-parse --show-toplevel)" || exit 1

BASE="${BASE:-origin/master}"
git rev-parse --verify -q "$BASE" >/dev/null || BASE=master
MERGE_BASE="$(git merge-base HEAD "$BASE")" || { echo "FAIL: no merge base with $BASE"; exit 1; }
CACHE_DIR="${TMPDIR:-/tmp}/hi-tsc-diff"
mkdir -p "$CACHE_DIR"

# "file(line,col): error TSxxxx: message" -> "file: TSxxxx: message"; continuation lines are dropped
normalize() { sed -nE 's/^(.+)\([0-9]+,[0-9]+\): error (TS[0-9]+): (.*)$/\1: \2: \3/p' | sort; }

run_tsc() { # $1 checkout dir, $2 output file; a tsc that cannot start is a failed check, not zero errors
  (cd "$1" && node_modules/.bin/tsc --noEmit -p tsconfig.json) >"$2.raw" 2>&1
  local status=$?
  if [ $status -ne 0 ] && ! grep -qE '\): error TS[0-9]+:' "$2.raw"; then
    echo "FAIL: tsc did not run in $1"; tail -20 "$2.raw"; return 1
  fi
  normalize <"$2.raw" >"$2"
}

BASE_OUT="$CACHE_DIR/$MERGE_BASE.txt"
if [ ! -s "$BASE_OUT" ]; then
  WT="$CACHE_DIR/worktree-$MERGE_BASE"
  git worktree add -q --detach "$WT" "$MERGE_BASE" || exit 1
  ln -s "$PWD/node_modules" "$WT/node_modules"
  ln -s "$PWD/.wxt" "$WT/.wxt"
  run_tsc "$WT" "$BASE_OUT"; base_status=$?
  git worktree remove --force "$WT"
  [ $base_status -eq 0 ] || { rm -f "$BASE_OUT"; exit 1; }
fi

HEAD_OUT="$CACHE_DIR/head.txt"
run_tsc "$PWD" "$HEAD_OUT" || exit 1

NEW="$(comm -13 "$BASE_OUT" "$HEAD_OUT")"
echo "TypeScript diagnostics: base $(wc -l <"$BASE_OUT"), now $(wc -l <"$HEAD_OUT") (all files)"
if [ -n "$NEW" ]; then
  echo "FAIL: new TypeScript diagnostics:"; printf '%s\n' "$NEW" | head -30 | sed 's/^/        /'
  exit 1
fi
echo "ok:   no new TypeScript diagnostics"
