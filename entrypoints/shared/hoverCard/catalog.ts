/**
 * The hover card's property catalogue: every value the card can show, which section it lives in, which
 * computed properties it reads and how it formats them. Pure (no DOM, no React), so the frame agent can
 * import the property list and the formatting can be unit tested.
 *
 * A card is built from a CardSource (computed values plus a few element facts) and the user's
 * HoverCardConfig (which properties are on, in what order, and whether default values are hidden).
 */

export type SectionId =
  | "size"
  | "spacing"
  | "colors"
  | "typography"
  | "border"
  | "radius"
  | "effects"
  | "layout"
  | "position"
  | "a11y";

export const SECTIONS: readonly { id: SectionId; label: string }[] = [
  { id: "size", label: "Size" },
  { id: "spacing", label: "Spacing" },
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "border", label: "Border" },
  { id: "radius", label: "Radius" },
  { id: "effects", label: "Effects" },
  { id: "layout", label: "Layout" },
  { id: "position", label: "Position" },
  { id: "a11y", label: "Accessibility" },
];

/** What the card knows about the element. `get` returns a computed value, or "" when unknown. */
export interface CardSource {
  get(prop: string): string;
  tag: string;
  isSvg: boolean;
  hasText: boolean;
  /** Rendered border box, top-viewport px */
  width: number;
  height: number;
  role?: string | null;
  ariaLabel?: string | null;
  alt?: string | null;
  naturalWidth?: number;
  naturalHeight?: number;
  /** The background actually visible behind the element (ancestors composited), for contrast */
  effectiveBg?: string;
}

export type Tone = "ok" | "warn" | "bad";

export interface CardValue {
  text: string;
  /** Colours drawn as small swatches before the text */
  swatches?: string[];
  /** Full value for the tooltip when the text is shortened */
  title?: string;
  tone?: Tone;
  /** Overrides the property label for this row (border sides) */
  label?: string;
}

export interface CardProperty {
  id: string;
  label: string;
  section: SectionId;
  /** Computed properties read through CardSource.get (also the cross-origin frame whitelist) */
  props: readonly string[];
  /** On in the default card */
  defaultOn?: boolean;
  /** Short hint shown in the editor */
  hint?: string;
  /** False: never shown for this element (text colour on an element without text, flex props on a block) */
  applies?: (src: CardSource) => boolean;
  /** True when the value is the CSS initial / "nothing set" state; hidden when "hide default values" is on */
  isDefault?: (src: CardSource) => boolean;
  read: (src: CardSource) => CardValue | CardValue[] | null;
}

// ---------------------------------------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------------------------------------

const round = (n: number) => Math.round(n * 100) / 100;

/** "12.345678px" -> "12.35px"; leaves keywords and other units alone */
export function formatPx(value: string): string {
  const v = (value || "").trim();
  if (!v) return "";
  return v.replace(/(-?\d*\.?\d+(?:e-?\d+)?)px/g, (_m, n) => `${round(Number(n))}px`);
}

/** CSS shorthand for four sides: "8px", "8px 16px", "8px 16px 4px" or all four */
export function formatBox(top: string, right: string, bottom: string, left: string): string {
  const [t, r, b, l] = [top, right, bottom, left].map((v) => formatPx(v) || "0px");
  if (t === r && r === b && b === l) return t;
  if (t === b && r === l) return `${t} ${r}`;
  if (r === l) return `${t} ${r} ${b}`;
  return `${t} ${r} ${b} ${l}`;
}

const isZeroLength = (v: string) => !v || /^(-?0(\.0+)?(px|%|em|rem)?\s*)+$/.test(v.trim());

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const RGB_RE = /^rgba?\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i;
const HEX_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** rgb()/rgba() (comma or space syntax), hex and "transparent"; null for anything else */
export function parseColor(value: string): Rgba | null {
  const v = (value || "").trim();
  if (!v) return null;
  if (v.toLowerCase() === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  const m = v.match(RGB_RE);
  if (m) {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const alpha = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: clamp(+m[1]), g: clamp(+m[2]), b: clamp(+m[3]), a: Math.max(0, Math.min(1, alpha)) };
  }
  const h = v.match(HEX_RE);
  if (h) {
    let hex = h[1];
    if (hex.length <= 4) hex = hex.split("").map((c) => c + c).join("");
    const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? round(n(6) / 255) : 1 };
  }
  return null;
}

const hex2 = (n: number) => n.toString(16).padStart(2, "0");

