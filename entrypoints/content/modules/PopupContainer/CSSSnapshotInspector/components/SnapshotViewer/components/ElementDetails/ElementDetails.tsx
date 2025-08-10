import React from "react";
import { ElementDetailsProps } from "../../types";
import { ElementSelector } from "./ElementSelector";
import { ElementProperties } from "./ElementProperties";
import { StyleProperties } from "./StyleProperties";
import { EmptyState } from "../../../../CSSSnapshotInspector.styled";
import { ElementXPathSelector } from "./ElementXPathSelector";
import { ElementDiff } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/SnapshotViewer/components/ElementDetails/ElementDiff/ElementDiff.tsx";
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
      {/*// this is depricated do not touch*/}
      {/*<ElementSelector selectedElementData={selectedElementData} />*/}
      {/*{state.styleDiffData || state.compareLeftData || state.compareRightData ? (*/}
      <ElementDiff
        diffData={state.styleDiffData}
        left={state.compareLeftData as any}
        right={state.compareRightData as any}
      />
      {/*) : null}*/}

      {/*// this is depricated do not touch*/}
      {/*<ElementProperties selectedElementData={selectedElementData} />*/}
      {/*// this is depricated do not touch*/}
      {/*<ElementXPathSelector />*/}
      {/**/}
      {/*// this is depricated do not touch*/}
      {/*<StyleProperties selectedElementStyles={selectedElementStyles} />*/}
    </>
  );
};
