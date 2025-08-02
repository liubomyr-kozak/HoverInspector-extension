import React from "react";

/**
 * Highlight differences in text values
 */
export const highlightDifferences = (valueA: string, valueB: string) => {
  if (!valueA || !valueB) return { valueA, valueB };

  // For color values, show a color preview with improved contrast
  if (
    valueA.startsWith("#") ||
    valueA.startsWith("rgb") ||
    valueA.startsWith("hsl") ||
    valueB.startsWith("#") ||
    valueB.startsWith("rgb") ||
    valueB.startsWith("hsl")
  ) {
    return {
      valueA: (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: valueA,
              border: "1px solid #dadce0",
              borderRadius: "4px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          />
          <span>{valueA}</span>
        </div>
      ),
      valueB: (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: valueB,
              border: "1px solid #dadce0",
              borderRadius: "4px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          />
          <span style={{ 
            fontWeight: valueA !== valueB ? "bold" : "normal",
            color: valueA !== valueB ? "#ea8600" : "inherit"
          }}>
            {valueB}
          </span>
        </div>
      ),
    };
  }

  // For numeric values with units, highlight the number part if different
  const numericRegex = /^(-?\d*\.?\d+)(\w+|%)$/;
  const matchA = valueA.match(numericRegex);
  const matchB = valueB.match(numericRegex);

  if (matchA && matchB && matchA[2] === matchB[2]) {
    // Same unit
    if (matchA[1] !== matchB[1]) {
      // Different value
      // Calculate the difference to show
      const numA = parseFloat(matchA[1]);
      const numB = parseFloat(matchB[1]);
      const diff = numB - numA;
      const diffText = diff > 0 ? `+${diff}${matchA[2]}` : `${diff}${matchA[2]}`;
      
      return {
        valueA: (
          <span>
            {matchA[1]}
            <span style={{ opacity: 0.7 }}>{matchA[2]}</span>
          </span>
        ),
        valueB: (
          <span>
            <span style={{ fontWeight: "bold", color: "#ea8600" }}>
              {matchB[1]}
              <span style={{ opacity: 0.7 }}>{matchB[2]}</span>
            </span>
            <span style={{ 
              marginLeft: "8px", 
              fontSize: "12px", 
              color: diff > 0 ? "#137333" : "#c5221f",
              backgroundColor: diff > 0 ? "rgba(19, 115, 51, 0.1)" : "rgba(197, 34, 31, 0.1)",
              padding: "2px 4px",
              borderRadius: "2px"
            }}>
              {diffText}
            </span>
          </span>
        ),
      };
    }
  }

  // For other values, if they're similar but not identical, try to highlight the differences
  if (valueA.length > 3 && valueB.length > 3) {
    // Simple difference highlighting for similar strings
    const maxLength = Math.max(valueA.length, valueB.length);
    if (Math.abs(valueA.length - valueB.length) / maxLength < 0.3) {
      // If lengths are within 30% of each other
      return {
        valueA: valueA,
        valueB: (
          <div>
            <span style={{ fontWeight: "bold", color: "#ea8600" }}>{valueB}</span>
            {valueA !== valueB && (
              <span style={{ 
                marginLeft: "8px", 
                fontSize: "12px", 
                color: "#1a73e8",
                backgroundColor: "rgba(26, 115, 232, 0.1)",
                padding: "2px 4px",
                borderRadius: "2px"
              }}>
                Changed
              </span>
            )}
          </div>
        ),
      };
    }
  }

  return { valueA, valueB };
};