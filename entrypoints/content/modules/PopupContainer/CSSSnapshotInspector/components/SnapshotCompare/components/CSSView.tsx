import React from "react";
import { CSSViewProps } from "../types";

/**
 * Component for displaying CSS properties in a code-like format
 */
export const CSSView: React.FC<CSSViewProps> = ({ selectedElementData, filteredProperties }) => {
  if (!selectedElementData || filteredProperties.length === 0) {
    return (
      <div style={{ padding: "16px", textAlign: "center" }}>
        <p>No relevant CSS properties found for this element or element is part of HTML header.</p>
        <p>Header elements and default styles are filtered out.</p>
      </div>
    );
  }

  // Get element details
  const elementName = selectedElementData.path.split(" > ").pop() || "element";

  return (
    <div style={{ padding: "16px" }}>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "14px",
          backgroundColor: "#f8f9fa",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid #dadce0",
          overflowX: "auto",
          whiteSpace: "pre",
          lineHeight: "1.5",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <div style={{ color: "#5f6368", marginBottom: "8px" }}>/* Snapshot A */</div>
          <div>{elementName} {`{`}</div>
          {filteredProperties.map((prop) => {
            if (prop.valueA) {
              return (
                <div key={`a-${prop.property}`} style={{ marginLeft: "20px" }}>
                  <span style={{ color: "#5f6368" }}>{prop.property}:</span>{" "}
                  <span style={{ color: prop.changeType === "removed" ? "#c5221f" : "inherit" }}>
                    {prop.valueA};
                  </span>
                  {prop.changeType === "removed" && (
                    <span style={{ color: "#c5221f", marginLeft: "8px" }}>/* removed */</span>
                  )}
                </div>
              );
            }
            return null;
          })}
          <div>{`}`}</div>
        </div>

        <div>
          <div style={{ color: "#5f6368", marginBottom: "8px" }}>/* Snapshot B */</div>
          <div>{elementName} {`{`}</div>
          {filteredProperties.map((prop) => {
            if (prop.valueB) {
              return (
                <div key={`b-${prop.property}`} style={{ marginLeft: "20px" }}>
                  <span style={{ color: "#5f6368" }}>{prop.property}:</span>{" "}
                  <span
                    style={{
                      color:
                        prop.changeType === "added"
                          ? "#137333"
                          : prop.changeType === "changed"
                          ? "#ea8600"
                          : "inherit",
                    }}
                  >
                    {prop.valueB};
                  </span>
                  {prop.changeType === "added" && (
                    <span style={{ color: "#137333", marginLeft: "8px" }}>/* added */</span>
                  )}
                  {prop.changeType === "changed" && prop.valueA && (
                    <span style={{ color: "#ea8600", marginLeft: "8px" }}>
                      /* changed from {prop.valueA} */
                    </span>
                  )}
                </div>
              );
            }
            return null;
          })}
          <div>{`}`}</div>
        </div>
      </div>
    </div>
  );
};