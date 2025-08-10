import React from "react";
import { ElementDetailsProps } from "../../types";
import { ElementSelector } from "./ElementSelector";
import { ElementProperties } from "./ElementProperties";
import { StyleProperties } from "./StyleProperties";
import { EmptyState } from "../../../../CSSSnapshotInspector.styled";
import { ElementXPathSelector } from "./ElementXPathSelector";

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
      <ElementSelector selectedElementData={selectedElementData} />
      <ElementProperties selectedElementData={selectedElementData} />
      <ElementXPathSelector />
      <StyleProperties selectedElementStyles={selectedElementStyles} />
    </>
  );
};
