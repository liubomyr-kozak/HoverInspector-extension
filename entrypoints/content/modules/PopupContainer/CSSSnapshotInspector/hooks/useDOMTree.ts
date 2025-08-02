/**
 * Hook for building single DOM tree structure
 * Used in Snapshot Details view for displaying single snapshot
 * Separated from comparison logic for clarity
 */

import { useMemo } from 'react';
import { buildDOMTree, DOMTreeNode, ElementStyleData } from '../utils/domTreeBuilder';

interface UseDOMTreeProps {
  /** Snapshot styles data */
  stylesData: Record<string, ElementStyleData>;
  /** Optional position/bounds data */
  positionData?: Record<string, any>;
}

export interface DOMTreeHookResult {
  /** Root node of the DOM tree */
  tree: DOMTreeNode;
  /** Flat array of all elements (excluding root) */
  allElements: DOMTreeNode[];
  /** Statistics about the tree */
  statistics: {
    totalElements: number;
    totalLevels: number;
    elementsWithIds: number;
    elementsWithClasses: number;
  };
}

/**
 * Hook for building and managing DOM tree from snapshot data
 * Provides clean tree structure for single snapshot display
 */
export function useDOMTree({ stylesData, positionData }: UseDOMTreeProps): DOMTreeHookResult {
  const tree = useMemo(() => {
    if (!stylesData || Object.keys(stylesData).length === 0) {
      return createEmptyTree();
    }

    return buildDOMTree(stylesData, positionData);
  }, [stylesData, positionData]);

  const allElements = useMemo(() => {
    return flattenTreeExcludingRoot(tree);
  }, [tree]);

  const statistics = useMemo(() => {
    return calculateTreeStatistics(allElements);
  }, [allElements]);

  return {
    tree,
    allElements,
    statistics,
  };
}

/**
 * Create empty tree when no data is available
 */
function createEmptyTree(): DOMTreeNode {
  return {
    path: "",
    name: "Root",
    tagName: "root",
    id: null,
    classes: [],
    styles: {},
    children: [],
    level: 0,
  };
}

/**
 * Flatten tree into array, excluding root node
 */
function flattenTreeExcludingRoot(tree: DOMTreeNode): DOMTreeNode[] {
  const elements: DOMTreeNode[] = [];

  function traverse(node: DOMTreeNode) {
    // Skip root node (empty path)
    if (node.path !== "") {
      elements.push(node);
    }
    
    node.children.forEach(traverse);
  }

  traverse(tree);
  return elements;
}

/**
 * Calculate statistics about the tree
 */
function calculateTreeStatistics(elements: DOMTreeNode[]): {
  totalElements: number;
  totalLevels: number;
  elementsWithIds: number;
  elementsWithClasses: number;
} {
  if (elements.length === 0) {
    return {
      totalElements: 0,
      totalLevels: 0,
      elementsWithIds: 0,
      elementsWithClasses: 0,
    };
  }

  const totalElements = elements.length;
  const totalLevels = Math.max(...elements.map(el => el.level));
  const elementsWithIds = elements.filter(el => el.id !== null && el.id !== undefined).length;
  const elementsWithClasses = elements.filter(el => el.classes.length > 0).length;

  return {
    totalElements,
    totalLevels,
    elementsWithIds,
    elementsWithClasses,
  };
}
