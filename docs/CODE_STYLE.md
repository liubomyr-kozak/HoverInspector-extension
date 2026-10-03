# Hover Inspector: code style and architecture guide

This guide tells you exactly how to write code in this repository. Follow it word for word.

How to read it:

- **Always** and **Never** are hard rules. Do not break them.
- Every rule points to real code as `path:line`. Open that file when you are unsure.
- When old code does something different from this guide, follow this guide. Section 14 lists the old
  patterns you must not copy.
- The newest code (commits from October 2026, the "cycle 3–5" work in `git log`) is the model. When two
  files disagree, copy the newer one.

Contents:

1. Project in one page
2. Commands
3. Folder map
4. File naming
5. Writing a component
6. The tool panel: header, body, footer
7. Shared components and helpers
8. Styling
9. State: Redux, sagas, local state
10. Storage
11. Background and messaging
12. Working with the host page
13. TypeScript, imports, comments, errors, logging
14. Legacy code: do not copy
15. Tests
16. Browser check with Playwright
17. Git: branches, commits, pull requests
18. Checklist before you commit

---

## 1. Project in one page

Hover Inspector is a browser extension (Chrome MV3, also Firefox/Edge/Safari builds) for designers and
QA. It draws measurements between page elements and offers a set of tools in one floating panel:
Element Inspector, Page Ruler, Color Picker, Unit Converter, Color Palette & Typography, Automation
Scenarios, CSS Snapshot Inspector. Page Notes and Note Taking Tools still have code here but are no
longer in the launcher.

How it runs:

1. The user clicks the extension button. The background service worker
   (`entrypoints/background/index.ts:24`) injects the content script into the tab.
2. The content script (`entrypoints/content/index.tsx`) creates a shadow-root UI named
   `hover-inspector` (`entrypoints/content/index.tsx:79-85`) and renders React into it.
3. Inside the shadow root: the launcher toolbar at the bottom, and one floating panel
   (`entrypoints/content/modules/PopupContainer/PopupContainer.tsx`) that shows the open tools.
4. Data that must survive reloads is saved in `browser.storage.local`, mostly through the background.
5. Cross-origin iframes get a small "frame agent" script (`entrypoints/frame-agent.ts`).

Stack:

| Part | Library |
| --- | --- |
| Extension framework | WXT 0.20, Manifest V3 (`wxt.config.ts`) |
| UI | React 19, function components and hooks |
| Language | TypeScript (`strict: true`, `noImplicitAny: false`, `tsconfig.json`) |
| App state | Redux Toolkit slices + redux-saga (`entrypoints/content/store/`) |
| Controls | antd 5 inside `StyleProvider` + `ConfigProvider` (`entrypoints/content/app.tsx:73-77`) |
| Styling | Tailwind 3, styled-components 6, antd theme from shared tokens |
| Icons | `@tabler/icons-react` (preferred), some `react-icons` |
| Messaging | `@webext-core/messaging` and plain `chrome.runtime.sendMessage` (section 11) |
| Tests | vitest 3 + jsdom (`vitest.config.ts`) |
| Package manager | Yarn 1 only (`package.json` `"packageManager": "yarn@1.22.22"`) |

---

## 2. Commands

**Always** use Yarn. **Never** run `npm install`, `npm run …` or `npx` inside the repo. **Never** create
or commit `package-lock.json` or `pnpm-lock.yaml`. `yarn.lock` is the only lockfile.

| Command | What it does |
| --- | --- |
| `yarn install` | Install dependencies. Also runs `wxt prepare`. |
| `yarn build` | Production build into `dist/chrome-mv3/`. Must pass before every commit. |
| `yarn test` | Run all vitest tests once. Must pass before every commit. |
| `yarn dev` | WXT dev mode (opens a browser with the extension). |
| `yarn start` | Standalone Vite page at http://localhost:4400 (`vite.standalone.config.ts`). |
| `yarn test:watch` | vitest in watch mode. |
| `yarn compile` | `tsc --noEmit`. The repo already has about 227 old errors. Use it only to check your own files (section 18). |

---

## 3. Folder map

```
entrypoints/
  background/            Service worker. WXT entry: background/index.ts
    index.ts             Toolbar click, tab events, ports
    automationTabs.ts    Automation playback across tabs
    frameAgentRelay.ts   Relays frame-agent messages between frames
    services/            Pure data logic used by the background (notes.ts, noteScope.ts) + their tests
    store/               "Chrome slices": functions that run in the background (section 11)
      actions/           Plain objects of async functions, one file per domain
      slices/            chromeActionsSlice(actions) wrappers
      notesActionsSlice.ts  createChromeSlice({...}) for notes
  content/               Content script. WXT entry: content/index.tsx
    index.tsx            Creates the shadow-root UI, global Esc, keyboard-focus flag
    app.tsx              Providers: styled-components, antd StyleProvider/ConfigProvider, toasts
    style.css            Tailwind + global CSS of the shadow root (focus rules, overlay boxes)
    modules/             All UI
      PopupContainer/    The panel and every tool that lives in it
        PopupContainer.tsx         COMPONENT_MAP: tool id -> component
        PopupContainer.styled.ts   FeatureTitle, FeatureTitleText, header/footer containers
        <ToolName>.tsx             Small tools: one file (UnitConverter.tsx, ColorPicker.tsx)
        <ToolName>/                Big tools: a folder (CSSSnapshotInspector/, PageNotes/, AutomationScenarios/)
      Launcher/          Toolbar + LauncherIcons.ts (the list of tools)
      SettingsIconBox/   Inspector and palette internals (HoverSelectedInfo, ColorPaletteDefinition/)
      ...                Overlays drawn on the page (HoveredBox, SelectedBox, ElementInspector)
    store/               Content Redux store: one folder per slice
  core/                  Infrastructure with no UI: storage services, chrome-slice libs, constants, models
    constants/           Storage keys (automation.ts, cssSnapshot.ts, notes.ts, index.ts)
    libs/                sagaEnhancer, chromeActionsSlice, createChromeSlice, requestProcessing
    services/storage/    ExtensionStorageManager, AppStorageService, LocalStorage
    initialData/app.ts   Default app settings + migrateAppSettings
  features/              Extension plumbing shared by background and content
    extension/messaging.ts      @webext-core/messaging protocol (activate/deactivate/check)
    extension/Ext/              Tab sessions, icons, ports (used by the background)
    serviceRedux/               Redux middleware
  shared/                Code used by more than one tool or by both content and agent
    components/          IconButton, EmptyState, LoadingState, Tooltip, FeatureIcon, FloatingModal...
    styles/tokens.ts     Design tokens + antd theme
    utils/               Pure helpers and small hooks (a11y.ts, frames.ts, designAudit.ts...) + __tests__/
    hoverCard/           Hover card catalog, store and element info
    frameAgent/          Frame agent protocol, hub, agent
    types/               Shared types (notes.ts)
    constant/zIndex.ts   z-index constants
  frame-agent.ts         WXT unlisted script, injected into cross-origin frames
  locales/en/messages.json
src/                     Standalone dev page entry (yarn start)
.standalone/             Polyfills and types for the standalone page
```

What goes where (decide in this order):

1. Code used by one tool only → inside that tool: `entrypoints/content/modules/PopupContainer/<ToolName>/`.
2. UI used by two or more tools → `entrypoints/shared/components/<Name>.tsx`.
3. A pure function used by two or more tools → `entrypoints/shared/utils/<name>.ts`.
4. A hook used by two or more tools → `entrypoints/shared/utils/use<Name>.ts`
   (example: `entrypoints/shared/utils/usePopoverFocus.ts`). A hook used by one tool →
   `<ToolName>/hooks/use<Name>.ts` (example: `CSSSnapshotInspector/hooks/useSnapshots.ts`).
