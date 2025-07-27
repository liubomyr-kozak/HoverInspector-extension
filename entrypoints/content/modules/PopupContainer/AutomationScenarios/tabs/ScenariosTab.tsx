import React, { useEffect } from "react";
import { Button, Form, message, Spin } from "antd";
import { IconPlus, IconRecordMail } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

import { Scenario, ScenarioStep } from "../types";

import {
  automationActions,
  selectActiveScenarioId,
  selectCurrentStepIndex,
  selectCurrentSteps,
  selectExecuting,
  selectExecutionStatus,
  selectFunctions,
  selectIsEditingScenario,
  selectLoading,
  selectPaused,
  selectRecordedSteps,
  selectRecording,
  selectRecordingPaused,
  selectScenarios,
} from "../../../../store/automation/automation.slice";

import {
  deleteScenarioWatcher,
  loadScenariosWatcher,
  playScenarioWatcher,
  saveScenarioWatcher,
  startNewRecordingWatcher,
  stopRecordingWatcher,
} from "../../../../store/automation/automation.saga.action";

import ScenarioList from "../components/ScenarioList.tsx";
import AddScenarioForm from "../components/AddScenarioForm";
import {
  ScenarioPortalFooterButtons,
  PortalId,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalFooterButtons.tsx";
import RecordingFooter from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/RecordingFooter.tsx";

/**
 * ScenariosTab Component
 *
 * This component handles the Scenarios tab in the AutomationScenarios component.
 * It provides UI for creating, managing, and executing automation scenarios.
 */
const ScenariosTab: React.FC = () => {
  const dispatch = useDispatch();
  const loading = useSelector(selectLoading);
  const currentSteps = useSelector(selectCurrentSteps);
  const isEditingScenario = useSelector(selectIsEditingScenario);
  const activeScenarioId = useSelector(selectActiveScenarioId);
  const scenarios = useSelector(selectScenarios);
  const recording = useSelector(selectRecording);
  const recordedSteps = useSelector(selectRecordedSteps);

  const functions = useSelector(selectFunctions);
  const recordingPaused = useSelector(selectRecordingPaused);

  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(loadScenariosWatcher.getPayload());
  }, []);

  useEffect(() => {
    if (activeScenarioId && scenarios[activeScenarioId]) {
      form.setFieldsValue({
        title: scenarios[activeScenarioId].title,
      });
    }
  }, [scenarios, activeScenarioId]);

  const saveScenario = (recordedSteps) => {
    form
      .validateFields()
      .then((values) => {
        const scenarioToSave: Scenario = {
          title: values.title,
          description: values.description,
          category: values.category,
          tags: values.tags,
          repeat: values.repeat || 0,
          data: recordedSteps,
        };

        // Only pass id if it's not null (for existing scenarios)
        const payload = activeScenarioId
          ? { id: activeScenarioId, scenario: scenarioToSave }
          : { scenario: scenarioToSave };

        dispatch(saveScenarioWatcher.getPayload(payload));
      })
      .catch((error) => {
        console.error("Validation failed:", error);
        message.error("Please fill in all required fields.");
      });
  };

  const handleCancel = () => {
    dispatch(automationActions.resetScenarioForm());
  };

  const startRecording = () => {
    if (recording) {
      dispatch(stopRecordingWatcher.getPayload());
    } else {
      dispatch(startNewRecordingWatcher.getPayload());
    }
  };

  const addStep = () => {
    dispatch(automationActions.addStep());
  };

  const removeStep = (index: number) => {
    dispatch(automationActions.removeStep(index));
  };

  const updateStep = (index: number, field: keyof ScenarioStep, value: string) => {
    dispatch(automationActions.updateStep({ index, field, value }));
  };

  const reorderSteps = (fromIndex: number, toIndex: number) => {
    dispatch(automationActions.reorderSteps({ fromIndex, toIndex }));
  };

  const toggleRecordingPause = () => {
    dispatch(automationActions.setRecordingPaused(!recordingPaused));
  };

  const saveRecording = () => {
    // First set isEditingScenario to true and set currentSteps to recordedSteps
    dispatch(automationActions.setCurrentSteps([])); // Clear current steps first
    dispatch(automationActions.setCurrentSteps(recordedSteps));
    dispatch(automationActions.setRecording(false));
    dispatch(automationActions.setIsEditingScenario(true));
    dispatch(automationActions.setActiveTab("scenarios")); // Switch to scenarios tab

    debugger;

    saveScenario(recordedSteps);
  };

  const activeScenarioSteps = recording ? recordedSteps : currentSteps;

  return (
    <>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          <Spin tip="Loading scenarios..." size="large" />
        </div>
      ) : (
        <>
          {isEditingScenario ? (
            <div>
              <div
                style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <h3>{activeScenarioId ? "Edit" : "Add"} Scenario</h3>
              </div>
            </div>
          ) : (
            !recording && (
              <div className="flex flex-col">
                <ScenarioList />

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <Button
                    onClick={startRecording}
                    icon={
                      <span className="flex items-center">
                        <IconRecordMail size={18} />
                      </span>
                    }
                    style={{
                      backgroundColor: recording ? "#ff4d4f" : "#e91e63",
                      color: "white",
                      fontWeight: "bold",
                      flex: 3,
                    }}
                  >
                    Start Recording
                  </Button>
                </div>
              </div>
            )
          )}
          {(isEditingScenario || recording) && (
            <>
              <AddScenarioForm
                form={form}
                currentSteps={activeScenarioSteps}
                functions={functions}
                onAddStep={addStep}
                onRemoveStep={removeStep}
                onUpdateStep={updateStep}
                onReorderSteps={reorderSteps}
              />
              <ScenarioPortalFooterButtons portalId={recording ? PortalId.RECORDING : PortalId.SCENARIOS_TAB}>
                <RecordingFooter
                  isPaused={recordingPaused}
                  onCancel={handleCancel}
                  onPauseToggle={toggleRecordingPause}
                  onSave={saveRecording}
                />
              </ScenarioPortalFooterButtons>
            </>
          )}
        </>
      )}
    </>
  );
};

export default ScenariosTab;
