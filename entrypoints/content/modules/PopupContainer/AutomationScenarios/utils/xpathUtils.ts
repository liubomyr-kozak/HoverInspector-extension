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
      const specificXPath = `//${element.tagName.toLowerCase()}[@${attr.name}="${attr.value}"]`;
      const validation = validateXPathUniqueness(specificXPath);
      if (validation.isUnique) {
        improvedXPaths.push(specificXPath);
      }
    }
  }
  
  // Strategy 3: Combine multiple attributes for higher specificity
  if (element.id && element.classList.length > 0) {
    const combinedXPath = `//${element.tagName.toLowerCase()}[@id="${element.id}" and contains(@class,"${element.classList[0]}")]`;
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
      parentIdentifier = `[@id="${element.parentElement.id}"]`;
    } else if (element.parentElement.classList.length > 0) {
      parentIdentifier = `[contains(@class,"${element.parentElement.classList[0]}")]`;
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
    const textBasedXPath = `//${element.tagName.toLowerCase()}[normalize-space(text())="${textContent}"]`;
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