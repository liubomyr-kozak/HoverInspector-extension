import React, { useEffect } from "react";
import { Button, Form, message, Spin } from "antd";
import { IconPlus } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// Import types
import { TriggerConfig } from "../types";

// Import Redux actions and selectors
import {
  automationActions,
  selectActiveTriggerID,
  selectCurrentTrigger,
  selectIsEditingTrigger,
  selectScenarios,
  selectTriggerLoading,
  selectTriggers
} from "../../../../store/automation/automation.slice";

// Import saga actions
import {
  loadScenariosWatcher,
  loadTriggersWatcher
} from "../../../../store/automation/automation.saga.action";

// Import custom hooks
import { useTriggerActions } from "../hooks/useTriggerActions";

// Import components
import TriggerList from "../components/TriggerList";
import TriggerForm from "../components/TriggerForm";

/**
 * TriggersTab Component
 *
 * This component handles the Triggers tab in the AutomationScenarios component.
 * It provides UI for creating, managing, and setting up triggers for automation scenarios.
 */
const TriggersTab: React.FC = () => {
  // Redux hooks
  const dispatch = useDispatch();
  const triggers = useSelector(selectTriggers);
  const triggerLoading = useSelector(selectTriggerLoading);
  const currentTrigger = useSelector(selectCurrentTrigger);
  const activeTriggerID = useSelector(selectActiveTriggerID);
  const isEditingTrigger = useSelector(selectIsEditingTrigger);
  const scenarios = useSelector(selectScenarios);

  // Custom hooks
  const { editTrigger, deleteTrigger, saveTrigger, toggleTriggerEnabled } = useTriggerActions();

  // Form instance
  const [triggerForm] = Form.useForm();

  // Load triggers and scenarios when component mounts
  useEffect(() => {
    dispatch(loadTriggersWatcher.getPayload());
    dispatch(loadScenariosWatcher.getPayload());
  }, [dispatch]);

  // Handler functions
  const addTrigger = () => {
    dispatch(automationActions.resetTriggerForm());
    dispatch(automationActions.setIsEditingTrigger(true));
  };

  const handleEditTrigger = (id: string) => {
    editTrigger(id, triggerForm);
  };

  const handleSaveTrigger = () => {
    triggerForm
      .validateFields()
      .then((values) => {
        const triggerToSave: TriggerConfig = {
          title: values.title,
          description: values.description,
          scenarioId: values.scenarioId,
          enabled: values.enabled,
          type: values.type,
          condition: values.condition,
        };

        saveTrigger(triggerToSave, activeTriggerID);
      })
      .catch((error) => {
        console.error("Validation failed:", error);
        message.error("Please fill in all required fields.");
      });
  };

  const handleTriggerCancel = () => {
    dispatch(automationActions.resetTriggerForm());
  };
  return (
    <>
      {triggerLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          <Spin tip="Loading triggers..." size="large" />
        </div>
      ) : (
        <>
          {isEditingTrigger ? (
            <div>
              <div
                style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <h3>{activeTriggerID ? "Edit" : "Add"} Trigger</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button onClick={handleTriggerCancel}>Cancel</Button>
                  <Button type="primary" onClick={handleSaveTrigger}>
                    Save Trigger
                  </Button>
                </div>
              </div>

              <TriggerForm form={triggerForm} currentTrigger={currentTrigger} scenarios={scenarios} />
            </div>
          ) : (
            <>
              <TriggerList
                triggers={triggers}
                activeTriggerID={activeTriggerID}
                onEdit={handleEditTrigger}
                onDelete={deleteTrigger}
                onToggleEnabled={toggleTriggerEnabled}
              />

              <div style={{ marginTop: "16px" }}>
                <Button type="primary" onClick={addTrigger} icon={<IconPlus size={18} />} style={{ width: "100%" }}>
                  Add Trigger
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default TriggersTab;
