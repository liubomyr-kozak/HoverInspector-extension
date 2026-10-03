# Code style: commands, browser check, Git and verification

## Commands

Run commands in the checkout you are editing. Use `git rev-parse --show-toplevel` to identify it.

| Command | Purpose |
| --- | --- |
| `yarn install` | Install dependencies; also runs WXT prepare. Only needed when dependencies need installation. |
| `yarn dev` | WXT development browser. |
| `yarn start` | Standalone Vite page at localhost:4400; does not replace extension checks. |
| `yarn build` | Production extension in `dist/chrome-mv3/`. |
| `yarn test` | All vitest tests, once. |
| `yarn vitest run <path>` | Focused tests for a file or directory. Replace `<path>`. |
| `yarn test:watch` | Tests in watch mode. |
| `yarn compile` | Full TypeScript diagnostics (`tsc --noEmit`). |
| `yarn compile:diff` | Full TypeScript diagnostics compared with the merge base (`scripts/tsc-diff.sh`); fails on new ones. |
| `yarn verify` | Pattern checks, `yarn compile:diff`, tests and build. See "Limits of `yarn verify`" below. |

Keep `yarn.lock` as the only package lockfile. Existing TypeScript failures are not a fixed allowance;
compare diagnostics before and after your change rather than relying on a documented error count.

## Browser check with Playwright

For visible behavior changes, use the built extension in Chromium. Read
`.claude/skills/verify-in-browser/SKILL.md`; its runner is `check-panel.mjs` in that directory.

The runner uses a copy of `dist/chrome-mv3/`, exposing the toolbar handler in that test copy, and serves
a local HTTP page. Follow its current invocation instead of modifying production background code to
make a test possible. The standalone Vite page does not verify extension injection or messaging.

Check the changed flow at panel widths **320px and 440px**:

- No clipped controls, overlap or unwanted horizontal scrolling.
- Tab navigation and visible keyboard focus; mouse clicks leave no focus outline.
- Open menus, selects and confirmations remain inside the shadow root and fit the panel.
- Expected user outcome and no new page/extension errors.
- Deactivation cleans up any page effects changed by the task.

Open the resulting screenshots and report their paths plus the interactions exercised. A screenshot
alone does not prove keyboard, storage or messaging behavior. Report any unavailable check explicitly.

Playwright locators can pierce the open shadow root. Inside page evaluation, use
`document.querySelector("hover-inspector")?.shadowRoot` to reach the extension UI.

## Git: branches, commits, pull requests

Work on the assigned branch and checkout. Follow the session's branch/commit authorization; this guide
does not itself authorize branch creation or a commit. Never push unless requested.

Commit subject: plain-English imperative, sentence case, about 72 characters or fewer, no final period
or `feat:`/`fix:` prefix. An area prefix is optional: `Unit Converter: remember the last units`.
The body explains why and what changes for the user. Include only attribution requested by the session;
never invent author or session identifiers.

PR body: explain **Before**, **After**, and relevant validation. Include **Not done** only for material
omissions. Name actual commands/results and browser interactions, not merely a claim that checks passed.

## Checklist before you commit

### Before changing behavior

Identify the relevant tests. The TypeScript baseline needs no manual step: `yarn compile:diff` builds
it from the merge base with master in a temporary worktree. Do not hide command/setup failures behind
a filter.

### After the change

1. Inspect the diff: every changed line serves the task. Check both tracked changes and new files.
2. For code changes, run relevant tests, then `yarn verify` (which runs all tests and the build).
   Read the output and exit status. Fix failures caused by the change; report unrelated blockers.
3. For TypeScript changes, `yarn verify` runs `yarn compile:diff`: diagnostics across **all files**,
   including unchanged consumers, compared by file, error code and message (line numbers ignored).
   No new diagnostics may be introduced. If it cannot run, report that; filtered output is not a substitute.
4. For UI changes, complete "Browser check with Playwright" above. For page effects/messages/storage,
   check the corresponding cleanup, validation or persistence behavior.
5. Check additions for prohibited types/debug code, duplicated helpers, theme literals and unnecessary
   architecture. Check accessible names, labels and cleanup where relevant.
6. Ensure generated builds, screenshots, scratch files and other package managers' lockfiles are not
   included in the proposed commit. Do not remove unrelated user files.
7. Commit only when authorized. Report what changed, checks actually run, and any remaining limitation.

For documentation-only edits, check referenced paths/commands, internal links, examples and the diff;
application builds and browser checks are unnecessary unless the edit changes executable material.

**Limits of `yarn verify`:** its regex checks are partial and color matches may only warn. It also
requires a Bash with `mapfile` support.
A setup failure is a failed check, not a clean result. The script does not do the diff review,
browser check or behavior checks described here.
