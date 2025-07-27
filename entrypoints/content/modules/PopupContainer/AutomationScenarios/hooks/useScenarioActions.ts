import { useDispatch, useSelector } from "react-redux";
import { Form } from "antd";
import { Scenario } from "../types";
import { automationActions, selectScenarios } from "@entrypoints/content/store/automation/automation.slice.ts";
import {
  deleteScenarioWatcher,
  playScenarioWatcher,
  saveScenarioWatcher,
} from "@entrypoints/content/store/automation/automation.saga.action";

/**
 * Custom hook that provides scenario management functions
 * This eliminates props drilling by allowing components to directly access these functions
 */
export const useScenarioActions = () => {
  const dispatch = useDispatch();
  const scenarios = useSelector(selectScenarios);

  /**
   * Play a scenario
   * @param id The ID of the scenario to play
   * @param startFromStep Optional step index to start from
   */
  const playScenario = (id: string, startFromStep?: number) => {
    dispatch(playScenarioWatcher.getPayload({ id, startFromStep }));
  };

  /**
   * Edit a scenario
   * @param id The ID of the scenario to edit
   * @param form The form instance to set values on
   */
  const editScenario = (id: string, form?: Form<any>) => {
    const scenario = scenarios[id];

    if (!scenario) {
      console.error(`Scenario with id ${id} not found`);
      return;
    }

    dispatch(automationActions.setCurrentSteps(scenario.data));
    dispatch(automationActions.setActiveScenarioId(id));
    dispatch(automationActions.setIsEditingScenario(true));

    // Set execution speed from scenario if available
    if (scenario.executionSpeed !== undefined) {
      dispatch(automationActions.setExecutionSpeed(scenario.executionSpeed));
    }

    if (form) {
      form.setFieldsValue({
        title: scenario.title,
        description: scenario.description || "",
        category: scenario.category || undefined,
        tags: scenario.tags || [],
        repeat: scenario.repeat || 0,
      });
    }
  };

  /**
   * Delete a scenario
   * @param id The ID of the scenario to delete
   */
  const deleteScenario = (id: string) => {
    dispatch(deleteScenarioWatcher.getPayload(id));
  };

  /**
   * Duplicate a scenario
   * @param id The ID of the scenario to duplicate
   */
  const duplicateScenario = (id: string) => {
    const scenario = scenarios[id];

    if (!scenario) {
      console.error(`Scenario with id ${id} not found`);
      return;
    }

    // Generate a concise, user-friendly English title
    let newTitle = scenario.title;

    // Remove any existing "Copy of" prefixes to avoid chaining them
    if (newTitle.startsWith("Copy of ")) {
      newTitle = newTitle.substring(8);
    }

    // Ensure the title is not too long (max 50 characters)
    if (newTitle.length > 50) {
      newTitle = newTitle.substring(0, 47) + "...";
    }

    const duplicatedScenario = {
      ...scenario,
      title: `Copy of ${newTitle}`,
      // Ensure executionSpeed is copied to the new scenario
      executionSpeed: scenario.executionSpeed,
    };

    dispatch(saveScenarioWatcher.getPayload({ scenario: duplicatedScenario }));
  };

  return {
    playScenario,
    editScenario,
    deleteScenario,
    duplicateScenario,
  };
};
