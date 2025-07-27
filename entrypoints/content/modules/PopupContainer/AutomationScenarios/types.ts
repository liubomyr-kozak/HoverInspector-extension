// Types for automation scenarios

/**
 * Represents a single step in an automation scenario
 */
export interface ScenarioStep {
  type: string;
  xpath?: string;
  value?: string;
}

/**
 * Represents a complete automation scenario
 */
export interface Scenario {
  title: string;
  data: ScenarioStep[];
  repeat: number;
}

/**
 * Map of scenario IDs to scenario objects
 */
export interface ScenarioMap {
  [key: string]: Scenario;
}

/**
 * Represents a custom JavaScript function
 */
export interface CustomFunction {
  title: string;
  code: string;
}

/**
 * Map of function IDs to function objects
 */
export interface FunctionMap {
  [key: string]: CustomFunction;
}

/**
 * Options for step types in the form
 */
export const stepTypeOptions = [
  { value: '', label: '(not set)' },
  { value: 'value', label: 'Change' },
  { value: 'click', label: 'Click' },
  { value: 'code', label: 'Code' },
  { value: 'function', label: 'Function' },
  { value: 'redirect', label: 'Redirect' },
  { value: 'update', label: 'New page' },
  { value: 'wait', label: 'Timer' }
];