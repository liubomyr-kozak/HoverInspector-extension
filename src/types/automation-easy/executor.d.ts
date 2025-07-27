/**
 * Automation Easy - Executor Module Declarations
 * 
 * This file contains type declarations for the executor module in the Automation Easy extension.
 */

declare namespace AutomationEasy {
  /**
   * Executor Functions
   */
  
  /**
   * Sends a message to a specific tab
   * @param tabId - The ID of the tab to send the message to
   * @param functionToCall - The function to call in the tab
   * @param params - Parameters to pass to the function
   * @returns Promise that resolves with the result of the function call
   */
  function send(tabId: number, functionToCall: Function, params: any): Promise<any>;
  
  /**
   * Executes a scenario and handles the result
   * @param scenario - The scenario to execute
   * @param tabId - The ID of the tab to execute in
   */
  function executeAndHandleResult(scenario: Scenario, tabId: number): void;
  
  /**
   * Stops the execution of a scenario
   * @param tabId - The ID of the tab where the scenario is running
   * @returns Promise that resolves when the scenario is stopped
   */
  function stopScenario(tabId: number): Promise<boolean>;
  
  /**
   * Executes a single step as a standalone scenario
   * @param step - The step to execute
   * @param tabId - The ID of the tab to execute in
   * @returns Promise that resolves when the step is executed
   */
  function executeSingleStepAsScenario(step: Step, tabId: number): Promise<void>;
  
  /**
   * Executes a scenario by processing its steps sequentially
   * @param scenario - The scenario to execute
   * @param tabId - The ID of the tab to execute in
   * @returns Promise that resolves when the scenario is executed
   */
  function executeScenario(scenario: Scenario, tabId: number): Promise<void>;
  
  /**
   * Gets all tab contexts
   * @returns The tabs dictionary containing all tab contexts
   */
  function getTabs(): Tabs;
  
  /**
   * Gets the context for a specific tab
   * @param tabId - The ID of the tab to get the context for
   * @returns The tab context
   */
  function getTabContext(tabId: number): TabContext | undefined;
  
  /**
   * Stores values to a collection for later retrieval
   * @param tabId - The ID of the tab where the scenario is running
   * @param collection_name - Name of the collection to store values in
   * @param variables - Variables to store
   * @returns Promise that resolves when the values are stored
   */
  function storeValuesToCollection(tabId: number, collection_name: string, variables: Record<string, any>): Promise<void>;
  
  /**
   * Notifies that a step has started
   * @param step - The step that has started
   * @param tabId - The ID of the tab where the step is running
   */
  function notifyStepStarted(step: Step, tabId: number): void;
  
  /**
   * Gets all variables for a tab
   * @param tabId - The ID of the tab to get variables for
   * @returns The variables for the tab
   */
  function getVariables(tabId: number): Record<string, any>;
  
  /**
   * Gets a specific variable for a tab
   * @param tabId - The ID of the tab to get the variable for
   * @param variable_name - The name of the variable to get
   * @returns The value of the variable
   */
  function getVariable(tabId: number, variable_name: string): any;
  
  /**
   * Gets the steps from a scenario
   * @param scenario - The scenario to get steps from
   * @returns The steps of the scenario
   */
  function getSteps(scenario: Scenario): Step[];
  
  /**
   * Tracks execution data
   * @param config - Tracking configuration
   * @param tabId - The ID of the tab where the scenario is running
   */
  function track(config: any, tabId: number): void;
}