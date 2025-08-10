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

  const processNode = (node: SnapshotNode): void => {
    // Build the path key for this node using the actual path from the snapshot
    // The snapshot stores paths as arrays like ["body[0]", "div[1]", "span[0]"]
    // The DOM tree builder expects strings like "body[0] > div[1] > span[0]"
    let currentPathKey: string = "";
    
    if (node.path && node.path.length > 0) {
      // Convert path array to string with " > " separator
      currentPathKey = node.path.join(" > ");
    }

    // Include all elements with valid paths
    if (currentPathKey && currentPathKey.trim() !== "") {
      result[currentPathKey] = {
        tagName: node.tagName,
        id: node.id || null,
        classes: Array.isArray(node.classes) ? Array.from(node.classes) : [],
        styles: node.styles || {},
        inlineStyles: node.inlineStyles || {},
        attributes: node.attributes || {},
        bounds: node.bounds,
        text: node.text,
      };
    }

    // Process children recursively
    for (const child of node.children) {
      processNode(child);
    }
  };

  // Start processing from the root node
  if (snapshot.root) {
    processNode(snapshot.root);
  }

  console.log("Generated styles from snapshot:", result);
  console.log("Total elements processed:", Object.keys(result).length);
  return result;
};