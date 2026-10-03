/**
 * Design theme import and diff: the pure logic behind "does this page follow our theme?".
 *
 * A theme lists the expected design tokens (colours, spacing, radii, shadows, borders, typography). It can
 * be pasted as JSON (see THEME_FORMAT.md) or as a `:root { --x: … }` block, including the output of the
 * Overview's "Copy as CSS variables". Every value found on the page is then compared with the theme's
 * tokens of the same kind: a match names the token, a mismatch names the nearest token and how far off
 * the value is.
 *
 * No DOM or extension APIs here, so it is unit tested directly.
 */
import { deltaE } from "@entrypoints/shared/utils/designAudit";
import { colorToRgb, rgbToHex, type RGBA } from "@entrypoints/shared/utils/colorAnalysis";

export type TokenMap = Record<string, string>;

export interface DesignTheme {
  name: string;
  colors: TokenMap;
  spacing: TokenMap;
  radii: TokenMap;
  shadows: TokenMap;
  borders: TokenMap;
  typography: {
    fontFamilies: TokenMap;
    fontSizes: TokenMap;
    fontWeights: TokenMap;
    lineHeights: TokenMap;
  };
}

export type TokenKind =
  | "color"
  | "spacing"
  | "radius"
  | "shadow"
  | "border"
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "lineHeight";

/** match: equal to a token (colours: ΔE < 2). near: close to one. off: nothing close. */
export type MatchStatus = "match" | "near" | "off";

export interface ThemeMatch {
  status: MatchStatus;
  /** The matching token, or the nearest one */
  token?: string;
  tokenValue?: string;
  /** How far off, for sorting (0 for a match) */
  distance: number;
  /** "+2px", "ΔE 3.4", "different family"; empty for a match */
  delta: string;
}

/** Colour difference below which two colours count as the same token */
export const COLOR_MATCH_DELTA_E = 2;
/** Up to this far off is reported as "near" (a likely typo of the token) rather than "off" */
const COLOR_NEAR_DELTA_E = 10;
const LENGTH_NEAR_PX = 2;

export const emptyTheme = (name = "Imported theme"): DesignTheme => ({
  name,
  colors: {},
  spacing: {},
  radii: {},
  shadows: {},
  borders: {},
  typography: { fontFamilies: {}, fontSizes: {}, fontWeights: {}, lineHeights: {} },
});

/** The token map of a theme for one kind of value */
export const tokensOf = (theme: DesignTheme, kind: TokenKind): TokenMap => {
  switch (kind) {
    case "color":
      return theme.colors;
    case "spacing":
      return theme.spacing;
    case "radius":
      return theme.radii;
    case "shadow":
      return theme.shadows;
    case "border":
      return theme.borders;
    case "fontFamily":
      return theme.typography.fontFamilies;
    case "fontSize":
      return theme.typography.fontSizes;
    case "fontWeight":
      return theme.typography.fontWeights;
    case "lineHeight":
      return theme.typography.lineHeights;
  }
};

export const countThemeTokens = (theme: DesignTheme) =>
  (["color", "spacing", "radius", "shadow", "border", "fontFamily", "fontSize", "fontWeight", "lineHeight"] as const).reduce(
    (sum, kind) => sum + Object.keys(tokensOf(theme, kind)).length,
    0,
  );

// ---------------------------------------------------------------------------------------------
// Value parsing
// ---------------------------------------------------------------------------------------------

const NAMED_COLORS: Record<string, RGBA> = {
  white: { r: 255, g: 255, b: 255, a: 1 },
  black: { r: 0, g: 0, b: 0, a: 1 },
  transparent: { r: 0, g: 0, b: 0, a: 0 },
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
};

const parseAlpha = (raw?: string) => {
  if (raw === undefined) return 1;
  const value = raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
};

/**
 * Hex, rgb(), hsl() and a few names without the DOM; anything else (oklch, named colours…) goes to the
 * browser's parser (`colorToRgb`, a canvas), which returns null where there is no canvas.
 */
