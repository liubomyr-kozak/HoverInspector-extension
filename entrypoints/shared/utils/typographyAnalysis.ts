import { CategorizedElement } from "./categorizeElements";

/**
 * Typography category types
 */
export type TypographyCategory = 
  // Typography element categories
  | 'heading-h1'
  | 'heading-h2'
  | 'heading-h3'
  | 'heading-h4'
  | 'heading-h5'
  | 'heading-h6'
  | 'paragraph'
  | 'list-item'
  | 'label'
  | 'button-text'
  | 'link-text'
  | 'input-text'
  // Typography issue categories
  | 'typography-inconsistent-scale'
  | 'typography-absolute-units'
  | 'typography-too-many-fonts'
  | 'typography-inappropriate-weight'
  | 'typography-line-height-issue'
  | 'typography-spacing-issue'
  | 'typography-readability-issue';

/**
 * Interface for typography element
 */
export interface TypographyElement {
  element: Element;
  category: TypographyCategory;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  color: string;
  usesRelativeUnits: boolean;
  issueDetails?: string; // Optional details about the issue
}

/**
 * Interface for aggregated typography properties
 */
export interface AggregatedTypographyProperties {
  fontFamilies: Map<string, number>;
  fontSizes: Map<string, number>;
  fontWeights: Map<string, number>;
  lineHeights: Map<string, number>;
  letterSpacings: Map<string, number>;
  textAligns: Map<string, number>;
  colors: Map<string, number>;
  totalElements: number;
  elementsByCategory: Map<TypographyCategory, TypographyElement[]>;
  typographyIssues: number;
}

/**
 * Categorizes a text element based on its characteristics
 * @param element The DOM element to categorize
 * @returns The typography category or null if it's not a text element of interest
 */
export const categorizeTypographyElement = (element: Element): TypographyCategory | null => {
  if (!element) return null;
  
  const tagName = element.tagName.toLowerCase();
  
  // Headings
  if (tagName === 'h1') return 'heading-h1';
  if (tagName === 'h2') return 'heading-h2';
  if (tagName === 'h3') return 'heading-h3';
  if (tagName === 'h4') return 'heading-h4';
  if (tagName === 'h5') return 'heading-h5';
  if (tagName === 'h6') return 'heading-h6';
  
  // Paragraphs
  if (tagName === 'p') return 'paragraph';
  
  // List items
  if (tagName === 'li') return 'list-item';
  
  // Labels
  if (tagName === 'label') return 'label';
  
  // Button text
  if (tagName === 'button' || element.getAttribute('role') === 'button') return 'button-text';
  
  // Link text
  if (tagName === 'a' || element.getAttribute('role') === 'link') return 'link-text';
  
  // Input text
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return 'input-text';
  
  // Check for div or span with text content
  if ((tagName === 'div' || tagName === 'span') && element.textContent?.trim()) {
    // Check if it's a button or link
    if (element.getAttribute('role') === 'button') return 'button-text';
    if (element.getAttribute('role') === 'link') return 'link-text';
    
    // Check parent element to determine context
    const parentElement = element.parentElement;
    if (parentElement) {
      const parentTagName = parentElement.tagName.toLowerCase();
      if (parentTagName === 'button') return 'button-text';
      if (parentTagName === 'a') return 'link-text';
      if (parentTagName === 'label') return 'label';
    }
    
    // Default to paragraph if it has substantial text
    if (element.textContent.trim().length > 10) return 'paragraph';
  }
  
  return null;
};

/**
 * Checks if an element has typography issues
 * 
 * This function examines an element for various typography issues:
 * - Inconsistent type scale
 * - Use of absolute units (px) instead of relative units (rem, em)
 * - Too many font families
 * - Inappropriate font weights
 * - Line height issues
 * - Spacing issues
 * - Readability issues
 * 
 * @param element The element to check
 * @param computedStyle The computed style of the element
 * @returns An object with the issue category and details, or null if no issues
 */
