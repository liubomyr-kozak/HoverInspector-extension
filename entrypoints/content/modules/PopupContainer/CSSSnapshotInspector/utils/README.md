# CSS Snapshot Inspector Utilities

This directory contains utility functions for the CSS Snapshot Inspector module.

## Optimized Snapshot Creation

The CSS Snapshot Inspector now includes an advanced optimization approach that significantly reduces snapshot size by only storing styles that have changed from a baseline state. This optimization works in multiple layers:

1. **Property-based filtering**: Certain CSS properties are skipped entirely (defined in `DEFAULT_STYLES_TO_SKIP` in constants.ts)
2. **Value-based filtering**: Common default values like "none", "auto", "0px" are skipped (defined in `DEFAULT_VALUES_TO_SKIP` in constants.ts)
3. **Tag-specific default filtering**: Default styles for specific HTML tags are filtered out (implemented in defaultStyles.ts)
4. **Baseline comparison**: Each element is compared against a baseline node with essential properties to identify only the changes

### How It Works

The optimized snapshot creation process follows these steps:

1. For each DOM element, a baseline node is created with essential properties
2. The element's actual styles are compared against this baseline
3. Only styles that differ from the baseline are included in the snapshot
4. Elements with no style changes and no children with changes are excluded from the snapshot

This approach results in much smaller snapshots that focus only on the meaningful differences between elements.

```typescript
// Creating a baseline node for comparison
const createBaselineNode = (element: Element): { tag: string, styles: Record<string, string> } => {
  const tag = element.tagName.toLowerCase();
  const computedStyle = window.getComputedStyle(element);
  const baselineStyles: Record<string, string> = {};
  
  // Get standard styles for this tag
  const defaultStyles = getDefaultStylesForTag(tag);
  
  // Add only essential properties that differ from defaults
  for (const prop of essentialProperties) {
    const value = computedStyle.getPropertyValue(prop);
    
    // Skip empty, default, or standard values
    if (!value || isDefaultValue(value) || defaultStyles[prop] === value) continue;
    
    baselineStyles[prop] = value;
  }
  
  return { tag, styles: baselineStyles };
};
```

### Configuration Options

The snapshot creation process can be configured with these options:

- `maxElements`: Maximum number of elements to include in the snapshot
- `skipInvisible`: Whether to skip invisible elements
- `includeText`: Whether to include text content for leaf nodes
- `includeUnchanged`: Whether to include elements with no style changes (default: false)
- `styleFilter`: Custom filter function for styles

### Benefits

- **Significantly smaller snapshots**: By excluding unchanged styles, snapshots are much more compact
- **Faster processing**: Smaller snapshots are processed more quickly
- **Focused comparisons**: When comparing snapshots, only actual changes are highlighted
- **Better performance**: Reduced memory usage and faster rendering of comparison views

### Testing

You can test the optimized snapshot creation using the `test-optimized-snapshot.js` script, which:

1. Creates test elements with various styles
2. Generates both optimized and full snapshots
3. Compares the results to verify correct filtering and size reduction

Run the test in the browser console to see the size reduction and verify that the optimization is working correctly.