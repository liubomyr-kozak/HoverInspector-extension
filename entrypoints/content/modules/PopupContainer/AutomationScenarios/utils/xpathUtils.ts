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
  // Only the part after the separator tells a hash from a word: "sc-a1b2c3" and "button__x7Fq2" are generated,
  // while "h2-title", "h1_heading" or "v2-header" are readable ids whose digit belongs to a word
  const shortPrefixHash = value.match(/^[a-z0-9]{1,3}[-_]([a-zA-Z0-9]{5,})$/)?.[1];
  if (shortPrefixHash && looksLikeHash(shortPrefixHash)) return true; // e.g. "sc-a1b2c3"
  const cssModuleHash = value.match(/__([a-zA-Z0-9]{5,})$/)?.[1];
  if (cssModuleHash && looksLikeHash(cssModuleHash)) return true; // CSS modules: "button__x7Fq2"
  // Random suffix mixing letters and digits: "late-x3k9a", "field_a8f3k2", "row:9xk2f"
  const suffix = value.match(/[-_:]([a-zA-Z0-9]{5,12})$/)?.[1];
  if (suffix && looksLikeHash(suffix)) return true;
  return false;
}

/**
 * A run of letters and digits that reads like a generated hash: it mixes letters with at least two digits
 */
function looksLikeHash(part: string): boolean {
  return /[a-zA-Z]/.test(part) && (part.match(/\d/g) || []).length >= 2;
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

// Classes that describe a state the element is in right now (selected, open, hovered...): the page adds and
// removes them as the user works, so a locator built on them finds another element, or none, on playback
const STATE_CLASSES = new Set([
  "active", "selected", "current", "open", "opened", "closed", "show", "shown", "showing", "hide", "hidden",
  "visible", "invisible", "hover", "hovered", "focus", "focused", "focus-visible", "focus-within", "disabled",
  "enabled", "checked", "unchecked", "expanded", "collapsed", "collapsing", "in", "fade", "loading", "loaded",
  "highlight", "highlighted", "pressed", "dragging", "dropping", "error", "invalid", "valid", "dirty", "touched",
  "pristine", "empty", "filled", "on", "off", "toggled", "pinned", "sticky", "stuck", "animated", "animating",
]);

/** Whether a class names a passing state of the element rather than what it is */
export function isStateClass(cls: string): boolean {
  const name = cls.toLowerCase();
  if (STATE_CLASSES.has(name)) return true;
  // is-active, has-error, ng-touched; and suffixes: Mui-selected, ant-btn-loading, item--active
  if (/^(is|has|ng)-/.test(name)) return true;
  if (/(^|[-_])(active|selected|current|open|opened|hover|hovered|focus|focused|disabled|checked|expanded|collapsed|hidden|visible|loading|highlighted|pressed|invalid|dirty|touched|animating)$/.test(name)) {
    return true;
  }
  // Utility classes with variants or arbitrary values (hover:bg-x, w-[12px], w-1/2) say nothing about the element
  return /[:[\]\/!@]/.test(name);
}

interface Candidate {
  xpath: string;
  /** How likely the locator still finds the element after the page changes: higher is more stable */
  weight: number;
}

const WEIGHT = {
  testAttribute: 100,
  id: 90,
  inputValue: 80,
  semanticAttribute: 80,
  text: 70,
  textWithDigits: 45,
  href: 60,
  dataAttribute: 55,
  classes: 35,
  /** Penalties for the less stable forms of a candidate */
  scoped: 5,
  anchorPath: 25,
  indexed: 50,
  fullPath: -100,
} as const;

// The text and the elements inside it, short enough to be a label rather than a block of content
const MAX_TEXT_DESCENDANTS = 3;

/**
 * Builds locator candidates for an element (relative to `//`) with their stability weight.
 * `forAnchor` leaves out the text: the text of a container changes with everything inside it.
 */
function buildCandidates(element: Element, forAnchor = false): Candidate[] {
  const tag = element.tagName.toLowerCase();
  const candidates: Candidate[] = [];
  const add = (xpath: string, weight: number) => candidates.push({ xpath, weight });

  for (const attr of TEST_ATTRIBUTES) {
    const value = element.getAttribute(attr);
    if (value) add(`//*[@${attr}=${xpathLiteral(value)}]`, WEIGHT.testAttribute);
  }

  if (element.id && !isLikelyDynamicValue(element.id)) {
    add(`//*[@id=${xpathLiteral(element.id)}]`, WEIGHT.id);
  }

  for (const attr of SEMANTIC_ATTRIBUTES) {
    const value = element.getAttribute(attr);
    if (value && value.length <= MAX_TEXT_LENGTH && !isLikelyDynamicValue(value)) {
      add(`//${tag}[@${attr}=${xpathLiteral(value)}]`, WEIGHT.semanticAttribute);
    }
  }

  if (tag === "input") {
    const type = element.getAttribute("type");
    const value = element.getAttribute("value");
    if (type && ["submit", "button", "reset"].includes(type) && value) {
      add(`//input[@type=${xpathLiteral(type)} and @value=${xpathLiteral(value)}]`, WEIGHT.inputValue);
    }
  }

  if (tag === "a") {
    const href = element.getAttribute("href");
    if (href && !href.startsWith("javascript:") && href !== "#" && href.length <= 150) {
      // Links carrying ids or query strings change with the data they point to
      add(`//a[@href=${xpathLiteral(href)}]`, /\d{3,}|\?/.test(href) ? WEIGHT.dataAttribute - 10 : WEIGHT.href);
    }
  }

  // The text of an editor is what the user typed: it is not there yet when the scenario is played back
  const isEditor = !!element.closest('[contenteditable]:not([contenteditable="false"])');
  const text = forAnchor || isEditor ? "" : normalizeText(element.textContent);
  if (text && text.length <= MAX_TEXT_LENGTH) {
    // Counters, prices and dates change between runs: a text with digits is a weaker locator
    const weight = /\d/.test(text) ? WEIGHT.textWithDigits : WEIGHT.text;
    const role = element.getAttribute("role");
    if (role) {
      add(`//*[@role=${xpathLiteral(role)} and normalize-space(.)=${xpathLiteral(text)}]`, weight);
    }
    if (TEXT_LOCATOR_TAGS.includes(tag) || element.querySelectorAll("*").length <= MAX_TEXT_DESCENDANTS) {
      add(`//${tag}[normalize-space(.)=${xpathLiteral(text)}]`, weight - 1);
    }
  }

  // Other non-dynamic data-* attributes (skip framework noise like data-v-xxxx / data-reactid and state flags)
  for (const attr of Array.from(element.attributes)) {
    if (
      attr.name.startsWith("data-") &&
      !TEST_ATTRIBUTES.includes(attr.name) &&
      !/^data-(v-|reactid|react|styled|emotion|radix|headlessui|state|active|selected|checked|focus|hover|open|expanded|disabled|highlighted|orientation|side|align)/.test(attr.name) &&
      attr.value &&
      !["true", "false"].includes(attr.value) &&
      !isLikelyDynamicValue(attr.value)
    ) {
      add(`//${tag}[@${attr.name}=${xpathLiteral(attr.value)}]`, WEIGHT.dataAttribute);
    }
  }

  const stableClasses = Array.from(element.classList).filter((cls) => !isLikelyDynamicValue(cls) && !isStateClass(cls));
  if (stableClasses.length > 0) {
    const classSelector = stableClasses
      .slice(0, 3)
      .map((cls) => `contains(concat(" ", normalize-space(@class), " "), ${xpathLiteral(` ${cls} `)})`)
      .join(" and ");
    add(`//${tag}[${classSelector}]`, WEIGHT.classes);
  }

  return candidates;
}

interface Anchor {
  element: Element;
  xpath: string;
}

// How far up the tree an anchor is looked for
const MAX_ANCHOR_DEPTH = 8;

/**
 * Finds the closest ancestor with a stable unique locator (test id, id, name, label, data attribute or
 * classes), to scope candidates that are not unique on their own.
 */
function getAnchor(element: Element): Anchor | null {
  let parent = element.parentElement;
  for (let depth = 0; parent && parent !== document.body && parent !== document.documentElement && depth < MAX_ANCHOR_DEPTH; depth++) {
    const best = buildCandidates(parent, true)
      .sort((a, b) => b.weight - a.weight)
      .find((candidate) => countMatches(candidate.xpath) === 1);
    if (best) return { element: parent, xpath: best.xpath };
    parent = parent.parentElement;
  }
  return null;
}

/** Positional path from an ancestor down to the element: `/div[2]/span[1]` */
function getRelativePath(ancestor: Element, element: Element): string {
  const segments: string[] = [];
  let el: Element | null = element;
  while (el && el !== ancestor) {
    let pos = 1;
    for (let sib = el.previousElementSibling; sib; sib = sib.previousElementSibling) {
      if (sib.tagName === el.tagName) pos++;
    }
    segments.unshift(`${el.tagName.toLowerCase()}[${pos}]`);
    el = el.parentElement;
  }
  return "/" + segments.join("/");
}

/**
 * Generates multiple XPath expressions for a DOM element based on priority.
 *
 * Every candidate gets a stability weight: test ids, ids, names and labels first, then text, links and data
 * attributes, then classes (state classes like "selected" or "active" are never used). A candidate that matches
 * several elements is first scoped to the closest ancestor with a stable unique locator, and only then indexed.
 * A positional path from that ancestor comes before indexed class lists, and the absolute path is the last resort.
 * Only XPaths that actually resolve to the element are kept.
 *
 * @param element The DOM element to generate XPaths for
 * @returns An object containing the primary XPath and an array of alternative XPaths
 */
export function generateXPaths(element: Element): { primaryXPath: string; alternativeXpaths: string[] } {
  if (!element) return { primaryXPath: "", alternativeXpaths: [] };

  const found: Candidate[] = [];
  const anchor = getAnchor(element);

  for (const candidate of buildCandidates(element)) {
    const count = countMatches(candidate.xpath);
    if (count === 1 && matchesElement(candidate.xpath, element)) {
      found.push(candidate);
      continue;
    }
    if (count <= 1) continue;
    if (anchor) {
      const scoped = `${anchor.xpath}${candidate.xpath}`;
      const scopedCount = countMatches(scoped);
      if (scopedCount === 1 && matchesElement(scoped, element)) {
        found.push({ xpath: scoped, weight: candidate.weight - WEIGHT.scoped });
        continue;
      }
      if (scopedCount > 1) {
        const scopedIndexed = `(${scoped})[${indexInMatches(scoped, element)}]`;
        if (matchesElement(scopedIndexed, element)) {
          found.push({ xpath: scopedIndexed, weight: candidate.weight - WEIGHT.indexed + WEIGHT.scoped });
          continue;
        }
      }
    }
    // Fall back to indexing within the matched set
    const indexed = `(${candidate.xpath})[${indexInMatches(candidate.xpath, element)}]`;
    if (matchesElement(indexed, element)) {
      found.push({ xpath: indexed, weight: candidate.weight - WEIGHT.indexed });
    }
  }

  if (anchor) {
    const anchorPath = `${anchor.xpath}${getRelativePath(anchor.element, element)}`;
    if (matchesElement(anchorPath, element)) found.push({ xpath: anchorPath, weight: WEIGHT.anchorPath });
  }
  found.push({ xpath: getFullXPath(element), weight: WEIGHT.fullPath });

  // Stable sort: candidates of the same weight keep their priority order
  const ordered = [...new Set(found.sort((a, b) => b.weight - a.weight).map((candidate) => candidate.xpath))];

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