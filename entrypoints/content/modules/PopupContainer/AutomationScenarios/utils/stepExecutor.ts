import { ScenarioStep, FunctionMap } from '../types';

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

  /**
   * Sets the functions map for use in executeFunctionStep
   * 
   * @param functions The functions map
   */
  public static setFunctions(functions: FunctionMap): void {
    this.functions = functions;
  }

  /**
   * Executes a single step
   * 
   * @param step The step to execute
   * @returns A promise that resolves when the step has been executed
   */
  public static async executeStep(step: ScenarioStep): Promise<void> {
    try {
      switch (step.type) {
        case 'click':
          await this.executeClickStep(step);
          break;
        case 'value':
          await this.executeValueStep(step);
          break;
        case 'code':
          await this.executeCodeStep(step);
          break;
        case 'function':
          await this.executeFunctionStep(step);
          break;
        case 'redirect':
          await this.executeRedirectStep(step);
          break;
        case 'update':
          await this.executeUpdateStep(step);
          break;
        case 'wait':
          await this.executeWaitStep(step);
          break;
        default:
          console.warn(`Unknown step type: ${step.type}`);
          break;
      }
    } catch (error) {
      console.error(`Error executing step of type ${step.type}:`, error);
      throw error;
    }
  }

  /**
   * Executes a sequence of steps
   * 
   * @param steps The steps to execute
   * @param onStepComplete Optional callback that is called after each step is completed
   * @param functions Optional functions map for use in executeFunctionStep
   * @returns A promise that resolves when all steps have been executed
   */
  public static async executeSteps(
    steps: ScenarioStep[], 
    onStepComplete?: (index: number) => void,
    functions?: FunctionMap
  ): Promise<void> {
    // Set the functions map if provided
    if (functions) {
      this.setFunctions(functions);
    }

    for (let i = 0; i < steps.length; i++) {
      try {
        await this.executeStep(steps[i]);
        
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
        throw error;
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