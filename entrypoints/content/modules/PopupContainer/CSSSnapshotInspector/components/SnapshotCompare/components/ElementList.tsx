import React, { useMemo } from "react";
import { IconInfoCircle } from "@tabler/icons-react";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";
import { ElementListProps } from "../types";

/**
 * Component for displaying a list of elements with changes
 * Only shows elements that don't have view changes (hasMoved property)
 */
export const ElementList: React.FC<ElementListProps> = ({
  filteredElements,
  selectedElement,
  setSelectedElement,
  scrollToAndHighlightElement,
  stylesA,
  stylesB,
  elementRefs,
}) => {
  // Filter out elements with view changes (hasMoved property)
  const elementsWithoutViewChanges = useMemo(() => {
    return filteredElements.filter(item => !item.hasMoved);
  }, [filteredElements]);

  return (
    <>
      {elementsWithoutViewChanges.map((item) => {
        // Count changes by type
        const addedCount = item.changes.filter((c) => c.changeType === "added").length;
        const removedCount = item.changes.filter((c) => c.changeType === "removed").length;
        const changedCount = item.changes.filter((c) => c.changeType === "changed").length;
        const positionChangeCount = item.positionChanges?.length || 0;

        // Get element details from extracted styles
        const element = stylesA[item.path] || stylesB[item.path];
        const classes = element?.classes?.join(".") || "";

        // Create a more descriptive element name
        const elementName = `${element?.tagName.toLowerCase()}${element?.id ? `#${element.id}` : ""}${
          classes ? `.${classes}` : ""
        }`;

        // Create a summary of changes
        const changeSummary = [
          addedCount > 0 ? `${addedCount} added` : "",
          removedCount > 0 ? `${removedCount} removed` : "",
          changedCount > 0 ? `${changedCount} modified` : "",
          positionChangeCount > 0 ? `${positionChangeCount} position changes` : "",
        ]
          .filter(Boolean)
          .join(", ");

        return (
          <div
            key={item.path}
            ref={(el) => (elementRefs.current[item.path] = el)}
            onClick={() => {
              setSelectedElement(item.path);
              scrollToAndHighlightElement(item.path);
            }}
            style={{
              padding: "8px",
              cursor: "pointer",
              backgroundColor:
                selectedElement === item.path
                  ? item.changeType === "added"
                    ? "rgba(19, 115, 51, 0.1)"
                    : item.changeType === "removed"
                    ? "rgba(197, 34, 31, 0.1)"
                    : item.changeType === "changed"
                    ? "rgba(234, 134, 0, 0.1)"
                    : "#e8f0fe"
                  : "transparent",
              borderRadius: "4px",
              marginBottom: "8px",
              borderLeft: `3px solid ${
                item.changeType === "added"
                  ? "#137333"
                  : item.changeType === "removed"
                  ? "#c5221f"
                  : item.changeType === "changed"
                  ? "#ea8600"
                  : "transparent"
              }`,
              boxShadow: selectedElement === item.path ? "0 2px 4px rgba(0,0,0,0.15)" : "0 1px 2px rgba(0,0,0,0.1)",
              position: "relative",
              transition: "all 0.2s ease",
              zIndex: selectedElement === item.path ? 1 : "auto",
            }}
          >
            <div
              style={{
                fontWeight: 500,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <div
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "90%",
                }}
              >
                {elementName}
              </div>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#5f6368",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "70%",
                }}
              >
                {item.path}
              </div>
              <Tooltip content={`${changeSummary}`}>
                <div style={{ display: "flex", alignItems: "center", cursor: "help" }}>
                  <IconInfoCircle size={14} />
                </div>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </>
  );
};