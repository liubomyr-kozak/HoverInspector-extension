import React from "react";
import { ElementDiffData } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/simpleDiff";

export const ElementDiff: React.FC<{
  diffData?: ElementDiffData;
  // Legacy props for backward compatibility
  left?: any;
  right?: any;
  config?: any;
}> = ({ diffData, left, right, config }) => {
  // Use simplified diff data if available
  const leftData = diffData?.leftData || { styles: left?.styles || {} };
  const rightData = diffData?.rightData || { styles: right?.styles || {} };
  const isPreFiltered = diffData?.changedOnly || false;

  console.log("ElementDiff received:", {
    diffData: diffData ? "exists" : "null",
    leftDataKeys: Object.keys(leftData).length,
    rightDataKeys: Object.keys(rightData).length,
    isPreFiltered,
    leftData: Object.keys(leftData).slice(0, 5), // First 5 keys for debugging
    rightData: Object.keys(rightData).slice(0, 5),
  });

  // Get all property keys
  const allPropertyKeys = Array.from(new Set([...Object.keys(leftData), ...Object.keys(rightData)])).sort();

  // If data is not pre-filtered, filter to only changed properties
  const propertiesToShow = isPreFiltered
    ? allPropertyKeys // Already filtered to changes only
    : allPropertyKeys; // Temporarily show ALL properties for debugging

  console.log("PropertiesToShow:", propertiesToShow.length, propertiesToShow.slice(0, 10));

  // Helper function to render property values in inline format
  const renderInlinePropertyValue = (value: any): string => {
    if (value === undefined || value === null) {
      return "—";
    }

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return "[]";
        }
        return `[${value.map(item => String(item)).join(", ")}]`;
      } else {
        // For objects, we'll handle them specially in the Row component
        // Return a placeholder that indicates this is an object
        return "[object]";
      }
    }

    // Handle primitive values
    return String(value);
  };

  // Helper function to check if a value is an object (not array, not null)
  const isObject = (value: any): boolean => {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  };

  const Row = ({
    label,
    leftValue,
    rightValue,
    highlight = true,
    changed: propChanged,
    changeType,
  }: {
    label: string;
    leftValue?: any;
    rightValue?: any;
    highlight?: boolean;
    changed?: boolean;
    changeType?: "added" | "removed" | "modified";
  }) => {
    const changed = propChanged !== undefined ? propChanged : JSON.stringify(leftValue) !== JSON.stringify(rightValue);

    // Check if both values are objects that should be displayed in tabular format
    if (isObject(leftValue) && isObject(rightValue)) {
      // Get all unique keys from both objects
      const leftKeys = Object.keys(leftValue || {});
      const rightKeys = Object.keys(rightValue || {});
      const allKeys = Array.from(new Set([...leftKeys, ...rightKeys])).sort();

      return (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontWeight: 600,
              color: "#334155",
              fontSize: 13,
              marginBottom: 4,
              padding: "6px 8px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
            }}
          >
            {label} Properties
          </div>
          <div style={{ paddingLeft: 16 }}>
            {allKeys.map((key) => {
              const leftVal = leftValue?.[key];
              const rightVal = rightValue?.[key];
              const leftValStr = leftVal !== undefined ? String(leftVal) : "—";
              const rightValStr = rightVal !== undefined ? String(rightVal) : "—";
              
              return (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 2,
                    padding: "4px 8px",
                    fontFamily: "monospace",
                    fontSize: 12,
                    background: "#fafbfc",
                    borderRadius: 4,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 500,
                      color: "#334155",
                      minWidth: "80px",
                      textAlign: "left",
                    }}
                  >
                    {key}
                  </span>
                  <span
                    style={{
                      color: "#0369a1",
                      fontWeight: 500,
                      minWidth: "60px",
                      textAlign: "right",
                    }}
                  >
                    {leftValStr}
                  </span>
                  <span
                    style={{
                      color: "#c2410c",
                      fontWeight: 500,
                      minWidth: "60px",
                      textAlign: "right",
                    }}
                  >
                    {rightValStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Handle non-object values (original behavior)
    const leftValueStr = renderInlinePropertyValue(leftValue);
    const rightValueStr = renderInlinePropertyValue(rightValue);

    // Enhanced styling based on change type
    let changeIcon = "";
    let textColor = "#334155";
    let backgroundColor = "#f8fafc";
    let borderColor = "#e2e8f0";

    if (changed && changeType) {
      switch (changeType) {
        case "added":
          changeIcon = " ✚";
          textColor = "#059669"; // green
          backgroundColor = "#d1fae5"; // light green
          borderColor = "#10b981"; // green border
          break;
        case "removed":
          changeIcon = " ✖";
          textColor = "#dc2626"; // red
          backgroundColor = "#fee2e2"; // light red
          borderColor = "#ef4444"; // red border
          break;
        case "modified":
          changeIcon = " ⚡";
          textColor = "#d97706"; // orange
          backgroundColor = "#fef3c7"; // light orange
          borderColor = "#f59e0b"; // orange border
          break;
        default:
          changeIcon = changed ? " ⚡" : "";
          textColor = changed ? "#dc2626" : "#334155";
          backgroundColor = changed ? "#fee2e2" : "#f8fafc";
          borderColor = changed ? "#ef4444" : "#e2e8f0";
      }
    } else {
      changeIcon = changed ? " ⚡" : "";
      textColor = changed ? "#dc2626" : "#334155";
      backgroundColor = changed ? "#fee2e2" : "#f8fafc";
      borderColor = changed ? "#ef4444" : "#e2e8f0";
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
          padding: "8px 12px",
          background: backgroundColor,
          border: `1px solid ${borderColor}`,
          borderRadius: 6,
          fontFamily: "monospace",
          fontSize: 12,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: textColor,
            minWidth: "fit-content",
          }}
        >
          {label}{changeIcon}
        </span>
        <span style={{ color: "#64748b" }}>(from snapshot 1 and 2)</span>
        <span
          style={{
            color: "#0369a1",
            fontWeight: 500,
            background: "#dbeafe",
            padding: "2px 6px",
            borderRadius: 3,
          }}
        >
          {leftValueStr}
        </span>
        <span
          style={{
            color: "#c2410c",
            fontWeight: 500,
            background: "#fed7aa",
            padding: "2px 6px",
            borderRadius: 3,
          }}
        >
          {rightValueStr}
        </span>
      </div>
    );
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 700, color: "#334155", marginBottom: 8 }}>
        Element Properties Differences{" "}
        {propertiesToShow.length > 0 ? `(${propertiesToShow.length} changes)` : "(No changes)"}
      </div>


      <div>
        <div style={{ fontWeight: 600, color: "#475569", marginBottom: 6 }}>Changed Properties</div>
        {propertiesToShow.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: "#16a34a",
              padding: "8px 12px",
              background: "#dcfce7",
              border: "1px solid #bbf7d0",
              borderRadius: 6,
              textAlign: "center",
            }}
          >
            ✓ No property differences found between snapshots
          </div>
        ) : (
          propertiesToShow.map((key) => {
            const leftValue = leftData[key];
            const rightValue = rightData[key];

            // Deep comparison for objects and arrays
            const isChanged = JSON.stringify(leftValue) !== JSON.stringify(rightValue);

            let changeType: "added" | "removed" | "modified" = "modified";
            if (leftValue === undefined || leftValue === null || leftValue === "") {
              changeType = "added";
            } else if (rightValue === undefined || rightValue === null || rightValue === "") {
              changeType = "removed";
            }

            return (
              <Row
                key={key}
                label={key}
                leftValue={leftValue}
                rightValue={rightValue}
                changed={isChanged}
                changeType={changeType}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
