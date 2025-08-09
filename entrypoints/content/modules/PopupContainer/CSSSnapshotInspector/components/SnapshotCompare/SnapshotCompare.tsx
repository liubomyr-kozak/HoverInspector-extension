import React, { useState, useMemo } from "react";
import {
  IconGitCompare,
  IconArrowLeft,
  IconEye,
  IconEyeOff,
  IconLayoutSidebarRightExpand,
  IconLayoutList,
} from "@tabler/icons-react";
import { ComparisonContainer, SecondaryButton, Button } from "../../CSSSnapshotInspector.styled.ts";
import { ReactDiffViewer } from "./components/TreeDiffView/components/ReactDiffViewer";
import { SnapshotCompareProps } from "./types";
import { getStylesFromSnapshot } from "./utils";
import { buildDOMTree } from "../../utils/domTreeBuilder";

export const SnapshotCompare: React.FC<SnapshotCompareProps> = ({ snapshotA, snapshotB, onBack }) => {
  const [splitView, setSplitView] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(false);

  const stylesA = getStylesFromSnapshot(snapshotA);
  const stylesB = getStylesFromSnapshot(snapshotB);

  const { treeA, treeB } = useMemo(
    () => ({
      treeA: buildDOMTree(stylesA),
      treeB: buildDOMTree(stylesB),
    }),
    [stylesA, stylesB],
  );

  const stats = useMemo(() => {
    const totalA = snapshotA.elementCount || 0;
    const totalB = snapshotB.elementCount || 0;
    const diff = totalB - totalA;
    return {
      totalA,
      totalB,
      diff,
      percent: totalA > 0 ? ((diff / totalA) * 100).toFixed(1) : "0",
    };
  }, [snapshotA, snapshotB]);

  if (!treeA || !treeB) {
    return (
      <ComparisonContainer style={{ padding: 20, textAlign: "center" }}>
        <IconGitCompare size={36} style={{ color: "#9ca3af" }} />
        <h3>No valid DOM data</h3>
        <SecondaryButton onClick={onBack}>
          <IconArrowLeft size={16} /> Back
        </SecondaryButton>
      </ComparisonContainer>
    );
  }

  return (
    <ComparisonContainer style={{ display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      {/* ===== HEADER ===== */}
      <div
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* Back */}
        <Button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white",
            padding: "6px 10px",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <IconArrowLeft size={16} /> Back
        </Button>

        {/* Title */}
        <div style={{ flex: 1, textAlign: "center", fontWeight: 600, fontSize: "16px" }}>Snapshot Comparison</div>

        {/* Controls (do not touch this logic) */}
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            onClick={() => {
              setSplitView(!splitView);
              setShowLineNumbers(showLineNumbers);
            }}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              borderRadius: 8,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {!splitView ? <IconLayoutSidebarRightExpand size={16} /> : <IconLayoutList size={16} />}
            {!splitView ? "Unified" : "Split"}
          </Button>
        </div>
      </div>

      {/* ===== SNAPSHOT CARDS ===== */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "12px 0",
          background: "rgb(255, 255, 255)",
          borderBottom: "1px solid rgb(229, 231, 235)",
          justifyContent: "space-between",
        }}
      >
        {[
          { label: "After", color: "#10b981", snap: snapshotB, total: stats.totalB, diff: stats.diff },
          { label: "Before", color: "#ef4444", snap: snapshotA, total: stats.totalA },
        ].map(({ label, color, snap, total, diff }, i) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f9fafb",
              padding: "6px 10px",
              borderRadius: 8,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              gap: 10,
              minWidth: 200,
            }}
          >
            {/* Іконка + label */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {label[0]}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 100,
                }}
              >
                {snap.title}
              </span>
            </div>

            {/* Лічильники */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  padding: "2px 6px",
                  borderRadius: 6,
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                {total} elem
              </span>
              {diff !== undefined && diff !== 0 && (
                <span
                  style={{
                    background: diff > 0 ? "#d1fae5" : "#fee2e2",
                    color: diff > 0 ? "#059669" : "#b91c1c",
                    padding: "2px 6px",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ===== DIFF VIEWER ===== */}
      <div
        style={{
          flex: 1,
          background: "#f1f5f9",
          padding: 12,
          overflow: "hidden",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 8,
            overflow: "hidden",
            height: "100%",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <ReactDiffViewer
            treeA={treeA}
            treeB={treeB}
            splitView={splitView}
            displaySingleLineNumbers={showLineNumbers}
          />
        </div>
      </div>
    </ComparisonContainer>
  );
};
