import React from "react";
import { ComparisonTable, TableHeader, TableCell } from "../../../CSSSnapshotInspector.styled";
import { ElementComparison, PositionChange, PositionChangesProps } from "../types";

/**
 * Component for displaying position changes between snapshots
 */
export const PositionChanges: React.FC<PositionChangesProps> = ({ selectedElementData }) => {
  if (!selectedElementData || !selectedElementData.positionChanges || selectedElementData.positionChanges.length === 0) {
    return (
      <div style={{ padding: "16px", textAlign: "center" }}>
        <p>No position changes detected for this element.</p>
      </div>
    );
  }

  return (
    <ComparisonTable>
      <thead>
        <tr>
          <TableHeader style={{ width: "20%" }}>Property</TableHeader>
          <TableHeader style={{ width: "25%" }}>Snapshot A</TableHeader>
          <TableHeader style={{ width: "25%" }}>Snapshot B</TableHeader>
          <TableHeader style={{ width: "15%" }}>Difference</TableHeader>
          <TableHeader style={{ width: "15%" }}>Change %</TableHeader>
        </tr>
      </thead>
      <tbody>
        {selectedElementData.positionChanges.map((change: PositionChange) => {
          const isPositive = change.difference > 0;
          const absPercentage = Math.abs(change.percentage);
          const formattedPercentage = absPercentage.toFixed(1) + "%";

          return (
            <tr key={change.property}>
              <TableCell
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {change.property}
              </TableCell>
              <TableCell
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                }}
              >
                {change.valueA}px
              </TableCell>
              <TableCell
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#1a73e8",
                }}
              >
                {change.valueB}px
              </TableCell>
              <TableCell
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  color: isPositive ? "#137333" : "#c5221f",
                  fontWeight: Math.abs(change.difference) > 5 ? "bold" : "normal",
                }}
              >
                {isPositive ? "+" : ""}
                {change.difference.toFixed(1)}px
              </TableCell>
              <TableCell
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  color: isPositive ? "#137333" : "#c5221f",
                  fontWeight: absPercentage > 10 ? "bold" : "normal",
                  backgroundColor:
                    absPercentage > 50
                      ? isPositive
                        ? "rgba(19, 115, 51, 0.1)"
                        : "rgba(197, 34, 31, 0.1)"
                      : "transparent",
                }}
              >
                {isPositive ? "+" : ""}
                {formattedPercentage}
              </TableCell>
            </tr>
          );
        })}
      </tbody>
    </ComparisonTable>
  );
};