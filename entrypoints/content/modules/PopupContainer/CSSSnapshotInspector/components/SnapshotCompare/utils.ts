import { ElementStyle } from "./types";
import { CSSSnapshot, SnapshotNode } from "../../types";

/**
 * Helper function to get styles from snapshot
 */
export const getStylesFromSnapshot = (snapshot: CSSSnapshot): Record<string, ElementStyle> => {
  // For backward compatibility
  if ((snapshot as any).styles) {
    return (snapshot as any).styles;
  }

  // Generate styles from snapshot.root
  const result: Record<string, ElementStyle> = {};

  const processNode = (node: SnapshotNode, path: string[] = []) => {
    const currentPath = path.join(" > ");

    // Convert to ElementStyle format
    result[currentPath] = {
      tagName: node.tag,
      id: node.id || null,
      classes: Array.from(node.classes),
      styles: node.styles,
      inlineStyles: node.inlineStyles || {},
    };

    // Process children
    for (const child of node.children) {
      processNode(child, [...path, child.id]);
    }
  };

  // Start processing from the root node
  if (snapshot.root) {
    processNode(snapshot.root, [snapshot.root.id]);
  }

  return result;
};