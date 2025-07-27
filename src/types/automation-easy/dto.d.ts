/**
 * Automation Easy - Data Transfer Objects
 * 
 * This file contains type definitions for data transfer objects used in the Automation Easy extension.
 */

declare namespace AutomationEasy {
  /**
   * Message Types
   */
  
  // Types of messages that can be sent between background and content scripts
  type MessageType = 
    | 'scenario_completed'
    | 'step_started'
    | 'execute_scenario'
    | 'execute_step'
    | 'stop_scenario'
    | 'notification';
  
  /**
   * Message DTOs
   */
  
  // Base message interface
  interface Message {
    type: MessageType;
  }
  
  // Message sent when a scenario is completed
  interface ScenarioCompletedMessage extends Message {
    type: 'scenario_completed';
  }
  
  // Message sent when a step is started
  interface StepStartedMessage extends Message {
    type: 'step_started';
    step: Step;
  }
  
  // Message sent to execute a scenario
  interface ExecuteScenarioMessage extends Message {
    type: 'execute_scenario';
    scenario: Scenario;
    tabId: number;
  }
  
  // Message sent to execute a single step
  interface ExecuteStepMessage extends Message {
    type: 'execute_step';
    step: Step;
    tabId: number;
  }
  
  // Message sent to stop a scenario
  interface StopScenarioMessage extends Message {
    type: 'stop_scenario';
    tabId: number;
  }
  
  // Message sent for notifications
  interface NotificationMessage extends Message {
    type: 'notification';
    title: string;
    message: string;
  }
  
  // Union type for all message types
  type MessageDTO = 
    | ScenarioCompletedMessage
    | StepStartedMessage
    | ExecuteScenarioMessage
    | ExecuteStepMessage
    | StopScenarioMessage
    | NotificationMessage;
  
  /**
   * API Response DTOs
   */
  
  // Base response interface
  interface ApiResponse {
    success: boolean;
    error?: string;
  }
  
  // Response for scenario execution
  interface ScenarioExecutionResponse extends ApiResponse {
    executionId?: string;
    startTime?: number;
    endTime?: number;
    status?: 'completed' | 'failed' | 'stopped';
  }
  
  // Response for data extraction
  interface DataExtractionResponse extends ApiResponse {
    data?: any[];
  }
  
  // Response for spreadsheet operations
  interface SpreadsheetResponse extends ApiResponse {
    spreadsheetId?: string;
    updatedRange?: string;
    updatedRows?: number;
  }
  
  /**
   * Storage DTOs
   */
  
  // Scenario storage object
  interface ScenarioStorage {
    id: string;
    name: string;
    steps: Step[];
    createdAt: number;
    updatedAt: number;
    tags?: string[];
    description?: string;
  }
  
  // Execution history entry
  interface ExecutionHistoryEntry {
    executionId: string;
    scenarioId: string;
    executionTime: number;
    status: 'completed' | 'failed' | 'stopped';
    duration: number;
    variables?: Record<string, any>;
    collections?: Record<string, any[]>;
  }
  
  // Schedule entry
  interface ScheduleEntry {
    id: string;
    scenarioId: string;
    name: string;
    schedule: {
      type: 'one-time' | 'recurring';
      date?: string;
      time?: string;
      days?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
      frequency?: 'daily' | 'weekly' | 'monthly';
    };
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
  }
  
  // Trigger entry
  interface TriggerEntry {
    id: string;
    scenarioId: string;
    name: string;
    trigger: {
      type: 'domain' | 'event';
      domain?: string;
      event?: 'page_load' | 'element_appears';
      selector?: Selector;
    };
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
  }
}