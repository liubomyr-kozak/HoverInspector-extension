import { call, put, select, takeLatest, takeEvery } from "redux-saga/effects";
import { automationActions } from "./automation.slice.ts";
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

// Load Scenarios
export const loadScenariosWatcher = sagaEnhancer(function* loadScenariosWatcherEnhancer() {
  try {
    yield put(automationActions.setLoading(true));
    const scenarios = yield call(getAllScenariosFromLocalStorage);
    yield put(automationActions.setScenarios(scenarios));
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
export const deleteScheduleWatcher = sagaEnhancer(function* deleteScheduleWatcher(action: { payload: string }) {
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
export const deleteTriggerWatcher = sagaEnhancer(function* deleteTriggerWatcher(action: { payload: string }) {
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
export const deleteExecutionHistoryWatcher = sagaEnhancer(function* deleteExecutionHistoryWatcher(action: {
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

// Create New Recording
export const startNewRecordingWatcher = sagaEnhancer(function* startNewRecording() {
  try {
    // Generate a unique ID for the new recording
    const newId = yield call(generateUniqueId);
    const scenarioId = `sc_${newId}`;

    // Create a timestamp for the title
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateString = now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    const title = `Recording ${dateString} ${timeString}`;

    // Create an empty scenario
    const newScenario: Scenario = {
      title,
      description: "",
      data: [],
      tags: [],
      category: "recording",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionSpeed: 1, // Default to medium speed (1x)
    };

    // Save to storage
    yield call(saveScenarioToLocalStorage, scenarioId, newScenario);
    yield call(saveScenarioToLocalStorage, scenarioId, newScenario);

    // Update Redux store
    yield put(automationActions.addScenario({ id: scenarioId, scenario: newScenario }));

    // Clear any previously recorded steps
    yield put(automationActions.setRecordedSteps([]));

    yield put(automationActions.setActiveScenarioId(scenarioId));

    // Set recording state to true
    yield put(automationActions.setRecording(true));

    console.log("New recording created:", title);
  } catch (error) {
    console.error("Error creating new recording:", error);
    // Handle error
  }
});

// Stop Recording
export const stopRecordingWatcher = sagaEnhancer(function* stopRecordingWatcher() {
  try {
    // Set recording state to false
    yield put(automationActions.setRecording(false));

    // Get the recorded steps
    const recordedSteps = yield select((state) => state.automation.recordedSteps);

    if (recordedSteps.length > 0) {
      console.log(`Recording stopped with ${recordedSteps.length} steps`);
    } else {
      console.log("Recording stopped with no steps");
    }
  } catch (error) {
    console.error("Error stopping recording:", error);
    // Handle error
  }
});

// Play Scenario
export const playScenarioWatcher = sagaEnhancer(function* playScenarioWatcher(action: {
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
      console.log(`Stopping scenario: ${scenario.title}`);

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
      console.log(`Stopping previous scenario before starting a new one`);

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

    console.log(
      `Playing scenario: ${scenario.title}${
        singleStep 
          ? ` (running only step ${startFromStep + 1})` 
          : startFromStep > 0 
            ? ` (starting from step ${startFromStep + 1})` 
            : ""
      }`,
    );

    // Execute steps directly within the playScenarioWatcher
    // Get the necessary state for execution
    const functions = yield select((state) => state.automation.functions);
    const executionSpeed = yield select((state) => state.automation.executionSpeed);
    const keepScenarioExpanded = yield select((state) => state.automation.keepScenarioExpanded);

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
      yield put(automationActions.setExecutionStatus(executionLog.status));

      // Handle different execution outcomes
      if (executionLog.status === ExecutionStatus.SUCCESS) {
        // If execution completed successfully, mark all steps as successful
        for (let idx = 0; idx < totalSteps; idx++) {
          yield put(automationActions.setStepStatus({ index: idx, status: ExecutionStatus.SUCCESS }));
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

      // Reset execution state when complete
      yield put(automationActions.setExecuting(false));
      yield put(automationActions.setCurrentStepIndex(-1));
      yield put(automationActions.setPendingSteps([]));

      // Don't collapse the scenario if user wants to keep it expanded
      if (!keepScenarioExpanded && activeScenarioId) {
        yield put(automationActions.setScenarioExpanded({ id: activeScenarioId, expanded: false }));
      }
      // Reset the keepScenarioExpanded flag for next execution
      yield put(automationActions.setKeepScenarioExpanded(false));
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

/**
 * Creates an event channel for the automation:getValue event
 */
function createGetValueChannel() {
  return eventChannel((emit) => {
    const getValueHandler = (event: CustomEvent) => {
      emit(event.detail);
    };

    // Add event listener
    document.addEventListener("automation:getValue", getValueHandler as EventListener);

    // Return unsubscribe function
    return () => {
      document.removeEventListener("automation:getValue", getValueHandler as EventListener);
    };
  });
}

/**
 * Saga to watch for get value events
 */
export const getValueWatcher = sagaEnhancer({
  actionType: "GET_VALUE_WATCHER",
  *saga() {
    // Create a channel to listen for the custom event
    const channel = yield call(createGetValueChannel);

    try {
      while (true) {
        // Wait for the next event
        const payload = yield take(channel);
        const { key, callback } = payload;

        // Get the value from the state
        const storedValues = yield select((state) => state.automation.storedValues);
        const value = storedValues[key];

        // Call the callback with the value
        if (typeof callback === "function") {
          callback(value);
        }

        console.log(`Retrieved value for key "${key}": ${value}`);
      }
    } finally {
      // Close the channel when the saga is cancelled
      channel.close();
    }
  },
});

/**
 * Creates an event channel for the automation:storeValue event
 */
function createStoreValueChannel() {
  return eventChannel((emit) => {
    const storeValueHandler = (event: CustomEvent) => {
      emit(event.detail);
    };

    // Add event listener
    document.addEventListener("automation:storeValue", storeValueHandler as EventListener);

    // Return unsubscribe function
    return () => {
      document.removeEventListener("automation:storeValue", storeValueHandler as EventListener);
    };
  });
}

/**
 * Saga to watch for store value events
 */
export const storeValueWatcher = sagaEnhancer({
  actionType: "STORE_VALUE_WATCHER",
  *saga() {
    // Create a channel to listen for the custom event
    const channel = yield call(createStoreValueChannel);

    try {
      while (true) {
        // Wait for the next event
        const payload = yield take(channel);

        // Generate a random key if none is provided
        let { key, value } = payload;
        if (!key || key.trim() === "") {
          key = `stored_value_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        }

        // Store the value in the state
        yield put(automationActions.setStoredValue({ key, value }));

        // Also store in localStorage for persistence and synchronous access
        try {
          const storedValues = JSON.parse(localStorage.getItem("automation_stored_values") || "{}");
          storedValues[key] = value;
          localStorage.setItem("automation_stored_values", JSON.stringify(storedValues));
        } catch (error) {
          console.error("Error storing value in localStorage:", error);
        }

        console.log(`Stored value "${value}" with key "${key}"`);
      }
    } finally {
      // Close the channel when the saga is cancelled
      channel.close();
    }
  },
});