export const checkTypographyIssues = (
  element: Element, 
  computedStyle: CSSStyleDeclaration
): { category: TypographyCategory, details: string } | null => {
  if (!element || !computedStyle) return null;
  
  // Check for absolute units in font size
  const fontSize = computedStyle.fontSize;
  if (fontSize && fontSize.endsWith('px')) {
    return {
      category: 'typography-absolute-units',
      details: `Font size uses absolute units (${fontSize}) instead of relative units (rem/em)`
    };
  }
  
  // Check for inappropriate font weights based on element type
  const fontWeight = computedStyle.fontWeight;
  const category = categorizeTypographyElement(element);
  
  if (category && fontWeight) {
    const weightNum = parseInt(fontWeight);
    
    // Headings should typically use bolder weights
    if (category.startsWith('heading-') && weightNum < 500) {
      return {
        category: 'typography-inappropriate-weight',
        details: `Heading has a light font weight (${fontWeight}), should be 500+ for better hierarchy`
      };
    }
    
    // Buttons should have medium to bold weight
    if (category === 'button-text' && weightNum < 400) {
      return {
        category: 'typography-inappropriate-weight',
        details: `Button text has a light font weight (${fontWeight}), should be 400+ for better usability`
      };
    }
  }
  
  // Check for line height issues
  const lineHeight = computedStyle.lineHeight;
  if (lineHeight === 'normal' || (lineHeight && parseFloat(lineHeight) < 1.2)) {
    return {
      category: 'typography-line-height-issue',
      details: `Line height (${lineHeight}) is too tight for good readability, should be at least 1.2`
    };
  }
  
  // Check for letter spacing issues in headings
  if (category && category.startsWith('heading-')) {
    const letterSpacing = computedStyle.letterSpacing;
    if (letterSpacing === 'normal' || (letterSpacing && parseFloat(letterSpacing) < 0)) {
      return {
        category: 'typography-spacing-issue',
        details: `Heading has tight letter spacing (${letterSpacing}), consider adding positive letter spacing for better readability`
      };
    }
  }
  
  return null;
};

/**
 * Gets all typography elements on the page
 * @returns Array of typography elements with their properties
 */
export const getAllTypographyElements = (): TypographyElement[] => {
  const allElements = document.querySelectorAll('*');
  const typographyElements: TypographyElement[] = [];
  
  allElements.forEach(element => {
    const category = categorizeTypographyElement(element);
    if (category) {
      const computedStyle = window.getComputedStyle(element);
      
      // Check if this element has any text content
      if (element.textContent?.trim()) {
        const usesRelativeUnits = !computedStyle.fontSize.endsWith('px');
        
        // Create typography element object
        const typographyElement: TypographyElement = {
          element,
          category,
          fontFamily: computedStyle.fontFamily,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight,
          lineHeight: computedStyle.lineHeight,
          letterSpacing: computedStyle.letterSpacing,
          textAlign: computedStyle.textAlign,
          color: computedStyle.color,
          usesRelativeUnits
        };
        
        // Check for issues
        const issues = checkTypographyIssues(element, computedStyle);
        if (issues) {
          typographyElement.issueDetails = issues.details;
        }
        
        typographyElements.push(typographyElement);
      }
    }
  });
  
  return typographyElements;
};

/**
 * Gets elements with typography issues
 * @returns Array of elements with typography issues
 */
export const getElementsWithTypographyIssues = (): CategorizedElement[] => {
  const allElements = document.querySelectorAll('*');
  const elementsWithIssues: CategorizedElement[] = [];
  
  allElements.forEach(element => {
    const category = categorizeTypographyElement(element);
    if (category) {
      const computedStyle = window.getComputedStyle(element);
      const issues = checkTypographyIssues(element, computedStyle);
      
      if (issues) {
        elementsWithIssues.push({
          element,
          category: issues.category,
          issueDetails: issues.details
        });
      }
    }
  });
  
  return elementsWithIssues;
};

/**
 * Aggregates typography properties from all typography elements
 * @returns Aggregated typography properties
 */
