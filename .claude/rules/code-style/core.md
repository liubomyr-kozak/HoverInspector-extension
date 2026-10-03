# Code style: read first

This folder is the owner's code style, split by topic. Claude Code loads `core.md`, `architecture.md`
and `workflow.md` at the start of every session. Every other file has a `paths:` list and loads by
itself when you read or edit a matching file. If the file you are about to change is not open yet,
open the topic file from the table below yourself.

Rules apply to code you add or change. They do not authorize cleanup of unrelated code.
Direct user instructions take precedence. If a documented API differs from the actual source, inspect
its definition and report the mismatch; do not invent an API or choose a pattern by commit date.
Examples marked **fragment** omit surrounding code. Inspect the named source for its current API.

## Core rules

1. Make the smallest change that satisfies the request. Preserve unrelated behavior and formatting.
   Do not add a context, Redux slice, helper file or abstraction just to satisfy a numerical limit.
2. Use Yarn only. Do not use npm, npx or pnpm, or add their lockfiles.
3. Use typed React function components. No new `any`, `@ts-ignore`, `@ts-nocheck` or `@ts-expect-error`.
4. Keep tool-specific code in its tool. Reuse existing shared components and helpers before adding one.
5. For UI: antd controls, Tailwind layout, shared design tokens. Keep overlays in the shadow root.
6. Preserve the host page. Clean up listeners, observers, timers and injected DOM/styles.
7. Store extension data in extension storage, never the host page's localStorage or sessionStorage.
8. Validate incoming messages before using them. Keep privileged extension APIs in the background.
9. Keep new comments and UI copy in English. No debug statements or commented-out code in additions.
10. Run the checks that cover the change. Report failures and unverified behavior explicitly.

## Topic files

All files are in `.claude/rules/code-style/`.

| Task | File | Loads by itself for |
| --- | --- | --- |
| Locate code or add a file | `architecture.md` | always |
| Commands, browser check, Git, verification | `workflow.md` | always |
| Add or change UI | `components.md`, `styling.md` | any `.tsx` |
| Add a tool or change its header/footer | `panel.md` | tool and launcher folders |
| Change state or async Redux work | `state.md` | store, slices, sagas, contexts |
| Read or write saved data | `storage.md` | core, background, tool folders, hooks |
| Change background code or messages | `messaging.md` | background, features, frame agent |
| Touch page DOM, events, overlays or frames | `host-page.md` | content entry, shared utils, overlays |
| Any TypeScript change | `typescript.md`, `legacy.md` | any `.ts`/`.tsx` |
| Add or change behavior | `tests.md` | tests |
