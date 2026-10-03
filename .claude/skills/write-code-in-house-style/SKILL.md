---
name: write-code-in-house-style
description: Condensed checklist for writing or changing any code in the Hover Inspector repo the way the owner writes it - structure, components, styling, state, storage, tests, commits. Use before writing code in this repo and again before committing.
---

# Write code in the house style

The full guide is `docs/CODE_STYLE.md`. This page is the short version. When in doubt, open the
section named in brackets.

## Before you write

1. Find the closest existing example and copy its shape. Newest, best examples:
   - small tool: `entrypoints/content/modules/PopupContainer/UnitConverter.tsx`
   - list with selection and a ⋮ menu: `entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/SnapshotManager.tsx`
   - Tailwind rows and tiles: `entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition/tokenUi/TokenTabLayout.tsx`
   - shared state through storage: `entrypoints/shared/hoverCard/store.ts`
   - message validation: `entrypoints/shared/frameAgent/protocol.ts`
2. Decide where the file goes [§3]:
   - one tool only → `entrypoints/content/modules/PopupContainer/<ToolName>/...`
   - used by two or more tools → `entrypoints/shared/components/` or `entrypoints/shared/utils/`
   - needs `chrome.tabs`/`chrome.scripting` → `entrypoints/background/`
3. **Never** add a file directly in `entrypoints/` or an `index.ts` in a new first-level folder (WXT
   builds them as entrypoints).
4. **Never** use npm. Yarn only: `yarn install`, `yarn build`, `yarn test`.

## While you write

Files and names [§4]

- `.tsx` only with JSX. Components `PascalCase.tsx`, hooks `useX.ts`, utils `camelCase.ts`,
  styles `X.styled.ts`, types `types.ts`, tests `__tests__/x.test.ts`.
- Types shared by several files go in `types.ts`. Use string `enum`s instead of repeated string
  `switch` cases.
- No new barrel `index.ts` files. Nothing in `entrypoints/shared/enam.ts`.

Components [§5, §6, §7]

- Function components, named export, `interface XProps` above the component.
- Every tool renders its title with `PortalModalHeader` + `FeatureTitle` + `FeatureIcon` +
  `FeatureTitleText`, with an id from `HeaderPortalId`.
- Footer actions go in `ScenarioPortalFooterButtons` (default container).
- Use `IconButton` (with `label`), `EmptyState`, `LoadingState`, `Tooltip`, `clickableProps`.
  Never write your own.
- Every clickable element is a `button`, an antd control, or uses `clickableProps`.
- No prop drilling deeper than two levels: use a context or Redux.

Styling [§8]

- antd for controls, Tailwind for layout and text, styled-components with `tokens` for anything with
  states or reuse.
- Colours only from `entrypoints/shared/styles/tokens.ts` (or the equal Tailwind gray/blue class).
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

State and storage [§9, §10]

- `useState` for one component. Redux slice for app-wide or cross-component state.
- New slice: `content/store/<domain>/<domain>.slice.ts`, typed state, exported selectors, registered in
  `rootReducer.ts`.
- Side effects: `sagaEnhancer(function* uniqueName(...) {...})`, registered with `takeLatest`, dispatched
  with `.getPayload(payload)`.
- Small preferences: `browser.storage.local` with the load-once/save-on-change pattern and a
  `..._STORAGE_KEY` constant. Never `window.localStorage`.
- App settings and domain data: through `ExtensionStorageManager` / background slices.

Page safety [§12]

- Undo every page change in a cleanup. Inject page CSS only as one removable `<style id="hover-inspector-...">`.
- Do not block page events unless the user turned on "Prevent default".
- Handle Esc yourself (preventDefault + stopPropagation) when your UI uses it, or it turns the
  extension off.
- Validate every message: `unknown` input, type guards, `sender.id === browser.runtime.id`.

TypeScript and text [§13]

- No `any`, no `@ts-ignore`, no `@ts-nocheck`.
- Imports: `@entrypoints/...` across folders, `./...` inside a tool. No `@/entrypoints`.
  No file extension in new imports.
- Double quotes, semicolons, 120 columns.
- English comments that say why. No commented-out code, no `console.log`, no `debugger`, no `alert`.
- Errors: `console.error("Failed to …", error)` for developers, `toast.error("…")` for users,
  `.catch(() => undefined)` for best-effort writes.

Do not copy legacy code [§14]: hard-coded hex colours, `state: any`, Ukrainian comments, `dark:`,
`focus:ring-*`, Title Case labels, absolute-`div` dropdowns, `alert()`, files under
`git-diff-view/`, `ReactRnd/` and `Note Taking Tools/`.

## Before you commit [§18]

Run in the repo root:

```bash
yarn verify    # must end with "RESULT: all automatic checks passed"; fix every FAIL and rerun
git status                                                      # no package-lock.json, no dist/, no scratch files
```

Then check the UI with the `verify-in-browser` skill at 320px and 440px.

Commit message [§17]: plain-English imperative subject, often `Area: what changes for the user`, no
`feat:` prefix; a body that explains why; the attribution lines your session requires.
