/**
 * Style comparison utilities for snapshot comparison
 * Used to pre-calculate style differences in handleLineClick
 */

import { DOMTreeNode } from './domTreeBuilder';
import { ElementSideData } from '../components/SnapshotViewer/components/ElementDetails/ElementDiff';

export interface StyleComparisonResult {
  // Identity changes
  identityChanges: {
    tagName: { left?: string; right?: string; changed: boolean };
    id: { left?: string | null; right?: string | null; changed: boolean };
    classes: { left: string; right: string; changed: boolean };
  };
  
  // Bounds changes
  boundsChanges: {
    top: { left?: number; right?: number; changed: boolean };
    left: { left?: number; right?: number; changed: boolean };
    width: { left?: number; right?: number; changed: boolean };
    height: { left?: number; right?: number; changed: boolean };
    hasChanges: boolean;
  };
  
  // Attribute changes
  attributeChanges: {
    [key: string]: {
      left?: string;
      right?: string;
      changed: boolean;
      changeType: 'added' | 'removed' | 'modified';
    };
  };
  
  // Style changes
  styleChanges: {
    [key: string]: {
      left?: string;
      right?: string;
      changed: boolean;
      changeType: 'added' | 'removed' | 'modified';
    };
  };
  
  // Summary
  summary: {
    hasIdentityChanges: boolean;
    hasBoundsChanges: boolean;
    hasAttributeChanges: boolean;
    hasStyleChanges: boolean;
    totalChanges: number;
  };
}

/**
 * Compare two DOM nodes and calculate all style changes
 */
export function calculateStyleChanges(
  leftNode: DOMTreeNode | null,
  rightNode: DOMTreeNode | null
): StyleComparisonResult {
  
  // Identity changes
  const leftTagName = leftNode?.tagName || '';
  const rightTagName = rightNode?.tagName || '';
  const tagNameChanged = leftTagName !== rightTagName;
  
  const leftId = leftNode?.id || null;
  const rightId = rightNode?.id || null;
  const idChanged = leftId !== rightId;
  
  const leftClasses = leftNode?.classes ? [...leftNode.classes].sort().join(' ') : '';
  const rightClasses = rightNode?.classes ? [...rightNode.classes].sort().join(' ') : '';
  const classesChanged = leftClasses !== rightClasses;
  
  const identityChanges = {
    tagName: { left: leftTagName, right: rightTagName, changed: tagNameChanged },
    id: { left: leftId, right: rightId, changed: idChanged },
    classes: { left: leftClasses, right: rightClasses, changed: classesChanged },
  };
  
  // Bounds changes
  const leftBounds = leftNode?.bounds;
  const rightBounds = rightNode?.bounds;
  const topChanged = leftBounds?.top !== rightBounds?.top;
  const leftChanged = leftBounds?.left !== rightBounds?.left;
  const widthChanged = leftBounds?.width !== rightBounds?.width;
  const heightChanged = leftBounds?.height !== rightBounds?.height;
  const hasBoundsChanges = topChanged || leftChanged || widthChanged || heightChanged;
  
  const boundsChanges = {
    top: { left: leftBounds?.top, right: rightBounds?.top, changed: topChanged },
    left: { left: leftBounds?.left, right: rightBounds?.left, changed: leftChanged },
    width: { left: leftBounds?.width, right: rightBounds?.width, changed: widthChanged },
    height: { left: leftBounds?.height, right: rightBounds?.height, changed: heightChanged },
    hasChanges: hasBoundsChanges,
  };
  
  // Attribute changes
  const leftAttrs = leftNode?.attributes || {};
  const rightAttrs = rightNode?.attributes || {};
  const allAttrKeys = new Set([...Object.keys(leftAttrs), ...Object.keys(rightAttrs)]);
  const attributeChanges: StyleComparisonResult['attributeChanges'] = {};
  
  allAttrKeys.forEach(key => {
    const leftValue = leftAttrs[key];
    const rightValue = rightAttrs[key];
    const changed = leftValue !== rightValue;
    
    let changeType: 'added' | 'removed' | 'modified' = 'modified';
    if (leftValue === undefined && rightValue !== undefined) {
      changeType = 'added';
    } else if (leftValue !== undefined && rightValue === undefined) {
      changeType = 'removed';
    }
    
    attributeChanges[key] = {
      left: leftValue,
      right: rightValue,
      changed,
      changeType,
    };
  });
  
  // Style changes
  const leftStyles = leftNode?.styles || {};
  const rightStyles = rightNode?.styles || {};
  const allStyleKeys = new Set([...Object.keys(leftStyles), ...Object.keys(rightStyles)]);
  const styleChanges: StyleComparisonResult['styleChanges'] = {};
  
  allStyleKeys.forEach(key => {
    const leftValue = leftStyles[key];
    const rightValue = rightStyles[key];
    const changed = leftValue !== rightValue;
    
    let changeType: 'added' | 'removed' | 'modified' = 'modified';
    if (leftValue === undefined && rightValue !== undefined) {
      changeType = 'added';
    } else if (leftValue !== undefined && rightValue === undefined) {
      changeType = 'removed';
    }
    
    styleChanges[key] = {
      left: leftValue,
      right: rightValue,
      changed,
      changeType,
    };
  });
  
  // Summary
  const hasIdentityChanges = tagNameChanged || idChanged || classesChanged;
  const hasAttributeChanges = Object.values(attributeChanges).some(attr => attr.changed);
  const hasStyleChanges = Object.values(styleChanges).some(style => style.changed);
  const totalChanges = 
    (hasIdentityChanges ? 1 : 0) +
    (hasBoundsChanges ? 1 : 0) +
    Object.values(attributeChanges).filter(attr => attr.changed).length +
    Object.values(styleChanges).filter(style => style.changed).length;
  
  const summary = {
    hasIdentityChanges,
    hasBoundsChanges,
    hasAttributeChanges,
    hasStyleChanges,
    totalChanges,
  };
  
  return {
    identityChanges,
    boundsChanges,
    attributeChanges,
    styleChanges,
    summary,
  };
}

/**
 * Convert DOMTreeNode to ElementSideData format
 */
export function convertToElementSideData(node: DOMTreeNode | null): ElementSideData | null {
  if (!node) return null;
  
  return {
    tagName: node.tagName,
    id: node.id || null,
    classes: node.classes ? [...node.classes] : [],
    attributes: node.attributes || {},
    bounds: node.bounds,
    inlineStyles: node.inlineStyles || {},
    styles: node.styles || {},
  };
}

/**
 * Get filtered style changes (only changed properties)
 */
export function getChangedStylesOnly(comparison: StyleComparisonResult) {
  return {
    identityChanges: Object.fromEntries(
      Object.entries(comparison.identityChanges).filter(([_, value]) => value.changed)
    ),
    boundsChanges: Object.fromEntries(
      Object.entries(comparison.boundsChanges).filter(([key, value]) => {
        return key !== 'hasChanges' && typeof value === 'object' && value.changed;
      })
    ),
    attributeChanges: Object.fromEntries(
      Object.entries(comparison.attributeChanges).filter(([_, value]) => value.changed)
    ),
    styleChanges: Object.fromEntries(
      Object.entries(comparison.styleChanges).filter(([_, value]) => value.changed)
    ),
  };
}
