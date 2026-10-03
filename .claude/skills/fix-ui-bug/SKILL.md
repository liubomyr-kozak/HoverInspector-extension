---
name: fix-ui-bug
description: Fix a visual or interaction bug in a Hover Inspector panel (clipped or overlapping layout, overlay in the wrong place, focus ring problems, contrast, broken keyboard use). Reproduce it in Chromium first, fix the root cause, then verify at 320px and 440px. Use when the user reports something that looks or behaves wrong in the extension UI.
---

# Fix a UI bug

Do the steps in order. Do not skip step 1: a fix you have not seen fail and then pass is a guess.

## Step 1. Reproduce

1. Build: `cd /home/user/hoverinspector-extension && yarn build`.
2. Set up the browser check as described in `.claude/skills/verify-in-browser/SKILL.md` (scratch folder,
   `node_modules` link, copy of `check-panel.mjs`).
3. Run it for the tool with the bug at the width where it shows (try 320 first):

   ```bash
   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node check-panel.mjs "<Tool title>" 320
   ```

4. If the bug needs clicks or typing, add them to your scratch copy of the script after step 5 in it
   (examples in the verify-in-browser skill). If it needs a special page (dark page, zoom, transform,
   long page, iframes), write that page as an `.html` file in the scratch folder and pass its path as the
   third argument.
5. Open the screenshot with the Read tool. Write down in one sentence what is wrong.
6. If you cannot reproduce it, stop and tell the user what you tried. Do not change code blindly.

## Step 2. Find the root cause

Look for the cause in this order. These caused most past UI bugs in this repo:

| Symptom | Usual cause | Fix |
| --- | --- | --- |
| Dropdown, select, popover or tooltip unstyled, off screen or missing | antd overlay rendered into the page's `document.body` | Remove a wrong `getPopupContainer`, or pass `shadowBody` from `AutomationScenarios/utils/popupContainer.ts` (CODE_STYLE §8.3) |
| Popconfirm/popover wider than the panel | No max width, wrong placement | `overlayStyle={{ maxWidth: 280 }}`, `placement="bottomRight"` |
| Text or buttons cut off at 320px | Flex child without `min-w-0`, fixed widths, no wrapping | `min-w-0`, `truncate`, `flex-wrap`, remove fixed widths |
| Header title shows two letters | Title text not in `FeatureTitleText`, or header buttons not in `PortalModalHeaderButtons` | Use both (CODE_STYLE §6.1) |
| Blue outline after a mouse click | Own `:focus`/`focus:ring-*` style | Delete it; the global rule handles focus (CODE_STYLE §8.4) |
| No focus ring when tabbing | Clickable `div`/`span`, or a library removing outlines | Use a `button`/`clickableProps`; for libraries add a rule under `:host([data-hi-keyboard])` |
| Selected item has a ring or outline | Old selection style | Tint: `bg-blue-50 border-blue-300` / `tokens.color.primaryBg` (CODE_STYLE §8.5) |
| Text too pale | Colour lighter than `gray-500` or a hard-coded hex | Token colour (CODE_STYLE §8.1) |
| Sizes wrong on some sites | `rem` in styled-components or inline styles | Use `px` |
| Esc closes the whole extension instead of the popup | Your handler does not stop the event | `event.preventDefault(); event.stopPropagation();` in a capture listener, or `usePopoverFocus` |
| Listener or overlay stays after closing the tool | Missing `useEffect` cleanup | Return a cleanup that removes it |

Rules:

- Fix the cause in the component that owns it. **Never** hide a problem with `!important`, a larger
  `z-index`, `overflow: hidden` on the panel, or a check for one specific website.
- If the same mistake exists in a shared component (`entrypoints/shared/components/`), fix it there once.
- Keep the change small. Do not restyle unrelated parts.

## Step 3. Verify

1. `yarn build`.
2. Run the same check again at **320** and **440**:

   ```bash
   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node check-panel.mjs "<Tool title>" 320
   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node check-panel.mjs "<Tool title>" 440
   ```

3. Open both screenshots. The bug is gone and nothing else changed for the worse.
4. `errors: []` in the output.
5. If the fix touched focus or keyboard use: press Tab in the script and check `data-hi-keyboard` is set
   and the ring is visible; click with the mouse and check no ring is drawn.
6. If the fix touched an overlay: check it is inside the shadow root and not in `document.body`
   (snippet in the verify-in-browser skill).
7. `yarn test` passes.
8. If the root cause was logic (a calculation, a parser), extract it to `utils/` and add a test that fails
   without the fix.

## Step 4. Commit

Subject: `<Area>: <what now works>`, for example `Keep the scenario delete confirmation inside the panel`.
Body: what the user saw before, why it happened, what they see now. See `docs/CODE_STYLE.md` §17.
