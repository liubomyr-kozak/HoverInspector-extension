import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, message, Spin } from "antd";
import { IconPlus, IconRecordMail } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

import { Scenario, ScenarioStep } from "../types";

import {
  automationActions,
  ScenarioStatus,
  selectActiveScenarioId,
  selectCurrentStepIndex,
  selectCurrentSteps,
  selectExecuting,
  selectExecutionStatus,
  selectFunctions,
  selectIsEditingScenario,
  selectLoading,
  selectPaused,
  selectRecording,
  selectRecordingPaused,
  selectScenarios,
  selectStatus,
} from "../../../../store/automation/automation.slice";

import {
  deleteScenarioWatcher,
  loadScenariosWatcher,
  playScenarioWatcher,
  saveScenarioWatcher,
  startNewRecordingWatcher,
  stopRecordingWatcher,
  persistEditingStateWatcher,
  clearEditingStateWatcher,
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
import RecordingFooter from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/RecordingFooter.tsx";
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
  const currentSteps = useSelector(selectCurrentSteps);
  const isEditingScenario = useSelector(selectIsEditingScenario);
  const activeScenarioId = useSelector(selectActiveScenarioId);
  const scenarios = useSelector(selectScenarios);
  const recording = useSelector(selectRecording);

  const functions = useSelector(selectFunctions);
  const recordingPaused = useSelector(selectRecordingPaused);

  const [form] = Form.useForm();
  
  // State to track form data from AddScenarioForm
  const [scenarioFormData, setScenarioFormData] = useState<{
    title?: string;
    description?: string;
    category?: string;
    tags?: (string | undefined)[];
  }>({});

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

  // Handler to receive form data changes from AddScenarioForm
  const handleFormChange = (formData: {
    title?: string;
    description?: string;
    category?: string;
    tags?: (string | undefined)[];
  }) => {
    setScenarioFormData(formData);
  };

  const saveScenario = (stepsToSave) => {
    // Validate that required fields are present
    if (!scenarioFormData.title || scenarioFormData.title.trim() === '') {
      message.error("Please enter a title for the scenario.");
      return;
    }

    const scenarioToSave: Scenario = {
      title: scenarioFormData.title,
      description: scenarioFormData.description || '',
      category: scenarioFormData.category || '',
      tags: scenarioFormData.tags?.filter(tag => tag !== undefined) as string[] || [],
      repeat: 1,
      data: stepsToSave,
    };

    // Only pass id if it's not null (for existing scenarios)
    const payload = activeScenarioId
      ? { id: activeScenarioId, scenario: scenarioToSave }
      : { scenario: scenarioToSave };

    dispatch(saveScenarioWatcher.getPayload(payload));

    // Note: Don't clear editing state after saving to allow continued editing
    // clearEditingState() is called in handleCancel when user explicitly cancels editing
  };

  const handleCancel = () => {
    dispatch(automationActions.resetScenarioForm());
    // Clear the editing state from storage when canceling
    dispatch(clearEditingStateWatcher.getPayload());
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
    // Persist the updated steps to storage
    dispatch(persistEditingStateWatcher.getPayload());
  };

  const removeStep = (index: number) => {
    dispatch(automationActions.removeStep(index));
    // Persist the updated steps to storage
    dispatch(persistEditingStateWatcher.getPayload());
  };

  const updateStep = (index: number, field: keyof ScenarioStep, value: string) => {
    dispatch(automationActions.updateStep({ index, field, value }));
    // Persist the updated steps to storage
    dispatch(persistEditingStateWatcher.getPayload());
  };

  const reorderSteps = (fromIndex: number, toIndex: number) => {
    dispatch(automationActions.reorderSteps({ fromIndex, toIndex }));
    // Persist the updated steps to storage
    dispatch(persistEditingStateWatcher.getPayload());
  };

  const toggleRecordingPause = () => {
    dispatch(automationActions.setRecordingPaused(!recordingPaused));
  };

  const saveRecording = () => {
    // Switch to editing mode and set up for saving
    dispatch(automationActions.setStatus(ScenarioStatus.EDITING));
    dispatch(automationActions.setActiveTab("scenarios")); // Switch to scenarios tab

    // Explicitly persist the editing state to ensure it's available after page navigation
    dispatch(persistEditingStateWatcher.getPayload());

    saveScenario(currentSteps);
  };

  const isScenarioCreated = useMemo(() => !!Object.values(scenarios).length, [scenarios]);

  // currentSteps is now the single source of truth for all steps
  const activeScenarioSteps = currentSteps;

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
              style={{
                backgroundColor: recording ? "#ff4d4f" : "#e91e63",
                color: "white",
                fontWeight: "bold",
                flex: 3,
              }}
            >
              Start Recording
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
                    style={{
                      backgroundColor: recording ? "#ff4d4f" : "#e91e63",
                      color: "white",
                      padding: "8px 14px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Start Recording
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
    return (
      <>
        <AddScenarioForm
          currentSteps={activeScenarioSteps}
          functions={functions}
          onAddStep={addStep}
          onRemoveStep={removeStep}
          onUpdateStep={updateStep}
          onReorderSteps={reorderSteps}
          onFormChange={handleFormChange}
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
    );
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
