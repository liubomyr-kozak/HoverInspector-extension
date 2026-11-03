---
name: write-code-in-house-style
description: Condensed checklist for writing or changing any code in the Hover Inspector repo the way the owner writes it - structure, components, styling, state, storage, tests, commits. Use before writing code in this repo and again before committing.
---

# Write code in the house style

The full style is in `.claude/rules/code-style/` (index: `docs/CODE_STYLE.md`). This page is the short version. When
in doubt, open the file named in brackets. If this page and a rule file disagree, the rule file wins.

## Before you write

1. Find the closest reference example and follow its shape (inspect its current API first):
   - small tool: `entrypoints/content/modules/PopupContainer/UnitConverter.tsx`
   - list with selection and a ⋮ menu: `entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/SnapshotManager.tsx`
   - Tailwind rows and tiles: `entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition/tokenUi/TokenTabLayout.tsx`
   - shared state through storage: `entrypoints/shared/hoverCard/store.ts`
   - message validation: `entrypoints/shared/frameAgent/protocol.ts`
2. Decide where the file goes [architecture.md]:
   - one tool only → `entrypoints/content/modules/PopupContainer/<ToolName>/...`
   - used by two or more tools → `entrypoints/shared/components/` or `entrypoints/shared/utils/`
   - needs `chrome.tabs`/`chrome.scripting` → `entrypoints/background/`
3. **Never** add a file directly in `entrypoints/` or an `index.ts` in a new first-level folder (WXT
   builds them as entrypoints).
4. **Never** use npm. Yarn only: `yarn install`, `yarn build`, `yarn test`.

## While you write

Files and names [architecture.md]

- `.tsx` only with JSX. Components `PascalCase.tsx`, hooks `useX.ts`, utils `camelCase.ts`,
  styles `X.styled.ts`, types `types.ts`, tests `__tests__/x.test.ts`.
- Types shared by several files go in `types.ts`. Use existing domain enums; a repeated string
  `switch` may call for a string `enum`, a small local union does not.
- No new barrel `index.ts` files. Nothing in `entrypoints/shared/enam.ts`.

Components [components.md, panel.md]

- Function components, named export, `interface XProps` above the component.
- Every tool renders its title with `PortalModalHeader` + `FeatureTitle` + `FeatureIcon` +
  `FeatureTitleText`, with an id from `HeaderPortalId`.
- Footer actions go in `ScenarioPortalFooterButtons` (default container).
- Use `IconButton` (with `label`), `EmptyState`, `LoadingState`, `Tooltip`, `clickableProps`.
  Never write your own.
- Every clickable element is a `button`, an antd control, or uses `clickableProps`.
- Start with local state and explicit props. Use tool context when several descendants need the same
  state and intermediate components only relay it; Redux for shared domain state. Never add either just
  because props pass through a fixed number of levels.
- Extract logic into a helper only when it has real branches, needs its own tests or is reused.

Styling [styling.md]

- antd for controls, Tailwind for layout and text, styled-components with `tokens` for anything with
  states or reuse.
- Colours only from `entrypoints/shared/styles/tokens.ts` (or the equal Tailwind class, see the token
  table in `styling.md`).
  Text never lighter than `gray-500`.
- `px`, never `rem`, in styled-components and inline styles.
- No `dark:` classes. No `primary-*` Tailwind colours.
- No focus outlines or `focus:ring-*` of your own. The global rule shows a ring only while the user uses
  the keyboard (`data-hi-keyboard`).
- Selected = `bg-blue-50 border-blue-300` (or `tokens.color.primaryBg`). Never a ring.
- Sentence-case labels. Only tool names are Title Case.
- Works at 320px panel width.
- antd overlays stay inside the shadow root (global `ConfigProvider`; `shadowBody` when you must pass
  `getPopupContainer`). Give popconfirms `overlayStyle={{ maxWidth: 280 }}`.

State and storage [state.md, storage.md]

- `useState` for one component. Redux slice for app-wide or cross-component state.
- New slice: `content/store/<domain>/<domain>.slice.ts`, typed state, exported selectors, registered in
  `rootReducer.ts`.
- Side effects: `sagaEnhancer(function* uniqueName(...) {...})`, registered with `takeLatest`, dispatched
  with `.getPayload(payload)`.
- Small preferences: `browser.storage.local` with a key constant. Load before enabling saves, validate
  saved fields and merge them over defaults, handle a failed load. Never `window.localStorage`.
- App settings and domain data: through `ExtensionStorageManager` / background slices.

Page safety [host-page.md, messaging.md]

- Undo every page change in a cleanup. Inject page CSS only as one removable `<style id="hover-inspector-...">`.
- Do not block page events unless the user turned on "Prevent default".
- Handle Esc yourself (preventDefault + stopPropagation) when your UI uses it, or it turns the
  extension off.
- Validate every message: `unknown` input, type guards, `sender.id === browser.runtime.id`.

TypeScript and text [typescript.md]

- No `any`, no `@ts-ignore`, no `@ts-nocheck`.
- Imports: `@entrypoints/...` across folders, `./...` inside a tool. No `@/entrypoints`.
  No file extension in new imports.
- Double quotes, semicolons, 120 columns.
- English comments that say why. No commented-out code, no `console.log`, no `debugger`, no `alert`.
- Errors: `console.error("Failed to …", error)` for developers, `toast.error("…")` for users,
  `.catch(() => undefined)` only for best-effort writes whose silent loss is acceptable.

Do not copy legacy code [legacy.md]: hard-coded hex colours, `state: any`, `dark:`,
`focus:ring-*`, Title Case labels, absolute-`div` dropdowns, `alert()`, files under
`git-diff-view/`, `ReactRnd/` and `Note Taking Tools/`.

## Before you commit [workflow.md]

Run in the repo root:

```bash
yarn verify    # fix every FAIL your change caused and rerun; report a FAIL it did not cause
git status                                                      # no package-lock.json, no dist/, no scratch files
```

Then check the UI with the `verify-in-browser` skill at 320px and 440px.

Commit message [workflow.md]: plain-English imperative subject, often `Area: what changes for the user`, no
`feat:` prefix; a body that explains why; the attribution lines your session requires.
