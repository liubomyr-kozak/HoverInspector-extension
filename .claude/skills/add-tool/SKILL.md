---
name: add-tool
description: Add a new tool panel to Hover Inspector end to end - launcher entry, panel component with header portal, optional footer, storage, tests and a browser check. Use when asked to create a new tool, feature panel or launcher item.
---

# Add a new tool

This recipe was tested end to end with a sample "Word Counter" tool (build, tests, Chromium check).
Follow every step in order. Replace the sample names with yours using this table:

| Sample | Meaning | Your value (example) |
| --- | --- | --- |
| `WordCounter` | Component and folder name, PascalCase | `LinkChecker` |
| `WORD_COUNTER` | Constant in `LauncherIcons.ts` and `HeaderPortalId`, UPPER_SNAKE | `LINK_CHECKER` |
| `wordCounter` | Tool id, camelCase | `linkChecker` |
| `"Word Counter"` | Tool title, Title Case (it is a product name) | `"Link Checker"` |
| `word-counter-header` | Header portal id, kebab-case + `-header` | `link-checker-header` |
| `wordCounterPrefs` | Storage key, camelCase | `linkCheckerPrefs` |
| `IconAbc` | Icon from `@tabler/icons-react` | `IconLink` |

Read `docs/CODE_STYLE.md` sections 5–8 and 10 once before you start.

## Step 1. Register the tool in the launcher

File: `entrypoints/content/modules/Launcher/LauncherIcons.ts`

1. Add the icon to the import list at the top:

   ```ts
   import {
     ...
     IconNotebook,
     IconAbc,
   } from "@tabler/icons-react";
   ```

   Check the icon exists: `grep -c "IconAbc }" node_modules/@tabler/icons-react/dist/esm/icons/index.mjs` must print `1`.

2. Add the tool constant after `NOTE_TAKING_TOOLS`:

   ```ts
   export const WORD_COUNTER = {
     id: "wordCounter",
     title: "Word Counter",
     icon: IconAbc,
     activatable: true,
     multipleView: false,
   };
   ```

   `multipleView: false` means opening this tool closes the other single-view tools. Use `true` only if
   the tool must stay open next to the Element Inspector.

3. Add it to the end of `ICON_ITEMS_INITIAL`:

   ```ts
   const ICON_ITEMS_INITIAL = [INSPECTOR, RULER, PICKER, CONVERT_TOOLS, ANALYZE_PAGE, AUTOMATION, CSS_SNAPSHOT, PAGE_NOTES, NOTE_TAKING_TOOLS, WORD_COUNTER];
   ```

4. Add its id to the end of `POPUP_SUPPORT_TOOLS`:

   ```ts
   export const POPUP_SUPPORT_TOOLS = [
     ...
     NOTE_TAKING_TOOLS.id,
     WORD_COUNTER.id,
   ];
   ```

## Step 2. Add the header portal id

File: `entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons.tsx`

Add one line at the end of `enum HeaderPortalId`:

```ts
  PAGE_NOTES = "page-notes-header",
  WORD_COUNTER = "word-counter-header",
}
```

## Step 3. Create the tool folder

Create these files:

```
entrypoints/content/modules/PopupContainer/WordCounter/
  WordCounter.tsx
  types.ts
  utils/countWords.ts
  utils/__tests__/countWords.test.ts
```

### 3a. `types.ts`

```ts
export interface WordCounterPrefs {
  /** Count only the text of the page's <main> element when it exists */
  mainOnly: boolean;
}

export interface WordCount {
  words: number;
  characters: number;
}
```

### 3b. `utils/countWords.ts` (pure logic: no DOM, no storage, no React)

```ts
import { WordCount } from "../types";

/** Counts words and non-space characters in a piece of text. Pure: no DOM access. */
export function countWords(text: string): WordCount {
  const trimmed = text.trim();
  if (!trimmed) return { words: 0, characters: 0 };
  return {
    words: trimmed.split(/\s+/).length,
    characters: trimmed.replace(/\s+/g, "").length,
  };
}
```

### 3c. `utils/__tests__/countWords.test.ts`

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

