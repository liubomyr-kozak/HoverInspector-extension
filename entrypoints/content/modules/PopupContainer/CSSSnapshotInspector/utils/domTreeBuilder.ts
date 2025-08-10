/**
 * HTML DOM Tree Builder
 * Pure utility for creating hierarchical DOM tree structure with all needed information
 * Used for both single snapshot view and comparison logic
 */

export interface DOMTreeNode {
  /** Unique path to this element */
  path: string;
  /** Display name (e.g., "div#header.nav-item") */
  name: string;
  /** Tag name (div, span, etc.) */
  tagName: string;
  /** Element ID (without #) */
  id?: string | null;
  /** CSS classes array */
  classes: string[];
  /** All CSS styles as key-value pairs */
  styles: Record<string, string>;
  /** Inline styles from style attribute */
  inlineStyles: Record<string, string>;
  /** Element attributes */
  attributes?: Record<string, string>;
  /** Element bounds/position */
  bounds?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  /** Child elements */
  children: DOMTreeNode[];
  /** Tree level (0 = root) */
  level: number;
  /** Original element data */
  originalData?: any;
}

export interface ElementStyleData {
  tagName: string;
  id?: string | null;
  classes?: string[];
  styles: Record<string, string>;
  inlineStyles?: Record<string, string>;
  attributes?: Record<string, string>;
  bounds?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

/**
 * Build HTML DOM tree from snapshot styles data
 * Creates complete tree structure with proper element information
 */
export function buildDOMTree(
  stylesData: Record<string, ElementStyleData>,
  positionData?: Record<string, any>
): DOMTreeNode {
  const rootNode = createRootNode();
  const sortedPaths = getSortedElementPaths(Object.keys(stylesData));

  sortedPaths.forEach((path) => {
    const elementData = stylesData[path];
    const positionInfo = positionData?.[path];
    
    insertElementIntoTree(rootNode, path, elementData, positionInfo);
  });

  sortTreeChildren(rootNode);
  return rootNode;
}

/**
 * Create the root node of the DOM tree
 */
function createRootNode(): DOMTreeNode {
  return {
    path: "",
    name: "Root",
    tagName: "root",
    id: null,
    classes: [],
    styles: {},
    inlineStyles: {},
    children: [],
    level: 0,
  };
}

/**
 * Sort element paths to ensure parents are processed before children
 */
function getSortedElementPaths(paths: string[]): string[] {
  return paths.sort((a, b) => a.localeCompare(b));
}

/**
 * Insert an element into the correct position in the tree
 */
function insertElementIntoTree(
  rootNode: DOMTreeNode,
  elementPath: string,
  elementData: ElementStyleData,
  positionInfo?: any
): void {
  const pathSegments = parseElementPath(elementPath);
  const elementName = createElementName(elementData);
  
  // Navigate to the correct parent, creating intermediate nodes as needed
  const parentNode = findOrCreateParentNodes(rootNode, pathSegments, elementPath);
  
  // Create the element node
  const elementNode: DOMTreeNode = {
    path: elementPath,
    name: elementName,
    tagName: elementData.tagName.toLowerCase(),
    id: cleanElementId(elementData.id),
    classes: elementData.classes || [],
    styles: elementData.styles || {},
    inlineStyles: elementData.inlineStyles || {},
    attributes: elementData.attributes,
    bounds: positionInfo || elementData.bounds,
    children: [],
    level: pathSegments.length,
    originalData: elementData,
  };

  parentNode.children.push(elementNode);
}

/**
 * Parse element path into segments
 */
function parseElementPath(path: string): string[] {
  return path
    .split(">")
    .filter(Boolean)
    .map(segment => segment.trim());
}

/**
 * Create clean element name for display
 * Format: tagname#id.class1.class2
 */
function createElementName(elementData: ElementStyleData): string {
  const { tagName, id, classes } = elementData;
  let name = tagName.toLowerCase();
  
  // Add ID if it exists and is not randomly generated
  const cleanId = cleanElementId(id);
  if (cleanId) {
    name += `#${cleanId}`;
  }
  
  // Add classes if they exist
  if (classes && classes.length > 0) {
    name += `.${classes.join('.')}`;
  }

  return name;
}

/**
 * Clean element ID by removing random generated IDs
 * Returns null for IDs that appear to be randomly generated
 */
function cleanElementId(id?: string | null): string | null {
  if (!id) return null;
  
  // Check if ID appears to be randomly generated
  const randomPatterns = [
    /^el-[a-z0-9]{6}$/i,    // Pattern like "el-rnzjwo"
    /^[a-z0-9]{8,}$/i,      // Long random strings (8+ chars)
    /^_[a-z0-9]+$/i,        // IDs starting with underscore
    /^[0-9]+$/,             // Pure numbers
    /^tmp[_-]?[a-z0-9]+$/i, // Temporary IDs
  ];

  const isRandomId = randomPatterns.some(pattern => pattern.test(id));
  return isRandomId ? null : id;
}

/**
 * Find or create parent nodes for the given path segments
 */
function findOrCreateParentNodes(
  rootNode: DOMTreeNode,
  pathSegments: string[],
  fullPath: string
): DOMTreeNode {
  let currentNode = rootNode;
  let currentPath = "";

  // Navigate through all segments except the last (which is the element itself)
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const segment = pathSegments[i];
    currentPath = buildPathSegment(currentPath, segment);
    
    // Try to find existing node
    let existingNode = findChildByPath(currentNode, currentPath);
    
    if (!existingNode) {
      // Create new parent node
      existingNode = createParentNode(segment, currentPath, i + 1);
      currentNode.children.push(existingNode);
    }
    
    currentNode = existingNode;
  }

