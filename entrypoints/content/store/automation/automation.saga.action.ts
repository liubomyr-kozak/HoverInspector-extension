import { call, put, select, takeLatest, takeEvery, take } from "redux-saga/effects";
import { automationActions, ScenarioStatus } from "./automation.slice.ts";
import { sagaEnhancer } from "@entrypoints/core/libs/sagaEnhancer.ts";
import { eventChannel, END } from "redux-saga";
import {
  generateUniqueId,
  getAllExecutionHistoryFromLocalStorage,
  getAllFunctionsFromLocalStorage,
  getAllScenariosFromLocalStorage,
  getAllSchedulesFromLocalStorage,
  getAllTriggersFromLocalStorage,
  removeExecutionHistoryFromLocalStorage,
  removeFunctionFromLocalStorage,
  removeScenarioFromLocalStorage,
  removeScheduleFromLocalStorage,
  removeTriggerFromLocalStorage,
  saveExecutionHistoryToLocalStorage,
  saveFunctionToLocalStorage,
  saveScenarioToLocalStorage,
  saveScheduleToLocalStorage,
  saveTriggerToLocalStorage,
} from "../../modules/PopupContainer/AutomationScenarios/utils/storage.ts";
import { ExecutionStatus, Scenario } from "../../modules/PopupContainer/AutomationScenarios/types";
import {
  executeSteps,
  stopExecution,
} from "../../modules/PopupContainer/AutomationScenarios/utils/stepExecutor.saga.ts";
import { recordUrlNavigation } from "../../modules/PopupContainer/AutomationScenarios/utils/recordingUtils.ts";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import { injectScript } from "@entrypoints/shared/utils/scriptInjection.ts";

// Load Scenarios
export const loadScenariosWatcher = sagaEnhancer(function* loadScenariosWatcherEnhancer() {
  try {
    yield put(automationActions.setLoading(true));
    const scenarios = yield call(getAllScenariosFromLocalStorage);
    yield put(automationActions.setScenarios(scenarios));

    // Automatically restore editing state after scenarios are loaded
    yield put({ type: restoreEditingStateWatcher.actionType });
  } catch (error) {
    console.error("Error loading scenarios:", error);
    // Handle error
  } finally {
    yield put(automationActions.setLoading(false));
  }
});

// Load Functions
export const loadFunctionsWatcher = sagaEnhancer(function* loadFunctionsWatcherEnhancer() {
  try {
    yield put(automationActions.setFunctionLoading(true));
    const functions = yield call(getAllFunctionsFromLocalStorage);
    yield put(automationActions.setFunctions(functions));

    const settings = yield ExtensionStorageManager.getAutomationScenario("automation_server_settings");

    const serverSyncEnabled = settings?.serverUrl && settings?.saveToBackend && settings?.syncFunctions;

    if (serverSyncEnabled) {
      const response: any = yield fetch(`${settings.serverUrl}/generate-code`, {
        method: "GET",
        headers: { accept: "application/json", "Content-Type": "application/json" },
      });

      const data = yield response.json();

      injectScript({
        downloadUrl: data.downloadUrl,
        filename: data.filename,
        groupPrefix: "functions_",
      });
      // yield ExtensionStorageManager.injectGeneratedScript(settings.serverUrl);
      // yield ScriptInjectionService.generateAndInjectCode({
      //   serverUrl: settings.serverUrl,
      // });
    }
  } catch (error) {
    console.error("Error loading functions:", error);
    // Handle error
  } finally {
    yield put(automationActions.setFunctionLoading(false));
  }
});

// Load Schedules
export const loadSchedulesWatcher = sagaEnhancer(function* loadSchedulesWatcherEnhancer() {
  try {
    yield put(automationActions.setScheduleLoading(true));
    const schedules = yield call(getAllSchedulesFromLocalStorage);
    yield put(automationActions.setSchedules(schedules));
  } catch (error) {
    console.error("Error loading schedules:", error);
    // Handle error
  } finally {
    yield put(automationActions.setScheduleLoading(false));
  }
});

