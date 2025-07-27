/**
 * Utility functions for working with XPaths in automation scenarios
 */

/**
 * Generates an XPath for a DOM element
 * This function creates a unique XPath that can be used to identify the element
 * 
 * @param element The DOM element to generate an XPath for
 * @returns The XPath string for the element
 */
export function generateXPath(element: Element): string {
  if (!element) return '';
  
  // If the element has an id, use that for a simple, robust XPath
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  // If we reached the body, return it
  if (element.tagName.toLowerCase() === 'body') {
    return '/html/body';
  }
  
  // Get the element's position among siblings of the same type
  let position = 1;
  let sibling = element.previousElementSibling;
  
  while (sibling) {
    if (sibling.tagName === element.tagName) {
      position++;
    }
    sibling = sibling.previousElementSibling;
  }
  
  // Recursively build the XPath
  const parentXPath = element.parentElement ? generateXPath(element.parentElement) : '';
  return `${parentXPath}/${element.tagName.toLowerCase()}[${position}]`;
}

/**
 * Gets an element by its XPath
 * 
 * @param xpath The XPath to use to find the element
 * @returns The element if found, null otherwise
 */
export function getElementByXPath(xpath: string): Element | null {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    
    return result.singleNodeValue as Element;
  } catch (error) {
    console.error('Error evaluating XPath:', error);
    return null;
  }
}