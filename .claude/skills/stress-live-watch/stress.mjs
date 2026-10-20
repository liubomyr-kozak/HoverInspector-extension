// Live watching stress test: drives N real (trusted) user actions across a local multi-page site with
// Playwright, keeps the ground truth, then reads what the extension logged and compares, per use case.
//
// Usage (see SKILL.md): HI_REPO=<checkout> node stress.mjs <actions> <out.json> [reader]
//   HI_EXT=<a dist/chrome-mv3 folder> instead of HI_REPO runs another build (e.g. master's, to compare)
//   reader: "log" (the watch log, default) or "legacy" (builds before the watch log: automationLiveWatchEvents)
import { chromium } from "playwright";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const EXT_SRC = process.env.HI_EXT || (process.env.HI_REPO && path.join(process.env.HI_REPO, "dist/chrome-mv3"));
if (!EXT_SRC || !fs.existsSync(path.join(EXT_SRC, "manifest.json"))) {
  console.error("Set HI_REPO to the checkout you built (yarn build), or HI_EXT to a built extension folder.");
  process.exit(1);
}
const TOTAL = Number(process.argv[2] || 1000);
const OUT = process.argv[3] || "result.json";
const READER = process.argv[4] || "log";
const SEED = Number(process.env.SEED || 7);
const PORT = 8770;
// The test site lives next to this script; everything the run writes goes to the current folder
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), "site");
const BASE = `http://localhost:${PORT}`;

// --- deterministic random
let seed = SEED;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (list) => list[Math.floor(rand() * list.length)];
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));

// --- static site
const server = http
  .createServer((req, res) => {
    const file = path.join(SITE, new URL(req.url, BASE).pathname.replace(/^\/$/, "/shop.html"));
    if (!file.startsWith(SITE) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "content-type": file.endsWith(".css") ? "text/css" : "text/html" });
    res.end(fs.readFileSync(file));
  })
  .listen(PORT);

// --- extension copy with the toolbar handler exposed
const EXT = path.resolve("ext");
fs.rmSync(EXT, { recursive: true, force: true });
fs.cpSync(EXT_SRC, EXT, { recursive: true });
const bgFile = path.join(EXT, "background.js");
fs.writeFileSync(
  bgFile,
  "{const o=chrome.action.onClicked.addListener.bind(chrome.action.onClicked);" +
    "chrome.action.onClicked.addListener=(f)=>{self.__onClicked=f;o(f)};}\n" +
    fs.readFileSync(bgFile, "utf8"),
);

const ctx = await chromium.launchPersistentContext("", {
  channel: "chromium",
  headless: true,
  viewport: { width: 1400, height: 900 },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});
const sw = ctx.serviceWorkers()[0] || (await ctx.waitForEvent("serviceworker"));
await sw.evaluate(() =>
  chrome.storage.local.set({
    automationLiveWatch: { enabled: true, dismissedPatterns: [], mutedFields: [], mode: "smart", limit: 5000 },
  }),
);
await new Promise((r) => setTimeout(r, 500));
// Without the page-start capture script, the first second of every page is lost: say so loudly
const captureScript = READER === "legacy" || (await sw.evaluate(async () => (await chrome.scripting.getRegisteredContentScripts()).length > 0));
if (!captureScript) console.error("WARNING: the live watching capture script is not registered");

