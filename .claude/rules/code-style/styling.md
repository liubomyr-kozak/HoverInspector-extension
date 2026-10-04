---
paths:
  - "entrypoints/**/*.tsx"
  - "entrypoints/**/*.styled.ts"
  - "entrypoints/**/*.css"
  - "entrypoints/shared/styles/**"
  - "tailwind.config.cjs"
  - "postcss.config.cjs"
---

# Code style: styling

## Choose a styling tool

1. antd for standard controls. Prefer its size props over custom control styling.
2. Tailwind for layout and simple typography in JSX.
3. styled-components for prop-driven states, child selectors, pseudo-classes or reusable styled pieces.
   Prefix styling-only props with `$`, such as `$selected`.

Use `entrypoints/shared/styles/tokens.ts` for colors, radii and sizes. In styled-components, use
`${tokens.color.text}` or `${tokens.radius.md}px`. In Tailwind, use the corresponding palette class.
Read the token definition for its current value instead of copying a token object into another file.

Token → Tailwind class (same colour; change this table when `tokens.ts` changes):

| Token | Tailwind |
| --- | --- |
| `color.text` | `text-gray-800` |
| `color.textSecondary` | `text-gray-600` |
| `color.textMuted` | `text-gray-500` (the palest allowed text on white) |
| `color.border` / `color.borderStrong` | `border-gray-200` / `border-gray-300` |
| `color.surface` / `color.surfaceMuted` | `bg-white` / `bg-gray-50` |
| `color.primary` / `color.primaryHover` | `blue-600` / `blue-700` |
| `color.primaryBg` / `color.primaryBorder` | `bg-blue-50` / `border-blue-200` |
| `color.danger` / `color.dangerBg` | `red-600` / `bg-red-50` |
| `color.success` / `color.successBg` | `green-700` / `bg-green-50` |
| `color.warning` / `color.warningBg` | `amber-700` / `bg-amber-50` |
| `radius.sm` / `radius.md` / `radius.lg` | `rounded` / `rounded-md` / `rounded-lg` |
| `font.size.xs` / `sm` / `md` / `lg` | `text-xs` / `text-[13px]` / `text-sm` / `text-base` |

- No hard-coded hex value when an existing token represents it.
- No legacy orange `primary-*` Tailwind palette or `dark:` classes; this UI is light only.
- Use `px` in styled-components and inline styles. Tailwind rem values are converted at build time
  by `postcss.config.cjs`; styled-components values are not.
- Inline styles are for computed dimensions or one-off numeric values, not colors.
- Do not import global CSS from a component. The shadow root receives `content/style.css`.

## Shadow-root overlays

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

## Focus, selection and text

The host's `data-hi-keyboard` attribute and `content/style.css` control keyboard focus outlines.
Do not add button `focus:ring-*` or custom focus outlines. Preserve visible keyboard focus and verify
mouse clicks do not leave an outline. If a third-party widget needs a fix, scope it under
`:host([data-hi-keyboard])`; antd focus appearance comes from the shared theme.

Selected items use background tint and border color, not rings: for example `bg-blue-50 border-blue-300`.
Set `aria-pressed` for toggles or `aria-selected` for listbox/tab items as appropriate.

Use sentence case for labels and messages. Tool product names keep their `LauncherIcons.ts` casing.
Keep labels short; use an ellipsis for actions that open further UI. Do not restyle the panel title.
