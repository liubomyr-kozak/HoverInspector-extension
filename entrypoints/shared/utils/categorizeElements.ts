import { isButtonElement } from './isButtonElement';

/**
 * Element category types
 */
export type ElementCategory = 
  // Button categories
  | 'primary-button'
  | 'secondary-button'
  | 'tertiary-button'
  | 'icon-button'
  | 'text-button'
  | 'link-button'
  // Form element categories
  | 'form-input'
  | 'input-text'
  | 'input-checkbox'
  | 'input-radio'
  | 'input-select'
  | 'input-textarea'
  | 'input-other'
  // Other UI element categories
  | 'navigation'
  | 'container'
  | 'modal'
  | 'tooltip'
  | 'other'
  // Accessibility and design issue categories
  | 'a11y-contrast-issue'
  | 'a11y-missing-alt'
  | 'a11y-missing-label'
  | 'a11y-missing-aria'
  | 'design-small-target'
  | 'design-overflow-issue'
  | 'design-spacing-issue';

/**
 * Interface for categorized element
 */
export interface CategorizedElement {
  element: Element;
  category: ElementCategory;
  issueDetails?: string; // Optional details about the issue
}

/**
 * Categorizes an element based on its characteristics
 * @param element The DOM element to categorize
 * @returns The element category or null if it's not a UI element of interest
 */
/**
 * Checks if an element has accessibility or design issues
 * 
 * This function examines an element for various accessibility and design issues:
 * - Missing alt text on images
 * - Missing labels on form elements
 * - Missing ARIA attributes on interactive elements
 * - Small target size on interactive elements (less than 44x44px)
 * - Content overflow issues
 * - Inadequate spacing (padding less than 4px)
 * - Poor contrast between text and background
 * 
 * @param element The element to check
 * @returns An object with the issue category and details, or null if no issues
 */
export const checkElementIssues = (element: Element): { category: ElementCategory, details: string } | null => {
  if (!element) return null;
  
  // Check for missing alt text on images
  if (element.tagName.toLowerCase() === 'img') {
    const altText = element.getAttribute('alt');
    if (!altText) {
      return {
        category: 'a11y-missing-alt',
        details: 'Image is missing alt text which is required for screen readers'
      };
    }
  }
  
  // Check for missing labels on form elements
  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
    const id = element.getAttribute('id');
    if (id) {
      // Check if there's a label associated with this input
      const hasLabel = document.querySelector(`label[for="${id}"]`) !== null;
      if (!hasLabel && !element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
        return {
          category: 'a11y-missing-label',
          details: 'Form element is missing an associated label'
        };
      }
    } else if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
      return {
        category: 'a11y-missing-label',
        details: 'Form element is missing an associated label'
      };
    }
  }
  
  // Check for missing ARIA attributes on interactive elements
  if (element.getAttribute('role') === 'button' || element.getAttribute('role') === 'link') {
    if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby') && element.textContent?.trim() === '') {
      return {
        category: 'a11y-missing-aria',
        details: 'Interactive element is missing required ARIA attributes'
      };
    }
  }
  
  // Check for small target size on interactive elements
  if (isButtonElement(element) || element.tagName.toLowerCase() === 'a' || element.getAttribute('role') === 'button') {
    const rect = element.getBoundingClientRect();
    if (rect.width < 44 || rect.height < 44) {
      return {
        category: 'design-small-target',
        details: `Element size (${Math.round(rect.width)}x${Math.round(rect.height)}px) is too small for comfortable interaction. Recommended minimum is 44x44px.`
      };
    }
  }
  
  // Check for overflow issues
  const style = window.getComputedStyle(element);
  if (style.overflow === 'hidden' && element.scrollWidth > element.clientWidth) {
    return {
      category: 'design-overflow-issue',
      details: 'Content is overflowing and being clipped'
    };
  }
  
  // Check for spacing issues (very small padding)
  if (element.children.length > 0 && style.padding !== '' && style.padding !== 'auto') {
    const padding = style.padding.split(' ').map(val => parseInt(val));
    if (padding.some(val => val < 4) && padding.every(val => !isNaN(val))) {
      return {
        category: 'design-spacing-issue',
        details: 'Element has inadequate padding (less than 4px)'
      };
    }
  }
  
  // Check for contrast issues (simplified check)
  if (element.textContent && element.textContent.trim() !== '') {
    const backgroundColor = style.backgroundColor;
    const color = style.color;
    
    // Very simplified contrast check - in a real implementation, you would use a proper contrast ratio calculation
    if (backgroundColor === color || 
        (backgroundColor === 'rgba(0, 0, 0, 0)' && color === 'rgb(255, 255, 255)') ||
        (backgroundColor === 'rgb(255, 255, 255)' && color === 'rgb(255, 255, 255)')) {
      return {
        category: 'a11y-contrast-issue',
        details: 'Text has poor contrast with its background'
      };
    }
  }
  
  return null;
};

