import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@entrypoints/content/store/createStore";
import { closeElementCompare } from "@entrypoints/content/store/elementCompare/elementCompare.slice";
import DiffViewer from "@entrypoints/shared/components/react-diff-viewer-continued/src";
import { DiffMethod } from "@entrypoints/shared/components/react-diff-viewer-continued/src/compute-lines";

export const ElementComparePopup: React.FC = () => {
  const dispatch = useDispatch();
  const state = useSelector((s: RootState) => (s as any).elementCompare);

  if (!state?.isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483001,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 100,
          right: 40,
          width: 700,
          maxHeight: "calc(100% - 140px)",
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          overflow: "hidden",
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderBottom: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>{state.title || "Element Compare"}</div>
          <button
            onClick={() => dispatch(closeElementCompare())}
            style={{
              background: "transparent",
              border: "none",
              padding: 6,
              cursor: "pointer",
              borderRadius: 6,
            }}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>
        <div style={{ padding: 12, overflow: "auto" }}>
          <DiffViewer
            oldValue={state.leftText || ""}
            newValue={state.rightText || ""}
            splitView={true}
            useDarkTheme={false}
            compareMethod={DiffMethod.CHARS}
            leftTitle={state.leftTitle || "Snapshot A"}
            rightTitle={state.rightTitle || "Snapshot B"}
            showDiffOnly={false}
            extraLinesSurroundingDiff={3}
          />
        </div>
      </div>
    </div>
  );
};
