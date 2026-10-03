import type { ReferenceSection } from "../types";

const wcag = (slug: string) => `https://www.w3.org/WAI/WCAG22/Understanding/${slug}.html`;

/** Rules of thumb and standards people check page sizes against, with the documents they come from */
export const REFERENCE_SECTIONS: ReferenceSection[] = [
  {
    id: "layout",
    title: "Layout and zoom",
    rows: [
      {
        label: "Reflow (WCAG 1.4.10, AA)",
        value: "320px wide",
        note: "Content works at 320 CSS px without horizontal scrolling (256px tall for horizontal text). Same as 1280px at 400% zoom.",
      },
      {
        label: "Resize text (WCAG 1.4.4, AA)",
        value: "200%",
        note: "Text can be zoomed to 200% without losing content or functions.",
      },
      {
        label: "Viewport meta",
        value: "width=device-width, initial-scale=1",
        note: "Without it phones lay the page out at about 980px and shrink it.",
      },
      {
        label: "Don't block zoom",
        value: "no user-scalable=no",
        note: "And no maximum-scale below 2: people with low vision zoom in.",
      },
      { label: "Spacing grid", value: "4px / 8px", note: "Most design systems space and size in multiples of 4 or 8." },
    ],
    sources: [
      { label: "WCAG 1.4.10", url: wcag("reflow") },
      { label: "WCAG 1.4.4", url: wcag("resize-text") },
      { label: "MDN: viewport meta", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag" },
    ],
  },
  {
    id: "targets",
    title: "Touch targets",
    rows: [
      {
        label: "WCAG 2.5.8 (AA)",
        value: "24 × 24px",
        note: "Or enough space that a 24px circle on each target doesn't overlap another. Links inside text are exempt.",
      },
      { label: "WCAG 2.5.5 (AAA)", value: "44 × 44px" },
      { label: "Apple HIG", value: "44 × 44pt" },
      { label: "Material Design", value: "48 × 48dp", note: "With at least 8dp between targets." },
      { label: "Windows (Fluent)", value: "40 × 40epx", note: "About 7.5 mm." },
    ],
    sources: [
      { label: "WCAG 2.5.8", url: wcag("target-size-minimum") },
      { label: "WCAG 2.5.5", url: wcag("target-size-enhanced") },
      { label: "Apple HIG", url: "https://developer.apple.com/design/human-interface-guidelines/accessibility" },
      { label: "Material", url: "https://m3.material.io/foundations/designing/structure" },
    ],
  },
  {
    id: "text",
    title: "Text",
    rows: [
      { label: "Body text", value: "16px", note: "The browser default; smaller body text is hard to read on phones." },
      { label: "Form fields on iOS", value: "≥ 16px", note: "Below 16px Safari zooms the page in when the field gets focus." },
      { label: "Line length", value: "45–75 characters", note: "About 66 is comfortable for body text." },
      { label: "Line height", value: "≥ 1.5 for body", note: "Headings usually sit between 1.1 and 1.3." },
      {
        label: "Text spacing (WCAG 1.4.12, AA)",
        value: "1.5 · 2 · 0.12 · 0.16",
        note: "Nothing breaks when line height, paragraph, letter and word spacing are raised to these multiples of the font size.",
      },
      { label: "Large text", value: "≥ 24px, or ≥ 18.66px bold", note: "Counts as large for the contrast rules." },
    ],
    sources: [
      { label: "WCAG 1.4.12", url: wcag("text-spacing") },
      { label: "WCAG 1.4.8", url: wcag("visual-presentation") },
    ],
  },
  {
    id: "contrast",
    title: "Contrast",
    rows: [
      { label: "Text (WCAG 1.4.3, AA)", value: "4.5 : 1", note: "3 : 1 for large text." },
      { label: "Text (WCAG 1.4.6, AAA)", value: "7 : 1", note: "4.5 : 1 for large text." },
      { label: "UI and graphics (WCAG 1.4.11, AA)", value: "3 : 1", note: "Borders of controls, focus rings, icons, chart lines." },
    ],
    sources: [
      { label: "WCAG 1.4.3", url: wcag("contrast-minimum") },
      { label: "WCAG 1.4.11", url: wcag("non-text-contrast") },
    ],
  },
  {
    id: "devices",
    title: "Device viewports",
    rows: [
      { label: "iPhone SE", value: "375 × 667" },
      { label: "iPhone 15 / 16", value: "393 × 852" },
      { label: "iPhone 15 / 16 Pro Max", value: "430 × 932" },
      { label: "Typical Android", value: "360 × 800" },
      { label: "Pixel 7 / 8", value: "412 × 915" },
      { label: "iPad mini", value: "744 × 1133" },
      { label: "iPad Air 11″", value: "820 × 1180" },
      { label: "iPad Pro 12.9″", value: "1024 × 1366" },
      { label: "Laptop, 1080p at 125%", value: "1536 × 864", note: "The most common Windows laptop setting." },
      { label: "MacBook Air 13″", value: "1440 × 900", note: "1470 × 956 on M2 and later." },
      { label: "Full HD desktop", value: "1920 × 1080" },
    ],
    sources: [{ label: "MDN: viewport concepts", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Viewport_concepts" }],
  },
];

/** Fixed CSS absolute units in px (CSS Values 4: 1in = 96px) */
export const ABSOLUTE_UNITS: Array<[unit: string, px: number]> = [
  ["1 in", 96],
  ["1 cm", 96 / 2.54],
  ["1 mm", 96 / 25.4],
  ["1 Q", 96 / 101.6],
  ["1 pt", 96 / 72],
  ["1 pc", 16],
];
