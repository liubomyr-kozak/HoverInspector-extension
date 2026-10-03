import { calculateContrastRatio, colorToRgb, getEffectiveBackgroundColor, rgbToHex, type RGBA } from "./colorAnalysis";

/**
 * One pass over the page that collects the design values it actually uses (colours, type styles,
 * spacing, radii, shadows), the way a design system's docs list its tokens, and flags the places
 * where those values are inconsistent.
 */

export type IssueSeverity = "high" | "medium" | "low";
export type IssueCategory = "color" | "typography" | "spacing" | "radius" | "shadow" | "accessibility";

export interface ValueUsage {
  /** Display value: #HEX for colours, `16px` for lengths, the raw value for shadows */
  value: string;
  /** Numeric size for lengths (px), used for sorting and scales */
  size?: number;
  count: number;
  elements: Element[];
}

export interface TypeStyle {
  key: string;
  family: string;
  /** First family of the stack, for display */
  familyName: string;
  size: number;
  weight: string;
  lineHeight: string;
  count: number;
  elements: Element[];
}

export interface DesignIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  detail: string;
  /** Values involved; colours are shown as swatches */
  values: string[];
  /** Near-duplicate pairs: [value to keep (more used), value to replace] */
  pairs?: Array<[string, string]>;
  elements: Element[];
}

export type SpacingGrid = 4 | 8;

export interface AccessibilityFindings {
  lowContrast: Array<{ fg: string; bg: string; ratio: number; required: number; elements: Element[] }>;
  tinyText: Element[];
  tightLines: Element[];
  /** Headings whose line height is far from the usual 1.0-1.4x of their font size */
  looseHeadings?: Element[];
  tightHeadings?: Element[];
}

export interface DesignAudit {
  scannedElements: number;
  truncated: boolean;
  /** Spacing grid the issues were computed for */
  grid: SpacingGrid;
  /**
   * CSS custom properties defined on the root element, by the value they resolve to (#HEX for
   * colours, `16px` for lengths), so a used value can be traced back to its token
   */
  variables: Record<string, string[]>;
  /** What the issues are computed from, kept so they can be recomputed for another grid without a rescan */
  findings: { rgbaByHex: Map<string, RGBA>; a11y: AccessibilityFindings };
  colors: { text: ValueUsage[]; background: ValueUsage[]; border: ValueUsage[] };
  typography: TypeStyle[];
  families: ValueUsage[];
  fontSizes: ValueUsage[];
  spacing: ValueUsage[];
  radii: ValueUsage[];
  shadows: ValueUsage[];
  issues: DesignIssue[];
  /** 0-100, lower with more and more severe issues */
  score: number;
}

/** Cap for the synchronous scan, which blocks the page while it runs */
export const MAX_ELEMENTS = 6000;
/** Cap for the chunked scan, which yields to the page between slices */
export const MAX_ELEMENTS_ASYNC = 50000;
const MAX_ELEMENTS_PER_VALUE = 50;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "META", "LINK", "HEAD", "TITLE", "BR", "WBR"]);
/** Default spacing grid the page is checked against; most design systems use 4px or 8px steps */
export const SPACING_GRID: SpacingGrid = 4;

/** Headings read best with a line height of about 1.0-1.4x their size (body text: ~1.5) */
export const HEADING_LINE_HEIGHT = { min: 1, max: 1.4 } as const;

// ---------------------------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------------------------

const srgbToLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

/** CIE L*a*b* (D65) */
export const rgbToLab = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
};

/** Perceptual colour difference (CIE76). Below ~2.3 most people can't tell two colours apart. */
export const deltaE = (c1: RGBA, c2: RGBA) => {
  const a = rgbToLab(c1);
  const b = rgbToLab(c2);
  const alpha = Math.abs((c1.a ?? 1) - (c2.a ?? 1)) * 100;
  return Math.sqrt((a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2 + alpha ** 2);
};

export const isOnGrid = (px: number, grid: number = SPACING_GRID) => {
  // 1px and 2px hairlines are normal next to a grid; sub-pixel rounding should not count
  if (px <= 2) return true;
  const remainder = px % grid;
  return remainder < 0.5 || grid - remainder < 0.5;
};

/**
 * Pairs of values that are suspiciously close to each other. `distance` returns how far two values
 * are; pairs within `threshold` (and not equal) are returned, most-used pairs first.
 */
export const findNearDuplicates = <T extends { count: number }>(
  items: T[],
  distance: (a: T, b: T) => number,
  threshold: number,
): Array<[T, T]> => {
  const pairs: Array<{ pair: [T, T]; weight: number }> = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const d = distance(items[i], items[j]);
      if (d > 0 && d <= threshold) {
        // The more-used value first: it is the one to keep
        const pair: [T, T] = items[i].count >= items[j].count ? [items[i], items[j]] : [items[j], items[i]];
        pairs.push({ pair, weight: items[i].count + items[j].count });
      }
    }
  }
  return pairs.sort((a, b) => b.weight - a.weight).map((p) => p.pair);
};

