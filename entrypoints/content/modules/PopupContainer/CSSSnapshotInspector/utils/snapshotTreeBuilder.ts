/**
 * Utilities for building and working with snapshot trees
 */
import { SnapshotNode, SnapshotTreeResult, shouldSkipProperty } from "../types";
import { MAX_SNAPSHOT_ELEMENTS } from "../constants";

/**
 * Generates a hash from path array for stable node IDs
 * @param path Array of path segments
 * @returns A stable node ID
 */
export function hashPath(path: (string | number)[]): string {
  const str = path.join('/');
  let hash = 0, i = 0, chr;
  while ((chr = str.charCodeAt(i++))) {
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return `n-${Math.abs(hash)}`;
}

/**
 * Returns index of node among siblings with same tag
 * @param node Element to get index for
 * @returns Index of the node among siblings with the same tag
 */
export function getNodeIndex(node: Element): number {
  let i = 0;
  let prev = node.previousElementSibling;
  while (prev) {
    if (prev.tagName === node.tagName) i++;
    prev = prev.previousElementSibling;
  }
  return i;
}

/**
 * Helper function to check if an element is within an SVG tree
 * @param element Element to check
 * @returns True if the element is within an SVG tree
 */
function isWithinSvg(element: Element): boolean {
  let current = element;
  
  // Check if the element itself is an SVG
  if (current.tagName === 'SVG') {
    return true;
  }
  
  // Check parent chain until we find an SVG or reach the root
  while (current.parentElement) {
    current = current.parentElement;
    if (current.tagName === 'SVG') {
      return true;
    }
  }
  
  return false;
}

/**
 * Helper function to check if an element should be skipped completely
 * @param element Element to check
 * @returns True if the element should be skipped
 */
function shouldSkipElement(element: Element): boolean {
  const tag = element.tagName;
  
  // Skip meta, link, style, and script tags
  if (['META', 'LINK', 'STYLE', 'SCRIPT'].includes(tag)) {
    return true;
  }
  
  // Skip complex SVG child elements to reduce snapshot size
  if (isWithinSvg(element) && ['PATH', 'CIRCLE', 'RECT', 'LINE', 'POLYLINE', 'POLYGON', 'ELLIPSE'].includes(tag)) {
    return true;
  }
  
  return false;
}

/**
 * Creates a minimal skipped node for excluded elements
 * @param tag The tag name of the skipped element
 * @returns A minimal SnapshotNode
 */
function createSkippedNode(tag: string): SnapshotNode {
  return {
    nodeId: `skipped-${tag.toLowerCase()}-${Date.now()}-${Math.random()}`,
    path: [],
    tag,
    classList: [],
    attributes: {},
    boundingBox: { top: 0, left: 0, width: 0, height: 0 },
    styles: {},
    children: []
  };
}

/**
 * Builds a snapshot tree from a DOM element with performance optimizations
 * The function captures element properties and styles, filtering out unnecessary CSS properties
 * and limiting the number of elements processed to maintain performance.
 * 
 * @param root Root element to start building from
 * @param getComputedStyleFn Function to get computed styles (defaults to window.getComputedStyle)
 * @param maxElements Maximum number of elements to process (defaults to MAX_SNAPSHOT_ELEMENTS)
 * @returns Object containing the tree and a node map for quick lookups
 */
export function buildSnapshotTree(
  root: Element,
  getComputedStyleFn: (el: Element) => CSSStyleDeclaration = window.getComputedStyle,
  maxElements: number = MAX_SNAPSHOT_ELEMENTS
): SnapshotTreeResult {
  const nodeMap = new WeakMap<Node, string>();
  let processedElements = 0;

  function recurse(node: Element, path: (string | number)[] = []): SnapshotNode {
    // Check if we've reached the maximum number of elements
    if (processedElements >= maxElements) {
      return createSkippedNode(node.tagName);
    }
    
    const tag = node.tagName;
    
    // Skip certain elements completely
    if (shouldSkipElement(node)) {
      return createSkippedNode(tag);
    }
    
    processedElements++;
    
    const index = getNodeIndex(node);
    const currentPath = [...path, `${tag}:${index}`];

    const nodeId = hashPath(currentPath);
    nodeMap.set(node, nodeId);

    // Get element ID if available
    const id = node.id || undefined;

    // Get class list
    const classList = Array.from(node.classList);

    // Get all attributes (excluding id and class which are handled separately)
    const attributes: Record<string, string> = {};
    for (const attr of node.attributes) {
      if (attr.name !== 'id' && attr.name !== 'class') {
        attributes[attr.name] = attr.value;
      }
    }

    // Get bounding box
    const rect = node.getBoundingClientRect();
    const boundingBox = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };

    // Get computed styles with optimized filtering
    const computedStyle = getComputedStyleFn(node);
    const styles: Record<string, string> = {};
    
    // More efficient style collection using for loop
    for (let i = 0; i < computedStyle.length; i++) {
      const prop = computedStyle[i];
      
      // Skip properties that should be filtered out
      if (shouldSkipProperty(prop)) {
        continue;
      }
      
      styles[prop] = computedStyle.getPropertyValue(prop);
    }

    // Get text content for leaf nodes
    const textContent =
      node.children.length === 0 ? (node.textContent || "").trim() : undefined;

    // Process children with early termination if we hit the limit
    const children: SnapshotNode[] = [];
    for (const child of Array.from(node.children)) {
      if (processedElements >= maxElements) {
        break;
      }
      children.push(recurse(child as Element, currentPath));
    }

    return {
      nodeId,
      path: currentPath,
      tag,
      id,
      classList,
      attributes,
      boundingBox,
      styles,
      textContent,
      children
    };
  }

  return {
    tree: recurse(root),
    nodeMap
  };
}