// Load Triggers
export const loadTriggersWatcher = sagaEnhancer(function* loadTriggersWatcherEnhancer() {
  try {
    yield put(automationActions.setTriggerLoading(true));
    const triggers = yield call(getAllTriggersFromLocalStorage);
    yield put(automationActions.setTriggers(triggers));
  } catch (error) {
    console.error("Error loading triggers:", error);
    // Handle error
  } finally {
    yield put(automationActions.setTriggerLoading(false));
  }
});

// Load Execution History
export const loadExecutionHistoryWatcher = sagaEnhancer(function* loadExecutionHistoryWatcherEnhancer() {
  try {
    yield put(automationActions.setExecutionHistoryLoading(true));
    const executionHistory = yield call(getAllExecutionHistoryFromLocalStorage);
    yield put(automationActions.setExecutionHistory(executionHistory));
  } catch (error) {
    console.error("Error loading execution history:", error);
    // Handle error
  } finally {
    yield put(automationActions.setExecutionHistoryLoading(false));
  }
});

// Save Scenario
export const saveScenarioWatcher = sagaEnhancer(function* saveScenarioWatcherEnhancer(action: {
  payload: { id?: string; scenario: Scenario };
}) {
  try {
    const { id, scenario } = action.payload;
    let scenarioId = id;

    // If no ID is provided, generate a new one
    if (!scenarioId) {
      const newId = yield call(generateUniqueId);
      scenarioId = `sc_${newId}`;
    }

    // Save to storage
    const success = yield call(saveScenarioToLocalStorage, scenarioId, scenario);

    if (success) {
      // Update Redux store
      if (!id) {
        // If no ID was provided, this is a new scenario, use addScenario
        yield put(automationActions.addScenario({ id: scenarioId, scenario }));
      } else {
        // If ID was provided, this is an existing scenario, use updateScenario
        yield put(automationActions.updateScenario({ id: scenarioId, scenario }));
      }
      yield put(automationActions.resetScenarioForm());

      // Clear the editing state when scenario is successfully saved
      yield put(clearEditingStateWatcher.getPayload());

      // Also clear the Redux state for current steps and status
      yield put(automationActions.setCurrentSteps([]));
      yield put(automationActions.setStatus(ScenarioStatus.IDLE));
      yield put(automationActions.setActiveScenarioId(null));
    } else {
      // Handle error
      console.error("Failed to save scenario");
    }
  } catch (error) {
    console.error("Error saving scenario:", error);
    // Handle error
  }
});

// Save Function
export const saveFunctionWatcher = sagaEnhancer(function* saveFunctionWatcher(action: {
  payload: { id?: string; func: any };
}) {
  try {
    const { id, func } = action.payload;
    let functionId = id;

    // If no ID is provided, generate a new one
    if (!functionId) {
      const newId = yield call(generateUniqueId);
      functionId = `fu_${newId}`;
    }

    // Save to storage
    const success = yield call(saveFunctionToLocalStorage, functionId, func);

    if (success) {
      // Update Redux store
      yield put(automationActions.updateFunction({ id: functionId, func }));
      yield put(automationActions.resetFunctionForm());
    } else {
      // Handle error
      console.error("Failed to save function");
    }
  } catch (error) {
    console.error("Error saving function:", error);
    // Handle error
  }
});

// Save Schedule
export const saveScheduleWatcher = sagaEnhancer(function* saveScheduleWatcher(action: {
  payload: { id?: string; schedule: any };
}) {
  try {
    const { id, schedule } = action.payload;
    let scheduleId = id;

    // If no ID is provided, generate a new one
    if (!scheduleId) {
      const newId = yield call(generateUniqueId);
      scheduleId = `sch_${newId}`;
    }

    // Save to storage
    const success = yield call(saveScheduleToLocalStorage, scheduleId, schedule);

    if (success) {
      // Update Redux store
      yield put(automationActions.updateSchedule({ id: scheduleId, schedule }));
      yield put(automationActions.resetScheduleForm());
    } else {
      // Handle error
      console.error("Failed to save schedule");
    }
  } catch (error) {
    console.error("Error saving schedule:", error);
    // Handle error
  }
});