/** "rgb(37, 99, 235)" -> "#2563eb"; translucent colours get their alpha: "#000000 · 50%" */
export function formatColor(value: string): string {
  const c = parseColor(value);
  if (!c) return (value || "").trim();
  if (c.a === 0) return "transparent";
  const hex = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
  return c.a < 1 ? `${hex} · ${Math.round(c.a * 100)}%` : hex;
}

const isTransparent = (value: string) => {
  const c = parseColor(value);
  return !value || (!!c && c.a === 0);
};

/** Every colour function or hex inside a longer value (shadows, gradients) */
const COLOR_TOKEN_RE = /(rgba?\([^)]*\)|#[0-9a-f]{3,8}\b)/gi;

/** Rewrites the colours inside a value as hex */
export function replaceColors(value: string): string {
  return (value || "").replace(COLOR_TOKEN_RE, (m) => formatColor(m));
}

const colorsIn = (value: string) => [...new Set((value || "").match(COLOR_TOKEN_RE) || [])];

/** Splits a comma separated list, ignoring commas inside parentheses */
export function splitTopLevel(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of value || "") {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** "rgba(0, 0, 0, 0.1) 0px 4px 12px 0px" -> "0 4px 12px #000000 · 10%"; several layers are joined with ", " */
export function formatShadow(value: string): string {
  const v = (value || "").trim();
  if (!v || v === "none") return "none";
  return splitTopLevel(v)
    .map((layer) => {
      const colors = layer.match(COLOR_TOKEN_RE) || [];
      let rest = layer;
      colors.forEach((c) => (rest = rest.replace(c, "")));
      const inset = /\binset\b/.test(rest);
      const lengths = rest
        .replace(/\binset\b/, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((l) => (isZeroLength(l) ? "0" : formatPx(l)));
      // Drop a trailing zero spread, as people write it
      if (lengths.length === 4 && lengths[3] === "0") lengths.pop();
      return [inset ? "inset" : "", ...lengths, colors[0] ? formatColor(colors[0]) : ""].filter(Boolean).join(" ");
    })
    .join(", ");
}

/** First family plus how many fallbacks follow: "Inter +3" */
export function formatFontFamily(value: string): string {
  const families = splitTopLevel(value || "").map((f) => f.replace(/["']/g, "").trim()).filter(Boolean);
  if (!families.length) return "";
  return families.length > 1 ? `${families[0]} +${families.length - 1}` : families[0];
}

/** "16px / 24px · 400"; the line height is left out when it is "normal" */
export function formatTypeScale(size: string, lineHeight: string, weight: string): string {
  const lh = lineHeight && lineHeight !== "normal" ? ` / ${formatPx(lineHeight)}` : "";
  return `${formatPx(size)}${lh}${weight ? ` · ${weight}` : ""}`;
}

const num = (n: number) => String(round(n));

/**
 * matrix(a, b, c, d, e, f) -> "translate(10px, 20px) rotate(45deg) scale(2)". 3D matrices and skews
 * that don't decompose cleanly are returned unchanged.
 */
export function formatTransform(value: string): string {
  const v = (value || "").trim();
  if (!v || v === "none") return "none";
  const m = v.match(/^matrix\(([^)]+)\)$/);
  if (!m) return v;
  const [a, b, c, d, e, f] = m[1].split(",").map((s) => parseFloat(s));
  if ([a, b, c, d, e, f].some((n) => !Number.isFinite(n))) return v;
  const scaleX = Math.hypot(a, b);
  if (scaleX === 0) return v;
  const skew = (a * c + b * d) / scaleX;
  if (Math.abs(skew) > 1e-6) return v;
  const scaleY = (a * d - b * c) / scaleX;
  const rotate = (Math.atan2(b, a) * 180) / Math.PI;
  const parts: string[] = [];
  if (Math.abs(e) > 1e-6 || Math.abs(f) > 1e-6) parts.push(`translate(${num(e)}px, ${num(f)}px)`);
  if (Math.abs(rotate) > 1e-6) parts.push(`rotate(${num(rotate)}deg)`);
  if (Math.abs(scaleX - 1) > 1e-6 || Math.abs(scaleY - 1) > 1e-6) {
    parts.push(round(scaleX) === round(scaleY) ? `scale(${num(scaleX)})` : `scale(${num(scaleX)}, ${num(scaleY)})`);
  }
  return parts.length ? parts.join(" ") : "none";
}

/** "opacity 0.2s ease 0s, color 0.3s ease 0s" -> "opacity 0.2s ease, color 0.3s ease"; "" when nothing animates */
export function formatTransition(value: string): string {
  return splitTopLevel(value || "")
    .map((layer) => {
      const times = layer.match(/-?[\d.]+m?s\b/g) || [];
      if (!times[0] || !parseFloat(times[0])) return "";
      return layer.replace(/\s+0s$/, "").trim();
    })
    .filter(Boolean)
    .join(", ");
}

/** WCAG relative luminance contrast of two opaque colours; a translucent foreground is blended first */
export function contrastRatio(fg: string, bg: string): number | null {
  const b = parseColor(bg);
  const f0 = parseColor(fg);
  if (!b || !f0) return null;
  const back = b.a < 1 ? blend(b, { r: 255, g: 255, b: 255, a: 1 }) : b;
  const f = f0.a < 1 ? blend(f0, back) : f0;
  const lum = ({ r, g, b: bb }: Rgba) => {
    const ch = (x: number) => {
      const s = x / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(bb);
  };
  const [l1, l2] = [lum(f), lum(back)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const blend = (top: Rgba, bottom: Rgba): Rgba => ({
  r: Math.round(top.r * top.a + bottom.r * (1 - top.a)),
  g: Math.round(top.g * top.a + bottom.g * (1 - top.a)),
  b: Math.round(top.b * top.a + bottom.b * (1 - top.a)),
  a: 1,
});

/** "4.52:1 · AA" with a tone; large text (24px, or 18.66px bold) only needs 3:1 */
export function formatContrast(ratio: number, fontSizePx: number, fontWeight: number): CardValue {
  const large = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
  const aa = large ? 3 : 4.5;
  const aaa = large ? 4.5 : 7;
  const level = ratio >= aaa ? "AAA" : ratio >= aa ? "AA" : "Fails AA";
  const text = `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1 · ${level}`;
  return {
    text,
    tone: ratio >= aa ? "ok" : ratio >= 3 ? "warn" : "bad",
    title: `${text}${large ? " (large text)" : ""}`,
  };
}

const IMPLICIT_ROLES: Record<string, string> = {
  a: "link",
  article: "article",
  aside: "complementary",
  button: "button",
  dialog: "dialog",
  footer: "contentinfo",
  form: "form",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  header: "banner",
  hr: "separator",
  img: "img",
  input: "textbox",
  li: "listitem",
  main: "main",
  nav: "navigation",
  ol: "list",
  option: "option",
  progress: "progressbar",
  section: "region",
  select: "combobox",
  table: "table",
  textarea: "textbox",
  td: "cell",
  th: "columnheader",
  tr: "row",
  ul: "list",
};

export const implicitRole = (tag: string): string => IMPLICIT_ROLES[(tag || "").toLowerCase()] || "";

// ---------------------------------------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------------------------------------

const SIDES = ["top", "right", "bottom", "left"] as const;
const sideProps = (pre: string, post = "") => SIDES.map((s) => `${pre}-${s}${post}`);
const boxOf = (src: CardSource, pre: string, post = "") => {
  const [t, r, b, l] = sideProps(pre, post).map((p) => src.get(p));
  return formatBox(t, r, b, l);
};
const plain = (prop: string) => (src: CardSource) => {
  const v = src.get(prop).trim();
  return v ? { text: v } : null;
};
const oneOf = (prop: string, ...defaults: string[]) => (src: CardSource) => {
  const v = src.get(prop).trim();
  return !v || defaults.includes(v);
};
const colorValue = (raw: string): CardValue | null =>
  raw ? { text: formatColor(raw), swatches: isTransparent(raw) ? undefined : [raw], title: raw } : null;
const isFlexOrGrid = (src: CardSource) => /flex|grid/.test(src.get("display"));
const isFlex = (src: CardSource) => /flex/.test(src.get("display"));
const isGrid = (src: CardSource) => /grid/.test(src.get("display"));

const borderSide = (src: CardSource, side: string) => ({
  width: src.get(`border-${side}-width`),
  style: src.get(`border-${side}-style`),
  color: src.get(`border-${side}-color`),
});
const sideIsEmpty = (s: { width: string; style: string }) =>
  !s.style || s.style === "none" || s.style === "hidden" || isZeroLength(s.width);
const BORDER_PROPS = SIDES.flatMap((s) => [`border-${s}-width`, `border-${s}-style`, `border-${s}-color`]);
const RADIUS_PROPS = ["top-left", "top-right", "bottom-right", "bottom-left"].map((c) => `border-${c}-radius`);

export const CARD_PROPERTIES: readonly CardProperty[] = [
  // Size ------------------------------------------------------------------------------------------------
  {
    id: "size.rendered",
    label: "Rendered",
    section: "size",
    props: [],
    hint: "Width × height on screen (also in the card header)",
    read: (src) => ({ text: `${round(src.width)} × ${round(src.height)}px` }),
  },
  {
    id: "size.natural",
    label: "Natural size",
    section: "size",
    props: [],
    defaultOn: true,
    hint: "Intrinsic size of images",
    applies: (src) => src.tag === "img",
    isDefault: (src) => !src.naturalWidth,
    read: (src) => (src.naturalWidth ? { text: `${src.naturalWidth} × ${src.naturalHeight}px` } : { text: "not loaded" }),
  },
  {
    id: "size.minWidth",
    label: "Min width",
    section: "size",
    props: ["min-width"],
    isDefault: (src) => ["auto", "0px", ""].includes(src.get("min-width")),
    read: (src) => ({ text: formatPx(src.get("min-width")) }),
  },
  {
    id: "size.maxWidth",
    label: "Max width",
    section: "size",
    props: ["max-width"],
    isDefault: oneOf("max-width", "none"),
    read: (src) => ({ text: formatPx(src.get("max-width")) }),
  },
  {
    id: "size.minHeight",
    label: "Min height",
    section: "size",
    props: ["min-height"],
    isDefault: (src) => ["auto", "0px", ""].includes(src.get("min-height")),
    read: (src) => ({ text: formatPx(src.get("min-height")) }),
  },
  {
    id: "size.maxHeight",
    label: "Max height",
    section: "size",
    props: ["max-height"],
    isDefault: oneOf("max-height", "none"),
    read: (src) => ({ text: formatPx(src.get("max-height")) }),
  },
  {
    id: "size.aspectRatio",
    label: "Aspect ratio",
    section: "size",
    props: ["aspect-ratio"],
    isDefault: oneOf("aspect-ratio", "auto"),
    read: plain("aspect-ratio"),
  },
  {
    id: "size.boxSizing",
    label: "Box sizing",
    section: "size",
    props: ["box-sizing"],
    read: plain("box-sizing"),
  },

  // Spacing ---------------------------------------------------------------------------------------------
  {
    id: "spacing.padding",
    label: "Padding",
    section: "spacing",
    props: sideProps("padding"),
    defaultOn: true,
    isDefault: (src) => isZeroLength(boxOf(src, "padding")),
    read: (src) => ({ text: boxOf(src, "padding") }),
  },
  {
    id: "spacing.margin",
    label: "Margin",
    section: "spacing",
    props: sideProps("margin"),
    defaultOn: true,
    isDefault: (src) => isZeroLength(boxOf(src, "margin")),
    read: (src) => ({ text: boxOf(src, "margin") }),
  },
  {
    id: "spacing.gap",
    label: "Gap",
    section: "spacing",
    props: ["row-gap", "column-gap"],
    hint: "Flex and grid containers",
    applies: isFlexOrGrid,
    isDefault: (src) => ["normal", "0px", ""].includes(src.get("row-gap")) && ["normal", "0px", ""].includes(src.get("column-gap")),
    read: (src) => {
      const row = formatPx(src.get("row-gap"));
      const col = formatPx(src.get("column-gap"));
      return { text: row === col ? row : `${row} ${col}` };
    },
  },

  // Colors ----------------------------------------------------------------------------------------------
  {
    id: "colors.background",
    label: "Background",
    section: "colors",
    props: ["background-color"],
    defaultOn: true,
    isDefault: (src) => isTransparent(src.get("background-color")),
    read: (src) => colorValue(src.get("background-color")),
  },
  {
    id: "colors.text",
    label: "Text",
    section: "colors",
    props: ["color"],
    defaultOn: true,
    hint: "Elements with their own text",
    // SVG text is painted with fill, so its CSS color says nothing
    applies: (src) => src.hasText && !src.isSvg,
    read: (src) => colorValue(src.get("color")),
  },
  {
    id: "colors.backgroundImage",
    label: "Image / gradient",
    section: "colors",
    props: ["background-image"],
    isDefault: oneOf("background-image", "none"),
    read: (src) => {
      const raw = src.get("background-image");
      if (!raw) return null;
      const text = replaceColors(raw.replace(/url\((["']?)[^)]*\1\)/g, "url(…)"));
      return { text, swatches: colorsIn(raw).slice(0, 3), title: raw };
    },
  },
  {
    id: "colors.fill",
    label: "Fill",
    section: "colors",
    props: ["fill"],
    defaultOn: true,
    hint: "SVG shapes",
    applies: (src) => src.isSvg && src.tag !== "svg",
    isDefault: oneOf("fill", "none"),
    read: (src) => colorValue(src.get("fill")),
  },
  {
    id: "colors.stroke",
    label: "Stroke",
    section: "colors",
    props: ["stroke"],
    defaultOn: true,
    hint: "SVG shapes",
    applies: (src) => src.isSvg && src.tag !== "svg",
    isDefault: oneOf("stroke", "none"),
    read: (src) => colorValue(src.get("stroke")),
  },
  {
    id: "colors.outline",
    label: "Outline",
    section: "colors",
    props: ["outline-style", "outline-width", "outline-color"],
    isDefault: (src) => src.get("outline-style") === "none" || isZeroLength(src.get("outline-width")),
    read: (src) => {
      const c = src.get("outline-color");
      return { text: `${formatPx(src.get("outline-width"))} ${src.get("outline-style")} ${formatColor(c)}`.trim(), swatches: c ? [c] : undefined };
    },
  },

  // Typography ------------------------------------------------------------------------------------------
  {
    id: "typography.scale",
    label: "Size / Weight",
    section: "typography",
    props: ["font-size", "line-height", "font-weight"],
    defaultOn: true,
    hint: "Font size / line height · weight",
    applies: (src) => src.hasText,
    read: (src) => ({ text: formatTypeScale(src.get("font-size"), src.get("line-height"), src.get("font-weight")) }),
  },
  {
    id: "typography.family",
    label: "Family",
    section: "typography",
    props: ["font-family"],
    defaultOn: true,
    applies: (src) => src.hasText,
    read: (src) => {
      const raw = src.get("font-family");
      return raw ? { text: formatFontFamily(raw), title: raw } : null;
    },
  },
  {
    id: "typography.size",
    label: "Font size",
    section: "typography",
    props: ["font-size"],
    applies: (src) => src.hasText,
    read: (src) => ({ text: formatPx(src.get("font-size")) }),
  },
  {
    id: "typography.lineHeight",
    label: "Line height",
    section: "typography",
    props: ["line-height"],
    applies: (src) => src.hasText,
    read: (src) => ({ text: formatPx(src.get("line-height")) }),
  },
  {
    id: "typography.weight",
    label: "Weight",
    section: "typography",
    props: ["font-weight"],
    applies: (src) => src.hasText,
    read: plain("font-weight"),
  },
  {
    id: "typography.style",
    label: "Style",
    section: "typography",
    props: ["font-style"],
    applies: (src) => src.hasText,
    isDefault: oneOf("font-style", "normal"),
    read: plain("font-style"),
  },
  {
    id: "typography.letterSpacing",
    label: "Letter spacing",
    section: "typography",
    props: ["letter-spacing"],
    applies: (src) => src.hasText,
    isDefault: (src) => ["normal", "0px", ""].includes(src.get("letter-spacing")),
    read: (src) => ({ text: formatPx(src.get("letter-spacing")) }),
  },
  {
    id: "typography.align",
    label: "Align",
    section: "typography",
    props: ["text-align"],
    applies: (src) => src.hasText,
    isDefault: oneOf("text-align", "start", "left"),
    read: plain("text-align"),
  },
  {
    id: "typography.transform",
    label: "Transform",
    section: "typography",
    props: ["text-transform"],
    applies: (src) => src.hasText,
    isDefault: oneOf("text-transform", "none"),
    read: plain("text-transform"),
  },
  {
    id: "typography.decoration",
    label: "Decoration",
    section: "typography",
    props: ["text-decoration-line"],
    applies: (src) => src.hasText,
    isDefault: oneOf("text-decoration-line", "none"),
    read: plain("text-decoration-line"),
  },

  // Border ----------------------------------------------------------------------------------------------
  {
    id: "border.all",
    label: "Border",
    section: "border",
    props: BORDER_PROPS,
    defaultOn: true,
    hint: "Width, style and colour; one row per side when they differ",
    isDefault: (src) => SIDES.every((s) => sideIsEmpty(borderSide(src, s))),
    read: (src) => {
      const sides = SIDES.map((s) => ({ side: s, ...borderSide(src, s) }));
      const describe = (s: (typeof sides)[number]): CardValue =>
        sideIsEmpty(s)
          ? { text: "none" }
          : { text: `${formatPx(s.width)} ${s.style} ${formatColor(s.color)}`, swatches: s.color ? [s.color] : undefined };
      const key = (s: (typeof sides)[number]) => (sideIsEmpty(s) ? "none" : `${s.width}|${s.style}|${s.color}`);
      if (sides.every((s) => key(s) === key(sides[0]))) return { ...describe(sides[0]), label: "All sides" };
      return sides.map((s) => ({ ...describe(s), label: s.side[0].toUpperCase() + s.side.slice(1) }));
    },
  },
  {
    id: "border.width",
    label: "Width",
    section: "border",
    props: sideProps("border", "-width"),
    isDefault: (src) => isZeroLength(boxOf(src, "border", "-width")),
    read: (src) => ({ text: boxOf(src, "border", "-width") }),
  },
  {
    id: "border.style",
    label: "Style",
    section: "border",
    props: sideProps("border", "-style"),
    isDefault: (src) => SIDES.every((s) => src.get(`border-${s}-style`) === "none"),
    read: (src) => {
      const [t, r, b, l] = SIDES.map((s) => src.get(`border-${s}-style`));
      // formatBox only rewrites px values, so it collapses keywords too
      return { text: formatBox(t, r, b, l) };
    },
  },
  {
    id: "border.color",
    label: "Color",
    section: "border",
    props: sideProps("border", "-color"),
    isDefault: (src) => SIDES.every((s) => sideIsEmpty(borderSide(src, s))),
    read: (src) => {
      const colors = SIDES.map((s) => src.get(`border-${s}-color`));
      const [t, r, b, l] = colors.map(formatColor);
      return { text: formatBox(t, r, b, l), swatches: [...new Set(colors.filter(Boolean))].slice(0, 4) };
    },
  },

  // Radius ----------------------------------------------------------------------------------------------
  {
    id: "radius.all",
    label: "Radius",
    section: "radius",
    props: RADIUS_PROPS,
    hint: "All four corners, CSS shorthand order",
    isDefault: (src) => RADIUS_PROPS.every((p) => isZeroLength(src.get(p))),
    read: (src) => {
      const [tl, tr, br, bl] = RADIUS_PROPS.map((p) => src.get(p));
      return { text: formatBox(tl, tr, br, bl) };
    },
  },

  // Effects ---------------------------------------------------------------------------------------------
  {
    id: "effects.opacity",
    label: "Opacity",
    section: "effects",
    props: ["opacity"],
    isDefault: oneOf("opacity", "1"),
    read: plain("opacity"),
  },
  {
    id: "effects.shadow",
    label: "Shadow",
    section: "effects",
    props: ["box-shadow"],
    isDefault: oneOf("box-shadow", "none"),
    read: (src) => {
      const raw = src.get("box-shadow");
      return raw ? { text: formatShadow(raw), swatches: colorsIn(raw).slice(0, 3), title: raw } : null;
    },
  },
  {
    id: "effects.transform",
    label: "Transform",
    section: "effects",
    props: ["transform"],
    isDefault: oneOf("transform", "none"),
    read: (src) => {
      const raw = src.get("transform");
      return raw ? { text: formatTransform(raw), title: raw } : null;
    },
  },
  {
    id: "effects.filter",
    label: "Filter",
    section: "effects",
    props: ["filter"],
    isDefault: oneOf("filter", "none"),
    read: plain("filter"),
  },
  {
    id: "effects.backdrop",
    label: "Backdrop filter",
    section: "effects",
    props: ["backdrop-filter"],
    isDefault: oneOf("backdrop-filter", "none"),
    read: plain("backdrop-filter"),
  },
  {
    id: "effects.transition",
    label: "Transition",
    section: "effects",
    props: ["transition"],
    isDefault: (src) => !formatTransition(src.get("transition")),
    read: (src) => {
      const raw = src.get("transition");
      return raw ? { text: formatTransition(raw) || "none", title: raw } : null;
    },
  },
  {
    id: "effects.cursor",
    label: "Cursor",
    section: "effects",
    props: ["cursor"],
    isDefault: oneOf("cursor", "auto"),
    read: plain("cursor"),
  },

  // Layout ----------------------------------------------------------------------------------------------
  {
    id: "layout.display",
    label: "Display",
    section: "layout",
    props: ["display"],
    read: plain("display"),
  },
  {
    id: "layout.flexDirection",
    label: "Direction",
    section: "layout",
    props: ["flex-direction", "flex-wrap"],
    applies: isFlex,
    isDefault: (src) => src.get("flex-direction") === "row" && src.get("flex-wrap") === "nowrap",
    read: (src) => ({ text: [src.get("flex-direction"), src.get("flex-wrap") !== "nowrap" ? src.get("flex-wrap") : ""].filter(Boolean).join(" ") }),
  },
  {
    id: "layout.justify",
    label: "Justify",
    section: "layout",
    props: ["justify-content"],
    applies: isFlexOrGrid,
    isDefault: oneOf("justify-content", "normal"),
    read: plain("justify-content"),
  },
  {
    id: "layout.align",
    label: "Align items",
    section: "layout",
    props: ["align-items"],
    applies: isFlexOrGrid,
    isDefault: oneOf("align-items", "normal"),
    read: plain("align-items"),
  },
  {
    id: "layout.gridColumns",
    label: "Grid columns",
    section: "layout",
    props: ["grid-template-columns"],
    applies: isGrid,
    isDefault: oneOf("grid-template-columns", "none"),
    read: (src) => {
      const raw = src.get("grid-template-columns");
      return raw ? { text: formatPx(raw), title: raw } : null;
    },
  },
  {
    id: "layout.gridRows",
    label: "Grid rows",
    section: "layout",
    props: ["grid-template-rows"],
    applies: isGrid,
    isDefault: oneOf("grid-template-rows", "none"),
    read: (src) => {
      const raw = src.get("grid-template-rows");
      return raw ? { text: formatPx(raw), title: raw } : null;
    },
  },
  {
    id: "layout.flex",
    label: "Flex item",
    section: "layout",
    props: ["flex-grow", "flex-shrink", "flex-basis"],
    hint: "grow shrink basis",
    isDefault: (src) => src.get("flex-grow") === "0" && src.get("flex-shrink") === "1" && src.get("flex-basis") === "auto",
    read: (src) => ({ text: `${src.get("flex-grow")} ${src.get("flex-shrink")} ${formatPx(src.get("flex-basis"))}`.trim() }),
  },
  {
    id: "layout.overflow",
    label: "Overflow",
    section: "layout",
    props: ["overflow-x", "overflow-y"],
    isDefault: (src) => src.get("overflow-x") === "visible" && src.get("overflow-y") === "visible",
    read: (src) => {
      const x = src.get("overflow-x");
      const y = src.get("overflow-y");
      return { text: x === y ? x : `${x} ${y}` };
    },
  },

  // Position --------------------------------------------------------------------------------------------
  {
    id: "position.type",
    label: "Position",
    section: "position",
    props: ["position"],
    isDefault: oneOf("position", "static"),
    read: plain("position"),
  },
  {
    id: "position.inset",
    label: "Inset",
    section: "position",
    props: ["top", "right", "bottom", "left"],
    hint: "top right bottom left",
    applies: (src) => !!src.get("position") && src.get("position") !== "static",
    isDefault: (src) => SIDES.every((s) => src.get(s) === "auto"),
    read: (src) => ({ text: formatBox(src.get("top"), src.get("right"), src.get("bottom"), src.get("left")) }),
  },
  {
    id: "position.zIndex",
    label: "Z-index",
    section: "position",
    props: ["z-index"],
    isDefault: oneOf("z-index", "auto"),
    read: plain("z-index"),
  },

  // Accessibility ---------------------------------------------------------------------------------------
  {
    id: "a11y.role",
    label: "Role",
    section: "a11y",
    props: [],
    isDefault: (src) => !src.role && !implicitRole(src.tag),
    read: (src) => {
      if (src.role) return { text: src.role };
      const implicit = implicitRole(src.tag);
      return { text: implicit ? `${implicit} (implicit)` : "none" };
    },
  },
  {
    id: "a11y.label",
    label: "aria-label",
    section: "a11y",
    props: [],
    hint: "aria-label, or the text of aria-labelledby",
    isDefault: (src) => !src.ariaLabel,
    read: (src) => (src.ariaLabel ? { text: src.ariaLabel } : { text: "none" }),
  },
  {
    id: "a11y.alt",
    label: "Alt",
    section: "a11y",
    props: [],
    defaultOn: true,
    hint: "Images",
    applies: (src) => src.tag === "img",
    read: (src) =>
      src.alt === null || src.alt === undefined
        ? { text: "missing", tone: "bad" }
        : src.alt === ""
          ? { text: '"" (decorative)' }
          : { text: src.alt },
  },
  {
    id: "a11y.contrast",
    label: "Contrast",
    section: "a11y",
    props: ["color", "font-size", "font-weight"],
    hint: "Text colour against the visible background (WCAG)",
    applies: (src) => src.hasText && !src.isSvg && !!src.effectiveBg,
    read: (src) => {
      const ratio = contrastRatio(src.get("color"), src.effectiveBg || "");
      if (ratio === null) return null;
      return formatContrast(ratio, parseFloat(src.get("font-size")) || 16, parseFloat(src.get("font-weight")) || 400);
    },
  },
];

export const PROPERTY_BY_ID: ReadonlyMap<string, CardProperty> = new Map(CARD_PROPERTIES.map((p) => [p.id, p]));

/** Every computed property the card can read; cross-origin frames report these */
export const CARD_COMPUTED_PROPS: readonly string[] = [...new Set(CARD_PROPERTIES.flatMap((p) => p.props))];

// ---------------------------------------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------------------------------------

export interface HoverCardConfig {
  version: 1;
  /** Section order */
  sections: SectionId[];
  /** Property order within each section */
  order: Record<SectionId, string[]>;
  /** Properties that are on */
  enabled: string[];
  /** Skip values that are the CSS default (0px border, opacity 1, static position...) */
  hideDefaults: boolean;
}

export function defaultConfig(): HoverCardConfig {
  const order = {} as Record<SectionId, string[]>;
  SECTIONS.forEach((s) => (order[s.id] = CARD_PROPERTIES.filter((p) => p.section === s.id).map((p) => p.id)));
  return {
    version: 1,
    sections: SECTIONS.map((s) => s.id),
    order,
    enabled: CARD_PROPERTIES.filter((p) => p.defaultOn).map((p) => p.id),
    hideDefaults: true,
  };
}

/**
 * Makes stored (possibly old or hand-edited) config safe: unknown ids dropped, duplicates removed,
 * sections and properties added since it was saved appended in catalogue order.
 */
export function normalizeConfig(raw: unknown): HoverCardConfig {
  const base = defaultConfig();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<HoverCardConfig>;
  const validSections = new Set(base.sections);
  const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

  const sections = [...new Set(strings(r.sections).filter((s) => validSections.has(s as SectionId)))] as SectionId[];
  base.sections.forEach((s) => !sections.includes(s) && sections.push(s));

  const order = {} as Record<SectionId, string[]>;
  const rawOrder = r.order && typeof r.order === "object" ? (r.order as Record<string, unknown>) : {};
  for (const s of base.sections) {
    const own = new Set(base.order[s]);
    const list = [...new Set(strings(rawOrder[s]).filter((id) => own.has(id)))];
    base.order[s].forEach((id) => !list.includes(id) && list.push(id));
    order[s] = list;
  }

  const enabled = Array.isArray(r.enabled) ? [...new Set(strings(r.enabled).filter((id) => PROPERTY_BY_ID.has(id)))] : base.enabled;

  return {
    version: 1,
    sections,
    order,
    enabled,
    hideDefaults: typeof r.hideDefaults === "boolean" ? r.hideDefaults : base.hideDefaults,
  };
}

export interface CardRow {
  id: string;
  label: string;
  value: CardValue;
}

export interface CardSectionRows {
  id: SectionId;
  label: string;
  rows: CardRow[];
}

/** The sections and rows to draw for an element, in the configured order; empty sections are left out */
export function resolveCard(src: CardSource, config: HoverCardConfig): CardSectionRows[] {
  const enabled = new Set(config.enabled);
  const out: CardSectionRows[] = [];
  for (const sectionId of config.sections) {
    const section = SECTIONS.find((s) => s.id === sectionId);
    if (!section) continue;
    const rows: CardRow[] = [];
    for (const id of config.order[sectionId] || []) {
      const prop = PROPERTY_BY_ID.get(id);
      if (!prop || !enabled.has(id)) continue;
      try {
        if (prop.applies && !prop.applies(src)) continue;
        if (config.hideDefaults && prop.isDefault?.(src)) continue;
        const value = prop.read(src);
        if (!value) continue;
        const values = Array.isArray(value) ? value : [value];
        values.forEach((v, i) => {
          if (!v.text) return;
          rows.push({ id: values.length > 1 ? `${id}:${i}` : id, label: v.label || prop.label, value: v });
        });
      } catch {
        // A value we can't read is simply not shown
      }
    }
    if (rows.length) out.push({ id: sectionId, label: section.label, rows });
  }
  return out;
}
