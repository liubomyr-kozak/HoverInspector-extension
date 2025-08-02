import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import {
  automationActions,
  selectIsEditingScenario,
  selectActiveScenarioId,
  selectCurrentSteps,
} from "@entrypoints/content/store/automation/automation.slice";

const SCENARIO_EDITING_STATE_KEY = "automation_scenario_editing_state";

/**
 * Custom hook to persist scenario editing state across page navigations
 * @returns {Object} Object with functions to manage scenario editing state
 */
export const useScenarioEditingState = (): {
  persistEditingState: () => void;
  restoreEditingState: () => void;
  clearEditingState: () => void;
} => {
  const dispatch = useDispatch();
  const isEditingScenario = useSelector(selectIsEditingScenario);
  const activeScenarioId = useSelector(selectActiveScenarioId);
  const currentSteps = useSelector(selectCurrentSteps);

  // Persist the current editing state when it changes
  useEffect(() => {
    if (isEditingScenario) {
      persistEditingState();
    }
  }, [isEditingScenario, activeScenarioId, currentSteps]);

  // Restore editing state when the component mounts
  useEffect(() => {
    restoreEditingState();
  }, []);

  // Function to persist the current editing state to storage
  const persistEditingState = async () => {
    if (isEditingScenario) {
      try {
        await ExtensionStorageManager.saveAutomationScenario({
          id: SCENARIO_EDITING_STATE_KEY,
          scenario: {
            isEditing: true,
            activeScenarioId,
            currentSteps,
          },
        });
      } catch (error) {
        console.error("Error saving scenario editing state:", error);
      }
    }
  };

  // Function to restore editing state from storage
  const restoreEditingState = async () => {
    try {
      const editingState = await ExtensionStorageManager.getAutomationScenario(SCENARIO_EDITING_STATE_KEY);

      if (editingState && editingState.isEditing) {
        // Restore the editing state
        dispatch(automationActions.setIsEditingScenario(true));

        if (editingState.activeScenarioId) {
          dispatch(automationActions.setActiveScenarioId(editingState.activeScenarioId));
        }

        if (editingState.currentSteps && editingState.currentSteps.length > 0) {
          dispatch(automationActions.setCurrentSteps(editingState.currentSteps));
        }
      }
    } catch (error) {
      console.error("Error restoring scenario editing state:", error);
    }
  };

  // Function to clear the editing state from storage
  const clearEditingState = async () => {
    try {
      await ExtensionStorageManager.saveAutomationScenario({
        id: SCENARIO_EDITING_STATE_KEY,
        scenario: {
          isEditing: false,
          activeScenarioId: null,
          currentSteps: [],
        },
      });
    } catch (error) {
      console.error("Error clearing scenario editing state:", error);
    }
  };

  return {
    persistEditingState,
    restoreEditingState,
    clearEditingState,
  };
};
