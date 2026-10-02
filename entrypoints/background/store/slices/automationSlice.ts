import { chromeActionsSlice } from "@entrypoints/core/libs/chromeActionsSlice.ts";
import { automationActions } from "../actions/automationActions.ts";

export const automationSlice = chromeActionsSlice(automationActions);

export const {
  getAllAutomationScenarios,
  getAutomationScenario,
  saveAutomationScenario,
  saveFunction,
  saveNotification,
  saveFolder,
  saveSchedule,
  saveTrigger,
  saveExecutionHistory,
  removeAutomationScenario,
  addStepToAutomationScenario,
  injectGeneratedScript,
  generateAndInjectCode,
} = automationSlice;