5. Types used by one tool → `<ToolName>/types.ts`. Types used by many → `entrypoints/shared/types/<domain>.ts`.
6. Storage keys used by the background → `entrypoints/core/constants/<domain>.ts`.
7. Code that must run in the background → `entrypoints/background/` (section 11).

`core/` vs `shared/` vs `features/`:

- `core/` = infrastructure without React: storage, slice libraries, constants, models.
- `shared/` = reusable building blocks for the UI and for the frame agent: components, tokens, pure utils.
- `features/` = extension plumbing: messaging protocol, tab sessions. Do not put tool code here.

WXT rules (WXT treats some paths as build entrypoints):

- **Never** add a new file directly in `entrypoints/` (like `entrypoints/foo.ts`). WXT builds it as a new
  entrypoint. `entrypoints/frame-agent.ts` is one on purpose.
- **Never** add `index.ts`/`index.tsx` directly inside a new first-level folder (`entrypoints/foo/index.ts`).
  WXT builds that as an entrypoint too.

Tool folder template (big tool):

```
entrypoints/content/modules/PopupContainer/<ToolName>/
  <ToolName>.tsx          The root component, exported by name; renders header portal + body
  <ToolName>.styled.ts    Optional: styled-components used by several files of the tool
  types.ts                Interfaces, type aliases and enums of the tool
  constants.ts            Optional: constants of the tool
  components/             Child components, one per file: <Name>.tsx
  hooks/                  use<Name>.ts
  utils/                  Pure functions: <name>.ts
    __tests__/            <name>.test.ts for every util
```

Real example: `entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/` (components/, hooks/,
utils/, utils/__tests__/, types.ts, constants.ts).

---

## 4. File naming

| Kind | Name | Example |
| --- | --- | --- |
| React component | `PascalCase.tsx`, one main component per file, same name as the file | `shared/components/EmptyState.tsx` |
| Hook | `useCamelCase.ts` | `shared/utils/usePopoverFocus.ts` |
| Pure util | `camelCase.ts` | `CSSSnapshotInspector/utils/snapshotLabels.ts` |
| styled-components of a component | `<Component>.styled.ts` | `PopupContainer/PopupContainer.styled.ts` |
| Types and enums of a tool | `types.ts` | `AutomationScenarios/types.ts` |
| Constants of a tool | `constants.ts` | `CSSSnapshotInspector/constants.ts` |
| Redux slice (content) | `store/<domain>/<domain>.slice.ts` | `content/store/notes/notes.slice.ts` |
| Saga actions | `store/<domain>/<domain>.saga.action.ts` | `content/store/automation/automation.saga.action.ts` |
| Saga watchers | `store/<domain>/<domain>.saga.ts` | `content/store/automation/automation.saga.ts` |
| Test | `__tests__/<file>.test.ts` next to the code | `shared/utils/__tests__/frames.test.ts` |

Rules:

1. Use `.tsx` only when the file contains JSX. Everything else is `.ts`.
2. Put interfaces, types and enums in separate files (`types.ts`), not in the component file, when they
   are used by more than one file. A props interface used only by its component stays in that file.
3. When a tool has many types, group them in a folder (`types/` with one file per domain).
4. When you write a `switch` over string values, check whether an `enum` fits. Example enums:
   `HeaderPortalId` (`ScenarioPortalHeaderButtons.tsx:6`), `StepType` (`AutomationScenarios/types.ts:167`),
   `AttachmentTypeEnum` (`shared/types/notes.ts:19`). Enum members are `UPPER_SNAKE`, values are strings.
5. **Never** add new barrel `index.ts` files. Import the file itself.
6. `entrypoints/shared/enam.ts` is an empty legacy file (misspelt "enum"). **Never** add code to it.
   Put enums in `types.ts`.
7. New tests go in `__tests__/` next to the code. (The older `background/services/*.test.ts` files sit
   beside their source; do not copy that.)

---

## 5. Writing a component

Rules:

1. **Always** write function components. **Never** write class components.
2. Export components by name: `export const UnitConverter: React.FC = () => {...}`
   (`PopupContainer/UnitConverter.tsx:37`). A `default` export is allowed in addition, not instead.
3. Type props with an `interface <Name>Props` above the component. Document non-obvious props with a
   one-line `/** ... */` comment.
4. Destructure props in the parameter list and give defaults there.
5. Use `React.FC<Props>` or a plain function with typed props. Both exist; prefer `React.FC<Props>`.
6. Keep event handlers inside the component as `const handleX = () => {...}` or inline arrows.
7. Do not drill props through more than two levels. Use a React context (example:
   `SettingsIconBox/components/ColorPaletteDefinition/PaletteContext.tsx`) or Redux instead.
8. Extract any logic that does not need React (parsing, formatting, matching) into `utils/<name>.ts` and
   test it.

Real example of props (`shared/components/EmptyState.tsx:44-54`):

```tsx
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** A button or link that resolves the empty state */
  action?: React.ReactNode;
  className?: string;
}

/** The one empty state every tool uses: muted icon, short title, one line of help, optional action */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => (
```

Real example of `readonly` props in new code (`CSSSnapshotInspector/SnapshotManager.tsx:285-300`):

```tsx
interface SnapshotManagerProps {
  readonly snapshots: readonly CSSSnapshot[];
  readonly onView: (snapshot: CSSSnapshot) => void;
  readonly onRename: (id: string, name: string) => Promise<boolean>;
  /** True when the list is filtered by search (changes the empty state text) */
  readonly isFiltered?: boolean;
```

Accessibility rules for components (WCAG 2.1 AA):

1. Every clickable thing is a `<button type="button">`, an antd control, or uses `clickableProps`
   (section 7.4). **Never** put `onClick` on a bare `<div>` or `<span>`.
2. Every icon-only button has an accessible name. Use `IconButton` with `label` (section 7.1).
3. Every form field has a label or `aria-label` (`UnitConverter.tsx:233-238`: `aria-label="Value"`).
4. Toggle buttons set `aria-pressed`. Menu triggers set `aria-haspopup` and `aria-expanded`
   (`SnapshotManager.tsx:270`).
5. Text contrast is at least 4.5:1 on its background. Use the token colours (section 8.1); they are
   chosen to pass.
6. Decorative icons get `aria-hidden`.

---

## 6. The tool panel: header, body, footer

Every tool renders inside one shared panel (`PopupContainer.tsx`). The panel has three parts:

```
+---------------------------------------------------+
| header: #popup-header-container                   |  <- your tool portals its title + buttons here
+---------------------------------------------------+
| body: your component's normal JSX                 |
+---------------------------------------------------+
| footer: #hover-inspector-popup-footer-container   |  <- optional: your tool portals buttons here
+---------------------------------------------------+
```

The containers are created in `PopupContainer.tsx:71` (header) and `PopupContainer.tsx:108` (footer).

### 6.1 Header (required for every tool)

Steps:

1. Add your portal id to the `HeaderPortalId` enum in
   `entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons.tsx:6-20`.
   Format: `MY_TOOL = "my-tool-header"`.
2. At the top of your tool's JSX, render `PortalModalHeader` with that id.
3. Inside it, render `FeatureTitle` > `FeatureIcon` + `FeatureTitleText` (+ optional `PortalModalHeaderButtons`).
4. Pass the tool's `title` from `LauncherIcons.ts` both as text and as the `title` attribute.

Real example (`PopupContainer/ElementInspectorPopup.tsx:132-168`, shortened):

```tsx
<PortalModalHeader portalId={HeaderPortalId.ELEMENT_INSPECTOR}>
  <FeatureTitle>
    <FeatureIcon icon={INSPECTOR.icon} isBetta />
    <FeatureTitleText title={INSPECTOR.title}>{INSPECTOR.title}</FeatureTitleText>

    <PortalModalHeaderButtons>
      <IconButton
        label={editingCard ? "Close hover card editor" : "Customize hover card"}
        active={editingCard}
        onClick={() => setEditingCard((v) => !v)}
      >
        <IconLayoutList size={18} />
      </IconButton>
    </PortalModalHeaderButtons>
  </FeatureTitle>
</PortalModalHeader>
```

