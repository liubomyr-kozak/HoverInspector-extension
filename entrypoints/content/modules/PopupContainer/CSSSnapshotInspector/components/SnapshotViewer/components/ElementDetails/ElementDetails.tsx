import React from "react";
import { ElementDetailsProps } from "../../types";
import { EmptyState } from "../../../../CSSSnapshotInspector.styled";
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
      {/*{state.styleDiffData || state.compareLeftData || state.compareRightData ? (*/}
      <ElementDiff
        diffData={state.styleDiffData}
        left={state.compareLeftData as any}
        right={state.compareRightData as any}
      />
      {/*) : null}*/}

      {/*// this is depricated do not touch*/}
      {/*// this is depricated do not touch*/}
      {/*<ElementXPathSelector />*/}
      {/**/}
      {/*// this is depricated do not touch*/}
    </>
  );
};
