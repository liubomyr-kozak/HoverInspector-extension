import { ABSOLUTE_UNITS } from "../data/references";
import { Orientation, type Breakpoint, type MediaFeatureValue, type ViewportInfo } from "../types";

export const readViewportInfo = (win: Window = window): ViewportInfo => {
  const doc = win.document.documentElement;
  const innerWidth = win.innerWidth;
  const innerHeight = win.innerHeight;
  return {
    innerWidth,
    innerHeight,
    clientWidth: doc.clientWidth,
    clientHeight: doc.clientHeight,
    // clientWidth is 0 before layout in some documents; never report a negative scrollbar
    scrollbarWidth: Math.max(0, innerWidth - (doc.clientWidth || innerWidth)),
    documentWidth: doc.scrollWidth,
    documentHeight: doc.scrollHeight,
    screenWidth: win.screen.width,
    screenHeight: win.screen.height,
    availWidth: win.screen.availWidth,
    availHeight: win.screen.availHeight,
    devicePixelRatio: win.devicePixelRatio || 1,
    pinchZoom: win.visualViewport?.scale ?? 1,
    rootFontSize: parseFloat(win.getComputedStyle(doc).fontSize) || 16,
    orientation: innerWidth >= innerHeight ? Orientation.Landscape : Orientation.Portrait,
    colorDepth: win.screen.colorDepth,
  };
};

export const getActiveBreakpoint = (breakpoints: Breakpoint[], width: number) =>
  breakpoints.find((bp) => width >= bp.min && (bp.max === undefined || width <= bp.max));

/** Next breakpoint up from the current width, and how many px wider the viewport has to get to reach it */
export const getNextBreakpoint = (breakpoints: Breakpoint[], width: number) => {
  const next = breakpoints.find((bp) => bp.min > width);
  return next ? { breakpoint: next, distance: next.min - width } : undefined;
};

export const formatRange = (bp: Breakpoint) => {
  if (bp.min === 0) return bp.max === undefined ? "any width" : `< ${bp.max + 1}px`;
  return bp.max === undefined ? `≥ ${bp.min}px` : `${bp.min}–${bp.max}px`;
};

/** The media query that matches exactly this breakpoint's range */
export const mediaQueryFor = (bp: Breakpoint) => {
  const parts: string[] = [];
  if (bp.min > 0) parts.push(`(min-width: ${bp.min}px)`);
  if (bp.max !== undefined) parts.push(`(max-width: ${bp.max}px)`);
  return parts.length ? `@media ${parts.join(" and ")}` : "/* no media query: applies to every width */";
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Common aspect ratio names; the viewport gets the closest one when it's within 2% */
const NAMED_RATIOS: Array<[label: string, ratio: number]> = [
  ["1:1", 1],
  ["5:4", 5 / 4],
  ["4:3", 4 / 3],
  ["3:2", 3 / 2],
  ["16:10", 16 / 10],
  ["16:9", 16 / 9],
  ["2:1", 2],
  ["21:9", 21 / 9],
];

export const describeAspectRatio = (width: number, height: number) => {
  if (!width || !height) return "";
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  const ratio = long / short;
  const named = NAMED_RATIOS.find(([, value]) => Math.abs(ratio - value) / value <= 0.02);
  const divisor = gcd(width, height);
  const exact = `${width / divisor}:${height / divisor}`;
  const label = named ? (width >= height ? named[0] : named[0].split(":").reverse().join(":")) : "";
  return `${ratio.toFixed(2)}${label ? ` (≈ ${label})` : exact.length <= 7 ? ` (${exact})` : ""}`;
};

/** A value in px without trailing zeros: 16, 37.8, 1.333 */
export const formatPx = (value: number, digits = 3) => `${Number(value.toFixed(digits))}px`;

/** Media features a stylesheet can query, in the order designers usually check them */
const MEDIA_FEATURES: Array<{ feature: string; values: string[] }> = [
  { feature: "prefers-color-scheme", values: ["dark", "light"] },
  { feature: "prefers-reduced-motion", values: ["reduce", "no-preference"] },
  { feature: "prefers-contrast", values: ["more", "less", "custom", "no-preference"] },
  { feature: "forced-colors", values: ["active", "none"] },
  { feature: "pointer", values: ["fine", "coarse", "none"] },
  { feature: "hover", values: ["hover", "none"] },
  { feature: "any-pointer", values: ["fine", "coarse", "none"] },
  { feature: "color-gamut", values: ["rec2020", "p3", "srgb"] },
  { feature: "dynamic-range", values: ["high", "standard"] },
  { feature: "display-mode", values: ["fullscreen", "standalone", "minimal-ui", "browser"] },
];

/** All the media query strings `readMediaFeatures` evaluates, so callers can listen for changes */
export const MEDIA_FEATURE_QUERIES = MEDIA_FEATURES.flatMap(({ feature, values }) =>
  values.map((value) => `(${feature}: ${value})`),
);

export const readMediaFeatures = (matches: (query: string) => boolean): MediaFeatureValue[] =>
  MEDIA_FEATURES.map(({ feature, values }) => ({
    feature,
    value: values.find((value) => matches(`(${feature}: ${value})`)) ?? "not supported",
  }));

/** Unit equivalents for the current page: the fixed CSS units plus the ones that depend on it */
export const unitRows = (info: ViewportInfo): Array<[unit: string, px: string]> => [
  ["1 rem", formatPx(info.rootFontSize)],
  ["1 vw", formatPx(info.innerWidth / 100, 2)],
  ["1 vh", formatPx(info.innerHeight / 100, 2)],
  ["1 device px", formatPx(1 / info.devicePixelRatio)],
  ...ABSOLUTE_UNITS.map(([unit, px]): [string, string] => [unit, formatPx(px)]),
];

/** Plain-text summary for bug reports */
export const viewportReport = (info: ViewportInfo, features: MediaFeatureValue[], userAgent: string) =>
  [
    `Viewport: ${info.innerWidth} × ${info.innerHeight}px (layout ${info.clientWidth} × ${info.clientHeight}px)`,
    `Screen: ${info.screenWidth} × ${info.screenHeight}px, available ${info.availWidth} × ${info.availHeight}px`,
    `Device pixel ratio: ${info.devicePixelRatio}${info.pinchZoom !== 1 ? `, pinch zoom ${info.pinchZoom.toFixed(2)}` : ""}`,
    `Root font size: ${info.rootFontSize}px`,
    `Document: ${info.documentWidth} × ${info.documentHeight}px`,
    ...features.map(({ feature, value }) => `${feature}: ${value}`),
    `User agent: ${userAgent}`,
  ].join("\n");
