/** Example theme and the AI prompt offered by the theme import (see THEME_FORMAT.md) */

export const EXAMPLE_THEME = {
  name: "Example: Acme UI",
  colors: {
    primary: "#2563eb",
    "primary-hover": "#1d4ed8",
    text: "#1f2937",
    "text-muted": "#6b7280",
    background: "#ffffff",
    surface: "#f9fafb",
    border: "#e5e7eb",
    danger: "#dc2626",
    success: "#15803d",
  },
  spacing: { "0.5": "2px", "1": "4px", "2": "8px", "3": "12px", "4": "16px", "6": "24px", "8": "32px", "12": "48px" },
  radii: { sm: "4px", md: "6px", lg: "8px", full: "9999px" },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  },
  borders: { default: "1px solid #e5e7eb", strong: "1px solid #d1d5db", focus: "2px solid #2563eb" },
  typography: {
    fontFamilies: { sans: "Inter, system-ui, sans-serif", mono: "ui-monospace, Menlo, monospace" },
    fontSizes: { xs: "12px", sm: "14px", base: "16px", lg: "18px", xl: "20px", "2xl": "24px", "3xl": "30px" },
    fontWeights: { regular: "400", medium: "500", semibold: "600", bold: "700" },
    lineHeights: { tight: "1.25", normal: "1.5", relaxed: "1.75" },
  },
};

export const EXAMPLE_THEME_TEXT = JSON.stringify(EXAMPLE_THEME, null, 2);

export const AI_THEME_PROMPT = `Create a design token theme for my brand as JSON, for checking a website against it.

Brand: <describe the brand, or paste its style guide / main colours / fonts here>

Reply with only the JSON, in exactly this shape (token names are up to you, values are CSS values):
{
  "name": "<theme name>",
  "colors": { "primary": "#2563eb", "text": "#1f2937", "...": "..." },
  "spacing": { "1": "4px", "2": "8px", "...": "..." },
  "radii": { "sm": "4px", "md": "8px", "full": "9999px" },
  "shadows": { "sm": "0 1px 2px rgba(0, 0, 0, 0.05)", "...": "..." },
  "borders": { "default": "1px solid #e5e7eb", "...": "..." },
  "typography": {
    "fontFamilies": { "sans": "Inter, system-ui, sans-serif" },
    "fontSizes": { "sm": "14px", "base": "16px", "...": "..." },
    "fontWeights": { "regular": "400", "bold": "700" },
    "lineHeights": { "tight": "1.25", "normal": "1.5" }
  }
}

Rules:
- Colours as #hex (or rgba() when transparent), lengths in px or rem, line heights unitless.
- Include every colour of the palette (brand, text, backgrounds, borders, states), a spacing scale, radii, shadows, borders and the type scale.
- No comments, no explanation, valid JSON only.`;