// Save Trigger
export const saveTriggerWatcher = sagaEnhancer(function* saveTriggerWatcher(action: {
  payload: { id?: string; trigger: any };
}) {
  try {
    const { id, trigger } = action.payload;
    let triggerId = id;

    // If no ID is provided, generate a new one
    if (!triggerId) {
      const newId = yield call(generateUniqueId);
      triggerId = `tr_${newId}`;
    }

    // Save to storage
    const success = yield call(saveTriggerToLocalStorage, triggerId, trigger);

    if (success) {
      // Update Redux store
      yield put(automationActions.updateTrigger({ id: triggerId, trigger }));
      yield put(automationActions.resetTriggerForm());
    } else {
      // Handle error
      console.error("Failed to save trigger");
    }
  } catch (error) {
    console.error("Error saving trigger:", error);
    // Handle error
  }
});

// Save Execution History
export const saveExecutionHistoryWatcher = sagaEnhancer(function* saveExecutionHistoryWatcher(action: {
  payload: { id?: string; entry: any };
}) {
  try {
    const { id, entry } = action.payload;
    let historyId = id;

    // If no ID is provided, generate a new one
    if (!historyId) {
      const newId = yield call(generateUniqueId);
      historyId = `ex_hist_${newId}`;
    }

    // Save to storage
    const success = yield call(saveExecutionHistoryToLocalStorage, historyId, entry);

    if (success) {
      // Update Redux store
      yield put(automationActions.addExecutionHistory({ id: historyId, entry }));
    } else {
      // Handle error
      console.error("Failed to save execution history");
    }
  } catch (error) {
    console.error("Error saving execution history:", error);
    // Handle error
  }
});

// Delete Scenario
export const deleteScenarioWatcher = sagaEnhancer(function* deleteScenarioWatcher(action: { payload: string }) {
  try {
    const id = action.payload;

    // Delete from storage
    const success = yield call(removeScenarioFromLocalStorage, id);

    if (success) {
      // Update Redux store
      yield put(automationActions.removeScenario(id));
    } else {
      // Handle error
      console.error("Failed to delete scenario");
    }
  } catch (error) {
    console.error("Error deleting scenario:", error);
    // Handle error
  }
});

// Delete Function
export const deleteFunctionWatcher = sagaEnhancer(function* deleteFunctionWatcher(action: { payload: string }) {
  try {
    const id = action.payload;

    // Delete from storage
    const success = yield call(removeFunctionFromLocalStorage, id);

    if (success) {
      // Update Redux store
      yield put(automationActions.removeFunction(id));
    } else {
      // Handle error
      console.error("Failed to delete function");
    }
  } catch (error) {
    console.error("Error deleting function:", error);
    // Handle error
  }
});

// Delete Schedule
export const deleteScheduleWatcher = sagaEnhancer(function* deleteScheduleWatcherFn(action: { payload: string }) {
  try {
    const id = action.payload;

    // Delete from storage
    const success = yield call(removeScheduleFromLocalStorage, id);

    if (success) {
      // Update Redux store
      yield put(automationActions.removeSchedule(id));
    } else {
      // Handle error
      console.error("Failed to delete schedule");
    }
  } catch (error) {
    console.error("Error deleting schedule:", error);
    // Handle error
  }
});

// Delete Trigger
export const deleteTriggerWatcher = sagaEnhancer(function* deleteTriggerWatcherFn(action: { payload: string }) {
  try {
    const id = action.payload;

    // Delete from storage
    const success = yield call(removeTriggerFromLocalStorage, id);

    if (success) {
      // Update Redux store
      yield put(automationActions.removeTrigger(id));
    } else {
      // Handle error
      console.error("Failed to delete trigger");
    }
  } catch (error) {
    console.error("Error deleting trigger:", error);
    // Handle error
  }
});