export const formatPx = (px: number) => `${Math.round(px * 100) / 100}px`;

/**
 * "loose" when a heading's line height is more than 1.4x its size (often body text's 1.5 inherited),
 * "tight" when it is under 1x (wrapped lines overlap, descenders clip). `normal` is fine.
 */
export const classifyHeadingLineHeight = (fontSizePx: number, lineHeight: string): "loose" | "tight" | null => {
  const lineHeightPx = parseFloat(lineHeight);
  if (!fontSizePx || Number.isNaN(lineHeightPx) || !lineHeight.endsWith("px")) return null;
  const ratio = lineHeightPx / fontSizePx;
  if (ratio > HEADING_LINE_HEIGHT.max + 0.01) return "loose";
  if (ratio < HEADING_LINE_HEIGHT.min - 0.01) return "tight";
  return null;
};

const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);

/** Semantic headings, plus large short text that is styled as one */
export const isHeadingLike = (element: Element, fontSizePx: number) =>
  HEADING_TAGS.has(element.tagName) ||
  element.getAttribute("role") === "heading" ||
  (fontSizePx >= 24 && (element.textContent || "").trim().length <= 120);

/**
 * Maps resolved values to the custom properties that hold them: `{ "#2563EB": ["--brand"], "16px": ["--space-4"] }`.
 * Lengths in px or rem are indexed as px; anything `parseColor` understands as a colour, as #HEX.
 */
export const indexCssVariables = (
  entries: Array<[name: string, raw: string]>,
  rootFontSize = 16,
  parseColor: (value: string) => RGBA | null = colorToRgb,
): Record<string, string[]> => {
  const index: Record<string, string[]> = {};
  const add = (key: string, name: string) => {
    (index[key] ||= []).includes(name) || index[key].push(name);
  };
  for (const [name, rawValue] of entries) {
    const raw = rawValue.trim();
    if (!raw || raw.length > 80) continue;
    const length = raw.match(/^(-?\d*\.?\d+)(px|rem)$/);
    if (length) {
      const px = parseFloat(length[1]) * (length[2] === "rem" ? rootFontSize : 1);
      if (px !== 0) add(formatPx(Math.abs(px)), name);
      continue;
    }
    // Plain numbers and multi-part values (shadows, font stacks, transitions) are not colours
    if (/^-?[\d.]+$/.test(raw) || /\s/.test(raw.replace(/\([^()]*\)/g, "()"))) continue;
    const rgba = parseColor(raw);
    if (rgba && rgba.a > 0) add(rgbToHex({ ...rgba, a: Math.round(rgba.a * 100) / 100 }), name);
  }
  return index;
};

/** Custom properties declared on the root element (computed, so values are resolved) */
const readRootVariables = (): Record<string, string[]> => {
  const rootElement = document.documentElement;
  const computed = getComputedStyle(rootElement);
  const names = new Set<string>();
  for (let i = 0; i < computed.length; i++) {
    if (computed[i].startsWith("--")) names.add(computed[i]);
  }
  // Not every browser lists custom properties in the computed style; read :root rules as well
  if (!names.size) {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // cross-origin sheet
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule && /(^|,)\s*(:root|html)\s*(,|$)/.test(rule.selectorText)) {
          for (let i = 0; i < rule.style.length; i++) if (rule.style[i].startsWith("--")) names.add(rule.style[i]);
        }
      }
    }
  }
  if (!names.size || names.size > 2000) return {};
  const rootFontSize = parseFloat(computed.fontSize) || 16;
  return indexCssVariables(
    [...names].map((name) => [name, computed.getPropertyValue(name)]),
    rootFontSize,
  );
};