  return currentNode;
}

/**
 * Build path segment incrementally
 */
function buildPathSegment(currentPath: string, segment: string): string {
  return currentPath ? `${currentPath}>${segment}` : segment;
}

/**
 * Find child node by path
 */
function findChildByPath(parentNode: DOMTreeNode, targetPath: string): DOMTreeNode | undefined {
  return parentNode.children.find(child => child.path === targetPath);
}

/**
 * Create a parent node for intermediate tree levels
 */
function createParentNode(segment: string, path: string, level: number): DOMTreeNode {
  // Parse the segment to extract tag, id, and classes
  const { tagName, id, classes } = parseSegmentForParentNode(segment);
  
  return {
    path,
    name: createParentNodeName(tagName, id, classes),
    tagName: tagName.toLowerCase(),
    id: cleanElementId(id),
    classes: classes,
    styles: {},
    children: [],
    level,
  };
}

/**
 * Parse segment to extract element information for parent nodes
 */
function parseSegmentForParentNode(segment: string): {
  tagName: string;
  id?: string;
  classes: string[];
} {
  // Remove attribute selectors and nth-child selectors
  const cleanSegment = segment
    .replace(/\[.*?\]/g, '')      // Remove [attr="value"]
    .replace(/:nth-child\(\d+\)/g, ''); // Remove :nth-child(n)

  // Extract tag name (everything before # or .)
  const tagMatch = cleanSegment.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
  const tagName = tagMatch ? tagMatch[1] : 'div';
  
  // Extract ID (after # and before .)
  const idMatch = cleanSegment.match(/#([^.]+)/);
  const id = idMatch ? idMatch[1] : undefined;
  
  // Extract classes (after .)
  const classMatches = cleanSegment.match(/\.([^#.]+)/g);
  const classes = classMatches ? classMatches.map(cls => cls.substring(1)) : [];
  
  return { tagName, id, classes };
}

/**
 * Create display name for parent node
 */
function createParentNodeName(tagName: string, id?: string, classes: string[] = []): string {
  let name = tagName;
  
  const cleanId = cleanElementId(id);
  if (cleanId) {
    name += `#${cleanId}`;
  }
  
  if (classes.length > 0) {
    name += `.${classes.join('.')}`;
  }
  
  return name;
}

/**
 * Sort tree children recursively for consistent display
 */
function sortTreeChildren(node: DOMTreeNode): void {
  if (node.children.length > 0) {
    // Sort children by name for consistent ordering
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    
    // Recursively sort grandchildren
    node.children.forEach(child => sortTreeChildren(child));
  }
}

/**
 * Find element in tree by path
 */
export function findElementInTree(root: DOMTreeNode, targetPath: string): DOMTreeNode | null {
  if (root.path === targetPath) {
    return root;
  }
  
  for (const child of root.children) {
    const result = findElementInTree(child, targetPath);
    if (result) {
      return result;
    }
  }
  
  return null;
}

/**
 * Get all elements from tree as flat array
 */
export function flattenTree(root: DOMTreeNode): DOMTreeNode[] {
  const result: DOMTreeNode[] = [];
  
  function traverse(node: DOMTreeNode) {
    if (node.path !== "") { // Skip root
      result.push(node);
    }
    node.children.forEach(traverse);
  }
  
  traverse(root);
  return result;
}