// Delete Execution History
export const deleteExecutionHistoryWatcher = sagaEnhancer(function* deleteExecutionHistoryWatcherFn(action: {
  payload: string;
}) {
  try {
    const id = action.payload;

    // Delete from storage
    const success = yield call(removeExecutionHistoryFromLocalStorage, id);

    if (success) {
      // Update Redux store
      yield put(automationActions.removeExecutionHistory(id));
    } else {
      // Handle error
      console.error("Failed to delete execution history");
    }
  } catch (error) {
    console.error("Error deleting execution history:", error);
    // Handle error
  }
});

// Delete Multiple Execution History
export const deleteMultipleExecutionHistoryWatcher = sagaEnhancer(
  function* deleteMultipleExecutionHistoryWatcherFn(action: { payload: string[] }) {
    try {
      const ids = action.payload;
      const failedDeletes = [];

      // Delete each entry from storage
      for (const id of ids) {
        try {
          const success = yield call(removeExecutionHistoryFromLocalStorage, id);

          if (!success) {
            failedDeletes.push(id);
          }
        } catch (error) {
          console.error(`Error deleting execution history entry ${id}:`, error);
          failedDeletes.push(id);
        }
      }

      // Update Redux store with successfully deleted entries
      const successfulDeletes = ids.filter((id) => !failedDeletes.includes(id));
      if (successfulDeletes.length > 0) {
        yield put(automationActions.removeMultipleExecutionHistory(successfulDeletes));
      }

      if (failedDeletes.length > 0) {
        console.error(`Failed to delete ${failedDeletes.length} execution history entries`);
      }
    } catch (error) {
      console.error("Error deleting multiple execution history entries:", error);
    }
  },
);

// Create New Recording
// The scenario itself is created only when the user saves the recording (see saveScenarioWatcher),
// so cancelling or stopping a recording no longer leaves empty "Recording ..." scenarios behind.
export const startNewRecordingWatcher = sagaEnhancer(function* startNewRecordingFn() {
  try {
    yield put(automationActions.setActiveScenarioId(null));
    yield put(automationActions.setRecordingPaused(false));

    // Start with the current page so the scenario can be replayed from the right place
    const initialUrlStep = recordUrlNavigation(window.location.href);
    yield put(automationActions.setCurrentSteps([initialUrlStep]));

    // Set status to recording
    yield put(automationActions.setStatus(ScenarioStatus.RECORDING));

    // Persist the recording state to ensure it survives page refresh
    yield put({ type: persistEditingStateWatcher.actionType });
  } catch (error) {
    console.error("Error creating new recording:", error);
    // Handle error
  }
});

// Stop Recording
export const stopRecordingWatcher = sagaEnhancer(function* stopRecordingWatcherFn() {
  try {
    // Set status to idle
    yield put(automationActions.setStatus(ScenarioStatus.IDLE));

    // Clear the recording state from storage
    yield put({ type: clearEditingStateWatcher.actionType });

    // Get the current steps
    const currentSteps = yield select((state) => state.automation.currentSteps);

    if (currentSteps.length > 0) {
    } else {
    }
  } catch (error) {
    console.error("Error stopping recording:", error);
    // Handle error
  }
});

