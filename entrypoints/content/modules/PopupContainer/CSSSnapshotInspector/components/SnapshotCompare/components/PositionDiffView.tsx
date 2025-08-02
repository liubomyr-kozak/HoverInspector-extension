import React from "react";
import { PositionViewProps } from "../types";

/**
 * Component for displaying position changes in a GitHub-style diff format
 * Shows changes with + and - indicators similar to GitHub diff view
 */
export const PositionDiffView: React.FC<PositionViewProps> = ({ selectedElementData }) => {
  if (!selectedElementData || !selectedElementData.positionChanges || selectedElementData.positionChanges.length === 0) {
    return (
      <div style={{ padding: "16px", textAlign: "center" }}>
        <p>No position changes detected for this element.</p>
        <p>Position changes are tracked for top, left, width, and height properties.</p>
      </div>
    );
  }

  // Sort position changes by property
  const sortedChanges = [...selectedElementData.positionChanges].sort((a, b) => {
    // Custom sort order: top, left, width, height
    const order = { top: 1, left: 2, width: 3, height: 4 };
    return order[a.property] - order[b.property];
  });

  // Get element details
  const elementName = selectedElementData.path.split(" > ").pop() || "element";

  return (
    <div style={{ padding: "16px" }}>
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          backgroundColor: selectedElementData.hasMoved ? "rgba(26, 115, 232, 0.05)" : "transparent",
          borderRadius: "8px",
          border: selectedElementData.hasMoved ? "1px solid rgba(26, 115, 232, 0.2)" : "none",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#202124" }}>
          Position Summary
        </h3>
        <p style={{ margin: "0", color: "#5f6368", fontSize: "14px" }}>
          {selectedElementData.hasMoved
            ? "This element has moved from its original position."
            : "This element has changed size but remained in the same position."}
        </p>
      </div>

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
        <div style={{ marginBottom: "8px", color: "#5f6368" }}>/* Position Diff */</div>
        <div>{elementName} {`{`}</div>

        {sortedChanges.map((change) => {
          const isPositive = change.difference > 0;
          const absPercentage = Math.abs(change.percentage).toFixed(1);
          const formattedDiff = isPositive ? `+${change.difference}px` : `${change.difference}px`;
          const formattedPercentage = isPositive ? `+${absPercentage}%` : `-${absPercentage}%`;
          
          return (
            <React.Fragment key={change.property}>
              {/* Original value */}
              <div 
                style={{ 
                  marginLeft: "20px", 
                  backgroundColor: "rgba(255, 0, 0, 0.1)", 
                  display: "flex",
                  marginRight: "-16px",
                  paddingRight: "16px",
                  borderRadius: "3px",
                  marginBottom: "2px"
                }}
              >
                <span style={{ color: "#b31d28", width: "20px", display: "inline-block", textAlign: "center" }}>-</span>
                <span style={{ color: "#5f6368" }}>{change.property}:</span>{" "}
                <span style={{ color: "#b31d28" }}>{change.valueA}px;</span>
              </div>
              
              {/* New value */}
              <div 
                style={{ 
                  marginLeft: "20px", 
                  backgroundColor: "rgba(0, 255, 0, 0.1)", 
                  display: "flex",
                  marginRight: "-16px",
                  paddingRight: "16px",
                  borderRadius: "3px",
                  marginBottom: "2px"
                }}
              >
                <span style={{ color: "#22863a", width: "20px", display: "inline-block", textAlign: "center" }}>+</span>
                <span style={{ color: "#5f6368" }}>{change.property}:</span>{" "}
                <span style={{ color: "#22863a" }}>{change.valueB}px;</span>
                <span style={{ color: "#6a737d", marginLeft: "8px" }}>/* {formattedDiff} ({formattedPercentage}) */</span>
              </div>
            </React.Fragment>
          );
        })}

        <div>{`}`}</div>
      </div>

      {/* Visual representation of changes */}
      <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {sortedChanges.map((change) => {
          const isPositive = change.difference > 0;
          
          // Determine color based on property and direction
          let color = "#1a73e8"; // Default blue
          if (change.property === "top" || change.property === "left") {
            // For position properties
            color = isPositive ? "#ea8600" : "#0f9d58"; // Orange for moving down/right, green for moving up/left
          } else {
            // For size properties
            color = isPositive ? "#0f9d58" : "#ea8600"; // Green for growing, orange for shrinking
          }
          
          return (
            <div
              key={`visual-${change.property}`}
              style={{
                flex: "1 1 calc(50% - 16px)",
                minWidth: "200px",
                padding: "12px",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e8eaed",
              }}
            >
              <div style={{ 
                marginBottom: "8px", 
                fontWeight: 500, 
                color: "#202124", 
                textTransform: "capitalize",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>{change.property}</span>
                <span style={{ 
                  fontSize: "13px",
                  backgroundColor: `${color}10`,
                  color: color,
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}>
                  {isPositive ? "+" : "-"}{Math.abs(change.percentage).toFixed(1)}%
                </span>
              </div>
              
              {/* Visual representation of the change */}
              <div style={{ 
                height: "8px",
                backgroundColor: "#f1f3f4",
                borderRadius: "4px",
                position: "relative",
                overflow: "hidden",
                marginBottom: "8px"
              }}>
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${Math.min(100, Math.abs(change.percentage))}%`,
                  backgroundColor: color,
                  opacity: 0.3,
                  borderRadius: "4px"
                }} />
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#5f6368" }}>
                <div>{change.valueA}px</div>
                <div>{change.valueB}px</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};