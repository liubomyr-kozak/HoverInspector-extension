import React from "react";
import { useDispatch } from "react-redux";
import { TbWindowMinimize } from "react-icons/tb";
import NoteTakingToolsApp from "./Note Taking Tools/src/App";
import {
  PortalModalHeader,
  PortalModalHeaderButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { NOTE_TAKING_TOOLS } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { onToggleFeatureMinimized } from "@entrypoints/content/store/app/saga-action/app.saga.action";
import { IconButton } from "@entrypoints/shared/components/IconButton";

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
          <FeatureTitleText title={NOTE_TAKING_TOOLS.title}>{NOTE_TAKING_TOOLS.title}</FeatureTitleText>
          <PortalModalHeaderButtons>
            <IconButton label="Minimize Note Taking Tools" onClick={() => dispatch(onToggleFeatureMinimized.getPayload({ featureKey: NOTE_TAKING_TOOLS.id }))}>
                <TbWindowMinimize />
              </IconButton>
          </PortalModalHeaderButtons>
        </FeatureTitle>
      </PortalModalHeader>
      <NoteTakingToolsApp />
    </div>
  );
};

export default NoteTakingToolsIntegration;