// Play Scenario
export const playScenarioWatcher = sagaEnhancer(function* playScenarioWatcherFn(action: {
  payload: { id: string; startFromStep?: number; singleStep?: boolean };
}) {
  try {
    const { id, startFromStep = 0, singleStep = false } = action.payload;

    // Get the scenario from state
    const scenarios = yield select((state) => state.automation.scenarios);
    const scenario = scenarios[id];
    const executing = yield select((state) => state.automation.executing);
    const activeScenarioId = yield select((state) => state.automation.activeScenarioId);

    if (!scenario) {
      console.error(`Scenario with ID ${id} not found`);
      return;
    }

    // If this scenario is already executing, treat this as a stop action
    if (executing && activeScenarioId === id) {
      // Set execution status to CANCELLED before resetting state
      yield put(automationActions.setExecutionStatus(ExecutionStatus.CANCELLED));

      // Signal to stop execution
      yield call(stopExecution);

      // Reset execution state
      yield put(automationActions.resetExecutionState());
      return;
    }

    // If any scenario is executing, stop it first
    if (executing) {
      // Set execution status to CANCELLED before resetting state
      yield put(automationActions.setExecutionStatus(ExecutionStatus.CANCELLED));

      // Signal to stop execution
      yield call(stopExecution);

      // Reset execution state
      yield put(automationActions.resetExecutionState());
    }

    // Set active scenario ID
    yield put(automationActions.setActiveScenarioId(id));

    // Set executing to true
    yield put(automationActions.setExecuting(true));

    // Set execution speed from scenario if available
    if (scenario.executionSpeed !== undefined) {
      yield put(automationActions.setExecutionSpeed(scenario.executionSpeed));
    }

    // Set the steps to execute, starting from the specified step
    const stepsToExecute = singleStep
      ? scenario.data.slice(startFromStep, startFromStep + 1) // Only one step for single step mode
      : startFromStep > 0
        ? scenario.data.slice(startFromStep)
        : scenario.data;
    yield put(automationActions.setPendingSteps(stepsToExecute));

    // Set the current step index to reflect the starting point
    if (startFromStep > 0) {
      yield put(automationActions.setCurrentStepIndex(startFromStep - 1));
    }

    // Execute steps directly within the playScenarioWatcher
    // Get the necessary state for execution
    const functions = yield select((state) => state.automation.functions);
    const executionSpeed = yield select((state) => state.automation.executionSpeed);

    // Check if we should proceed with execution
    let shouldExecute = true;
    let paused = yield select((state) => state.automation.paused);
    let pendingSteps = stepsToExecute;

    if (shouldExecute && !paused && pendingSteps.length > 0) {
      // Set execution status to running
      yield put(automationActions.setExecutionStatus(ExecutionStatus.RUNNING));

      // Clear any previous step statuses
      yield put(automationActions.clearStepStatuses());

      // Calculate total steps for status calculation
      const totalStepsInScenario = scenario.data.length;
      const repeatCount = scenario.repeat || 1;
      const totalSteps = totalStepsInScenario * Math.max(1, repeatCount);

      // Set initial status for all steps
      for (let idx = 0; idx < totalSteps; idx++) {
        // In single step mode, only set status for the target step
        if (singleStep) {
          if (idx === startFromStep) {
            yield put(automationActions.setStepStatus({ index: idx, status: ExecutionStatus.RUNNING }));
          }
        } else {
          // For normal execution, set status for all steps
          // Steps before the starting point are considered successful
          if (idx < startFromStep) {
            yield put(automationActions.setStepStatus({ index: idx, status: ExecutionStatus.SUCCESS }));
          }
          // The current step is running
          else if (idx === startFromStep) {
            yield put(automationActions.setStepStatus({ index: idx, status: ExecutionStatus.RUNNING }));
          }
          // Future steps are pending
          else {
            yield put(automationActions.setStepStatus({ index: idx, status: ExecutionStatus.PENDING }));
          }
        }
      }

      // Execute the steps
      const executionLog = yield call(
        executeSteps,
        pendingSteps,
        function* (index, logEntry) {
          // Update the UI after each step is completed
          const stepsCompleted = index + 1;
          const totalSteps = pendingSteps.length;
          const progress = Math.round((stepsCompleted / totalSteps) * 100);

          // Update current step index and progress
          yield put(automationActions.setCurrentStepIndex(index));
          yield put(automationActions.setExecutionProgress(progress));
          yield put(automationActions.setPendingSteps(pendingSteps.slice(index + 1)));

          // Calculate the actual step index considering the starting point
          const actualStepIndex = startFromStep + index;

          // Use the actual status from the log entry instead of hardcoding SUCCESS
          const stepStatus = logEntry?.status || ExecutionStatus.SUCCESS;
          yield put(automationActions.setStepStatus({ index: actualStepIndex, status: stepStatus }));

          // Set the next step to RUNNING if there is one
          if (actualStepIndex + 1 < totalSteps) {
            yield put(automationActions.setStepStatus({ index: actualStepIndex + 1, status: ExecutionStatus.RUNNING }));
          }

          // Check if execution should be stopped after each step
          const stillExecuting = yield select((state) => state.automation.executing);
          const nowPaused = yield select((state) => state.automation.paused);

          if (!stillExecuting) {
            // Signal to stop execution
            yield call(stopExecution);
            return;
          }

          if (nowPaused) {
            // Update the status of the current step to PAUSED
            if (actualStepIndex + 1 < totalSteps) {
              yield put(
                automationActions.setStepStatus({ index: actualStepIndex + 1, status: ExecutionStatus.PAUSED }),
              );
            }

            // Signal to stop execution
            yield call(stopExecution);
            return;
          }
        },
        functions,
        executionSpeed,
      );

      // Update the execution status based on the execution log
      // However, preserve the PAUSED status if it was explicitly set by user
      const currentExecutionStatus = yield select((state) => state.automation.executionStatus);
      const isPausedByUser = currentExecutionStatus === ExecutionStatus.PAUSED;

      // Only update the execution status if it's not already paused by user
      if (!isPausedByUser) {
        yield put(automationActions.setExecutionStatus(executionLog.status));
      } else {
        // If user paused, ensure the execution log also reflects the paused state
        if (executionLog.status !== ExecutionStatus.PAUSED) {
          executionLog.status = ExecutionStatus.PAUSED;
        }
      }

      // Handle different execution outcomes
      if (executionLog.status === ExecutionStatus.SUCCESS) {
        // If execution completed successfully
        if (singleStep) {
          // In single step mode, only mark the executed step as successful
          yield put(automationActions.setStepStatus({ index: startFromStep, status: ExecutionStatus.SUCCESS }));
        } else {
          // In normal execution, mark all steps as successful
          for (let idx = 0; idx < totalSteps; idx++) {
            yield put(automationActions.setStepStatus({ index: idx, status: ExecutionStatus.SUCCESS }));
          }
        }
      } else if (executionLog.status === ExecutionStatus.ERROR) {
        // If there was an error, set the error message and update step status
        const errorEntry = executionLog.entries.find((entry) => entry.status === ExecutionStatus.ERROR);
        yield put(automationActions.setExecutionError(errorEntry?.error || "An error occurred during execution"));

        // Update the status of the failed step
        if (errorEntry && errorEntry.stepIndex >= 0) {
          const actualStepIndex = startFromStep + errorEntry.stepIndex;
          yield put(
            automationActions.setStepStatus({
              index: actualStepIndex,
              status: ExecutionStatus.ERROR,
            }),
          );

          // Mark remaining steps as CANCELLED
          for (let idx = actualStepIndex + 1; idx < totalSteps; idx++) {
            yield put(automationActions.setStepStatus({ index: idx, status: ExecutionStatus.CANCELLED }));
          }
        }
      } else if (executionLog.status === ExecutionStatus.CANCELLED) {
        // If execution was cancelled, mark remaining steps as CANCELLED
        const currentIdx = yield select((state) => state.automation.currentStepIndex);
        const actualCurrentIdx = startFromStep + currentIdx;

        for (let idx = actualCurrentIdx + 1; idx < totalSteps; idx++) {
          yield put(automationActions.setStepStatus({ index: idx, status: ExecutionStatus.CANCELLED }));
        }
      } else if (executionLog.status === ExecutionStatus.PAUSED) {
        // If execution was paused, the current step should already be marked as PAUSED
        // from the step execution callback
      }

      // Save the execution log to execution history
      const historyEntry = {
        scenarioId: id,
        scenarioTitle: scenario.title,
        executionLog: executionLog,
        timestamp: new Date().toISOString(),
      };

      // Generate a unique ID for this execution history entry
      const historyId = yield call(generateUniqueId);
      const executionHistoryId = `ex_hist_${historyId}`;

      // Save the execution history entry
      yield put(saveExecutionHistoryWatcher.getPayload({ id: executionHistoryId, entry: historyEntry }));

      // Handle different execution outcomes for state reset
      if (executionLog.status === ExecutionStatus.SUCCESS) {
        // Reset execution state after successful completion to allow immediate re-execution
        yield put(automationActions.resetExecutionState());
        // Clear active scenario ID to prevent the next click from being treated as a stop action
        yield put(automationActions.setActiveScenarioId(null));
      } else if (executionLog.status === ExecutionStatus.PAUSED) {
        // For paused scenarios, don't reset execution state but ensure they remain expanded
        // Keep the scenario expanded so users can see the current state and resume
        if (activeScenarioId) {
          yield put(automationActions.setScenarioExpanded({ id: activeScenarioId, expanded: true }));
        }
      } else {
        // For error, cancelled, and other non-success states
        yield put(automationActions.setExecuting(false));
        yield put(automationActions.setCurrentStepIndex(-1));
        yield put(automationActions.setPendingSteps([]));

        // Don't collapse scenarios that were manually stopped (CANCELLED status)
        if (activeScenarioId && executionLog.status !== ExecutionStatus.CANCELLED) {
          yield put(automationActions.setScenarioExpanded({ id: activeScenarioId, expanded: false }));
        }
      }
    }
  } catch (error) {
    console.error("Error playing scenario:", error);
    // Handle error

    // Set error status and message
    yield put(automationActions.setExecutionStatus(ExecutionStatus.ERROR));
    yield put(automationActions.setExecutionError((error as any).message || "An error occurred during execution"));

    // Reset execution state
    yield put(automationActions.resetExecutionState());
  }
});

