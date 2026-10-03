import { describe, expect, it } from "vitest";

import {
  CARD_COMPUTED_PROPS,
  CARD_PROPERTIES,
  CardSource,
  contrastRatio,
  defaultConfig,
  formatBox,
  formatColor,
  formatContrast,
  formatFontFamily,
  formatPx,
  formatShadow,
  formatTransform,
  formatTransition,
  formatTypeScale,
  implicitRole,
  normalizeConfig,
  parseColor,
  replaceColors,
  resolveCard,
  SECTIONS,
  splitTopLevel,
} from "../catalog";

const source = (computed: Record<string, string>, over: Partial<CardSource> = {}): CardSource => ({
  get: (p) => computed[p] ?? "",
  tag: "div",
  isSvg: false,
  hasText: true,
  width: 200,
  height: 40,
  role: null,
  ariaLabel: null,
  alt: null,
  effectiveBg: "rgb(255, 255, 255)",
  ...over,
});

const noBorder = Object.fromEntries(
  ["top", "right", "bottom", "left"].flatMap((s) => [
    [`border-${s}-width`, "0px"],
    [`border-${s}-style`, "none"],
    [`border-${s}-color`, "rgb(0, 0, 0)"],
  ]),
);

describe("formatting", () => {
  it("rounds px values and leaves keywords alone", () => {
    expect(formatPx("12.345678px")).toBe("12.35px");
    expect(formatPx("auto")).toBe("auto");
    expect(formatPx("10px 0.333px")).toBe("10px 0.33px");
    expect(formatPx("")).toBe("");
  });

  it("collapses four sides to the shortest shorthand", () => {
    expect(formatBox("8px", "8px", "8px", "8px")).toBe("8px");
    expect(formatBox("8px", "16px", "8px", "16px")).toBe("8px 16px");
    expect(formatBox("8px", "16px", "4px", "16px")).toBe("8px 16px 4px");
    expect(formatBox("1px", "2px", "3px", "4px")).toBe("1px 2px 3px 4px");
    expect(formatBox("", "", "", "")).toBe("0px");
  });

  it("parses rgb, rgba, space syntax and hex", () => {
    expect(parseColor("rgb(37, 99, 235)")).toEqual({ r: 37, g: 99, b: 235, a: 1 });
    expect(parseColor("rgba(0, 0, 0, 0.5)")).toEqual({ r: 0, g: 0, b: 0, a: 0.5 });
    expect(parseColor("rgb(0 0 0 / 25%)")).toEqual({ r: 0, g: 0, b: 0, a: 0.25 });
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor("oklch(0.5 0.1 200)")).toBeNull();
  });

  it("formats colours as hex with alpha", () => {
    expect(formatColor("rgb(37, 99, 235)")).toBe("#2563eb");
    expect(formatColor("rgba(0, 0, 0, 0.5)")).toBe("#000000 · 50%");
    expect(formatColor("rgba(0, 0, 0, 0)")).toBe("transparent");
    expect(formatColor("oklch(0.5 0.1 200)")).toBe("oklch(0.5 0.1 200)");
  });

  it("rewrites colours inside longer values", () => {
    expect(replaceColors("linear-gradient(rgb(255, 0, 0), rgb(0, 0, 255))")).toBe("linear-gradient(#ff0000, #0000ff)");
  });

  it("splits lists only at top-level commas", () => {
    expect(splitTopLevel("rgb(0, 0, 0) 1px, red 2px")).toEqual(["rgb(0, 0, 0) 1px", "red 2px"]);
  });

  it("formats shadows compactly", () => {
    expect(formatShadow("none")).toBe("none");
    expect(formatShadow("rgba(0, 0, 0, 0.1) 0px 4px 12px 0px")).toBe("0 4px 12px #000000 · 10%");
    expect(formatShadow("rgb(255, 0, 0) 1px 1px 0px 2px inset, rgb(0, 0, 0) 0px 0px 3px 0px")).toBe(
      "inset 1px 1px 0 2px #ff0000, 0 0 3px #000000",
    );
  });

  it("shows the first font family and how many fallbacks follow", () => {
    expect(formatFontFamily('"Inter", system-ui, sans-serif')).toBe("Inter +2");
    expect(formatFontFamily("Georgia")).toBe("Georgia");
    expect(formatFontFamily("")).toBe("");
  });

  it("formats the type scale", () => {
    expect(formatTypeScale("16px", "24px", "400")).toBe("16px / 24px · 400");
    expect(formatTypeScale("13.3333px", "normal", "700")).toBe("13.33px · 700");
  });

  it("decomposes 2D transform matrices", () => {
    expect(formatTransform("none")).toBe("none");
    expect(formatTransform("matrix(1, 0, 0, 1, 10, 20)")).toBe("translate(10px, 20px)");
    expect(formatTransform("matrix(2, 0, 0, 2, 0, 0)")).toBe("scale(2)");
    expect(formatTransform("matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)")).toBe("rotate(45deg)");
    expect(formatTransform("matrix(1, 0, 0.5, 1, 0, 0)")).toBe("matrix(1, 0, 0.5, 1, 0, 0)");
    expect(formatTransform("matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)")).toMatch(/^matrix3d/);
  });

  it("drops transitions that don't animate", () => {
    expect(formatTransition("all 0s ease 0s")).toBe("");
    expect(formatTransition("opacity 0.2s ease 0s, color 0s ease 0s")).toBe("opacity 0.2s ease");
    expect(formatTransition("transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0s")).toBe("transform 150ms cubic-bezier(0.4, 0, 0.2, 1)");
  });

  it("computes WCAG contrast", () => {
    expect(contrastRatio("rgb(0, 0, 0)", "rgb(255, 255, 255)")).toBeCloseTo(21, 1);
    expect(contrastRatio("rgb(37, 99, 235)", "#ffffff")).toBeCloseTo(5.17, 1);
    expect(contrastRatio("nonsense", "#fff")).toBeNull();
    expect(formatContrast(21, 16, 400)).toMatchObject({ text: "21.00:1 · AAA", tone: "ok" });
    expect(formatContrast(3.5, 16, 400)).toMatchObject({ text: "3.50:1 · Fails AA", tone: "warn" });
    expect(formatContrast(3.5, 24, 400)).toMatchObject({ text: "3.50:1 · AA", tone: "ok" });
    expect(formatContrast(1.5, 16, 400).tone).toBe("bad");
  });

  it("knows common implicit roles", () => {
    expect(implicitRole("BUTTON")).toBe("button");
    expect(implicitRole("h2")).toBe("heading");
    expect(implicitRole("div")).toBe("");
  });
});