export const aggregateTypographyProperties = (): AggregatedTypographyProperties => {
  const typographyElements = getAllTypographyElements();
  
  const fontFamilies = new Map<string, number>();
  const fontSizes = new Map<string, number>();
  const fontWeights = new Map<string, number>();
  const lineHeights = new Map<string, number>();
  const letterSpacings = new Map<string, number>();
  const textAligns = new Map<string, number>();
  const colors = new Map<string, number>();
  const elementsByCategory = new Map<TypographyCategory, TypographyElement[]>();
  
  let typographyIssues = 0;
  
  typographyElements.forEach(element => {
    // Count font families
    const fontFamily = element.fontFamily;
    fontFamilies.set(fontFamily, (fontFamilies.get(fontFamily) || 0) + 1);
    
    // Count font sizes
    const fontSize = element.fontSize;
    fontSizes.set(fontSize, (fontSizes.get(fontSize) || 0) + 1);
    
    // Count font weights
    const fontWeight = element.fontWeight;
    fontWeights.set(fontWeight, (fontWeights.get(fontWeight) || 0) + 1);
    
    // Count line heights
    const lineHeight = element.lineHeight;
    lineHeights.set(lineHeight, (lineHeights.get(lineHeight) || 0) + 1);
    
    // Count letter spacings
    const letterSpacing = element.letterSpacing;
    letterSpacings.set(letterSpacing, (letterSpacings.get(letterSpacing) || 0) + 1);
    
    // Count text aligns
    const textAlign = element.textAlign;
    textAligns.set(textAlign, (textAligns.get(textAlign) || 0) + 1);
    
    // Count colors
    const color = element.color;
    colors.set(color, (colors.get(color) || 0) + 1);
    
    // Group by category
    const category = element.category;
    if (!elementsByCategory.has(category)) {
      elementsByCategory.set(category, []);
    }
    elementsByCategory.get(category)?.push(element);
    
    // Count issues
    if (element.issueDetails) {
      typographyIssues++;
    }
  });
  
  return {
    fontFamilies,
    fontSizes,
    fontWeights,
    lineHeights,
    letterSpacings,
    textAligns,
    colors,
    totalElements: typographyElements.length,
    elementsByCategory,
    typographyIssues
  };
};

/**
 * Gets typography rules based on design guidelines
 * @returns Array of typography rules with descriptions
 */
export const getTypographyRules = (): { title: string, description: string, forAudience: string[] }[] => {
  return [
    {
      title: "Use a consistent type scale",
      description: "Maintain a consistent hierarchy by using a defined set of font sizes. Avoid arbitrary sizes that don't follow the scale.",
      forAudience: ["designers", "developers"]
    },
    {
      title: "Prefer relative units",
      description: "Use rem or em units instead of px for better accessibility and responsive design. This allows text to scale based on user preferences.",
      forAudience: ["developers", "QA"]
    },
    {
      title: "Limit font families",
      description: "Use a maximum of 2-3 font families in your application. Too many fonts create visual noise and inconsistency.",
      forAudience: ["designers", "developers"]
    },
    {
      title: "Use appropriate font weights",
      description: "Headings should use medium to bold weights (500+) while body text should use regular weights (400). Avoid using too many different weights.",
      forAudience: ["designers", "developers", "QA"]
    },
    {
      title: "Maintain adequate line height",
      description: "Line height should be at least 1.2 times the font size for headings and 1.5 for body text to ensure readability.",
      forAudience: ["designers", "developers", "QA"]
    },
    {
      title: "Consider letter spacing",
      description: "Add positive letter spacing for headings and maintain normal spacing for body text. Avoid negative letter spacing except for specific design cases.",
      forAudience: ["designers"]
    },
    {
      title: "Ensure sufficient contrast",
      description: "Text should have a contrast ratio of at least 4.5:1 against its background for normal text and 3:1 for large text (18pt+).",
      forAudience: ["designers", "developers", "QA"]
    },
    {
      title: "Use semantic HTML elements",
      description: "Use proper heading tags (h1-h6) for headings rather than styling div or span elements to look like headings.",
      forAudience: ["developers", "QA"]
    },
    {
      title: "Maintain consistent alignment",
      description: "Be consistent with text alignment. Left-aligned text is generally more readable for languages that read left-to-right.",
      forAudience: ["designers", "developers"]
    },
    {
      title: "Limit line length",
      description: "Keep line length between 45-75 characters for optimal readability. Too long or too short lines can reduce reading speed.",
      forAudience: ["designers", "developers"]
    }
  ];
};