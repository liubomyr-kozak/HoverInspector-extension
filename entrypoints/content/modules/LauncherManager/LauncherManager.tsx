import React from "react";
import { useSelector } from "react-redux";
import { MinimizedLauncher } from "../MinimizedLauncher/MinimizedLauncher.tsx";
import Launcher from "../Launcher/Launcher";
import { PopupContainer } from "../PopupContainer/PopupContainer";
import { ElementDetailsPopup } from "../PopupContainer/CSSSnapshotInspector/components/ElementDetailsPopup";
import { NoteFormPopup } from "../PopupContainer/PageNotes/components/NoteFormPopup";
import AutomationUserActionsHandler from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/AutomationUserActionsHandler.tsx";
import { selectRecording } from "@entrypoints/content/store/automation/automation.slice.ts";

export const LauncherManager: React.FC = () => {
  const { minimizedFeatures = [] } = useSelector((state: any) => state?.app);
  const recording = useSelector(selectRecording);
  // Calculate isMinimized from minimizedFeatures - no separate source of truth
  const isMinimized = minimizedFeatures.length > 0;

  return (
    <>
      {/* Show either regular launcher or minimized main launcher */}
      {isMinimized ? <MinimizedLauncher /> : <Launcher />}
      <PopupContainer />
      {recording && <AutomationUserActionsHandler />}

      {/* ElementDetailsPopup rendered at same level as PopupContainer, outside container constraints */}
      <ElementDetailsPopup />
      
      {/* NoteFormPopup rendered at same level as PopupContainer, outside container constraints */}
      <NoteFormPopup />
    </>
  );
};