describe("catalogue", () => {
  it("has unique ids, known sections and a property list for cross-origin frames", () => {
    const ids = CARD_PROPERTIES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const sections = new Set(SECTIONS.map((s) => s.id));
    CARD_PROPERTIES.forEach((p) => expect(sections.has(p.section)).toBe(true));
    expect(CARD_COMPUTED_PROPS).toContain("box-shadow");
    expect(CARD_COMPUTED_PROPS).toContain("z-index");
    expect(CARD_COMPUTED_PROPS.length).toBeLessThan(120);
  });
});

describe("resolveCard", () => {
  const computed = {
    ...noBorder,
    "padding-top": "8px",
    "padding-right": "16px",
    "padding-bottom": "8px",
    "padding-left": "16px",
    "margin-top": "0px",
    "margin-right": "0px",
    "margin-bottom": "0px",
    "margin-left": "0px",
    "background-color": "rgb(37, 99, 235)",
    color: "rgb(255, 255, 255)",
    "font-size": "16px",
    "line-height": "24px",
    "font-weight": "600",
    "font-family": "Inter, sans-serif",
    opacity: "1",
    "box-shadow": "none",
    position: "static",
    "z-index": "auto",
    display: "block",
    "justify-content": "normal",
  };

  it("matches the old fixed card by default and hides defaults", () => {
    const card = resolveCard(source(computed), defaultConfig());
    expect(card.map((s) => s.id)).toEqual(["spacing", "colors", "typography"]);
    expect(card[0].rows.map((r) => [r.label, r.value.text])).toEqual([["Padding", "8px 16px"]]);
    expect(card[1].rows.map((r) => r.value.text)).toEqual(["#2563eb", "#ffffff"]);
    expect(card[2].rows.map((r) => r.value.text)).toEqual(["16px / 24px · 600", "Inter +1"]);
  });

  it("shows default values when that rule is off", () => {
    const config = { ...defaultConfig(), hideDefaults: false };
    const card = resolveCard(source(computed), config);
    expect(card.find((s) => s.id === "border")?.rows[0].value.text).toBe("none");
    expect(card.find((s) => s.id === "spacing")?.rows.map((r) => r.value.text)).toEqual(["8px 16px", "0px"]);
  });

  it("follows the chosen properties and order", () => {
    const config = defaultConfig();
    config.enabled = ["effects.opacity", "position.type", "layout.display", "layout.justify", "a11y.contrast"];
    config.sections = ["a11y", ...config.sections.filter((s) => s !== "a11y")];
    config.hideDefaults = false;
    const card = resolveCard(source(computed, { effectiveBg: "rgb(37, 99, 235)" }), config);
    expect(card.map((s) => s.id)).toEqual(["a11y", "effects", "layout", "position"]);
    // justify-content does not apply to a block box
    expect(card.find((s) => s.id === "layout")?.rows.map((r) => r.id)).toEqual(["layout.display"]);
    expect(card[0].rows[0].value).toMatchObject({ text: "5.16:1 · AA", tone: "ok" });
  });

  it("gives each border side its own row when they differ", () => {
    const c = { ...computed, "border-bottom-width": "2px", "border-bottom-style": "solid", "border-bottom-color": "rgb(255, 0, 0)" };
    const card = resolveCard(source(c), defaultConfig());
    const rows = card.find((s) => s.id === "border")!.rows;
    expect(rows.map((r) => r.label)).toEqual(["Top", "Right", "Bottom", "Left"]);
    expect(rows[2].value).toMatchObject({ text: "2px solid #ff0000", swatches: ["rgb(255, 0, 0)"] });
  });

  it("text colour and typography only apply to elements with text", () => {
    const card = resolveCard(source(computed, { hasText: false }), defaultConfig());
    expect(card.map((s) => s.id)).toEqual(["spacing", "colors"]);
    expect(card[1].rows.map((r) => r.id)).toEqual(["colors.background"]);
  });
});

describe("normalizeConfig", () => {
  it("returns the default for missing or broken values", () => {
    expect(normalizeConfig(undefined)).toEqual(defaultConfig());
    expect(normalizeConfig("x")).toEqual(defaultConfig());
  });

  it("drops unknown ids and appends new ones", () => {
    const c = normalizeConfig({
      sections: ["effects", "nope", "effects"],
      order: { effects: ["effects.cursor", "bogus"] },
      enabled: ["effects.cursor", "bogus", "effects.cursor"],
      hideDefaults: false,
    });
    expect(c.sections[0]).toBe("effects");
    expect(c.sections).toHaveLength(SECTIONS.length);
    expect(c.order.effects[0]).toBe("effects.cursor");
    expect(c.order.effects).toContain("effects.opacity");
    expect(c.enabled).toEqual(["effects.cursor"]);
    expect(c.hideDefaults).toBe(false);
  });
});
