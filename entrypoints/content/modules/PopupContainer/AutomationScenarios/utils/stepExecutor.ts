import { 
  ScenarioStep, 
  FunctionMap, 
  ExecutionStatus, 
  ExecutionLogEntry, 
  ExecutionLog 
} from '../types';

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
    this.executionStartTime = Date.now();
    this.logEntries = [];
    this.currentStatus = ExecutionStatus.RUNNING;
    
    this.currentLog = {
      entries: [],
      startTime: new Date(this.executionStartTime).toISOString(),
      endTime: '',
      totalDuration: 0,
      status: ExecutionStatus.RUNNING
    };
    
    return this.currentLog;
  }
  
  /**
   * Finalizes the current execution log
   * 
   * @param status The final execution status
   * @returns The finalized execution log
   */
  public static finalizeExecutionLog(status: ExecutionStatus = ExecutionStatus.SUCCESS): ExecutionLog {
    if (!this.currentLog) {
      return this.initializeExecutionLog();
    }
    
    const endTime = Date.now();
    const totalDuration = endTime - this.executionStartTime;
    
    this.currentLog.entries = [...this.logEntries];
    this.currentLog.endTime = new Date(endTime).toISOString();
    this.currentLog.totalDuration = totalDuration;
    this.currentLog.status = status;
    
    // Reset the current status
    this.currentStatus = ExecutionStatus.SUCCESS;
    
    return this.currentLog;
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
    functions?: FunctionMap
  ): Promise<ExecutionLogEntry> {
    // Set the functions map if provided
    if (functions) {
      this.setFunctions(functions);
    }
    
    // Create a log entry for this step
    const logEntry: ExecutionLogEntry = {
      stepIndex: stepIndex,
      stepType: step.type,
      stepDescription: this.getStepDescription(step),
      status: ExecutionStatus.RUNNING,
      timestamp: new Date().toISOString(),
      duration: 0,
      details: ''
    };
    
    const startTime = Date.now();
    
    try {
      // Execute the step based on its type
      switch (step.type) {
        case 'click':
          await this.executeClickStep(step);
          logEntry.details = `Clicked element at XPath: ${step.xpath}`;
          break;
        case 'value':
          await this.executeValueStep(step);
          logEntry.details = `Set value "${step.value}" for element at XPath: ${step.xpath}`;
          break;
        case 'code':
          await this.executeCodeStep(step);
          logEntry.details = `Executed custom code`;
          break;
        case 'function':
          await this.executeFunctionStep(step);
          logEntry.details = `Executed function: ${step.value}`;
          break;
        case 'redirect':
          await this.executeRedirectStep(step);
          logEntry.details = `Redirected to URL: ${step.value}`;
          break;
        case 'update':
          await this.executeUpdateStep(step);
          logEntry.details = `Updated page`;
          break;
        case 'wait':
          await this.executeWaitStep(step);
          logEntry.details = `Waited for ${step.value} milliseconds`;
          break;
        default:
          console.warn(`Unknown step type: ${step.type}`);
          logEntry.details = `Unknown step type: ${step.type}`;
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
      logEntry.error = error instanceof Error ? error.message : 'Unknown error';
      
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
  private static getStepDescription(step: ScenarioStep): string {
    switch (step.type) {
      case 'click':
        return `Click element`;
      case 'value':
        return `Set value "${step.value?.substring(0, 20)}${step.value && step.value.length > 20 ? '...' : ''}"`;
      case 'code':
        return `Execute code`;
      case 'function':
        return `Execute function "${step.value}"`;
      case 'redirect':
        return `Navigate to "${step.value}"`;
      case 'update':
        return `Update page`;
      case 'wait':
        return `Wait for ${step.value} ms`;
      default:
        return `Unknown step type: ${step.type}`;
    }
  }

  /**
   * Executes a sequence of steps
   * 
   * @param steps The steps to execute
   * @param onStepComplete Optional callback that is called after each step is completed
   * @param functions Optional functions map for use in executeFunctionStep
   * @returns A promise that resolves to the execution log when all steps have been executed
   */
  public static async executeSteps(
    steps: ScenarioStep[], 
    onStepComplete?: (index: number) => void,
    functions?: FunctionMap
  ): Promise<ExecutionLog> {
    // Set the functions map if provided
    if (functions) {
      this.setFunctions(functions);
    }
    
    // Initialize the execution log
    this.initializeExecutionLog();
    
    try {
      for (let i = 0; i < steps.length; i++) {
        try {
          // Execute the step and record the log entry
          const logEntry = await this.executeStep(steps[i], i, functions);
          
          // Call the callback if provided
          if (onStepComplete) {
            onStepComplete(i);
          }
          
          // Add a small delay between steps for better user experience
          if (i < steps.length - 1) {
            await this.delay(DEFAULT_STEP_DELAY);
          }
        } catch (error) {
          console.error(`Error executing step ${i}:`, error);
          
          // Finalize the execution log with error status
          return this.finalizeExecutionLog(ExecutionStatus.ERROR);
        }
      }
      
      // All steps executed successfully
      return this.finalizeExecutionLog(ExecutionStatus.SUCCESS);
    } catch (error) {
      // Something went wrong during execution
      console.error('Error executing steps:', error);
      
      // Finalize the execution log with error status
      return this.finalizeExecutionLog(ExecutionStatus.ERROR);
    }
  }

  /**
   * Executes a click step
   * 
   * @param step The click step to execute
   */
  private static async executeClickStep(step: ScenarioStep): Promise<void> {
    if (!step.xpath) {
      throw new Error('XPath is required for click steps');
    }

    const element = this.getElementByXPath(step.xpath);
    if (!element) {
      throw new Error(`Element not found with XPath: ${step.xpath}`);
    }

    // Trigger a click event on the element
    element.click();
  }

  /**
   * Executes a value step
   * 
   * @param step The value step to execute
   */
  private static async executeValueStep(step: ScenarioStep): Promise<void> {
    if (!step.xpath) {
      throw new Error('XPath is required for value steps');
    }

    if (step.value === undefined) {
      throw new Error('Value is required for value steps');
    }

    const element = this.getElementByXPath(step.xpath) as HTMLInputElement;
    if (!element) {
      throw new Error(`Element not found with XPath: ${step.xpath}`);
    }

    // Handle different input types appropriately
    if (element.tagName === 'INPUT') {
      if (element.type === 'checkbox' || element.type === 'radio') {
        // For checkboxes and radio buttons, check or uncheck based on the value
        element.checked = step.value === 'on' || step.value === 'true';
      } else {
        // For other input types, set the value
        element.value = step.value;
      }
    } else if (element.tagName === 'SELECT') {
      // For select elements, set the value
      (element as HTMLSelectElement).value = step.value;
    } else if (element.tagName === 'TEXTAREA') {
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
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Executes a code step
   * 
   * @param step The code step to execute
   */
  private static async executeCodeStep(step: ScenarioStep): Promise<void> {
    if (!step.value) {
      throw new Error('Code is required for code steps');
    }

    // Execute the code
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(step.value)();
      return result;
    } catch (error) {
      console.error('Error executing code step:', error);
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
      throw new Error('Function name is required for function steps');
    }

    // Look up the function by name (which is stored in the value field)
    const functionId = Object.keys(this.functions).find(key => 
      this.functions[key].title === step.value
    );

    if (!functionId) {
      throw new Error(`Function "${step.value}" not found`);
    }

    const customFunction = this.functions[functionId];
    
    // Execute the function code
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(customFunction.code)();
      return result;
    } catch (error) {
      console.error(`Error executing function "${step.value}":`, error);
      throw new Error(`Error executing function "${step.value}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Executes a redirect step
   * 
   * @param step The redirect step to execute
   */
  private static async executeRedirectStep(step: ScenarioStep): Promise<void> {
    if (!step.value) {
      throw new Error('URL is required for redirect steps');
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
    console.log('Executing update step');
  }

  /**
   * Executes a wait step
   * 
   * @param step The wait step to execute
   */
  private static async executeWaitStep(step: ScenarioStep): Promise<void> {
    if (!step.value) {
      throw new Error('Wait time is required for wait steps');
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets an element by XPath
   * 
   * @param xpath The XPath to the element
   * @returns The element, or null if not found
   */
  private static getElementByXPath(xpath: string): HTMLElement | null {
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      
      return result.singleNodeValue as HTMLElement;
    } catch (error) {
      console.error('Error evaluating XPath:', error);
      return null;
    }
  }
}