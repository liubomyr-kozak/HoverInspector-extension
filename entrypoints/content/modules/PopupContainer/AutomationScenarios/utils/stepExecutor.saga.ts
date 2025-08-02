/**
 * Step Executor Saga Implementation
 *
 * This module provides a saga-based implementation for executing automation steps.
 * It replaces the class-based StepExecutor with a more functional approach using redux-saga.
 *
 * Key features:
 * - Uses redux-saga effects (call, put, select, delay, race) for better control flow
 * - Manages state through Redux actions instead of class properties
 * - Provides proper cancellation handling using race and cancelled effects
 * - Implements comprehensive error handling with try/catch blocks and fallback mechanisms
 * - Follows functional programming principles for better testability and maintainability
 *
 * The main entry point is the executeSteps saga, which orchestrates the execution of multiple steps.
 * Individual step execution is handled by type-specific sagas (executeClickStep, executeHoverStep, etc.).
 * State management is handled through Redux actions and selectors.
 */
import { call, put, select, delay, cancelled, race, take } from "redux-saga/effects";
import { ExecutionLog, ExecutionLogEntry, ExecutionStatus, FunctionMap, ScenarioStep } from "../types";
import { automationActions } from "../../../../store/automation/automation.slice";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";

/**
 * Default delay between steps in milliseconds
 */
const DEFAULT_STEP_DELAY = 500;

/**
 * Selector to get the current execution status
 */
const getExecutionStatus = (state) => state.automation.executionStatus;

/**
 * Selector to get the current functions map
 */
const getFunctions = (state) => state.automation.functions;

/**
 * Selector to get whether execution should be stopped
 */
const getShouldStop = (state) => state.automation.shouldStop;

/**
 * Selector to get the execution speed
 */
const getExecutionSpeed = (state) => state.automation.executionSpeed;

/**
 * Initializes a new execution log
 *
 * This function creates a new execution log at the beginning of step execution.
 * It sets up the initial state with empty entries, a start time, and a RUNNING status.
 * The log is stored in Redux state for access throughout the execution process.
 *
 * Error handling is included to ensure that even if initialization fails,
 * a fallback log is created to prevent null reference errors later.
 *
 * @returns The initialized execution log
 */
export function* initializeExecutionLog() {
  try {
    const executionStartTime = Date.now();

    const newLog: ExecutionLog = {
      entries: [],
      startTime: new Date(executionStartTime).toISOString(),
      endTime: "",
      totalDuration: 0,
      status: ExecutionStatus.RUNNING,
    };

    // Store the execution log in Redux state
    yield put(automationActions.setExecutionLog(newLog));
    yield put(automationActions.setLogEntries([]));
    yield put(automationActions.setExecutionStatus(ExecutionStatus.RUNNING));

    return newLog;
  } catch (error) {
    console.error("Error initializing execution log:", error);

    // Create a fallback log in case of error
    const fallbackLog: ExecutionLog = {
      entries: [],
      startTime: new Date().toISOString(),
      endTime: "",
      totalDuration: 0,
      status: ExecutionStatus.RUNNING,
    };

    // Store the fallback log in Redux state
    yield put(automationActions.setExecutionLog(fallbackLog));

    return fallbackLog;
  }
}

/**
 * Finalizes the current execution log
 *
 * This function completes the execution log at the end of step execution.
 * It calculates the total execution duration, sets the end time, and updates
 * the final status (SUCCESS, ERROR, CANCELLED, etc.).
 *
 * The finalized log is stored in Redux state and returned for potential further use.
 * Error handling ensures that even if finalization fails, a fallback log is created
 * to provide at least minimal execution information.
 *
 * @param status The final execution status
 * @returns The finalized execution log
 */
