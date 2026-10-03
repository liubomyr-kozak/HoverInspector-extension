/**
 * XPath generation utilities for element identification
 */
import type { XPathVariants } from '../types';

/**
 * Gets the element index among siblings with the same tag name
 */
const getElementIndexForXPath = (element: Element): number => {
  let index = 1; // XPath indices are 1-based
  let sibling = element.previousElementSibling;
  
  while (sibling) {
    if (sibling.tagName === element.tagName) {
      index++;
    }
    sibling = sibling.previousElementSibling;
  }
  
  return index;
};

/**
 * Generates absolute XPath using only tag names and indices
 */
const generateAbsoluteXPath = (element: Element): string => {
  const parts: string[] = [];
  let currentElement: Element | null = element;
  
  while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
    const tagName = currentElement.tagName.toLowerCase();
    
    if (currentElement === document.documentElement) {
      parts.unshift(`/${tagName}`);
      break;
    }
    
    const index = getElementIndexForXPath(currentElement);
    const totalSiblings = Array.from(currentElement.parentNode?.children || [])
      .filter(child => child.tagName === currentElement!.tagName).length;
    
    // Only add index if there are multiple siblings with same tag
    const indexPart = totalSiblings > 1 ? `[${index}]` : '';
    parts.unshift(`/${tagName}${indexPart}`);
    
    currentElement = currentElement.parentElement;
  }
  
  return parts.join('') || '/';
};

/**
 * Generates XPath using IDs where available, falling back to indices
 */
const generateXPathWithId = (element: Element): string => {
  const parts: string[] = [];
  let currentElement: Element | null = element;
  
  while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
    const tagName = currentElement.tagName.toLowerCase();
    
    if (currentElement === document.documentElement) {
      parts.unshift(`/${tagName}`);
      break;
    }
    
    // Use ID if available
    if (currentElement.id) {
      parts.unshift(`//${tagName}[@id='${currentElement.id}']`);
      break;
    }
    
    const index = getElementIndexForXPath(currentElement);
    const totalSiblings = Array.from(currentElement.parentNode?.children || [])
      .filter(child => child.tagName === currentElement!.tagName).length;
    
    const indexPart = totalSiblings > 1 ? `[${index}]` : '';
    parts.unshift(`/${tagName}${indexPart}`);
    
    currentElement = currentElement.parentElement;
  }
  
  return parts.join('') || '/';
};

/**
 * Generates XPath using CSS classes where available
 */
const generateXPathWithClasses = (element: Element): string => {
  const parts: string[] = [];
  let currentElement: Element | null = element;
  
  while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
    const tagName = currentElement.tagName.toLowerCase();
    
    if (currentElement === document.documentElement) {
      parts.unshift(`/${tagName}`);
      break;
    }
    
    // Use first class if available
    const firstClass = currentElement.classList[0];
    if (firstClass) {
      parts.unshift(`//${tagName}[contains(@class,'${firstClass}')]`);
      break;
    }
    
    const index = getElementIndexForXPath(currentElement);
    const totalSiblings = Array.from(currentElement.parentNode?.children || [])
      .filter(child => child.tagName === currentElement!.tagName).length;
    
    const indexPart = totalSiblings > 1 ? `[${index}]` : '';
    parts.unshift(`/${tagName}${indexPart}`);
    
    currentElement = currentElement.parentElement;
  }
  
  return parts.join('') || '/';
};

/**
 * Generates XPath using other attributes where available
 */
const generateXPathWithAttributes = (element: Element): string => {
  const parts: string[] = [];
  let currentElement: Element | null = element;
  
  while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
    const tagName = currentElement.tagName.toLowerCase();
    
    if (currentElement === document.documentElement) {
      parts.unshift(`/${tagName}`);
      break;
    }
    
    // Find a unique attribute (excluding id, class, style)
    const skipAttrs = new Set(['id', 'class', 'style']);
    let foundAttr = false;
    
    for (const attr of currentElement.attributes) {
      if (!skipAttrs.has(attr.name) && attr.value) {
        parts.unshift(`//${tagName}[@${attr.name}='${attr.value}']`);
        foundAttr = true;
        break;
      }
    }
    
    if (foundAttr) break;
    
    const index = getElementIndexForXPath(currentElement);
    const totalSiblings = Array.from(currentElement.parentNode?.children || [])
      .filter(child => child.tagName === currentElement!.tagName).length;
    
    const indexPart = totalSiblings > 1 ? `[${index}]` : '';
    parts.unshift(`/${tagName}${indexPart}`);
    
    currentElement = currentElement.parentElement;
  }
  
  return parts.join('') || '/';
};

/** True when `xpath` finds exactly this element; a selector shared with other elements highlights the wrong one */
const matchesOnly = (xpath: string, element: Element): boolean => {
  try {
    const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    return result.snapshotLength === 1 && result.snapshotItem(0) === element;
  } catch {
    return false;
  }
};

/** `contains(@class, 'a')` also matches `ab`; pad both sides with spaces to match whole class names */
const hasClass = (name: string) => `contains(concat(' ', normalize-space(@class), ' '), ' ${name} ')`;

/**
 * Generates optimized XPath: the shortest selector (id, classes, another attribute) that finds only this
 * element, else the absolute path
 */
const generateOptimizedXPath = (element: Element): string => {
  const tag = element.tagName.toLowerCase();
  const skipAttrs = new Set(["id", "class", "style"]);
  const attribute = Array.from(element.attributes).find((attr) => !skipAttrs.has(attr.name) && attr.value && !attr.value.includes("'"));
  const classes = Array.from(element.classList).filter((c) => !c.includes("'"));
  const candidates = [
    element.id && !element.id.includes("'") ? `//${tag}[@id='${element.id}']` : "",
    classes.length ? `//${tag}[${classes.map(hasClass).join(" and ")}]` : "",
    attribute ? `//${tag}[@${attribute.name}='${attribute.value}']` : "",
  ];
  return candidates.find((xpath) => xpath && matchesOnly(xpath, element)) || generateAbsoluteXPath(element);
};

/**
 * Generates all XPath variants for an element
 */
export const generateXPathVariants = (element: Element): XPathVariants => {
  return {
    absolute: generateAbsoluteXPath(element),
    withId: generateXPathWithId(element),
    withClasses: generateXPathWithClasses(element),
    withAttributes: generateXPathWithAttributes(element),
    optimized: generateOptimizedXPath(element)
  };
};