async function closeTool() {
  // The Element Inspector opens with the extension and takes the page clicks: close it like a user would
  const close = page.locator("hover-inspector").getByRole("button", { name: /^Close/ }).first();
  if (await close.count()) await close.click();
  await page.waitForTimeout(500);
}
const page = await ctx.newPage();
page.setDefaultTimeout(5000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
await page.goto(`${BASE}/shop.html`);
await sw.evaluate(async (url) => {
  const [tab] = await chrome.tabs.query({ url });
  await self.__onClicked(tab);
}, page.url());
await page.waitForSelector("hover-inspector", { state: "attached", timeout: 15000 });
await page.waitForTimeout(1500);
await closeTool();

// --- ground truth
const truth = [];
let current = "";
const expect = (kind, label, value) => truth.push({ uc: current, kind, label, value, time: Date.now(), url: page.url() });
const pause = (fast) => page.waitForTimeout(fast ? int(10, 40) : int(150, 600));
const pathOf = () => new URL(page.url()).pathname;

async function gotoViaNav(name, file) {
  if (pathOf() === `/${file}`) return;
  await page.locator("nav a", { hasText: name }).click();
  expect("click", name);
  await page.waitForURL(`**/${file}*`);
  expect("navigate", file);
  await pause();
}

async function fill(locator, label, text) {
  await locator.click();
  await page.keyboard.type(text, { delay: 2 });
  expect("input", label, text);
  await pause();
}

const useCases = {
  // Many full page loads: list -> product -> back
  async browse() {
    await gotoViaNav("Shop", "shop.html");
    const id = int(1, 24);
    const tab = pick(["All items", "Even items", "Odd items"]);
    await page.getByRole("tab", { name: tab }).click();
    expect("click", tab);
    await pause();
    const visible = tab === "All items" ? id : tab === "Even items" ? id - (id % 2) || 2 : id % 2 ? id : id - 1;
    await page.getByRole("link", { name: `Product ${visible}`, exact: true }).click();
    expect("click", `Product ${visible}`);
    await page.waitForURL("**/product.html*");
    expect("navigate", "product.html");
    await pause();
    if (rand() < 0.6) {
      await fill(page.getByLabel("Quantity", { exact: true }), "Quantity", String(int(2, 9)));
    }
    if (rand() < 0.5) {
      await page.locator("#size").focus();
      await page.keyboard.press("ArrowDown");
      expect("select", "Size");
      await pause();
    }
    if (rand() < 0.5) {
      const box = page.getByLabel("Gift wrap", { exact: true });
      const checked = await box.isChecked();
      await box.click();
      expect("click", "Gift wrap", checked ? "unchecked" : "checked");
      await pause();
    }
    await page.getByRole("button", { name: "Add to basket" }).click();
    expect("click", "Add to basket");
    await pause();
    if (rand() < 0.3) {
      await page.goBack();
      expect("navigate", "shop.html (back)");
    } else {
      await page.getByRole("link", { name: "Back to shop" }).click();
      expect("click", "Back to shop");
      await page.waitForURL("**/shop.html*");
      expect("navigate", "shop.html");
    }
    await pause();
  },

  // Icon buttons (click lands on <svg>/<path>) on a list that is re-rendered
  async cart() {
    await gotoViaNav("Shop", "shop.html");
    await page.getByRole("tab", { name: "All items" }).click();
    expect("click", "All items");
    await pause();
    for (let i = 0; i < int(3, 8); i++) {
      const id = int(1, 24);
      await page.locator(`[aria-label="Add product ${id}"] path`).click({ force: true });
      expect("click", `Add product ${id}`);
      await pause(rand() < 0.5);
    }
  },

  // A long form, then submit (full page load) and back
  async form() {
    await gotoViaNav("Form", "form.html");
    await fill(page.getByLabel("First name", { exact: true }), "First name", pick(["Ann", "Bob", "Iryna", "Taras"]));
    await fill(page.getByLabel("Last name", { exact: true }), "Last name", pick(["Smith", "Koval", "Lee"]));
    await fill(page.getByLabel("Email", { exact: true }), "Email", `u${int(1, 999)}@example.com`);
    if (rand() < 0.5) await fill(page.getByLabel("Phone", { exact: true }), "Phone", `+380${int(100000, 999999)}`);
    await fill(page.getByLabel("Notes", { exact: true }), "Notes", "Line one and more text");
    await page.locator("select[name=country]").focus();
    await page.keyboard.press("ArrowDown");
    expect("select", "Country");
    await pause();
    const plan = pick(["Basic plan", "Pro plan"]);
    await page.getByLabel(plan, { exact: true }).click();
    expect("click", plan);
    await pause();
    const sub = page.getByLabel("Subscribe", { exact: true });
    const was = await sub.isChecked();
    await sub.click();
    expect("click", "Subscribe", was ? "unchecked" : "checked");
    await pause();
    await fill(page.getByLabel("Bio", { exact: true }), "Bio", "Rich text bio");
    if (rand() < 0.4) {
      await page.getByLabel("Email", { exact: true }).click();
      await page.keyboard.press("Enter");
      expect("keyPress", "Enter");
    } else {
      await page.getByRole("button", { name: "Send form" }).click();
      expect("click", "Send form");
    }
    await page.waitForURL("**/done.html*");
    expect("navigate", "done.html");
    await pause();
    await page.getByRole("link", { name: "Back to form" }).click();
    expect("click", "Back to form");
    await page.waitForURL("**/form.html*");
    expect("navigate", "form.html");
    await pause();
  },

  // SPA: pushState routes, rows re-rendered, elements removed by the click, a menu that disappears
  async spa() {
    await gotoViaNav("App", "app.html");
    for (let i = 0; i < int(4, 9); i++) {
      const r = rand();
      if (r < 0.25) {
        const route = pick(["Inbox", "Sent", "Settings"]);
        const before = page.url();
        await page.getByRole("button", { name: route, exact: true }).click();
        expect("click", route);
        if (page.url() !== before) expect("navigate", `app ${route}`);
      } else if (r < 0.5 && (await page.locator(".row").count())) {
        const row = page.locator(".row span").nth(int(0, (await page.locator(".row").count()) - 1));
        const text = (await row.textContent()).trim();
        await row.click();
        expect("click", text);
      } else if (r < 0.65 && (await page.locator("button[aria-label^=Archive]").count())) {
        const btn = page.locator("button[aria-label^=Archive]").first();
        const label = await btn.getAttribute("aria-label");
        await btn.click();
        expect("click", label);
      } else if (r < 0.8) {
        await page.getByRole("button", { name: "More actions" }).click();
        expect("click", "More actions");
        await pause(true);
        const item = pick(["Rename", "Duplicate"]);
        await page.getByRole("menuitem", { name: item }).click();
        expect("click", item);
      } else {
        if (!(await page.locator("#dn").count())) {
          const before = page.url();
          await page.getByRole("button", { name: "Settings", exact: true }).click();
          expect("click", "Settings");
          if (page.url() !== before) expect("navigate", "app Settings");
          await pause();
        }
        const sw2 = pick(["Dark mode", "Sounds"]);
        await page.getByRole("switch", { name: sw2 }).click();
        expect("click", sw2);
        await pause();
        await fill(page.getByLabel("Display name", { exact: true }), "Display name", `Name ${int(1, 99)}`);
        await page.getByRole("button", { name: "Save name" }).click();
        expect("click", "Save name");
      }
      await pause(rand() < 0.3);
    }
  },

  // Typing + Enter, toggles, and an element removed on mousedown
  async todo() {
    await gotoViaNav("Todo", "todo.html");
    for (let i = 0; i < int(2, 4); i++) {
      const t = `Task ${int(1, 9999)}`;
      await page.getByLabel("New todo", { exact: true }).click();
      await page.keyboard.type(t, { delay: 2 });
      expect("input", "New todo", t);
      await page.keyboard.press("Enter");
      expect("keyPress", "Enter");
      await pause();
    }
    const items = await page.locator("#list li").count();
    if (items) {
      const box = page.locator("#list li input").nth(int(0, items - 1));
      const label = (await box.locator("xpath=..").textContent()).trim();
      const was = await box.isChecked();
      await box.click();
      expect("click", label, was ? "unchecked" : "checked");
      await pause();
      const rm = page.locator("#list li button").first();
      const rmLabel = await rm.getAttribute("aria-label");
      await rm.click();
      expect("click", rmLabel);
      await pause();
    }
  },

  // Rapid repeated clicks on one button
  async rapid() {
    await gotoViaNav("Todo", "todo.html");
    for (let i = 0; i < int(8, 20); i++) {
      await page.getByRole("button", { name: "Count click" }).click({ delay: 0 });
      expect("click", "Count click");
      await page.waitForTimeout(int(15, 60));
    }
  },
};

const weights = [
  ["browse", 3],
  ["cart", 2],
  ["form", 2],
  ["spa", 3],
  ["todo", 2],
  ["rapid", 1],
];
const bag = weights.flatMap(([name, w]) => Array(w).fill(name));
const segments = [];
const started = Date.now();
while (truth.length < TOTAL) {
  current = pick(bag);
  const from = truth.length;
  const t0 = Date.now();
  try {
    await useCases[current]();
  } catch (error) {
    errors.push(`harness ${current}: ${String(error).split("\n")[0]}`);
    await page.goto(`${BASE}/shop.html`).catch(() => undefined);
  }
  segments.push({ uc: current, from, to: truth.length, t0, t1: Date.now() });
  if (segments.length % 10 === 0) console.error(`progress ${truth.length}/${TOTAL} ${Math.round((Date.now() - started) / 1000)}s`);
}
const duration = Date.now() - started;
await page.waitForTimeout(5000);

// --- read what the extension logged
const stored = await sw.evaluate(async (reader) => {
  if (reader === "legacy") {
    const items = await chrome.storage.local.get("automationLiveWatchEvents");
    return items.automationLiveWatchEvents || [];
  }
  // The new log: one chunk per page load, typed text in session storage
  const all = await chrome.storage.local.get(null);
  const session = await chrome.storage.session.get(null);
  const values = Object.assign({}, ...Object.keys(session).filter((k) => k.startsWith("automationLiveWatchValues:")).map((k) => session[k]));
  const hidden = new Set(all.automationLiveWatchHidden || []);
  return Object.keys(all)
    .filter((k) => k.startsWith("automationLiveWatchLog:"))
    .flatMap((k) => all[k])
    .filter((e) => !hidden.has(e.id))
    .map((e) => ({ ...e, typed: values[e.id] }));
}, READER);
await page.screenshot({ path: OUT.replace(/\.json$/, ".png") });

// The raw log also has minor events (focus clicks, Tab...): they are compared as the smart view drops them
const recorded = stored
  .filter((e) => !e.minor)
  .map((e) => ({ kind: e.kind, label: e.label, value: e.value, typed: e.typed, time: e.time, url: e.url, navigation: e.navigation }));
const minor = stored.filter((e) => e.minor).length;

fs.writeFileSync(OUT, JSON.stringify({ total: truth.length, duration, captureScript, truth, recorded, minor, segments, errors }, null, 1));
console.log(JSON.stringify({ actions: truth.length, recorded: recorded.length, duration, errors: errors.slice(0, 10) }));
await ctx.close();
server.close();
