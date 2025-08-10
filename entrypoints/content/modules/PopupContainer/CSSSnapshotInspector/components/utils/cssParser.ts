/**
 * CSS Parser utilities and types for DiffPopup component
 */

export interface CSSDiff {
  selector: string;
  added: Record<string, string>;
  removed: Record<string, string>;
  modified: Record<string, { old: string; new: string }>;
}

/**
 * Convert style comparison result to CSSDiff format
 */
export function convertStyleChangesToCSSDiff(
  styleChanges: Record<string, {
    left?: string;
    right?: string;
    changed: boolean;
    changeType: 'added' | 'removed' | 'modified';
  }>,
  selector: string = 'Element'
): CSSDiff {
  const diff: CSSDiff = {
    selector,
    added: {},
    removed: {},
    modified: {}
  };

  Object.entries(styleChanges).forEach(([property, change]) => {
    if (!change.changed) return;

    switch (change.changeType) {
      case 'added':
        if (change.right) {
          diff.added[property] = change.right;
        }
        break;
      case 'removed':
        if (change.left) {
          diff.removed[property] = change.left;
        }
        break;
      case 'modified':
        if (change.left && change.right) {
          diff.modified[property] = {
            old: change.left,
            new: change.right
          };
        }
        break;
    }
  });

  return diff;
}

// CSS Property Categories for organized display
const CSS_CATEGORIES = {
  base: ['background-color', 'display', 'cursor', 'appearance'],
  size: ['block-size', 'inline-size', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'min-block-size', 'max-block-size', 'min-inline-size', 'max-inline-size'],
  border: [
    'border-top-color', 'border-top-style', 'border-top-width',
    'border-right-color', 'border-right-style', 'border-right-width',
    'border-bottom-color', 'border-bottom-style', 'border-bottom-width',
    'border-left-color', 'border-left-style', 'border-left-width',
    'border-block-start-color', 'border-block-start-style', 'border-block-start-width',
    'border-block-end-color', 'border-block-end-style', 'border-block-end-width',
    'border-inline-start-color', 'border-inline-start-style', 'border-inline-start-width',
    'border-inline-end-color', 'border-inline-end-style', 'border-inline-end-width',
    'border-start-start-radius', 'border-start-end-radius',
    'border-end-start-radius', 'border-end-end-radius',
    'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius'
  ],
  margin: [
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'margin-block-start', 'margin-block-end',
    'margin-inline-start', 'margin-inline-end'
  ],
  padding: [
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'padding-block-start', 'padding-block-end',
    'padding-inline-start', 'padding-inline-end'
  ],
  font: ['font-family', 'font-size', 'line-height', 'font-weight', 'font-style'],
  colors: ['color', 'caret-color', 'outline-color', 'text-decoration', 'text-decoration-color', 'text-emphasis-color'],
  list: ['list-style-type'],
  overflow: ['overflow-x', 'overflow-y', 'overflow-inline', 'overflow-block'],
  transform: ['perspective-origin', 'transform-origin'],
  misc: ['tab-size', 'text-size-adjust'],
  webkit: ['-webkit-locale', '-webkit-tap-highlight-color', '-webkit-text-fill-color', '-webkit-text-stroke-color']
};

/**
 * Categorize CSS properties for organized display
 */
const categorizeProperties = (properties: Record<string, string>): Record<string, Record<string, string>> => {
  const categorized: Record<string, Record<string, string>> = {};
  const used = new Set<string>();

  // Initialize categories
  Object.keys(CSS_CATEGORIES).forEach(category => {
    categorized[category] = {};
  });

  // Categorize known properties
  Object.entries(CSS_CATEGORIES).forEach(([category, props]) => {
    props.forEach(prop => {
      if (properties[prop] !== undefined) {
        categorized[category][prop] = properties[prop];
        used.add(prop);
      }
    });
  });

  // Add uncategorized properties to misc
  Object.entries(properties).forEach(([prop, value]) => {
    if (!used.has(prop)) {
      categorized.misc[prop] = value;
    }
  });

  // Remove empty categories
  Object.keys(categorized).forEach(category => {
    if (Object.keys(categorized[category]).length === 0) {
      delete categorized[category];
    }
  });

  return categorized;
};

/**
 * Format CSS properties with organized categories
 */
const formatCategorizedStyles = (styles: Record<string, string>): string => {
  const categorized = categorizeProperties(styles);
  const sections: string[] = [];

  const categoryLabels = {
    base: 'Base',
    size: 'Size', 
    border: 'Border',
    margin: 'Margin',
    padding: 'Padding',
    font: 'Font',
    colors: 'Colors',
    list: 'List',
    overflow: 'Overflow',
    transform: 'Transform',
    misc: 'Misc',
    webkit: 'WebKit'
  };

  Object.entries(categorized).forEach(([category, props]) => {
    if (Object.keys(props).length > 0) {
      sections.push(`    // ${categoryLabels[category] || category}`);
      Object.entries(props).forEach(([prop, value]) => {
        sections.push(`    ${prop}: ${value};`);
      });
      sections.push('');
    }
  });

  return sections.join('\n').trim();
};

/**
 * Convert ElementDiffData to CSSDiff format
 */
export function convertElementDiffToCSSDiff(
  leftData: Record<string, any>,
  rightData: Record<string, any>,
  selector: string = 'Element'
): CSSDiff {
  const diff: CSSDiff = {
    selector,
    added: {},
    removed: {},
    modified: {}
  };

  const allKeys = new Set([...Object.keys(leftData), ...Object.keys(rightData)]);

  allKeys.forEach((key) => {
    const leftValue = leftData[key];
    const rightValue = rightData[key];

    // Convert values to strings for CSS display with proper object handling
    const formatValue = (value: any): string | null => {
      if (value === undefined || value === null) return null;
      
      if (typeof value === 'object' && value !== null) {
        if (key === 'attributes') {
          // Format attributes with proper indentation
          const attrs = Object.entries(value)
            .map(([attr, val]) => `    ${attr}: ${val};`)
            .join('\n');
          return attrs ? `\n${attrs}\n  ` : '';
        } else if (key === 'bounds') {
          // Format bounds with proper indentation  
          const bounds = Object.entries(value)
            .map(([prop, val]) => `    ${prop}: ${val}px;`)
            .join('\n');
          return bounds ? `\n${bounds}\n  ` : '';
        } else if (key === 'styles') {
          // Format styles with categories and proper indentation
          const formattedStyles = formatCategorizedStyles(value);
          return formattedStyles ? `\n${formattedStyles}\n  ` : '';
        } else if (key === 'classes') {
          // Format classes as a simple list
          if (Array.isArray(value)) {
            return value.join('; ');
          } else if (typeof value === 'object') {
            return Object.keys(value).join('; ');
          }
        } else {
          // For other objects, format as key-value pairs
          return Object.entries(value)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ');
        }
      }
      
      return String(value);
    };

    const leftStr = formatValue(leftValue);
    const rightStr = formatValue(rightValue);

    if (leftStr === rightStr) return; // No change

    if (!leftStr && rightStr) {
      // Added
      diff.added[key] = rightStr;
    } else if (leftStr && !rightStr) {
      // Removed
      diff.removed[key] = leftStr;
    } else if (leftStr && rightStr) {
      // Modified
      diff.modified[key] = {
        old: leftStr,
        new: rightStr
      };
    }
  });

  return diff;
}