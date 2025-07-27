import EventListenerProvider from "@entrypoints/content/modules/EventListenerProvider.tsx";
import SelectedBox from "@entrypoints/content/modules/SelectedBox.tsx";
import HoveredLinesArea from "@entrypoints/content/modules/HoveredLinesArea.tsx";
import DistanceAndLabel from "@entrypoints/content/modules/DistanceAndLabel.tsx";
import HoveredBox from "@entrypoints/content/modules/HoveredBox.tsx";
import Popup from "@entrypoints/content/modules/Popup/Popup.tsx";
import React from "react";
import AnyHoveredElementBox from "@entrypoints/content/modules/AnyHoveredElementBox.tsx";

export const ElementInspector = () => {
  return (
    <>
      <EventListenerProvider />
      <SelectedBox />
      {/*<SettingsIconBox/>*/}
      <HoveredLinesArea />
      <DistanceAndLabel />
      <HoveredBox />
      <AnyHoveredElementBox />
      <Popup />
    </>
  );
};
