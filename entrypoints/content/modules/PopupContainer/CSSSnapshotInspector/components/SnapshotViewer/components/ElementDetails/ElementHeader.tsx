import React from "react";
import { IconCopy } from "@tabler/icons-react";
import { ElementHeaderProps } from "../../types";
import { copyToClipboard } from "../../utils/copyToClipboard";

/**
 * Component for displaying the element header with copy button
 */
export const ElementHeader: React.FC<ElementHeaderProps> = ({ selectedElementData }) => {
  if (!selectedElementData) return null;

  const handleCopyAllDetails = () => {
    // Create a formatted string of all element details
    const elementSelector = `${selectedElementData.tagName.toLowerCase()}${
      selectedElementData.id ? `#${selectedElementData.id}` : ""
    }${selectedElementData.classes?.length > 0 ? `.${selectedElementData.classes.join(".")}` : ""}`;

    let detailsText = `Element: ${elementSelector}\n`;
    detailsText += `Tag: ${selectedElementData.tagName}\n`;

    if (selectedElementData.id) {
      detailsText += `ID: ${selectedElementData.id}\n`;
    }

    if (selectedElementData.classes && selectedElementData.classes.length > 0) {
      detailsText += `Classes: ${selectedElementData.classes.join(", ")}\n`;
    }

    if (selectedElementData.attributes && Object.keys(selectedElementData.attributes).length > 0) {
      detailsText += "Attributes:\n";
      Object.entries(selectedElementData.attributes).forEach(([key, value]) => {
        detailsText += `  ${key}: ${value}\n`;
      });
    }

    if (selectedElementData.bounds) {
      detailsText += `Bounds: x=${selectedElementData.bounds.x}, y=${selectedElementData.bounds.y}, width=${selectedElementData.bounds.width}, height=${selectedElementData.bounds.height}\n`;
    }

    detailsText += `Path: ${selectedElementData.path}\n`;

    copyToClipboard(detailsText);
  };

  return (
    <h3
      style={{
        marginTop: 0,
        marginBottom: "12px",
        fontSize: "16px",
        color: "#0f172a",
        fontWeight: "600",
        padding: "6px 10px",
        backgroundColor: "#f1f5f9",
        borderRadius: "6px",
        border: "1px solid #e2e8f0",
        fontFamily: "monospace",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>
        {selectedElementData.tagName.toLowerCase()}
        {selectedElementData.id ? `#${selectedElementData.id}` : ""}
        {selectedElementData.classes?.length > 0 ? `.${selectedElementData.classes.join(".")}` : ""}
      </span>

      <button
        onClick={handleCopyAllDetails}
        style={{
          background: "#0ea5e9",
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
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
        title="Copy all element details"
      >
        <IconCopy size={12} />
        Copy
      </button>
    </h3>
  );
};