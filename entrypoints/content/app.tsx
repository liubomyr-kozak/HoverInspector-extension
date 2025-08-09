import React, { useMemo } from "react";
import { EmotionShadowRoot } from "./components/EmotionShadowRoot";
import { StyleSheetManager } from "styled-components";
import { StyleProvider } from "@ant-design/cssinjs";

import AppController from "./modules/AppController/AppController.tsx";
import Launcher from "./modules/Launcher/Launcher.tsx";
import { PopupContainer } from "./modules/PopupContainer/PopupContainer.tsx";

import { NewModalProvider } from "@entrypoints/shared/components/NewModal/NewModalProvider";

import "./app.css";
import { useSelector } from "react-redux";
import { ElementInspector } from "@entrypoints/content/modules/ElementInspector";
import { INSPECTOR, POPUP_SUPPORT_TOOLS, RULER } from "@entrypoints/content/modules/Launcher/LauncherIcons";
import { ViewportRuler } from "@entrypoints/content/modules/PopupContainer/ViewportRuler";
import AutomationUserActionsHandler from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/AutomationUserActionsHandler.tsx";
import NotificationManager from "@entrypoints/content/modules/NotificationManager/NotificationManager.tsx";
import { TriggerScenarioEvaluator } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/TriggerForm/TriggerScenarioEvaluator.tsx";

export const App = ({ shadowRoot }) => {
  const { activeIcons = [] } = useSelector((state: any) => state?.app.launcher);

  const isPopupActive = useMemo(() => {
    return POPUP_SUPPORT_TOOLS.some((id) => activeIcons.includes(id));
  }, [activeIcons]);

  return (
    <StyleSheetManager target={shadowRoot}>
      <StyleProvider container={shadowRoot}>
        <EmotionShadowRoot shadowRoot={shadowRoot}>
          <AppController>
            <NewModalProvider>
              <NotificationManager />
              <TriggerScenarioEvaluator />
              {/*<FeatureHandler>*/}
              {activeIcons.includes(INSPECTOR.id) && <ElementInspector />}
              {activeIcons.includes(RULER.id) && <ViewportRuler />}

              <Launcher />
              {isPopupActive && <PopupContainer />}
              {/*</FeatureHandler>*/}
            </NewModalProvider>
          </AppController>
        </EmotionShadowRoot>
      </StyleProvider>
    </StyleSheetManager>
  );
};
