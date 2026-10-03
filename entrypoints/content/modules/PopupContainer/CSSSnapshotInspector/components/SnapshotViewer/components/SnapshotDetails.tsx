import React, { useMemo } from "react";
import { ReactDiffViewer } from "../../SnapshotCompare/components/TreeDiffView/components/ReactDiffViewer";
import { buildDOMTree } from "../../../utils/domTreeBuilder";
import { CSSSnapshot } from "../../../types";
import { getStylesFromSnapshot } from "../../SnapshotCompare/utils";

interface SnapshotDetailsProps {
  snapshot: CSSSnapshot;
  /**
   * Optional title override
   */
  title?: string;
}

/**
 * Component for displaying single snapshot using ReactDiffViewer
 * Shows the snapshot tree as clickable lines that open element details
 */
export const SnapshotDetails: React.FC<SnapshotDetailsProps> = ({ snapshot, title }) => {

  // Build DOM tree from snapshot data
  const tree = useMemo(() => {
    if (!snapshot.root) return null;

    // Key nodes by their real DOM path (body[0] > div[1] ...) so same-tag siblings
    // don't overwrite each other and the tree keeps the DOM order
    const stylesData = getStylesFromSnapshot(snapshot);

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
        {/* Same tree on both sides renders a clickable element listing (no diff) */}
        <ReactDiffViewer treeA={tree} treeB={tree} splitView={false} showDiffOnly={false} />
      </div>
    </div>
  );
};
