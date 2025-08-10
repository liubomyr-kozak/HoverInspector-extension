/**
 * Automation Easy - Type Definitions
 * 
 * This file contains type definitions for the Automation Easy extension.
 */

declare namespace AutomationEasy {
  /**
   * Selector Types
   */
  
  // Simple CSS selector string
  type CssSelector = string;
  
  // Complex selector for targeting elements by text or placeholder
  interface ComplexSelector {
    type: 'text' | 'placeholder';
    matching: 'full' | 'partial' | 'contains';
    content: string;
  }
  
  // Union type for all selector types
  type Selector = CssSelector | ComplexSelector;
  
  /**
   * Action Parameters
   */
  
  // Base interface for all action parameters
  interface ActionParams {
    ignoreErrors?: boolean;
  }
  
  // Parameters for click action
  interface ClickElementParams extends ActionParams {
    selector: Selector;
    loop_index?: number;
    waitTime?: number;
    scroll_to?: boolean;
  }
  
  // Parameters for input action
  interface SetInputParams extends ActionParams {
    selector: Selector;
    value: string;
    waitTime?: number;
    target?: string;
  }
  
  // Parameters for wait action
  interface WaitParams extends ActionParams {
    delay: number;
  }
  
  // Parameters for save data action
  interface SaveDataParams extends ActionParams {
    selector: Selector;
    value_type: 'text' | 'link' | 'image';
    waitTime?: number;
  }
  
  // Parameters for count elements action
  interface CountElementsParams extends ActionParams {
    selector: Selector;
  }
  
  // Parameters for loop action
  interface LoopParams extends ActionParams {
    selector: Selector;
    loop_index?: number;
    steps: Step[];
    tabId: number;
    row?: any;
  }
  
  // Parameters for scroll action
  interface ScrollParams {
    data: {
      x: number;
      y: number;
      direction?: 'up' | 'down';
    }
  }
  
  /**
   * Scenario Structure
   */
  
  // Step types
  type StepType = 
    | 'wait' 
    | 'input' 
    | 'click' 
    | 'save_value' 
    | 'go_back' 
    | 'export_variables_to_spreadsheet'
    | 'collect_urls'
    | 'export_links_to_spreadsheet'
    | 'refresh'
    | 'scroll'
    | 'loop'
    | 'execute_script'
    | 'open_url'
    | 'store_in_collection'
    | 'notification';
  
  // Base step interface
  interface BaseStep {
    type: StepType;
    id?: string;
    subtype?: string;
    data: any;
  }
  
  // Wait step
  interface WaitStep extends BaseStep {
    type: 'wait';
    data: {
      time: number;
    };
  }
  
  // Click step
  interface ClickStep extends BaseStep {
    type: 'click';
    data: {
      selector: Selector;
      loop_index?: number;
    };
  }
  
  // Input step
  interface InputStep extends BaseStep {
    type: 'input';
    data: {
      selector: Selector;
      value: string;
      type?: 'text' | 'ai';
      trim?: boolean;
      max_length?: number;
      target?: string;
      ai?: {
        system: string;
        assistant: string;
      };
    };
  }
  
  // Save value step
  interface SaveValueStep extends BaseStep {
    type: 'save_value';
    data: {
      css_selector: Selector;
      variable_name: string;
      function: 'plain' | 'emails' | 'phone_numbers' | 'title' | 'page_content' | 'page_url';
      value_type?: 'text' | 'link' | 'image';
    };
  }
  
  // Loop step
  interface LoopStep extends BaseStep {
    type: 'loop';
    subtype?: 'counter' | 'open_url';
    selector: Selector;
    iteration_count?: number;
    source?: 'spreadsheet';
    data: {
      steps: Step[];
      spreadsheet?: {
        spreadsheet_id: string;
        sheet_name: string;
        column: string;
      };
    };
  }
  
  // Open URL step
  interface OpenUrlStep extends BaseStep {
    type: 'open_url';
    data: {
      url: string;
      spreadsheet?: {
        spreadsheet_id: string;
        sheet_name: string;
        column: string;
      };
    };
  }
  
  // Union type for all step types
  type Step = 
    | WaitStep 
    | ClickStep 
    | InputStep 
    | SaveValueStep 
    | LoopStep 
    | OpenUrlStep 
    | BaseStep;
  
  // Scenario definition
  interface Scenario {
    id?: string;
    name: string;
    virtual?: boolean;
    steps?: Step[];
    data?: {
      steps: Step[];
      tracking?: {
        save_page_url?: string;
        save_scenario_name?: string;
        save_variables?: string[];
      };
    };
  }
  
  /**
   * Execution Context
   */
  
  // Tab context for tracking scenario execution
  interface TabContext {
    scenario: Scenario;
    virtual?: boolean;
    running: boolean;
    variables: Record<string, any>;
    execution: {
      executionTime: number;
      executionId: string;
    };
  }
  
  // Tabs dictionary for tracking all tab contexts
  interface Tabs {
    [tabId: number]: TabContext;
  }
}