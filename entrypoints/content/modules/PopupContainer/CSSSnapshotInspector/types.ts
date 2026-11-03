import { DEFAULT_STYLES_TO_SKIP, DEFAULT_VALUES_TO_SKIP } from "./constants";

/**
 * Unified base node shape used across snapshot, tree, and style maps
 */
export interface BaseElementNode {
  /** Human-friendly label for UI (optional) */
  displayName?: string;
  /** HTML tag name */
  tagName: string;
  /** HTML id attribute value (if present) */
  id?: string | null;
  /** CSS classes */
  classes: readonly string[];
  /** HTML attributes (excluding id and class) */
  attributes?: Readonly<Record<string, string>>;
  /** Element bounds */
  bounds?: Readonly<{
    top: number;
    left: number;
    width: number;
    height: number;
  }>;
  /** Computed styles from DOM API (diff from UA defaults) */
  styles: Readonly<Record<string, string>>;
  /** Inline styles from style attribute */
  inlineStyles: Readonly<Record<string, string>>;
  /** Text content for leaf nodes */
  text?: string;
  /** Tree level (0 = root) */
  level?: number;
  /** Element path as array of segments (snapshot-native) */
  path?: readonly string[];
  /** Element path as a single string with separators (tree-native) */
  pathString?: string;
  /** XPath variants for element identification (mandatory in snapshots) */
  xpath?: XPathVariants; // kept optional for legacy structures, but builder always sets it
  /** Optional fast key */
  key?: string;
}

/**
 * XPath variants for element identification
 */
export interface XPathVariants {
  /** Full absolute XPath using element indices */
  readonly absolute: string;
  /** XPath using element IDs where available */
  readonly withId: string;
  /** XPath using CSS classes where available */
  readonly withClasses: string;
  /** XPath using attribute-based selectors */
  readonly withAttributes: string;
  /** Short optimized XPath for common patterns */
  readonly optimized: string;
}

/**
 * Optimised snapshot node structure
 */
export interface SnapshotNode extends BaseElementNode {
  /** Unique quick key for internal operations (hash-based) */
  readonly key: string;
  /** Element path array for hierarchy navigation */
  readonly path: readonly string[];
  /** HTML tag name */
  readonly tagName: string;
  /** HTML id attribute value (if present) */
  readonly id?: string;
  /** XPath variants for element location */
  readonly xpath: XPathVariants;
  /** CSS classes */
  readonly classes: readonly string[];
  /** CSS class rules from stylesheets */
  readonly classRules?: Readonly<Record<string, Record<string, string>>>;
  /** HTML attributes (excluding id and class) */
  readonly attributes: Readonly<Record<string, string>>;
  /** Element bounds */
  readonly bounds: Readonly<{
    top: number;
    left: number;
    width: number;
    height: number;
  }>;
  /** Computed styles from DOM API (diff from UA defaults) */
  readonly styles: Readonly<Record<string, string>>;
  /** Inline styles from style attribute */
  readonly inlineStyles: Readonly<Record<string, string>>;
  /** Child elements */
  readonly children: readonly SnapshotNode[];
}

/**
 * Main CSS snapshot structure
 */
export interface CSSSnapshot {
  readonly id: string;
  readonly timestamp: number;
  readonly url: string;
  readonly title: string;
  readonly elementCount: number;
  readonly root: SnapshotNode;
  readonly metadata?: Readonly<{
    userAgent?: string;
    viewport?: { width: number; height: number };
    colorScheme?: string;
    optimized?: boolean; // Indicates if the snapshot was created with optimization
  }>;
}

/**
 * Result of building the snapshot tree
 */
export interface SnapshotBuildResult {
  readonly tree: SnapshotNode;
  readonly stats: Readonly<{
    totalNodes: number;
    skippedNodes: number;
    processTime: number;
  }>;
}

/**
 * Change in an element's position
 */
export interface PositionChange {
  readonly property: "top" | "left" | "width" | "height";
  readonly before: number;
  readonly after: number;
  readonly delta: number;
  readonly percentage: number;
}

/**
 * Change type in a comparison
 */
export enum ChangeType {
  ADDED = "added",
  REMOVED = "removed",
  MODIFIED = "modified",
  UNCHANGED = "unchanged",
}

/**
 * Change in a CSS property
 */
export interface StyleChange {
  readonly property: string;
  readonly before: string | null;
  readonly after: string | null;
  readonly type: ChangeType;
}

/**
 * Element comparison
 */
export interface ElementComparison {
  readonly path: string;
  readonly type: ChangeType;
  readonly styleChanges: readonly StyleChange[];
  readonly positionChanges: readonly PositionChange[];
  readonly moved: boolean;
}

/**
 * Snapshot comparison result
 */
export interface ComparisonResult {
  readonly elements: readonly ElementComparison[];
  readonly summary: Readonly<{
    added: number;
    removed: number;
    modified: number;
    moved: number;
  }>;
}

/**
 * Snapshot build options
 */
export interface SnapshotOptions {
  readonly maxElements?: number;
  readonly skipInvisible?: boolean;
  readonly includeText?: boolean;
  readonly includeUnchanged?: boolean; // Include unchanged elements
  readonly styleFilter?: (property: string, value: string) => boolean;
}

/**
 * Checks whether a property should be skipped
 */
export const shouldSkipProperty = (property: string): boolean => {
  return DEFAULT_STYLES_TO_SKIP.some((skip) => property.includes(skip));
};

/**
 * Checks whether a value is a default value
 */
export const isDefaultValue = (value: string | null): boolean => {
  if (!value) return true;
  return (DEFAULT_VALUES_TO_SKIP as readonly string[]).includes(value);
};

/**
 * Creates a stable ID for an element
 */
export const createElementId = (element: Element, index: number): string => {
  const parts = [
    element.tagName.toLowerCase(),
    element.id || "",
    Array.from(element.classList).sort().join("-"),
    index.toString(),
  ];

  const hash = parts
    .join(":")
    .split("")
    .reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

  return `el-${Math.abs(hash).toString(36)}`;
};
