import { CSSSnapshot, SnapshotNode } from "../../types";
import { ElementStyleData } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/domTreeBuilder.ts";

/**
 * Helper function to get styles from snapshot
 */
export const getStylesFromSnapshot = (snapshot: CSSSnapshot): Record<string, ElementStyleData> => {
  // For backward compatibility
  if ((snapshot as any).styles) {
    return (snapshot as any).styles;
  }

  // Generate styles from snapshot.root
  const result: Record<string, ElementStyleData> = {};

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
      result[currentPathKey] = { ...node } as unknown as ElementStyleData;
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

  return result;
};
