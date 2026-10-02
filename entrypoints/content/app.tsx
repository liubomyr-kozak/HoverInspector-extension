import React, { useMemo, useEffect } from "react";
import { EmotionShadowRoot } from "./components/EmotionShadowRoot";
import { StyleSheetManager } from "styled-components";
import { StyleProvider } from "@ant-design/cssinjs";
import { ToastContainer } from "react-toastify";
import toastifyStyles from "react-toastify/dist/ReactToastify.css?inline";

import AppController from "./modules/AppController/AppController.tsx";
import { LauncherManager } from "./modules/LauncherManager/LauncherManager.tsx";

import { FloatingModalProvider } from "@entrypoints/shared/components/FloatingModal/FloatingModalProvider";

import { useSelector, useDispatch } from "react-redux";
import {
  loadScenariosWatcher,
  loadSchedulesWatcher,
  loadTriggersWatcher,
  resumeExecutionWatcher,
} from "@entrypoints/content/store/automation/automation.saga.action";
import { ElementInspector } from "@entrypoints/content/modules/ElementInspector";
import { INSPECTOR, POPUP_SUPPORT_TOOLS, RULER } from "@entrypoints/content/modules/Launcher/LauncherIcons";
import { ViewportRuler } from "@entrypoints/content/modules/PopupContainer/ViewportRuler";
import NotificationManager from "@entrypoints/content/modules/NotificationManager/NotificationManager.tsx";
import { TriggerScenarioEvaluator } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/TriggerForm/TriggerScenarioEvaluator.tsx";
import { ScheduleMonitor } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScheduleMonitor.tsx";
import { HighlightOverlayProvider } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext.tsx";
import { VisibleNotesProvider } from "@entrypoints/content/modules/PopupContainer/PageNotes/VisibleNotesProvider/VisibleNotesProvider.tsx";

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
    // Continue a scenario that was playing when this page was loaded (navigation, new tab)
    dispatch(resumeExecutionWatcher.getPayload());
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
          <AppController>
            <HighlightOverlayProvider>
              <FloatingModalProvider>
                <VisibleNotesProvider>
                  <NotificationManager />
                  <TriggerScenarioEvaluator />
                  <ScheduleMonitor />
                  {activeIcons.includes(INSPECTOR.id) && <ElementInspector />}
                  {activeIcons.includes(RULER.id) && <ViewportRuler />}
                  <LauncherManager />
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
                </VisibleNotesProvider>
              </FloatingModalProvider>
            </HighlightOverlayProvider>
          </AppController>
        </EmotionShadowRoot>
      </StyleProvider>
    </StyleSheetManager>
  );
};
