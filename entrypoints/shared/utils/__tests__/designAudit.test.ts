import { describe, expect, it } from "vitest";
import {
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
