/**
 * DOM-related utility functions for automation scenarios
 */

/**
 * Checks if an element is part of the extension UI
 * @param element The element to check
 * @returns True if the element is part of the extension UI
 */
export const isExtensionElement = (element: HTMLElement): boolean => {
  // Check if the element or any of its parents has the hover-inspector tag
  let current = element;
  while (current) {
    if (current.tagName && current.tagName.toLowerCase() === 'hover-inspector') {
      return true;
    }
    if (!current.parentElement) {
      break;
    }
    current = current.parentElement;
  }
  return false;
};

/**
 * Generates an XPath for an element
 * @param element The element to generate an XPath for
 * @returns The XPath as a string
 */
export const generateXPath = (element: HTMLElement): string => {
  // Simple XPath generation - this can be enhanced for better selectors
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const paths = [];
  let current = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling = current.previousSibling;
    
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }
    
    const tagName = current.nodeName.toLowerCase();
    const pathIndex = index ? `[${index + 1}]` : '';
    paths.unshift(`${tagName}${pathIndex}`);
    
    current = current.parentNode as HTMLElement;
  }
  
  return `/${paths.join('/')}`;
};