Imports for the header:

```tsx
import {
  HeaderPortalId,
  PortalModalHeader,
  PortalModalHeaderButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon";
import { IconButton } from "@entrypoints/shared/components/IconButton";
```

Rules:

- **Always** use `FeatureTitleText`. It truncates long names with an ellipsis
  (`PopupContainer.styled.ts:58-66`). **Never** put the title text straight into `FeatureTitle`.
- Header buttons go inside `PortalModalHeaderButtons` (it carries the `hi-header-buttons` class that the
  narrow-header container query uses, `PopupContainer.styled.ts:92-97`).
- Header buttons are `IconButton` with the default size 28. Icons inside are `size={18}`.
- Use `PortalModalHeader`. `ScenarioPortalHeaderButtons` is the same component under an old alias
  (`ScenarioPortalHeaderButtons.tsx:92`); do not use the alias in new code.
- `isBetta` on `FeatureIcon` shows a "Beta" badge. Use it only for tools the owner calls beta.

Do this / not this:

```tsx
// Do: id from the enum
<PortalModalHeader portalId={HeaderPortalId.UNIT_CONVERTER}>

// Not this: a string literal (NoteTakingToolsIntegration.tsx:15 does this; it is legacy)
const HEADER_PORTAL_ID = "note-taking-tools-header";
<PortalModalHeader portalId={HEADER_PORTAL_ID}>
```

### 6.2 Footer (optional)

Use the footer for the main actions of a tool view (Save, Compare, Clear). The footer row hides itself
when it is empty (`PopupContainer.styled.ts:107-115`).

Steps:

1. Import `ScenarioPortalFooterButtons` from
   `@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalFooterButtons`.
2. Render it anywhere in your tool's JSX with a unique `portalId`. Reuse your `HeaderPortalId` value
   (the CSS Snapshot tool does this: `SnapshotManagerHeader.tsx:412`).
3. Do not pass `containerId`. The default is `hover-inspector-popup-footer-container`
   (`ScenarioPortalFooterButtons.tsx:17`).
4. Render it only while the actions apply (wrap it in a condition).

Real example (`CSSSnapshotInspector/components/SnapshotManagerHeader.tsx:410-441`, shortened):

```tsx
{compareSnapshots && compareSnapshots.length > 0 && (
  <ScenarioPortalFooterButtons portalId={HeaderPortalId.CSS_SNAPSHOT}>
    <AutomationFooterContainer>
      <div className="flex items-center gap-2 w-full min-w-0">
        <span className="flex-1 min-w-0 truncate text-xs text-gray-600" aria-live="polite">
          {compareSnapshots.length === 2 ? "2 selected" : "1 selected · tick 1 more"}
        </span>
        <Button size="middle" onClick={onClearCompare}>Clear</Button>
      </div>
    </AutomationFooterContainer>
  </ScenarioPortalFooterButtons>
)}
```

### 6.3 Panel size

- The panel's minimum size is **320 × 260 px** (`PopupContainer.tsx:40-42`). The default is 440 × 560
  (`core/initialData/app.ts:8-13`).
- **Always** make your tool work at 320px wide: no horizontal scroll, no clipped buttons, no overlapping
  text. Check it at 320px and 440px (section 16).
- Use `min-w-0` on flex children that contain text, and `truncate` (Tailwind) or
  `text-overflow: ellipsis` for single-line labels.
- Let rows wrap (`flex-wrap`) instead of overflowing.

---

## 7. Shared components and helpers

Use these. **Never** write your own version of them.

### 7.1 `IconButton` (`entrypoints/shared/components/IconButton.tsx`)

Square icon-only button with a name, hover, focus ring and optional pressed state.

```tsx
export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Accessible name; also used as the tooltip unless `title` is given */
  label: string;
  variant?: Variant;      // "ghost" (default) | "primary" | "danger"
  /** Toggle buttons: highlighted and announced as pressed */
  active?: boolean;
  /** Square size in px (default 28, fits the panel header) */
  size?: number;
}
```

(`IconButton.tsx:71-79`)

Usage (`UnitConverter.tsx:318-320`):

```tsx
<IconButton label="Clear conversion history" onClick={clearHistory} size={24}>
  <IconTrash />
</IconButton>
```

Rules: `label` is required and is a sentence-case action ("Clear conversion history"). Sizes in use:
28 (header, default), 26 (cards), 24 (compact rows). Pass `active` only for toggles.

### 7.2 `EmptyState` (`entrypoints/shared/components/EmptyState.tsx`)

Use it whenever a list or view has nothing to show.

```tsx
<EmptyState
  icon={<IconCamera />}
  title="No snapshots yet"
  description="Capture the page or pick an element to start."
  action={<Button type="primary" onClick={onCapture}>Snapshot page</Button>}
/>
```

### 7.3 `LoadingState` (`entrypoints/shared/components/LoadingState.tsx`)

Use it while data loads. It is announced to screen readers (`role="status"`).

```tsx
<LoadingState label="Loading notes…" />
<LoadingState label="Scanning" progress={{ done, total }} progressUnit="elements" />
<LoadingState label="Loading" inline />   // compact, inside a section
```

### 7.4 `clickableProps` (`entrypoints/shared/utils/a11y.ts:8`)

Makes a non-button element (a row, a chip, a code line) work like a button with keyboard (focusable,
Enter and Space). Prefer a real `<button>`. Use `clickableProps` only when a button breaks the layout.

```tsx
import { clickableProps } from "@entrypoints/shared/utils/a11y";

<div className="..." {...clickableProps(() => copyLine(line.value.trim(), i), "Copy line")}>
```

(real use: `SettingsIconBox/components/PopupStyleInspector.tsx:433`)

### 7.5 Other shared pieces

| Need | Use |
| --- | --- |
| Tooltip | `Tooltip` from `@entrypoints/shared/components/Tooltip` (antd tooltip already set up for the shadow root) |
| Copy button | `CopyButton` from `@entrypoints/shared/components/CopyButton` |
| Keyboard support for an antd `Popover` | `usePopoverFocus(open, setOpen)` from `@entrypoints/shared/utils/usePopoverFocus` (example `ElementInspectorPopup.tsx:73-84,145-165`) |
| Debounce a callback | `useDebouncedCallback` from `@entrypoints/shared/utils/useDebouncedCallback` |
| Toast message | `toast.success(...)` / `toast.error(...)` from `react-toastify` (`ColorPicker.tsx:139-146`) |
| Highlight a page element | `useHighlightOverlay()` from `@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext` |
| Element → CSS selector | `entrypoints/shared/utils/toSelector.ts` |
| Frames helpers | `entrypoints/shared/utils/frames.ts` |
| z-index values | `entrypoints/shared/constant/zIndex.ts` |

---

## 8. Styling

### 8.1 Design tokens

All colours, radii, control heights and font sizes come from `entrypoints/shared/styles/tokens.ts:8-44`.