export const parseColor = (value: string): RGBA | null => {
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  if (NAMED_COLORS[raw]) return NAMED_COLORS[raw];
  const hex = raw.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hex) {
    let digits = hex[1];
    if (digits.length <= 4) digits = [...digits].map((d) => d + d).join("");
    const n = (i: number) => parseInt(digits.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: digits.length === 8 ? Math.round((n(6) / 255) * 100) / 100 : 1 };
  }
  const hsl = raw.match(/^hsla?\(\s*(-?[\d.]+)(?:deg)?(?:\s*,\s*|\s+)([\d.]+)%(?:\s*,\s*|\s+)([\d.]+)%(?:\s*(?:,|\/)\s*([\d.]+%?))?\s*\)$/);
  if (hsl) {
    const [r, g, b] = hslToRgb(((parseFloat(hsl[1]) % 360) + 360) % 360, parseFloat(hsl[2]) / 100, parseFloat(hsl[3]) / 100);
    return { r, g, b, a: parseAlpha(hsl[4]) };
  }
  // Values with spaces outside parentheses are not a single colour ("1px solid red")
  if (/\s/.test(raw.replace(/\([^()]*\)/g, ""))) return null;
  if (/^-?[\d.]+[a-z%]*$/.test(raw)) return null;
  try {
    return colorToRgb(value.trim());
  } catch {
    return null;
  }
};

export const colorToHex = (rgba: RGBA) => rgbToHex({ ...rgba, a: Math.round(rgba.a * 100) / 100 });

/**
 * A CSS length in px. `rem` uses the root font size, `em` the element's font size; a bare number is px
 * (themes often write `"spacing": { "4": 16 }`). Percentages and keywords are not lengths.
 */
export const toPx = (value: string | number, { rootFontSize = 16, fontSize = 16 } = {}): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const match = value.trim().toLowerCase().match(/^(-?\d*\.?\d+)(px|rem|em)?$/);
  if (!match) return null;
  const n = parseFloat(match[1]);
  const px = match[2] === "rem" ? n * rootFontSize : match[2] === "em" ? n * fontSize : n;
  return Math.round(px * 1000) / 1000;
};

const roundPx = (px: number) => Math.round(px * 100) / 100;
const signedPx = (px: number) => `${px > 0 ? "+" : px < 0 ? "−" : ""}${roundPx(Math.abs(px))}px`;