/** The most common class names on a set of elements, for "where does this value come from" hints */
export const topClasses = (elements: Element[], limit = 3): string[] => {
  const counts = new Map<string, number>();
  for (const element of elements) {
    for (const name of Array.from(element.classList)) counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
};

// ---------------------------------------------------------------------------------------------
// Page scan
// ---------------------------------------------------------------------------------------------

class UsageMap {
  private map = new Map<string, ValueUsage>();
  add(value: string, element: Element, size?: number) {
    let usage = this.map.get(value);
    if (!usage) {
      usage = { value, size, count: 0, elements: [] };
      this.map.set(value, usage);
    }
    usage.count++;
    if (usage.elements.length < MAX_ELEMENTS_PER_VALUE && !usage.elements.includes(element)) usage.elements.push(element);
  }
  list() {
    return [...this.map.values()];
  }
}

const hasDirectText = (element: Element) => {
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim().length > 0) return true;
  }
  return false;
};

const toHex = (color: string): { hex: string; rgba: RGBA } | null => {
  const rgba = colorToRgb(color);
  if (!rgba || rgba.a === 0) return null;
  const rounded = { ...rgba, a: Math.round(rgba.a * 100) / 100 };
  return { hex: rgbToHex(rounded), rgba: rounded };
};

const isVisible = (element: Element, style: CSSStyleDeclaration) => {
  if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
  if (parseFloat(style.opacity) === 0) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
};

