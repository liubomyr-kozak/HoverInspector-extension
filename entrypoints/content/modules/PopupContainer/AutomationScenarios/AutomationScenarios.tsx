import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tabs } from "antd";
import { IconBolt, IconCalendar, IconCode, IconHistory, IconListDetails, IconServer } from "@tabler/icons-react";

import ScenariosListTab from "./tabs/ScenariosListTab.tsx";
import FunctionsTab from "./tabs/FunctionsTab";
import SchedulesTab from "./tabs/SchedulesTab";
import TriggersTab from "./tabs/TriggersTab";
import ExecutionHistoryTab from "./tabs/ExecutionHistoryTab";
import ServerTab from "./tabs/ServerTab";
import { useServerTabVisibility } from "./hooks/useServerTabVisibility";
import { useServerSettings } from "./hooks/useServerSettings";

import {
  automationActions,
  selectActiveScenarioId,
  selectActiveTab,
  selectExecuting,
  selectRecording,
} from "../../../store/automation/automation.slice";
import {
  loadExecutionHistoryWatcher,
  loadFunctionsWatcher,
  loadScenariosWatcher,
  loadSchedulesWatcher,
  loadTriggersWatcher,
} from "../../../store/automation/automation.saga.action";
import { onToggleFeatureMinimized } from "@entrypoints/content/store/app/saga-action/app.saga.action";
import { RecordingText } from "./styles";
import AutomationUserActionsHandler from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/AutomationUserActionsHandler.tsx";
import { PiVinylRecordDuotone } from "react-icons/pi";
import { HeaderPortalId, PortalModalHeader, PortalModalHeaderButtons } from "./components/ScenarioPortalHeaderButtons";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { AUTOMATION } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { TbWindowMinimize } from "react-icons/tb";
import { clearAllActiveIcons } from "@entrypoints/content/store/app/app.slice.ts";

export const AutomationScenarios: React.FC = () => {
  const dispatch = useDispatch();

  const activeTab = useSelector(selectActiveTab);
  const recording = useSelector(selectRecording);

  const activeScenarioId = useSelector(selectActiveScenarioId);
  const executing = useSelector(selectExecuting);
  const { isServerTabVisible, setServerTabVisible } = useServerTabVisibility();
  const { syncFunctions } = useServerSettings();

  const { activeIcons = [], iconOrder = [] } = useSelector((state: any) => state?.app.launcher);
  const isActive = React.useMemo(() => activeIcons.includes("automation"), [activeIcons]);

  const setActiveTab = (tab: string) => {
    dispatch(automationActions.setActiveTab(tab));
  };

  const handleToggleFeatureMinimized = (featureKey: string) => {
    dispatch(onToggleFeatureMinimized.getPayload({ featureKey }));
  };

  useEffect(() => {
    if (isActive) {
      dispatch(loadScenariosWatcher.getPayload());
      dispatch(loadFunctionsWatcher.getPayload());
      dispatch(loadSchedulesWatcher.getPayload());
      dispatch(loadTriggersWatcher.getPayload());
      dispatch(loadExecutionHistoryWatcher.getPayload());
    }
  }, [isActive, dispatch]);

  const hideServerTab = () => {
    setServerTabVisible(false);
    setActiveTab("scenarios");
  };

  // Switch away from the server tab when it is hidden
  useEffect(() => {
    if (!isServerTabVisible && activeTab === "server") {
      setActiveTab("scenarios");
    }
  }, [isServerTabVisible, activeTab]);

  // Switch away from functions tab if syncFunctions becomes false
  useEffect(() => {
    if (!syncFunctions && activeTab === "functions") {
      setActiveTab("scenarios");
    }
  }, [syncFunctions, activeTab]);

  useEffect(() => {
    if (executing && activeScenarioId) {
      dispatch(automationActions.expandOnlyScenario(activeScenarioId));
    }
  }, [executing, activeScenarioId]);

  if (!isActive) {
    return null;
  }

  // Tabs show their icon, and their name only when selected, so they all fit in the narrow panel
  const tabLabel = (key: string, Icon: React.ComponentType<{ size?: number }>, title: string) => (
    <span className="flex items-center" title={title} aria-label={title}>
      <Icon size={16} />
      {activeTab === key && <span style={{ marginLeft: "4px" }}>{title}</span>}
    </span>
  );

  return (
    <div className="w-full">
      <PortalModalHeader portalId={HeaderPortalId.SCENARIOS_TAB}>
        <FeatureTitle>
          <FeatureIcon icon={AUTOMATION.icon} isBetta />
          <FeatureTitleText title={AUTOMATION.title}>{AUTOMATION.title}</FeatureTitleText>
          {recording && (
            <RecordingText>
              rec
              <PiVinylRecordDuotone
                size={10}
                className="mr-1 animate-combined"
                style={{ color: "red", verticalAlign: "middle" }}
              />
            </RecordingText>
          )}
          <PortalModalHeaderButtons>
            <div
              className="ml-auto cursor-pointer p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
              onClick={() => {
                handleToggleFeatureMinimized("automation");
              }}
              title={`Minimize Automation`}
            >
              <TbWindowMinimize className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" />
            </div>
          </PortalModalHeaderButtons>
        </FeatureTitle>
      </PortalModalHeader>

      <Tabs
        activeKey={activeTab}
        tabBarGutter={16}
        onChange={setActiveTab}
        destroyOnHidden
        items={[
          {
            key: "scenarios",
            label: tabLabel("scenarios", IconListDetails, "Scenarios"),
            children: (
              <div className="w-full">
                <ScenariosListTab />
              </div>
            ),
          },
          ...(syncFunctions
            ? [
                {
                  key: "functions",
                  label: tabLabel("functions", IconCode, "Functions"),
                  children: (
                    <div className="w-full">
                      <FunctionsTab />
                    </div>
                  ),
                },
              ]
            : []),
          {
            key: "schedules",
            label: tabLabel("schedules", IconCalendar, "Schedules"),
            children: (
              <div className="w-full">
                <SchedulesTab />
              </div>
            ),
          },
          {
            key: "triggers",
            label: tabLabel("triggers", IconBolt, "Triggers"),
            children: (
              <div className="w-full">
                <TriggersTab />
              </div>
            ),
          },
          {
            key: "history",
            label: tabLabel("history", IconHistory, "History"),
            children: (
              <div className="w-full">
                <ExecutionHistoryTab />
              </div>
            ),
          },
          ...(isServerTabVisible
            ? [
                {
                  key: "server",
                  label: tabLabel("server", IconServer, "Server"),
                  children: (
                    <div className="w-full">
                      <ServerTab onHide={hideServerTab} />
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
};
