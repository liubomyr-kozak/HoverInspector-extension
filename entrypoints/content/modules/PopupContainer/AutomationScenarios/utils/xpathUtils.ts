/**
 * Utility functions for working with XPaths in automation scenarios
 */

// Attributes that are usually added specifically for automation/testing and are the most stable locators
const TEST_ATTRIBUTES = ["data-testid", "data-test-id", "data-test", "data-qa", "data-cy", "data-automation-id"];

// Attributes that describe an element in a human/stable way, in priority order
const SEMANTIC_ATTRIBUTES = ["name", "aria-label", "placeholder", "title", "alt", "for"];

// Tags whose visible text is a good locator (buttons, links, labels, menu items...)
const TEXT_LOCATOR_TAGS = ["a", "button", "label", "option", "summary", "li", "span", "h1", "h2", "h3", "h4", "h5", "h6", "td", "th"];

const MAX_TEXT_LENGTH = 60;

/**
 * Builds a safe XPath string literal. XPath 1.0 has no escaping, so values that contain
 * both quote types are composed with concat().
 */
export function xpathLiteral(value: string): string {
  if (!value.includes('"')) return `"${value}"`;
  if (!value.includes("'")) return `'${value}'`;
  const parts = value.split('"').map((part) => `"${part}"`);
  return `concat(${parts.join(`, '"', `)})`;
}

/**
 * Heuristic check for auto-generated values (React useId, Ember ids, UUIDs, hashed CSS-in-JS classes...)
 * that change between page loads and therefore make unstable locators.
 */
export function isLikelyDynamicValue(value: string): boolean {
  if (!value) return true;
  if (value.length > 80) return true;
  if (/^:r[0-9a-z]+:$/i.test(value)) return true; // React useId
  if (/^(ember|ext-gen|yui_|gwt-uid-|mui-|radix-|headlessui-)/i.test(value)) return true;
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(value)) return true; // UUID
  if (/\d{5,}/.test(value)) return true; // long numeric sequences (timestamps, generated counters)
  if (/^(css|sc|jsx|emotion|styled)-[a-z0-9]+$/i.test(value)) return true; // CSS-in-JS hashes
  if (/^[a-z0-9]{1,3}[-_][a-zA-Z0-9]{5,}$/.test(value) && /\d/.test(value)) return true; // e.g. "sc-a1b2c3"
  if (/__[a-zA-Z0-9]{5,}$/.test(value) && /\d/.test(value)) return true; // CSS modules: "button__x7Fq2"
  return false;
}

function normalizeText(text: string | null | undefined): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

function countMatches(xpath: string): number {
  try {
    return document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
  } catch {
    return 0;
  }
}

function matchesElement(xpath: string, element: Element): boolean {
  try {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue === element;
  } catch {
    return false;
  }
}

/**
 * Absolute positional XPath (always unique, but brittle). Used as the last-resort fallback.
 */
export function getFullXPath(element: Element): string {
  const segments: string[] = [];
  let el: Element | null = element;
  while (el && el.nodeType === Node.ELEMENT_NODE) {
    const tag = el.tagName.toLowerCase();
    if (tag === "html") {
      segments.unshift("html");
      break;
    }
    let pos = 1;
    let sib = el.previousElementSibling;
    while (sib) {
      if (sib.tagName === el.tagName) pos++;
      sib = sib.previousElementSibling;
    }
    segments.unshift(`${tag}[${pos}]`);
    el = el.parentElement;
  }
  return "/" + segments.join("/");
}

/**
 * Builds locator candidates for an element (relative to `//`), most stable first.
 */