const familyName = (family: string) => family.split(",")[0].trim().replace(/^["']|["']$/g, "");

const GENERIC_FAMILIES = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-monospace"]);

interface AuditOptions {
  grid?: SpacingGrid;
}

/**
 * Collects values element by element. `visit` is cheap enough per element that the async scan can
 * call it in time slices; `finish` builds the audit and its issues.
 */
const createScanner = () => {
  const textColors = new UsageMap();
  const backgrounds = new UsageMap();
  const borders = new UsageMap();
  const families = new UsageMap();
  const fontSizes = new UsageMap();
  const spacing = new UsageMap();
  const radii = new UsageMap();
  const shadows = new UsageMap();
  const typeStyles = new Map<string, TypeStyle>();
  const rgbaByHex = new Map<string, RGBA>();

  const lowContrast = new Map<string, { fg: string; bg: string; ratio: number; required: number; elements: Element[] }>();
  const tinyText: Element[] = [];
  const tightLines: Element[] = [];
  const looseHeadings: Element[] = [];
  const tightHeadings: Element[] = [];
  let scanned = 0;

  /** Returns false when the element was skipped (hidden, ours, not drawn) */
  const visit = (element: Element): boolean => {
    if (SKIP_TAGS.has(element.tagName) || element.closest("hover-inspector")) return false;
    // SVG internals carry presentation attributes rather than design tokens
    if (element instanceof SVGElement && element.tagName.toLowerCase() !== "svg") return false;

    const style = window.getComputedStyle(element);
    if (!isVisible(element, style)) return false;
    scanned++;

    // Colours
    const bg = toHex(style.backgroundColor);
    if (bg) {
      backgrounds.add(bg.hex, element);
      rgbaByHex.set(bg.hex, bg.rgba);
    }
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      const width = parseFloat(style[`border${side}Width`]);
      if (width > 0 && style[`border${side}Style`] !== "none" && style[`border${side}Style`] !== "hidden") {
        const border = toHex(style[`border${side}Color`]);
        if (border) {
          borders.add(border.hex, element);
          rgbaByHex.set(border.hex, border.rgba);
        }
      }
    }

    // Spacing: every non-zero margin, padding and gap
    for (const prop of [
      "marginTop",
      "marginRight",
      "marginBottom",
      "marginLeft",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "rowGap",
      "columnGap",
    ] as const) {
      const raw = style[prop];
      if (!raw || !raw.endsWith("px")) continue;
      const px = Math.abs(parseFloat(raw));
      if (px > 0) spacing.add(formatPx(px), element, Math.round(px * 100) / 100);
    }

    const radius = parseFloat(style.borderTopLeftRadius);
    if (radius > 0 && style.borderTopLeftRadius.endsWith("px")) radii.add(formatPx(radius), element, radius);

    if (style.boxShadow && style.boxShadow !== "none") shadows.add(style.boxShadow, element);

    // Typography, only where text is actually drawn
    if (hasDirectText(element)) {
      const text = toHex(style.color);
      if (text) {
        textColors.add(text.hex, element);
        rgbaByHex.set(text.hex, text.rgba);
      }

      const size = parseFloat(style.fontSize);
      const sizeKey = formatPx(size);
      fontSizes.add(sizeKey, element, Math.round(size * 100) / 100);
      families.add(familyName(style.fontFamily), element);

      const key = `${style.fontFamily}|${sizeKey}|${style.fontWeight}|${style.lineHeight}`;
      let typeStyle = typeStyles.get(key);
      if (!typeStyle) {
        typeStyle = {
          key,
          family: style.fontFamily,
          familyName: familyName(style.fontFamily),
          size: Math.round(size * 100) / 100,
          weight: style.fontWeight,
          lineHeight: style.lineHeight,
          count: 0,
          elements: [],
        };
        typeStyles.set(key, typeStyle);
      }
      typeStyle.count++;
      if (typeStyle.elements.length < MAX_ELEMENTS_PER_VALUE) typeStyle.elements.push(element);

      // Accessibility checks on drawn text
      if (size < 12) tinyText.push(element);

      const lineHeightPx = parseFloat(style.lineHeight);
      if (!Number.isNaN(lineHeightPx) && lineHeightPx / size < 1.2 && (element.textContent || "").trim().length > 80) {
        tightLines.push(element);
      }

      if (text) {
        const background = getEffectiveBackgroundColor(element);
        const ratio = calculateContrastRatio(style.color, background);
        const weight = parseInt(style.fontWeight, 10) || 400;
        const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
        const required = isLarge ? 3 : 4.5;
        if (ratio < required) {
          const bgHex = toHex(background)?.hex || background;
          const pairKey = `${text.hex}|${bgHex}`;
          const entry = lowContrast.get(pairKey) || { fg: text.hex, bg: bgHex, ratio, required, elements: [] };
          if (entry.elements.length < MAX_ELEMENTS_PER_VALUE) entry.elements.push(element);
          lowContrast.set(pairKey, entry);
        }
      }

      // Headings: line height outside 1.0-1.4x
      if (isHeadingLike(element, size)) {
        const verdict = classifyHeadingLineHeight(size, style.lineHeight);
        if (verdict === "loose" && looseHeadings.length < MAX_ELEMENTS_PER_VALUE) looseHeadings.push(element);
        if (verdict === "tight" && tightHeadings.length < MAX_ELEMENTS_PER_VALUE) tightHeadings.push(element);
      }
    }
    return true;
  };

  const finish = (truncated: boolean, options: AuditOptions = {}): DesignAudit => {
    const byCount = (a: { count: number }, b: { count: number }) => b.count - a.count;
    const bySize = (a: ValueUsage, b: ValueUsage) => (a.size ?? 0) - (b.size ?? 0);
    let variables: Record<string, string[]> = {};
    try {
      variables = readRootVariables();
    } catch {
      variables = {};
    }

    const audit: DesignAudit = {
      scannedElements: scanned,
      truncated,
      grid: options.grid ?? SPACING_GRID,
      variables,
      findings: {
        rgbaByHex,
        a11y: { lowContrast: [...lowContrast.values()], tinyText, tightLines, looseHeadings, tightHeadings },
      },
      colors: {
        text: textColors.list().sort(byCount),
        background: backgrounds.list().sort(byCount),
        border: borders.list().sort(byCount),
      },
      typography: [...typeStyles.values()].sort((a, b) => b.size - a.size || b.count - a.count),
      families: families.list().sort(byCount),
      fontSizes: fontSizes.list().sort(bySize),
      spacing: spacing.list().sort(bySize),
      radii: radii.list().sort(bySize),
      shadows: shadows.list().sort(byCount),
      issues: [],
      score: 100,
    };
    return regradeAudit(audit, audit.grid);
  };

  return { visit, finish, scannedCount: () => scanned };
};

const scanTargets = (root: Element) => root.querySelectorAll("*");

/** Synchronous scan of the first 6000 elements (blocks the page while it runs) */
export const auditPage = (root: Element = document.body, options: AuditOptions = {}): DesignAudit => {
  const scanner = createScanner();
  let truncated = false;
  for (const element of scanTargets(root)) {
    if (scanner.scannedCount() >= MAX_ELEMENTS) {
      truncated = true;
      break;
    }
    scanner.visit(element);
  }
  return scanner.finish(truncated, options);
};

export interface AsyncAuditOptions extends AuditOptions {
  maxElements?: number;
  /** Longest stretch of work before yielding to the page, in ms */
  sliceMs?: number;
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

const yieldToPage = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * The same scan in time slices: the page stays responsive (input, animations) and large pages are
 * scanned up to `maxElements` instead of the synchronous scan's 6000. Rejects with an AbortError
 * when `signal` aborts.
 */
export const auditPageAsync = async (root: Element = document.body, options: AsyncAuditOptions = {}): Promise<DesignAudit> => {
  const { maxElements = MAX_ELEMENTS_ASYNC, sliceMs = 12, onProgress, signal } = options;
  const scanner = createScanner();
  const targets = scanTargets(root);
  const total = targets.length;
  let truncated = false;
  let sliceStart = performance.now();

  for (let i = 0; i < total; i++) {
    if (scanner.scannedCount() >= maxElements) {
      truncated = true;
      break;
    }
    const element = targets[i];
    // The page can change between slices
    if (element.isConnected) scanner.visit(element);

    if ((i & 31) === 31 && performance.now() - sliceStart > sliceMs) {
      onProgress?.(i + 1, total);
      await yieldToPage();
      if (signal?.aborted) throw new DOMException("Design audit cancelled", "AbortError");
      sliceStart = performance.now();
    }
  }
  onProgress?.(total, total);
  return scanner.finish(truncated, options);
};

/** Recomputes the issues and score for another spacing grid, without scanning the page again */
export const regradeAudit = (audit: DesignAudit, grid: SpacingGrid): DesignAudit => {
  const issues = findIssues(audit, audit.findings.rgbaByHex, audit.findings.a11y, { grid });
  return { ...audit, grid, issues, score: scoreIssues(issues) };
};

// ---------------------------------------------------------------------------------------------
// Inconsistency rules
// ---------------------------------------------------------------------------------------------

const elementsOf = (...usages: Array<{ elements: Element[] }>) => {
  const result: Element[] = [];
  usages.forEach((u) => u.elements.forEach((el) => !result.includes(el) && result.push(el)));
  return result.slice(0, MAX_ELEMENTS_PER_VALUE);
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const findIssues = (
  audit: Pick<DesignAudit, "colors" | "families" | "fontSizes" | "spacing" | "radii" | "shadows">,
  rgbaByHex: Map<string, RGBA>,
  a11y: AccessibilityFindings,
  options: { grid?: SpacingGrid } = {},
): DesignIssue[] => {
  const grid = options.grid ?? SPACING_GRID;
  const issues: DesignIssue[] = [];
  const push = (issue: Omit<DesignIssue, "id">) => issues.push({ ...issue, id: `${issue.category}-${issues.length}` });

  // Accessibility first: these affect real users, not just consistency
  a11y.lowContrast
    .sort((a, b) => b.elements.length - a.elements.length)
    .slice(0, 8)
    .forEach((c) =>
      push({
        severity: c.ratio < 3 ? "high" : "medium",
        category: "accessibility",
        // Round down: 4.497 must not read as "4.50:1 needs at least 4.5:1"
        title: `Low text contrast ${(Math.floor(c.ratio * 100) / 100).toFixed(2)}:1`,
        detail: `${c.fg} text on ${c.bg} needs at least ${c.required}:1 (WCAG AA). ${plural(c.elements.length, "element")}.`,
        values: [c.fg, c.bg],
        elements: c.elements,
      }),
    );

  if (a11y.tinyText.length) {
    push({
      severity: "medium",
      category: "accessibility",
      title: "Text smaller than 12px",
      detail: `${a11y.tinyText.length === 1 ? "1 element uses" : `${a11y.tinyText.length} elements use`} a font size below 12px, which is hard to read.`,
      values: [],
      elements: a11y.tinyText.slice(0, MAX_ELEMENTS_PER_VALUE),
    });
  }

  if (a11y.tightLines.length) {
    push({
      severity: "low",
      category: "typography",
      title: "Tight line height on paragraphs",
      detail: `${a11y.tightLines.length === 1 ? "1 text block has" : `${a11y.tightLines.length} text blocks have`} a line height under 1.2× the font size.`,
      values: [],
      elements: a11y.tightLines.slice(0, MAX_ELEMENTS_PER_VALUE),
    });
  }

  if (a11y.looseHeadings?.length) {
    push({
      severity: "low",
      category: "typography",
      title: "Loose line height on headings",
      detail: `${a11y.looseHeadings.length === 1 ? "1 heading has" : `${a11y.looseHeadings.length} headings have`} a line height over ${HEADING_LINE_HEIGHT.max}× the font size, often body text's line height inherited. Headings read better at 1.1–1.3.`,
      values: [],
      elements: a11y.looseHeadings.slice(0, MAX_ELEMENTS_PER_VALUE),
    });
  }

  if (a11y.tightHeadings?.length) {
    push({
      severity: "medium",
      category: "typography",
      title: "Headings with line height under 1",
      detail: `${a11y.tightHeadings.length === 1 ? "1 heading has" : `${a11y.tightHeadings.length} headings have`} a line height smaller than the font size: wrapped lines overlap and descenders can be clipped.`,
      values: [],
      elements: a11y.tightHeadings.slice(0, MAX_ELEMENTS_PER_VALUE),
    });
  }

  // Colours that look the same but are written differently
  const colorGroups: Array<[string, ValueUsage[]]> = [
    ["text", audit.colors.text],
    ["background", audit.colors.background],
    ["border", audit.colors.border],
  ];
  colorGroups.forEach(([kind, usages]) => {
    const near = findNearDuplicates(
      usages,
      (a, b) => {
        const ca = rgbaByHex.get(a.value);
        const cb = rgbaByHex.get(b.value);
        return ca && cb ? deltaE(ca, cb) : Infinity;
      },
      3,
    );
    if (near.length) {
      const pairs = near.slice(0, 12);
      push({
        severity: "medium",
        category: "color",
        title: `${plural(near.length, `near-identical ${kind} colour pair`)}`,
        detail: "These look the same but are written differently. Replace the right value with the left (more used) one.",
        values: [],
        pairs: pairs.map(([keep, drop]) => [keep.value, drop.value]),
        elements: elementsOf(...pairs.map(([, drop]) => drop)),
      });
    }
  });

  const colorLimits: Array<[string, ValueUsage[], number]> = [
    ["text", audit.colors.text, 8],
    ["background", audit.colors.background, 12],
    ["border", audit.colors.border, 8],
  ];
  colorLimits.forEach(([kind, usages, limit]) => {
    if (usages.length > limit) {
      const rare = usages.filter((u) => u.count <= 2);
      push({
        severity: "low",
        category: "color",
        title: `${usages.length} different ${kind} colours`,
        detail: `A consistent palette usually has ${limit} or fewer.${
          rare.length ? ` ${rare.length} of them ${rare.length === 1 ? "is" : "are"} used only once or twice.` : ""
        }`,
        values: rare.slice(0, 10).map((u) => u.value),
        elements: elementsOf(...rare),
      });
    }
  });

  // Typography
  const realFamilies = audit.families.filter((f) => !GENERIC_FAMILIES.has(f.value.toLowerCase()));
  if (realFamilies.length > 3) {
    push({
      severity: "medium",
      category: "typography",
      title: `${realFamilies.length} font families`,
      detail: "Most designs use one or two families plus a monospace one.",
      values: realFamilies.map((f) => f.value),
      elements: elementsOf(...realFamilies.slice(2)),
    });
  }

  if (audit.fontSizes.length > 10) {
    push({
      severity: "medium",
      category: "typography",
      title: `${audit.fontSizes.length} font sizes`,
      detail: "A type scale usually has 6 to 10 steps. Sizes used once or twice are the first to merge.",
      values: audit.fontSizes.map((f) => f.value),
      elements: elementsOf(...audit.fontSizes.filter((f) => f.count <= 2)),
    });
  }

  const closeSizes = findNearDuplicates(audit.fontSizes, (a, b) => Math.abs((a.size ?? 0) - (b.size ?? 0)), 1);
  if (closeSizes.length) {
    push({
      severity: "low",
      category: "typography",
      title: `${plural(closeSizes.length, "font size pair")} 1px apart`,
      detail: "Sizes this close don't read as different steps of a scale. Merge each pair.",
      values: [],
      pairs: closeSizes.slice(0, 12).map(([keep, drop]) => [keep.value, drop.value]),
      elements: elementsOf(...closeSizes.map(([, drop]) => drop)),
    });
  }

  const fractional = audit.fontSizes.filter((f) => f.size !== undefined && Math.abs(f.size - Math.round(f.size)) > 0.05);
  if (fractional.length) {
    push({
      severity: "low",
      category: "typography",
      title: "Fractional font sizes",
      detail: "Sizes like 13.33px usually come from em/percent math rather than a deliberate scale.",
      values: fractional.map((f) => f.value),
      elements: elementsOf(...fractional),
    });
  }

  // Spacing
  const offGrid = audit.spacing.filter((s) => s.size !== undefined && !isOnGrid(s.size, grid));
  if (offGrid.length) {
    const offUses = offGrid.reduce((sum, s) => sum + s.count, 0);
    const allUses = audit.spacing.reduce((sum, s) => sum + s.count, 0) || 1;
    const share = offUses / allUses;
    push({
      severity: share > 0.25 ? "medium" : "low",
      category: "spacing",
      title: `${plural(offGrid.length, "spacing value")} off the ${grid}px grid`,
      detail: `${Math.round(share * 100)}% of margins, paddings and gaps aren't multiples of ${grid}px.`,
      values: offGrid.map((s) => s.value),
      elements: elementsOf(...offGrid),
    });
  }

  if (audit.spacing.length > 14) {
    push({
      severity: "low",
      category: "spacing",
      title: `${audit.spacing.length} different spacing values`,
      detail: "A spacing scale usually has 8 to 12 steps.",
      values: audit.spacing.map((s) => s.value),
      elements: elementsOf(...audit.spacing.filter((s) => s.count <= 2)),
    });
  }

  // Radii and shadows
  const closeRadii = findNearDuplicates(audit.radii, (a, b) => Math.abs((a.size ?? 0) - (b.size ?? 0)), 1);
  if (closeRadii.length) {
    push({
      severity: "low",
      category: "radius",
      title: `${plural(closeRadii.length, "corner radius pair")} 1px apart`,
      detail: "These radii look the same. Merge each pair.",
      values: [],
      pairs: closeRadii.slice(0, 12).map(([keep, drop]) => [keep.value, drop.value]),
      elements: elementsOf(...closeRadii.map(([, drop]) => drop)),
    });
  }

  if (audit.radii.length > 6) {
    push({
      severity: "low",
      category: "radius",
      title: `${audit.radii.length} corner radii`,
      detail: "Most designs need 3 to 5 radius steps.",
      values: audit.radii.map((r) => r.value),
      elements: elementsOf(...audit.radii.filter((r) => r.count <= 2)),
    });
  }

  if (audit.shadows.length > 5) {
    push({
      severity: "low",
      category: "shadow",
      title: `${audit.shadows.length} box shadows`,
      detail: "An elevation scale usually has 3 to 5 shadows.",
      values: [],
      elements: elementsOf(...audit.shadows.filter((s) => s.count <= 2)),
    });
  }

  const order: Record<IssueSeverity, number> = { high: 0, medium: 1, low: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
};

export const scoreIssues = (issues: DesignIssue[]) => {
  const weights: Record<IssueSeverity, number> = { high: 12, medium: 6, low: 2 };
  const penalty = issues.reduce((sum, issue) => sum + weights[issue.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
};

/** The page's values as CSS custom properties, like a design system's token file */
export const auditToCssVariables = (audit: DesignAudit): string => {
  const lines: string[] = [":root {"];
  const section = (title: string, entries: Array<[string, string]>) => {
    if (!entries.length) return;
    lines.push(`  /* ${title} */`);
    entries.forEach(([name, value]) => lines.push(`  --${name}: ${value};`));
  };
  section("Text colours", audit.colors.text.map((c, i) => [`color-text-${i + 1}`, c.value]));
  section("Background colours", audit.colors.background.map((c, i) => [`color-bg-${i + 1}`, c.value]));
  section("Border colours", audit.colors.border.map((c, i) => [`color-border-${i + 1}`, c.value]));
  section("Font families", audit.families.map((f, i) => [`font-family-${i + 1}`, f.value.includes(" ") ? `"${f.value}"` : f.value]));
  section("Font sizes", audit.fontSizes.map((f, i) => [`font-size-${i + 1}`, f.value]));
  section("Spacing", audit.spacing.map((s, i) => [`space-${i + 1}`, s.value]));
  section("Radii", audit.radii.map((r, i) => [`radius-${i + 1}`, r.value]));
  section("Shadows", audit.shadows.map((s, i) => [`shadow-${i + 1}`, s.value]));
  lines.push("}");
  return lines.join("\n");
};
