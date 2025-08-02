import React from "react";
import { StylePropertiesProps } from "../../types";

/**
 * Component for displaying CSS properties
 */
export const StyleProperties: React.FC<StylePropertiesProps> = ({ selectedElementStyles }) => {
  if (selectedElementStyles.length === 0) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
        }}
      >
        <p
          style={{
            color: "#666",
            fontStyle: "italic",
            margin: 0,
          }}
        >
          No significant styles found for this element.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "monospace",
        fontSize: "13px",
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
        lineHeight: "1.6",
      }}
    >
      <div
        style={{
          marginBottom: "16px",
          fontWeight: "bold",
          color: "#333",
        }}
      >
        CSS Properties:
      </div>
      {selectedElementStyles.map(([property, value]) => (
        <div
          key={property}
          style={{
            marginBottom: "8px",
            paddingLeft: "16px",
          }}
        >
          <span
            style={{
              color: "#0066cc",
              fontWeight: "500",
            }}
          >
            {property}:
          </span>
          <span
            style={{
              marginLeft: "8px",
              color: "#cc6600",
            }}
          >
            {String(value)};
          </span>
        </div>
      ))}
    </div>
  );
};