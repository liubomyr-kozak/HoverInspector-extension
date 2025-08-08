/**
 * Hook for DOM tree comparison
 * Handles comparison logic between two snapshots
 * Separated from rendering for better maintainability
 */

import { useMemo } from 'react';
import { buildDOMTree, DOMTreeNode, ElementStyleData } from '../utils/domTreeBuilder';
import { 
  compareDOMTrees, 
  TreeComparison, 
  ComparisonOptions,
  getComparisonSummary,
  filterComparison 
} from '../utils/domTreeComparison';

interface UseTreeComparisonProps {
  /** First snapshot data */
  stylesA: Record<string, ElementStyleData>;
  /** Second snapshot data */
  stylesB: Record<string, ElementStyleData>;
  /** Optional position data for snapshot A */
  positionA?: Record<string, any>;
  /** Optional position data for snapshot B */
  positionB?: Record<string, any>;
  /** Comparison options */
  options?: ComparisonOptions;
  /** Return only diff nodes (added, removed, modified) */
  diffOnly?: boolean;
}

export interface TreeComparisonResult {
  /** Full comparison results */
  comparison: TreeComparison;
  /** Summary statistics */
  summary: ReturnType<typeof getComparisonSummary>;
  /** Function to filter results */
  filterResults: (filters: Parameters<typeof filterComparison>[1]) => TreeComparison;
  /** Original trees for reference */
  treeA: DOMTreeNode;
  treeB: DOMTreeNode;
}

/**
 * Hook for comparing two DOM trees
 * Provides comprehensive comparison data for diff views
 */
export function useTreeComparison({ 
  stylesA, 
  stylesB, 
  positionA, 
  positionB, 
  options = {},
  diffOnly = false
}: UseTreeComparisonProps): TreeComparisonResult {
  
  // Build both trees
  const { treeA, treeB } = useMemo(() => {
    const treeA = buildDOMTree(stylesA, positionA);
    const treeB = buildDOMTree(stylesB, positionB);
    return { treeA, treeB };
  }, [stylesA, stylesB, positionA, positionB]);

  // Perform comparison
  const comparison = useMemo(() => {
    const fullComparison = compareDOMTrees(treeA, treeB, options);
    
    // If diffOnly is true, filter out unchanged nodes
    if (diffOnly) {
      return filterComparison(fullComparison, {
        showAdded: true,
        showRemoved: true,
        showModified: true,
        showUnchanged: false
      });
    }
    
    return fullComparison;
  }, [treeA, treeB, options, diffOnly]);

  // Calculate summary
  const summary = useMemo(() => {
    return getComparisonSummary(comparison);
  }, [comparison]);

  // Filter function
  const filterResults = useMemo(() => {
    return (filters: Parameters<typeof filterComparison>[1]) => {
      return filterComparison(comparison, filters);
    };
  }, [comparison]);

  return {
    comparison,
    summary,
    filterResults,
    treeA,
    treeB,
  };
}

/**
 * Hook for getting comparison elements in a flat format
 * Useful for list views and element selection
 */
export function useComparisonElements({ 
  stylesA, 
  stylesB, 
  positionA, 
  positionB, 
  options = {},
  diffOnly = false
}: UseTreeComparisonProps) {
  const { comparison } = useTreeComparison({ 
    stylesA, 
    stylesB, 
    positionA, 
    positionB, 
    options,
    diffOnly
  });

  const elements = useMemo(() => {
    const result: Array<{
      path: string;
      element: DOMTreeNode;
      changeType: 'added' | 'removed' | 'modified' | 'unchanged';
      changes?: {
        styleChanges: number;
        attributeChanges: number;
        positionChanges: number;
      };
    }> = [];

    // Add added elements
    comparison.added.forEach(element => {
      result.push({
        path: element.path,
        element,
        changeType: 'added',
      });
    });

    // Add removed elements
    comparison.removed.forEach(element => {
      result.push({
        path: element.path,
        element,
        changeType: 'removed',
      });
    });

    // Add modified elements
    comparison.modified.forEach(modified => {
      result.push({
        path: modified.path,
        element: modified.elementB, // Use newer version
        changeType: 'modified',
        changes: {
          styleChanges: modified.styleChanges.length,
          attributeChanges: modified.attributeChanges.length,
          positionChanges: modified.positionChanges.length,
        },
      });
    });

    // Add unchanged elements (optional, usually filtered out)
    comparison.unchanged.forEach(element => {
      result.push({
        path: element.path,
        element,
        changeType: 'unchanged',
      });
    });

    // Sort by path for consistent ordering
    result.sort((a, b) => a.path.localeCompare(b.path));

    return result;
  }, [comparison]);

  return elements;
}