export function* finalizeExecutionLog(status: ExecutionStatus) {
  try {
    // Get the current execution log from Redux state
    const currentLog = yield select((state) => state.automation.executionLog);
    const logEntries = yield select((state) => state.automation.logEntries);
    const executionStartTime = new Date(currentLog.startTime).getTime();

    if (!currentLog) {
      console.error("No execution log found when finalizing");
      return null;
    }

    // Calculate execution duration
    const endTime = Date.now();
    const totalDuration = endTime - executionStartTime;

    // Create the finalized log
    const finalizedLog: ExecutionLog = {
      ...currentLog,
      entries: logEntries,
      endTime: new Date(endTime).toISOString(),
      totalDuration,
      status,
    };

    // Update the execution log in Redux state
    yield put(automationActions.setExecutionLog(finalizedLog));
    yield put(automationActions.setExecutionStatus(status));

    return finalizedLog;
  } catch (error) {
    console.error("Error finalizing execution log:", error);

    // Create a minimal fallback log in case of error
    const fallbackLog: ExecutionLog = {
      entries: [],
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      totalDuration: 0,
      status: ExecutionStatus.ERROR,
    };

    // Update the execution log in Redux state
    yield put(automationActions.setExecutionLog(fallbackLog));
    yield put(automationActions.setExecutionStatus(ExecutionStatus.ERROR));

    return fallbackLog;
  }
}

/**
 * Adds a log entry to the current execution log
 *
 * This function adds a new entry to the execution log during step execution.
 * Each entry represents the execution of a single step, including timing information,
 * status, and any error details.
 *
 * The function:
 * 1. Retrieves the current log entries from Redux state
 * 2. Adds the new entry to the list
 * 3. Updates the Redux state with the updated list
 *
 * Error handling ensures that even if adding the entry fails, execution can continue
 * without crashing, maintaining the robustness of the execution process.
 *
 * @param entry The log entry to add
 * @returns The updated list of log entries
 */
export function* addLogEntry(entry: ExecutionLogEntry) {
  try {
    // Get the current log entries from Redux state
    const logEntries = yield select((state) => state.automation.logEntries);

    // Add the new entry to the log entries
    const updatedEntries = [...logEntries, entry];

    // Update the log entries in Redux state
    yield put(automationActions.setLogEntries(updatedEntries));

    return updatedEntries;
  } catch (error) {
    console.error("Error adding log entry:", error);
    return null;
  }
}

/**
 * Gets an element by XPath
 */
function getElementByXPath(xpath: string): Element | null {
  try {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      .singleNodeValue as Element;
  } catch (error) {
    console.error(`Error evaluating XPath: ${xpath}`, error);
    return null;
  }
}

/**
 * Gets a description of a step
 */
export function getStepDescription(step: ScenarioStep): string {
  switch (step.type) {
    case "click":
      return `Click on element`;
    case "hover":
      return `Hover over element`;
    case "input":
      return `Input value "${step.value?.substring(0, 20)}${step.value && step.value.length > 20 ? "..." : ""}"`;
    case "value":
      return `Set value "${step.value?.substring(0, 20)}${step.value && step.value.length > 20 ? "..." : ""}"`;
    case "code":
      return `Execute code`;
    case "function":
      return `Execute function "${step.value}"`;
    case "redirect":
      return `Navigate to "${step.value}"`;
    case "update":
      return `Update page`;
    case "wait":
      return `Wait for ${step.value} ms`;
    case "select":
      return `Select value "${step.value?.substring(0, 20)}${step.value && step.value.length > 20 ? "..." : ""}"`;
    case "confirmation":
      return `Wait for confirmation: "${step.value?.substring(0, 20)}${step.value && step.value.length > 20 ? "..." : ""}"`;
    default:
      return `Unknown step type: ${step.type}`;
  }
}

/**
 * Executes a click step
 */
export function* executeClickStep(step: ScenarioStep) {
  if (!step.xpath) {
    throw new Error("XPath is required for click steps");
  }

  const element = getElementByXPath(step.xpath);
  if (!element) {
    throw new Error(`Element not found with XPath: ${step.xpath}`);
  }

  // Trigger a click event on the element
  (element as HTMLElement)?.click?.();
}

/**
 * Executes a hover step
 */
export function* executeHoverStep(step: ScenarioStep) {
  if (!step.xpath) {
    throw new Error("XPath is required for hover steps");
  }

  const element = getElementByXPath(step.xpath);
  if (!element) {
    throw new Error(`Element not found with XPath: ${step.xpath}`);
  }

  // Trigger mouseover and mouseenter events on the element
  element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  element.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
}

/**
 * Executes an input step
 */
export function* executeInputStep(step: ScenarioStep) {
  if (!step.xpath) {
    throw new Error("XPath is required for input steps");
  }

  const element = getElementByXPath(step.xpath);
  if (!element) {
    throw new Error(`Element not found with XPath: ${step.xpath}`);
  }

  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new Error(`Element with XPath ${step.xpath} is not an input or textarea element`);
  }

  // Focus the element
  element.focus();

  // Clear the current value
  element.value = "";

  // Set the new value
  element.value = step.value || "";

  // Trigger input and change events
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Executes a value step
 */
