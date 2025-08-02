/**
 * Utility functions for working with XPaths in automation scenarios
 */

/**
 * Generates multiple XPath expressions for a DOM element based on priority
 * This function creates multiple XPath expressions that can be used to identify the element
 * 
 * @param element The DOM element to generate XPaths for
 * @returns An object containing the primary XPath and an array of alternative XPaths
 */
export function generateXPaths(element: Element): { primaryXPath: string, alternativeXpaths: string[] } {
  if (!element) return { primaryXPath: '', alternativeXpaths: [] };
  
  const xpaths: string[] = [];
  
  // 1. If there's a unique data-* attribute (e.g., data-testid) → use it
  const dataAttributes = Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('data-'));
  
  if (dataAttributes.length > 0) {
    // Prioritize data-testid if it exists
    const dataTestId = dataAttributes.find(attr => attr.name === 'data-testid');
    if (dataTestId) {
      xpaths.push(`//*[@data-testid="${dataTestId.value}"]`);
    } else {
      // Use the first data-* attribute
      const dataAttr = dataAttributes[0];
      xpaths.push(`//*[@${dataAttr.name}="${dataAttr.value}"]`);
    }
  }
  
  // 2. If there's a unique id → use #id
  if (element.id) {
    xpaths.push(`//*[@id="${element.id}"]`);
  }
  
  // 3. If there's a role or accessible text → use them
  const role = element.getAttribute('role');
  if (role) {
    // Try to find a text node child
    let textContent = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        textContent = node.textContent.trim();
        break;
      }
    }
    
    if (textContent) {
      xpaths.push(`//*[@role="${role}" and contains(text(),"${textContent}")]`);
    } else {
      xpaths.push(`//*[@role="${role}"]`);
    }
  } else if (element.textContent?.trim()) {
    // Use text content if available
    const text = element.textContent.trim();
    xpaths.push(`//*[contains(text(),"${text}")]`);
  }
  
  // 4. Build a CSS-selector-like XPath using classes
  if (element.classList && element.classList.length > 0) {
    const classSelector = Array.from(element.classList)
      .map(cls => `contains(@class,"${cls}")`)
      .join(' and ');
    
    xpaths.push(`//${element.tagName.toLowerCase()}[${classSelector}]`);
  }
  
  // 5. Build a relative XPath
  // Get the element's position among siblings of the same type
  let position = 1;
  let sibling = element.previousElementSibling;
  
  while (sibling) {
    if (sibling.tagName === element.tagName) {
      position++;
    }
    sibling = sibling.previousElementSibling;
  }
  
  if (element.parentElement) {
    const parentTag = element.parentElement.tagName.toLowerCase();
    xpaths.push(`//${parentTag}/${element.tagName.toLowerCase()}[${position}]`);
  }
  
  // 6. Build a full XPath
  // Recursively build the full XPath
  const getFullXPath = (el: Element): string => {
    if (!el) return '';
    if (el.tagName.toLowerCase() === 'body') return '/html/body';
    
    let pos = 1;
    let sib = el.previousElementSibling;
    
    while (sib) {
      if (sib.tagName === el.tagName) {
        pos++;
      }
      sib = sib.previousElementSibling;
    }
    
    const parentPath = el.parentElement ? getFullXPath(el.parentElement) : '';
    return `${parentPath}/${el.tagName.toLowerCase()}[${pos}]`;
  };
  
  xpaths.push(getFullXPath(element));
  
  // Remove duplicates
  const uniqueXpaths = [...new Set(xpaths)];
  
  // Return the primary XPath (first in priority) and all alternatives
  return {
    primaryXPath: uniqueXpaths[0],
    alternativeXpaths: uniqueXpaths
  };
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
    console.log(`Primary XPath failed, trying ${alternativeXpaths.length} alternative XPaths`);
    
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
          console.log(`Found element using alternative XPath: ${altXPath}`);
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