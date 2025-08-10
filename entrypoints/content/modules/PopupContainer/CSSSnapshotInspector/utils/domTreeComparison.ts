/**
 * DOM Tree Comparison Logic
 * Separate logic for comparing two DOM trees and identifying differences
 * Works independently of rendering components
 */

import { DOMTreeNode } from './domTreeBuilder';

export interface TreeComparison {
  added: DOMTreeNode[];
  removed: DOMTreeNode[];
  modified: ModifiedElement[];
  unchanged: DOMTreeNode[];
}

export interface ModifiedElement {
  path: string;
  elementA: DOMTreeNode;
  elementB: DOMTreeNode;
  styleChanges: StyleChange[];
  attributeChanges: AttributeChange[];
  positionChanges: PositionChange[];
}

export interface StyleChange {
  property: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: 'added' | 'removed' | 'modified';
}

export interface AttributeChange {
  attribute: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: 'added' | 'removed' | 'modified';
}

export interface PositionChange {
  property: 'top' | 'left' | 'width' | 'height';
  oldValue: number;
  newValue: number;
  difference: number;
  percentage: number;
}

export interface ComparisonOptions {
  /** Ignore position changes smaller than this threshold (in pixels) */
  positionThreshold?: number;
  /** Ignore position changes smaller than this percentage */
  positionPercentageThreshold?: number;
  /** Properties to ignore during comparison */
  ignoreProperties?: string[];
  /** Compare attributes */
  compareAttributes?: boolean;
  /** Compare positions */
  comparePositions?: boolean;
}

/**
 * Compare two DOM trees and return detailed differences
 */
export function compareDOMTrees(
  treeA: DOMTreeNode,
  treeB: DOMTreeNode,
  options: ComparisonOptions = {}
): TreeComparison {
  const {
    positionThreshold = 1,
    positionPercentageThreshold = 1,
    ignoreProperties = [],
    compareAttributes = true,
    comparePositions = true,
  } = options;

  const result: TreeComparison = {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
  };

  // Create maps for efficient lookup
  const elementsA = createElementMap(treeA);
  const elementsB = createElementMap(treeB);
  
  const allPaths = new Set([...elementsA.keys(), ...elementsB.keys()]);

  allPaths.forEach((path) => {
    const elementA = elementsA.get(path);
    const elementB = elementsB.get(path);

    if (!elementA && elementB) {
      // Element only exists in tree B (added)
      result.added.push(elementB);
    } else if (elementA && !elementB) {
      // Element only exists in tree A (removed)
      result.removed.push(elementA);
    } else if (elementA && elementB) {
      // Element exists in both trees - check for modifications
      const comparison = compareElements(
        elementA,
        elementB,
        { 
          positionThreshold, 
          positionPercentageThreshold, 
          ignoreProperties,
          compareAttributes,
          comparePositions 
        }
      );

      if (comparison.hasChanges) {
        result.modified.push(comparison.modifiedElement);
      } else {
        result.unchanged.push(elementA);
      }
    }
  });

  return result;
}

/**
 * Create a map of path -> element for efficient lookup
 */
function createElementMap(tree: DOMTreeNode): Map<string, DOMTreeNode> {
  const map = new Map<string, DOMTreeNode>();

  function traverse(node: DOMTreeNode) {
    if ((node as any).pathString !== "") { // Skip root node
      map.set((node as any).pathString, node);
    }
    node.children.forEach(traverse);
  }

  traverse(tree);
  return map;
}

/**
 * Compare two individual elements
 */
function compareElements(
  elementA: DOMTreeNode,
  elementB: DOMTreeNode,
  options: Required<ComparisonOptions>
): {
  hasChanges: boolean;
  modifiedElement: ModifiedElement;
} {
  const styleChanges = compareStyles(elementA.styles, elementB.styles, options.ignoreProperties);
  const attributeChanges = options.compareAttributes 
    ? compareAttributes(elementA.attributes || {}, elementB.attributes || {})
    : [];
  const positionChanges = options.comparePositions
    ? comparePositions(elementA.bounds, elementB.bounds, options.positionThreshold, options.positionPercentageThreshold)
    : [];

  const hasChanges = styleChanges.length > 0 || attributeChanges.length > 0 || positionChanges.length > 0;

  return {
    hasChanges,
    modifiedElement: {
      path: (elementA as any).pathString || (elementA as any).path,
      elementA,
      elementB,
      styleChanges,
      attributeChanges,
      positionChanges,
    },
  };
}

/**
 * Compare styles between two elements
 */
