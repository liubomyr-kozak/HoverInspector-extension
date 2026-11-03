/**
 * Optimised CSS snapshot builder
 *
 * OPTIMIZATION (August 2025):
 * This module now implements an advanced optimization approach that significantly
 * reduces snapshot size by only storing styles that have changed from a baseline state.
 *
 * The optimization works in multiple layers:
 * 1. Property-based filtering: Skip certain CSS properties entirely
 * 2. Value-based filtering: Skip common default values
 * 3. Tag-specific default filtering: Skip default styles for specific HTML tags
 * 4. Baseline comparison: Compare each element against a baseline node
 *
 * Elements with no style changes and no children with changes are excluded from the snapshot.
 * This results in much smaller snapshots that focus only on meaningful differences.
 *
 * See README.md for more details on the optimization approach.
 */
import {
  SnapshotNode,
  CSSSnapshot,
  SnapshotBuildResult,
  SnapshotOptions,
  shouldSkipProperty,
  isDefaultValue,
  createElementId,
} from "../types";
import { PERFORMANCE_LIMITS } from "../constants";
import { getDefaultStylesForTag } from "./defaultStyles";
import { generateXPathVariants } from "./xpathGenerator";
import { getSnapshotLocation, getSnapshotName } from "./snapshotLabels";

// No baseline cache needed when diffing strictly against UA defaults

/**
 * Checks whether an element should be skipped
 */
const shouldSkipElement = (element: Element): boolean => {
  const tag = element.tagName.toLowerCase();

  // Skip meta elements
  if (["meta", "link", "style", "script", "title"].includes(tag)) {
    return true;
  }

  // Skip the extension's own UI host
  if (tag === "hover-inspector") {
    return true;
  }

  // Skip our own highlight overlay node
  if (
    (element as HTMLElement).id === "hover-inspector-highlight-node" ||
    (element as HTMLElement).classList?.contains("hover-inspector-highlight-node")
  ) {
    return true;
  }

  // Skip invisible zero-size elements
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return true;
  }

  // Skip elements with display: none
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.display === "none" || computedStyle.visibility === "hidden") {
    return true;
  }

  return false;
};

/**
 * Index of the element among siblings with the same tag
 */
const getElementIndex = (element: Element): number => {
  let index = 0;
  let sibling = element.previousElementSibling;

  while (sibling) {
    if (sibling.tagName === element.tagName) {
      index++;
    }
    sibling = sibling.previousElementSibling;
  }

  return index;
};

// Baseline node generation removed; diffs are computed against UA defaults

/**
 * Extracts relevant computed styles by comparing them with the baseline
 */
const extractStyles = (
  element: Element,
  computedStyle: CSSStyleDeclaration,
  filter?: (property: string, value: string) => boolean,
): Record<string, string> => {
  const styles: Record<string, string> = {};
  const tagName = element.tagName;
  // Fetch UA default styles once for this tag (cached internally)
  const defaultStyles = getDefaultStylesForTag(tagName);

  for (let i = 0; i < computedStyle.length; i++) {
    const property = computedStyle[i];

    // Skip irrelevant properties
    // if (shouldSkipProperty(property)) {
    //   continue;
    // }

    const value = computedStyle.getPropertyValue(property);

    //   // Skip default values
    //   if (isDefaultValue(value)) {
    //     continue;
    //   }
    //

    // Skip values that are the tag's user-agent defaults
    if (defaultStyles[property] === value) {
      continue;
    }

    // Diff strictly against UA defaults only (baseline comparison removed)

    // Apply the custom filter
    if (filter && !filter(property, value)) {
      continue;
    }

    styles[property] = value;
  }

  return styles;
};

/**
 * Extracts inline styles from the element's style attribute
 */
const extractInlineStyles = (element: Element): Record<string, string> => {
  const inlineStyles: Record<string, string> = {};
  const htmlElement = element as HTMLElement;

  if (!htmlElement.style) {
    return inlineStyles;
  }

  // Go through all inline styles
  for (let i = 0; i < htmlElement.style.length; i++) {
    const property = htmlElement.style[i];
    const value = htmlElement.style.getPropertyValue(property);

    if (value && !shouldSkipProperty(property) && !isDefaultValue(value)) {
      inlineStyles[property] = value;
    }
  }

  return inlineStyles;
};

type ClassRuleIndex = Map<string, CSSStyleRule[]>;

/** Matches class tokens in a selector, including escaped characters (e.g. .md\:flex) */
const CLASS_TOKEN_RE = /\.((?:\\.|[\w-])+)/g;

const unescapeClassName = (token: string): string => token.replace(/\\(.)/g, "$1");

