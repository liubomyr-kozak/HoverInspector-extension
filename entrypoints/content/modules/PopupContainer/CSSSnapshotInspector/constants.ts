/**
 * Константи для CSS Snapshot Inspector модуля
 */

/**
 * Список стандартних стилів, які слід пропускати при захопленні та порівнянні
 */
export const DEFAULT_STYLES_TO_SKIP = [
  // Анімації та переходи
  "animation", "transition", 
  "animation-delay", "animation-direction", "animation-duration",
  "animation-fill-mode", "animation-iteration-count", "animation-name",
  "animation-play-state", "animation-timing-function",
  "transition-delay", "transition-duration", "transition-property", "transition-timing-function",
  
  // Властивості блочної моделі
  "margin-block", "margin-inline", "padding-block", "padding-inline",
  "inset-block", "inset-inline", "block-size", "inline-size",
  
  // Браузер-специфічні властивості
  "text-rendering", "appearance", "-webkit-appearance", "-moz-appearance",
  "user-select", "-webkit-user-select", "-moz-user-select", "-ms-user-select",
  "backface-visibility", "perspective", "perspective-origin", "transform-style",
  "mask", "clip", "clip-path", "filter", "backdrop-filter",
  "will-change", "isolation", "mix-blend-mode", "object-fit", "object-position",
] as const;

/**
 * Значення за замовчуванням, які слід пропускати
 */
export const DEFAULT_VALUES_TO_SKIP = [
  "none", "normal", "auto", "0px", "0", "medium", "inherit", 
  "initial", "unset", "revert", "transparent", "currentcolor", 
  "baseline", "static",
] as const;

/**
 * Категорії CSS властивостей
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
 * Кольори категорій для UI
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
 * Мапа CSS властивостей до категорій
 */
export const PROPERTY_CATEGORIES: Readonly<Record<string, PropertyCategory>> = {
  // Макет
  display: PropertyCategory.LAYOUT,
  flex: PropertyCategory.LAYOUT,
  grid: PropertyCategory.LAYOUT,
  width: PropertyCategory.LAYOUT,
  height: PropertyCategory.LAYOUT,
  margin: PropertyCategory.LAYOUT,
  padding: PropertyCategory.LAYOUT,
  "box-sizing": PropertyCategory.LAYOUT,
  
  // Позиціонування
  position: PropertyCategory.POSITION,
  top: PropertyCategory.POSITION,
  right: PropertyCategory.POSITION,
  bottom: PropertyCategory.POSITION,
  left: PropertyCategory.POSITION,
  "z-index": PropertyCategory.POSITION,
  
  // Типографіка
  font: PropertyCategory.TYPOGRAPHY,
  "font-family": PropertyCategory.TYPOGRAPHY,
  "font-size": PropertyCategory.TYPOGRAPHY,
  "font-weight": PropertyCategory.TYPOGRAPHY,
  "line-height": PropertyCategory.TYPOGRAPHY,
  "text-align": PropertyCategory.TYPOGRAPHY,
  color: PropertyCategory.TYPOGRAPHY,
  
  // Візуальне оформлення
  background: PropertyCategory.VISUAL,
  "background-color": PropertyCategory.VISUAL,
  border: PropertyCategory.VISUAL,
  "border-radius": PropertyCategory.VISUAL,
  opacity: PropertyCategory.VISUAL,
  
  // Ефекти
  "box-shadow": PropertyCategory.EFFECTS,
  transform: PropertyCategory.EFFECTS,
  filter: PropertyCategory.EFFECTS,
} as const;

/**
 * Налаштування продуктивності
 */
export const PERFORMANCE_LIMITS = {
  MAX_ELEMENTS: 1000,
  MAX_SNAPSHOTS_MEMORY: 50,
  MAX_COMPARISON_ELEMENTS: 500,
  DEBOUNCE_DELAY: 300,
} as const;

/**
 * Режими перегляду
 */
export enum ViewMode {
  LIST = "list",
  DETAIL = "detail", 
  COMPARE = "compare",
  TREE = "tree",
}

/**
 * Типи змін
 */
export enum ChangeType {
  ADDED = "added",
  REMOVED = "removed",
  MODIFIED = "modified",
  UNCHANGED = "unchanged",
}