```ts
export const tokens = {
  color: {
    primary: "#2563eb",          // Tailwind blue-600
    primaryHover: "#1d4ed8",     // blue-700
    primaryBg: "#eff6ff",        // blue-50: selected background
    primaryBorder: "#bfdbfe",    // blue-200
    text: "#1f2937",             // gray-800
    textSecondary: "#4b5563",    // gray-600
    textMuted: "#6b7280",        // gray-500 (lowest allowed text colour on white)
    border: "#e5e7eb",           // gray-200
    borderStrong: "#d1d5db",     // gray-300
    surface: "#ffffff",
    surfaceMuted: "#f9fafb",     // gray-50
    danger: "#dc2626", dangerHover: "#b91c1c", dangerBg: "#fef2f2",
    success: "#15803d", successBg: "#f0fdf4",
    warning: "#b45309", warningBg: "#fffbeb",
    focusRing: "#2563eb",
  },
  radius: { sm: 4, md: 6, lg: 8 },
  control: { sm: 24, md: 32 },
  font: { size: { xs: 12, sm: 13, md: 14, lg: 16 } /* + family, mono */ },
} as const;
```

The same tokens feed:

- the antd theme `antdTheme` (`tokens.ts:56-92`), applied in `content/app.tsx:75`;
- CSS variables `--hi-color-*` on the shadow host (`content/style.css:28-41`), for plain CSS files only.

Rules:

1. In styled-components, **always** write `${tokens.color.x}` / `${tokens.radius.md}px`. **Never** write a
   hex colour that has a token.
2. In Tailwind classes, use the palette class that equals the token: `text-gray-800` (text),
   `text-gray-600` (secondary), `text-gray-500` (muted), `border-gray-200` (border), `bg-gray-50`
   (muted surface), `text-blue-600`/`bg-blue-600` (primary), `bg-blue-50 border-blue-300` (selected).
3. **Never** use text lighter than gray-500 (`#6b7280`) on white. `text-gray-400` fails AA.
4. **Never** use the Tailwind `primary-*` colours from `tailwind.config.cjs` (an old orange scale).
5. **Never** use `dark:` Tailwind classes. The UI is light only (`content/style.css:23-26`).

### 8.2 Tailwind vs styled-components vs antd

Pick in this order:

1. **antd** for every standard control: `Button`, `Input`, `InputNumber`, `Select`, `Switch`, `Checkbox`,
   `Radio`, `Tabs`, `Popover`, `Popconfirm`, `Tooltip` (via the shared wrapper), `Spin`. Use antd size
   props (`size="small"`) instead of restyling.
2. **Tailwind classes** for layout and simple text in JSX: `flex`, `items-center`, `gap-2`, `mb-3`,
   `min-w-0`, `truncate`, `text-sm`, `font-semibold`, `text-gray-500`. Example: `UnitConverter.tsx:313-353`,
   `TokenTabLayout.tsx:94-103`.
3. **styled-components** when you need tokens, states driven by props, child selectors, pseudo-classes
   or a piece reused in several places. Transient props start with `$` (`$selected`, `$active`).
   Example: `CSSSnapshotInspector/SnapshotManager.tsx:82-105`.

Rules:

- Inline `style={{...}}` only for one-off numbers that Tailwind cannot express well (antd `Col` widths,
  computed sizes). Not for colours.
- **Never** use `rem` in styled-components or inline styles. Write `px`. Tailwind's rem values are
  converted to px at build time (`postcss.config.cjs:1-16`) because the page's root font size is not ours.
  styled-components output is not converted.
- **Never** import a global `.css` file from a component. The shadow root receives
  `content/style.css` only.

### 8.3 Shadow root rules

The whole UI lives in the open shadow root of the `<hover-inspector>` element. Page CSS does not reach
it, and our CSS must not reach the page.

1. antd overlays (Select, Popover, Popconfirm, Dropdown, Tooltip, Tabs overflow menu) **must** render
   inside the shadow root. `ConfigProvider getPopupContainer` does this by default
   (`content/app.tsx:65-70`):

   ```tsx
   // antd overlays (selects, popovers, dropdowns) default to document.body, where the page's CSS
   // applies and the shadow root's antd styles don't; keep them inside the UI
   const getPopupContainer = React.useCallback(
     () => (shadowRoot?.querySelector("body") as HTMLElement) || (shadowRoot as unknown as HTMLElement),
     [shadowRoot],
   );
   ```

2. When you pass `getPopupContainer` yourself (needed when the overlay must sit inside a scrolling or
   clipped area), use `shadowBody` from `entrypoints/shared/utils/shadowBody.ts`. It is typed for antd,
   so you never need `// @ts-ignore`:

   ```tsx
   import { shadowBody } from "@entrypoints/shared/utils/shadowBody";
   <Popconfirm getPopupContainer={shadowBody} overlayStyle={{ maxWidth: 280 }} ... />
   <Select value={unit} onChange={setUnit} options={options} getPopupContainer={shadowBody} />
   ```

   Some old files define their own `getPopupContainer` with `// @ts-ignore` (for example
   `UnitConverter.tsx`). Never copy that, even in the same file: import `shadowBody` instead.

3. **Never** let an overlay render into the page's `document.body`. Past bugs from this:
   - The Analyze Page tabs "more" menu opened in the page body, unstyled and off screen
     (commit `1f5644d`, fix at `AnalyzePageUI.tsx:60-63`).
   - Every overlay without an explicit container went to the page body until the global default was
     added (commit `f6e962d`).
4. Keep confirmations and menus inside the panel width. Give a `Popconfirm`/`Popover` a `maxWidth`
   (commit `f2efe98`, `ScenarioMenu.tsx:65`) and use `placement="bottomRight"` for triggers at the right edge.
5. Wrap an `IconButton` that is an antd `Popover`/`Popconfirm` trigger in `<span className="inline-flex">`
   so antd can attach its handlers and position the overlay (`SnapshotManager.tsx:269-273`).
6. For a ⋮ row menu, copy `RowMenu` in `SnapshotManager.tsx:229-276` (antd `Popover`, `role="menu"`,
   `MenuItem` buttons with `role="menuitem"`). **Never** build a menu as an absolutely positioned `div`
   (old `DropdownMenu` in `SnapshotManagerHeader.tsx:160` is legacy).
7. To find the shadow root from code: `document.querySelector("hover-inspector")?.shadowRoot`.

### 8.4 Focus: outlines only for keyboard users

The content script sets `data-hi-keyboard` on the host while the user presses Tab or arrow keys and
removes it on pointer down (`content/index.tsx:123-132`):

```tsx
const onKeyboardNav = (event: KeyboardEvent) => {
  if (event.key === "Tab" || event.key.startsWith("Arrow")) host.setAttribute("data-hi-keyboard", "");
};
const onPointerNav = () => host.removeAttribute("data-hi-keyboard");
```

`content/style.css:43-58` then draws one focus ring for keyboard users and none for mouse users:

```css
:host(:not([data-hi-keyboard])) *:focus,
:host(:not([data-hi-keyboard])) *:focus-visible {
  outline: none !important;
}

:host([data-hi-keyboard]) :where(button, a[href], summary, select, [role="button"], [role="tab"], [role="menuitem"],
    [role="option"], [role="switch"], [role="checkbox"], [tabindex]:not([tabindex="-1"])):focus-visible {
  outline: 2px solid var(--hi-color-primary);
  outline-offset: 2px;
}
```

Rules:

1. **Never** add your own `:focus` / `:focus-visible` outline or `focus:ring-*` classes to buttons. The
   global rule covers `button`, `[role=button]`, `[tabindex]` and the other roles listed.
2. **Never** draw a focus outline for mouse users.
3. If a third-party widget removes outlines inline, scope your fix under `:host([data-hi-keyboard])`
   (example `ColorPicker.tsx:36-41`).
4. antd focus rings come from the theme (`tokens.ts:46-53`). Do not override them.

### 8.5 Selection: tint, not rings

Show "selected" with a background tint and border colour, never with an outline or ring.

Do this (`SettingsIconBox/components/ColorPaletteDefinition/tokenUi/TokenTabLayout.tsx:100-102`):

```tsx
className={`w-full flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
  selected ? "border-blue-300 bg-blue-50" : "border-transparent hover:border-gray-200 hover:bg-gray-50"
}`}
```

