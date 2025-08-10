import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@entrypoints/content/store/createStore";
import { closeElementDetails } from "@entrypoints/content/store/elementDetails/elementDetails.slice";
import { ElementDetails } from "./SnapshotViewer/components/ElementDetails";
import DiffViewer from "@entrypoints/shared/components/react-diff-viewer-continued/src";
import { DiffMethod } from "@entrypoints/shared/components/react-diff-viewer-continued/src/compute-lines";
import { ElementDiff } from "./SnapshotViewer/components/ElementDetails/ElementDiff";

export const ElementDetailsPopup: React.FC = () => {
  const dispatch = useDispatch();
  const state = useSelector((s: RootState) => s.elementDetails);

  if (!state?.isOpen) return null;

  const selectedElementData = {
    tagName: state.tagName || "",
    id: state.id || null,
    classes: state.classes || [],
    attributes: state.attributes || {},
    bounds: state.bounds,
    inlineStyles: state.inlineStyles || {},
    xpath: state.xpath,
  } as any;

  const selectedElementStyles = Object.entries(state.styles || {});

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 50,
          right: 40,
          width: 420,
          maxHeight: "calc(100% - 70px)",
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
          <div style={{ fontWeight: 600, fontSize: 14 }}>Element details {state.title ? `— ${state.title}` : ""}</div>
          <button
            onClick={() => dispatch(closeElementDetails())}
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
          <ElementDetails
            selectedElement={1}
            selectedElementData={selectedElementData}
            selectedElementStyles={selectedElementStyles as Array<[string, any]>}
          />
        </div>
      </div>
    </div>
  );
};
