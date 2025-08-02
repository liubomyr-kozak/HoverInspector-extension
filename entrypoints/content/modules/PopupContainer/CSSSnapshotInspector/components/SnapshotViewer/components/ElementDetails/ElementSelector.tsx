import React from "react";
import { IconCopy } from "@tabler/icons-react";
import { ElementSelectorProps } from "../../types";
import { copyToClipboard } from "../../utils/copyToClipboard";

/**
 * Component for displaying the element CSS selector summary
 */
export const ElementSelector: React.FC<ElementSelectorProps> = ({ selectedElementData }) => {
  if (!selectedElementData) return null;

  const handleCopySelector = () => {
    const selector = `${selectedElementData.tagName.toLowerCase()}${
      selectedElementData.id ? `#${selectedElementData.id}` : ""
    }${selectedElementData.classes?.length > 0 ? `.${selectedElementData.classes.join(".")}` : ""}`;
    copyToClipboard(selector);
  };

  return (
    <div
      style={{
        backgroundColor: "#f0fdf4",
        border: "1px solid #dcfce7",
        borderRadius: "6px",
        padding: "8px 10px",
        marginBottom: "12px",
        fontSize: "13px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "500", marginBottom: "2px", color: "#166534", fontSize: "12px" }}>
          CSS Selector
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "13px", wordBreak: "break-all" }}>
          {`${selectedElementData.tagName.toLowerCase()}${
            selectedElementData.id ? `#${selectedElementData.id}` : ""
          }${selectedElementData.classes?.length > 0 ? `.${selectedElementData.classes.join(".")}` : ""}`}
        </div>
      </div>
      <button
        onClick={handleCopySelector}
        style={{
          background: "#22c55e",
          border: "none",
          borderRadius: "4px",
          padding: "4px 8px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          fontSize: "12px",
          color: "white",
          fontWeight: "500",
          marginLeft: "8px",
          flexShrink: 0,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
        title="Copy CSS selector"
      >
        <IconCopy size={12} />
        Copy
      </button>
    </div>
  );
};