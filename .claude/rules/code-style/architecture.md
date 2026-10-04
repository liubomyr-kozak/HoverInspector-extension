# Code style: architecture, folders and file names

## Project in one page

Hover Inspector is a WXT browser extension for designers and QA. Its tools share one floating panel.

- `entrypoints/background/index.ts`: toolbar click, content-script injection, tab events and ports.
- `entrypoints/content/index.tsx`: creates the open shadow-root UI named `hover-inspector`.
- `entrypoints/content/app.tsx`: React providers, antd theme and overlay container.
- `entrypoints/content/modules/PopupContainer/PopupContainer.tsx`: tool registration (`COMPONENT_MAP`).
- `entrypoints/content/modules/Launcher/LauncherIcons.ts`: tool ids, names and icons.
- `entrypoints/frame-agent.ts`: entrypoint for the cross-origin frame agent.

Stack: React, TypeScript, Redux Toolkit + redux-saga, antd, Tailwind, styled-components, vitest + jsdom.
Use `package.json` for current versions and scripts; `wxt.config.ts` for extension build configuration.

## Folder map

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

## File naming

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
