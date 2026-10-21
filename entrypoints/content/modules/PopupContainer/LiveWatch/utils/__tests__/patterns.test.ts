import { describe, expect, it } from "vitest";
import { ScenarioMap, StepType } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types";
import { WatchEvent, WatchEventKind } from "../../types";
import {
  describeEvent,
  eventsToSteps,
  findFieldScenarios,
  findPatterns,
  isPatternSaved,
  matchScenarioContinuation,
  sanitizeEvents,
  SESSION_GAP_MS,
} from "../patterns";

let clock = 0;
let counter = 0;

/** A click on the element named `name` (its xpath is //*[@id="name"]) */
const click = (name: string, over: Partial<WatchEvent> = {}): WatchEvent => ({
  id: `e${counter++}`,
  kind: WatchEventKind.CLICK,
  xpath: `//*[@id="${name}"]`,
  label: name,
  origin: "https://example.com",
  time: (clock += 1000),
  ...over,
});

const fill = (name: string) => click(name, { kind: WatchEventKind.INPUT });

const names = (events: WatchEvent[]) => events.map((event) => event.label);

describe("findPatterns", () => {
  it("finds a sequence repeated twice", () => {
    const events = [click("menu"), click("new"), fill("title"), click("save"), click("other")];
    events.push(click("menu"), click("new"), fill("title"), click("save"));
    const [pattern] = findPatterns(events);
    expect(names(pattern.events)).toEqual(["menu", "new", "title", "save"]);
    expect(pattern.occurrences).toBe(2);
    expect(pattern.lastEnd).toBe(events.length);
  });

  it("needs three repeats for a two-step sequence", () => {
    const twice = [click("a"), click("b"), click("x"), click("a"), click("b")];
    expect(findPatterns(twice)).toEqual([]);
    const thrice = [...twice, click("y"), click("a"), click("b")];
    expect(names(findPatterns(thrice)[0].events)).toEqual(["a", "b"]);
  });

  it("ignores one action repeated (a Next button)", () => {
    expect(findPatterns([click("next"), click("next"), click("next"), click("next"), click("next")])).toEqual([]);
  });

  it("keeps the whole loop, not its rotations or parts", () => {
    const events = [click("a"), click("b"), click("c"), click("a"), click("b"), click("c"), click("a"), click("b"), click("c")];
    const patterns = findPatterns(events);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].events).toHaveLength(3);
    expect(patterns[0].occurrences).toBe(3);
  });

  it("does not join actions across a long pause", () => {
    const events = [click("a"), click("b"), click("c")];
    events.push(click("a", { time: (clock += SESSION_GAP_MS + 1) }), click("b"), click("c"));
    // The two occurrences are in different sessions, but each is whole: still a pattern
    expect(findPatterns(events)).toHaveLength(1);
    const split = [click("p"), click("q", { time: (clock += SESSION_GAP_MS + 1) }), click("p"), click("q", { time: (clock += SESSION_GAP_MS + 1) })];
    expect(findPatterns(split)).toEqual([]);
  });

  it("treats typing in the same field as the same action, whatever the text", () => {
    const events = [fill("search"), click("go"), click("z"), fill("search"), click("go")];
    events[0].value = "one";
    events[3].value = "two";
    // Two-step sequences need three repeats
    events.push(fill("search"), click("go"));
    expect(names(findPatterns(events)[0].events)).toEqual(["search", "go"]);
  });

  it("gives the same id to the same pattern found later", () => {
    const first = findPatterns([click("a"), click("b"), click("c"), click("a"), click("b"), click("c")])[0];
    const second = findPatterns([click("x"), click("a"), click("b"), click("c"), click("a"), click("b"), click("c")])[0];
    expect(first.id).toBe(second.id);
  });

  it("finds a whole round of work when each round opens another row", () => {
    // Login, open the admin list, open a row (another one each round, by id), edit, close
    const round = (row: number, guid: string) => [
      fill("user"),
      fill("password"),
      click("sign-in"),
      click("admin"),
      click(`row-${row}`, { label: String(row), xpath: `//table/tbody/tr[${row + 1}]/td[1]/a` }),
      click("org", { label: "Organizations", xpath: `//a[@href="/administration/${guid}/organizations"]` }),
      click("edit"),
      fill("name"),
      click("save"),
      click("close"),
    ];
    const events = [
      ...round(0, "01a0e93f-a19c-4f1e-9d1b-1c2d3e4f5a6b"),
      click("other"),
      ...round(4, "01a0392f-da3e-4b7a-8c9d-0e1f2a3b4c5d"),
      click("other"),
      ...round(2, "7f3a92c1-0b4d-4e8f-a1b2-c3d4e5f60718"),
    ];
    const [pattern] = findPatterns(events);
    expect(pattern.events).toHaveLength(10);
    expect(pattern.occurrences).toBe(3);
    // The freshest round is played: its row and its link
    expect(pattern.events[4].label).toBe("2");
  });

  it("keeps two buttons found by position apart by their names", () => {
    const nav = (n: number, label: string) => click(label, { label, xpath: `//nav/a[${n}]` });
    const events = [nav(1, "Admin"), nav(2, "Settings"), click("save"), nav(3, "Reports"), nav(4, "Billing"), click("save")];
    expect(findPatterns(events)).toEqual([]);
  });

  it("treats the same named step reached another way as one step", () => {
    // "Admin" from the menu or the breadcrumb, a table cell found as the <td> or the <div> inside it
    const round = (admin: string, cell: string, count: number) => [
      click("Admin", { label: "Admin", xpath: admin }),
      click(`cell-${count}`, { label: String(count), xpath: `${cell}[normalize-space(.)="${count}"]` }),
      click("venue"),
      click("manage"),
    ];
    const events = [
      ...round('//a[normalize-space(.)="Admin"]', "//td", 5),
      ...round('//ul[@class="breadcrumb"]//a[normalize-space(.)="Admin"]', "//div", 13),
      ...round('//a[normalize-space(.)="Admin"]', "//div", 11),
    ];
    const [pattern] = findPatterns(events);
    expect(names(pattern.events)).toEqual(["Admin", "11", "venue", "manage"]);
    expect(pattern.occurrences).toBe(3);
  });

  it("counts rounds with a step more, less or another as the same chain", () => {
    const round = (...extra: WatchEvent[][]) => [
      click("admin"),
      click("org"),
      click("venue"),
      click("manage"),
      click("create"),
      ...(extra[0] ?? [click("best-available")]),
      click("cancel"),
      click("home"),
    ];
    const events = [
      ...round(),
      ...round([click("pick-a-seat")]),
      ...round([click("best-available"), click("details")]),
      ...round(),
    ];
    const patterns = findPatterns(events);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].occurrences).toBe(4);
    expect(names(patterns[0].events)).toEqual(["admin", "org", "venue", "manage", "create", "best-available", "cancel", "home"]);
  });

  it("does not offer a chain that only joins the end of one round to the start of the next", () => {
    const round = (row: string) => [click("admin"), click(row, { label: row }), click("venue"), click("manage")];
    const events = [...round("5"), click("cancel"), ...round("13"), click("cancel"), ...round("2"), ...round("11")];
    const patterns = findPatterns(events);
    expect(patterns).toHaveLength(1);
    expect(names(patterns[0].events)[0]).toBe("admin");
  });

  it("handles a full buffer of 1000 events quickly", () => {
    const events: WatchEvent[] = [];
    for (let i = 0; i < 1000; i++) events.push(click(`el${i % 37}`));
    const start = performance.now();
    findPatterns(events);
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe("saved scenarios", () => {
  const scenarios: ScenarioMap = {
    sc1: {
      title: "Create task",
      repeat: 1,
      data: [
        { type: StepType.NAVIGATE, value: "https://example.com" },
        { type: StepType.CLICK, xpath: '//*[@id="new"]' },
        { type: StepType.INPUT, xpath: '//*[@id="title"]', alternativeXpaths: ["//input[1]"], value: "Hi" },
        { type: StepType.WAIT, value: "100" },
        { type: StepType.CLICK, xpath: '//*[@id="save"]' },
      ],
    },
  };

  it("offers to play the rest of a scenario the user started by hand", () => {
    const match = matchScenarioContinuation([click("x"), click("new"), fill("title")], scenarios);
    expect(match).toEqual({ scenarioId: "sc1", title: "Create task", nextStepIndex: 3, remaining: 1 });
  });

  it("finds the scenarios that use a field by any of its locators", () => {
    expect(findFieldScenarios(["//input[1]"], scenarios)).toEqual([
      { scenarioId: "sc1", title: "Create task", stepIndex: 2, stepCount: 5 },
    ]);
    expect(findFieldScenarios(['//*[@id="nope"]'], scenarios)).toEqual([]);
  });

  it("knows when a pattern is already a scenario", () => {
    const events = [click("new"), fill("title"), click("save"), click("new"), fill("title"), click("save")];
    expect(isPatternSaved(findPatterns(events)[0], scenarios)).toBe(true);
    const other = [click("new"), click("save"), click("new"), click("save"), click("new"), click("save")];
    expect(isPatternSaved(findPatterns(other)[0], scenarios)).toBe(false);
  });
});

describe("eventsToSteps", () => {
  it("uses the typed text when it is known and keeps select values and keys", () => {
    const events = [
      fill("title"),
      click("country", { kind: WatchEventKind.SELECT, value: "UA" }),
      click("title", { kind: WatchEventKind.KEY_PRESS, value: "Enter" }),
      fill("note"),
    ];
    const steps = eventsToSteps(events, new Map([['//*[@id="title"]', "Hello"]]));
    expect(steps.map((step) => [step.type, step.value])).toEqual([
      [StepType.INPUT, "Hello"],
      [StepType.SELECT, "UA"],
      [StepType.KEY_PRESS, "Enter"],
      [StepType.INPUT, undefined],
    ]);
  });
});

describe("describeEvent", () => {
  it("names the action and the element", () => {
    expect(describeEvent({ kind: WatchEventKind.CLICK, label: "Save" })).toBe('Click "Save"');
    expect(describeEvent({ kind: WatchEventKind.CLICK, label: "Agree", value: "checked" })).toBe('Tick "Agree"');
    expect(describeEvent({ kind: WatchEventKind.INPUT, label: "" })).toBe("Fill the element");
    expect(describeEvent({ kind: WatchEventKind.KEY_PRESS, label: "", value: "Enter" })).toBe("Press Enter");
  });
});

describe("sanitizeEvents", () => {
  it("keeps only well-formed stored events", () => {
    const good = click("ok");
    expect(sanitizeEvents([good, null, { id: 1 }, { ...good, kind: "scroll" }])).toEqual([good]);
    expect(sanitizeEvents("nope")).toEqual([]);
  });
});