function buildCandidates(element: Element): string[] {
  const tag = element.tagName.toLowerCase();
  const candidates: string[] = [];

  for (const attr of TEST_ATTRIBUTES) {
    const value = element.getAttribute(attr);
    if (value) candidates.push(`//*[@${attr}=${xpathLiteral(value)}]`);
  }

  if (element.id && !isLikelyDynamicValue(element.id)) {
    candidates.push(`//*[@id=${xpathLiteral(element.id)}]`);
  }

  for (const attr of SEMANTIC_ATTRIBUTES) {
    const value = element.getAttribute(attr);
    if (value && value.length <= MAX_TEXT_LENGTH && !isLikelyDynamicValue(value)) {
      candidates.push(`//${tag}[@${attr}=${xpathLiteral(value)}]`);
    }
  }

  if (tag === "input") {
    const type = element.getAttribute("type");
    const value = element.getAttribute("value");
    if (type && ["submit", "button", "reset"].includes(type) && value) {
      candidates.push(`//input[@type=${xpathLiteral(type)} and @value=${xpathLiteral(value)}]`);
    }
  }

  if (tag === "a") {
    const href = element.getAttribute("href");
    if (href && !href.startsWith("javascript:") && href !== "#" && href.length <= 150) {
      candidates.push(`//a[@href=${xpathLiteral(href)}]`);
    }
  }

  const text = normalizeText(element.textContent);
  const role = element.getAttribute("role");
  if (text && text.length <= MAX_TEXT_LENGTH) {
    if (role) {
      candidates.push(`//*[@role=${xpathLiteral(role)} and normalize-space(.)=${xpathLiteral(text)}]`);
    }
    if (TEXT_LOCATOR_TAGS.includes(tag) || element.children.length === 0) {
      candidates.push(`//${tag}[normalize-space(.)=${xpathLiteral(text)}]`);
    }
  }

  // Other non-dynamic data-* attributes (skip framework noise like data-v-xxxx / data-reactid)
  for (const attr of Array.from(element.attributes)) {
    if (
      attr.name.startsWith("data-") &&
      !TEST_ATTRIBUTES.includes(attr.name) &&
      !/^data-(v-|reactid|react|styled|emotion|radix|headlessui|state|active|focus|hover|open)/.test(attr.name) &&
      attr.value &&
      !isLikelyDynamicValue(attr.value)
    ) {
      candidates.push(`//${tag}[@${attr.name}=${xpathLiteral(attr.value)}]`);
    }
  }

  const stableClasses = Array.from(element.classList).filter((cls) => !isLikelyDynamicValue(cls));
  if (stableClasses.length > 0) {
    const classSelector = stableClasses
      .slice(0, 3)
      .map((cls) => `contains(concat(" ", normalize-space(@class), " "), ${xpathLiteral(` ${cls} `)})`)
      .join(" and ");
    candidates.push(`//${tag}[${classSelector}]`);
  }

  return candidates;
}

/**
 * Finds the closest ancestor with a stable unique locator, to scope non-unique candidates.
 */
function getAnchorXPath(element: Element): string | null {
  let parent = element.parentElement;
  let depth = 0;
  while (parent && parent !== document.body && depth < 6) {
    for (const attr of TEST_ATTRIBUTES) {
      const value = parent.getAttribute(attr);
      if (value) {
        const xp = `//*[@${attr}=${xpathLiteral(value)}]`;
        if (countMatches(xp) === 1) return xp;
      }
    }
    if (parent.id && !isLikelyDynamicValue(parent.id)) {
      const xp = `//*[@id=${xpathLiteral(parent.id)}]`;
      if (countMatches(xp) === 1) return xp;
    }
    parent = parent.parentElement;
    depth++;
  }
  return null;
}

/**
 * Generates multiple XPath expressions for a DOM element based on priority.
 *
 * Candidates are ordered from the most stable (test ids, ids, names, labels, text) to the most brittle
 * (absolute path). Only candidates that actually resolve to the element are kept, and candidates that
 * uniquely identify the element are ranked first, so the primary XPath is stable AND unique whenever possible.
 *
 * @param element The DOM element to generate XPaths for
 * @returns An object containing the primary XPath and an array of alternative XPaths
 */
