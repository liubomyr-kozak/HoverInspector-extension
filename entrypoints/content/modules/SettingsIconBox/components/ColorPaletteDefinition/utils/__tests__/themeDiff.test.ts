import { describe, expect, it } from "vitest";
import {
  classifyVariable,
  countThemeTokens,
  formatShadow,
  isDesignTheme,
  lineHeightPx,
  matchTypeStyle,
  matchValue,
  parseBorder,
  parseColor,
  parseShadow,
  parseTheme,
  summarize,
  toPx,
  type DesignTheme,
} from "../themeDiff";
import { EXAMPLE_THEME_TEXT } from "../themeExamples";

const theme = (): DesignTheme => parseTheme(EXAMPLE_THEME_TEXT).theme!;

describe("value parsing", () => {
  it("parses hex, rgb and hsl colours without the DOM", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor("#2563EB")).toEqual({ r: 37, g: 99, b: 235, a: 1 });
    expect(parseColor("rgba(0, 0, 0, 0.5)")).toMatchObject({ r: 0, g: 0, b: 0, a: 0.5 });
    expect(parseColor("hsl(0, 100%, 50%)")).toMatchObject({ r: 255, g: 0, b: 0 });
    expect(parseColor("16px")).toBeNull();
    expect(parseColor("1px solid red")).toBeNull();
  });

  it("converts lengths to px", () => {
    expect(toPx("16px")).toBe(16);
    expect(toPx("1rem")).toBe(16);
    expect(toPx("1.5rem", { rootFontSize: 10 })).toBe(15);
    expect(toPx("2em", { fontSize: 14 })).toBe(28);
    expect(toPx("12")).toBe(12);
    expect(toPx("50%")).toBeNull();
    expect(toPx("auto")).toBeNull();
  });

  it("parses shadows with the colour first or last", () => {
    const computed = parseShadow("rgba(0, 0, 0, 0.1) 0px 1px 3px 0px");
    const authored = parseShadow("0 1px 3px rgba(0,0,0,.1)");
    expect(computed).toEqual(authored);
    expect(parseShadow("none")).toBeNull();
    expect(parseShadow("0 1px 2px #f00, inset 0 0 0 1px #000")).toHaveLength(2);
    expect(formatShadow("rgba(0, 0, 0, 0.1) 0px 1px 3px 0px")).toBe("0 1px 3px rgb(0 0 0 / 0.1)");
  });

  it("parses borders in any order", () => {
    expect(parseBorder("1px solid #e5e7eb")).toMatchObject({ width: 1, style: "solid", color: { r: 229, g: 231, b: 235 } });
    expect(parseBorder("#000 dashed")).toMatchObject({ width: null, style: "dashed" });
  });

  it("resolves line heights against the font size", () => {
    expect(lineHeightPx("1.5", 16)).toBe(24);
    expect(lineHeightPx("150%", 16)).toBe(24);
    expect(lineHeightPx("28px", 16)).toBe(28);
    expect(lineHeightPx("normal", 10)).toBe(12);
  });
});

