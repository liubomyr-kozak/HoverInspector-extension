import React, { useEffect, useMemo } from "react";
import { Button, Form, Spin } from "antd";
import { IconPlus, IconRecordMail } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// import { Scenario } from "../types";

import {
  automationActions,
  selectActiveScenarioId,
  selectIsEditingScenario,
  selectLoading,
  selectRecording,
  selectScenarios,
} from "../../../../store/automation/automation.slice";

import {
  loadScenariosWatcher,
  startNewRecordingWatcher,
  stopRecordingWatcher,
} from "../../../../store/automation/automation.saga.action";

import ScenarioList from "../components/ScenarioList.tsx";
import AddScenarioForm from "../components/AddScenarioForm";
import {
  ScenarioPortalFooterButtons,
  PortalId,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalFooterButtons.tsx";
import {
  HeaderPortalId,
  PortalModalHeader,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons.tsx";
import { AutomationFooterContainer } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/styles.ts";

/**
 * ScenariosTab Component
 *
 * This component handles the Scenarios tab in the AutomationScenarios component.
 * It provides UI for creating, managing, and executing automation scenarios.
 */
const ScenariosListTab: React.FC = () => {
  const dispatch = useDispatch();
  const loading = useSelector(selectLoading);
  const isEditingScenario = useSelector(selectIsEditingScenario);
  const activeScenarioId = useSelector(selectActiveScenarioId);
  const scenarios = useSelector(selectScenarios);
  const recording = useSelector(selectRecording);

  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(loadScenariosWatcher.getPayload());
  }, []);

  const startRecording = () => {
    if (recording) {
      dispatch(stopRecordingWatcher.getPayload());
    } else {
      dispatch(startNewRecordingWatcher.getPayload());
    }
  };

  const isScenarioCreated = useMemo(() => !!Object.values(scenarios).length, [scenarios]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <Spin tip="Loading scenarios..." size="large" />
      </div>
    );
  }

  if (!recording && !isEditingScenario) {
    return (
      <div className="flex flex-col">
        <ScenarioList />

        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          {!isScenarioCreated && (
            <Button
              onClick={startRecording}
              icon={
                <span className="flex items-center">
                  <IconRecordMail size={18} />
                </span>
              }
              type="primary"
              danger
              style={{ fontWeight: 600, flex: 3 }}
            >
              Start recording
            </Button>
          )}
          {isScenarioCreated && (
            <ScenarioPortalFooterButtons portalId={PortalId.INITIAL}>
              <AutomationFooterContainer>
                <div className="flex justify-end w-full">
                  <Button
                    onClick={startRecording}
                    icon={
                      <span className="flex items-center">
                        <IconRecordMail size={18} />
                      </span>
                    }
                    type="primary"
                    danger
                    style={{ fontWeight: 600 }}
                  >
                    Start recording
                  </Button>
                </div>
              </AutomationFooterContainer>
            </ScenarioPortalFooterButtons>
          )}
        </div>

      </div>
    );
  }

  if (isEditingScenario || recording) {
    return <AddScenarioForm />;
  }

  // isEditingScenario
  return (
    <div>
      {/* Inject header for scenario editing */}
      <PortalModalHeader portalId={HeaderPortalId.SCENARIOS_TAB}>
        {activeScenarioId ? "Edit Scenario" : "Add Scenario"}
      </PortalModalHeader>
    </div>
  );
};

export default ScenariosListTab;