export const categorizeElement = (element: Element | null): ElementCategory | null => {
  if (!element) return null;
  
  // Check for accessibility and design issues first
  const issues = checkElementIssues(element);
  if (issues) {
    return issues.category;
  }
  
  // Check if it's a button first
  if (isButtonElement(element)) {
    return categorizeButtonElement(element);
  }
  
  // Check for form inputs and get specific form input category
  const formInputCategory = categorizeFormInput(element);
  if (formInputCategory) {
    return formInputCategory;
  }
  
  // Check for navigation elements
  if (isNavigationElement(element)) {
    return 'navigation';
  }
  
  // Check for containers
  if (isContainerElement(element)) {
    return 'container';
  }
  
  // Check for modals
  if (isModalElement(element)) {
    return 'modal';
  }
  
  // Check for tooltips
  if (isTooltipElement(element)) {
    return 'tooltip';
  }
  
  return null;
};

/**
 * Categorizes a button element based on its characteristics
 * @param element The button element to categorize
 * @returns The button category
 */
const categorizeButtonElement = (element: Element): ElementCategory => {
  const computedStyle = window.getComputedStyle(element);
  
  // Check if it's an icon button (has icon but no text or very little text)
  if (isIconButton(element)) {
    return 'icon-button';
  }
  
  // Check if it's a link button (anchor tag styled as button)
  if (element.tagName.toLowerCase() === 'a' && element.hasAttribute('href')) {
    return 'link-button';
  }
  
  // Check if it's a text button (no background or transparent background)
  if (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || 
      computedStyle.backgroundColor === 'transparent') {
    return 'text-button';
  }
  
  // Try to determine if it's primary, secondary, or tertiary based on styling
  const isPrimary = isPrimaryButton(element, computedStyle);
  if (isPrimary) {
    return 'primary-button';
  }
  
  const isSecondary = isSecondaryButton(element, computedStyle);
  if (isSecondary) {
    return 'secondary-button';
  }
  
  // Default to tertiary if it doesn't match other categories
  return 'tertiary-button';
};

/**
 * Checks if an element is an icon button
 * @param element The element to check
 * @returns True if the element is an icon button
 */
const isIconButton = (element: Element): boolean => {
  // Check if it has an icon element as a child
  const hasIconChild = element.querySelector('svg, i, img[alt*="icon"], [class*="icon"]') !== null;
  
  // Check if it has very little text content
  const textContent = element.textContent?.trim() || '';
  const hasMinimalText = textContent.length <= 2;
  
  // Check if it has a square-ish shape (width and height are similar)
  const rect = element.getBoundingClientRect();
  const isSquarish = Math.abs(rect.width - rect.height) < 10;
  
  return hasIconChild && (hasMinimalText || isSquarish);
};

/**
 * Checks if an element is a primary button
 * @param element The element to check
 * @param style The computed style of the element
 * @returns True if the element is a primary button
 */
const isPrimaryButton = (element: Element, style: CSSStyleDeclaration): boolean => {
  // Primary buttons typically have:
  // - Solid background color
  // - High contrast with text
  // - Possibly larger size or padding
  
  const hasBackgroundColor = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                             style.backgroundColor !== 'transparent';
  const hasBoldText = style.fontWeight === 'bold' || 
                      parseInt(style.fontWeight) >= 600;
  
  // Check for common primary button classes
  const className = element.className.toLowerCase();
  const hasPrimaryClass = className.includes('primary') || 
                          className.includes('main') || 
                          className.includes('cta');
  
  // Check for common primary button attributes
  const type = element.getAttribute('type')?.toLowerCase();
  const isPrimaryType = type === 'submit';
  
  return hasBackgroundColor && (hasBoldText || hasPrimaryClass || isPrimaryType);
};

