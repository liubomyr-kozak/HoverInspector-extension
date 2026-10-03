import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  auditPage,
  auditPageAsync,
  classifyHeadingLineHeight,
  indexCssVariables,
  isHeadingLike,
  regradeAudit,
  topClasses,
  deltaE,
  findIssues,
  findNearDuplicates,
  isOnGrid,
  scoreIssues,
  type ValueUsage,
} from "../designAudit";

const usage = (value: string, count: number, size?: number): ValueUsage => ({ value, count, size, elements: [] });
const rgba = (r: number, g: number, b: number, a = 1) => ({ r, g, b, a });

describe("deltaE", () => {
  it("is zero for the same colour and small for near-identical ones", () => {
    expect(deltaE(rgba(51, 51, 51), rgba(51, 51, 51))).toBe(0);
    expect(deltaE(rgba(51, 51, 51), rgba(52, 52, 52))).toBeLessThan(1);
  });
  it("is large for clearly different colours", () => {
    expect(deltaE(rgba(255, 0, 0), rgba(0, 0, 255))).toBeGreaterThan(50);
  });
  it("counts a difference in alpha", () => {
    expect(deltaE(rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.5))).toBeGreaterThan(10);
  });
});

describe("isOnGrid", () => {
  it("accepts multiples of 4 and hairlines", () => {
    [1, 2, 4, 8, 16, 24, 32].forEach((px) => expect(isOnGrid(px)).toBe(true));
  });
  it("tolerates sub-pixel rounding", () => {
    expect(isOnGrid(15.6)).toBe(true);
    expect(isOnGrid(16.3)).toBe(true);
  });
  it("rejects values between grid steps", () => {
    [3, 5, 10, 13, 18, 22].forEach((px) => expect(isOnGrid(px)).toBe(false));
  });
});

describe("findNearDuplicates", () => {
  const sizes = [usage("16px", 10, 16), usage("15px", 2, 15), usage("24px", 4, 24)];
  const dist = (a: ValueUsage, b: ValueUsage) => Math.abs((a.size ?? 0) - (b.size ?? 0));

  it("pairs values within the threshold, the more used one first", () => {
    const pairs = findNearDuplicates(sizes, dist, 1);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].map((u) => u.value)).toEqual(["16px", "15px"]);
  });
  it("ignores identical values", () => {
    expect(findNearDuplicates([usage("a", 1, 4), usage("b", 1, 4)], dist, 1)).toHaveLength(0);
  });
});

describe("findIssues", () => {
  const empty = { lowContrast: [], tinyText: [], tightLines: [] };
  const base = {
    colors: { text: [], background: [], border: [] },
    families: [],
    fontSizes: [],
    spacing: [],
    radii: [],
    shadows: [],
  };

  it("finds nothing on a consistent page", () => {
    const issues = findIssues(
      { ...base, spacing: [usage("8px", 5, 8), usage("16px", 5, 16)], fontSizes: [usage("16px", 5, 16), usage("24px", 2, 24)] },
      new Map(),
      empty,
    );
    expect(issues).toEqual([]);
    expect(scoreIssues(issues)).toBe(100);
  });

  it("groups near-identical colours into one issue with pairs", () => {
    const map = new Map([
      ["#333333", rgba(51, 51, 51)],
      ["#343434", rgba(52, 52, 52)],
      ["#FF0000", rgba(255, 0, 0)],
    ]);
    const issues = findIssues(
      { ...base, colors: { text: [usage("#333333", 7), usage("#343434", 1), usage("#FF0000", 2)], background: [], border: [] } },
      map,
      empty,
    );
    const color = issues.filter((i) => i.category === "color");
    expect(color).toHaveLength(1);
    expect(color[0].pairs).toEqual([["#333333", "#343434"]]);
  });

  it("flags spacing off the grid and ranks contrast problems first", () => {
    const issues = findIssues(
      { ...base, spacing: [usage("13px", 8, 13), usage("16px", 2, 16)] },
      new Map(),
      { ...empty, lowContrast: [{ fg: "#AAAAAA", bg: "#FFFFFF", ratio: 2.3, required: 4.5, elements: [] }] },
    );
    expect(issues[0].category).toBe("accessibility");
    expect(issues[0].severity).toBe("high");
    const spacing = issues.find((i) => i.category === "spacing");
    expect(spacing?.values).toEqual(["13px"]);
    expect(spacing?.severity).toBe("medium");
  });
});

describe("spacing grid choice", () => {
  const base = {
    colors: { text: [], background: [], border: [] },
    families: [],
    fontSizes: [],
    spacing: [usage("4px", 3, 4), usage("12px", 6, 12), usage("16px", 6, 16)],
    radii: [],
    shadows: [],
  };
  const none = { lowContrast: [], tinyText: [], tightLines: [] };

  it("isOnGrid checks multiples of the given grid", () => {
    expect(isOnGrid(12, 8)).toBe(false);
    expect(isOnGrid(16, 8)).toBe(true);
    expect(isOnGrid(24, 8)).toBe(true);
    expect(isOnGrid(2, 8)).toBe(true);
  });

  it("is clean on the 4px grid and flags 4px and 12px on the 8px grid", () => {
    expect(findIssues(base, new Map(), none, { grid: 4 }).filter((i) => i.category === "spacing")).toEqual([]);
    const issue = findIssues(base, new Map(), none, { grid: 8 }).find((i) => i.category === "spacing");
    expect(issue?.title).toBe("2 spacing values off the 8px grid");
    expect(issue?.values).toEqual(["4px", "12px"]);
  });
});

