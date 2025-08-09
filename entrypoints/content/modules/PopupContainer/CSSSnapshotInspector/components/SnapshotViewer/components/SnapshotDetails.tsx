import React, { useMemo } from "react";
import { ReactDiffViewer } from "../../SnapshotCompare/components/TreeDiffView/components/ReactDiffViewer";
import { buildDOMTree, DOMTreeNode } from "../../../utils/domTreeBuilder";
import { CSSSnapshot } from "../../../types";

interface SnapshotDetailsProps {
  snapshot: CSSSnapshot;
  /**
   * Whether to show as split view (for single snapshot, shows same content on both sides)
   * or unified view
   */
  splitView?: boolean;
  /**
   * Optional title override
   */
  title?: string;
}

/**
 * Modern component for displaying snapshot details using ReactDiffViewer
 * Replaces the old DOMTreeRenderer with a unified diff view approach
 */
export const SnapshotDetails: React.FC<SnapshotDetailsProps> = ({
  snapshot,
  splitView = false,
  title,
}) => {
  // Build DOM tree from snapshot
  const tree = useMemo(() => {
    if (!snapshot.root) return null;

    // Convert snapshot format to ElementStyleData format
    const stylesData: Record<string, any> = {};

    const processNode = (node: any, path: string[] = []) => {
      const currentPath = path.join(" > ");

      stylesData[currentPath] = {
        tagName: node.tag,
        id: node.elementId || null,
        classes: Array.from(node.classes || []),
        styles: node.styles || {},
        attributes: node.attributes || {},
        bounds: node.bounds,
      };

      // Process children
      for (const child of node.children || []) {
        processNode(child, [...path, child.id]);
      }
    };

    // Start processing from the root node
    processNode(snapshot.root, [snapshot.root.id]);

    return buildDOMTree(stylesData);
  }, [snapshot]);

  if (!tree) {
    return (
      <div style={{ 
        padding: "32px", 
        textAlign: "center", 
        color: "#666",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        margin: "16px"
      }}>
        <h3>No Data Available</h3>
        <p>Unable to build DOM tree from snapshot data</p>
        <p style={{ fontSize: "14px", marginTop: "8px" }}>
          Make sure the snapshot contains valid root node data
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {title && (
        <div style={{ 
          padding: "16px",
          borderBottom: "1px solid #e1e4e8",
          backgroundColor: "#f6f8fa",
          fontWeight: 600,
          fontSize: "16px",
          color: "#24292e"
        }}>
          {title}
        </div>
      )}
      
      <div style={{ 
        flex: 1, 
        padding: "16px",
        overflow: "auto"
      }}>
        <ReactDiffViewer
          treeA={tree}
          treeB={tree} // For single snapshot, show same tree on both sides
          splitView={splitView}
        />
      </div>
      
      {/* Footer with snapshot info */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid #e1e4e8",
        backgroundColor: "#f6f8fa",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "12px",
        color: "#586069"
      }}>
        <div>
          <span style={{ fontWeight: 500 }}>{snapshot.elementCount}</span> elements
        </div>
        <div>
          {new Date(snapshot.timestamp).toLocaleString()}
        </div>
        <div>
          {new URL(snapshot.url).hostname}
        </div>
      </div>
    </div>
  );
};
