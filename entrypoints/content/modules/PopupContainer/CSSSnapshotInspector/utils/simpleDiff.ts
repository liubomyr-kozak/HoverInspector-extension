/**
 * Simple utilities for style comparison in snapshot diff
 */

import { DOMTreeNode } from "./domTreeBuilder";

export interface ElementDiffData {
  leftData: Record<string, any>;
  rightData: Record<string, any>;
  changedOnly?: boolean;
}

/**
 * Extract structured element data for comparison
 * Returns object-style data instead of formatted strings
 */
function extractElementData(node: DOMTreeNode | null): Record<string, any> {
  if (!node) return {};

  const data: Record<string, any> = {};

  // Add attributes as object
  if (node.attributes && Object.keys(node.attributes).length > 0) {
    data.attributes = { ...node.attributes };
  }

  // Add bounds as object
  if (node.bounds) {
    data.bounds = { ...node.bounds };
  }

  // Add classes as array
  if (node.classes && node.classes.length > 0) {
    data.classes = [...node.classes];
  }

  // Add inline styles as object
  if (node.inlineStyles && Object.keys(node.inlineStyles).length > 0) {
    data.inlineStyles = { ...node.inlineStyles };
  }

  // Add computed styles as object
  if (node.styles && Object.keys(node.styles).length > 0) {
    data.styles = { ...node.styles };
  }

  return data;
}

/**
 * Compare two values for equality (deep comparison for objects/arrays)
 */
function areValuesEqual(left: any, right: any): boolean {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if (typeof left !== typeof right) return false;

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    return left.every((item, index) => areValuesEqual(item, right[index]));
  }

  if (typeof left === "object" && typeof right === "object") {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every((key) => areValuesEqual(left[key], right[key]));
  }

  return false;
}

/**
 * Create comprehensive element comparison data
 * Compares: attributes, bounds, classes, inlineStyles, styles
 * Returns object-style data for better diff visualization
 */
export function createElementDiff(
  leftNode: DOMTreeNode | null,
  rightNode: DOMTreeNode | null,
  showAllData: boolean = false,
): ElementDiffData {
  // Function parameter logging removed - console.log removed\n

  const leftData = extractElementData(leftNode);
  const rightData = extractElementData(rightNode);

  if (showAllData) {
    // Return all data
    return {
      leftData,
      rightData,
      changedOnly: false,
    };
  }

  // Filter to only include changed properties
  const changedLeftData: Record<string, any> = {};
  const changedRightData: Record<string, any> = {};

  const allKeys = new Set([...Object.keys(leftData), ...Object.keys(rightData)]);

  let changedCount = 0;
  allKeys.forEach((key) => {
    const leftValue = leftData[key];
    const rightValue = rightData[key];

    if (!areValuesEqual(leftValue, rightValue)) {
      changedLeftData[key] = leftValue;
      changedRightData[key] = rightValue;
      changedCount++;
    }
  });

  return {
    leftData: changedLeftData,
    rightData: changedRightData,
    changedOnly: true,
  };
}