export function generateXPaths(element: Element): { primaryXPath: string; alternativeXpaths: string[] } {
  if (!element) return { primaryXPath: "", alternativeXpaths: [] };

  const unique: string[] = [];
  const nonUnique: string[] = [];
  const anchor = getAnchorXPath(element);

  for (const candidate of buildCandidates(element)) {
    const count = countMatches(candidate);
    if (count === 1 && matchesElement(candidate, element)) {
      unique.push(candidate);
      continue;
    }
    if (count > 1) {
      // Try to make it unique by scoping to a stable ancestor
      if (anchor) {
        const scoped = `${anchor}${candidate}`;
        if (countMatches(scoped) === 1 && matchesElement(scoped, element)) {
          unique.push(scoped);
          continue;
        }
      }
      // Fall back to indexing within the matched set
      const indexed = `(${candidate})[${indexInMatches(candidate, element)}]`;
      if (indexed && matchesElement(indexed, element)) {
        nonUnique.push(indexed);
      }
    }
  }

  const fullXPath = getFullXPath(element);
  const ordered = [...new Set([...unique, ...nonUnique, fullXPath])].filter(Boolean);

  return {
    primaryXPath: ordered[0],
    alternativeXpaths: ordered.slice(1),
  };
}

function indexInMatches(xpath: string, element: Element): number {
  try {
    const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0; i < result.snapshotLength; i++) {
      if (result.snapshotItem(i) === element) return i + 1;
    }
  } catch {
    // ignore invalid expressions
  }
  return 0;
}

/**
 * Generates an XPath for a DOM element
 * This function creates a unique XPath that can be used to identify the element
 * 
 * @param element The DOM element to generate an XPath for
 * @returns The XPath string for the element
 */
export function generateXPath(element: Element): string {
  return generateXPaths(element).primaryXPath;
}

/**
 * Validates if an XPath is unique (matches only one element)
 * 
 * @param xpath The XPath to validate
 * @returns Object containing validation result and element count
 */
export function validateXPathUniqueness(xpath: string): { isUnique: boolean, elementCount: number, elements: Element[] } {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    
    const elements: Element[] = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      const element = result.snapshotItem(i) as Element;
      if (element) {
        elements.push(element);
      }
    }
    
    return {
      isUnique: elements.length === 1,
      elementCount: elements.length,
      elements
    };
  } catch (error) {
    console.error('Error validating XPath:', error);
    return { isUnique: false, elementCount: 0, elements: [] };
  }
}

/**
 * Generates improved XPaths for an element when the primary XPath is not unique
 * 
 * @param element The target element
 * @param nonUniqueXPath The XPath that matches multiple elements
 * @returns Array of more specific XPaths
 */
export function generateImprovedXPaths(element: Element, nonUniqueXPath: string): string[] {
  if (!element) return [];
  
  const improvedXPaths: string[] = [];
  
  // Strategy 1: Add position/index to make XPath more specific
  try {
    const validation = validateXPathUniqueness(nonUniqueXPath);
    if (!validation.isUnique && validation.elements.length > 1) {
      // Find the position of our target element in the matched elements
      const targetIndex = validation.elements.findIndex(el => el === element);
      if (targetIndex !== -1) {
        const positionBasedXPath = `(${nonUniqueXPath})[${targetIndex + 1}]`;
        improvedXPaths.push(positionBasedXPath);
      }
    }
  } catch (error) {
    console.error('Error generating position-based XPath:', error);
  }
  
  // Strategy 2: Add more specific attributes from the element
  const attributes = element.attributes;
  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    if (attr.name !== 'class' && attr.name !== 'style' && !attr.name.startsWith('data-')) {
      const specificXPath = `//${element.tagName.toLowerCase()}[@${attr.name}=${xpathLiteral(attr.value)}]`;
      const validation = validateXPathUniqueness(specificXPath);
      if (validation.isUnique) {
        improvedXPaths.push(specificXPath);
      }
    }
  }
  
  // Strategy 3: Combine multiple attributes for higher specificity
  if (element.id && element.classList.length > 0) {
    const combinedXPath = `//${element.tagName.toLowerCase()}[@id=${xpathLiteral(element.id)} and contains(@class,${xpathLiteral(element.classList[0])})]`;
    const validation = validateXPathUniqueness(combinedXPath);
    if (validation.isUnique) {
      improvedXPaths.push(combinedXPath);
    }
  }
  
  // Strategy 4: Use parent context for more specificity
  if (element.parentElement) {
    const parentTag = element.parentElement.tagName.toLowerCase();
    let parentIdentifier = '';
    
    if (element.parentElement.id) {
      parentIdentifier = `[@id=${xpathLiteral(element.parentElement.id)}]`;
    } else if (element.parentElement.classList.length > 0) {
      parentIdentifier = `[contains(@class,${xpathLiteral(element.parentElement.classList[0])})]`;
    }
    
    if (parentIdentifier) {
      const parentContextXPath = `//${parentTag}${parentIdentifier}/${element.tagName.toLowerCase()}`;
      const validation = validateXPathUniqueness(parentContextXPath);
      if (validation.isUnique) {
        improvedXPaths.push(parentContextXPath);
      }
    }
  }
  
  // Strategy 5: Use text content for uniqueness if available
  const textContent = element.textContent?.trim();
  if (textContent && textContent.length > 0 && textContent.length < 50) {
    const textBasedXPath = `//${element.tagName.toLowerCase()}[normalize-space(.)=${xpathLiteral(normalizeText(textContent))}]`;
    const validation = validateXPathUniqueness(textBasedXPath);
    if (validation.isUnique) {
      improvedXPaths.push(textBasedXPath);
    }
  }
  
  return improvedXPaths;
}

