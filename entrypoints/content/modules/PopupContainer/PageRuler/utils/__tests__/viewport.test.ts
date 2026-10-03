import { describe, expect, it } from "vitest";
import { FRAMEWORK_BREAKPOINTS } from "../../data/frameworkBreakpoints";
import {
  describeAspectRatio,
  formatRange,
  getActiveBreakpoint,
  getNextBreakpoint,
  mediaQueryFor,
  readMediaFeatures,
  unitRows,
} from "../viewport";
import { Orientation, type ViewportInfo } from "../../types";

const bootstrap = FRAMEWORK_BREAKPOINTS.find((f) => f.id === "bootstrap")!.breakpoints;

describe("framework breakpoints", () => {
  it("cover every width without gaps or overlaps", () => {
    FRAMEWORK_BREAKPOINTS.forEach(({ breakpoints }) => {
      expect(breakpoints[0].min).toBe(0);
      breakpoints.slice(1).forEach((bp, i) => expect(breakpoints[i].max).toBe(bp.min - 1));
      expect(breakpoints[breakpoints.length - 1].max).toBeUndefined();
    });
  });

  it("uses Bootstrap 5's lg at 992px", () => {
    expect(getActiveBreakpoint(bootstrap, 991)?.name).toBe("md");
    expect(getActiveBreakpoint(bootstrap, 992)?.name).toBe("lg");
    expect(getActiveBreakpoint(bootstrap, 1579)?.name).toBe("xxl");
  });

  it("tells how far the next breakpoint is", () => {
    expect(getNextBreakpoint(bootstrap, 768)).toEqual({ breakpoint: bootstrap[3], distance: 224 });
    expect(getNextBreakpoint(bootstrap, 1400)).toBeUndefined();
  });

  it("formats ranges and media queries", () => {
    expect(formatRange(bootstrap[0])).toBe("< 576px");
    expect(formatRange(bootstrap[2])).toBe("768–991px");
    expect(formatRange(bootstrap[5])).toBe("≥ 1400px");
    expect(mediaQueryFor(bootstrap[0])).toBe("@media (max-width: 575px)");
    expect(mediaQueryFor(bootstrap[2])).toBe("@media (min-width: 768px) and (max-width: 991px)");
    expect(mediaQueryFor(bootstrap[5])).toBe("@media (min-width: 1400px)");
  });
});

describe("describeAspectRatio", () => {
  it("names common ratios in the viewport's orientation", () => {
    expect(describeAspectRatio(1920, 1080)).toBe("1.78 (≈ 16:9)");
    expect(describeAspectRatio(1080, 1920)).toBe("1.78 (≈ 9:16)");
    expect(describeAspectRatio(1440, 900)).toBe("1.60 (≈ 16:10)");
  });

  it("shows a short exact ratio, or just the number", () => {
    expect(describeAspectRatio(390, 844)).toBe("2.16 (195:422)");
    expect(describeAspectRatio(1579, 929)).toBe("1.70");
    expect(describeAspectRatio(0, 900)).toBe("");
  });
});

describe("readMediaFeatures", () => {
  it("reports the first matching value and 'not supported' when none matches", () => {
    const matching = new Set(["(prefers-color-scheme: dark)", "(pointer: fine)"]);
    const features = readMediaFeatures((query) => matching.has(query));
    expect(features.find((f) => f.feature === "prefers-color-scheme")?.value).toBe("dark");
    expect(features.find((f) => f.feature === "pointer")?.value).toBe("fine");
    expect(features.find((f) => f.feature === "hover")?.value).toBe("not supported");
  });
});

describe("unitRows", () => {
  it("includes page-dependent and absolute units", () => {
    const info = { rootFontSize: 10, innerWidth: 1280, innerHeight: 800, devicePixelRatio: 2, orientation: Orientation.Landscape } as ViewportInfo;
    const rows = Object.fromEntries(unitRows(info));
    expect(rows["1 rem"]).toBe("10px");
    expect(rows["1 vw"]).toBe("12.8px");
    expect(rows["1 device px"]).toBe("0.5px");
    expect(rows["1 in"]).toBe("96px");
    expect(rows["1 cm"]).toBe("37.795px");
    expect(rows["1 pt"]).toBe("1.333px");
  });
});
