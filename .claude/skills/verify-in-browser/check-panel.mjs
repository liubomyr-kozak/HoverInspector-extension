// Opens one Hover Inspector tool in headless Chromium with the built extension and takes a screenshot.
//
// Usage (run from a scratch folder that has playwright in node_modules, see SKILL.md):
//   node check-panel.mjs "<Tool title>" [panel width px] [path to a test .html page]
// Example:
//   node check-panel.mjs "Unit Converter" 320
//
// Output: prints the panel header text and any page errors; saves shots/<Tool>-<width>.png
import { chromium } from "playwright";
import fs from "fs";
import http from "http";
import path from "path";

// Required, so a run from a worktree never silently checks another checkout's build
const REPO = process.env.HI_REPO;
if (!REPO || !fs.existsSync(path.join(REPO, "dist/chrome-mv3/manifest.json"))) {
  console.error('Set HI_REPO to the repo you built, e.g. HI_REPO="$(git rev-parse --show-toplevel)", and run yarn build there first.');
  process.exit(1);
}
const TOOL = process.argv[2] || "Unit Converter";
const WIDTH = Number(process.argv[3] || 440);
const PAGE_FILE = process.argv[4];
const EXT = path.resolve("ext");
const OUT = path.resolve("shots");
const PORT = 8765;

const DEFAULT_PAGE = `<!doctype html><html><head><title>Test page</title></head>
<body style="font:16px sans-serif;margin:24px">
  <main><h1>Test page</h1><p>Some text for the tools to read.</p><button>Page button</button></main>
</body></html>`;

// 1. Copy the built extension and expose the toolbar-button handler (headless Chromium has no toolbar)
if (!fs.existsSync(`${REPO}/dist/chrome-mv3/manifest.json`)) {
  console.error("No build found. Run `yarn build` in the repo first.");
  process.exit(1);
}
fs.rmSync(EXT, { recursive: true, force: true });
fs.cpSync(`${REPO}/dist/chrome-mv3`, EXT, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const bgFile = path.join(EXT, "background.js");
fs.writeFileSync(
  bgFile,
  "{const o=chrome.action.onClicked.addListener.bind(chrome.action.onClicked);" +
    "chrome.action.onClicked.addListener=(f)=>{self.__onClicked=f;o(f)};}\n" +
    fs.readFileSync(bgFile, "utf8"),
);

// 2. Serve the test page over http (the extension does not run on about:blank or file://)
const html = PAGE_FILE ? fs.readFileSync(PAGE_FILE, "utf8") : DEFAULT_PAGE;
const server = http
  .createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(html);
  })
  .listen(PORT);

// 3. Launch Chromium with the extension
const ctx = await chromium.launchPersistentContext("", {
  channel: "chromium",
  headless: true,
  viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});
const sw = ctx.serviceWorkers()[0] || (await ctx.waitForEvent("serviceworker"));
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(`http://localhost:${PORT}/`);

// 4. Turn the extension on in this tab (same as clicking its toolbar button)
await sw.evaluate(async (url) => {
  const [tab] = await chrome.tabs.query({ url });
  await self.__onClicked(tab);
}, page.url());
await page.waitForSelector("hover-inspector", { state: "attached", timeout: 15000 });
await page.waitForTimeout(1500);

// 5. Open the tool from the launcher menu. Playwright locators pierce the open shadow root.
await page.getByRole("button", { name: "More tools and settings" }).click();
await page.getByRole("button", { name: TOOL, exact: true }).click();
// Close the menu if it is still open. Esc with no menu open would switch the extension off.
const menu = page.getByRole("dialog", { name: "Tools and settings" });
if (await menu.isVisible()) await page.keyboard.press("Escape");
await page.waitForTimeout(800);

// 6. Set the panel width: the panel is the first fixed/absolute ancestor of the header container
await page.evaluate((width) => {
  const root = document.querySelector("hover-inspector").shadowRoot;
  let panel = root.querySelector("#popup-header-container");
  while (panel && panel.parentElement && !["fixed", "absolute"].includes(getComputedStyle(panel).position)) {
    panel = panel.parentElement;
  }
  if (panel) panel.style.width = `${width}px`;
}, WIDTH);
await page.waitForTimeout(300);

// 7. Report
const header = await page.evaluate(
  () => document.querySelector("hover-inspector").shadowRoot.querySelector("#popup-header-container")?.textContent,
);
const shot = path.join(OUT, `${TOOL.replace(/\W+/g, "-")}-${WIDTH}.png`);
await page.screenshot({ path: shot });
console.log("header:", header);
console.log("errors:", errors);
console.log("screenshot:", shot);

await ctx.close();
server.close();
