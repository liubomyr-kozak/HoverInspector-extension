# Hover Inspector extension

Browser extension (Chrome MV3; Firefox, Edge, Safari builds) for designers and QA. It measures distances
between page elements and offers tools in one floating panel: Element Inspector, Page Ruler, Color
Picker, Unit Converter, Color Palette & Typography, Automation Scenarios, CSS Snapshot Inspector (Page
Notes and Note Taking Tools are no longer in the launcher). The whole UI lives in the open shadow root of a `<hover-inspector>` element on
the user's page.

Full guide: `docs/CODE_STYLE.md`. Read it before your first change. Skills: see the end of this file.

## Stack

- WXT 0.20, Manifest V3 (`wxt.config.ts`), shadow-root UI via `createShadowRootUi` (`entrypoints/content/index.tsx`)
- React 19 function components, TypeScript (`strict`)
- Redux Toolkit slices + redux-saga (`entrypoints/content/store/`), `sagaEnhancer` + `.getPayload()`
- antd 5 inside `StyleProvider` + `ConfigProvider` with the shared theme (`entrypoints/content/app.tsx`)
- styled-components 6, Tailwind 3, design tokens in `entrypoints/shared/styles/tokens.ts`
- Messaging: `@webext-core/messaging` (`entrypoints/features/extension/messaging.ts`) and chrome slices
  (`entrypoints/core/libs/`). `webext-bridge` is installed but unused: never use it.
- Tests: vitest + jsdom. Browser checks: Playwright Chromium with `dist/chrome-mv3`.

## Commands (Yarn only)

```bash
yarn install   # install (also runs wxt prepare)
yarn build     # production build -> dist/chrome-mv3/  (must pass before commit)
yarn test      # vitest run                          (must pass before commit)
yarn verify    # every automatic check on your change (must print "all automatic checks passed")
yarn dev       # WXT dev browser
yarn start     # standalone page, http://localhost:4400
```

**Never** use npm, npx or pnpm in the repo. **Never** create or commit `package-lock.json`. `yarn.lock` is
the only lockfile. `yarn compile` (tsc) has about 227 old errors: only check that your files add none.

## Definition of done (do all of it, every time)

1. Run `yarn verify` in the repo root. Fix every `FAIL` line and run it again until it prints
   `RESULT: all automatic checks passed`. It runs the forbidden-pattern checks, TypeScript on your
   files, `yarn test` and `yarn build`.
2. If you changed anything visible, do the browser check (`.claude/skills/verify-in-browser/SKILL.md`)
   at 320px and 440px and open both screenshots. Not optional: unit tests do not see layout.
3. Commit (message format in "Git" below).
4. In your report, paste the last line of `yarn verify` and the screenshot paths.

## Mistakes small models make here (check your diff for each)

1. Copying an old pattern from the file you edit. Old files contain `// @ts-ignore`, `any`, hex colours
   and their own `getPopupContainer`. The rules beat the surrounding code. Never copy them.
2. `any` in a helper type, e.g. `formatter?: (value: any) => string`. Write the real type
   (`(value: number) => string`) or split the list by value type.
3. `// @ts-ignore` above `getPopupContainer`. Use `getPopupContainer={shadowBody}` from
   `@entrypoints/shared/utils/shadowBody` (typed, no ignore needed).
4. `<dt>`/`<dd>` or `<li>` without their `<dl>`/`<ul>` parent. Use the right parent or plain `<div>`s.
5. A copy button that copies a placeholder such as "(not provided)". Hide or disable copy for empty values.
6. Skipping the browser check because tests passed.
7. Commit body that lists files instead of saying why. Say what changes for the user and why.
8. Working in a git worktree but building or checking the main checkout. Always use
   `REPO="$(git rev-parse --show-toplevel)"` and pass it on (see the skills).

## Folder map

```
entrypoints/
  background/      service worker: toolbar click, tabs, frame-agent relay, background "chrome slices"
  content/         content script: index.tsx (shadow UI), app.tsx (providers), style.css, store/
    modules/PopupContainer/   the panel; one file or folder per tool; COMPONENT_MAP in PopupContainer.tsx
    modules/Launcher/         toolbar; LauncherIcons.ts lists every tool
  core/            no-UI infrastructure: storage services, slice libs, storage key constants, initial data
  features/        extension plumbing: messaging protocol, tab sessions
  shared/          reusable UI (components/), tokens (styles/), pure utils (utils/), frameAgent/, hoverCard/, types/
  frame-agent.ts   script injected into cross-origin iframes
docs/CODE_STYLE.md   the detailed guide
.claude/skills/      repo skills
```

