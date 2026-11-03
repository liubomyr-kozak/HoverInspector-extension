/**
 * Constants for the CSS Snapshot Inspector
 */

/**
 * Standard styles to skip when capturing and comparing
 */
export const DEFAULT_STYLES_TO_SKIP = [
  // Animations and transitions
  "animation", "transition", 
  "animation-delay", "animation-direction", "animation-duration",
  "animation-fill-mode", "animation-iteration-count", "animation-name",
  "animation-play-state", "animation-timing-function",
  "transition-delay", "transition-duration", "transition-property", "transition-timing-function",
  
  // Box model properties
  "margin-block", "margin-inline", "padding-block", "padding-inline",
  "inset-block", "inset-inline", "block-size", "inline-size",
  
  // Browser-specific properties
  "text-rendering", "appearance", "-webkit-appearance", "-moz-appearance",
  "user-select", "-webkit-user-select", "-moz-user-select", "-ms-user-select",
  "backface-visibility", "perspective", "perspective-origin", "transform-style",
  "mask", "clip", "clip-path", "filter", "backdrop-filter",
  "will-change", "isolation", "mix-blend-mode", "object-fit", "object-position",
] as const;

/**
 * Default values to skip
 */
export const DEFAULT_VALUES_TO_SKIP = [
  "none", "normal", "auto", "0px", "0", "medium", "inherit", 
  "initial", "unset", "revert", "transparent", "currentcolor", 
  "baseline", "static",
] as const;

/**
 * CSS property categories
 */
export enum PropertyCategory {
  LAYOUT = "Layout",
  TYPOGRAPHY = "Typography", 
  VISUAL = "Visual",
  EFFECTS = "Effects",
  POSITION = "Position",
  TABLE = "Table",
  LIST = "List",
  OTHER = "Other",
}

/**
 * Category colours for the UI
 */
export const CATEGORY_COLORS: Readonly<Record<PropertyCategory, string>> = {
  [PropertyCategory.LAYOUT]: "#4285f4",
  [PropertyCategory.TYPOGRAPHY]: "#0f9d58",
  [PropertyCategory.VISUAL]: "#db4437",
  [PropertyCategory.EFFECTS]: "#ff6900",
  [PropertyCategory.POSITION]: "#9c27b0",
  [PropertyCategory.TABLE]: "#607d8b",
  [PropertyCategory.LIST]: "#795548",
  [PropertyCategory.OTHER]: "#757575",
} as const;

/**
 * Map of CSS properties to categories
 */
export const PROPERTY_CATEGORIES: Readonly<Record<string, PropertyCategory>> = {
  // Layout
  display: PropertyCategory.LAYOUT,
  flex: PropertyCategory.LAYOUT,
  grid: PropertyCategory.LAYOUT,
  width: PropertyCategory.LAYOUT,
  height: PropertyCategory.LAYOUT,
  margin: PropertyCategory.LAYOUT,
  padding: PropertyCategory.LAYOUT,
  "box-sizing": PropertyCategory.LAYOUT,
  
  // Positioning
  position: PropertyCategory.POSITION,
  top: PropertyCategory.POSITION,
  right: PropertyCategory.POSITION,
  bottom: PropertyCategory.POSITION,
  left: PropertyCategory.POSITION,
  "z-index": PropertyCategory.POSITION,
  
  // Typography
  font: PropertyCategory.TYPOGRAPHY,
  "font-family": PropertyCategory.TYPOGRAPHY,
  "font-size": PropertyCategory.TYPOGRAPHY,
  "font-weight": PropertyCategory.TYPOGRAPHY,
  "line-height": PropertyCategory.TYPOGRAPHY,
  "text-align": PropertyCategory.TYPOGRAPHY,
  color: PropertyCategory.TYPOGRAPHY,
  
  // Visual styling
  background: PropertyCategory.VISUAL,
  "background-color": PropertyCategory.VISUAL,
  border: PropertyCategory.VISUAL,
  "border-radius": PropertyCategory.VISUAL,
  opacity: PropertyCategory.VISUAL,
  
  // Effects
  "box-shadow": PropertyCategory.EFFECTS,
  transform: PropertyCategory.EFFECTS,
  filter: PropertyCategory.EFFECTS,
} as const;

/**
 * Performance settings
 */
export const PERFORMANCE_LIMITS = {
  MAX_ELEMENTS: 1000,
  MAX_SNAPSHOTS_MEMORY: 50,
  MAX_COMPARISON_ELEMENTS: 500,
  DEBOUNCE_DELAY: 300,
} as const;

/**
 * View modes
 */
export enum ViewMode {
  LIST = "list",
  DETAIL = "detail", 
  COMPARE = "compare",
  TREE = "tree",
}

/**
 * Change types
 */
export enum ChangeType {
  ADDED = "added",
  REMOVED = "removed",
  MODIFIED = "modified",
  UNCHANGED = "unchanged",
}
