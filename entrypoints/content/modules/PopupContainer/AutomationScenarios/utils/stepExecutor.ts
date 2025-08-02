import { ExecutionLog, ExecutionLogEntry, ExecutionStatus, FunctionMap, ScenarioStep } from "../types";

/**
 * Default delay between steps in milliseconds
 */
const DEFAULT_STEP_DELAY = 500;

/**
 * Service for executing automation steps
 */
export class StepExecutor {
  // Store the functions map for use in executeFunctionStep
  private static functions: FunctionMap = {};

  // Store the current execution log
  private static currentLog: ExecutionLog | null = null;

  // Store the current execution status
  private static currentStatus: ExecutionStatus = ExecutionStatus.SUCCESS;

  // Store the execution start time
  private static executionStartTime: number = 0;

  // Store the execution log entries
  private static logEntries: ExecutionLogEntry[] = [];

  // Flag to indicate if execution should be stopped
  private static shouldStop: boolean = false;

  /**
   * Sets the functions map for use in executeFunctionStep
   *
   * @param functions The functions map
   */
  public static setFunctions(functions: FunctionMap): void {
    this.functions = functions;
  }

  /**
   * Initializes a new execution log
   *
   * @returns The initialized execution log
   */
  public static initializeExecutionLog(): ExecutionLog {
    try {
      this.executionStartTime = Date.now();
      this.logEntries = [];
      this.currentStatus = ExecutionStatus.RUNNING;

      const newLog: ExecutionLog = {
        entries: [],
        startTime: new Date(this.executionStartTime).toISOString(),
        endTime: "",
        totalDuration: 0,
        status: ExecutionStatus.RUNNING,
      };

      // Ensure we set the currentLog before returning
      this.currentLog = newLog;
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

      // Ensure we set the currentLog before returning
      this.currentLog = fallbackLog;
      return fallbackLog;
    }
  }

  /**
   * Finalizes the current execution log
   *
   * @param status The final execution status
   * @returns The finalized execution log
   */
  public static finalizeExecutionLog(status: ExecutionStatus = ExecutionStatus.SUCCESS): ExecutionLog {
    try {
      // If there's no current log, initialize one
      if (!this.currentLog) {
        console.warn("No current execution log found, initializing a new one");
        this.initializeExecutionLog();

        // Double-check that initialization worked
        if (!this.currentLog) {
          console.error("Failed to initialize execution log");
          // Create a minimal fallback log
          return {
            entries: [],
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            totalDuration: 0,
            status: status,
          };
        }
      }

      const endTime = Date.now();
      const totalDuration = Math.max(0, endTime - this.executionStartTime);

      this.currentLog.entries = [...this.logEntries];
      this.currentLog.endTime = new Date(endTime).toISOString();
      this.currentLog.totalDuration = totalDuration;
      this.currentLog.status = status;

      // Reset the current status
      this.currentStatus = ExecutionStatus.SUCCESS;

      return this.currentLog;
    } catch (error) {
      console.error("Error finalizing execution log:", error);

      // Create a fallback log in case of error
      const fallbackLog: ExecutionLog = {
        entries: this.logEntries || [],
        startTime: new Date(this.executionStartTime || Date.now()).toISOString(),
        endTime: new Date().toISOString(),
        totalDuration: 0,
        status: status,
      };

      this.currentLog = fallbackLog;
      return fallbackLog;
    }
  }

  /**
   * Gets the current execution log
   *
   * @returns The current execution log
   */
  public static getCurrentExecutionLog(): ExecutionLog | null {
    return this.currentLog;
  }

  /**
   * Gets the current execution status
   *
   * @returns The current execution status
   */
  public static getCurrentExecutionStatus(): ExecutionStatus {
    return this.currentStatus;
  }

  /**
   * Stops the current execution
   */
  public static stopExecution(): void {
    console.log("StepExecutor: Stopping execution");
    this.shouldStop = true;
  }

  /**
   * Resets the stop flag
   */
  public static resetStopFlag(): void {
    this.shouldStop = false;
  }

