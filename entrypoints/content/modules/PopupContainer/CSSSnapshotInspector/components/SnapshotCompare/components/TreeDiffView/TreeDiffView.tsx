import React, { useState, useMemo } from "react";
import { IconInfoCircle, IconX, IconEye, IconEyeOff } from "@tabler/icons-react";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";
import { ElementListProps } from "../../types";
import { ElementDetails } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/SnapshotViewer/components/ElementDetails";
import { DetailsOverlay, DetailsHeader, CloseButton } from "./TreeDiffView.styled";
import { useNodeDetails } from "./hooks/useNodeDetails";
import { DOMTreeRenderer } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/DOMTreeRenderer";
import { useTreeComparison } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/hooks/useTreeComparison";
import { buildDOMTree } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/domTreeBuilder";

/**
 * Component for displaying a hierarchical tree view of elements with GitHub-style diff indicators
 * Shows component changes with [+] and [-] indicators and allows expanding style diffs
 */
export const TreeDiffView: React.FC<ElementListProps> = ({
  filteredElements,
  selectedElement,
  setSelectedElement,
  scrollToAndHighlightElement,
  stylesA,
  stylesB,
  elementRefs,
}) => {
  const { nodeDetailsPath, nodeDetailsData, showNodeDetails, closeNodeDetails } = useNodeDetails(stylesA, stylesB);

  // Use the new comparison hook
  const { comparison, summary, treeB } = useTreeComparison({
    stylesA,
    stylesB,
    options: {
      comparePositions: true,
      compareAttributes: true,
    },
  });

  // Custom change indicator for diff display
  const renderChangeIndicator = (element: any) => {
    // Check if element has changes
    const addedElement = comparison.added.find((e) => e.path === element.path);
    const removedElement = comparison.removed.find((e) => e.path === element.path);
    const modifiedElement = comparison.modified.find((e) => e.path === element.path);

    if (addedElement) {
      return <span style={{ color: "#22863a", marginLeft: "8px" }}>[+]</span>;
    }
    if (removedElement) {
      return <span style={{ color: "#d73a49", marginLeft: "8px" }}>[-]</span>;
    }
    if (modifiedElement) {
      const { styleChanges, attributeChanges } = modifiedElement;
      return (
        <span style={{ marginLeft: "8px", fontSize: "11px" }}>
          {styleChanges.length > 0 && <span style={{ color: "#f9c513" }}>[~{styleChanges.length}]</span>}
          {attributeChanges.length > 0 && <span style={{ color: "#6f42c1" }}>[↔{attributeChanges.length}]</span>}
        </span>
      );
    }
    return null;
  };

  // Custom styling for changed elements
  const getElementStyle = (element: any) => {
    const addedElement = comparison.added.find((e) => e.path === element.path);
    const removedElement = comparison.removed.find((e) => e.path === element.path);
    const modifiedElement = comparison.modified.find((e) => e.path === element.path);

    if (addedElement) {
      return {
        backgroundColor: "#e6ffec",
        borderLeft: "3px solid #22863a",
      };
    }
    if (removedElement) {
      return {
        backgroundColor: "#ffebe9",
        borderLeft: "3px solid #d73a49",
        opacity: 0.6,
      };
    }
    if (modifiedElement) {
      return {
        backgroundColor: "#fff8c5",
        borderLeft: "3px solid #f9c513",
      };
    }
    return {};
  };

  const handleElementSelect = (path: string, element: any) => {
    setSelectedElement?.(path);
    scrollToAndHighlightElement?.(path);
  };

  return (
    <div className="relative">
      <DOMTreeRenderer
        tree={treeB}
        selectedElement={selectedElement}
        onElementSelect={handleElementSelect}
        onShowDetails={(path, element) => showNodeDetails(path, element)}
        renderChangeIndicator={renderChangeIndicator}
        getElementStyle={getElementStyle}
      />

      {nodeDetailsPath && nodeDetailsData && (
        <DetailsOverlay onClick={(e) => e.stopPropagation()}>
          <DetailsHeader>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Element Details</h3>
            <CloseButton onClick={closeNodeDetails}>
              <IconX size={16} />
            </CloseButton>
          </DetailsHeader>

          <ElementDetails
            selectedElement={selectedElement as unknown as number}
            selectedElementData={nodeDetailsData}
            selectedElementStyles={Object.entries(nodeDetailsData.styles || {})
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([property, value]) => [property, String(value)])}
          />
        </DetailsOverlay>
      )}
    </div>
  );
};
