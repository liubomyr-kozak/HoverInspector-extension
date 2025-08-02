import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tabs } from "antd";
import { IconBolt, IconCalendar, IconHistory, IconServer } from "@tabler/icons-react";

import ScenariosTab from "./tabs/ScenariosTab";
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
import { RecordingText, Title } from "./styles";
import AutomationUserActionsHandler from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/AutomationUserActionsHandler.tsx";
import { PiVinylRecordDuotone } from "react-icons/pi";

export const AutomationScenarios: React.FC = () => {
  const dispatch = useDispatch();

  const activeTab = useSelector(selectActiveTab);
  const recording = useSelector(selectRecording);

  const activeScenarioId = useSelector(selectActiveScenarioId);
  const executing = useSelector(selectExecuting);
  const { isServerTabVisible } = useServerTabVisibility();
  const { syncFunctions } = useServerSettings();

  const { activeIcons = [] } = useSelector((state: any) => state?.app.launcher);
  const isActive = React.useMemo(() => activeIcons.includes("automation"), [activeIcons]);

  const setActiveTab = (tab: string) => {
    dispatch(automationActions.setActiveTab(tab));
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

  // Switch away from functions tab if syncFunctions becomes false
  useEffect(() => {
    if (!syncFunctions && activeTab === "functions") {
      setActiveTab("scenarios");
    }
  }, [syncFunctions, activeTab, setActiveTab]);

  useEffect(() => {
    if (executing && activeScenarioId) {
      dispatch(automationActions.expandOnlyScenario(activeScenarioId));
    }
  }, [executing, activeScenarioId, dispatch]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="w-full">
      <Title>
        Automation
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
      </Title>

      {recording && <AutomationUserActionsHandler />}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        destroyOnHidden
        items={[
          {
            key: "scenarios",
            label: "Scenarios",
            children: (
              <div className="w-full">
                <ScenariosTab />
              </div>
            ),
          },
          ...(syncFunctions ? [{
            key: "functions",
            label: "Functions",
            children: (
              <div className="w-full">
                <FunctionsTab />
              </div>
            ),
          }] : []),
          {
            key: "schedules",
            label: (
              <span className="flex items-center">
                <IconCalendar size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Schedules
              </span>
            ),
            children: (
              <div className="w-full">
                <SchedulesTab />
              </div>
            ),
          },
          {
            key: "triggers",
            label: (
              <span className="flex items-center">
                <IconBolt size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Triggers
              </span>
            ),
            children: (
              <div className="w-full">
                <TriggersTab />
              </div>
            ),
          },
          {
            key: "history",
            label: (
              <span className="flex items-center">
                <IconHistory size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Execution History
              </span>
            ),
            children: (
              <div className="w-full">
                <ExecutionHistoryTab />
              </div>
            ),
          },
          ...(isServerTabVisible ? [{
            key: "server",
            label: (
              <span className="flex items-center">
                <IconServer size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Server
              </span>
            ),
            children: (
              <div className="w-full">
                <ServerTab />
              </div>
            ),
          }] : []),
        ]}
      />
    </div>
  );
};
