import React from "react";
import { ElementDetailsProps } from "../../types";
import { ElementSelector } from "./ElementSelector";
import { ElementProperties } from "./ElementProperties";
import { StyleProperties } from "./StyleProperties";
import { EmptyState } from "../../../../CSSSnapshotInspector.styled";
import { ElementXPathSelector } from "./ElementXPathSelector";
import { ElementDiff } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/SnapshotViewer/components/ElementDetails/ElementDiff.tsx";
import { useSelector } from "react-redux";
import { RootState } from "@entrypoints/content/store/createStore.ts";

/**
 * Main component for displaying element details
 */
export const ElementDetails: React.FC<ElementDetailsProps> = ({
  selectedElement,
  selectedElementData,
  selectedElementStyles,
}) => {
  const state = useSelector((s: RootState) => s.elementDetails);

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

      {state.styleDiffData || state.compareLeftData || state.compareRightData ? (
        <div style={{ marginTop: 12, borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
          <ElementDiff 
            diffData={state.styleDiffData}
            left={state.compareLeftData as any} 
            right={state.compareRightData as any} 
          />
        </div>
      ) : null}
      <StyleProperties selectedElementStyles={selectedElementStyles} />
    </>
  );
};
