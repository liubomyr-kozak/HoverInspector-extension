/**
 * Оптимізована утиліта для побудови знімків CSS
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

// No baseline cache needed when diffing strictly against UA defaults

/**
 * Перевіряє, чи слід пропускати елемент
 */
const shouldSkipElement = (element: Element): boolean => {
  const tag = element.tagName.toLowerCase();

  // Пропускаємо meta елементи
  if (["meta", "link", "style", "script", "title"].includes(tag)) {
    return true;
  }

  // Skip our own highlight overlay node
  if (
    (element as HTMLElement).id === "hover-inspector-highlight-node" ||
    (element as HTMLElement).classList?.contains("hover-inspector-highlight-node")
  ) {
    return true;
  }

  // Пропускаємо невидимі елементи з нульовими розмірами
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return true;
  }

  // Пропускаємо елементи з display: none
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.display === "none" || computedStyle.visibility === "hidden") {
    return true;
  }

  return false;
};

/**
 * Отримує індекс елемента серед сібінгів з тим же тегом
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
 * Витягує релевантні стилі з computed style, порівнюючи з базовим станом
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

    // Пропускаємо непотрібні властивості
    // if (shouldSkipProperty(property)) {
    //   continue;
    // }

    const value = computedStyle.getPropertyValue(property);

    //   // Пропускаємо значення за замовчуванням
    //   if (isDefaultValue(value)) {
    //     continue;
    //   }
    //

    // Пропускаємо значення, які є стандартними для даного тегу (UA defaults)
    if (defaultStyles[property] === value) {
      continue;
    }

    // Diff strictly against UA defaults only (baseline comparison removed)

    // Застосовуємо кастомний фільтр
    if (filter && !filter(property, value)) {
      continue;
    }

    styles[property] = value;
  }

  return styles;
};

/**
 * Витягує inline стилі з атрибута style елемента
 */
const extractInlineStyles = (element: Element): Record<string, string> => {
  const inlineStyles: Record<string, string> = {};
  const htmlElement = element as HTMLElement;

  if (!htmlElement.style) {
    return inlineStyles;
  }

  // Перебираємо всі inline стилі
  for (let i = 0; i < htmlElement.style.length; i++) {
    const property = htmlElement.style[i];
    const value = htmlElement.style.getPropertyValue(property);

    if (value && !shouldSkipProperty(property) && !isDefaultValue(value)) {
      inlineStyles[property] = value;
    }
  }

  return inlineStyles;
};

/**
 * Extracts CSS rules for element classes from document stylesheets
 */
