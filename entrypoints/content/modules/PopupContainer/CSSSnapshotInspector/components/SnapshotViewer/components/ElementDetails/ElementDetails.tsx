import React from "react";
import { ElementDetailsProps } from "../../types";
import { ElementHeader } from "./ElementHeader";
import { ElementSelector } from "./ElementSelector";
import { ElementProperties } from "./ElementProperties";
import { StyleProperties } from "./StyleProperties";
import { EmptyState } from "../../../../CSSSnapshotInspector.styled";

/**
 * Main component for displaying element details
 */
export const ElementDetails: React.FC<ElementDetailsProps> = ({
  selectedElement,
  selectedElementData,
  selectedElementStyles,
}) => {
  if (!selectedElement) {
    return (
      <EmptyState>
        <p>Select an element from the list to view its styles</p>
      </EmptyState>
    );
  }

  return (
    <>
      <ElementHeader selectedElementData={selectedElementData} />
      <ElementSelector selectedElementData={selectedElementData} />
      <ElementProperties selectedElementData={selectedElementData} />
      <StyleProperties selectedElementStyles={selectedElementStyles} />
    </>
  );
};