describe("heading line height", () => {
  it("classifies line height against the heading's size", () => {
    expect(classifyHeadingLineHeight(32, "48px")).toBe("loose"); // 1.5, inherited body line height
    expect(classifyHeadingLineHeight(32, "38.4px")).toBeNull(); // 1.2
    expect(classifyHeadingLineHeight(32, "44.8px")).toBeNull(); // exactly 1.4
    expect(classifyHeadingLineHeight(32, "28px")).toBe("tight");
    expect(classifyHeadingLineHeight(32, "normal")).toBeNull();
  });

  it("treats h1-h6, role=heading and large short text as headings", () => {
    const h2 = document.createElement("h2");
    const div = document.createElement("div");
    div.textContent = "Big title";
    const role = document.createElement("div");
    role.setAttribute("role", "heading");
    expect(isHeadingLike(h2, 16)).toBe(true);
    expect(isHeadingLike(role, 16)).toBe(true);
    expect(isHeadingLike(div, 28)).toBe(true);
    expect(isHeadingLike(div, 16)).toBe(false);
  });

  it("reports loose and tight headings as separate issues", () => {
    const h = document.createElement("h1");
    const issues = findIssues(
      { colors: { text: [], background: [], border: [] }, families: [], fontSizes: [], spacing: [], radii: [], shadows: [] },
      new Map(),
      { lowContrast: [], tinyText: [], tightLines: [], looseHeadings: [h, h], tightHeadings: [h] },
    );
    const titles = issues.map((i) => i.title);
    expect(titles).toContain("Loose line height on headings");
    expect(titles).toContain("Headings with line height under 1");
    // The overlap risk ranks above the stylistic one
    expect(titles.indexOf("Headings with line height under 1")).toBeLessThan(titles.indexOf("Loose line height on headings"));
  });
});

describe("value sources", () => {
  it("indexes custom properties by resolved px and colour", () => {
    const parseColor = (v: string) => (v === "#2563eb" || v === "rgb(37, 99, 235)" ? { r: 37, g: 99, b: 235, a: 1 } : null);
    const index = indexCssVariables(
      [
        ["--space-4", "16px"],
        ["--space-lg", "1rem"],
        ["--brand", " #2563eb"],
        ["--link", "rgb(37, 99, 235)"],
        ["--shadow", "0 1px 2px rgba(0,0,0,.1)"],
        ["--weight", "600"],
        ["--zero", "0px"],
      ],
      16,
      parseColor,
    );
    expect(index["16px"]).toEqual(["--space-4", "--space-lg"]);
    expect(Object.values(index).flat()).not.toContain("--shadow");
    expect(Object.values(index).flat()).not.toContain("--weight");
    expect(Object.values(index).flat()).not.toContain("--zero");
    const brandKey = Object.keys(index).find((k) => index[k].includes("--brand"));
    expect(brandKey && index[brandKey]).toEqual(["--brand", "--link"]);
  });

  it("lists the most common classes on a value's elements", () => {
    const make = (cls: string) => {
      const el = document.createElement("div");
      el.className = cls;
      return el;
    };
    expect(topClasses([make("btn primary"), make("btn"), make("card")], 2)).toEqual(["btn", "primary"]);
  });
});

describe("chunked scan", () => {
  const build = (n: number) => {
    const root = document.createElement("div");
    for (let i = 0; i < n; i++) {
      const p = document.createElement("p");
      p.textContent = `Item ${i}`;
      p.style.padding = i % 2 ? "8px" : "10px";
      root.appendChild(p);
    }
    document.body.appendChild(root);
    return root;
  };
  // jsdom has no layout; give every element a size so it counts as visible
  const rect = { width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10, x: 0, y: 0, toJSON() {} } as DOMRect;
  let restore: () => void = () => {};
  beforeEach(() => {
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => rect;
    restore = () => (Element.prototype.getBoundingClientRect = original);
  });
  afterEach(() => {
    restore();
    document.body.innerHTML = "";
  });

  it("matches the synchronous scan, reports progress and yields between slices", async () => {
    const root = build(120);
    const progress: number[] = [];
    const result = await auditPageAsync(root, { sliceMs: 0, onProgress: (done) => progress.push(done) });
    const sync = auditPage(root);
    expect(result.scannedElements).toBe(120);
    expect(result.scannedElements).toBe(sync.scannedElements);
    expect(result.spacing.map((s) => s.value)).toEqual(sync.spacing.map((s) => s.value));
    expect(progress.length).toBeGreaterThan(1);
    expect(progress[progress.length - 1]).toBe(120);
  });

  it("stops at maxElements and marks the result truncated", async () => {
    const root = build(80);
    const result = await auditPageAsync(root, { maxElements: 50 });
    expect(result.scannedElements).toBe(50);
    expect(result.truncated).toBe(true);
  });

  it("can be cancelled", async () => {
    const root = build(200);
    const controller = new AbortController();
    const pending = auditPageAsync(root, { sliceMs: 0, signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toThrow(/cancelled/);
  });

  it("regrades for another grid without rescanning", async () => {
    const root = build(10);
    const four = await auditPageAsync(root, { grid: 4 });
    expect(four.issues.find((i) => i.category === "spacing")?.values).toEqual(["10px"]);
    const eight = regradeAudit(four, 8);
    expect(eight.grid).toBe(8);
    expect(eight.scannedElements).toBe(four.scannedElements);
    expect(eight.issues.find((i) => i.category === "spacing")?.title).toBe("1 spacing value off the 8px grid");
  });
});
