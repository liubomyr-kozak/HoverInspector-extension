---
name: verify-in-browser
description: Check a Hover Inspector UI change in a real headless Chromium with the built extension, at 320px and 440px panel width, and look at the screenshot. Use after any change to a tool panel, the launcher, styles or overlays, before committing, and when reproducing a UI bug.
---

# Verify in the browser

Unit tests do not catch layout, focus or shadow-root bugs. Do this check for every UI change.

The script `check-panel.mjs` in this folder does the work. It:

1. copies `dist/chrome-mv3/` and patches `background.js` so it can press the toolbar button;
2. serves a test page on `http://localhost:8765/`;
3. starts headless Chromium with the extension and turns it on;
4. opens your tool from the launcher menu ("More tools and settings" → the tool title);
5. sets the panel width and saves a screenshot in `shots/`;
6. prints the header text and every page error.

## Steps

1. Build the extension. Run in your checkout (this also works in a git worktree):

   ```bash
   REPO="$(git rev-parse --show-toplevel)" && cd "$REPO" && yarn build
   ```

2. Make a scratch folder outside the repo and link Playwright into it. Use your session scratchpad
   directory if you have one; otherwise `/tmp/hi-check`.

   ```bash
   mkdir -p /tmp/hi-check && cd /tmp/hi-check
   ln -sfn /opt/node-tools/node_modules node_modules
   cp "$REPO/.claude/skills/verify-in-browser/check-panel.mjs" .
   ```

   If `/opt/node-tools/node_modules/playwright` does not exist, use `ln -sfn "$(npm root -g)" node_modules`
   instead. (This only reads a path. Never run npm inside the repo.)

3. Run the check at both widths. The first argument is the tool title exactly as in
   `entrypoints/content/modules/Launcher/LauncherIcons.ts` (`title: "..."`).

   ```bash
   HI_REPO="$REPO" PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node check-panel.mjs "Unit Converter" 320
   HI_REPO="$REPO" PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node check-panel.mjs "Unit Converter" 440

   `HI_REPO` must be your checkout (the one you just built). The script stops with an error without it.
   ```

   Optional third argument: a path to your own `.html` test page.

4. Open both screenshots with the Read tool (the script prints the paths). Check:
   - the header shows the tool icon and title;
   - nothing is cut off, overlapping or scrolling sideways at 320px;
   - texts are readable (dark gray on white, nothing pale);
   - selected items use a light blue background, not an outline.

5. The output line `errors: []` must be empty. Any error is a bug to fix.

6. Delete nothing in the repo; all files of this check are in the scratch folder.

## Going further (edit your copy of the script, never the repo copy for one-off checks)

Add steps after step 5 of the script. Playwright locators pierce the open shadow root of
`<hover-inspector>`, so you can use roles and names:

```js
await page.getByRole("button", { name: "Count again" }).click();
await page.getByRole("switch", { name: "Count only the main content" }).click();
await page.getByLabel("Value").fill("24");
```

Check an antd overlay opens inside the extension (not in the page body):

```js
await page.getByRole("button", { name: "Actions for Checkout" }).click();
const inShadow = await page.evaluate(() =>
  !!document.querySelector("hover-inspector").shadowRoot.querySelector(".ant-popover:not(.ant-popover-hidden)"),
);
// document.querySelector does not look inside shadow roots, so a match here means the page body
const inPageBody = await page.evaluate(() => !!document.querySelector(".ant-popover"));
console.log({ inShadow, inPageBody }); // expect { inShadow: true, inPageBody: false }
```

Check keyboard focus (ring only while tabbing):

```js
await page.keyboard.press("Tab");
const keyboardMode = await page.evaluate(() => document.querySelector("hover-inspector").hasAttribute("data-hi-keyboard"));
console.log({ keyboardMode }); // true after Tab, false after a mouse click
```

Read something inside the shadow root:

```js
const text = await page.evaluate(() => document.querySelector("hover-inspector").shadowRoot.querySelector("#popup-header-container")?.textContent);
```

Rules:

- **Never** press Escape when no menu or dialog is open: Esc switches the extension off.
- **Never** commit the scratch folder, screenshots or a modified script.
- Tools with `multipleView: true` (Element Inspector, Color Picker) share the panel with each other, so
  the header can show two tools.
