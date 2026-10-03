---
paths:
  - "entrypoints/**/*.tsx"
---

# Code style: components and shared pieces

## Writing a component

- Write a named function component export. Use typed props; `React.FC<Props>` and typed functions both work.
- Define `interface <Name>Props` above the component. Destructure props and defaults in the parameters.
- Keep handlers local unless they need reuse. Keep simple expressions local too.
- Extract parsing, matching or calculation when it has meaningful branches, needs independent testing,
  or is reused. Do not create a helper file for every expression.
- Start with local state and explicit props. Use tool context when multiple descendants need the same
  state and intermediate components merely relay it. Use Redux for shared domain/app state (`state.md`).
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
  If a native button cannot fit the required structure, use `clickableProps` (shared pieces below).
- Every icon button has an accessible name; every field has a label or `aria-label`.
- Set `aria-pressed` for toggles; menu triggers expose `aria-haspopup` and `aria-expanded`.
- Decorative icons use `aria-hidden`. Use semantic parents for `li`, `dt` and `dd`.
- Check text contrast against the actual background. A token alone does not guarantee contrast for
  every combination. Normal text needs at least 4.5:1; do not use text lighter than gray-500 on white.

## Shared components and helpers

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
