#!/usr/bin/env bash
# One command that runs every automatic check from docs/CODE_STYLE.md section 18 on your change.
# Usage: yarn verify            (compares with origin/master)
#        BASE=some-branch yarn verify
# Exit code 0 means every automatic check passed. The browser check (verify-in-browser skill) is still yours.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

BASE="${BASE:-origin/master}"
git rev-parse --verify -q "$BASE" >/dev/null || BASE=master
MERGE_BASE="$(git merge-base HEAD "$BASE")"
failed=0
fail() { echo "FAIL: $1"; failed=1; }
ok() { echo "ok:   $1"; }

# Changed source files: committed since the base, staged, unstaged and new untracked files
mapfile -t CHANGED < <({ git diff --name-only "$MERGE_BASE"; git ls-files --others --exclude-standard; } |
  sort -u | grep -E '\.(ts|tsx|js|mjs|css)$' | grep -v '^\.claude/' | while read -r f; do [ -f "$f" ] && echo "$f"; done)
echo "Changed files (${#CHANGED[@]}):"; printf '  %s\n' "${CHANGED[@]}"; echo

# Added lines only: tracked changes plus whole untracked files
added_lines() {
  git diff "$MERGE_BASE" -U0 -- "${CHANGED[@]}" | grep -E '^\+[^+]' | sed 's/^+//'
  git ls-files --others --exclude-standard -- "${CHANGED[@]}" | while read -r f; do cat "$f"; done
}
ADDED="$( [ ${#CHANGED[@]} -gt 0 ] && added_lines )"

check_pattern() { # $1 label, $2 regex, $3 "keep-comments" to also check comment lines
  local hits; hits="$(printf '%s\n' "$ADDED" | grep -nE "$2")"
  [ "${3:-}" = "keep-comments" ] || hits="$(printf '%s\n' "$hits" | grep -vE '^[0-9]+:\s*(//|\*|/\*)')"
  if [ -n "$hits" ]; then fail "$1"; printf '%s\n' "$hits" | head -20 | sed 's/^/        /'; else ok "$1"; fi
}

[ -f package-lock.json ] && fail "package-lock.json exists (Yarn only: delete it)" || ok "no package-lock.json"
check_pattern "no 'any' type" '(:\s*any\b|as any\b|<any>|any\[\])'
check_pattern "no @ts-ignore / @ts-nocheck" '(//|/\*)[[:space:]]*@ts-(ignore|nocheck|expect-error)' keep-comments
check_pattern "no console.log" 'console\.log\('
check_pattern "no debugger" '^\s*debugger;?'
check_pattern "no alert()/confirm()" '\b(alert|confirm)\('
check_pattern "no dark: classes" '\bdark:'
check_pattern "no rem outside Tailwind" '[0-9.]+rem\b'
check_pattern "no own outline / focus ring styles" '(outline:\s*[^n0]|focus:ring|focus-visible:ring)'
check_pattern "no window.localStorage" '\blocalStorage\.'
HEX="$(printf '%s\n' "$ADDED" | grep -nE '#[0-9a-fA-F]{3,8}\b' | grep -v 'tokens.ts')"
[ -n "$HEX" ] && { echo "WARN: hard-coded hex colours (use tokens unless there is no token):"; printf '%s\n' "$HEX" | head -10 | sed 's/^/        /'; }

echo; echo "TypeScript (only errors in your files count; the repo has old errors elsewhere)..."
if [ ${#CHANGED[@]} -gt 0 ]; then
  TSC="$(yarn -s compile 2>&1 | grep -F -f <(printf '%s(\n' "${CHANGED[@]}"))"
  [ -n "$TSC" ] && { fail "TypeScript errors in changed files"; printf '%s\n' "$TSC" | head -20 | sed 's/^/        /'; } || ok "no TypeScript errors in changed files"
fi

echo; echo "yarn test..."
yarn -s test >/tmp/hi-verify-test.log 2>&1 && ok "yarn test" || { fail "yarn test (see /tmp/hi-verify-test.log)"; tail -30 /tmp/hi-verify-test.log; }
echo "yarn build..."
yarn -s build >/tmp/hi-verify-build.log 2>&1 && ok "yarn build" || { fail "yarn build (see /tmp/hi-verify-build.log)"; tail -30 /tmp/hi-verify-build.log; }

echo
if [ $failed -ne 0 ]; then echo "RESULT: FAILED. Fix every FAIL line, then run 'yarn verify' again."; exit 1; fi
echo "RESULT: all automatic checks passed. Now do the browser check (.claude/skills/verify-in-browser)."