/**
 * Indexes all accessible style rules by the class names their selectors reference.
 * Built once per capture instead of scanning every rule for every element.
 */
const buildClassRuleIndex = (): ClassRuleIndex => {
  const index: ClassRuleIndex = new Map();

  for (const styleSheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = styleSheet.cssRules;
    } catch {
      // Cross-origin stylesheet (CORS) - its rules can't be read
      continue;
    }
    if (!rules) continue;

    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule) || !rule.selectorText) continue;

      const classNames = new Set<string>();
      for (const match of rule.selectorText.matchAll(CLASS_TOKEN_RE)) {
        classNames.add(unescapeClassName(match[1]));
      }
      classNames.forEach((className) => {
        const list = index.get(className);
        if (list) list.push(rule);
        else index.set(className, [rule]);
      });
    }
  }

  return index;
};

/**
 * Extracts CSS rules for element classes from the pre-built rule index.
 * Class names are matched exactly (".btn" no longer matches ".btn-primary").
 */
const extractClassRules = (element: Element, index: ClassRuleIndex): Record<string, Record<string, string>> => {
  const classRules: Record<string, Record<string, string>> = {};

  for (const className of getPageClasses(element)) {
    const rules = index.get(className);
    if (!rules) continue;

    const properties: Record<string, string> = {};
    for (const rule of rules) {
      const style = rule.style;
      for (let i = 0; i < style.length; i++) {
        const property = style[i];
        const value = style.getPropertyValue(property);
        if (value) {
          properties[property] = value;
        }
      }
    }
    classRules[className] = properties;
  }

  return classRules;
};

/**
 * Classes the extension itself puts on page elements while it works (react-draggable marks <body> while a
 * panel is dragged or resized; the inspector marks highlighted nodes). They are not part of the page and
 * made every snapshot taken mid-drag differ from the next one.
 */
const EXTENSION_CLASS = /^(react-draggable|hover-inspector)/;
export const getPageClasses = (element: Element): string[] =>
  Array.from(element.classList).filter((className) => !EXTENSION_CLASS.test(className));

/**
 * Builds a snapshot node for an element, keeping only changes from the baseline
 */
const buildSnapshotNode = (
  element: Element,
  path: string[],
  options: SnapshotOptions,
  stats: { processed: number; skipped: number },
  classRuleIndex: ClassRuleIndex,
): SnapshotNode | null => {
  // Check the limits
  if (stats.processed >= (options.maxElements || PERFORMANCE_LIMITS.MAX_ELEMENTS)) {
    stats.skipped++;
    return null;
  }

  if (shouldSkipElement(element)) {
    stats.skipped++;
    return null;
  }

  stats.processed++;

  const tagName = element.tagName.toLowerCase();
  const index = getElementIndex(element);
  const elementPath = [...path, `${tagName}[${index}]`];
  const key = createElementId(element, index);

  // Basic properties
  const id = element.id || undefined;
  const xpath = generateXPathVariants(element);
  const classes = getPageClasses(element);
  const attributes: Record<string, string> = {};

  // Collect attributes (except id and class)
  for (const attr of element.attributes) {
    if (attr.name !== "id" && attr.name !== "class") {
      attributes[attr.name] = attr.value;
    }
  }

  // Size (document coordinates, so they don't depend on the scroll position)
  const rect = element.getBoundingClientRect();
  const bounds = {
    top: Math.round(rect.top + window.scrollY),
    left: Math.round(rect.left + window.scrollX),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };

  // Styles, compared with the baseline
  const computedStyle = window.getComputedStyle(element);
  const styles = extractStyles(element, computedStyle, options.styleFilter);

  // Inline styles from the style attribute
  const inlineStyles = extractInlineStyles(element);

  // CSS rules for the element's classes
  const classRules = extractClassRules(element, classRuleIndex);

  // Text content for leaf nodes
  const text =
    options.includeText && element.children.length === 0 ? element.textContent?.trim() || undefined : undefined;

  // Process children recursively
  const children: SnapshotNode[] = [];
  for (const child of Array.from(element.children)) {
    const childNode = buildSnapshotNode(child as Element, elementPath, options, stats, classRuleIndex);
    if (childNode) {
      // Add a child node only if it has styles or children
      if (
        Object.keys(childNode.styles).length > 0 ||
        Object.keys(childNode.inlineStyles).length > 0 ||
        childNode.children.length > 0
      ) {
        children.push(childNode);
      } else {
        // A node without changes is skipped but counted in the stats
        stats.skipped++;
      }
    }
  }

  // Are there changes in styles or children?
  const hasStyleChanges = Object.keys(styles).length > 0;
  const hasInlineStyleChanges = Object.keys(inlineStyles).length > 0;
  const hasChildren = children.length > 0;

  // No changes and no children: return null
  if (!hasStyleChanges && !hasInlineStyleChanges && !hasChildren && !options.includeUnchanged) {
    return null;
  }

  return {
    key,
    path: elementPath,
    tagName,
    id,
    xpath,
    classes,
    classRules,
    attributes,
    bounds,
    styles,
    inlineStyles,
    text,
    children,
  };
};

