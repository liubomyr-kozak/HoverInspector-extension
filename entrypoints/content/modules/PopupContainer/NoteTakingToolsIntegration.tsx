import React from "react";
import { useDispatch } from "react-redux";
import { TbWindowMinimize } from "react-icons/tb";
import NoteTakingToolsApp from "./Note Taking Tools/src/App";
import {
  PortalModalHeader,
  PortalModalHeaderButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureTitle } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { NOTE_TAKING_TOOLS } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { onToggleFeatureMinimized } from "@entrypoints/content/store/app/saga-action/app.saga.action";

const HEADER_PORTAL_ID = "note-taking-tools-header";

/**
 * Redux-integrated wrapper for the Note Taking Tools
 * This component provides the Redux store context to the Note Taking Tools app
 * and ensures proper integration with the extension's state management system.
 */
export const NoteTakingToolsIntegration: React.FC = () => {
  const dispatch = useDispatch();

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <PortalModalHeader portalId={HEADER_PORTAL_ID}>
        <FeatureTitle>
          <FeatureIcon icon={NOTE_TAKING_TOOLS.icon} />
          {NOTE_TAKING_TOOLS.title}
          <PortalModalHeaderButtons>
            <div
              className="ml-auto cursor-pointer p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
              onClick={() => dispatch(onToggleFeatureMinimized.getPayload({ featureKey: NOTE_TAKING_TOOLS.id }))}
              title="Minimize Note Taking Tools"
            >
              <TbWindowMinimize className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" />
            </div>
          </PortalModalHeaderButtons>
        </FeatureTitle>
      </PortalModalHeader>
      <NoteTakingToolsApp />
    </div>
  );
};

export default NoteTakingToolsIntegration;