describe("parseTheme", () => {
  it("reads the example JSON theme", () => {
    const parsed = parseTheme(EXAMPLE_THEME_TEXT);
    expect(parsed.error).toBeUndefined();
    expect(parsed.theme!.name).toBe("Example: Acme UI");
    expect(parsed.theme!.colors.primary).toBe("#2563eb");
    expect(parsed.theme!.typography.fontSizes.base).toBe("16px");
    expect(isDesignTheme(parsed.theme)).toBe(true);
  });

  it("flattens nested groups and design-token leaves, and accepts bare numbers", () => {
    const { theme: t } = parseTheme(
      JSON.stringify({
        colours: { blue: { 500: "#3b82f6", 600: { $value: "#2563eb" } } },
        spacing: { 4: 16 },
        fontSizes: { base: "1rem" },
      }),
    );
    expect(t!.colors).toEqual({ "blue-500": "#3b82f6", "blue-600": "#2563eb" });
    expect(t!.spacing).toEqual({ "4": "16px" });
    expect(t!.typography.fontSizes).toEqual({ base: "1rem" });
  });

  it("unwraps a fenced AI answer", () => {
    const { theme: t } = parseTheme("Here you go:\n```json\n{\"colors\":{\"brand\":\"#ff0000\"}}\n```");
    expect(t!.colors.brand).toBe("#ff0000");
  });

  it("reports invalid JSON and empty themes", () => {
    expect(parseTheme("{ nope").error).toMatch(/Not valid JSON/);
    expect(parseTheme("{\"foo\": 1}").error).toMatch(/No tokens/);
    expect(parseTheme("").error).toBeTruthy();
  });

  it("reads CSS custom properties and resolves var() references", () => {
    const { theme: t, skipped } = parseTheme(`/* theme: Brand */
      :root {
        --brand: #2563eb;
        --color-link: var(--brand);
        --space-4: 1rem;
        --radius-md: 8px;
        --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
        --font-family-sans: "Inter", sans-serif;
        --font-weight-bold: 700;
        --leading-normal: 1.5;
        --text-lg: 18px;
        --border-default: 1px solid #e5e7eb;
        --transition: all .2s;
      }`);
    expect(t!.name).toBe("Brand");
    expect(t!.colors).toEqual({ "--brand": "#2563eb", "--color-link": "#2563eb" });
    expect(t!.spacing).toEqual({ "--space-4": "1rem" });
    expect(t!.radii).toEqual({ "--radius-md": "8px" });
    expect(Object.keys(t!.shadows)).toEqual(["--shadow-sm"]);
    expect(t!.typography.fontFamilies["--font-family-sans"]).toBe('"Inter", sans-serif');
    expect(t!.typography.fontWeights["--font-weight-bold"]).toBe("700");
    expect(t!.typography.lineHeights["--leading-normal"]).toBe("1.5");
    expect(t!.typography.fontSizes["--text-lg"]).toBe("18px");
    expect(t!.borders["--border-default"]).toBe("1px solid #e5e7eb");
    expect(skipped).toContain("--transition");
  });

  it("round-trips the Overview's Copy as CSS variables output", () => {
    const css = `:root {
  /* Text colours */
  --color-text-1: #1F2937;
  /* Border colours */
  --color-border-1: #E5E7EB;
  /* Font families */
  --font-family-1: "Segoe UI";
  /* Font sizes */
  --font-size-1: 14px;
  /* Spacing */
  --space-1: 4px;
  /* Radii */
  --radius-1: 6px;
  /* Shadows */
  --shadow-1: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px;
}`;
    const { theme: t } = parseTheme(css);
    expect(countThemeTokens(t!)).toBe(7);
    expect(t!.colors["--color-border-1"]).toBe("#E5E7EB");
    expect(matchValue("shadow", "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px", t)?.status).toBe("match");
    expect(matchValue("fontFamily", '"Segoe UI", sans-serif', t)?.status).toBe("match");
  });

  it("classifies variables by name, then by value", () => {
    expect(classifyVariable("--gray-100", "#f3f4f6")).toBe("color");
    expect(classifyVariable("--border-color", "#ddd")).toBe("color");
    expect(classifyVariable("--gutter", "24px")).toBe("spacing");
    expect(classifyVariable("--rounded-lg", "0.5rem")).toBe("radius");
    expect(classifyVariable("--z-modal", "100")).toBeNull();
  });
});