  /**
   * Processes a step value to replace variable references with their stored values
   *
   * @param value The value to process
   * @returns The processed value with variables replaced
   */
  private static processStepValue(value: string): string {
    if (!value) return value;

    // Look for patterns like ${variableName}
    return value.replace(/\${([^}]+)}/g, (match, variableName) => {
      // Dispatch a custom event to get the stored value
      const getValueEvent = new CustomEvent("automation:getValue", {
        detail: {
          key: variableName,
          callback: (storedValue: string | undefined) => {
            // This will be handled asynchronously by the saga
            console.log(`Retrieved stored value for ${variableName}: ${storedValue}`);
          },
        },
      });
      document.dispatchEvent(getValueEvent);

      // For now, we'll use a synchronous approach with localStorage
      // In a real implementation, this would be handled by the saga
      try {
        const storedValues = JSON.parse(localStorage.getItem("automation_stored_values") || "{}");
        const storedValue = storedValues[variableName];
        return storedValue !== undefined ? storedValue : match;
      } catch (error) {
        console.error("Error retrieving stored value:", error);
        return match;
      }
    });
  }

  /**
   * Executes a single step
   *
   * @param step The step to execute
   * @param stepIndex Optional index of the step in the sequence
   * @param functions Optional functions map for use in executeFunctionStep
   * @returns A promise that resolves when the step has been executed
   */
  public static async executeStep(
    step: ScenarioStep,
    stepIndex: number = -1,
    functions?: FunctionMap,
  ): Promise<ExecutionLogEntry> {
    // Set the functions map if provided
    if (functions) {
      this.setFunctions(functions);
    }

    // Process step values to replace variables
    const processedStep = { ...step };
    if (processedStep.value) {
      processedStep.value = this.processStepValue(processedStep.value);
    }

    // Create a log entry for this step
    const logEntry: ExecutionLogEntry = {
      stepIndex: stepIndex,
      stepType: processedStep.type,
      stepDescription: this.getStepDescription(processedStep),
      status: ExecutionStatus.RUNNING,
      timestamp: new Date().toISOString(),
      duration: 0,
      details: "",
    };

    const startTime = Date.now();

    try {
      // Execute the step based on its type
      switch (processedStep.type) {
        case "click":
          await this.executeClickStep(processedStep);
          logEntry.details = `Clicked element at XPath: ${processedStep.xpath}`;
          break;
        case "hover":
          await this.executeHoverStep(processedStep);
          logEntry.details = `Hovered over element at XPath: ${processedStep.xpath}`;
          break;
        case "input":
          await this.executeInputStep(processedStep);
          logEntry.details = `Input value "${processedStep.value}" for element at XPath: ${processedStep.xpath}`;
          break;
        case "value":
          await this.executeValueStep(processedStep);
          logEntry.details = `Set value "${processedStep.value}" for element at XPath: ${processedStep.xpath}`;
          break;
        case "code":
          await this.executeCodeStep(processedStep);
          logEntry.details = `Executed custom code`;
          break;
        case "function":
          await this.executeFunctionStep(processedStep);
          logEntry.details = `Executed function: ${processedStep.value}`;
          break;
        case "redirect":
          await this.executeRedirectStep(processedStep);
          logEntry.details = `Redirected to URL: ${processedStep.value}`;
          break;
        case "update":
          await this.executeUpdateStep(processedStep);
          logEntry.details = `Updated page`;
          break;
        case "wait":
          await this.executeWaitStep(processedStep);
          logEntry.details = `Waited for ${processedStep.value} milliseconds`;
          break;
        case "select":
          await this.executeSelectStep(processedStep);
          logEntry.details = `Selected value "${processedStep.value}" for element at XPath: ${processedStep.xpath}`;
          break;
        case "getText":
          await this.executeGetTextStep(processedStep);
          logEntry.details = `Got text from element at XPath: ${processedStep.xpath} and stored as "${processedStep.value}"`;
          break;
        default:
          console.warn(`Unknown step type: ${processedStep.type}`);
          logEntry.details = `Unknown step type: ${processedStep.type}`;
          logEntry.status = ExecutionStatus.WARNING;
          this.currentStatus = ExecutionStatus.WARNING;
          break;
      }

      // Step executed successfully
      if (logEntry.status === ExecutionStatus.RUNNING) {
        logEntry.status = ExecutionStatus.SUCCESS;
      }
    } catch (error) {
      // Step execution failed
      console.error(`Error executing step of type ${step.type}:`, error);

      logEntry.status = ExecutionStatus.ERROR;
      logEntry.error = error instanceof Error ? error.message : "Unknown error";

      // Update the current status to error
      this.currentStatus = ExecutionStatus.ERROR;

      // Add the log entry to the log entries
      const endTime = Date.now();
      logEntry.duration = endTime - startTime;
      this.logEntries.push(logEntry);

      throw error;
    }

    // Calculate the duration
    const endTime = Date.now();
    logEntry.duration = endTime - startTime;

    // Add the log entry to the log entries
    this.logEntries.push(logEntry);

    return logEntry;
  }

  /**
   * Gets a description for a step
   *
   * @param step The step to describe
   * @returns A description of the step
   */
  public static getStepDescription(step: ScenarioStep): string {
    switch (step.type) {
      case "click":
        return `Click element`;
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
      default:
        return `Unknown step type: ${step.type}`;
    }
  }

  /**
   * Executes a sequence of steps
   *
   * @param steps The steps to execute
   * @param onStepComplete Optional callback that is called after each step is completed.
   *                       Can be a regular function, a function that returns a Promise,
   *                       or a Generator function (e.g., a redux-saga generator).
   * @param functions Optional functions map for use in executeFunctionStep
   * @param speed Optional execution speed multiplier (higher values = faster execution)
   * @returns A promise that resolves to the execution log when all steps have been executed
   */
  public static async executeSteps(
    steps: ScenarioStep[],
    onStepComplete?: (index: number) => void | Promise<void> | Generator,
    functions?: FunctionMap,
    speed: number = 1,
  ): Promise<ExecutionLog> {
    try {
      // Initialize the execution log first to ensure it's not null
      StepExecutor.initializeExecutionLog();

      // Reset the stop flag at the beginning of execution
      StepExecutor.resetStopFlag();

      // Validate input parameters
      if (!steps || !Array.isArray(steps)) {
        console.error("Invalid steps parameter:", steps);
        return StepExecutor.finalizeExecutionLog(ExecutionStatus.ERROR);
      }

      // Set the functions map if provided
      if (functions) {
        StepExecutor.setFunctions(functions);
      }

      // If there are no steps, return success immediately
      if (steps.length === 0) {
        console.warn("No steps to execute");
        return StepExecutor.finalizeExecutionLog(ExecutionStatus.SUCCESS);
      }

      for (let i = 0; i < steps.length; i++) {
        // Check if execution should be stopped
        if (StepExecutor.shouldStop) {
          console.log("StepExecutor: Execution stopped by user");
          return StepExecutor.finalizeExecutionLog(ExecutionStatus.CANCELLED);
        }

        try {
          // Validate the current step
          if (!steps[i]) {
            console.warn(`Step ${i} is undefined or null, skipping`);
            continue;
          }

          // Execute the step and record the log entry
          const logEntry = await StepExecutor.executeStep(steps[i], i, functions);

          // Call the callback if provided
          debugger;
          if (onStepComplete) {
            debugger;
            try {
              const result = onStepComplete(i);

              // Check if the result is a generator
              if (
                result &&
                typeof result === "object" &&
                Symbol.iterator in result &&
                typeof result.next === "function"
              ) {
                // Handle generator function
                let isDone = false;
                while (!isDone) {
                  const { done, value } = result.next();
                  isDone = !!done;

                  // If the generator yields a promise, await it
                  if (value && typeof value.then === "function") {
                    await value;
                  }
                }
              } else if (result && typeof result.then === "function") {
                // Handle Promise
                await result;
              }
              // Regular functions (void return) don't need special handling
            } catch (callbackError) {
              console.error(`Error in onStepComplete callback for step ${i}:`, callbackError);
              // Continue execution despite callback error
            }
          }

          // Add a small delay between steps for better user experience
          if (i < steps.length - 1) {
            // Adjust delay based on speed (higher speed = shorter delay)
            const adjustedDelay = Math.max(50, DEFAULT_STEP_DELAY / (speed || 1));
            await StepExecutor.delay(adjustedDelay);

            // Check again if execution should be stopped after the delay
            if (StepExecutor.shouldStop) {
              console.log("StepExecutor: Execution stopped by user after delay");
              return StepExecutor.finalizeExecutionLog(ExecutionStatus.CANCELLED);
            }
          }
        } catch (error) {
          console.error(`Error executing step ${i}:`, error);

          // Finalize the execution log with error status
          return StepExecutor.finalizeExecutionLog(ExecutionStatus.ERROR);
        }
      }

      // All steps executed successfully
      return StepExecutor.finalizeExecutionLog(ExecutionStatus.SUCCESS);
    } catch (error) {
      // Something went wrong during execution
      console.error("Error executing steps:", error);

      try {
        // Make sure we have an execution log before finalizing
        if (!StepExecutor.currentLog) {
          console.warn("No execution log found in catch block, initializing one");
          StepExecutor.initializeExecutionLog();
        }

        // Finalize the execution log with error status
        return StepExecutor.finalizeExecutionLog(ExecutionStatus.ERROR);
      } catch (innerError) {
        console.error("Error handling execution failure:", innerError);
        // Create and return a minimal fallback log if everything else fails
        return {
          entries: [],
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          totalDuration: 0,
          status: ExecutionStatus.ERROR,
        };
      }
    }
  }

  /**
   * Executes a click step
   *
   * @param step The click step to execute
   */
  private static async executeClickStep(step: ScenarioStep): Promise<void> {
    if (!step.xpath) {
      throw new Error("XPath is required for click steps");
    }

    const element = this.getElementByXPath(step.xpath, step.alternativeXpaths);
    if (!element) {
      throw new Error(`Element not found with XPath: ${step.xpath}`);
    }

    // Trigger a click event on the element
    element.click();
  }

  /**
   * Executes a hover step
   *
   * @param step The hover step to execute
   */
  private static async executeHoverStep(step: ScenarioStep): Promise<void> {
    if (!step.xpath) {
      throw new Error("XPath is required for hover steps");
    }

    const element = this.getElementByXPath(step.xpath, step.alternativeXpaths);
    if (!element) {
      throw new Error(`Element not found with XPath: ${step.xpath}`);
    }

    // Trigger mouseover and mouseenter events on the element
    element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    element.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
  }

  /**
   * Executes an input step
   *
   * @param step The input step to execute
   */
  private static async executeInputStep(step: ScenarioStep): Promise<void> {
    if (!step.xpath) {
      throw new Error("XPath is required for input steps");
    }

    if (step.value === undefined) {
      throw new Error("Value is required for input steps");
    }

    const element = this.getElementByXPath(step.xpath, step.alternativeXpaths) as HTMLInputElement;
    if (!element) {
      throw new Error(`Element not found with XPath: ${step.xpath}`);
    }

    // Focus the element first
    element.focus();

    // Set the value
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      // For input and textarea elements, set the value
      element.value = step.value;

      // Simulate typing by dispatching input events
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));

      // Optionally simulate keypress events for each character
      for (let i = 0; i < step.value.length; i++) {
        const char = step.value.charAt(i);
        element.dispatchEvent(new KeyboardEvent("keydown", { key: char, bubbles: true }));
        element.dispatchEvent(new KeyboardEvent("keypress", { key: char, bubbles: true }));
        element.dispatchEvent(new KeyboardEvent("keyup", { key: char, bubbles: true }));
      }
    } else if (element.isContentEditable) {
      // For contenteditable elements, set the innerHTML
      element.innerHTML = step.value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      throw new Error(`Element with XPath ${step.xpath} is not an input element`);
    }
  }

  /**
   * Executes a value step
   *
   * @param step The value step to execute
   */
  private static async executeValueStep(step: ScenarioStep): Promise<void> {
    if (!step.xpath) {
      throw new Error("XPath is required for value steps");
    }

    if (step.value === undefined) {
      throw new Error("Value is required for value steps");
    }

    const element = this.getElementByXPath(step.xpath, step.alternativeXpaths) as HTMLInputElement;
    if (!element) {
      throw new Error(`Element not found with XPath: ${step.xpath}`);
    }

    // Handle different input types appropriately
    if (element.tagName === "INPUT") {
      if (element.type === "checkbox" || element.type === "radio") {
        // For checkboxes and radio buttons, check or uncheck based on the value
        element.checked = step.value === "on" || step.value === "true";
      } else {
        // For other input types, set the value
        element.value = step.value;
      }
    } else if (element.tagName === "SELECT") {
      // For select elements, set the value
      (element as HTMLSelectElement).value = step.value;
    } else if (element.tagName === "TEXTAREA") {
      // For textarea elements, set the value
      (element as HTMLTextAreaElement).value = step.value;
    } else if (element.isContentEditable) {
      // For contenteditable elements, set the innerHTML
      element.innerHTML = step.value;
    } else {
      // For other elements, try to set the value property
      (element as any).value = step.value;
    }

    // Trigger change and input events to simulate user interaction
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /**
   * Executes a code step
   *
   * @param step The code step to execute
   */
  private static async executeCodeStep(step: ScenarioStep): Promise<void> {
    if (!step.value) {
      throw new Error("Code is required for code steps");
    }

    debugger;

    // Execute the code
    try {
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
   *
   * @param step The function step to execute
   */
  private static async executeFunctionStep(step: ScenarioStep): Promise<void> {
    if (!step.value) {
      throw new Error("Function name is required for function steps");
    }

    // Look up the function by name (which is stored in the value field)
    const functionId = Object.keys(this.functions).find((key) => this.functions[key].title === step.value);

    if (!functionId) {
      throw new Error(`Function "${step.value}" not found`);
    }

    const customFunction = this.functions[functionId];

    debugger;
    // Execute the function code
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(customFunction.code)();
      return result;
    } catch (error) {
      console.error(`Error executing function "${step.value}":`, error);
      throw new Error(
        `Error executing function "${step.value}": ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Executes a redirect step
   *
   * @param step The redirect step to execute
   */
  private static async executeRedirectStep(step: ScenarioStep): Promise<void> {
    if (!step.value) {
      throw new Error("URL is required for redirect steps");
    }

    // Navigate to the URL
    window.location.href = step.value;
  }

  /**
   * Executes an update step
   *
   * @param step The update step to execute
   */
  private static async executeUpdateStep(step: ScenarioStep): Promise<void> {
    // In a real implementation, this would update the page in some way.
    // For now, we'll just log a message.
    console.log("Executing update step");
  }

  /**
   * Executes a wait step
   *
   * @param step The wait step to execute
   */
  private static async executeWaitStep(step: ScenarioStep): Promise<void> {
    if (!step.value) {
      throw new Error("Wait time is required for wait steps");
    }

    // Parse the wait time from the value
    const waitTime = parseInt(step.value, 10);
    if (isNaN(waitTime)) {
      throw new Error(`Invalid wait time: ${step.value}`);
    }

    // Wait for the specified time
    await this.delay(waitTime);
  }

  /**
   * Returns a promise that resolves after the specified delay
   *
   * @param ms The delay in milliseconds
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Executes a select step
   *
   * @param step The select step to execute
   */
  private static async executeSelectStep(step: ScenarioStep): Promise<void> {
    if (!step.xpath) {
      throw new Error("XPath is required for select steps");
    }

    if (step.value === undefined) {
      throw new Error("Value is required for select steps");
    }

    const element = this.getElementByXPath(step.xpath, step.alternativeXpaths);
    if (!element) {
      throw new Error(`Element not found with XPath: ${step.xpath}`);
    }

    if (element.tagName !== "SELECT") {
      throw new Error(`Element with XPath ${step.xpath} is not a select element`);
    }

    // Set the value of the select element
    const selectElement = element as HTMLSelectElement;
    selectElement.value = step.value;

    // Trigger change event to simulate user interaction
    selectElement.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /**
   * Executes a getText step
   *
   * @param step The getText step to execute
   */
  private static async executeGetTextStep(step: ScenarioStep): Promise<void> {
    if (!step.xpath) {
      throw new Error("XPath is required for getText steps");
    }

    if (!step.value) {
      throw new Error("Storage key is required for getText steps");
    }

    const element = this.getElementByXPath(step.xpath, step.alternativeXpaths);
    if (!element) {
      throw new Error(`Element not found with XPath: ${step.xpath}`);
    }

    // Get the text content of the element
    let textContent = "";

    // Handle different element types
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      textContent = (element as HTMLInputElement).value;
    } else if (element.tagName === "SELECT") {
      const selectElement = element as HTMLSelectElement;
      const selectedOption = selectElement.options[selectElement.selectedIndex];
      textContent = selectedOption ? selectedOption.text : "";
    } else {
      // For other elements, get the text content
      textContent = element.textContent || "";
    }

    // Store the text content in the automation state
    // We need to dispatch an action to the store
    // This will be handled by the saga
    const event = new CustomEvent("automation:storeValue", {
      detail: {
        key: step.value,
        value: textContent.trim(),
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * Gets an element by XPath
   * If the element has alternative XPaths stored, it will try those if the primary XPath fails
   *
   * @param xpath The primary XPath to the element
   * @param alternativeXpaths Optional array of alternative XPaths to try if the primary one fails
   * @returns The element, or null if not found
   */
  private static getElementByXPath(xpath: string, alternativeXpaths?: string[]): HTMLElement | null {
    // First try the primary XPath
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      
      const element = result.singleNodeValue as HTMLElement;
      if (element) {
        return element;
      }
    } catch (error) {
      console.error('Error evaluating primary XPath:', error);
    }
    
    // If primary XPath failed and we have alternatives, try them
    if (alternativeXpaths && alternativeXpaths.length > 0) {
      console.log(`Primary XPath failed, trying ${alternativeXpaths.length} alternative XPaths`);
      
      for (const altXPath of alternativeXpaths) {
        try {
          const result = document.evaluate(
            altXPath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          
          const element = result.singleNodeValue as HTMLElement;
          if (element) {
            console.log(`Found element using alternative XPath: ${altXPath}`);
            return element;
          }
        } catch (error) {
          console.error(`Error evaluating alternative XPath: ${altXPath}`, error);
          // Continue to the next alternative
        }
      }
    }
    
    // If we get here, all XPaths failed
    console.warn(`Element not found with XPath: ${xpath}`);
    return null;
  }
}