export function* executeValueStep(step: ScenarioStep) {
  if (!step.xpath) {
    throw new Error("XPath is required for value steps");
  }

  const element = getElementByXPath(step.xpath);
  if (!element) {
    throw new Error(`Element not found with XPath: ${step.xpath}`);
  }

  // Set the value based on the element type
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    // For input and textarea elements, set the value property
    element.value = step.value || "";

    // Trigger input and change events
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (element instanceof HTMLSelectElement) {
    // For select elements, set the value property
    element.value = step.value || "";

    // Trigger change event
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    // For other elements, set the textContent
    element.textContent = step.value || "";
  }
}

/**
 * Executes a code step
 */
export function* executeCodeStep(step: ScenarioStep) {
  if (!step.value) {
    throw new Error("Code is required for code steps");
  }

  debugger;

  try {
    // Execute the code
    // eslint-disable-next-line no-new-func
    const result = new Function(step.value)();
    return result;
  } catch (error) {
    console.error("Error executing code step:", error);
    throw error;
  }
}

/**
 * Executes a function step
 */
export function* executeFunctionStep(step: ScenarioStep) {
  if (!step.value) {
    throw new Error("Function name is required for function steps");
  }

  // Get the functions map from Redux state
  const functions = yield select(getFunctions);

  if (!functions || Object.keys(functions).length === 0) {
    throw new Error("No functions available");
  }

  // Find the function by name
  const func = Object.keys(functions).find((key) => key === step.value);

  if (!func) {
    throw new Error(`Function "${step.value}" not found`);
  }

  debugger;

  try {
    // Execute the function
    // eslint-disable-next-line no-new-func
    const result = new Function(functions[func]?.code)();
    return result;
  } catch (error) {
    console.error(`Error executing function "${step.value}":`, error);
    throw error;
  }
}

/**
 * Executes a redirect step
 */
export function* executeRedirectStep(step: ScenarioStep) {
  if (!step.value) {
    throw new Error("URL is required for redirect steps");
  }

  // Navigate to the URL
  window.location.href = step.value;

  // Wait for the page to load
  yield new Promise((resolve) => {
    window.addEventListener("load", resolve, { once: true });
  });
}

/**
 * Executes an update step
 */
export function* executeUpdateStep() {
  // Reload the page
  window.location.reload();

  // Wait for the page to load
  yield new Promise((resolve) => {
    window.addEventListener("load", resolve, { once: true });
  });
}

/**
 * Executes a wait step
 */
export function* executeWaitStep(step: ScenarioStep) {
  if (!step.value) {
    throw new Error("Wait time is required for wait steps");
  }

  const waitTime = parseInt(step.value, 10);
  if (isNaN(waitTime) || waitTime <= 0) {
    throw new Error(`Invalid wait time: ${step.value}`);
  }

  // Wait for the specified time
  yield delay(waitTime);
}

/**
 * Executes a select step
 */