describe("matchValue", () => {
  it("matches colours within ΔE 2 and names the token", () => {
    expect(matchValue("color", "#2563EB", theme())).toMatchObject({ status: "match", token: "primary", delta: "" });
    // One step off in every channel: imperceptible
    expect(matchValue("color", "#2664EC", theme())).toMatchObject({ status: "match", token: "primary" });
  });

  it("reports the nearest colour and how far off it is", () => {
    const near = matchValue("color", "#2a6af0", theme())!;
    expect(near.status).toBe("near");
    expect(near.token).toBe("primary");
    expect(near.delta).toMatch(/^ΔE \d/);
    expect(matchValue("color", "#ff00ff", theme())!.status).toBe("off");
  });

  it("matches lengths exactly after px conversion", () => {
    expect(matchValue("spacing", "16px", theme())).toMatchObject({ status: "match", token: "4" });
    expect(matchValue("spacing", "1rem", theme())).toMatchObject({ status: "match", token: "4" });
    expect(matchValue("spacing", "15px", theme())).toMatchObject({ status: "near", token: "4", delta: "−1px" });
    expect(matchValue("spacing", "40px", theme())).toMatchObject({ status: "off", token: "8", delta: "+8px" });
    expect(matchValue("radius", "6px", theme())).toMatchObject({ status: "match", token: "md" });
  });

  it("returns null when the theme has no tokens of that kind", () => {
    const t = parseTheme('{"colors":{"a":"#000"}}').theme!;
    expect(matchValue("spacing", "4px", t)).toBeNull();
    expect(matchValue("color", "#000", null)).toBeNull();
  });

  it("matches shadows by geometry and colour", () => {
    expect(matchValue("shadow", "rgba(0, 0, 0, 0.05) 0px 1px 2px 0px", theme())).toMatchObject({ status: "match", token: "sm" });
    const near = matchValue("shadow", "rgba(0, 0, 0, 0.05) 0px 2px 2px 0px", theme())!;
    expect(near).toMatchObject({ status: "near", token: "sm", delta: "1px off" });
    expect(matchValue("shadow", "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px", theme())).toMatchObject({
      status: "match",
      token: "md",
    });
  });

  it("matches borders by width, style and colour", () => {
    expect(matchValue("border", "1px solid #E5E7EB", theme())).toMatchObject({ status: "match", token: "default" });
    expect(matchValue("border", "1px solid #D1D5DB", theme())).toMatchObject({ status: "match", token: "strong" });
    expect(matchValue("border", "3px solid #2563EB", theme())).toMatchObject({ status: "near", token: "focus", delta: "width +1px" });
  });

  it("matches font families, weights and line heights", () => {
    expect(matchValue("fontFamily", "Inter, sans-serif", theme())).toMatchObject({ status: "match", token: "sans" });
    expect(matchValue("fontFamily", "system-ui", theme())).toMatchObject({ status: "near", token: "sans" });
    expect(matchValue("fontFamily", "Georgia, serif", theme())!.status).toBe("off");
    expect(matchValue("fontWeight", "bold", theme())).toMatchObject({ status: "match", token: "bold" });
    expect(matchValue("fontWeight", "800", theme())).toMatchObject({ status: "near", token: "bold", delta: "+100" });
    expect(matchValue("lineHeight", "24px", theme(), { fontSize: 16 })).toMatchObject({ status: "match", token: "normal" });
  });
});

describe("matchTypeStyle", () => {
  it("matches when every part matches", () => {
    const m = matchTypeStyle({ family: "Inter, sans-serif", size: 16, weight: "400", lineHeight: "24px" }, theme());
    expect(m.overall!.status).toBe("match");
    expect(m.overall!.token).toContain("size: base");
  });

  it("is as bad as its worst part and says which part is off", () => {
    const m = matchTypeStyle({ family: "Inter", size: 15, weight: "400", lineHeight: "24px" }, theme());
    expect(m.parts.fontSize!.status).toBe("near");
    expect(m.overall!.status).toBe("near");
    expect(m.overall!.delta).toContain("size");
  });

  it("is null without typography tokens", () => {
    const t = parseTheme('{"colors":{"a":"#000"}}').theme!;
    expect(matchTypeStyle({ family: "Inter", size: 16, weight: "400", lineHeight: "24px" }, t).overall).toBeNull();
  });
});

describe("summarize", () => {
  it("counts matches among compared values", () => {
    const t = theme();
    expect(summarize([matchValue("spacing", "16px", t), matchValue("spacing", "15px", t), null])).toEqual({ matched: 1, total: 2 });
  });
});
