import React, { useState, useMemo } from "react";
import { IconHistory } from "@tabler/icons-react";
import {
  ComparisonContainer,
  ComparisonHeader,
  ComparisonTitle,
  SecondaryButton,
  EmptyState,
} from "../../CSSSnapshotInspector.styled.ts";

import { ReactDiffViewer } from "./components/TreeDiffView/components/ReactDiffViewer";
import { SnapshotCompareProps } from "./types";
import { getStylesFromSnapshot } from "./utils";
import {
  buildDOMTree,
} from "../../utils/domTreeBuilder";

export const SnapshotCompare: React.FC<SnapshotCompareProps> = ({ snapshotA, snapshotB, onBack }) => {
  const stylesA = getStylesFromSnapshot(snapshotA);
  const stylesB = getStylesFromSnapshot(snapshotB);

  // Build DOM trees for diff comparison
  const { treeA, treeB } = useMemo(() => {
    const treeA = buildDOMTree(stylesA);
    const treeB = buildDOMTree(stylesB);
    return { treeA, treeB };
  }, [stylesA, stylesB]);

  if (!treeA || !treeB) {
    return (
      <ComparisonContainer>
        <EmptyState>
          <p>Unable to build DOM trees for comparison</p>
          <p>Make sure both snapshots contain valid data</p>
        </EmptyState>
      </ComparisonContainer>
    );
  }

  return (
    <ComparisonContainer>
      <ComparisonHeader style={{ borderBottom: "1px solid #dadce0", padding: "16px", backgroundColor: "#f8f9fa" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <SecondaryButton
            onClick={onBack}
            style={{
              marginRight: "16px",
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #dadce0",
              backgroundColor: "white",
            }}
          >
            <IconHistory size={16} style={{ marginRight: "6px" }} />
            Back to Snapshots
          </SecondaryButton>
          <ComparisonTitle style={{ fontSize: "18px", fontWeight: 500, color: "#202124" }}>
            CSS Snapshot Comparison
          </ComparisonTitle>
        </div>
        
        {/* Snapshot Titles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontWeight: 500, color: "#d73a49", minWidth: "100px" }}>Snapshot A:</div>
            <span style={{ fontSize: "14px" }}>{snapshotA.title}</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontWeight: 500, color: "#22863a", minWidth: "100px" }}>Snapshot B:</div>
            <span style={{ fontSize: "14px" }}>{snapshotB.title}</span>
          </div>
        </div>
      </ComparisonHeader>
      
      <div style={{ flex: 1, padding: "16px" }}>
        <ReactDiffViewer 
          treeA={treeA} 
          treeB={treeB} 
          splitView={true} 
        />
      </div>
    </ComparisonContainer>
  );
};
