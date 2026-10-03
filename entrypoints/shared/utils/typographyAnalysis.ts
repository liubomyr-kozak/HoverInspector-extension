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
 * Stylesheet rules that declare a font-size, collected once per scan.
 * Computed font sizes are always in px, so the authored unit has to be read from
 * the inline style or from the rules that match the element.
 */
let fontSizeRules: CSSStyleRule[] | null = null;

const collectFontSizeRules = (rules: CSSRuleList, out: CSSStyleRule[]) => {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      if (rule.style.getPropertyValue('font-size')) out.push(rule);
    } else if (rule instanceof CSSMediaRule) {
      if (window.matchMedia(rule.media.mediaText).matches) collectFontSizeRules(rule.cssRules, out);
    } else if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
      collectFontSizeRules((rule as CSSGroupingRule).cssRules, out);
    }
  }
};

const getFontSizeRules = (): CSSStyleRule[] => {
  if (!fontSizeRules) {
    fontSizeRules = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        collectFontSizeRules(sheet.cssRules, fontSizeRules);
      } catch {
        // Cross-origin stylesheet: rules are not readable
      }
    }
  }
  return fontSizeRules;
};

/** Call before scanning the page so stylesheet changes are picked up */
const resetFontSizeRuleCache = () => {
  fontSizeRules = null;
};

/**
 * Returns the font-size value as authored for this element (inline style or the
 * last matching stylesheet rule, ignoring specificity), or null when it is inherited.
 */
export const getAuthoredFontSize = (element: Element): string | null => {
  const inline = (element as HTMLElement).style?.getPropertyValue('font-size');
  if (inline) return inline;

  // Same size as the parent: almost always inherited, skip the (costly) rule matching
  const parent = element.parentElement;
  if (parent && window.getComputedStyle(parent).fontSize === window.getComputedStyle(element).fontSize) {
    return null;
  }

  let authored: string | null = null;
  for (const rule of getFontSizeRules()) {
    try {
      if (element.matches(rule.selectorText)) authored = rule.style.getPropertyValue('font-size');
    } catch {
      // Selector not supported by matches()
    }
  }
  return authored;
};

const isAbsoluteFontSize = (value: string | null) => !!value && /\d(px|pt|pc|cm|mm|in|q)\b/i.test(value);

/**
 * Checks if an element has typography issues
 * 
 * This function examines an element for various typography issues:
 * - Inappropriate font weights
 * - Line height issues
 * - Spacing issues
 * - Use of absolute units (px) instead of relative units (rem, em)
 * 
 * The most important issue is reported first; absolute units are only reported
 * when nothing else is wrong.
 * 
 * @param element The element to check
 * @param computedStyle The computed style of the element
 * @returns An object with the issue category and details, or null if no issues
 */
export const checkTypographyIssues = (
  element: Element, 
  computedStyle: CSSStyleDeclaration,
  authoredFontSize: string | null = getAuthoredFontSize(element),
): { category: TypographyCategory, details: string } | null => {
  if (!element || !computedStyle) return null;

  const fontSizePx = parseFloat(computedStyle.fontSize) || 0;
  
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
  
  // Check for line height issues. The computed line-height is in px (or "normal",
  // which is about 1.2), so compare it relative to the font size.
  const lineHeight = computedStyle.lineHeight;
  const lineHeightPx = parseFloat(lineHeight);
  if (lineHeight !== 'normal' && fontSizePx > 0 && !Number.isNaN(lineHeightPx)) {
    const ratio = lineHeightPx / fontSizePx;
    if (ratio < 1.2 - 0.005) {
      return {
        category: 'typography-line-height-issue',
        details: `Line height (${lineHeight}, ${ratio.toFixed(2)}x the font size) is too tight for good readability, should be at least 1.2`
      };
    }
  }
  
  // Check for overly tight letter spacing in headings ("normal" is fine)
  if (category && category.startsWith('heading-') && fontSizePx > 0) {
    const letterSpacing = computedStyle.letterSpacing;
    const spacingPx = parseFloat(letterSpacing);
    if (letterSpacing !== 'normal' && !Number.isNaN(spacingPx) && spacingPx / fontSizePx < -0.05) {
      return {
        category: 'typography-spacing-issue',
        details: `Heading has tight letter spacing (${letterSpacing}), consider less negative letter spacing for better readability`
      };
    }
  }

  // Check for absolute units in the authored font size (computed values are always px)
  if (isAbsoluteFontSize(authoredFontSize)) {
    return {
      category: 'typography-absolute-units',
      details: `Font size uses absolute units (${authoredFontSize}) instead of relative units (rem/em)`
    };
  }
  
  return null;
};

/**
 * Gets all typography elements on the page
 * @returns Array of typography elements with their properties
 */
export const getAllTypographyElements = (): TypographyElement[] => {
  resetFontSizeRuleCache();
  const allElements = document.querySelectorAll('*');
  const typographyElements: TypographyElement[] = [];
  
  allElements.forEach(element => {
    const category = categorizeTypographyElement(element);
    if (category) {
      const computedStyle = window.getComputedStyle(element);
      
      // Check if this element has any text content
      if (element.textContent?.trim()) {
        // Inherited sizes follow the parent, so only an authored absolute size counts
        const authoredFontSize = getAuthoredFontSize(element);
        const usesRelativeUnits = !isAbsoluteFontSize(authoredFontSize);
        
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
        const issues = checkTypographyIssues(element, computedStyle, authoredFontSize);
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
  resetFontSizeRuleCache();
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
export const aggregateTypographyProperties = (
  typographyElements: TypographyElement[] = getAllTypographyElements(),
): AggregatedTypographyProperties => {
  
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