const WEIGHT_KEYWORDS: Record<string, number> = { normal: 400, bold: 700, lighter: 300, bolder: 700 };
export const toFontWeight = (value: string | number): number | null => {
  if (typeof value === "number") return value;
  const raw = value.trim().toLowerCase();
  if (WEIGHT_KEYWORDS[raw]) return WEIGHT_KEYWORDS[raw];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** First family of a font stack, unquoted and lower case: `"Inter", sans-serif` gives `inter` */
export const primaryFamily = (stack: string) =>
  stack.split(",")[0].trim().replace(/^["']|["']$/g, "").toLowerCase();

const familyList = (stack: string) => stack.split(",").map((f) => f.trim().replace(/^["']|["']$/g, "").toLowerCase());

/** Splits on commas that are not inside parentheses */
const splitTopLevel = (value: string, separator = ","): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth++;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === separator && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

/** Splits on whitespace that is not inside parentheses */
const splitWords = (value: string) => {
  const words: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth++;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (/\s/.test(char) && depth === 0) {
      if (current) words.push(current);
      current = "";
    } else current += char;
  }
  if (current) words.push(current);
  return words;
};

export interface ShadowLayer {
  inset: boolean;
  /** x, y, blur, spread in px */
  lengths: [number, number, number, number];
  color: RGBA | null;
}

/** Parses `box-shadow`, with the colour first (computed style) or last (as authored) */
export const parseShadow = (value: string): ShadowLayer[] | null => {
  if (!value || value.trim() === "none") return null;
  const layers: ShadowLayer[] = [];
  for (const part of splitTopLevel(value)) {
    let inset = false;
    let color: RGBA | null = null;
    const lengths: number[] = [];
    for (const word of splitWords(part)) {
      if (word.toLowerCase() === "inset") inset = true;
      else {
        const px = toPx(word);
        if (px !== null) lengths.push(px);
        else {
          const parsed = parseColor(word);
          if (!parsed) return null;
          color = parsed;
        }
      }
    }
    if (lengths.length < 2 || lengths.length > 4) return null;
    layers.push({ inset, lengths: [lengths[0], lengths[1], lengths[2] ?? 0, lengths[3] ?? 0], color });
  }
  return layers.length ? layers : null;
};

/** Readable form of a shadow: colour last, `0` without unit, like it is usually written */
export const formatShadow = (value: string): string => {
  const layers = parseShadow(value);
  if (!layers) return value;
  return layers
    .map((layer) => {
      const lengths = [...layer.lengths];
      // Drop a trailing 0 spread
      if (lengths[3] === 0) lengths.pop();
      const parts = lengths.map((n) => (n === 0 ? "0" : `${roundPx(n)}px`));
      if (layer.color) {
        const { r, g, b, a } = layer.color;
        parts.push(a >= 1 ? colorToHex(layer.color) : `rgb(${r} ${g} ${b} / ${Math.round(a * 100) / 100})`);
      }
      return `${layer.inset ? "inset " : ""}${parts.join(" ")}`;
    })
    .join(", ");
};

export interface BorderParts {
  width: number | null;
  style: string | null;
  color: RGBA | null;
}

const BORDER_STYLES = new Set(["none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset"]);

/** `1px solid #e5e7eb`, in any order; any part can be missing */
export const parseBorder = (value: string): BorderParts | null => {
  const parts: BorderParts = { width: null, style: null, color: null };
  for (const word of splitWords(value.trim())) {
    const lower = word.toLowerCase();
    if (BORDER_STYLES.has(lower)) parts.style = lower;
    else if (toPx(word) !== null) parts.width = toPx(word);
    else {
      const color = parseColor(word);
      if (!color) return null;
      parts.color = color;
    }
  }
  return parts.width === null && parts.style === null && parts.color === null ? null : parts;
};

// ---------------------------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------------------------

const best = <T>(entries: Array<[string, string]>, measure: (raw: string) => T | null, distance: (t: T) => number) => {
  let nearest: { token: string; tokenValue: string; distance: number; parsed: T } | null = null;
  for (const [token, tokenValue] of entries) {
    const parsed = measure(tokenValue);
    if (parsed === null) continue;
    const d = distance(parsed);
    if (!nearest || d < nearest.distance) nearest = { token, tokenValue, distance: d, parsed };
  }
  return nearest;
};

export interface MatchContext {
  /** Font size of the element in px, for `em` tokens and unitless line heights */
  fontSize?: number;
  rootFontSize?: number;
}

const matchColor = (value: string, tokens: TokenMap): ThemeMatch | null => {
  const color = parseColor(value);
  if (!color) return null;
  const nearest = best(Object.entries(tokens), parseColor, (token) => deltaE(color, token));
  if (!nearest) return null;
  const d = Math.round(nearest.distance * 10) / 10;
  const status: MatchStatus = nearest.distance < COLOR_MATCH_DELTA_E ? "match" : nearest.distance < COLOR_NEAR_DELTA_E ? "near" : "off";
  return { status, token: nearest.token, tokenValue: nearest.tokenValue, distance: nearest.distance, delta: status === "match" ? "" : `ΔE ${d}` };
};

const matchLength = (value: string, tokens: TokenMap, ctx: MatchContext): ThemeMatch | null => {
  const px = toPx(value, ctx);
  if (px === null) return null;
  const nearest = best(Object.entries(tokens), (raw) => toPx(raw, ctx), (token) => Math.abs(px - token));
  if (!nearest) return null;
  const diff = px - nearest.parsed;
  const status: MatchStatus = Math.abs(diff) < 0.01 ? "match" : Math.abs(diff) <= LENGTH_NEAR_PX ? "near" : "off";
  return { status, token: nearest.token, tokenValue: nearest.tokenValue, distance: Math.abs(diff), delta: status === "match" ? "" : signedPx(diff) };
};

/** Shadow distance: px off per length, plus ΔE/2 for the colour; a different layer count is far off */
const shadowDistance = (a: ShadowLayer[], b: ShadowLayer[]) => {
  if (a.length !== b.length) return 100 + Math.abs(a.length - b.length) * 20;
  let lengths = 0;
  let color = 0;
  a.forEach((layer, i) => {
    const other = b[i];
    if (layer.inset !== other.inset) lengths += 20;
    layer.lengths.forEach((n, j) => (lengths += Math.abs(n - other.lengths[j])));
    if (layer.color && other.color) color = Math.max(color, deltaE(layer.color, other.color));
  });
  return { lengths, color };
};

const matchShadow = (value: string, tokens: TokenMap): ThemeMatch | null => {
  const layers = parseShadow(value);
  if (!layers) return null;
  const nearest = best(
    Object.entries(tokens),
    parseShadow,
    (token) => {
      const d = shadowDistance(layers, token);
      return typeof d === "number" ? d : d.lengths + (d.color < COLOR_MATCH_DELTA_E ? 0 : d.color / 2);
    },
  );
  if (!nearest) return null;
  const d = shadowDistance(layers, nearest.parsed);
  if (typeof d === "number") {
    return { status: "off", token: nearest.token, tokenValue: nearest.tokenValue, distance: d, delta: "different number of layers" };
  }
  const lengthsMatch = d.lengths < 0.01;
  const colorMatch = d.color < COLOR_MATCH_DELTA_E;
  const status: MatchStatus =
    lengthsMatch && colorMatch ? "match" : d.lengths <= 4 && d.color < COLOR_NEAR_DELTA_E ? "near" : "off";
  const deltas: string[] = [];
  if (!lengthsMatch) deltas.push(`${roundPx(d.lengths)}px off`);
  if (!colorMatch) deltas.push(`colour ΔE ${Math.round(d.color * 10) / 10}`);
  return { status, token: nearest.token, tokenValue: nearest.tokenValue, distance: nearest.distance, delta: deltas.join(", ") };
};

const matchBorder = (value: string, tokens: TokenMap): ThemeMatch | null => {
  const border = parseBorder(value);
  if (!border) return null;
  const compare = (token: BorderParts) => {
    const width = token.width !== null && border.width !== null ? border.width - token.width : 0;
    const style = token.style !== null && border.style !== null && token.style !== border.style;
    const color = token.color && border.color ? deltaE(border.color, token.color) : 0;
    return { width, style, color };
  };
  const nearest = best(Object.entries(tokens), parseBorder, (token) => {
    const d = compare(token);
    return Math.abs(d.width) * 2 + (d.style ? 3 : 0) + (d.color < COLOR_MATCH_DELTA_E ? 0 : d.color / 2);
  });
  if (!nearest) return null;
  const d = compare(nearest.parsed);
  const widthMatch = Math.abs(d.width) < 0.01;
  const colorMatch = d.color < COLOR_MATCH_DELTA_E;
  const status: MatchStatus =
    widthMatch && !d.style && colorMatch ? "match" : Math.abs(d.width) <= 1 && d.color < COLOR_NEAR_DELTA_E ? "near" : "off";
  const deltas: string[] = [];
  if (!widthMatch) deltas.push(`width ${signedPx(d.width)}`);
  if (d.style) deltas.push(`style ${nearest.parsed.style}`);
  if (!colorMatch) deltas.push(`colour ΔE ${Math.round(d.color * 10) / 10}`);
  return { status, token: nearest.token, tokenValue: nearest.tokenValue, distance: nearest.distance, delta: deltas.join(", ") };
};

const matchFamily = (value: string, tokens: TokenMap): ThemeMatch | null => {
  const family = primaryFamily(value);
  if (!family) return null;
  const entries = Object.entries(tokens);
  if (!entries.length) return null;
  const exact = entries.find(([, stack]) => primaryFamily(stack) === family);
  if (exact) return { status: "match", token: exact[0], tokenValue: exact[1], distance: 0, delta: "" };
  // In the stack, but as a fallback: the intended font did not load or is not first
  const fallback = entries.find(([, stack]) => familyList(stack).includes(family));
  if (fallback) return { status: "near", token: fallback[0], tokenValue: fallback[1], distance: 1, delta: "fallback font of the token" };
  return { status: "off", token: entries[0][0], tokenValue: entries[0][1], distance: 2, delta: "different family" };
};

const matchWeight = (value: string, tokens: TokenMap): ThemeMatch | null => {
  const weight = toFontWeight(value);
  if (weight === null) return null;
  const nearest = best(Object.entries(tokens), toFontWeight, (token) => Math.abs(weight - token));
  if (!nearest) return null;
  const diff = weight - nearest.parsed;
  const status: MatchStatus = diff === 0 ? "match" : Math.abs(diff) <= 100 ? "near" : "off";
  return { status, token: nearest.token, tokenValue: nearest.tokenValue, distance: Math.abs(diff), delta: diff === 0 ? "" : `${diff > 0 ? "+" : "−"}${Math.abs(diff)}` };
};

/** A line height in px: unitless and % multiply the font size; `normal` is about 1.2 */
export const lineHeightPx = (value: string, fontSize = 16, rootFontSize = 16): number | null => {
  const raw = value.trim().toLowerCase();
  if (raw === "normal") return Math.round(fontSize * 1.2 * 100) / 100;
  if (raw.endsWith("%")) return (parseFloat(raw) / 100) * fontSize;
  if (/^-?\d*\.?\d+$/.test(raw)) return parseFloat(raw) * fontSize;
  return toPx(raw, { rootFontSize, fontSize });
};

const matchLineHeight = (value: string, tokens: TokenMap, ctx: MatchContext): ThemeMatch | null => {
  const fontSize = ctx.fontSize ?? 16;
  const px = lineHeightPx(value, fontSize, ctx.rootFontSize);
  if (px === null) return null;
  const nearest = best(Object.entries(tokens), (raw) => lineHeightPx(raw, fontSize, ctx.rootFontSize), (token) => Math.abs(px - token));
  if (!nearest) return null;
  const diff = px - nearest.parsed;
  // Computed line heights are rounded by the browser: allow half a pixel
  const status: MatchStatus = Math.abs(diff) < 0.5 ? "match" : Math.abs(diff) <= LENGTH_NEAR_PX ? "near" : "off";
  return { status, token: nearest.token, tokenValue: nearest.tokenValue, distance: Math.abs(diff), delta: status === "match" ? "" : signedPx(diff) };
};

/**
 * Compares one page value with the theme's tokens of its kind. Null when the theme has no tokens of
 * that kind (nothing to compare with) or the value can't be parsed.
 */
export const matchValue = (kind: TokenKind, value: string, theme: DesignTheme | null, ctx: MatchContext = {}): ThemeMatch | null => {
  if (!theme) return null;
  const tokens = tokensOf(theme, kind);
  if (!Object.keys(tokens).length) return null;
  switch (kind) {
    case "color":
      return matchColor(value, tokens);
    case "spacing":
    case "radius":
    case "fontSize":
      return matchLength(value, tokens, ctx);
    case "shadow":
      return matchShadow(value, tokens);
    case "border":
      return matchBorder(value, tokens);
    case "fontFamily":
      return matchFamily(value, tokens);
    case "fontWeight":
      return matchWeight(value, tokens);
    case "lineHeight":
      return matchLineHeight(value, tokens, ctx);
  }
};

export interface TypeStyleValue {
  family: string;
  /** px */
  size: number;
  weight: string;
  lineHeight: string;
}

export interface TypeStyleMatch {
  /** The worst of the parts; null when the theme has no typography */
  overall: ThemeMatch | null;
  parts: Record<"fontFamily" | "fontSize" | "fontWeight" | "lineHeight", ThemeMatch | null>;
}

const STATUS_RANK: Record<MatchStatus, number> = { match: 0, near: 1, off: 2 };

/** A type style matches when every part the theme defines (family, size, weight, line height) matches */
export const matchTypeStyle = (style: TypeStyleValue, theme: DesignTheme | null, rootFontSize = 16): TypeStyleMatch => {
  const ctx = { fontSize: style.size, rootFontSize };
  const parts = {
    fontFamily: matchValue("fontFamily", style.family, theme, ctx),
    fontSize: matchValue("fontSize", `${style.size}px`, theme, ctx),
    fontWeight: matchValue("fontWeight", style.weight, theme, ctx),
    lineHeight: matchValue("lineHeight", style.lineHeight, theme, ctx),
  };
  const present = Object.entries(parts).filter((entry): entry is [string, ThemeMatch] => entry[1] !== null);
  if (!present.length) return { overall: null, parts };
  const worst = present.reduce((a, b) => (STATUS_RANK[b[1].status] > STATUS_RANK[a[1].status] ? b : a));
  const status = worst[1].status;
  const label = (key: string) => ({ fontFamily: "family", fontSize: "size", fontWeight: "weight", lineHeight: "line height" })[key];
  const overall: ThemeMatch = {
    status,
    token: present.map(([key, m]) => `${label(key)}: ${m.token}`).join(" · "),
    distance: present.reduce((sum, [, m]) => sum + m.distance, 0),
    delta: present
      .filter(([, m]) => m.status !== "match")
      .map(([key, m]) => `${label(key)} ${m.delta}`)
      .join(", "),
  };
  return { overall, parts };
};

export interface MatchSummary {
  matched: number;
  /** Values that were compared (the theme had tokens of their kind) */
  total: number;
}

export const summarize = (matches: Array<ThemeMatch | null | undefined>): MatchSummary => {
  const compared = matches.filter((m): m is ThemeMatch => !!m);
  return { matched: compared.filter((m) => m.status === "match").length, total: compared.length };
};

// ---------------------------------------------------------------------------------------------
// Theme import
// ---------------------------------------------------------------------------------------------

export interface ParsedTheme {
  theme: DesignTheme | null;
  error?: string;
  /** Entries that were skipped, for the import preview */
  skipped: string[];
}

const GROUP_ALIASES: Record<string, TokenKind> = {
  colors: "color",
  colours: "color",
  color: "color",
  colour: "color",
  palette: "color",
  spacing: "spacing",
  space: "spacing",
  spaces: "spacing",
  radii: "radius",
  radius: "radius",
  borderradius: "radius",
  rounded: "radius",
  shadows: "shadow",
  shadow: "shadow",
  boxshadow: "shadow",
  elevation: "shadow",
  borders: "border",
  border: "border",
  fontfamilies: "fontFamily",
  fontfamily: "fontFamily",
  fonts: "fontFamily",
  fontsizes: "fontSize",
  fontsize: "fontSize",
  fontweights: "fontWeight",
  fontweight: "fontWeight",
  lineheights: "lineHeight",
  lineheight: "lineHeight",
  leading: "lineHeight",
};

const groupKind = (key: string) => GROUP_ALIASES[key.toLowerCase().replace(/[-_\s]/g, "")];

/**
 * Flattens nested groups (`{ primary: { 500: "#…" } }` gives `primary-500`) and design-token leaves
 * (`{ "$value": "#…" }` or `{ "value": "#…" }`) into name/value pairs
 */
const flatten = (value: unknown, prefix: string, out: Array<[string, string]>, skipped: string[]) => {
  if (typeof value === "string" || typeof value === "number") {
    out.push([prefix, String(value)]);
    return;
  }
  if (Array.isArray(value)) {
    // A font stack as an array
    if (value.every((v) => typeof v === "string")) out.push([prefix, value.join(", ")]);
    else skipped.push(prefix);
    return;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const leaf = record.$value ?? record.value;
    if (typeof leaf === "string" || typeof leaf === "number") {
      out.push([prefix, String(leaf)]);
      return;
    }
    for (const [key, child] of Object.entries(record)) {
      if (key.startsWith("$")) continue;
      flatten(child, prefix ? `${prefix}-${key}` : key, out, skipped);
    }
    return;
  }
  skipped.push(prefix);
};

const addToken = (theme: DesignTheme, kind: TokenKind, name: string, value: string) => {
  let v = value.trim();
  // Bare numbers are px for lengths ("spacing": { "4": 16 })
  if ((kind === "spacing" || kind === "radius" || kind === "fontSize") && /^-?\d*\.?\d+$/.test(v)) v = `${v}px`;
  tokensOf(theme, kind)[name] = v;
};

const parseJsonTheme = (data: unknown): ParsedTheme => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { theme: null, error: "The JSON must be an object like { \"colors\": { … } }.", skipped: [] };
  }
  const record = data as Record<string, unknown>;
  const theme = emptyTheme(typeof record.name === "string" && record.name.trim() ? record.name.trim() : "Imported theme");
  const skipped: string[] = [];

  const readGroup = (key: string, value: unknown) => {
    const kind = groupKind(key);
    if (!kind) {
      skipped.push(key);
      return;
    }
    const entries: Array<[string, string]> = [];
    flatten(value, "", entries, skipped);
    entries.forEach(([name, v]) => addToken(theme, kind, name || key, v));
  };

  for (const [key, value] of Object.entries(record)) {
    if (key === "name" || key.startsWith("$") || key === "description" || key === "version") continue;
    const normalized = key.toLowerCase();
    if ((normalized === "typography" || normalized === "type" || normalized === "fonts") && value && typeof value === "object" && !Array.isArray(value)) {
      // "fonts" can be a group of families or a typography object
      const children = Object.entries(value as Record<string, unknown>);
      if (children.some(([child]) => groupKind(child) && groupKind(child) !== "fontFamily") || normalized !== "fonts") {
        children.forEach(([child, v]) => readGroup(child, v));
        continue;
      }
    }
    readGroup(key, value);
  }
  if (!countThemeTokens(theme)) {
    return { theme: null, error: "No tokens found. Expected groups like colors, spacing, radii, shadows, borders or typography.", skipped };
  }
  return { theme, skipped };
};

const isShadowLike = (value: string) => parseShadow(value) !== null && /\s/.test(value.trim());

/** Which kind a CSS custom property holds, by its name first and its value second */
export const classifyVariable = (name: string, value: string): TokenKind | null => {
  const n = name.toLowerCase().replace(/^--/, "");
  const v = value.trim();
  // Bare numbers are not lengths in CSS (z-index, opacity, flex…), except 0
  const isLength = toPx(v) !== null && (/[a-z]$/i.test(v) || v === "0");
  const isColor = parseColor(v) !== null;
  if (/shadow|elevation/.test(n)) return isShadowLike(v) || v === "none" ? "shadow" : null;
  if (/radius|rounded|corner/.test(n)) return isLength ? "radius" : null;
  if (/font-?family|typeface|^font-(sans|serif|mono|body|heading|display)$|^family/.test(n)) return "fontFamily";
  if (/weight|^fw-/.test(n)) return toFontWeight(v) !== null ? "fontWeight" : null;
  if (/line-?height|leading|^lh-/.test(n)) return "lineHeight";
  if (/font-?size|^text-(xs|sm|base|md|lg|\d*xl)$|^fs-|type-?size/.test(n)) return isLength ? "fontSize" : null;
  if (/border|stroke|outline/.test(n)) {
    if (isColor) return "color";
    if (parseBorder(v)) return "border";
    return null;
  }
  if (isColor && !isLength) return "color";
  if (/space|spacing|gap|gutter|margin|padding|inset|^s-|^sp-/.test(n) && isLength) return "spacing";
  if (isLength) return "spacing";
  if (isShadowLike(v)) return "shadow";
  return null;
};

const parseCssTheme = (text: string): ParsedTheme => {
  const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, "");
  const declarations = [...withoutComments.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(
    ([, name, value]) => [name, value.trim()] as [string, string],
  );
  if (!declarations.length) {
    return { theme: null, error: "Paste theme JSON or CSS custom properties (--name: value;).", skipped: [] };
  }
  const values = new Map(declarations);
  // Resolve var(--x) references within the block
  const resolve = (value: string, depth = 0): string =>
    depth > 5 ? value : value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (_, ref: string, fallback?: string) =>
      values.has(ref) ? resolve(values.get(ref)!, depth + 1) : (fallback ?? "").trim());
  const theme = emptyTheme(text.match(/\/\*\s*theme:\s*([^*]+)\*\//i)?.[1].trim() || "Imported CSS variables");
  const skipped: string[] = [];
  for (const [name, raw] of declarations) {
    const value = resolve(raw);
    const kind = classifyVariable(name, value);
    if (kind) addToken(theme, kind, name, value);
    else skipped.push(name);
  }
  if (!countThemeTokens(theme)) return { theme: null, error: "None of the custom properties is a colour, length, shadow or font.", skipped };
  return { theme, skipped };
};

/** Theme from pasted text: JSON (see THEME_FORMAT.md) or a block of CSS custom properties */
export const parseTheme = (text: string): ParsedTheme => {
  const trimmed = text.trim();
  if (!trimmed) return { theme: null, error: "Paste a theme first.", skipped: [] };
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return parseJsonTheme(JSON.parse(trimmed));
    } catch (e) {
      // `{` could also open a CSS block without a selector
      if (!/--[\w-]+\s*:/.test(trimmed)) return { theme: null, error: `Not valid JSON: ${(e as Error).message}`, skipped: [] };
    }
  }
  // AI answers often wrap the JSON in a ```json fence
  const fenced = trimmed.match(/```(?:json|css)?\s*([\s\S]*?)```/i);
  if (fenced) return parseTheme(fenced[1]);
  return parseCssTheme(trimmed);
};

/** Validates a theme read back from storage */
export const isDesignTheme = (value: unknown): value is DesignTheme => {
  if (!value || typeof value !== "object") return false;
  const t = value as DesignTheme;
  return (
    typeof t.name === "string" &&
    ["colors", "spacing", "radii", "shadows", "borders"].every((k) => t[k as keyof DesignTheme] && typeof t[k as keyof DesignTheme] === "object") &&
    !!t.typography &&
    ["fontFamilies", "fontSizes", "fontWeights", "lineHeights"].every((k) => typeof (t.typography as any)[k] === "object")
  );
};

const LENGTH_KINDS = new Set<TokenKind>(["spacing", "radius", "fontSize"]);

/**
 * The names (CSS custom properties, theme tokens) whose value equals `value` for this kind of token,
 * whatever their name suggests: `--gap-md: 16px` is an alias of a 16px radius too.
 */
export const findAliases = (kind: TokenKind, value: string, entries: Array<[string, string]>, ctx: MatchContext = {}): string[] => {
  const single = emptyTheme();
  const map = tokensOf(single, kind);
  return entries
    .filter(([name, raw]) => {
      const v = raw.trim();
      if (!v || v.length > 200) return false;
      // Bare numbers are not lengths in CSS
      if (LENGTH_KINDS.has(kind) && !/[a-z]$/i.test(v)) return false;
      for (const key of Object.keys(map)) delete map[key];
      map[name] = v;
      return matchValue(kind, value, single, ctx)?.status === "match";
    })
    .map(([name]) => name);
};
