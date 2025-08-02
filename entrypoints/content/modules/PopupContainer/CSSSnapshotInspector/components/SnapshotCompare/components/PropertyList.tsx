import React from "react";
import { ComparisonTable, TableHeader, TableCell } from "../../../CSSSnapshotInspector.styled";
import { ElementComparison, PropertyCategory, PropertyListProps } from "../types";
import { getPropertyCategory } from "../utils";

/**
 * Component for displaying a list of CSS properties with their changes
 */
export const PropertyList: React.FC<PropertyListProps> = ({
  selectedElementData,
  filteredProperties,
  highlightDifferences,
}) => {
  // Get color for property category
  const getCategoryColor = (category: PropertyCategory): string => {
    const colors = {
      Layout: "#4285f4", // Blue
      Typography: "#0f9d58", // Green
      Visual: "#db4437", // Red
      Table: "#f4b400", // Yellow
      List: "#9c27b0", // Purple
      Other: "#757575", // Gray
    };
    return colors[category] || colors.Other;
  };

  if (!selectedElementData || filteredProperties.length === 0) {
    return (
      <div style={{ padding: "16px", textAlign: "center" }}>
        <p>No relevant CSS properties found for this element or element is part of HTML header.</p>
        <p>Header elements and default styles are filtered out.</p>
      </div>
    );
  }

  return (
    <ComparisonTable>
      <thead>
        <tr>
          <TableHeader style={{ width: "30%" }}>Property</TableHeader>
          <TableHeader style={{ width: "35%" }}>Snapshot A</TableHeader>
          <TableHeader style={{ width: "35%" }}>Snapshot B</TableHeader>
        </tr>
      </thead>
      <tbody>
        {filteredProperties.map((change) => {
          const category = getPropertyCategory(change.property);
          const categoryColor = getCategoryColor(category);
          const { valueA, valueB } = change.valueA && change.valueB 
            ? highlightDifferences(change.valueA, change.valueB)
            : { valueA: change.valueA, valueB: change.valueB };

          return (
            <tr key={change.property}>
              <TableCell
                style={{
                  borderLeft: `3px solid ${categoryColor}`,
                  fontFamily: "monospace",
                  fontSize: "13px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{change.property}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "1px 4px",
                      backgroundColor: `${categoryColor}20`,
                      color: categoryColor,
                      borderRadius: "2px",
                      marginLeft: "4px",
                    }}
                  >
                    {category}
                  </span>
                </div>
              </TableCell>
              <TableCell
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  backgroundColor: change.changeType === "removed" ? "rgba(197, 34, 31, 0.05)" : "transparent",
                }}
              >
                {valueA || (
                  <span style={{ color: "#9aa0a6", fontStyle: "italic" }}>
                    {change.changeType === "added" ? "Not present" : "null"}
                  </span>
                )}
              </TableCell>
              <TableCell
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  backgroundColor: change.changeType === "added" ? "rgba(19, 115, 51, 0.05)" : "transparent",
                }}
              >
                {valueB || (
                  <span style={{ color: "#9aa0a6", fontStyle: "italic" }}>
                    {change.changeType === "removed" ? "Not present" : "null"}
                  </span>
                )}
              </TableCell>
            </tr>
          );
        })}
      </tbody>
    </ComparisonTable>
  );
};