## The most important rules

1. Put code used by one tool inside `entrypoints/content/modules/PopupContainer/<ToolName>/`; code used by
   two or more tools in `entrypoints/shared/`. Never add files directly in `entrypoints/` (WXT entrypoints).
2. Function components with a typed `interface XProps`. Shared types, interfaces and enums go in separate
   `types.ts` files; group many types in a folder. Prefer a string `enum` over a `switch` on raw strings.
3. Every tool renders its title through `PortalModalHeader` (id from `HeaderPortalId`) with
   `FeatureTitle` + `FeatureIcon` + `FeatureTitleText`. Footer actions use `ScenarioPortalFooterButtons`.
4. Use the shared `IconButton` (with `label`), `EmptyState`, `LoadingState`, `Tooltip`, `clickableProps`.
5. Colours, radii and sizes come from `tokens` (or the equal Tailwind gray/blue class). Text is never lighter
   than gray-500. WCAG AA contrast everywhere. No `dark:` classes. `px`, never `rem`, outside Tailwind.
6. antd for controls, Tailwind for layout, styled-components (with `$transient` props) for stateful or
   reused styles.
7. antd overlays must render inside the shadow root (global `ConfigProvider`; `shadowBody` when passing
   `getPopupContainer`). Never into the page's `document.body`.
8. No focus outlines for mouse users: never add your own focus styles. The ring appears only while the host
   has `data-hi-keyboard` (`content/index.tsx`, `content/style.css`).
9. Selected items use a background tint (`bg-blue-50 border-blue-300`, `tokens.color.primaryBg`), not rings.
10. Every tool works at the 320px minimum panel width. Check 320px and 440px in Chromium.
11. Sentence-case labels. Only tool names in `LauncherIcons.ts` are Title Case.
12. Never break the host page: undo every listener, observer, timer and injected style in a cleanup.
    Never use the page's `window.localStorage`; use `browser.storage.local`.
13. Validate every message (`unknown` + type guards, check `sender.id`). Never trust `postMessage` data.
14. No `any`, `@ts-ignore`, commented-out code, `console.log`, `debugger` or `alert()` in new code.
    English comments that explain why.
15. Avoid prop drilling: use a context or Redux. Move pure logic to `utils/` and test it in `__tests__/`.

Much old code breaks these rules (hard-coded colours, `any`, Ukrainian comments). Do not copy it; see
`docs/CODE_STYLE.md` section 14. Prefer the newest code as a model.

## Owner guidelines (`guidelines.md`)

- Descriptive interfaces, types and enums in separate files; group many types in a folder.
- When you write a `switch`, check whether an enum makes sense.
- Use Tailwind for styling (antd and tokens-based styled-components as described above).
- Avoid props drilling; refactor when you see it.
- Ask a question when you are not sure about something.
- `guidelines.md` asks for documentation and analysis in Ukrainian. The owner later asked for agent
  instruction files (`CLAUDE.md`, `docs/CODE_STYLE.md`, `.claude/skills/**`) in English. Write those in English.

## Git

- Work on the given branch; never push unless asked.
- Commit subject: plain-English imperative, often `Area: what changes for the user`, no `feat:` prefix.
  Body explains why. PR body: `Before:` / `After:` / `## Not done` / `## How` (see CODE_STYLE §17).
- Template:

  ```
  Unit Converter: swap units and choose the decimal precision

  People converting back and forth had to pick both units again; the result also always showed
  four decimals. The precision is remembered in browser.storage.local.
  ```

## Skills (`.claude/skills/`)

- `add-tool` - add a new tool panel end to end (launcher entry, panel, storage, tests, browser check).
- `write-code-in-house-style` - short checklist for any code change.
- `fix-ui-bug` - reproduce in Chromium, fix the root cause, verify at 320/440px.
- `verify-in-browser` - the Playwright script that opens a tool with the built extension and screenshots it.