Or with styled-components (`CSSSnapshotInspector/SnapshotManager.tsx:90`):

```tsx
background: ${(p) => (p.$confirming ? tokens.color.dangerBg : p.$selected ? tokens.color.primaryBg : tokens.color.surface)};
```

Not this (legacy, `PageNotes/components/NoteForm.tsx:547`):

```tsx
? "border-indigo-500 shadow-lg ring-2 ring-indigo-200"
```

Also set `aria-pressed={selected}` (toggle) or `aria-selected` (in a listbox/tablist).

### 8.6 Text and labels

1. **Sentence case** for every label, button, heading, tooltip and message: "Conversion history",
   "Count again", "Compare with current page", "Customize hover card…".
2. Exception: tool names in `LauncherIcons.ts` are product names in Title Case ("Unit Converter").
   Keep that style for a new tool name.
3. Not this (legacy, `ElementInspectorPopup.tsx:85-88`): "Additional Settings", "Prevent Default".
4. Use plain English, short. An ellipsis "…" ends a label that opens more UI.
5. Section headings inside a tool: `<h3 className="m-0 text-sm font-semibold text-gray-800">`
   (`UnitConverter.tsx:315`).
6. Panel title style is fixed by `FeatureTitle` (uppercase, 13px). Do not restyle it.

---

## 9. State: Redux, sagas, local state

### 9.1 Which state where

| Data | Where |
| --- | --- |
| UI state of one component (input text, open/closed, selected row) | `useState` in the component |
| State shared by components of one tool | React context in the tool folder, or a content slice |
| App-wide state (open tools, panel position, inspector settings) | content Redux store, `app` slice |
| Data of a domain used across the UI (automation, notes form, snapshots) | content Redux slice |
| Data that must persist | storage (section 10), loaded into state on mount |

Local `useState` is fine and preferred for anything that only one component uses. Small tools like
`UnitConverter.tsx` use only local state + storage.

### 9.2 The content store

Files: `content/store/createStore.ts` (store + saga middleware), `content/store/rootReducer.ts:11-19`
(slices), `content/store/rootSaga.ts:7` (sagas).

To add a slice:

1. Create `entrypoints/content/store/<domain>/<domain>.slice.ts`.
2. Add it to `combineReducers` in `entrypoints/content/store/rootReducer.ts`.

Slice template (real file: `content/store/notes/notes.slice.ts`):

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface WordCounterState {
  lastCount: number;
}

const initialState: WordCounterState = {
  lastCount: 0,
};

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

export const selectLastCount = (state: { wordCounter: WordCounterState }) => state.wordCounter.lastCount;

export default wordCounterSlice.reducer;
```

Rules:

1. Type the state with an `interface`. **Never** write `(state: any)` in reducers.
2. Export selectors next to the slice: `export const selectX = (state: { domain: DomainState }) => ...`
   (`content/store/automation/automation.slice.ts:563-576`).
3. In components, use `useSelector(selectX)`. Do not write `useSelector((state: any) => ...)` in new code.

### 9.3 Sagas and `sagaEnhancer` (`getPayload`)

Side effects (storage writes, async work after an action) run in sagas. `sagaEnhancer`
(`core/libs/sagaEnhancer.ts:11-35`) turns a named generator into a saga that knows its own action type:

```ts
export const sagaEnhancer = <P = unknown>(sagaFn: SagaFunction<P>): EnhancedSaga<P> => {
  let sagaName = sagaFn.name;
  ...
  const actionType = sagaName.replace(/([A-Z])/g, "_$1").toUpperCase() + "__SAGA_ENHANCER";
  enhancedSaga.actionType = actionType;
  enhancedSaga.getPayload = (payload?: P) => ({ type: actionType, payload });
  return enhancedSaga;
};
```

Steps to add a saga:

1. Write it in `content/store/<domain>/<domain>.saga.action.ts`. The generator **must** have a unique name
   (the action type is built from it).

   ```ts
   // content/store/app/saga-action/app.saga.action.ts:114-122
   export const onChangeLauncherIconOrder = sagaEnhancer(function* changeLauncherIconOrderFn({
     payload,
   }: {
     payload: string[];
   }) {
     yield ExtensionStorageManager.changeLauncherIconOrder(payload);

     yield put(setLauncherIconOrder(payload));
   });
   ```

2. Register it in `content/store/<domain>/<domain>.saga.ts`:

   ```ts
   // content/store/app/app.saga.ts:30
   yield takeLatest(onChangeLauncherIconOrder.actionType, onChangeLauncherIconOrder);
   ```

   A new `<domain>.saga.ts` must also be added to `content/store/rootSaga.ts:7`.

3. Dispatch it with `getPayload`:

   ```ts
   // PopupContainer.tsx:85
   dispatch(onChangeLauncherIconOrder.getPayload(iconOrder));
   ```

Rules:

- Wrap saga bodies that can fail in `try { ... } catch (error) { console.error("Error loading scenarios:", error); } finally { ... }`
  (`automation.saga.action.ts:49-65`).
- Use `call(fn, ...args)` for async functions in new sagas.
- Naming: two styles exist. The `app` domain uses `onXxx` in `app/saga-action/app.saga.action.ts`; the
  `automation` domain uses `xxxWatcher` in `automation/automation.saga.action.ts`. For a new domain use
  the automation style: `<verb><Noun>Watcher` in `<domain>/<domain>.saga.action.ts`. When you add to an
  existing domain, follow that domain's style.

---

## 10. Storage

There are two ways to persist data. Pick by size and owner.

### 10.1 Small per-tool preferences: `browser.storage.local` directly

Use this for a tool's own settings or short history (a few KB). This is the pattern in the newest code:
`UnitConverter.tsx:28-73`, `PopupStyleInspector.tsx:186-211`, `PaletteContext.tsx:33-45`,
`shared/hoverCard/store.ts`.

Template (copy exactly, rename the key and type):

```tsx
// Extension storage, never the page's localStorage: the choice follows the user across sites
const PREFS_STORAGE_KEY = "wordCounterPrefs";

const [prefs, setPrefs] = useState<WordCounterPrefs>(DEFAULT_PREFS);
const prefsLoaded = useRef(false);

// Load once
useEffect(() => {
  browser.storage.local
    .get(PREFS_STORAGE_KEY)
    .then((stored) => {
      const saved = stored?.[PREFS_STORAGE_KEY];
      if (saved) setPrefs({ ...DEFAULT_PREFS, ...saved });
    })
    .catch((error) => console.error("Failed to load word counter preferences", error))
    .finally(() => {
      prefsLoaded.current = true;
    });
}, []);

