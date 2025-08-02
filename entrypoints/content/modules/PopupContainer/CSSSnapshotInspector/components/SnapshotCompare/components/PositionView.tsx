import React from "react";
import { PositionViewProps } from "../types";

/**
 * Component for displaying position changes between snapshots
 */
export const PositionView: React.FC<PositionViewProps> = ({ selectedElementData }) => {
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {sortedChanges.map((change) => {
          const isPositive = change.difference > 0;
          const absPercentage = Math.abs(change.percentage).toFixed(1);
          const formattedDiff = isPositive ? `+${change.difference}px` : `${change.difference}px`;
          const formattedPercentage = isPositive ? `+${absPercentage}%` : `-${absPercentage}%`;
          
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
              key={change.property}
              style={{
                flex: "1 1 calc(50% - 16px)",
                minWidth: "200px",
                padding: "16px",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e8eaed",
              }}
            >
              <div style={{ marginBottom: "8px", fontWeight: 500, color: "#202124", textTransform: "capitalize" }}>
                {change.property}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "14px", color: "#5f6368" }}>Before:</div>
                  <div style={{ fontSize: "18px", fontWeight: 500 }}>{change.valueA}px</div>
                </div>
                
                <div style={{ 
                  fontSize: "24px", 
                  color: color,
                  padding: "0 16px"
                }}>
                  {isPositive ? "→" : "←"}
                </div>
                
                <div>
                  <div style={{ fontSize: "14px", color: "#5f6368" }}>After:</div>
                  <div style={{ fontSize: "18px", fontWeight: 500 }}>{change.valueB}px</div>
                </div>
              </div>
              
              <div style={{ 
                marginTop: "12px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px"
              }}>
                <div style={{ 
                  backgroundColor: `${color}10`,
                  color: color,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: 500
                }}>
                  {formattedDiff}
                </div>
                
                <div style={{ 
                  backgroundColor: `${color}10`,
                  color: color,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: 500
                }}>
                  {formattedPercentage}
                </div>
              </div>
              
              {/* Visual representation of the change */}
              <div style={{ 
                marginTop: "12px",
                height: "8px",
                backgroundColor: "#f1f3f4",
                borderRadius: "4px",
                position: "relative",
                overflow: "hidden"
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
            </div>
          );
        })}
      </div>
    </div>
  );
};