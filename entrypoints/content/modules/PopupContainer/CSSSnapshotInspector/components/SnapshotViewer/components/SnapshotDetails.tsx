import React, { useMemo } from "react";
import { ReactDiffViewer } from "../../SnapshotCompare/components/TreeDiffView/components/ReactDiffViewer";
import { buildDOMTree } from "../../../utils/domTreeBuilder";
import { CSSSnapshot } from "../../../types";

interface SnapshotDetailsProps {
  snapshot: CSSSnapshot;
  /**
   * Optional title override
   */
  title?: string;
}

/**
 * Component for displaying single snapshot using ReactDiffViewer
 * Shows the snapshot tree in unified view with all nodes auto-expanded
 */
export const SnapshotDetails: React.FC<SnapshotDetailsProps> = ({ snapshot, title }) => {
  console.log("😂😂😂 ::SnapshotDetails -> snapshot", snapshot);

  // Build DOM tree from snapshot data
  const tree = useMemo(() => {
    if (!snapshot.root) return null;

    // Convert snapshot format to ElementStyleData format for buildDOMTree
    const stylesData: Record<string, any> = {};

    const processNode = (node: any, path: string[] = []) => {
      const nodeKey = node.key || `${node.tag}-${path.length}`;
      const currentPath = [...path, nodeKey].join(" > ");

      stylesData[currentPath] = { ...node };

      // Process children recursively
      for (const child of node.children || []) {
        processNode(child, [...path, nodeKey]);
      }
    };

    // Start processing from the root node
    processNode(snapshot.root, []);

    return buildDOMTree(stylesData);
  }, [snapshot]);

  if (!tree) {
    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
          color: "#666",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          margin: "16px",
        }}
      >
        <h3>No Data Available</h3>
        <p>Unable to build DOM tree from snapshot data</p>
        <p style={{ fontSize: "14px", marginTop: "8px" }}>Make sure the snapshot contains valid root node data</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {title && (
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #e1e4e8",
            backgroundColor: "#f6f8fa",
            fontWeight: 600,
            fontSize: "16px",
            color: "#24292e",
          }}
        >
          {title}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflow: "auto",
        }}
      >
        <ReactDiffViewer
          treeA={tree}
          treeB={tree} // For single snapshot, show same tree on both sides
          splitView={false} // Always use unified view for single snapshots
          showDiffOnly={false} // Show all content, not just differences
          expandAll={true} // Auto-expand all nodes
          displaySingleLineNumbers={true} // Default is false - hide line numbers for cleaner view
        />
      </div>
    </div>
  );
};
