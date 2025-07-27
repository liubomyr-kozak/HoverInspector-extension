import React, { useEffect } from "react";
import { Button, Form, message, Spin } from "antd";
import { IconPlus } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

import { CustomFunction } from "../types";

// Import Redux actions and selectors
import {
  automationActions,
  selectActiveFunctionId,
  selectCurrentFunction,
  selectFunctionLoading,
  selectFunctions,
  selectIsEditingFunction,
} from "../../../../store/automation/automation.slice";

// Import saga actions
import { loadFunctionsWatcher } from "../../../../store/automation/automation.saga.action";

// Import custom hooks
import { useFunctionActions } from "../hooks/useFunctionActions";

import FunctionList from "../components/Function/FunctionList.tsx";
import AddFunctionForm from "../components/Function/AddFunctionForm.tsx";
import {
  PortalId,
  ScenarioPortalFooterButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalFooterButtons.tsx";
import { AutomationFooterContainer } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/styles.ts";

/**
 * FunctionsTab Component
 *
 * This component handles the Functions tab in the AutomationScenarios component.
 * It provides UI for creating, managing, and using custom JavaScript functions.
 */
const FunctionsTab: React.FC = () => {
  // Redux hooks
  const dispatch = useDispatch();
  const functions = useSelector(selectFunctions);
  const functionLoading = useSelector(selectFunctionLoading);
  const currentFunction = useSelector(selectCurrentFunction);
  const activeFunctionId = useSelector(selectActiveFunctionId);
  const isEditingFunction = useSelector(selectIsEditingFunction);

  // Custom hooks
  const { editFunction, deleteFunction, saveFunction } = useFunctionActions();

  // Form instance
  const [functionForm] = Form.useForm();

  // Load functions when component mounts
  useEffect(() => {
    dispatch(loadFunctionsWatcher.getPayload());
  }, [dispatch]);

  // Handler functions
  const addFunction = () => {
    dispatch(automationActions.resetFunctionForm());
    dispatch(automationActions.setIsEditingFunction(true));
  };

  const handleEditFunction = (id: string) => {
    editFunction(id, functionForm);
  };

  const handleSaveFunction = () => {
    functionForm
      .validateFields()
      .then((values) => {
        const functionToSave: CustomFunction = {
          title: values.title,
          code: values.code,
        };

        saveFunction(functionToSave, activeFunctionId);
      })
      .catch((error) => {
        console.error("Validation failed:", error);
        message.error("Please fill in all required fields.");
      });
  };

  const handleFunctionCancel = () => {
    dispatch(automationActions.resetFunctionForm());
  };
  return (
    <>
      {functionLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          <Spin tip="Loading functions..." size="large" />
        </div>
      ) : (
        <>
          {isEditingFunction ? (
            <div>
              <AddFunctionForm form={functionForm} currentFunction={currentFunction} />

              <ScenarioPortalFooterButtons portalId={PortalId.FUNCTIONS_TAB}>
                <AutomationFooterContainer>
                  <h3>{activeFunctionId ? "Edit" : "Add"} Function</h3>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button onClick={handleFunctionCancel}>Cancel</Button>
                    <Button type="primary" onClick={handleSaveFunction}>
                      Save Function
                    </Button>
                  </div>
                </AutomationFooterContainer>
              </ScenarioPortalFooterButtons>
            </div>
          ) : (
            <>
              <FunctionList
                functions={functions}
                activeFunctionId={activeFunctionId}
                onEdit={handleEditFunction}
                onDelete={deleteFunction}
              />

              <div style={{ marginTop: "16px" }}>
                <Button type="primary" onClick={addFunction} icon={<IconPlus size={18} />} style={{ width: "100%" }}>
                  Add Function
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default FunctionsTab;
