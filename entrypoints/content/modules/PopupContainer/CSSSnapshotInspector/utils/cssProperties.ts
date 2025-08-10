/**
 * Shared CSS property constants for consistent style processing
 */

/**
 * Essential CSS properties that are commonly used for baseline comparison
 * and default style generation. This ensures consistency between different
 * parts of the snapshot system.
 */
export const ESSENTIAL_CSS_PROPERTIES = [
  // Display and positioning
  'display',
  'position',
  'box-sizing',
  'visibility',
  
  // Dimensions
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  
  // Box model - margins
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'margin-block-start',
  'margin-block-end',
  'margin-inline-start',
  'margin-inline-end',
  
  // Box model - padding
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'padding-inline-start',
  
  // Positioning coordinates
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
  
  // Layout
  'float',
  'clear',
  'overflow',
  'overflow-x',
  'overflow-y',
  
  // Visual
  'opacity',
  'background-color',
  'color',
  
  // Borders
  'border',
  'border-width',
  'border-style',
  'border-color',
  'border-radius',
  
  // Typography
  'font-size',
  'font-weight',
  'font-style',
  'font-family',
  'text-decoration',
  'text-align',
  'vertical-align',
  
  // Lists
  'list-style-type'
] as const;

/**
 * Type for essential CSS property names
 */
export type EssentialCSSProperty = typeof ESSENTIAL_CSS_PROPERTIES[number];