/**
 * Validates and improves XPaths for better uniqueness
 * 
 * @param element The target element
 * @param primaryXPath The primary XPath to validate
 * @param alternativeXpaths Array of alternative XPaths
 * @returns Object containing validated XPath data and auto-update flag
 */
export function validateAndImproveXPaths(element: Element, primaryXPath: string, alternativeXpaths: string[] = []): {
  primaryXPath: string;
  alternativeXpaths: string[];
  xpathAutoUpdated: boolean;
} {
  if (!element || !primaryXPath) {
    return { primaryXPath, alternativeXpaths, xpathAutoUpdated: false };
  }
  
  const validation = validateXPathUniqueness(primaryXPath);
  
  // If primary XPath is unique, no changes needed
  if (validation.isUnique) {
    return { primaryXPath, alternativeXpaths, xpathAutoUpdated: false };
  }
  
  console.warn(`Primary XPath matches ${validation.elementCount} elements, attempting to improve uniqueness`);
  
  // Try to find a unique XPath from existing alternatives
  for (const altXPath of alternativeXpaths) {
    const altValidation = validateXPathUniqueness(altXPath);
    if (altValidation.isUnique) {
      return {
        primaryXPath: altXPath,
        alternativeXpaths: [primaryXPath, ...alternativeXpaths.filter(x => x !== altXPath)],
        xpathAutoUpdated: true
      };
    }
  }
  
  // Generate improved XPaths
  const improvedXPaths = generateImprovedXPaths(element, primaryXPath);
  
  if (improvedXPaths.length > 0) {
    return {
      primaryXPath: improvedXPaths[0],
      alternativeXpaths: [primaryXPath, ...alternativeXpaths, ...improvedXPaths.slice(1)],
      xpathAutoUpdated: true
    };
  }
  
  // If we can't improve it, keep original but mark that we tried
  console.warn(`Could not generate better XPath for element, keeping original non-unique XPath`);
  return { primaryXPath, alternativeXpaths, xpathAutoUpdated: false };
}

/**
 * Gets an element by its XPath
 * If the element has alternative XPaths stored, it will try those if the primary XPath fails
 * 
 * @param xpath The primary XPath to use to find the element
 * @param alternativeXpaths Optional array of alternative XPaths to try if the primary one fails
 * @returns The element if found, null otherwise
 */
export function getElementByXPath(xpath: string, alternativeXpaths?: string[]): Element | null {
  // First try the primary XPath
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    
    const element = result.singleNodeValue as Element;
    if (element) {
      return element;
    }
  } catch (error) {
    console.error('Error evaluating primary XPath:', error);
  }
  
  // If primary XPath failed and we have alternatives, try them
  if (alternativeXpaths && alternativeXpaths.length > 0) {
    
    for (const altXPath of alternativeXpaths) {
      try {
        const result = document.evaluate(
          altXPath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        
        const element = result.singleNodeValue as Element;
        if (element) {
          return element;
        }
      } catch (error) {
        console.error(`Error evaluating alternative XPath: ${altXPath}`, error);
        // Continue to the next alternative
      }
    }
  }
  
  // If we get here, all XPaths failed
  console.warn(`Element not found with XPath: ${xpath}`);
  return null;
}