/**
 * Checks if an element is a secondary button
 * @param element The element to check
 * @param style The computed style of the element
 * @returns True if the element is a secondary button
 */
const isSecondaryButton = (element: Element, style: CSSStyleDeclaration): boolean => {
  // Secondary buttons typically have:
  // - Outlined style (border but transparent or light background)
  // - Medium contrast
  
  const hasOutline = style.border !== 'none' && style.border !== '';
  const hasLightBackground = style.backgroundColor === 'rgba(0, 0, 0, 0)' || 
                             style.backgroundColor === 'transparent' ||
                             style.backgroundColor.includes('rgba(') ||
                             style.backgroundColor.includes('hsla(');
  
  // Check for common secondary button classes
  const className = element.className.toLowerCase();
  const hasSecondaryClass = className.includes('secondary') || 
                            className.includes('outline') || 
                            className.includes('bordered');
  
  return hasOutline && (hasLightBackground || hasSecondaryClass);
};

/**
 * Checks if an element is a form input and categorizes it by type
 * @param element The element to check
 * @returns The specific form input category or null if it's not a form input
 */
const categorizeFormInput = (element: Element): ElementCategory | null => {
  const tagName = element.tagName.toLowerCase();
  
  // Handle input elements
  if (tagName === 'input') {
    const inputType = element.getAttribute('type')?.toLowerCase() || 'text';
    
    // Categorize by input type
    if (['text', 'email', 'password', 'search', 'tel', 'url', 'number', 'date', 'datetime-local', 'month', 'time', 'week'].includes(inputType)) {
      return 'input-text';
    } else if (inputType === 'checkbox') {
      return 'input-checkbox';
    } else if (inputType === 'radio') {
      return 'input-radio';
    } else {
      return 'input-other';
    }
  }
  
  // Handle select elements
  if (tagName === 'select') {
    return 'input-select';
  }
  
  // Handle textarea elements
  if (tagName === 'textarea') {
    return 'input-textarea';
  }
  
  // Check for elements with input-related roles
  const role = element.getAttribute('role')?.toLowerCase();
  if (role) {
    if (role === 'textbox') {
      return 'input-text';
    } else if (role === 'checkbox') {
      return 'input-checkbox';
    } else if (role === 'radio') {
      return 'input-radio';
    } else if (role === 'combobox') {
      return 'input-select';
    } else if (['slider', 'spinbutton'].includes(role)) {
      return 'input-other';
    }
  }
  
  // Check for custom form elements with classes that suggest their type
  const className = element.className.toLowerCase();
  if (className) {
    if (className.includes('checkbox')) {
      return 'input-checkbox';
    } else if (className.includes('radio')) {
      return 'input-radio';
    } else if (className.includes('select') || className.includes('dropdown')) {
      return 'input-select';
    } else if (className.includes('input') || className.includes('textbox') || className.includes('field')) {
      return 'input-text';
    } else if (className.includes('textarea')) {
      return 'input-textarea';
    }
  }
  
  return null;
};

/**
 * Checks if an element is a navigation element
 * @param element The element to check
 * @returns True if the element is a navigation element
 */
const isNavigationElement = (element: Element): boolean => {
  const tagName = element.tagName.toLowerCase();
  
  // Check for common navigation elements
  if (['nav', 'menu', 'menuitem', 'ul', 'ol'].includes(tagName)) {
    return true;
  }
  
  // Check for elements with navigation-related roles
  const role = element.getAttribute('role')?.toLowerCase();
  if (role && ['navigation', 'menu', 'menubar', 'menuitem', 'tab', 'tablist'].includes(role)) {
    return true;
  }
  
  // Check for common navigation classes
  const className = element.className.toLowerCase();
  if (className.includes('nav') || className.includes('menu') || className.includes('tabs')) {
    return true;
  }
  
  return false;
};

