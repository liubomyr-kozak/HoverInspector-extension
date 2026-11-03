/**
 * CSS parsing utilities
 * 
 * Declarative functions for processing and parsing CSS text.
 * Used to extract CSS properties from generated code.
 */

/**
 * Parses CSS text and extracts its properties
 * 
 * Declarative function that splits CSS text into separate properties.
 * Handles the standard CSS format with "property: value;" rules
 * 
 * @param cssText - CSS text to parse
 * @returns Object with CSS properties as keys and values
 * 
 * @example
 * parseCSS('color: red; font-size: 14px;')
 * // => { color: 'red', 'font-size': '14px' }
 */
export const parseCSS = (cssText: string): Record<string, string> => {
    const properties: Record<string, string> = {};
    
    if (!cssText) {
        return properties;
    }

    // Extract CSS properties from the generated CSS text
    const cssLines = cssText.split("\n");
    
    for (const line of cssLines) {
        const trimmed = line.trim();
        
        // Check whether this is a valid CSS property
        if (trimmed && trimmed.includes(":") && trimmed.endsWith(";")) {
            const colonIndex = trimmed.indexOf(":");
            const property = trimmed.substring(0, colonIndex).trim();
            const value = trimmed.substring(colonIndex + 1, trimmed.length - 1).trim();
            
            if (property && value) {
                properties[property] = value;
            }
        }
    }
    
    return properties;
};

/**
 * Merges inline styles with class properties
 * 
 * Declarative function that merges CSS properties from different sources.
 * Inline styles take priority over class properties.
 * 
 * @param inlineStyles - Object with inline styles
 * @param classProperties - Object with class properties
 * @returns Merged properties object
 */
export const mergeStyleProperties = (
    inlineStyles: Record<string, string> | undefined,
    classProperties: Record<string, string>
): Record<string, string> => {
    return { ...classProperties, ...(inlineStyles || {}) };
};