const extractClassRules = (element: Element): Record<string, Record<string, string>> => {
  
  const classRules: Record<string, Record<string, string>> = {};
  const classList = Array.from(element.classList);
  
  if (classList.length === 0) {
    return classRules;
  }
  
  
  try {
    // Iterate through all stylesheets
    for (const styleSheet of Array.from(document.styleSheets)) {
      try {
        if (!styleSheet.cssRules) continue;
        
        // Iterate through CSS rules
        for (const rule of Array.from(styleSheet.cssRules)) {
          if (rule instanceof CSSStyleRule) {
            // Check if rule selector matches any of the element's classes
            for (const className of classList) {
              const classSelector = `.${className}`;
              if (rule.selectorText && rule.selectorText.includes(classSelector)) {
                
                if (!classRules[className]) {
                  classRules[className] = {};
                }
                
                // Extract CSS properties from the rule
                const style = rule.style;
                for (let i = 0; i < style.length; i++) {
                  const property = style[i];
                  const value = style.getPropertyValue(property);
                  if (value) {
                    classRules[className][property] = value;
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        // Skip stylesheets that can't be accessed (CORS, etc.)
        console.warn(`[CSS Snapshot] Could not access stylesheet:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error(`[CSS Snapshot] Error extracting class rules:`, error);
  }
  
  return classRules;
};

/**
 * Будує вузол знімка для елемента, зберігаючи лише зміни відносно базового стану
 */
const buildSnapshotNode = (
  element: Element,
  path: string[],
  options: SnapshotOptions,
  stats: { processed: number; skipped: number },
): SnapshotNode | null => {
  // Перевіряємо ліміти
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

  // Отримуємо основні властивості
  const id = element.id || undefined;
  const xpath = generateXPathVariants(element);
  const classes = Array.from(element.classList);
  const attributes: Record<string, string> = {};

  // Збираємо атрибути (окрім id та class)
  for (const attr of element.attributes) {
    if (attr.name !== "id" && attr.name !== "class") {
      attributes[attr.name] = attr.value;
    }
  }

  // Отримуємо розміри
  const rect = element.getBoundingClientRect();
  const bounds = {
    top: Math.round(rect.top),
    left: Math.round(rect.left),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };

  // Отримуємо стилі, порівнюючи з базовим станом
  const computedStyle = window.getComputedStyle(element);
  const styles = extractStyles(element, computedStyle, options.styleFilter);

  // Отримуємо inline стилі з атрибута style
  const inlineStyles = extractInlineStyles(element);

  // Отримуємо CSS правила для класів елемента
  const classRules = extractClassRules(element);

  // Отримуємо текстовий контент для листових вузлів
  const text =
    options.includeText && element.children.length === 0 ? element.textContent?.trim() || undefined : undefined;

  // Рекурсивно обробляємо дочірні елементи
  const children: SnapshotNode[] = [];
  for (const child of Array.from(element.children)) {
    const childNode = buildSnapshotNode(child as Element, elementPath, options, stats);
    if (childNode) {
      // Додаємо дочірній вузол лише якщо він має стилі або дочірні елементи
      if (
        Object.keys(childNode.styles).length > 0 ||
        Object.keys(childNode.inlineStyles).length > 0 ||
        childNode.children.length > 0
      ) {
        children.push(childNode);
      } else {
        // Якщо вузол не має змін, пропускаємо його, але враховуємо в статистиці
        stats.skipped++;
      }
    }
  }

  // Перевіряємо, чи є зміни в стилях або дочірніх елементах
  const hasStyleChanges = Object.keys(styles).length > 0;
  const hasInlineStyleChanges = Object.keys(inlineStyles).length > 0;
  const hasChildren = children.length > 0;

  // Якщо немає змін і немає дочірніх елементів, повертаємо null
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
 * Будує дерево знімка з кореневого елемента
 */
export const buildSnapshotTree = (
  root: Element = document.body,
  options: SnapshotOptions = {},
): SnapshotBuildResult => {
  const startTime = performance.now();
  const stats = { processed: 0, skipped: 0 };

  const tree = buildSnapshotNode(root, [], options, stats);

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
 * Створює оптимізований знімок CSS, зберігаючи лише зміни
 */
export const createCSSSnapshot = async (title?: string, options: SnapshotOptions = {}): Promise<CSSSnapshot> => {

  // Встановлюємо опції за замовчуванням
  const snapshotOptions: SnapshotOptions = {
    maxElements: PERFORMANCE_LIMITS.MAX_ELEMENTS,
    skipInvisible: true,
    includeText: true,
    includeUnchanged: false, // За замовчуванням не включаємо елементи без змін
    ...options,
  };

  // Будуємо дерево знімка, зберігаючи лише зміни
  const { tree, stats } = buildSnapshotTree(document.body, snapshotOptions);


  const snapshot: CSSSnapshot = {
    id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    url: window.location.href,
    title: title || document.title || window.location.hostname,
    elementCount: stats.totalNodes,
    root: tree,
    metadata: {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      optimized: true, // Позначаємо, що знімок створено з оптимізацією
    },
  };

  return snapshot;
};

/**
 * CLEANUP: August 2025
 * Removed unused compareSnapshots function and its helper hasNodeChanged function.
 * The comparison functionality is now implemented directly in the SnapshotCompare component
 * and these functions were not being used anywhere in the codebase.
 */