const SCENARIO_EDITING_STATE_KEY = "automation_scenario_editing_state";

/**
 * Saga to persist the current editing state to storage
 */
export const persistEditingStateWatcher = sagaEnhancer(function* persistEditingStateWatcherFn() {
  try {
    const status = yield select((state) => state.automation.status);

    // Persist state if either editing or recording
    if (status !== ScenarioStatus.IDLE) {
      const activeScenarioId = yield select((state) => state.automation.activeScenarioId);
      const currentSteps = yield select((state) => state.automation.currentSteps);

      yield call(ExtensionStorageManager.saveAutomationScenario, {
        id: SCENARIO_EDITING_STATE_KEY,
        scenario: {
          status: status,
          activeScenarioId,
          currentSteps,
        },
      });
    }
  } catch (error) {
    console.error("Error saving scenario editing state:", error);
  }
});

/**
 * Saga to restore editing state from storage
 */
export const restoreEditingStateWatcher = sagaEnhancer(function* restoreEditingStateWatcherFn() {
  try {
    const editingState = yield call(ExtensionStorageManager.getAutomationScenario, SCENARIO_EDITING_STATE_KEY);

    if (editingState && editingState.status && editingState.status !== ScenarioStatus.IDLE) {
      // Restore the unified status
      yield put(automationActions.setStatus(editingState.status));

      if (editingState.activeScenarioId) {
        yield put(automationActions.setActiveScenarioId(editingState.activeScenarioId));
      }

      if (editingState.currentSteps && editingState.currentSteps.length > 0) {
        yield put(automationActions.setCurrentSteps(editingState.currentSteps));
      }
    }
  } catch (error) {
    console.error("Error restoring scenario editing state:", error);
  }
});

/**
 * Saga to clear the editing state from storage
 */
export const clearEditingStateWatcher = sagaEnhancer(function* clearEditingStateWatcherFn() {
  try {
    yield call(ExtensionStorageManager.saveAutomationScenario, {
      id: SCENARIO_EDITING_STATE_KEY,
      scenario: {
        status: ScenarioStatus.IDLE,
        activeScenarioId: null,
        currentSteps: [],
      },
    });
  } catch (error) {
    console.error("Error clearing scenario editing state:", error);
  }
});
