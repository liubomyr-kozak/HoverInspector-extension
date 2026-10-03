# Hover Inspector: code style and architecture

## Read first

Read this introduction for every task. Then read **only the sections selected by the table below**.
The rest of this file is a reference, not a checklist to apply to every change.

Rules apply to code you add or change. They do not authorize cleanup of unrelated code.
Direct user instructions take precedence. If a documented API differs from the actual source, inspect
its definition and report the mismatch; do not invent an API or choose a pattern by commit date.
Examples marked **fragment** omit surrounding code. Inspect the named source for its current API.

### Core rules

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

### Select what to read

Read every row that matches your change. Do not read unrelated recipes.

| Task | Read |
| --- | --- |
| Locate code or add a file | [1. Architecture](#1-project-in-one-page), [3. Placement](#3-folder-map), [4. Naming](#4-file-naming) |
| Any TypeScript change | [13. TypeScript and errors](#13-typescript-imports-comments-errors-logging) |
| Add or change UI | [5. Components](#5-writing-a-component), [7. Shared pieces](#7-shared-components-and-helpers), [8. Styling](#8-styling), [16. Browser checks](#16-browser-check-with-playwright) |
| Add a tool or change its header/footer | [6. Panel](#6-the-tool-panel-header-body-footer) |
| Change state or async Redux work | [9. State](#9-state-redux-sagas-local-state) |
| Read or write saved data | [10. Storage](#10-storage) |
| Change background code or messages | [11. Messaging](#11-background-and-messaging) |
| Touch page DOM, events, overlays or frames | [12. Host page](#12-working-with-the-host-page) |
| Work in a file with conflicting old patterns | [14. Legacy](#14-legacy-code-do-not-copy) |
| Add or change behavior | [15. Tests](#15-tests), [18. Verification](#18-checklist-before-you-commit) |
| Run commands or prepare a commit/PR | [2. Commands](#2-commands), [17. Git](#17-git-branches-commits-pull-requests), [18. Verification](#18-checklist-before-you-commit) |

## 1. Project in one page

Hover Inspector is a WXT browser extension for designers and QA. Its tools share one floating panel.

- `entrypoints/background/index.ts`: toolbar click, content-script injection, tab events and ports.
- `entrypoints/content/index.tsx`: creates the open shadow-root UI named `hover-inspector`.
- `entrypoints/content/app.tsx`: React providers, antd theme and overlay container.
- `entrypoints/content/modules/PopupContainer/PopupContainer.tsx`: tool registration (`COMPONENT_MAP`).
- `entrypoints/content/modules/Launcher/LauncherIcons.ts`: tool ids, names and icons.
- `entrypoints/frame-agent.ts`: entrypoint for the cross-origin frame agent.

Stack: React, TypeScript, Redux Toolkit + redux-saga, antd, Tailwind, styled-components, vitest + jsdom.
Use `package.json` for current versions and scripts; `wxt.config.ts` for extension build configuration.

## 2. Commands

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
| `yarn verify` | Existing script: pattern checks, changed-file TypeScript filtering, tests and build. See section 18 for limits. |

Keep `yarn.lock` as the only package lockfile. Existing TypeScript failures are not a fixed allowance;
compare diagnostics before and after your change rather than relying on a documented error count.

## 3. Folder map

Choose the location in this order:

| Code | Location under `entrypoints/` |
| --- | --- |
| Used by one tool | `content/modules/PopupContainer/<ToolName>/` |
| UI used by multiple tools | `shared/components/` |
| Pure helper or hook used by multiple tools | `shared/utils/` |
| Types used across tools | `shared/types/<domain>.ts` |
| Infrastructure without UI | `core/` |
| Storage key constants used by background | `core/constants/<domain>.ts` |
| Background-only work | `background/` |
| Extension lifecycle plumbing | `features/extension/` |
| Content Redux state | `content/store/<domain>/` |

Small tools may remain a single `<ToolName>.tsx`. For larger tools, create only folders actually needed:
`components/`, `hooks/`, `utils/`, `types.ts`, `constants.ts`, `<ToolName>.styled.ts`.
The `CSSSnapshotInspector/` folder demonstrates this organization; it is not a template to copy whole.

Do not add files directly under `entrypoints/`, or `index.ts`/`index.tsx` inside a new first-level
entrypoint folder, unless the task explicitly needs a WXT entrypoint. WXT treats those as build entries.

## 4. File naming

| Kind | Name |
| --- | --- |
| Component | `PascalCase.tsx` matching the main component |
| Hook | `useCamelCase.ts` |
| Pure helper | `camelCase.ts` |
| Styled components | `<Component>.styled.ts` |
| Tool types / constants | `types.ts` / `constants.ts` |
| Content slice | `<domain>.slice.ts` |
| Saga actions / watchers | `<domain>.saga.action.ts` / `<domain>.saga.ts` |
| Test | `__tests__/<name>.test.ts` (or `.test.tsx` for JSX) near the source |

Use `.tsx` only for JSX. Keep component-only props interfaces in that component file. Move types used
by multiple files to `types.ts`; split by domain only when a single types file becomes hard to navigate.
Use existing domain enums when available. A small local union does not need conversion to an enum.
New string enum members use `UPPER_SNAKE` names.

Do not add barrel `index.ts` files or put code in the empty legacy `shared/enam.ts`.

## 5. Writing a component

- Write a named function component export. Use typed props; `React.FC<Props>` and typed functions both work.
- Define `interface <Name>Props` above the component. Destructure props and defaults in the parameters.
- Keep handlers local unless they need reuse. Keep simple expressions local too.
- Extract parsing, matching or calculation when it has meaningful branches, needs independent testing,
  or is reused. Do not create a helper file for every expression.
- Start with local state and explicit props. Use tool context when multiple descendants need the same
  state and intermediate components merely relay it. Use Redux for shared domain/app state (section 9).
  Do not introduce either solely because props pass through a fixed number of levels.

Complete minimal component example:

```tsx
import { IconCopy } from "@tabler/icons-react";

import { IconButton } from "@entrypoints/shared/components/IconButton";

interface CopyValueButtonProps {
  value: string;
  onCopy: (value: string) => void;
}

/** Copies an available value through the caller's clipboard handler. */
export const CopyValueButton = ({ value, onCopy }: CopyValueButtonProps) => (
  <IconButton label="Copy value" disabled={!value} onClick={() => onCopy(value)}>
    <IconCopy size={18} aria-hidden />
  </IconButton>
);
```

Accessibility:

- Prefer `<button type="button">`, antd controls or shared `IconButton`. No bare clickable `div`/`span`.
  If a native button cannot fit the required structure, use `clickableProps` (section 7).
- Every icon button has an accessible name; every field has a label or `aria-label`.
- Set `aria-pressed` for toggles; menu triggers expose `aria-haspopup` and `aria-expanded`.
- Decorative icons use `aria-hidden`. Use semantic parents for `li`, `dt` and `dd`.
- Check text contrast against the actual background. A token alone does not guarantee contrast for
  every combination. Normal text needs at least 4.5:1; do not use text lighter than gray-500 on white.

## 6. The tool panel: header, body, footer

### Header

Every tool puts its title and header actions into the shared header portal.

1. Add the tool's id to `HeaderPortalId` in
   `entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons.tsx`.
   Use a unique string such as `MY_TOOL = "my-tool-header"`.
2. Render `PortalModalHeader` with that enum value.
3. Inside it render `FeatureTitle`, `FeatureIcon` and `FeatureTitleText`.
4. Use the tool's title from `LauncherIcons.ts` as both visible text and the title attribute.
5. Put header actions inside `PortalModalHeaderButtons`; use `IconButton` at its default 28px size,
   with 18px icons.

Imports and JSX fragment (replace `TOOL` and `MY_TOOL` with your registered tool):

```tsx
import {
  HeaderPortalId,
  PortalModalHeader,
  PortalModalHeaderButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon";

<PortalModalHeader portalId={HeaderPortalId.MY_TOOL}>
  <FeatureTitle>
    <FeatureIcon icon={TOOL.icon} />
    <FeatureTitleText title={TOOL.title}>{TOOL.title}</FeatureTitleText>
    <PortalModalHeaderButtons>{/* Tool action buttons */}</PortalModalHeaderButtons>
  </FeatureTitle>
</PortalModalHeader>;
```

`FeatureTitleText` handles truncation. `PortalModalHeaderButtons` supplies the class used for narrow
headers. Do not replace either with raw title text or an arbitrary wrapper.
Use `PortalModalHeader`, not its old alias `ScenarioPortalHeaderButtons`.
Set `FeatureIcon`'s `isBetta` only when the owner designates the tool as beta.

### Footer and size

Use `ScenarioPortalFooterButtons` from the sibling `ScenarioPortalFooterButtons.tsx` file for view
actions such as Save or Compare. Reuse your tool's `HeaderPortalId` value as `portalId`; never borrow
another tool's id. Leave `containerId` unset to target the shared footer. Render only when actions apply.

The panel minimum is 320 × 260px; default is 440 × 560px. Check the tool at widths 320px and 440px.
Use `min-w-0`, truncation for single-line text and wrapping rows to prevent overflow or clipped controls.

## 7. Shared components and helpers

Inspect the existing component's API before using it; do not create a duplicate for the same behavior.
Paths in this table are under `entrypoints/`.

| Need | Use |
| --- | --- |
| Icon-only button | `shared/components/IconButton.tsx`: required `label`, optional `active` for toggles; sizes 28 header, 26 cards, 24 compact rows |
| Empty view | `shared/components/EmptyState.tsx`: `title`, optional `icon`, `description`, `action` |
| Loading view | `shared/components/LoadingState.tsx`: `label`, optional `inline` or progress |
| Tooltip | `shared/components/Tooltip.tsx`, already configured for the shadow root |
| Copy button | `shared/components/CopyButton.tsx` |
| Keyboard behavior for a non-button | `shared/utils/a11y.ts`: `clickableProps` |
| Popover keyboard/focus handling | `shared/utils/usePopoverFocus.ts` |
| Debounce | `shared/utils/useDebouncedCallback.ts` |
| Page highlight | `shared/components/HighlightOverlay/HighlightOverlayContext.tsx` |
| Element selector | `shared/utils/toSelector.ts` |
| Frame helpers | `shared/utils/frames.ts` |
| z-index values | `shared/constant/zIndex.ts` |

Use `toast` from `react-toastify` for feedback. Hide or disable copying when there is no actual value;
do not copy a placeholder such as "(not provided)".

## 8. Styling

### Choose a styling tool

1. antd for standard controls. Prefer its size props over custom control styling.
2. Tailwind for layout and simple typography in JSX.
3. styled-components for prop-driven states, child selectors, pseudo-classes or reusable styled pieces.
   Prefix styling-only props with `$`, such as `$selected`.

Use `entrypoints/shared/styles/tokens.ts` for colors, radii and sizes. In styled-components, use
`${tokens.color.text}` or `${tokens.radius.md}px`. In Tailwind, use the corresponding palette class.
Read the token definition for its current value instead of copying a token object into another file.

- No hard-coded hex value when an existing token represents it.
- No legacy orange `primary-*` Tailwind palette or `dark:` classes; this UI is light only.
- Use `px` in styled-components and inline styles. Tailwind rem values are converted at build time
  by `postcss.config.cjs`; styled-components values are not.
- Inline styles are for computed dimensions or one-off numeric values, not colors.
- Do not import global CSS from a component. The shadow root receives `content/style.css`.

### Shadow-root overlays

antd overlays must stay inside the extension shadow root. `ConfigProvider` in `content/app.tsx`
provides the default. When passing `getPopupContainer` explicitly, use the existing `shadowBody` helper:

```tsx
import { Select } from "antd";

import { shadowBody } from "@entrypoints/shared/utils/shadowBody";

// JSX fragment: value, setValue and options belong to the surrounding component.
<Select value={value} onChange={setValue} options={options} getPopupContainer={shadowBody} />;
```

Do not duplicate container lookup code or suppress type errors. Verify the actual open overlay stays
inside the shadow root; do not send it to the page's `document.body`.

- Give menus/confirmations a suitable `maxWidth`; use `bottomRight` placement at a right edge.
- Wrap an `IconButton` used as a Popover/Popconfirm trigger in `<span className="inline-flex">`.
- For a row menu, use the `RowMenu` pattern in `CSSSnapshotInspector/SnapshotManager.tsx`
  (antd Popover and menu semantics), not a hand-positioned dropdown div.

### Focus, selection and text

The host's `data-hi-keyboard` attribute and `content/style.css` control keyboard focus outlines.
Do not add button `focus:ring-*` or custom focus outlines. Preserve visible keyboard focus and verify
mouse clicks do not leave an outline. If a third-party widget needs a fix, scope it under
`:host([data-hi-keyboard])`; antd focus appearance comes from the shared theme.

Selected items use background tint and border color, not rings: for example `bg-blue-50 border-blue-300`.
Set `aria-pressed` for toggles or `aria-selected` for listbox/tab items as appropriate.

Use sentence case for labels and messages. Tool product names keep their `LauncherIcons.ts` casing.
Keep labels short; use an ellipsis for actions that open further UI. Do not restyle the panel title.

## 9. State: Redux, sagas, local state

| Data | Owner |
| --- | --- |
| State used by one component | Local `useState` |
| State shared within a tool | Lift to a common owner; use tool context when prop relaying becomes the problem |
| App-wide or shared domain state | Content Redux slice |
| Data that survives reloads | Storage, loaded into the appropriate state owner |

Small tools may use local state and storage directly. Do not add Redux just for persistence.

### Content slices

Add `<domain>/<domain>.slice.ts` under `entrypoints/content/store/` and register its reducer in
`rootReducer.ts`. Export typed selectors alongside the slice and use `useSelector(selectX)` in UI.

Minimal slice template (adapt the domain, file and registration):

```ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface WordCounterState {
  lastCount: number;
}

const initialState: WordCounterState = { lastCount: 0 };
const wordCounterSlice = createSlice({
  name: "wordCounter",
  initialState,
  reducers: {
    setLastCount: (state, action: PayloadAction<number>) => {
      state.lastCount = action.payload;
    },
  },
});

export const { setLastCount } = wordCounterSlice.actions;
/** Selects the most recent count. */
export const selectLastCount = (state: { wordCounter: WordCounterState }) => state.wordCounter.lastCount;
export default wordCounterSlice.reducer;
```

### Sagas

For side effects triggered by Redux actions, follow the existing domain's saga setup:

1. Define the action generator using `sagaEnhancer` in `<domain>.saga.action.ts`.
2. Give its generator a unique name: the enhancer derives an action type from the name.
3. Register the watcher in `<domain>.saga.ts`; register a new domain saga in `rootSaga.ts`.
4. Dispatch with `action.getPayload(payload)`.

Use `call` for async operations in new sagas; do not copy older direct promise yields.
Fragment inside an existing saga (import `call` and `put` from `redux-saga/effects`):

```ts
yield call(() => ExtensionStorageManager.changeLauncherIconOrder(payload));
yield put(setLauncherIconOrder(payload));
```

Catch failures and restore loading state in `finally` where applicable. Existing domains keep their
naming; for a new domain use `<verb><Noun>Watcher` in `<domain>.saga.action.ts`.
Reference definitions: `core/libs/sagaEnhancer.ts`, `content/store/rootSaga.ts`.

## 10. Storage

Choose the existing storage owner before adding a write path.

| Data | Path |
| --- | --- |
| Small preferences/history owned by one tool | `browser.storage.local` directly |
| App settings, automation, CSS snapshots, element details | `ExtensionStorageManager` and background actions |
| Notes | Existing `background/store/notesActionsSlice.ts` actions |

For a tested module, explicitly `import { browser } from "wxt/browser"`; tests do not get WXT auto-imports.

### Small per-tool preferences

- Use a descriptive key such as `unitConverterHistory`, declared as a constant. Reuse the domain's key
  convention. Move the key to tool `constants.ts` only when shared by files.
- Load before enabling saves. Do not overwrite existing storage with initial defaults during loading.
- Validate saved fields against their expected types; merge valid saved fields over defaults.
- Handle load failure explicitly; do not silently overwrite data after a failed read.
- If the UI permits editing during load, ensure the late load cannot overwrite that edit. The simpler
  option is to keep preference controls disabled until loading finishes.
- Handle async failures according to section 13. Do not write after the owning UI has been disposed.
- For live shared state across components/tabs, inspect `shared/hoverCard/store.ts`
  (`useSyncExternalStore` and `browser.storage.onChanged`) instead of inventing a second mechanism.

These are behavior requirements, not a universal copy-and-paste hook. Adapt the existing tool's storage
code and test the load/save ordering when changing it.

### App settings and domain data

The usual chain is component/saga → `core/services/storage/ExtensionStorageManager.ts` → background
slice → background action → storage service. Inspect the domain before extending the chain.

- App settings actions use the `updateAppState` queue in `background/store/actions/appStateActions.ts`.
- A new setting needs a default and migration handling in `core/initialData/app.ts`.
- Use storage keys from `core/constants/`: `index.ts`, `automation.ts`, `cssSnapshot.ts`, `elementDetails.ts`.
- Preserve automation record prefixes (`sc_`, `fo_`, `fu_`, `sch_`, `tr_`, `notification_`); list logic
  depends on them. Keep existing data readable when changing its shape.

## 11. Background and messaging

Background has privileged tabs/scripting/windows APIs and no page DOM. Content has page DOM and React.
Put work in background when it needs those privileged APIs, outlives the page or coordinates tabs.

Reuse the layer for the domain:

| Purpose | Existing layer |
| --- | --- |
| Extension activation/deactivation/check | `features/extension/messaging.ts`, `@webext-core/messaging` |
| Call background domain actions | `core/libs/chromeActionsSlice.ts` and `background/store/actions/`, `background/store/slices/` |
| Notes with persisted slice state | `core/libs/createChromeSlice.ts`, `background/store/notesActionsSlice.ts` |
| Frame agent | Runtime messages with a `type` field; `shared/frameAgent/protocol.ts`, `background/frameAgentRelay.ts` |

Do not introduce `webext-bridge`; it is installed but unused.

To extend a background domain action, add the function to that domain's action object and export it
through its slice. Add a storage-manager method when the existing domain uses that manager. Notes
export their actions directly. Follow the receiving API's `({ data }, sender)` contract and return
JSON-serializable values. Inspect the wrapper's error result before handling it at the caller.

Message boundary rules:

- Treat incoming values as `unknown`, then validate their shape before accessing fields.
- For content-script messages, check `sender.id === browser.runtime.id` and required tab/frame identity.
- Ignore messages outside your protocol so other listeners can handle them.
- Never trust page `window.postMessage` payloads. Do not send page content over that channel.

## 12. Working with the host page

### Page interaction and cleanup

- Undo changes to page DOM/styles/classes when the tool closes or the extension deactivates.
- For page-wide CSS, use an identifiable `hover-inspector-...` style element and remove it on cleanup.
  Use outlines rather than borders for highlighting to avoid shifting layout.
- Keep UI overlays in the shadow root; use fixed positioning and `pointer-events: none` where they
  must not intercept page interaction.
- Do not cancel host-page events unless the user enabled an interaction mode that requires it.
  Inside the extension UI, an Esc handler that closes a popover/editor should prevent the same event
  from also deactivating the extension; use the existing `usePopoverFocus` pattern.
- Read geometry with `getBoundingClientRect` and styles with `getComputedStyle`; account for zoom and
  transforms. The host page's rem size is not necessarily 16px.
- Clean up each effect where it is created: event listeners, observers, timers, styles and overlays.
  Disconnect observers. Listeners outside React belong in WXT `ctx.onInvalidated` cleanup.

Reference: `content/index.tsx`, `content/modules/EventListenerProvider.tsx`, `shared/utils/allBorders.ts`.

### Frames

Use `watchSameOriginFrames` from `shared/utils/frames.ts` for accessible frames.
Cross-origin frames use `frame-agent.ts` and `shared/frameAgent/agent.ts`; the top frame draws the UI.

When extending the frame protocol:

1. Add the field to its type in `shared/frameAgent/protocol.ts`.
2. Validate it in the sanitizer with a type check and size/length limit.
3. Add invalid-input and boundary cases in `shared/frameAgent/__tests__/protocol.test.ts`.
4. For a computed property, extend the whitelist source (`styleRulesList` or `CARD_COMPUTED_PROPS`).

Keep page content on extension messaging. Preserve the existing random-key registration mechanism and
agent cleanup on deactivate. Inspect protocol, hub and relay definitions before changing that boundary.

## 13. TypeScript, imports, comments, errors, logging

- Give new code real types even though `noImplicitAny` is currently disabled. Use `unknown` and
  narrowing at external boundaries, not casts that merely silence errors.
- Prefer `interface` for object shapes, `type` for unions, and `as const` for fixed lookup objects.
- Use `import type` or inline `type` for type-only imports.
- Use `@entrypoints/...` across tool/folder boundaries and relative imports within the same tool.
  Do not add `@/entrypoints/...` or long relative paths escaping the tool.
- Omit `.ts`/`.tsx` import extensions. Order React, other packages, alias imports, then relative imports.
- Use double quotes and semicolons; follow `.prettierrc` for formatting. Do not reformat unrelated code.
- Comments explain intent or constraints in English. Add short JSDoc for exported helpers/components
  and non-obvious contracts. Do not document obvious implementation steps.

Error handling:

| Situation | Handling |
| --- | --- |
| Caller owns recovery | Return/propagate the error to that caller; ensure the async chain is handled |
| User action fails | Explain with `toast.error(...)` or inline error text |
| Failure needs diagnosis | `console.error("Failed to ...", error)`; prefix background logs with the area |
| Expected recoverable problem | `console.warn(...)` when useful |
| Explicitly best-effort preference/history write | Catching with `.catch(() => undefined)` is allowed only when silent loss is acceptable |

Do not silently swallow user-authored data or successful-save claims. No unhandled rejections.
Use toasts or antd confirmation controls, not `alert`, `confirm` or `prompt`.
Do not add `console.log`, `debugger`, commented-out code or TypeScript suppression directives.

## 14. Legacy code: do not copy

Follow these replacements in the lines your task needs. Leave unrelated legacy code alone, even if its
cleanup looks small. Report a relevant obstacle; do not expand the task into a migration.

| Old pattern | New code |
| --- | --- |
| `any` selectors or suppressed typing | Typed selectors/props; `unknown` with validation at boundaries |
| Custom untyped popup-container lookup | Shared `shadowBody` helper |
| Hard-coded theme colors | Shared token or corresponding Tailwind class |
| Button focus rings / selection rings | Global keyboard focus / selected background tint |
| Dark-mode classes or orange primary palette | Current light theme |
| Literal or another tool's portal id | Own `HeaderPortalId` value |
| `ScenarioPortalHeaderButtons` header alias | `PortalModalHeader` |
| Styling props forwarded to DOM | `$` transient styled props |
| Old custom thunk middleware | Existing RTK slice/saga setup |
| `@/entrypoints/...` imports | `@entrypoints/...` |
| Tests beside source | New tests in adjacent `__tests__/` |
| Hand-positioned dropdown div | antd Popover menu with keyboard handling |

Vendored areas (`shared/components/git-diff-view/`, `shared/components/ReactRnd/`,
`PopupContainer/Note Taking Tools/`) are not style references. Edit them only when targeted by the task.

## 15. Tests

vitest uses jsdom and repository aliases. WXT auto-imports do not exist in tests; explicitly import
extension APIs where needed or keep pure logic independent of them.

- For a bug, reproduce the incorrect behavior before fixing it, then verify the fix.
- Test meaningful parsing, calculation, matching and state transitions, including relevant edge cases.
- Test message sanitizers with malformed/oversized input; test migrations against old saved shapes.
- Do not extract trivial expressions or add tests that merely repeat implementation to satisfy a quota.
- UI changes need the browser check in section 16. The existing suite focuses on logic rather than
  component interaction; small markup helpers may use `renderToStaticMarkup`.
- Import `describe`, `expect`, `it` from `vitest`. Name cases by behavior. Use fixed dates rather than
  the live clock when testing date-dependent logic.

Examples to inspect: `shared/frameAgent/__tests__/protocol.test.ts`,
`background/services/noteScope.test.ts`, and the tool's existing `utils/__tests__/`.

Start with `yarn vitest run <relevant-path>`. Run the full suite and build as required by section 18.
Do not quote a historic test count as evidence of passing tests.

## 16. Browser check with Playwright

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

## 17. Git: branches, commits, pull requests

Work on the assigned branch and checkout. Follow the session's branch/commit authorization; this guide
does not itself authorize branch creation or a commit. Never push unless requested.

Commit subject: plain-English imperative, sentence case, about 72 characters or fewer, no final period
or `feat:`/`fix:` prefix. An area prefix is optional: `Unit Converter: remember the last units`.
The body explains why and what changes for the user. Include only attribution requested by the session;
never invent author or session identifiers.

PR body: explain **Before**, **After**, and relevant validation. Include **Not done** only for material
omissions. Name actual commands/results and browser interactions, not merely a claim that checks passed.

## 18. Checklist before you commit

### Before changing behavior

Identify the relevant tests. For TypeScript changes, capture complete `yarn compile` output and exit
status before editing. Preserve the output outside the source tree. Do not hide command/setup failures
behind a filter. Keep the same checkout and compiler configuration for the after-change comparison.

### After the change

1. Inspect the diff: every changed line serves the task. Check both tracked changes and new files.
2. For code changes, run relevant tests, then `yarn verify` (which runs all tests and the build).
   Read the output and exit status. Fix failures caused by the change; report unrelated blockers.
3. For TypeScript changes, also run full `yarn compile` and compare diagnostics to the pre-change
   baseline across **all files**, including unchanged consumers. Compare error code, file and message;
   account for shifted line numbers. No new diagnostics may be introduced. If no baseline was captured,
   report that limitation; filtered output is not a substitute.
4. For UI changes, complete section 16. For page effects/messages/storage, check the corresponding
   cleanup, validation or persistence behavior.
5. Check additions for prohibited types/debug code, duplicated helpers, theme literals and unnecessary
   architecture. Check accessible names, labels and cleanup where relevant.
6. Ensure generated builds, screenshots, scratch files and other package managers' lockfiles are not
   included in the proposed commit. Do not remove unrelated user files.
7. Commit only when authorized. Report what changed, checks actually run, and any remaining limitation.

For documentation-only edits, check referenced paths/commands, internal links, examples and the diff;
application builds and browser checks are unnecessary unless the edit changes executable material.

**Limits of `yarn verify`:** `scripts/verify.sh` filters TypeScript diagnostics to changed files. It does
not prove the absence of errors in unchanged consumers and does not compare a full baseline. Its regex
checks are partial and color matches may only warn. It also requires a Bash with `mapfile` support.
A setup failure is a failed check, not a clean result. Do not claim that the script implements the
additional review and full-diagnostic comparison described here.