/**
 * Converts a SnapshotNode tree to the existing CSSSnapshot format with optimizations
 * This allows integration with the existing snapshot system
 * 
 * @param snapshotNode The snapshot node tree
 * @returns Object with filtered styles in the format expected by CSSSnapshot
 */
export function convertSnapshotNodeToCSSSnapshot(snapshotNode: SnapshotNode): Record<string, any> {
  const result: Record<string, any> = {};
  
  function processNode(node: SnapshotNode, path = ''): void {
    // Skip nodes that were marked as skipped
    if (node.nodeId.startsWith('skipped-')) {
      return;
    }
    
    const currentPath = path || node.nodeId;
    
    // Convert to ElementStyle format
    result[currentPath] = {
      tagName: node.tag,
      id: node.id || null,
      classes: node.classList,
      styles: node.styles
    };
    
    // Process children
    for (const child of node.children) {
      processNode(child, `${currentPath} > ${child.nodeId}`);
    }
  }
  
  processNode(snapshotNode);
  return result;
}

/**
 * Compares two snapshot nodes and returns differences with performance optimizations
 * @param nodeA First snapshot node
 * @param nodeB Second snapshot node
 * @returns Object containing differences between the nodes
 */
export function compareSnapshotNodes(
  nodeA: SnapshotNode,
  nodeB: SnapshotNode
): {
  styleChanges: Record<string, { property: string; valueA: string; valueB: string }>;
  addedNodes: SnapshotNode[];
  removedNodes: SnapshotNode[];
  changedNodes: { nodeA: SnapshotNode; nodeB: SnapshotNode }[];
} {
  // Skip comparison for nodes that were marked as skipped
  if (nodeA.nodeId.startsWith('skipped-') || nodeB.nodeId.startsWith('skipped-')) {
    return {
      styleChanges: {},
      addedNodes: [],
      removedNodes: [],
      changedNodes: [],
    };
  }

  const result = {
    styleChanges: {} as Record<string, { property: string; valueA: string; valueB: string }>,
    addedNodes: [] as SnapshotNode[],
    removedNodes: [] as SnapshotNode[],
    changedNodes: [] as { nodeA: SnapshotNode; nodeB: SnapshotNode }[],
  };

  // Compare styles of the current nodes
  const styleChanges: Record<string, { property: string; valueA: string; valueB: string }> = {};
  
  // Get all unique style properties
  const allProperties = new Set([
    ...Object.keys(nodeA.styles),
    ...Object.keys(nodeB.styles),
  ]);
  
  // Compare each property
  for (const property of allProperties) {
    const valueA = nodeA.styles[property];
    const valueB = nodeB.styles[property];
    
    if (valueA !== valueB) {
      styleChanges[property] = {
        property,
        valueA: valueA || '',
        valueB: valueB || '',
      };
    }
  }
  
  // If there are style changes, add to result
  if (Object.keys(styleChanges).length > 0) {
    result.styleChanges = styleChanges;
    result.changedNodes.push({ nodeA, nodeB });
  }
  
  // Create maps of children by nodeId for efficient comparison
  const childrenAMap = new Map(nodeA.children.map(child => [child.nodeId, child]));
  const childrenBMap = new Map(nodeB.children.map(child => [child.nodeId, child]));
  
  // Find added nodes (in B but not in A)
  for (const [nodeId, childB] of childrenBMap.entries()) {
    if (!childrenAMap.has(nodeId)) {
      result.addedNodes.push(childB);
    }
  }
  
  // Find removed nodes (in A but not in B)
  for (const [nodeId, childA] of childrenAMap.entries()) {
    if (!childrenBMap.has(nodeId)) {
      result.removedNodes.push(childA);
    }
  }
  
  // Recursively compare children that exist in both trees
  for (const [nodeId, childA] of childrenAMap.entries()) {
    const childB = childrenBMap.get(nodeId);
    if (childB) {
      const childComparison = compareSnapshotNodes(childA, childB);
      
      // Merge results
      Object.assign(result.styleChanges, childComparison.styleChanges);
      result.addedNodes.push(...childComparison.addedNodes);
      result.removedNodes.push(...childComparison.removedNodes);
      result.changedNodes.push(...childComparison.changedNodes);
    }
  }
  
  return result;
}