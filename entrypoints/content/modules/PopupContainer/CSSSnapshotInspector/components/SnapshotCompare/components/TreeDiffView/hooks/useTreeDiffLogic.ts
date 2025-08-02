import { useMemo } from "react";
import { TreeNode } from "../types";

interface UseTreeDiffLogicProps {
  filteredElements: any[];
  stylesA: Record<string, any>;
  stylesB: Record<string, any>;
}

interface ElementData {
  tagName: string;
  id?: string | null;
  classes?: string[];
}

/**
 * Custom hook for managing tree diff logic in the TreeDiffView component
 * Provides clean separation of concerns and clear element naming
 */
export const useTreeDiffLogic = ({ filteredElements, stylesA, stylesB }: UseTreeDiffLogicProps) => {
  /**
   * Filter elements that don't have position changes (hasMoved property)
   * These elements have style or structural changes but haven't moved
   */
  const elementsWithStyleChanges = useMemo(() => {
    return filteredElements.filter((item) => !item.hasMoved);
  }, [filteredElements]);

  /**
   * Build hierarchical tree structure from flat element list
   */
  const treeData = useMemo(() => {
    const rootNode = createRootNode();
    const sortedElements = getSortedElements(elementsWithStyleChanges);

    sortedElements.forEach((item) => {
      buildElementTreeNode(item, rootNode, stylesA, stylesB);
    });

    sortTreeNodeChildren(rootNode);
    return rootNode;
  }, [elementsWithStyleChanges, stylesA, stylesB]);

  return {
    treeData,
    elementsWithoutViewChanges: elementsWithStyleChanges,
  };
};

/**
 * Create the root node of the tree
 */
function createRootNode(): TreeNode {
  return {
    path: "",
    name: "Root",
    element: null,
    children: [],
    level: 0,
  };
}

/**
 * Sort elements by path to ensure parent nodes are processed before children
 */
function getSortedElements(elements: any[]) {
  return [...elements].sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Build a tree node for an element and insert it into the correct position in the tree
 */
function buildElementTreeNode(
  item: any,
  rootNode: TreeNode,
  stylesA: Record<string, any>,
  stylesB: Record<string, any>,
) {
  const elementData = getElementData(item.path, stylesA, stylesB);

  const elementName = createElementName(elementData, item.path);
  const pathSegments = getPathSegments(item.path);

  // Navigate to the correct parent node, creating intermediate nodes as needed
  const parentNode = findOrCreateParentNode(pathSegments, rootNode, stylesA, stylesB);

  // Add the element as a child of the parent node
  const elementNode: TreeNode = {
    path: item.path,
    name: elementName,
    element: item,
    children: [],
    level: pathSegments.length,
  };

  parentNode.children.push(elementNode);
}

/**
 * Extract element data (tagName, id, classes) from styles
 */
function getElementData(path: string, stylesA: Record<string, any>, stylesB: Record<string, any>): ElementData | null {
  const element = stylesA[path] || stylesB[path];
  if (!element) return null;

  return {
    tagName: element.tagName?.toLowerCase() || "div",
    id: element.id || null,
    classes: element.classes || [],
  };
}

/**
 * Create a clean, readable element name without random IDs
 * Format: tagname#id.class1.class2
 */
function createElementName(elementData: ElementData | null, fallbackPath: string): string {
  if (!elementData) {
    return parseElementNameFromPath(fallbackPath);
  }

  let name = elementData.tagName;

  // Add ID if it exists and is not a random generated ID
  if (elementData.id && !isRandomGeneratedId(elementData.id)) {
    name += `#${elementData.id}`;
  }

  // Add classes if they exist
  if (elementData.classes && elementData.classes.length > 0) {
    name += `.${elementData.classes.join(".")}`;
  }

  return name;
}

/**
 * Check if an ID appears to be randomly generated (contains random strings like "el-rnzjwo")
 */
function isRandomGeneratedId(id: string): boolean {
  // Pattern for random IDs: contains random letters/numbers, or specific patterns like "el-"
  const randomPatterns = [
    /^el-[a-z0-9]{6}$/i, // Pattern like "el-rnzjwo"
    /^[a-z0-9]{8,}$/i, // Long random strings
    /^_[a-z0-9]+$/i, // IDs starting with underscore
  ];

  return randomPatterns.some((pattern) => pattern.test(id));
}

/**
 * Parse element name from path when no style data is available
 */
function parseElementNameFromPath(path: string): string {
  const lastSegment = path.split(">").pop()?.trim() || "Unknown";

  // Remove random ID patterns from the path segment
  return (
    lastSegment
      .replace(/\s*\[.*?\]$/, "") // Remove attribute selectors
      .replace(/\s*:nth-child\(\d+\)/, "") // Remove nth-child selectors
      .replace(/#el-[a-z0-9]{6}/i, "") || // Remove random el- IDs
    "element"
  );
}

/**
 * Split path into segments for tree navigation
 */
function getPathSegments(path: string): string[] {
  return path
    .split(">")
    .filter(Boolean)
    .map((segment) => segment.trim());
}

/**
 * Find or create parent nodes in the tree structure
 */
function findOrCreateParentNode(
  pathSegments: string[], // ['el-s5836g', 'el-rnzjwp', 'el-rnzjwo', 'el-g2u3f9']
  rootNode: TreeNode,
  stylesA: Record<string, any>,
  stylesB: Record<string, any>,
): TreeNode {
  let currentNode = rootNode;
  let currentPath = "";

  // Navigate through path segments (excluding the last one which is the element itself)
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const segment = pathSegments[i];
    currentPath = buildCurrentPath(currentPath, segment);

    const existingNode = findChildNodeByPath(currentNode, currentPath);

    if (existingNode) {
      currentNode = existingNode;
    } else {
      const newParentNode = createParentNode(segment, currentPath, i + 1, stylesA, stylesB);
      currentNode.children.push(newParentNode);
      currentNode = newParentNode;
    }
  }

  return currentNode;
}

/**
 * Build the current path by combining with the new segment
 */
function buildCurrentPath(currentPath: string, segment: string): string {
  return currentPath ? `${currentPath}>${segment}` : segment;
}

/**
 * Find a child node by its path
 */
function findChildNodeByPath(parentNode: TreeNode, targetPath: string): TreeNode | undefined {
  return parentNode.children.find((child) => child.path === targetPath);
}

/**
 * Create a parent node for intermediate tree levels
 */
function createParentNode(
  segment: string, // 'el-s5836g'
  path: string,
  level: number,
  stylesA: Record<string, any>,
  stylesB: Record<string, any>,
): TreeNode {
  const parentElementData = getElementData(path, stylesA, stylesB);
  const parentName = parentElementData
    ? createElementName(parentElementData, segment)
    : parseElementNameFromPath(segment);

  return {
    path,
    name: parentName,
    element: null,
    children: [],
    level,
  };
}

/**
 * Sort tree node children recursively for better readability
 */
function sortTreeNodeChildren(node: TreeNode): void {
  if (node.children.length > 0) {
    // Sort children by name alphabetically
    node.children.sort((a, b) => a.name.localeCompare(b.name));

    // Recursively sort grandchildren
    node.children.forEach((child) => sortTreeNodeChildren(child));
  }
}