// Save on change, but never overwrite the saved value with the defaults before it has loaded
useEffect(() => {
  if (!prefsLoaded.current) return;
  browser.storage.local.set({ [PREFS_STORAGE_KEY]: prefs }).catch(() => undefined);
}, [prefs]);
```

Rules:

1. Key name: `camelCase` naming the tool and the data: `unitConverterHistory`, `inspectorCssOutputPrefs`,
   `hoverCardConfig`. A dotted form is also used (`designTheme.active`); either is fine, be consistent
   within your tool.
2. Put the key in a `const ... _STORAGE_KEY` at the top of the file, or in the tool's `constants.ts` if
   two files use it.
3. **Never** use the page's `window.localStorage` or `sessionStorage`. That is the website's storage.
4. **Always** merge saved data over defaults (`{ ...DEFAULT_PREFS, ...saved }`) so new fields get defaults.
5. `browser` is a WXT auto-import in app code. In a module that has unit tests, import it explicitly:
   `import { browser } from "wxt/browser";` (`shared/hoverCard/store.ts:2`).
6. To share live state between components and tabs, copy `shared/hoverCard/store.ts`
   (`useSyncExternalStore` + `browser.storage.onChanged`).

### 10.2 App settings and domain data: `ExtensionStorageManager` and the background

Use this for app settings (`APP_STORE_STATE`), automation data, CSS snapshots, element details.

Chain:

```
component / saga
  -> ExtensionStorageManager.<method>()          core/services/storage/ExtensionStorageManager.ts
  -> background slice function (e.g. changeLauncherIconOrder)   background/store/slices/*.ts
  -> chrome.runtime.sendMessage in production (requestProcessing.ts:17-31),
     direct call in development (requestProcessing.ts:34-38)
  -> background action (background/store/actions/appStateActions.ts)
  -> AppStorageService / AppLocalStorage
  -> LocalStorage (JSON.stringify into browser.storage.local)   core/services/storage/LocalStorage.ts
```

Storage keys in this layer (`core/constants/`):

| Key | Content |
| --- | --- |
| `APP_STORE_STATE` | App settings object (`core/constants/index.ts`) |
| `AUTOMATION_SCENARIO_<id>` | One automation record. Every automation record uses this prefix (`core/constants/automation.ts:1-7`). The id prefix says what it is: `sc_` scenario, `fo_` folder, `fu_` function, `sch_` schedule, `tr_` trigger, `notification_` notification. |
| `CSS_SNAPSHOT_<id>`, `CSS_SNAPSHOTS_LIST` | CSS snapshots (`core/constants/cssSnapshot.ts`) |
| `ELEMENT_DETAILS_<id>`, `ELEMENT_DETAILS_LIST`, `ELEMENT_DETAILS_PANEL_POSITION` | Saved element details (`core/constants/elementDetails.ts`) |
| `notes` | Notes chrome slice state (`background/store/notesActionsSlice.ts:43-47`) |

Rules:

1. New ids for automation records: `` `fo_${await generateUniqueId()}` `` (`useScenarioFolders.ts:39`).
   Keep the prefix; list code filters by it (`AutomationScenarios/utils/storage.ts:110`).
2. Settings are changed through a queue that reads, changes and writes the whole object
   (`appStateActions.ts:5-17`). Add a new setting as a new action that uses `updateAppState`.
3. A new settings field needs a default in `appSettingsInitial` and a merge rule in `migrateAppSettings`
   (`core/initialData/app.ts`), so old saved settings keep working.

---

## 11. Background and messaging

### 11.1 Two contexts

- **Background** (`entrypoints/background/`): service worker. Has `chrome.tabs`, `chrome.scripting`,
  `chrome.windows`. No DOM, no React.
- **Content** (`entrypoints/content/`): runs in the page. Has the DOM and React. Cannot call
  `chrome.tabs` or `chrome.scripting`.

Put code in the background only when it needs a background-only API, must outlive the page, or
coordinates several tabs (`background/automationTabs.ts`). Everything else stays in content.

### 11.2 Messaging layers in use

1. **`@webext-core/messaging`** for extension lifecycle messages: `features/extension/messaging.ts:11-33`.

   ```ts
   interface ProtocolMap {
     [HOVER_INSPECTOR_ACTIVATE](s: any): any;
     [HOVER_INSPECTOR_DEACTIVATE](s: any): any;
     [HOVER_INSPECTOR_CHECK_SCRIPT](s: any): any;
     ...
   }
   export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
   ```

   Content listens with `onMessage(...)` and stores the remover (`content/index.tsx:40-53`).
   The background sends with `sendMessage(HOVER_INSPECTOR_DEACTIVATE, null, tabId)`
   (`features/extension/Ext/session/session.ts`). Message names live in `shared/globalEvents.ts`.

2. **Chrome slices** for "call a background function from content and get its result":
   - `chromeActionsSlice(actions)` (`core/libs/chromeActionsSlice.ts:3-44`): wraps a plain object of
     async functions; used by `background/store/slices/*.ts`.
   - `createChromeSlice({ name, version, initialState, actions })` (`core/libs/createChromeSlice.ts:48`):
     the newer form with its own persisted state; used by `background/store/notesActionsSlice.ts`.
     Content imports the exported functions and calls them like normal async functions
     (`PageNotes/PageNotes.tsx:7-14`: `getAllNotes`, `updateNote`).

3. **Plain `chrome.runtime.sendMessage` + `browser.runtime.onMessage`** with a `type` field, for the frame
   agent (`shared/frameAgent/protocol.ts`, `background/frameAgentRelay.ts`).

`webext-bridge` is in `package.json` but is not used (only a commented-out import at
`content/index.tsx:14`). **Never** use it.

Recipe: call new background logic from content.

1. If it belongs to notes, add an action to `actions` in `background/store/notesActionsSlice.ts` and
   export it at the bottom of the file.
2. Otherwise add an async function to the right `background/store/actions/<domain>Actions.ts`, then add
   its name to the destructured export in `background/store/slices/<domain>Slice.ts`.
3. Call it from content through `ExtensionStorageManager` (add a method there) or import it directly
   like `PageNotes.tsx` does.
4. Action functions receive `({ data }, sender)`. Read the payload from `data`.
5. Return plain JSON-serialisable values. Errors are logged and returned as `{ success: false, error }`
   (`chromeActionsSlice.ts:28-36`).

### 11.3 Message security

Every listener checks who sent the message and what it contains:

```ts
// background/frameAgentRelay.ts:45-49
browser.runtime.onMessage.addListener((message: unknown, sender) => {
  if (!isFrameAgentRuntimeMessage(message)) return;
  // From content scripts of this extension only
  const tabId = sender.tab?.id;
  if (sender.id !== browser.runtime.id || tabId == null || sender.frameId == null) return;
```

Rules:

1. Type unknown input as `unknown`, then narrow with a type guard (`isObject`, `isFrameKey`).
2. Check `sender.id === browser.runtime.id` for messages from content scripts.
3. Return `false`/`undefined` for messages that are not yours, so other listeners can answer
   (`chromeActionsSlice.ts:23-26`).
4. **Never** trust `window.postMessage` data. Pages can send anything.

---

## 12. Working with the host page

### 12.1 Never break the page

1. **Never** change the page's styles, classes or DOM permanently. Every change must be undone when the
   tool closes or the extension turns off.
2. Inject page-wide CSS as one `<style id="hover-inspector-...">` element and remove it to undo
   (`shared/utils/allBorders.ts:7-25`). Use outlines, not borders, so layout does not shift.
3. Overlays you draw (boxes, lines, notes) live in the shadow root, `position: fixed`, with
   `pointer-events: none` when they must not block the page (`content/style.css:178-184`).
4. **Never** call `preventDefault()`/`stopPropagation()` on page events unless the user turned that on
   (the Inspector's "Prevent default" setting).
5. Esc turns the extension off (`content/index.tsx:95-121`). If your UI handles Esc itself (a popover, an
   edit field), call `event.preventDefault()` and `event.stopPropagation()` in a capture listener
   (`usePopoverFocus.ts:25-32`).
6. Read page values with `getComputedStyle` and `getBoundingClientRect`. Remember the page may use `zoom`
   or `transform`; see the comments in `content/index.tsx:169-182`.
7. `rem` on the page is the page's root font size, not 16px (`UnitConverter.tsx:34-35`).

### 12.2 Cleanup on deactivate

When the user switches the extension off, the content store sets `isActive = false` and
`AppController` renders nothing (`content/modules/AppController/AppController.tsx:33-35`). Every tool
unmounts. When the script is injected again, WXT invalidates the old context (`content/index.tsx:37-41`).

So:

1. **Always** undo side effects in the `useEffect` cleanup that created them: listeners, observers,
   timers, intervals, injected styles, highlight overlays.

   ```tsx
   // content/modules/EventListenerProvider.tsx:150-162
   useEffect(() => {
     if (!showAllBorders) return;
     setAllBordersVisible(document, true);
     const stopWatchingFrames = watchSameOriginFrames((frameWindow) => {
       setAllBordersVisible(frameWindow.document, true);
       return () => setAllBordersVisible(frameWindow.document, false);
     });
     return () => {
       setAllBordersVisible(document, false);
       stopWatchingFrames();
     };
   }, [showAllBorders]);
   ```

2. Listeners added outside React (in `content/index.tsx`) are removed in `ctx.onInvalidated(...)`.
3. A `ResizeObserver`/`MutationObserver` is disconnected in cleanup (`TokenTabLayout.tsx:44-55`).

### 12.3 Same-origin and cross-origin frames

- Same-origin iframes are reached directly through `frame.contentDocument`; use
  `watchSameOriginFrames` from `shared/utils/frames.ts`.
- Cross-origin iframes get the **frame agent** (`entrypoints/frame-agent.ts` →
  `shared/frameAgent/agent.ts`). It is injected with `scripting.executeScript` into all frames, only
  while the extension is on in that tab (`background/frameAgentRelay.ts:26-38`). It mounts no UI; it
  reports hover/select data and the top frame draws everything.
- Trust model (`shared/frameAgent/protocol.ts:1-14`): content travels only through extension messaging;
  the only page-visible message is a random-key registration (`hub.ts:15-28`, first registration wins).
- Every incoming message is shape-checked and size-capped (`protocol.ts:143-220`, `sanitizeEvent`,
  `sanitizeSnapshot`). Computed properties are whitelisted in `COMPUTED_PROPS` (`protocol.ts:106-109`).
- The agent removes its listeners on deactivate (`agent.ts:334-346`).

Rules when you touch the frame agent:

1. A new field in a snapshot: add it to the interface, to `sanitizeSnapshot` with a type check and a
   length cap, and to `shared/frameAgent/__tests__/protocol.test.ts`.
2. A new computed property: add it to the whitelist source (`styleRulesList` or `CARD_COMPUTED_PROPS`).
3. **Never** send page content through `window.postMessage`.

---

## 13. TypeScript, imports, comments, errors, logging

### 13.1 TypeScript

1. Type everything you write. `noImplicitAny` is off in `tsconfig.json`, but new code must not rely on it.
2. **Never** write `any` in new code. Use a real type, `unknown` + a type guard, or `Record<string, unknown>`.
3. **Never** add `// @ts-ignore` or `// @ts-nocheck`. If antd typing for `getPopupContainer` complains,
   type the function as `() => HTMLElement`.
4. Prefer `interface` for object shapes, `type` for unions (`type RowMenuAction = "view" | "rename" | ...`,
   `SnapshotManager.tsx:227`).
5. Use `as const` for fixed lookup objects (`tokens.ts:44`).
6. Use `import type { X }` or `type X` inside the braces for type-only imports
   (`AnalyzePageUI.tsx:15`: `type PaletteTab`).

### 13.2 Imports

1. Cross-folder imports use the alias `@entrypoints/...` (defined in `wxt.config.ts` and `vitest.config.ts`).
   Example: `import { tokens } from "@entrypoints/shared/styles/tokens";`
2. Imports inside the same tool folder use relative paths: `import { countWords } from "./utils/countWords";`.
3. **Never** use `@/entrypoints/...` (a few old imports do). **Never** use `../../..` to leave a tool folder.
4. Leave off the `.ts`/`.tsx` extension in new imports. Old files have both styles; both build.
5. Order: React first, then third-party packages, then `@entrypoints/...`, then relative imports.
6. Use double quotes and semicolons. Prettier: `printWidth: 120` (`.prettierrc`).

### 13.3 Comments

1. Write comments in English.
2. Comment **why**, not what. One or two short lines. Examples from new code:

   ```ts
   // rem is relative to the page's root font size, which is not always 16px
   // Kept in extension storage so it follows the user across sites and never touches the page's own localStorage
   // The "more tabs" dropdown would otherwise render into the page's <body>, outside our styles
   ```

3. Put a `/** ... */` block above exported functions, components and non-obvious types. One sentence is
   enough (`EmptyState.tsx:53`).
4. **Never** leave commented-out code. Delete it; git keeps history.
5. **Never** leave `debugger` or `console.log` in committed code.

### 13.4 Errors and logging

1. Async calls that can fail get `.catch(...)` or `try/catch`. **Never** leave a promise rejection
   unhandled.
2. Best-effort writes (preferences, history): `.catch(() => undefined)` (`UnitConverter.tsx:72`).
3. Failures the developer needs to see: `console.error("Failed to load conversion history", e)`. Start the
   message with what failed. In the background, prefix with the area: `` console.error(`[background] ${request.action} failed:`, error) ``
   (`chromeActionsSlice.ts:33`).
4. Failures the user must know about: `toast.error("Could not copy to the clipboard")`
   (`ColorPicker.tsx:144`). Success feedback: `toast.success(..., { autoClose: 1500 })`.
5. Inline error text in a view: a short sentence in `tokens.color.danger`.
6. **Never** use `alert()`, `confirm()` or `prompt()`. Use a toast or an antd `Popconfirm`.
7. Use `console.warn` for expected, recoverable problems (`background/index.ts:71`).

---

## 14. Legacy code: do not copy

The repo grew over years. These patterns exist but are **wrong for new code**. When you edit a file that
has them, do not spread them; fix them only if the task asks or the change is tiny and safe.

| Legacy pattern | Example | Write instead |
| --- | --- | --- |
| Hard-coded colours | `CSSSnapshotInspector.tsx:40-58` (`#d1d5db`, `#1f2937`, `#2563eb`); `PopupContainer.styled.ts:124-151` | `tokens.color.*` or matching Tailwind gray/blue classes |
| `any` everywhere | `useSelector((state: any) => state.app?.preventDefault)` in `ElementInspectorPopup.tsx:26`; `icon: any` in `FeatureIcon.tsx:6` | Typed selectors, real types |
| `@ts-ignore` / `@ts-nocheck` | `UnitConverter.tsx:245`, `LocalStorage.ts:1`, `shared/helpers.ts:1` | Correct types |
| Commented-out code | `content/store/app/app.slice.ts:13-19`, `background/index.ts:17-18`, `content/app.tsx:31` | Delete it |
| `debugger` statement | `CSSSnapshotInspector/.../ElementDiff/utils/cssTokens.tsx:106` | Never commit one |
| `alert()` | `SnapshotManagerHeader.tsx:312`, `SnapshotViewerHeader.tsx:275` | `toast.error(...)` |
| Ukrainian comments | `Tooltip.tsx:14-15`, `UnitConverter.tsx:102-148`, `sagaEnhancer.ts:1` | English comments |
| Focus rings as classes | `focus:ring-2 focus:ring-blue-400` in `ConfirmationDialog.tsx:20`, `ScenarioItem.tsx:450` | Nothing: the global rule (8.4) handles focus |
| Ring for selection | `ring-2 ring-indigo-200` in `NoteForm.tsx:547` | Tint (8.5) |
| `dark:` classes | about 70 in `ScenarioItem.tsx`, `ElementDiff/components/subcomponents.tsx` | Light only |
| Title Case labels | "Additional Settings", "Show All Borders" in `ElementInspectorPopup.tsx` | Sentence case |
| Hand-made dropdown | `DropdownMenu` absolute `div` in `SnapshotManagerHeader.tsx:160` | antd `Popover` menu (8.3.6) |
| Header portal id as a string | `NoteTakingToolsIntegration.tsx:15` | `HeaderPortalId` enum |
| Wrong footer portal id | `PortalId.FUNCTIONS_TAB` in `PageNotes/components/NoteForm.tsx:813` | Your own tool's id |
| Non-transient styled prop | `isMinimized` in `PopupContainer.styled.ts:124` | `$isMinimized` |
| Duplicate old store files | `content/store/app.action.ts`, `content/store/app.constant.ts`, empty `content/store/app/app.action.ts` | Slices + saga actions |
| Thunks via custom middleware | `closeSettingPopup` in `content/store/app.action.ts` | RTK slice actions or sagas |
| `@/entrypoints/...` alias | 3 old imports (`grep -rn "from \"@/entrypoints" entrypoints`) | `@entrypoints/...` |
| Single quotes, no semicolons | `CSSSnapshotInspector/hooks/useElementPicker.ts`, `Note Taking Tools/src/**` | Double quotes, semicolons |
| Tests beside source | `background/services/notes.test.ts` | `__tests__/` folder |
| Vendored code | `shared/components/git-diff-view/`, `shared/components/ReactRnd/`, `PopupContainer/Note Taking Tools/` (folder name with spaces, own `package.json`, shadcn-style `ui/`) | Do not copy their style; edit them only when the task targets them |
| Storage helper `AUTOMATION_*_KEY` functions repeated seven times | `core/constants/automation.ts:9-72` | One helper for new keys |

