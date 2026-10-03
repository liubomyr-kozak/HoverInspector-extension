import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { IconGitCompare, IconArrowLeft, IconFileText, IconActivity } from "@tabler/icons-react";
import { ReactDiffViewer } from "./components/TreeDiffView/components/ReactDiffViewer";
import { SnapshotCompareProps } from "./types";
import { getStylesFromSnapshot } from "./utils";
import { buildDOMTree } from "../../utils/domTreeBuilder";
import { isDevelopment } from "@entrypoints/shared/helpers.ts";

// Styled Components
const CompareContainer = styled.div.attrs({
  id: isDevelopment() ? "hover-inspector-snapshot-compare-container" : "",
})`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.6);
  height: 100%;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
`;

export const SnapshotCompare: React.FC<SnapshotCompareProps> = ({
  snapshotA,
  snapshotB,
  onBack,
  activeView = "diff",
  splitView = true,
}) => {
  // Memoize on the snapshots: getStylesFromSnapshot returns a new object each call
  const { treeA, treeB } = useMemo(
    () => ({
      treeA: buildDOMTree(getStylesFromSnapshot(snapshotA)),
      treeB: buildDOMTree(getStylesFromSnapshot(snapshotB)),
    }),
    [snapshotA, snapshotB],
  );

  const stats = useMemo(() => {
    const totalA = snapshotA.elementCount || 0;
    const totalB = snapshotB.elementCount || 0;
    const diff = totalB - totalA;
    const changePercent = totalA > 0 ? ((Math.abs(diff) / totalA) * 100).toFixed(1) : "0";

    // Enhanced stats for QA/Dev analysis
    const sizeA = JSON.stringify(snapshotA).length;
    const sizeB = JSON.stringify(snapshotB).length;
    const sizeDiff = sizeB - sizeA;
    const sizeChangePercent = sizeA > 0 ? ((Math.abs(sizeDiff) / sizeA) * 100).toFixed(1) : "0";

    return {
      totalA,
      totalB,
      diff,
      changePercent,
      sizeA,
      sizeB,
      sizeDiff,
      sizeChangePercent,
      trend: diff > 0 ? "increase" : diff < 0 ? "decrease" : "stable",
      impact: Math.abs(diff) > totalA * 0.1 ? "high" : Math.abs(diff) > totalA * 0.05 ? "medium" : "low",
    };
  }, [snapshotA, snapshotB]);

  if (!treeA || !treeB) {
    return (
      <CompareContainer>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            padding: "48px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "50%",
              padding: "24px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              marginBottom: "24px",
            }}
          >
            <IconGitCompare size={48} color="#9ca3af" />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#1f2937", marginBottom: "8px" }}>
            No Valid DOM Data
          </h3>
          <p
            style={{
              color: "#6b7280",
              textAlign: "center",
              marginBottom: "24px",
              maxWidth: "400px",
              lineHeight: "1.5",
            }}
          >
            Unable to parse snapshot data for comparison. Please ensure both snapshots contain valid DOM structure.
          </p>
          <BackButton onClick={onBack}>
            <IconArrowLeft size={16} />
            Back to Snapshots
          </BackButton>
        </div>
      </CompareContainer>
    );
  }

  return (
    <CompareContainer>
      {activeView === "diff" ? (
        <ReactDiffViewer treeA={treeA} treeB={treeB} splitView={splitView} displaySingleLineNumbers={!splitView} />
      ) : (
        <div style={{ padding: "24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <IconFileText size={18} color="#2563eb" />
                Element Analysis
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>Before</span>
                  <span style={{ fontWeight: "600" }}>{stats.totalA} elements</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>After</span>
                  <span style={{ fontWeight: "600" }}>{stats.totalB} elements</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Net Change</span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: stats.diff > 0 ? "#059669" : stats.diff < 0 ? "#dc2626" : "#6b7280",
                    }}
                  >
                    {stats.diff > 0 ? "+" : ""}
                    {stats.diff}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <IconActivity size={18} color="#1d4ed8" />
                Performance Impact
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>Size Before</span>
                  <span style={{ fontWeight: "600" }}>{(stats.sizeA / 1024).toFixed(1)} KB</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <span style={{ color: "#6b7280" }}>Size After</span>
                  <span style={{ fontWeight: "600" }}>{(stats.sizeB / 1024).toFixed(1)} KB</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Size Change</span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: stats.sizeDiff > 0 ? "#dc2626" : stats.sizeDiff < 0 ? "#059669" : "#6b7280",
                    }}
                  >
                    {stats.sizeDiff > 0 ? "+" : ""}
                    {(stats.sizeDiff / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </CompareContainer>
  );
};
