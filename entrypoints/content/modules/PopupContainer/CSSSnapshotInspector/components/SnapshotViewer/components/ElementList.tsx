import React from "react";
import { ElementListProps } from "../types";

/**
 * Component for displaying elements in a list view
 */
export const ElementList: React.FC<ElementListProps> = ({ elements, selectedElement, onElementSelect }) => {
  return (
    <>
      {elements.map(({ path, element, nodeId }) => {
        const isSelected = selectedElement === nodeId;

        return (
          <div
            key={nodeId}
            onClick={() => onElementSelect(path, { ...element, nodeId, path })}
            style={{
              padding: "12px",
              cursor: "pointer",
              backgroundColor: isSelected ? "#e8f0fe" : "transparent",
              borderRadius: "6px",
              marginBottom: "6px",
              border: isSelected ? "2px solid #1976d2" : "2px solid transparent",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                fontWeight: "500",
                fontSize: "14px",
                marginBottom: "4px",
              }}
            >
              {element.tagName.toLowerCase()}
              {element.id && `#${element.id}`}
              {element.classes?.length > 0 && `.${element.classes.join(".")}`}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#666",
              }}
            >
              {Object.keys(element.styles || {}).length} styles • {path}
            </div>
          </div>
        );
      })}
    </>
  );
};