/**
 * Checks if an element is a container element
 * @param element The element to check
 * @returns True if the element is a container element
 */
const isContainerElement = (element: Element): boolean => {
  const tagName = element.tagName.toLowerCase();
  
  // Check for common container elements
  if (['div', 'section', 'article', 'aside', 'main', 'header', 'footer'].includes(tagName)) {
    // Must have children to be considered a container
    if (element.children.length === 0) {
      return false;
    }
    
    // Check for common container classes
    const className = element.className.toLowerCase();
    if (className.includes('container') || 
        className.includes('card') || 
        className.includes('panel') || 
        className.includes('box')) {
      return true;
    }
    
    // Check for container-like styling
    const style = window.getComputedStyle(element);
    const hasBorder = style.border !== 'none' && style.border !== '';
    const hasBackground = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                          style.backgroundColor !== 'transparent';
    const hasPadding = style.padding !== '0px';
    
    return hasBorder && hasBackground && hasPadding;
  }
  
  return false;
};

/**
 * Checks if an element is a modal element
 * @param element The element to check
 * @returns True if the element is a modal element
 */
const isModalElement = (element: Element): boolean => {
  // Check for common modal classes
  const className = element.className.toLowerCase();
  if (className.includes('modal') || 
      className.includes('dialog') || 
      className.includes('popup')) {
    return true;
  }
  
  // Check for elements with modal-related roles
  const role = element.getAttribute('role')?.toLowerCase();
  if (role && ['dialog', 'alertdialog'].includes(role)) {
    return true;
  }
  
  // Check for modal-like styling
  const style = window.getComputedStyle(element);
  const hasHighZIndex = parseInt(style.zIndex) > 100;
  const hasPosition = style.position === 'fixed' || style.position === 'absolute';
  
  return hasHighZIndex && hasPosition;
};

/**
 * Checks if an element is a tooltip element
 * @param element The element to check
 * @returns True if the element is a tooltip element
 */
const isTooltipElement = (element: Element): boolean => {
  // Check for common tooltip classes
  const className = element.className.toLowerCase();
  if (className.includes('tooltip') || 
      className.includes('popover') || 
      className.includes('hint')) {
    return true;
  }
  
  // Check for elements with tooltip-related roles
  const role = element.getAttribute('role')?.toLowerCase();
  if (role && ['tooltip'].includes(role)) {
    return true;
  }
  
  return false;
};

/**
 * Categorizes all elements on the page
 * @returns An array of categorized elements
 */
export const categorizeAllElements = (): CategorizedElement[] => {
  const allElements = document.querySelectorAll('*');
  const categorizedElements: CategorizedElement[] = [];
  
  allElements.forEach(element => {
    // Check for accessibility and design issues first
    const issues = checkElementIssues(element);
    if (issues) {
      categorizedElements.push({ 
        element, 
        category: issues.category,
        issueDetails: issues.details
      });
      return; // Skip further categorization for this element
    }
    
    // If no issues, categorize by element type
    const category = categorizeElement(element);
    if (category) {
      categorizedElements.push({ element, category });
    }
  });
  
  return categorizedElements;
};

/**
 * Gets all elements with accessibility or design issues
 * 
 * This function scans all elements in the document and identifies those with 
 * accessibility or design issues using the checkElementIssues function.
 * It returns an array of CategorizedElement objects containing:
 * - The element with the issue
 * - The category of the issue (e.g., 'a11y-missing-alt', 'design-small-target')
 * - Details about the issue
 * 
 * This is used by the ElementsWithIssues component to display a list of 
 * elements with issues that need to be addressed.
 * 
 * @returns An array of elements with issues
 */
export const getElementsWithIssues = (): CategorizedElement[] => {
  const allElements = document.querySelectorAll('*');
  const elementsWithIssues: CategorizedElement[] = [];
  
  allElements.forEach(element => {
    const issues = checkElementIssues(element);
    if (issues) {
      elementsWithIssues.push({ 
        element, 
        category: issues.category,
        issueDetails: issues.details
      });
    }
  });
  
  return elementsWithIssues;
};