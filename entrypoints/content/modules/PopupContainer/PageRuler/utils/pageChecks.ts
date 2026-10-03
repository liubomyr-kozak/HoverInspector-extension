import { CheckStatus, type PageCheck, type ViewportMeta } from "../types";

const wcag = (slug: string) => `https://www.w3.org/WAI/WCAG22/Understanding/${slug}.html`;

/** Upper bounds so a check stays fast on huge pages */
const MAX_SCANNED_ELEMENTS = 6000;
const MAX_REPORTED_ELEMENTS = 50;

/** WCAG 2.5.8 minimum target size, CSS px */
export const MIN_TARGET_SIZE = 24;
/** iOS Safari zooms into form fields with a smaller font size */
export const MIN_IOS_INPUT_FONT_SIZE = 16;

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input:not([type=hidden])",
  "select",
  "textarea",
  "summary",
  "[role=button]",
  "[role=link]",
  "[role=checkbox]",
  "[role=radio]",
  "[role=switch]",
  "[role=tab]",
  "[role=menuitem]",
].join(",");

const TEXT_INPUT_SELECTOR = [
  "textarea",
  "select",
  ...["text", "search", "email", "url", "tel", "password", "number", "date", "time", "datetime-local", "month", "week"].map(
    (type) => `input[type=${type}]`,
  ),
  "input:not([type])",
  "[contenteditable=true]",
].join(",");

/** The extension's own UI lives under this element and is never part of the checks */
const isOwnUi = (el: Element) => el.closest("hover-inspector") !== null;

export const parseViewportMeta = (content: string | null | undefined): ViewportMeta => {
  if (content == null) return { present: false, content: "", hasDeviceWidth: false, blocksZoom: false };
  const entries = new Map<string, string>();
  content
    .toLowerCase()
    .split(/[,;]/)
    .forEach((part) => {
      const [key, value = ""] = part.split("=").map((s) => s.trim());
      if (key) entries.set(key, value);
    });
  const maxScale = parseFloat(entries.get("maximum-scale") ?? "");
  const userScalable = entries.get("user-scalable");
  return {
    present: true,
    content: content.trim(),
    hasDeviceWidth: entries.get("width") === "device-width",
    blocksZoom: userScalable === "no" || userScalable === "0" || (!Number.isNaN(maxScale) && maxScale < 2),
  };
};

/**
 * Outermost elements whose box sticks out past the right edge of the layout viewport. Their descendants
 * are skipped (they stick out only because their parent does), and so are scroll containers and fixed
 * elements, which can't make the page scroll sideways.
 */
export const findHorizontalOverflow = (doc: Document, viewportWidth: number): Element[] => {
  const win = doc.defaultView;
  if (!doc.body || !win) return [];
  const found: Element[] = [];
  let scanned = 0;
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const el = node as Element;
      if (++scanned > MAX_SCANNED_ELEMENTS || found.length >= MAX_REPORTED_ELEMENTS) return NodeFilter.FILTER_REJECT;
      if (el.tagName === "HOVER-INSPECTOR") return NodeFilter.FILTER_REJECT;
      const style = win.getComputedStyle(el);
      if (style.display === "none" || style.position === "fixed") return NodeFilter.FILTER_REJECT;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.right + win.scrollX > viewportWidth + 1) {
        found.push(el);
        return NodeFilter.FILTER_REJECT;
      }
      return style.overflowX === "visible" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  // acceptNode does the collecting; walking the tree is all that's left
  while (walker.nextNode()) continue;
  return found;
};

/** A link that sits in a run of text is exempt from the target size rule (WCAG 2.5.8 "inline" exception) */
const isInlineTextLink = (el: Element, win: Window) => {
  if (el.tagName !== "A" || win.getComputedStyle(el).display !== "inline") return false;
  const parentText = el.parentElement?.textContent?.trim().length ?? 0;
  return parentText > (el.textContent?.trim().length ?? 0);
};

const hasLargeLabel = (el: Element) =>
  "labels" in el &&
  Array.from((el as HTMLInputElement).labels ?? []).some((label) => {
    const rect = label.getBoundingClientRect();
    return rect.width >= MIN_TARGET_SIZE && rect.height >= MIN_TARGET_SIZE;
  });

/** Visible, enabled controls smaller than 24 × 24 CSS px */
export const findSmallTargets = (doc: Document): Element[] => {
  const win = doc.defaultView;
  if (!win) return [];
  const found: Element[] = [];
  const candidates = doc.querySelectorAll(INTERACTIVE_SELECTOR);
  const count = Math.min(candidates.length, MAX_SCANNED_ELEMENTS);
  for (let i = 0; i < count && found.length < MAX_REPORTED_ELEMENTS; i++) {
    const el = candidates[i];
    if ((el as HTMLButtonElement).disabled || isOwnUi(el)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.width >= MIN_TARGET_SIZE && rect.height >= MIN_TARGET_SIZE) continue;
    if (win.getComputedStyle(el).visibility === "hidden") continue;
    if (isInlineTextLink(el, win) || hasLargeLabel(el)) continue;
    found.push(el);
  }
  return found;
};