### 3d. `WordCounter.tsx` (the panel)

This template shows every required part: header portal, header button, body with antd + Tailwind,
empty state, storage of preferences, footer portal. Delete the parts you do not need (the footer and
the storage are optional).

```tsx
import React, { useEffect, useRef, useState } from "react";
import { Button, Switch } from "antd";
import { IconRefresh } from "@tabler/icons-react";
import {
  HeaderPortalId,
  PortalModalHeader,
  PortalModalHeaderButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { ScenarioPortalFooterButtons } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalFooterButtons";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { EmptyState } from "@entrypoints/shared/components/EmptyState";
import { WORD_COUNTER } from "@entrypoints/content/modules/Launcher/LauncherIcons";
import { countWords } from "./utils/countWords";
import { WordCount, WordCounterPrefs } from "./types";

// Extension storage, never the page's localStorage: the choice follows the user across sites
const PREFS_STORAGE_KEY = "wordCounterPrefs";
const DEFAULT_PREFS: WordCounterPrefs = { mainOnly: false };

const readPageText = (mainOnly: boolean) => {
  const root = (mainOnly && document.querySelector("main")) || document.body;
  return root?.innerText || "";
};

export const WordCounter: React.FC = () => {
  const [prefs, setPrefs] = useState<WordCounterPrefs>(DEFAULT_PREFS);
  const [count, setCount] = useState<WordCount | null>(null);
  const prefsLoaded = useRef(false);

  // Load saved preferences once
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

  // Save after every change, but not the defaults before the saved value has loaded
  useEffect(() => {
    if (!prefsLoaded.current) return;
    browser.storage.local.set({ [PREFS_STORAGE_KEY]: prefs }).catch(() => undefined);
  }, [prefs]);

  const recount = () => setCount(countWords(readPageText(prefs.mainOnly)));

  // Count when the tool opens and when the scope changes
  useEffect(() => {
    recount();
  }, [prefs.mainOnly]);

  return (
    <div className="w-full">
      <PortalModalHeader portalId={HeaderPortalId.WORD_COUNTER}>
        <FeatureTitle>
          <FeatureIcon icon={WORD_COUNTER.icon} />
          <FeatureTitleText title={WORD_COUNTER.title}>{WORD_COUNTER.title}</FeatureTitleText>
          <PortalModalHeaderButtons>
            <IconButton label="Count again" onClick={recount}>
              <IconRefresh size={18} />
            </IconButton>
          </PortalModalHeaderButtons>
        </FeatureTitle>
      </PortalModalHeader>

      <label className="flex items-center justify-between gap-2 mb-3 text-sm text-gray-800">
        <span>Count only the main content</span>
        <Switch
          size="small"
          checked={prefs.mainOnly}
          onChange={(mainOnly) => setPrefs((prev) => ({ ...prev, mainOnly }))}
          aria-label="Count only the main content"
        />
      </label>

      {count && count.words > 0 ? (
        <dl className="m-0 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-gray-200 p-2">
            <dt className="text-xs text-gray-500">Words</dt>
            <dd className="m-0 text-base font-semibold text-gray-800">{count.words.toLocaleString()}</dd>
          </div>
          <div className="rounded-md border border-gray-200 p-2">
            <dt className="text-xs text-gray-500">Characters</dt>
            <dd className="m-0 text-base font-semibold text-gray-800">{count.characters.toLocaleString()}</dd>
          </div>
        </dl>
      ) : (
        <EmptyState title="No text on this page" description="Open a page with some text and count again." />
      )}

      <ScenarioPortalFooterButtons portalId={HeaderPortalId.WORD_COUNTER}>
        <div className="flex justify-end w-full p-2">
          <Button type="primary" onClick={recount}>
            Count again
          </Button>
        </div>
      </ScenarioPortalFooterButtons>
    </div>
  );
};
```

Rules for this file:

- The root element is `<div className="w-full">`. Other tools may share the panel, so never use fixed
  ids or `position: fixed` for your body.
