/** One breakpoint of a CSS framework: the range of viewport widths it covers */
export interface Breakpoint {
  name: string;
  /** Inclusive lower bound in CSS px */
  min: number;
  /** Inclusive upper bound in CSS px; missing for the last, open-ended breakpoint */
  max?: number;
}

export interface FrameworkBreakpoints {
  id: string;
  name: string;
  /** Link to the framework's own breakpoint docs */
  source: string;
  breakpoints: Breakpoint[];
}

export enum PageRulerTab {
  Viewport = "viewport",
  Breakpoints = "breakpoints",
  Checks = "checks",
  Reference = "reference",
}

export interface ViewportInfo {
  /** window.innerWidth/innerHeight: what media queries match against, scrollbar included */
  innerWidth: number;
  innerHeight: number;
  /** documentElement.clientWidth/clientHeight: the layout area without scrollbars */
  clientWidth: number;
  clientHeight: number;
  scrollbarWidth: number;
  documentWidth: number;
  documentHeight: number;
  screenWidth: number;
  screenHeight: number;
  availWidth: number;
  availHeight: number;
  devicePixelRatio: number;
  /** Pinch zoom (visualViewport.scale); 1 when the page isn't pinch-zoomed */
  pinchZoom: number;
  rootFontSize: number;
  orientation: Orientation;
  colorDepth: number;
}

export enum Orientation {
  Landscape = "landscape",
  Portrait = "portrait",
}

/** A CSS media feature the page can query, with its value in this browser right now */
export interface MediaFeatureValue {
  feature: string;
  value: string;
}

export enum CheckStatus {
  Pass = "pass",
  Warn = "warn",
  Fail = "fail",
  Info = "info",
}

export interface PageCheck {
  id: string;
  title: string;
  status: CheckStatus;
  detail: string;
  /** Standard or guideline the check is based on, e.g. "WCAG 2.2 · 1.4.10 Reflow (AA)" */
  standard?: string;
  source?: string;
  /** Elements that break the rule, so the panel can point at them */
  elements?: Element[];
}

/** Parsed `<meta name="viewport">` content */
export interface ViewportMeta {
  present: boolean;
  content: string;
  hasDeviceWidth: boolean;
  /** user-scalable=no, or maximum-scale below 2: people can't zoom the page to 200% */
  blocksZoom: boolean;
}

export interface ReferenceRow {
  label: string;
  value: string;
  note?: string;
}

export interface ReferenceSection {
  id: string;
  title: string;
  rows: ReferenceRow[];
  sources: Array<{ label: string; url: string }>;
}
