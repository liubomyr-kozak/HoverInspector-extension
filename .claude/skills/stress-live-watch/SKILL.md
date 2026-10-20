---
name: stress-live-watch
description: Stress test Automation live watching with 1000-2000 real user actions across a local multi-page site and compare what the watch log noted with the ground truth, per use case. Use after any change to the capture, the watch log, its storage or the smart view.
---

# Stress test live watching

Unit tests cover the smart view, the selection and the replay session. They do not show whether the
capture keeps up with a real person: page loads, forms submitted with Enter, single-page apps, buttons
that remove themselves on mousedown, rapid clicks. This test does.

`stress.mjs` drives Chromium with the built extension through Playwright with trusted input (real mouse
and keyboard), in a human pace (150-600 ms between actions, bursts of 10-40 ms). It writes down every
action it does (the ground truth), then reads the watch log from extension storage. `compare.mjs`
aligns both lists per use case (LCS on kind and element name) and prints what was matched, missing and
extra.

Use cases (pages in `site/`):

| Use case | What it does |
| --- | --- |
| browse | list → product page (full load) → fill, choose, tick → back link or browser Back |
| cart | icon buttons where the click lands on an `<svg><path>`, on a list that is re-rendered |
| form | long form (text, email, textarea, select, radio, checkbox, contenteditable), submit by button or Enter, page load, back |
| spa | pushState routes, rows re-rendered, a button that removes its row, a menu that disappears, switches, a field + Save |
| todo | type + Enter, tick a new row, a Remove button that removes the row on mousedown |
| rapid | 8-20 clicks on one button, 15-60 ms apart |

## Steps

```bash
REPO="$(git rev-parse --show-toplevel)" && cd "$REPO" && yarn build
mkdir -p /tmp/hi-stress && cd /tmp/hi-stress
cp -r "$REPO/.claude/skills/stress-live-watch/." .   # scripts and site/; Node resolves playwright from here
ln -sfn /opt/node-tools/node_modules node_modules   # or "$(npm root -g)"; never run npm in the repo
HI_REPO="$REPO" PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node stress.mjs 2000 run.json
node compare.mjs run.json
```

2000 actions take about 10 minutes. `SEED=<n>` changes the random order of the use cases. The run
leaves `run.json` (truth and log) and `run.png` (the last page) in the current folder.

To compare with another build (for example master), build it in its own worktree and pass
`HI_EXT=<that worktree>/dist/chrome-mv3`; builds from before the watch log need the reader `legacy`
as the third argument.

## Reading the result

- `rate` is matched / expected. Anything under 100% names its missing actions in `missingSamples`.
- Navigations are compared by kind only; key presses by the key; checkbox clicks with their state.
- The comparison uses the raw log without minor events (focus clicks, Tab, arrows), which is what the
  smart view starts from.
- `errors` lists page errors and harness failures (a locator that timed out). A harness failure is a
  bug in the test page or the script, not in the extension; fix it before trusting the numbers.
