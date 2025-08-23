import React, { useMemo, useEffect } from "react";
import { EmotionShadowRoot } from "./components/EmotionShadowRoot";
import { StyleSheetManager } from "styled-components";
import { StyleProvider } from "@ant-design/cssinjs";
import { ToastContainer } from "react-toastify";
import toastifyStyles from "react-toastify/dist/ReactToastify.css?inline";

import AppController from "./modules/AppController/AppController.tsx";
import { LauncherManager } from "./modules/LauncherManager/LauncherManager.tsx";

import { FloatingPanelProvider } from "@entrypoints/shared/components/FloatingPanel/FloatingPanelProvider";

import { useSelector, useDispatch } from "react-redux";
import {
  loadScenariosWatcher,
  loadSchedulesWatcher,
  loadTriggersWatcher,
} from "@entrypoints/content/store/automation/automation.saga.action";
import { ElementInspector } from "@entrypoints/content/modules/ElementInspector";
import { INSPECTOR, POPUP_SUPPORT_TOOLS, RULER } from "@entrypoints/content/modules/Launcher/LauncherIcons";
import { ViewportRuler } from "@entrypoints/content/modules/PopupContainer/ViewportRuler";
import AutomationUserActionsHandler from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/AutomationUserActionsHandler.tsx";
import NotificationManager from "@entrypoints/content/modules/NotificationManager/NotificationManager.tsx";
import { TriggerScenarioEvaluator } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/TriggerForm/TriggerScenarioEvaluator.tsx";
import { ScheduleMonitor } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScheduleMonitor.tsx";
import { HighlightOverlayProvider } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext.tsx";

// import appStyles from "./app.css?inline";

export const App = ({ shadowRoot }) => {
  const dispatch = useDispatch();
  const { activeIcons = [] } = useSelector((state: any) => state?.app.launcher);

  const isPopupActive = useMemo(() => {
    return POPUP_SUPPORT_TOOLS.some((id) => activeIcons.includes(id));
  }, [activeIcons]);

  // Load schedule, scenario, and trigger data on app initialization for ScheduleMonitor and TriggerScenarioEvaluator
  useEffect(() => {
    dispatch(loadScenariosWatcher.getPayload());
    dispatch(loadSchedulesWatcher.getPayload());
    dispatch(loadTriggersWatcher.getPayload());
  }, [dispatch]);

  // Inject react-toastify CSS into shadow DOM
  useEffect(() => {
    if (shadowRoot && toastifyStyles) {
      // Check if styles are already injected
      const existingStyle = shadowRoot.querySelector("#react-toastify-styles");
      if (!existingStyle) {
        const styleElement = document.createElement("style");
        styleElement.id = "react-toastify-styles";
        styleElement.textContent = toastifyStyles;
        shadowRoot.appendChild(styleElement);
      }
    }
  }, [shadowRoot]);

  return (
    <StyleSheetManager target={shadowRoot}>
      <StyleProvider container={shadowRoot}>
        <EmotionShadowRoot shadowRoot={shadowRoot}>
          {/*<style>{appStyles}</style>*/}
          <AppController>
            <HighlightOverlayProvider>
              <FloatingPanelProvider>
                <NotificationManager />
                <TriggerScenarioEvaluator />
                <ScheduleMonitor />
                {/*<FeatureHandler>*/}
                {activeIcons.includes(INSPECTOR.id) && <ElementInspector />}
                {activeIcons.includes(RULER.id) && <ViewportRuler />}
                <LauncherManager />
                {/*</FeatureHandler>*/}
                <ToastContainer
                  position="top-center"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick={true}
                  rtl={false}
                  pauseOnFocusLoss={true}
                  draggable={true}
                  pauseOnHover={true}
                  theme="light"
                  style={{
                    zIndex: 9999999,
                  }}
                />
              </FloatingPanelProvider>
            </HighlightOverlayProvider>
          </AppController>
        </EmotionShadowRoot>
      </StyleProvider>
    </StyleSheetManager>
  );
};