---

## 15. Tests

Setup: vitest 3 with `environment: "jsdom"` (`vitest.config.ts`). Aliases `@entrypoints` and `@` work in
tests. WXT auto-imports (`browser`, `defineContentScript`) do **not** work in tests; import `browser`
from `"wxt/browser"` in modules you test, or keep the tested module free of extension APIs.

What to test:

1. Every pure function you add in `utils/` gets a test file. This is the main way logic is tested here.
2. Message sanitisers and parsers get tests with bad input (`shared/frameAgent/__tests__/protocol.test.ts`).
3. Data migrations and storage shape conversions get tests (`background/services/noteScope.test.ts`).
4. React components are not unit-tested here. Check them in the browser (section 16). Small render
   helpers can be tested with `renderToStaticMarkup` (`PageNotes/utils/__tests__/noteMarkup.test.tsx:1-5`).

How to make code testable: move the logic out of the component into a pure function that takes plain
values and returns plain values. No DOM, no storage, no Redux inside it.

Test file template (`<ToolName>/utils/__tests__/countWords.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { countWords } from "../countWords";

describe("countWords", () => {
  it("returns zero for empty or blank text", () => {
    expect(countWords("")).toEqual({ words: 0, characters: 0 });
    expect(countWords("   \n ")).toEqual({ words: 0, characters: 0 });
  });

  it("counts words separated by any whitespace", () => {
    expect(countWords(" Hello   big\nworld ")).toEqual({ words: 3, characters: 13 });
  });
});
```

Rules:

1. Import `describe`, `expect`, `it` from `"vitest"` explicitly.
2. `describe` names the unit; `it` says the behaviour in plain English ("drops the Element: prefix and
   falls back to the address", `snapshotLabels.test.ts:18`).
3. Use small factory helpers for fixtures (`const snapshot = (over = {}) => ({ ...defaults, ...over })`,
   `protocol.test.ts:15`).
4. Pass fixed dates into time-dependent functions instead of using the clock (`snapshotLabels.test.ts:32-36`).
5. Run one folder: `yarn vitest run entrypoints/content/modules/PopupContainer/<ToolName>`.
6. Run all: `yarn test`. All tests must pass (240 tests at the time of writing).

---

## 16. Browser check with Playwright

Unit tests do not show layout, focus or shadow-root bugs. Check every UI change in a real Chromium with
the built extension. The ready script is `.claude/skills/verify-in-browser/check-panel.mjs`; the full
recipe is in `.claude/skills/verify-in-browser/SKILL.md`.

How it works, in short:

1. `yarn build` creates `dist/chrome-mv3/`.
2. The script copies that folder and patches `background.js` so the test can call the toolbar-button
   handler (`self.__onClicked`). Headless Chromium has no toolbar to click.
3. It launches Chromium with `--load-extension`, serves a small test page on `http://localhost:8765/`
   (the extension does not run on `about:blank` or `file://`), and turns the extension on.
4. It opens the tool from the launcher menu: button "More tools and settings", then the tool's title.
5. Playwright locators pierce the open shadow root, so
   `page.getByRole("button", { name: "Count again" })` finds buttons inside `<hover-inspector>`.
   In `page.evaluate`, reach the UI with `document.querySelector("hover-inspector").shadowRoot`.
6. It sets the panel width (320 or 440), takes a screenshot into `shots/` and prints page errors.

Always check: 320px and 440px width, keyboard Tab through the controls (ring visible), mouse clicks (no
ring), no console errors, overlays open inside the panel.

---

## 17. Git: branches, commits, pull requests

Branches:

- Work on the branch you are given. If you are on `master`, create a branch first.
- Branch names in use: `claude/<topic>-<id>`, `work/<area>` (for example `work/c4-a`).
- **Never** push unless the task says so.

Commit messages (from recent history, e.g. `f171d8a`, `8dec1bb`, `23084b6`):

1. Subject: plain English, imperative, sentence case, no trailing period, no `feat:`/`fix:` prefix.
   Often starts with the area and a colon:
   - `Hover card: let people choose which properties it shows`
   - `CSS Snapshot: fix false diffs, minimal saves and the missing-element message`
   - `Draw focus outlines only during keyboard navigation`
   - `Remove the "Become a sponsor" banner from the tool panel`
2. Keep the subject under about 72 characters.
3. Body: wrap at about 75 characters. Explain **why** and what the user sees, not the code diff. Use `-`
   bullets for several changes. Mention tests added.
4. End with the attribution lines the session asks for (for Claude sessions: `Co-Authored-By: ...` and
   `Claude-Session: ...`).
5. The older `feat: ...` / `refactor: ...` subjects in history are legacy; do not copy them.

Example:

```
Unit Converter: remember the last units

The units reset to px → rem every time the tool opened. They are now kept
in browser.storage.local under unitConverterUnits and restored on open.
Pure parsing moved to utils/units.ts with tests.

Co-Authored-By: ...
```

Pull request body (from PR #6):

```
Before:
- **Area:** what was wrong, in the user's words.

After:
- **Area:** what the user sees now.

## Not done
- What was left out and why (omit the section if nothing).

## How
- How the work was done (branches, approach).
- `yarn test`: N tests pass.
- `yarn build`: succeeds.
- Browser checks: what was driven in Playwright Chromium, at 320/440px.
```

---

## 18. Checklist before you commit

Run every item. Do not commit until all pass.

Items 1-6 are automated: run `yarn verify` (`scripts/verify.sh`) in the repo root. It must end with
`RESULT: all automatic checks passed`. The commands below show what it checks.

1. `yarn build` succeeds.
2. `yarn test` passes.
3. `yarn compile 2>&1 | grep -E "<each file you changed>"` prints nothing (no new TypeScript errors in your files).
4. `git status` shows no `package-lock.json`, no `dist/`, no screenshots, no scratch files.
5. No `any`, `@ts-ignore`, `console.log`, `debugger`, `alert(` or commented-out code in your diff:
   `git diff | grep -nE "^\+.*(: any|as any|@ts-ignore|console\.log|debugger|alert\()"` prints nothing.
6. No hard-coded hex colours in your diff that have a token:
   `git diff | grep -nE "^\+.*#[0-9a-fA-F]{3,6}\b"` — every hit must be justified.
7. Every new button has a name (text, `label` on `IconButton`, or `aria-label`).
8. Every new label is sentence case.
9. Overlays (Select, Popover, Popconfirm, Dropdown) open inside the panel (checked in the browser).
10. The tool works at 320px and 440px panel width (checked in the browser).
11. No focus outline after mouse clicks; a visible ring when tabbing.
12. Every listener, observer, timer and injected style is removed in a cleanup.
13. New pure logic has tests in `__tests__/`.
14. Commit message follows section 17.
