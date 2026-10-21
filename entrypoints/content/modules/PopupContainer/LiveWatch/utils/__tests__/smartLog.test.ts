import { describe, expect, it } from "vitest";
import { StepType } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types";
import { NavigationKind, WatchEvent, WatchEventKind, WatchLogMode } from "../../types";
import { itemsToSteps, logItems, NAVIGATION_CAUSE_MS, rawItems, smartItems, sourceIdsOf } from "../smartLog";

let clock = 0;
let counter = 0;

const event = (kind: WatchEventKind, name: string, over: Partial<WatchEvent> = {}): WatchEvent => ({
  id: `e${counter++}`,
  kind,
  xpath: name ? `//*[@id="${name}"]` : "",
  label: name,
  origin: "https://shop.test",
  url: "https://shop.test/list",
  time: (clock += 500),
  ...over,
});

const click = (name: string, over: Partial<WatchEvent> = {}) => event(WatchEventKind.CLICK, name, over);
const fill = (name: string, over: Partial<WatchEvent> = {}) => event(WatchEventKind.INPUT, name, over);
const key = (name: string, combo: string) => event(WatchEventKind.KEY_PRESS, name, { value: combo });
const page = (url: string, navigation = NavigationKind.LOAD, over: Partial<WatchEvent> = {}) =>
  event(WatchEventKind.NAVIGATE, "", { url, label: url.split("/").pop() || url, navigation, ...over });

const rows = (events: WatchEvent[]) =>
  smartItems(events).map((item) => `${item.event.kind}:${item.event.label}${item.repeat > 1 ? `x${item.repeat}` : ""}${item.opensUrl ? `->${item.opensUrl}` : ""}`);

describe("smartItems", () => {
  it("drops minor events: clicks on text, focus clicks, Tab and arrow keys", () => {
    const events = [click("text", { minor: true }), click("email", { minor: true }), fill("email"), key("email", "Tab"), click("save")];
    events[3].minor = true;
    expect(rows(events)).toEqual(["input:email", "click:save"]);
  });

  it("merges typing in the same field and keeps the last event's text, under the first row id", () => {
    const first = fill("name");
    const second = fill("name");
    const [item] = smartItems([first, second]);
    expect(item.id).toBe(first.id);
    expect(item.event).toBe(second);
    expect(item.sourceIds).toEqual([first.id, second.id]);
  });

  it("keeps typing in the same field apart when something happened in between", () => {
    expect(rows([fill("name"), click("bold"), fill("name")])).toEqual(["input:name", "click:bold", "input:name"]);
  });

  it("folds the page a click opened into the click", () => {
    const link = click("Product 3");
    const opened = page("https://shop.test/product?id=3");
    const items = smartItems([link, opened, click("Add")]);
    expect(rows([link, opened])).toEqual(["click:Product 3->https://shop.test/product?id=3"]);
    expect(items[0].sourceIds).toEqual([link.id, opened.id]);
  });

  it("folds a form submitted with Enter into the key press", () => {
    expect(rows([fill("q"), key("q", "Enter"), page("https://shop.test/search")])).toEqual([
      "input:q",
      "keyPress:q->https://shop.test/search",
    ]);
  });

  it("keeps a page load that came long after the click, and back / forward, as its own step", () => {
    const late = [click("Later"), page("https://shop.test/a", NavigationKind.LOAD, { time: (clock += NAVIGATION_CAUSE_MS + 1000) })];
    expect(rows(late)).toEqual(["click:Later", "navigate:a"]);
    expect(rows([click("Next"), page("https://shop.test/b", NavigationKind.BACK_FORWARD)])).toEqual(["click:Next", "navigate:b"]);
  });

  it("merges a redirect and a second report of the same page", () => {
    const items = smartItems([page("https://shop.test/login"), page("https://shop.test/home"), page("https://shop.test/home")]);
    expect(items).toHaveLength(1);
    expect(items[0].event.url).toBe("https://shop.test/home");
    expect(items[0].sourceIds).toHaveLength(3);
  });

  it("does not merge a page reached again after it was opened by a click if time passed", () => {
    const events = [click("Shop"), page("https://shop.test/list"), page("https://shop.test/list", NavigationKind.SAME_DOCUMENT, { time: (clock += 60000) })];
    expect(rows(events)).toEqual(["click:Shop->https://shop.test/list", "navigate:list"]);
  });

  it("counts the same click done several times in a row", () => {
    expect(rows([click("Next"), click("Next"), click("Next"), click("Back")])).toEqual(["click:Nextx3", "click:Back"]);
  });

  it("does not count a checkbox ticked and unticked as one repeated click", () => {
    expect(rows([click("Gift", { value: "checked" }), click("Gift", { value: "unchecked" })])).toEqual(["click:Gift", "click:Gift"]);
  });

  it("does not count repeats of a click that opened a page", () => {
    expect(rows([click("More"), page("https://shop.test/2"), click("More")])).toEqual(["click:More->https://shop.test/2", "click:More"]);
  });

  it("handles 2000 events quickly", () => {
    const many: WatchEvent[] = [];
    for (let i = 0; i < 500; i++) many.push(click(`item${i % 7}`), fill("qty"), fill("qty"), page(`https://shop.test/p${i}`));
    const started = performance.now();
    const items = smartItems(many);
    expect(performance.now() - started).toBeLessThan(50);
    expect(sourceIdsOf(items)).toHaveLength(many.length);
  });
});

describe("rawItems and logItems", () => {
  it("lists every event in raw mode, minor ones too", () => {
    const events = [click("text", { minor: true }), fill("a"), fill("a")];
    expect(rawItems(events).map((item) => item.id)).toEqual(events.map((e) => e.id));
    expect(logItems(events, WatchLogMode.RAW)).toHaveLength(3);
    expect(logItems(events, WatchLogMode.SMART)).toHaveLength(1);
  });
});

describe("itemsToSteps", () => {
  it("turns rows into scenario steps with the typed text, repeats and pages", () => {
    const name = fill("name");
    const items = smartItems([page("https://shop.test/form"), name, click("Next"), click("Next")]);
    const steps = itemsToSteps(items, new Map([[name.id, "Ann"]]));
    expect(steps.map((step) => step.type)).toEqual([StepType.NAVIGATE, StepType.INPUT, StepType.CLICK, StepType.CLICK]);
    expect(steps[0]).toMatchObject({ value: "https://shop.test/form", enableNavigation: true });
    expect(steps[1]).toMatchObject({ xpath: '//*[@id="name"]', value: "Ann" });
  });

  it("leaves the text out when it is not known (the replay asks for it)", () => {
    const [step] = itemsToSteps(smartItems([fill("password", { sensitive: true })]), new Map());
    expect(step.type).toBe(StepType.INPUT);
    expect(step.value).toBeUndefined();
  });

  it("plays a click that opened a page as the click alone", () => {
    const steps = itemsToSteps(smartItems([click("Product"), page("https://shop.test/p")]), new Map());
    expect(steps).toHaveLength(1);
    expect(steps[0].type).toBe(StepType.CLICK);
  });
});
