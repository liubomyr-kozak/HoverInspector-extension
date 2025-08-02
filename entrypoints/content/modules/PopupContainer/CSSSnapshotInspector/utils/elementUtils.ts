/**
 * Utility functions for working with DOM elements
 */
import { shouldSkipProperty } from '../types';

/**
 * Generates a unique CSS path for a DOM element
 * @param element The DOM element to generate a path for
 * @returns A string representing the element's path in the DOM
 */
export const getElementPath = (element: Element): string => {
  if (!element || element.nodeName === "#document") {
    return "";
  }

  let path = element.nodeName.toLowerCase();

  if (element.id) {
    path += `#${element.id}`;
  } else if (element.className && typeof element.className === "string") {
    path += `.${element.className.trim().replace(/\s+/g, ".")}`;
  }

  // Add position among siblings
  const siblings = element.parentNode ? Array.from(element.parentNode.children) : [];
  const index = siblings.indexOf(element as Element);
  if (index > 0) {
    path += `:nth-child(${index + 1})`;
  }

  const parentPath = element.parentNode ? getElementPath(element.parentNode as Element) : "";
  return parentPath ? `${parentPath} > ${path}` : path;
};

/**
 * Captures all computed styles for a DOM element with optimized filtering
 * @param element The DOM element to capture styles for
 * @returns An object containing all computed styles (filtered)
 */
export const captureElementStyles = (element: Element): Record<string, string> => {
  const computedStyle = window.getComputedStyle(element);
  const elementStyles: Record<string, string> = {};
  
  // Use a more efficient approach to iterate through styles
  for (let i = 0; i < computedStyle.length; i++) {
    const property = computedStyle[i];
    
    // Skip properties that should be filtered out
    if (shouldSkipProperty(property)) {
      continue;
    }
    
    elementStyles[property] = computedStyle.getPropertyValue(property);
  }
  
  return elementStyles;
};

/**
 * Captures position and layout information for a DOM element
 * @param element The DOM element to capture position for
 * @returns An object containing position and layout data
 */
export const captureElementPosition = (element: Element) => {
  const computedStyle = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
    zIndex: parseInt(computedStyle.getPropertyValue('z-index')) || 0,
    position: computedStyle.getPropertyValue('position'),
    display: computedStyle.getPropertyValue('display')
  };
};