/**
 * Builds the snapshot tree from the root element
 */
export const buildSnapshotTree = (
  root: Element = document.body,
  options: SnapshotOptions = {},
): SnapshotBuildResult => {
  const startTime = performance.now();
  const stats = { processed: 0, skipped: 0 };

  const tree = buildSnapshotNode(root, [], options, stats, buildClassRuleIndex());

  if (!tree) {
    throw new Error("Failed to build snapshot tree: root element was skipped");
  }

  const endTime = performance.now();

  return {
    tree,
    stats: {
      totalNodes: stats.processed,
      skippedNodes: stats.skipped,
      processTime: Math.round(endTime - startTime),
    },
  };
};

/**
 * Creates an optimised CSS snapshot that keeps only changes
 */
export const createCSSSnapshot = async (title?: string, options: SnapshotOptions = {}): Promise<CSSSnapshot> => {

  // Default options
  const snapshotOptions: SnapshotOptions = {
    maxElements: PERFORMANCE_LIMITS.MAX_ELEMENTS,
    skipInvisible: true,
    includeText: true,
    includeUnchanged: false, // Unchanged elements are left out by default
    ...options,
  };

  // Build the snapshot tree, keeping only changes
  const { tree, stats } = buildSnapshotTree(document.body, snapshotOptions);


  const snapshot: CSSSnapshot = {
    id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    url: window.location.href,
    // Auto name: the page title, else its address ("localhost/checkout")
    title: title || document.title.trim() || getSnapshotLocation(window.location.href) || "Page",
    elementCount: stats.totalNodes,
    root: tree,
    metadata: {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      optimized: true, // Mark the snapshot as optimised
    },
  };

  return snapshot;
};

/**
 * Finds the live element an element snapshot was taken from, trying each stored XPath variant
 */
const findSnapshotRootElement = (snapshot: CSSSnapshot): Element | null => {
  const root = snapshot.root;
  const variants = root?.xpath;
  if (!variants) return null;
  // The looser variants (by class, by position) also match other elements once the original is gone:
  // only accept an element of the same tag and, when the snapshot had one, the same id
  const isSameElement = (element: Element) =>
    (!root.tagName || element.tagName.toLowerCase() === root.tagName.toLowerCase()) &&
    (!root.id || element.id === root.id);
  const candidates = [variants.withId, variants.optimized, variants.absolute, variants.withClasses, variants.withAttributes];
  for (const xpath of candidates) {
    if (!xpath) continue;
    try {
      const node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (node instanceof Element && isSameElement(node)) return node;
    } catch {
      // invalid XPath variant, try the next one
    }
  }
  return null;
};

/**
 * Captures the current state of the page in the same scope as `snapshot`: for an
 * element snapshot (from "Pick Element") only that element is captured again, so the
 * comparison lines up instead of diffing one element against the whole page.
 */
export const createCurrentSnapshotFor = async (snapshot: CSSSnapshot): Promise<CSSSnapshot> => {
  const isElementSnapshot = snapshot.id.startsWith("element-snapshot-");
  const element = isElementSnapshot ? findSnapshotRootElement(snapshot) : null;

  if (isElementSnapshot && !element) {
    // Comparing the element with the whole page would mark everything as changed
    throw new Error(`"${getSnapshotName(snapshot)}" is not on this page any more, so it can't be compared with it`);
  }
  if (!element) {
    return createCSSSnapshot("Current page");
  }

  const { tree, stats } = buildSnapshotTree(element, {
    maxElements: 1000,
    skipInvisible: true,
    includeText: true,
    includeUnchanged: false,
  });

  return {
    id: `current-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    timestamp: Date.now(),
    url: window.location.href,
    title: `Current: ${snapshot.title}`,
    elementCount: stats.totalNodes,
    root: tree,
    metadata: {
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      optimized: true,
    },
  };
};

/**
 * CLEANUP: August 2025
 * Removed unused compareSnapshots function and its helper hasNodeChanged function.
 * The comparison functionality is now implemented directly in the SnapshotCompare component
 * and these functions were not being used anywhere in the codebase.
 */
