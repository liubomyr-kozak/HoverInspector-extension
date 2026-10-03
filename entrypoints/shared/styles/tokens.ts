/**
 * Design tokens shared by every tool panel.
 *
 * The same values are exposed as CSS custom properties on the shadow host (see content/style.css)
 * and as the antd theme (see content/app.tsx), so Tailwind classes, styled-components and antd
 * controls all land on one palette. Colours are chosen to meet WCAG AA (4.5:1) on white for text.
 */
export const tokens = {
  color: {
    /** Primary actions, selected state, links. Tailwind blue-600: 5.2:1 on white */
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    primaryBg: "#eff6ff",
    primaryBorder: "#bfdbfe",
    /** Body text */
    text: "#1f2937",
    /** Secondary text (labels, captions). 7.6:1 on white */
    textSecondary: "#4b5563",
    /** Muted hints and empty-state copy. 4.8:1 on white, still AA */
    textMuted: "#6b7280",
    border: "#e5e7eb",
    borderStrong: "#d1d5db",
    surface: "#ffffff",
    surfaceMuted: "#f9fafb",
    danger: "#dc2626",
    dangerHover: "#b91c1c",
    dangerBg: "#fef2f2",
    success: "#15803d",
    successBg: "#f0fdf4",
    warning: "#b45309",
    warningBg: "#fffbeb",
    focusRing: "#2563eb",
  },
  radius: { sm: 4, md: 6, lg: 8 },
  /** Control heights: small (chips, compact toolbars) and default (inputs, buttons) */
  control: { sm: 24, md: 32 },
  font: {
    family:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    /** caption / body-small / body / section heading */
    size: { xs: 12, sm: 13, md: 14, lg: 16 },
  },
} as const;

/**
 * antd draws keyboard focus with its pale colorPrimaryBorder (about 1.6:1 on white) and text fields with
 * a 10%-opacity halo. Give both the same solid primary ring as the hand-built controls. These are
 * component-level overrides, so ordinary borders (which also derive from the alias tokens) don't change.
 */
const focusOutline = { colorPrimaryBorder: tokens.color.focusRing, lineWidthFocus: 2 };
const focusShadow = `0 0 0 2px ${tokens.color.focusRing}`;

/** antd theme derived from the tokens, so antd's own controls match the hand-built ones */
export const antdTheme = {
  token: {
    colorPrimary: tokens.color.primary,
    colorLink: tokens.color.primary,
    colorError: tokens.color.danger,
    colorSuccess: tokens.color.success,
    colorTextDescription: tokens.color.textMuted,
    borderRadius: tokens.radius.md,
    fontFamily: tokens.font.family,
    fontSize: tokens.font.size.md,
    controlHeight: tokens.control.md,
    controlHeightSM: tokens.control.sm,
  },
  components: {
    Button: focusOutline,
    Checkbox: focusOutline,
    Radio: focusOutline,
    // The unchecked track was 25% black (#bfbfbf): its white "No" label was 1.9:1 and the track 1.8:1
    Switch: { ...focusOutline, colorTextQuaternary: tokens.color.textMuted, colorTextTertiary: tokens.color.textSecondary },
    Segmented: focusOutline,
    Tabs: focusOutline,
    Collapse: focusOutline,
    Pagination: focusOutline,
    Dropdown: focusOutline,
    Menu: focusOutline,
    Modal: focusOutline,
    Drawer: focusOutline,
    Tree: focusOutline,
    Input: { activeShadow: focusShadow },
    InputNumber: { activeShadow: focusShadow },
    DatePicker: { activeShadow: focusShadow },
    Mentions: { activeShadow: focusShadow },
    Select: { activeOutlineColor: tokens.color.focusRing },
    Cascader: { activeOutlineColor: tokens.color.focusRing },
    TreeSelect: { activeOutlineColor: tokens.color.focusRing },
  },
};
