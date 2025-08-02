/**
 * Utility for handling default tag-specific styles
 */

/**
 * Gets the default styles for a specific HTML tag
 * This is used to avoid storing default styles in snapshots
 */
export const getDefaultStylesForTag = (tagName: string): Record<string, string> => {
  // Convert tag name to lowercase for consistency
  const tag = tagName.toLowerCase();
  
  // Common default styles for all elements
  const commonDefaults: Record<string, string> = {
    // Box model defaults
    "margin": "0px",
    "padding": "0px",
    "border": "0px none",
    // Display defaults
    "display": "block",
  };
  
  // Tag-specific default styles
  const tagDefaults: Record<string, Record<string, string>> = {
    // Block elements
    "div": {
      "display": "block",
    },
    "p": {
      "display": "block",
      "margin-block-start": "1em",
      "margin-block-end": "1em",
      "margin-inline-start": "0px",
      "margin-inline-end": "0px",
    },
    "h1": {
      "display": "block",
      "font-size": "2em",
      "margin-block-start": "0.67em",
      "margin-block-end": "0.67em",
      "margin-inline-start": "0px",
      "margin-inline-end": "0px",
      "font-weight": "bold",
    },
    "h2": {
      "display": "block",
      "font-size": "1.5em",
      "margin-block-start": "0.83em",
      "margin-block-end": "0.83em",
      "margin-inline-start": "0px",
      "margin-inline-end": "0px",
      "font-weight": "bold",
    },
    "h3": {
      "display": "block",
      "font-size": "1.17em",
      "margin-block-start": "1em",
      "margin-block-end": "1em",
      "margin-inline-start": "0px",
      "margin-inline-end": "0px",
      "font-weight": "bold",
    },
    "h4": {
      "display": "block",
      "margin-block-start": "1.33em",
      "margin-block-end": "1.33em",
      "margin-inline-start": "0px",
      "margin-inline-end": "0px",
      "font-weight": "bold",
    },
    "h5": {
      "display": "block",
      "font-size": "0.83em",
      "margin-block-start": "1.67em",
      "margin-block-end": "1.67em",
      "margin-inline-start": "0px",
      "margin-inline-end": "0px",
      "font-weight": "bold",
    },
    "h6": {
      "display": "block",
      "font-size": "0.67em",
      "margin-block-start": "2.33em",
      "margin-block-end": "2.33em",
      "margin-inline-start": "0px",
      "margin-inline-end": "0px",
      "font-weight": "bold",
    },
    // Inline elements
    "span": {
      "display": "inline",
    },
    "a": {
      "display": "inline",
      "color": "-webkit-link",
      "cursor": "pointer",
      "text-decoration": "underline",
    },
    "strong": {
      "display": "inline",
      "font-weight": "bold",
    },
    "em": {
      "display": "inline",
      "font-style": "italic",
    },
    // Form elements
    "input": {
      "display": "inline-block",
      "text-rendering": "auto",
      "letter-spacing": "normal",
      "word-spacing": "normal",
      "text-transform": "none",
      "text-indent": "0px",
      "text-shadow": "none",
      "text-align": "start",
    },
    "button": {
      "display": "inline-block",
      "text-align": "center",
      "align-items": "flex-start",
    },
    // List elements
    "ul": {
      "display": "block",
      "list-style-type": "disc",
      "margin-block-start": "1em",
      "margin-block-end": "1em",
      "margin-inline-start": "0px",
      "margin-inline-end": "0px",
      "padding-inline-start": "40px",
    },
    "ol": {
      "display": "block",
      "list-style-type": "decimal",
      "margin-block-start": "1em",
      "margin-block-end": "1em",
      "margin-inline-start": "0px",
      "margin-inline-end": "0px",
      "padding-inline-start": "40px",
    },
    "li": {
      "display": "list-item",
      "text-align": "match-parent",
    },
    // Table elements
    "table": {
      "display": "table",
      "border-collapse": "separate",
      "border-spacing": "2px",
      "border-color": "gray",
    },
    "tr": {
      "display": "table-row",
      "vertical-align": "inherit",
      "border-color": "inherit",
    },
    "td": {
      "display": "table-cell",
      "vertical-align": "inherit",
    },
    "th": {
      "display": "table-cell",
      "vertical-align": "inherit",
      "font-weight": "bold",
      "text-align": "center",
    },
  };
  
  // Return tag-specific defaults or common defaults for unknown tags
  return {
    ...commonDefaults,
    ...(tagDefaults[tag] || {}),
  };
};

/**
 * Checks if a style property has the default value for a specific tag
 */
export const isDefaultStyleForTag = (
  tagName: string,
  property: string,
  value: string
): boolean => {
  const defaultStyles = getDefaultStylesForTag(tagName);
  return defaultStyles[property] === value;
};