/** Visible text fields whose font size makes iOS Safari zoom in on focus */
export const findSmallInputFonts = (doc: Document): Element[] => {
  const win = doc.defaultView;
  if (!win) return [];
  return Array.from(doc.querySelectorAll(TEXT_INPUT_SELECTOR))
    .slice(0, MAX_SCANNED_ELEMENTS)
    .filter((el) => {
      if (isOwnUi(el)) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      return parseFloat(win.getComputedStyle(el).fontSize) < MIN_IOS_INPUT_FONT_SIZE;
    })
    .slice(0, MAX_REPORTED_ELEMENTS);
};

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** Runs every page check against the current document at its current size */
export const runPageChecks = (doc: Document = document): PageCheck[] => {
  const html = doc.documentElement;
  const win = doc.defaultView ?? window;
  const width = html.clientWidth || win.innerWidth;
  const meta = parseViewportMeta(doc.querySelector('meta[name="viewport" i]')?.getAttribute("content"));
  const checks: PageCheck[] = [];

  checks.push({
    id: "viewport-meta",
    title: "Viewport meta tag",
    standard: "Responsive design basics",
    source: "https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag",
    ...(meta.present && meta.hasDeviceWidth
      ? { status: CheckStatus.Pass, detail: `Found: ${meta.content}` }
      : {
          status: CheckStatus.Warn,
          detail: meta.present
            ? `"${meta.content}" has no width=device-width, so phones may lay the page out wider than the screen.`
            : 'No <meta name="viewport">. Phones lay the page out at about 980px and shrink it.',
        }),
  });

  checks.push({
    id: "zoom",
    title: "Page can be zoomed",
    standard: "WCAG 2.2 · 1.4.4 Resize text (AA)",
    source: wcag("resize-text"),
    ...(meta.blocksZoom
      ? {
          status: CheckStatus.Fail,
          detail: `"${meta.content}" stops people from zooming. Remove user-scalable=no and any maximum-scale below 2.`,
        }
      : { status: CheckStatus.Pass, detail: "The viewport meta tag doesn't block pinch zoom." }),
  });

  const overflow = html.scrollWidth > width + 1 ? findHorizontalOverflow(doc, width) : [];
  checks.push({
    id: "reflow",
    title: "No horizontal scrolling",
    standard: "WCAG 2.2 · 1.4.10 Reflow (AA)",
    source: wcag("reflow"),
    elements: overflow,
    ...(html.scrollWidth > width + 1
      ? {
          status: CheckStatus.Fail,
          detail: `The page is ${html.scrollWidth}px wide in a ${width}px viewport.${
            overflow.length ? ` ${plural(overflow.length, "element")} ${overflow.length === 1 ? "sticks" : "stick"} out past the right edge.` : ""
          }`,
        }
      : {
          status: CheckStatus.Pass,
          detail:
            width > 320
              ? `Fits at ${width}px. WCAG asks for no sideways scrolling at 320px: check that width in DevTools device mode.`
              : `Fits at ${width}px.`,
        }),
  });

  const smallTargets = findSmallTargets(doc);
  checks.push({
    id: "target-size",
    title: `Targets at least ${MIN_TARGET_SIZE} × ${MIN_TARGET_SIZE}px`,
    standard: "WCAG 2.2 · 2.5.8 Target size (AA)",
    source: wcag("target-size-minimum"),
    elements: smallTargets,
    ...(smallTargets.length
      ? {
          status: CheckStatus.Warn,
          detail: `${plural(smallTargets.length, "control")} smaller than ${MIN_TARGET_SIZE}px${
            smallTargets.length >= MAX_REPORTED_ELEMENTS ? " (first 50)" : ""
          }. They still pass if nothing else is within ${MIN_TARGET_SIZE}px of them.`,
        }
      : { status: CheckStatus.Pass, detail: "Every visible control is big enough. Links inside text are exempt." }),
  });

  const smallInputs = findSmallInputFonts(doc);
  checks.push({
    id: "ios-input-zoom",
    title: `Form fields at least ${MIN_IOS_INPUT_FONT_SIZE}px`,
    standard: "iOS Safari",
    elements: smallInputs,
    ...(smallInputs.length
      ? {
          status: CheckStatus.Warn,
          detail: `${plural(smallInputs.length, "field")} below ${MIN_IOS_INPUT_FONT_SIZE}px: Safari on iPhone zooms the page in when one gets focus.`,
        }
      : { status: CheckStatus.Pass, detail: "No visible text field makes iOS zoom in on focus." }),
  });

  const rootFontSize = parseFloat(win.getComputedStyle(html).fontSize) || 16;
  checks.push({
    id: "root-font",
    title: "Root font size",
    standard: "Browser default 16px",
    ...(rootFontSize === 16
      ? { status: CheckStatus.Pass, detail: "16px, the browser default, so 1 rem = 16px." }
      : {
          status: CheckStatus.Info,
          detail: `${rootFontSize}px, so 1 rem = ${rootFontSize}px. Set in px, it ignores the reader's browser font size; a percentage keeps it.`,
        }),
  });

  return checks;
};
