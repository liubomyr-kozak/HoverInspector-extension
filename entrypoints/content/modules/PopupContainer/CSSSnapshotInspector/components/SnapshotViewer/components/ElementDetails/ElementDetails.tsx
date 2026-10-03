import React from "react";
import { ElementDetailsProps } from "../../types";
import { EmptyState } from "../../../../CSSSnapshotInspector.styled";
import { ElementDiff } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/SnapshotViewer/components/ElementDetails/ElementDiff/ElementDiff.tsx";
import { useSelector } from "react-redux";
import { RootState } from "@entrypoints/content/store/createStore.ts";
import { ElementDiffSingleColumn } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/SnapshotViewer/components/ElementDetails/ElementDiff/ElementDiffSingleColumn.tsx";

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

  // Use Redux state if available, otherwise fallback to props
  const diffData = state.styleDiffData;
  const leftData = state.compareLeftData || selectedElementData;
  const rightData = state.compareRightData || selectedElementStyles;
  // e.g. div#c3.card
  const selector = state.tagName
    ? `${state.tagName.toLowerCase()}${state.id ? `#${state.id}` : ""}${(state.classes || []).map((c) => `.${c}`).join("")}`
    : undefined;

  return (
    <>
      {/*<ElementDiff diffData={diffData} left={leftData as any} right={rightData as any} />*/}

      <ElementDiffSingleColumn left={leftData} right={rightData} selector={selector} />
    </>
  );
};