export function* executeSelectStep(step: ScenarioStep) {
  if (!step.xpath) {
    throw new Error("XPath is required for select steps");
  }

  const element = getElementByXPath(step.xpath);
  if (!element) {
    throw new Error(`Element not found with XPath: ${step.xpath}`);
  }

  if (!(element instanceof HTMLSelectElement)) {
    throw new Error(`Element with XPath ${step.xpath} is not a select element`);
  }

  // Set the value
  element.value = step.value || "";

  // Trigger change event
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Executes a single step
 *
 * This function handles the execution of a single automation step based on its type.
 * It delegates the actual execution to type-specific handler functions and manages
 * logging and error handling.
 *
 * The function:
 * 1. Creates a log entry with timing information
 * 2. Executes the step based on its type using the appropriate handler
 * 3. Records execution time and creates a success log entry
 * 4. Handles errors by creating an error log entry
 *
 * All step execution is wrapped in try/catch to ensure errors are properly logged
 * and don't interrupt the overall execution flow.
 *
 * @param step The step to execute
 * @param stepIndex The index of the step in the sequence
 * @returns The log entry for the executed step
 */
export function* executeStep(step: ScenarioStep, stepIndex: number) {
  try {
    // Check if this is a function step and syncFunctions is disabled
    if (step.type === "function") {
      // Get server settings to check if functions sync is enabled
      const serverSettings = yield call(ExtensionStorageManager.getAutomationScenario, "automation_server_settings");
      const syncFunctions = serverSettings?.syncFunctions ?? true;

      if (!syncFunctions) {
        // Skip function step execution when syncFunctions is false
        const logEntry: ExecutionLogEntry = {
          stepIndex,
          stepType: step.type,
          stepDescription: `Skipped function step: ${step.value || "Unknown function"} (Functions sync disabled)`,
          timestamp: new Date().toISOString(),
          duration: 0,
          status: ExecutionStatus.SKIPPED,
          details: "Step skipped because function synchronization is disabled",
        };

        // Add the log entry to the execution log
        yield call(addLogEntry, logEntry);
        return logEntry;
      }
    }

    // Create a log entry for this step
    const startTime = Date.now();
    const description = getStepDescription(step);

    // Execute the step based on its type
    switch (step.type) {
      case "click":
        yield call(executeClickStep, step);
        break;
      case "hover":
        yield call(executeHoverStep, step);
        break;
      case "input":
        yield call(executeInputStep, step);
        break;
      case "value":
        yield call(executeValueStep, step);
        break;
      case "code":
        yield call(executeCodeStep, step);
        break;
      case "function":
        yield call(executeFunctionStep, step);
        break;
      case "redirect":
        yield call(executeRedirectStep, step);
        break;
      case "update":
        yield call(executeUpdateStep);
        break;
      case "wait":
        yield call(executeWaitStep, step);
        break;
      case "select":
        yield call(executeSelectStep, step);
        break;
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }

    // Calculate execution time
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Create a log entry
    const logEntry: ExecutionLogEntry = {
      stepIndex,
      stepType: step.type,
      stepDescription: description,
      timestamp: new Date(endTime).toISOString(),
      duration: executionTime,
      status: ExecutionStatus.SUCCESS,
    };

    // Add the log entry to the execution log
    yield call(addLogEntry, logEntry);

    return logEntry;
  } catch (error) {
    console.error(`Error executing step ${stepIndex}:`, error);

    // Create an error log entry
    const endTime = Date.now();
    const logEntry: ExecutionLogEntry = {
      stepIndex,
      stepType: step.type,
      stepDescription: getStepDescription(step),
      timestamp: new Date(endTime).toISOString(),
      duration: 0,
      status: ExecutionStatus.ERROR,
      error: (error as Error)?.message || "An error occurred during execution",
    };

    // Add the error log entry to the execution log
    yield call(addLogEntry, logEntry);

    throw error;
  }
}

/**
 * Executes a sequence of steps
 *
 * This is the main entry point for step execution. It orchestrates the execution of multiple steps,
 * handling initialization, execution, and finalization of the execution process.
 *
 * The function follows these steps:
 * 1. Initialize execution log and reset state
 * 2. Validate input parameters
 * 3. Execute each step sequentially
 * 4. Call the onStepComplete callback after each step
 * 5. Add a delay between steps (adjustable based on speed)
 * 6. Handle cancellation and errors
 * 7. Finalize the execution log
 *
 * Cancellation is handled through:
 * - Checking the shouldStop flag before each step
 * - Using a race effect during delays to detect cancellation
 * - Checking the cancelled effect in the finally block
 *
 * Error handling is implemented with try/catch blocks at multiple levels:
 * - Around the entire execution process
 * - Around each individual step execution
 * - Around the onStepComplete callback
 *
 * @param steps The steps to execute
 * @param onStepComplete Optional callback saga that is called after each step is completed
 * @param functions Optional functions map for use in executeFunctionStep
 * @param speed Optional execution speed multiplier (higher values = faster execution)
 * @returns The execution log when all steps have been executed
 */
export function* executeSteps(
  steps: ScenarioStep[],
  onStepComplete?: (index: number, logEntry?: ExecutionLogEntry) => Generator,
  functions?: FunctionMap,
  speed: number = 1,
) {
  try {
    // Initialize the execution log
    yield call(initializeExecutionLog);

    // Reset the stop flag
    yield put(automationActions.setShouldStop(false));

    // Validate input parameters
    if (!steps || !Array.isArray(steps)) {
      console.error("Invalid steps parameter:", steps);
      return yield call(finalizeExecutionLog, ExecutionStatus.ERROR);
    }

    // Set the functions map if provided
    if (functions) {
      yield put(automationActions.setFunctions(functions));
    }

    // If there are no steps, return success immediately
    if (steps.length === 0) {
      console.warn("No steps to execute");
      return yield call(finalizeExecutionLog, ExecutionStatus.SUCCESS);
    }

    // Execute each step
    for (let i = 0; i < steps.length; i++) {
      // Check if execution should be stopped
      const shouldStop = yield select(getShouldStop);
      if (shouldStop) {
        console.log("StepExecutor: Execution stopped by user");
        return yield call(finalizeExecutionLog, ExecutionStatus.CANCELLED);
      }

      try {
        // Set current step index to show which step is executing
        yield put(automationActions.setCurrentStepIndex(i));
        yield put(automationActions.setStepStatus({ index: i, status: ExecutionStatus.RUNNING }));

        // Validate the current step
        if (!steps[i]) {
          console.warn(`Step ${i} is undefined or null, skipping`);
          yield put(automationActions.setStepStatus({ index: i, status: ExecutionStatus.ERROR }));
          continue;
        }

        // Execute the step and record the log entry
        const logEntry = yield call(executeStep, steps[i], i);

        // Mark step as completed
        yield put(automationActions.setStepStatus({ index: i, status: ExecutionStatus.SUCCESS }));

        // Call the callback if provided
        if (onStepComplete) {
          try {
            yield call(onStepComplete, i, logEntry);
          } catch (callbackError) {
            console.error(`Error in onStepComplete callback for step ${i}:`, callbackError);
            // Continue execution despite callback error
          }
        }

        // Add a small delay between steps for better user experience
        if (i < steps.length - 1) {
          // Get the current execution speed
          const currentSpeed = yield select(getExecutionSpeed);

          // Adjust delay based on speed (higher speed = shorter delay)
          const adjustedDelay = Math.max(50, DEFAULT_STEP_DELAY / (currentSpeed || speed || 1));

          // Wait for the delay or until execution is stopped
          const { stopped } = yield race({
            delayed: delay(adjustedDelay),
            stopped: take(automationActions.setShouldStop.type),
          });

          // Check if execution was stopped during the delay
          if (stopped) {
            console.log("StepExecutor: Execution stopped by user during delay");
            return yield call(finalizeExecutionLog, ExecutionStatus.CANCELLED);
          }
        }
      } catch (error) {
        console.error(`Error executing step ${i}:`, error);

        // Mark the failed step
        yield put(automationActions.setStepStatus({ index: i, status: ExecutionStatus.ERROR }));

        // Finalize the execution log with error status
        return yield call(finalizeExecutionLog, ExecutionStatus.ERROR);
      }
    }

    // Clear current step index when all steps are completed
    yield put(automationActions.setCurrentStepIndex(-1));

    // All steps executed successfully
    return yield call(finalizeExecutionLog, ExecutionStatus.SUCCESS);
  } catch (error) {
    // Something went wrong during execution
    console.error("Error executing steps:", error);

    try {
      // Finalize the execution log with error status
      return yield call(finalizeExecutionLog, ExecutionStatus.ERROR);
    } catch (innerError) {
      console.error("Error handling execution failure:", innerError);

      // Create and return a minimal fallback log if everything else fails
      const fallbackLog: ExecutionLog = {
        entries: [],
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        totalDuration: 0,
        status: ExecutionStatus.ERROR,
      };

      return fallbackLog;
    }
  } finally {
    // Check if the task was cancelled
    if (yield cancelled()) {
      console.log("StepExecutor: Task was cancelled");
      yield call(finalizeExecutionLog, ExecutionStatus.CANCELLED);
    }
  }
}

/**
 * Stops the execution of steps
 *
 * This function provides a clean way to signal that step execution should be stopped.
 * It dispatches the setShouldStop action, which is monitored in several places:
 *
 * 1. In the executeSteps saga, before each step execution
 * 2. In the race effect during delays between steps
 * 3. In UI components that need to stop execution (via direct dispatch)
 *
 * This approach allows for graceful cancellation of execution at various points
 * in the execution flow, ensuring that resources are properly cleaned up and
 * the execution log is finalized with the correct status.
 *
 * @returns void
 */
export function* stopExecution() {
  yield put(automationActions.setShouldStop(true));
}
