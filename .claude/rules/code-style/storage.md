---
paths:
  - "entrypoints/core/**"
  - "entrypoints/background/**"
  - "entrypoints/shared/hoverCard/**"
  - "entrypoints/content/modules/PopupContainer/**"
  - "entrypoints/**/hooks/**"
---

# Code style: storage

Choose the existing storage owner before adding a write path.

| Data | Path |
| --- | --- |
| Small preferences/history owned by one tool | `browser.storage.local` directly |
| App settings, automation, CSS snapshots, element details | `ExtensionStorageManager` and background actions |
| Notes | Existing `background/store/notesActionsSlice.ts` actions |

For a tested module, explicitly `import { browser } from "wxt/browser"`; tests do not get WXT auto-imports.

Both paths also work on the standalone page (`yarn start`): there `browser.storage` is
`.standalone/polyfills/standaloneStorage.ts` (page `localStorage`, with `onChanged`) and background
actions run in the page. Do not add a separate standalone branch to feature code.

## Small per-tool preferences

- Use a descriptive key such as `unitConverterHistory`, declared as a constant. Reuse the domain's key
  convention. Move the key to tool `constants.ts` only when shared by files.
- Load before enabling saves. Do not overwrite existing storage with initial defaults during loading.
- Validate saved fields against their expected types; merge valid saved fields over defaults.
- Handle load failure explicitly; do not silently overwrite data after a failed read.
- If the UI permits editing during load, ensure the late load cannot overwrite that edit. The simpler
  option is to keep preference controls disabled until loading finishes.
- Handle async failures according to `typescript.md`. Do not write after the owning UI has been disposed.
- For live shared state across components/tabs, inspect `shared/hoverCard/store.ts`
  (`useSyncExternalStore` and `browser.storage.onChanged`) instead of inventing a second mechanism.

These are behavior requirements, not a universal copy-and-paste hook. Adapt the existing tool's storage
code and test the load/save ordering when changing it.

## App settings and domain data

The usual chain is component/saga → `core/services/storage/ExtensionStorageManager.ts` → background
slice → background action → storage service. Inspect the domain before extending the chain.

- App settings actions use the `updateAppState` queue in `background/store/actions/appStateActions.ts`.
- A new setting needs a default and migration handling in `core/initialData/app.ts`.
- Use storage keys from `core/constants/`: `index.ts`, `automation.ts`, `cssSnapshot.ts`, `elementDetails.ts`.
- Preserve automation record prefixes (`sc_`, `fo_`, `fu_`, `sch_`, `tr_`, `notification_`); list logic
  depends on them. Keep existing data readable when changing its shape.
