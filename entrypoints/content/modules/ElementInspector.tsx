import EventListenerProvider from "@entrypoints/content/modules/EventListenerProvider.tsx";
import SelectedBox from "@entrypoints/content/modules/SelectedBox.tsx";
import HoveredLinesArea from "@entrypoints/content/modules/HoveredLinesArea.tsx";
import DistanceAndLabel from "@entrypoints/content/modules/DistanceAndLabel.tsx";
import HoveredBox from "@entrypoints/content/modules/HoveredBox.tsx";
import Popup from "@entrypoints/content/modules/Popup/Popup.tsx";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { resetElementSelection } from "@entrypoints/content/store/app/saga-action/app.saga.action";
import { setTargetLocked } from "@entrypoints/content/store/app/app.slice";
import AnyHoveredElementBox from "@entrypoints/content/modules/AnyHoveredElementBox.tsx";

export const ElementInspector = () => {
  const dispatch = useDispatch();

  // Closing the inspector drops the source element and unlocks the target, so reopening starts fresh
  useEffect(
    () => () => {
      resetElementSelection();
      dispatch(setTargetLocked(false));
    },
    [dispatch],
  );

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
