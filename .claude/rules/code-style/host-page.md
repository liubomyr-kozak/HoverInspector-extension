---
paths:
  - "entrypoints/content/index.tsx"
  - "entrypoints/content/style.css"
  - "entrypoints/content/modules/EventListenerProvider.tsx"
  - "entrypoints/shared/utils/**"
  - "entrypoints/shared/frameAgent/**"
  - "entrypoints/shared/components/HighlightOverlay/**"
  - "entrypoints/frame-agent.ts"
---

# Code style: working with the host page

## Page interaction and cleanup

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

## Frames

Use `watchSameOriginFrames` from `shared/utils/frames.ts` for accessible frames.
Cross-origin frames use `frame-agent.ts` and `shared/frameAgent/agent.ts`; the top frame draws the UI.

When extending the frame protocol:

1. Add the field to its type in `shared/frameAgent/protocol.ts`.
2. Validate it in the sanitizer with a type check and size/length limit.
3. Add invalid-input and boundary cases in `shared/frameAgent/__tests__/protocol.test.ts`.
4. For a computed property, extend the whitelist source (`styleRulesList` or `CARD_COMPUTED_PROPS`).

Keep page content on extension messaging. Preserve the existing random-key registration mechanism and
agent cleanup on deactivate. Inspect protocol, hub and relay definitions before changing that boundary.