- Every label and button text is sentence case. Only the tool title is Title Case.
- Every icon-only button is an `IconButton` with a `label`.
- Colours: Tailwind `gray-800` (text), `gray-500` (muted), `gray-200` (borders), `blue-*` (primary), or
  `tokens` in styled-components. Nothing lighter than `gray-500` for text.
- Do not pass `getPopupContainer` to antd controls unless they render in the wrong place; the global
  `ConfigProvider` already keeps overlays in the shadow root.
- Undo every page change in a `useEffect` cleanup (listeners, observers, timers, injected styles).

## Step 4. Show the tool in the panel

File: `entrypoints/content/modules/PopupContainer/PopupContainer.tsx`

1. Add `WORD_COUNTER` to the import from `LauncherIcons.ts`:

   ```ts
   import {
     ...
     NOTE_TAKING_TOOLS,
     WORD_COUNTER,
     POPUP_SUPPORT_TOOLS,
     RULER,
   } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
   ```

2. Import the component next to the other tool imports:

   ```ts
   import { WordCounter } from "@entrypoints/content/modules/PopupContainer/WordCounter/WordCounter";
   ```

3. Add one entry at the end of `COMPONENT_MAP`:

   ```tsx
   const COMPONENT_MAP: Record<string, JSX.Element> = {
     ...
     [NOTE_TAKING_TOOLS.id]: <NoteTakingToolsIntegration />,
     [WORD_COUNTER.id]: <WordCounter />,
   };
   ```

The comment above `COMPONENT_MAP` says it: every id in `POPUP_SUPPORT_TOOLS` must have an entry here.
Nothing else is needed: the launcher menu, toolbar order and minimized launcher read `ICON_ITEMS`.

Only if your tool also draws on the page outside the panel (like the Ruler): render that overlay in
`entrypoints/content/app.tsx` next to `{activeIcons.includes(RULER.id) && <ViewportRuler />}`.

## Step 5. Storage (only if the tool saves data)

- Small preferences or a short history: the `browser.storage.local` pattern in step 3d. Key in a
  `const ..._STORAGE_KEY` at the top of the file.
- Large or structured data shared with the background: see `docs/CODE_STYLE.md` section 10.2 and 11.2.
- **Never** use `window.localStorage` (that is the website's storage).

## Step 6. Check

Run each command in the repo root, in this order:

```bash
REPO="$(git rev-parse --show-toplevel)" && cd "$REPO"
yarn vitest run entrypoints/content/modules/PopupContainer/WordCounter   # your tests pass
yarn test                                                                  # all tests pass
yarn verify                                                                # must end with "RESULT: all automatic checks passed"
```

`yarn verify` runs the forbidden-pattern checks, TypeScript on your changed files, `yarn test` and
`yarn build`. Fix every `FAIL` line and run it again until it passes.

Then do the browser check with the `verify-in-browser` skill
(`.claude/skills/verify-in-browser/SKILL.md`):

```bash
HI_REPO="$REPO" PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node check-panel.mjs "Word Counter" 320
HI_REPO="$REPO" PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node check-panel.mjs "Word Counter" 440
```

Expected: `header: Word Counter`, `errors: []`, and screenshots where the panel shows the title, the
controls and the footer button without clipping.

## Step 7. Commit

Follow `docs/CODE_STYLE.md` section 17. Example subject: `Add a Word Counter tool`. The body says what
the tool does for the user and that `countWords` has tests.

## Mistakes to avoid

| Mistake | Result |
| --- | --- |
| Id added to `POPUP_SUPPORT_TOOLS` but not to `COMPONENT_MAP` | The panel opens empty |
| Constant not added to `ICON_ITEMS_INITIAL` | The tool is missing from the launcher menu |
| Portal id as a string literal | Works, but breaks the house style; use `HeaderPortalId` |
| Title text directly in `FeatureTitle` | Long names push the header to several lines |
| `onClick` on a `div` | Not reachable by keyboard; use a `button` or `clickableProps` |
| `window.localStorage` | Writes into the website's storage |
| A `.ts` file directly in `entrypoints/` | WXT builds it as a new entrypoint |