function compareStyles(
  stylesA: Record<string, string>,
  stylesB: Record<string, string>,
  ignoreProperties: string[]
): StyleChange[] {
  const changes: StyleChange[] = [];
  const allProperties = new Set([...Object.keys(stylesA), ...Object.keys(stylesB)]);

  allProperties.forEach((property) => {
    // Skip ignored properties
    if (ignoreProperties.includes(property)) {
      return;
    }

    const valueA = stylesA[property];
    const valueB = stylesB[property];

    if (valueA === undefined && valueB !== undefined) {
      // Property added
      changes.push({
        property,
        oldValue: null,
        newValue: valueB,
        changeType: 'added',
      });
    } else if (valueA !== undefined && valueB === undefined) {
      // Property removed
      changes.push({
        property,
        oldValue: valueA,
        newValue: null,
        changeType: 'removed',
      });
    } else if (valueA !== valueB) {
      // Property modified
      changes.push({
        property,
        oldValue: valueA,
        newValue: valueB,
        changeType: 'modified',
      });
    }
  });

  return changes;
}

/**
 * Compare attributes between two elements
 */
function compareAttributes(
  attributesA: Record<string, string>,
  attributesB: Record<string, string>
): AttributeChange[] {
  const changes: AttributeChange[] = [];
  const allAttributes = new Set([...Object.keys(attributesA), ...Object.keys(attributesB)]);

  allAttributes.forEach((attribute) => {
    const valueA = attributesA[attribute];
    const valueB = attributesB[attribute];

    if (valueA === undefined && valueB !== undefined) {
      // Attribute added
      changes.push({
        attribute,
        oldValue: null,
        newValue: valueB,
        changeType: 'added',
      });
    } else if (valueA !== undefined && valueB === undefined) {
      // Attribute removed
      changes.push({
        attribute,
        oldValue: valueA,
        newValue: null,
        changeType: 'removed',
      });
    } else if (valueA !== valueB) {
      // Attribute modified
      changes.push({
        attribute,
        oldValue: valueA,
        newValue: valueB,
        changeType: 'modified',
      });
    }
  });

  return changes;
}

/**
 * Compare positions/bounds between two elements
 */
function comparePositions(
  boundsA?: { top: number; left: number; width: number; height: number },
  boundsB?: { top: number; left: number; width: number; height: number },
  threshold: number = 1,
  percentageThreshold: number = 1
): PositionChange[] {
  if (!boundsA || !boundsB) {
    return [];
  }

  const changes: PositionChange[] = [];
  const properties: Array<'top' | 'left' | 'width' | 'height'> = ['top', 'left', 'width', 'height'];

  properties.forEach((property) => {
    const oldValue = boundsA[property];
    const newValue = boundsB[property];
    const difference = newValue - oldValue;
    const percentage = oldValue !== 0 ? (difference / oldValue) * 100 : 0;

    // Check if change is significant enough to report
    if (Math.abs(difference) > threshold || Math.abs(percentage) > percentageThreshold) {
      changes.push({
        property,
        oldValue,
        newValue,
        difference,
        percentage,
      });
    }
  });

  return changes;
}

/**
 * Get summary statistics for a comparison
 */
export function getComparisonSummary(comparison: TreeComparison): {
  totalElements: number;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  unchangedCount: number;
  totalStyleChanges: number;
  totalAttributeChanges: number;
  totalPositionChanges: number;
} {
  const totalStyleChanges = comparison.modified.reduce(
    (sum, item) => sum + item.styleChanges.length, 
    0
  );
  
  const totalAttributeChanges = comparison.modified.reduce(
    (sum, item) => sum + item.attributeChanges.length, 
    0
  );
  
  const totalPositionChanges = comparison.modified.reduce(
    (sum, item) => sum + item.positionChanges.length, 
    0
  );

  return {
    totalElements: comparison.added.length + comparison.removed.length + 
                  comparison.modified.length + comparison.unchanged.length,
    addedCount: comparison.added.length,
    removedCount: comparison.removed.length,
    modifiedCount: comparison.modified.length,
    unchangedCount: comparison.unchanged.length,
    totalStyleChanges,
    totalAttributeChanges,
    totalPositionChanges,
  };
}

/**
 * Filter comparison results by change type
 */
export function filterComparison(
  comparison: TreeComparison,
  filters: {
    showAdded?: boolean;
    showRemoved?: boolean;
    showModified?: boolean;
    showUnchanged?: boolean;
    styleChangesOnly?: boolean;
    positionChangesOnly?: boolean;
  }
): TreeComparison {
  const result: TreeComparison = {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
  };

  if (filters.showAdded) {
    result.added = comparison.added;
  }

  if (filters.showRemoved) {
    result.removed = comparison.removed;
  }

  if (filters.showModified) {
    let modifiedElements = comparison.modified;
    
    if (filters.styleChangesOnly) {
      modifiedElements = modifiedElements.filter(item => item.styleChanges.length > 0);
    }
    
    if (filters.positionChangesOnly) {
      modifiedElements = modifiedElements.filter(item => item.positionChanges.length > 0);
    }
    
    result.modified = modifiedElements;
  }

  if (filters.showUnchanged) {
    result.unchanged = comparison.unchanged;
  }

  return result;
}
