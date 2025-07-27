import ExtensionStorageManager from '@entrypoints/core/services/storage/ExtensionStorageManager.ts';
import { Scenario, ScenarioMap, ScenarioStep, CustomFunction, FunctionMap } from '../types.ts';

/**
 * Retrieves all automation scenarios from storage
 * 
 * @returns {Promise<ScenarioMap>} Promise that resolves to a map of scenario IDs to scenario objects
 */
export const getAllScenariosFromLocalStorage = async (): Promise<ScenarioMap> => {
  try {
    const scenarios = await ExtensionStorageManager.getAllAutomationScenarios();
    return scenarios as ScenarioMap;
  } catch (e) {
    console.error('Error getting scenarios from storage:', e);
    return {};
  }
};

/**
 * Retrieves all custom functions from storage
 * 
 * @returns {Promise<FunctionMap>} Promise that resolves to a map of function IDs to function objects
 */
export const getAllFunctionsFromLocalStorage = async (): Promise<FunctionMap> => {
  try {
    // Use the same storage manager but filter for function keys (prefix 'fu_')
    const allItems = await ExtensionStorageManager.getAllAutomationScenarios();
    const functions: FunctionMap = {};
    
    // Filter for items with 'fu_' prefix
    Object.keys(allItems).forEach(key => {
      if (key.startsWith('fu_')) {
        functions[key] = allItems[key] as unknown as CustomFunction;
      }
    });
    
    return functions;
  } catch (e) {
    console.error('Error getting functions from storage:', e);
    return {};
  }
};

/**
 * Removes a scenario from storage
 * 
 * @param {string} key - The key of the scenario to remove
 * @returns {Promise<boolean>} Promise that resolves to true if the removal was successful, false otherwise
 */
export const removeScenarioFromLocalStorage = async (key: string): Promise<boolean> => {
  try {
    // Extract the ID from the key (remove the 'sc_' prefix)
    const id = key.replace(/^sc_/, '');
    const result = await ExtensionStorageManager.removeAutomationScenario(id);
    return result.success;
  } catch (e) {
    console.error('Error removing scenario from storage:', e);
    return false;
  }
};

/**
 * Removes a function from storage
 * 
 * @param {string} key - The key of the function to remove
 * @returns {Promise<boolean>} Promise that resolves to true if the removal was successful, false otherwise
 */
export const removeFunctionFromLocalStorage = async (key: string): Promise<boolean> => {
  try {
    // Extract the ID from the key (remove the 'fu_' prefix)
    const id = key.replace(/^fu_/, '');
    const result = await ExtensionStorageManager.removeAutomationScenario(id);
    return result.success;
  } catch (e) {
    console.error('Error removing function from storage:', e);
    return false;
  }
};

/**
 * Generates a unique ID for a new scenario or function
 * This function creates a random string with a pattern of one lowercase letter
 * followed by 10 alphanumeric characters, similar to id_html in devtools.panels.js
 * 
 * @returns {Promise<string>} A Promise that resolves to a unique ID
 */
export const generateUniqueId = async (): Promise<string> => {
  // Helper function to generate random characters
  const generateRandomChar = (chars: string, count: number): string => {
    let result = '';
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars.charAt(randomIndex);
    }
    return result;
  };
  
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const alphanumeric = lowercase + 'ABCDEFGHJKLMNPQRSTUVWXYZ1234567890';
  
  // Generate ID with pattern: [lowercase][alphanumeric x 10]
  const id = generateRandomChar(lowercase, 1) + generateRandomChar(alphanumeric, 10);
  
  // Check if ID already exists in localStorage for scenarios
  const scenarios = await getAllScenariosFromLocalStorage();
  const existingScenarioKeys = Object.keys(scenarios);
  
  // Check if ID already exists in localStorage for functions
  const functions = await getAllFunctionsFromLocalStorage();
  const existingFunctionKeys = Object.keys(functions);
  
  // Combine all existing keys
  const allExistingKeys = [...existingScenarioKeys, ...existingFunctionKeys];
  
  // Check for both formats of keys for backward compatibility
  if (
    allExistingKeys.includes(`sc_${id}`) || 
    allExistingKeys.includes(`fu_${id}`) || 
    allExistingKeys.includes(`AUTOMATION_SCENARIO_${id}`)
  ) {
    // If ID already exists, generate a new one
    return generateUniqueId();
  }
  
  return id;
};

/**
 * Saves a scenario using ExtensionStorageManager
 * 
 * @param {string} id - The unique ID for the scenario
 * @param {Scenario} scenario - The scenario object to save
 * @returns {Promise<boolean>} Promise that resolves to true if the save was successful, false otherwise
 */
export const saveScenarioToLocalStorage = async (id: string, scenario: Scenario): Promise<boolean> => {
  try {
    const result = await ExtensionStorageManager.saveAutomationScenario(id, scenario);
    return result.success;
  } catch (e) {
    console.error('Error saving scenario to storage:', e);
    return false;
  }
};

/**
 * Saves a custom function using ExtensionStorageManager
 * 
 * @param {string} id - The unique ID for the function
 * @param {CustomFunction} customFunction - The function object to save
 * @returns {Promise<boolean>} Promise that resolves to true if the save was successful, false otherwise
 */
export const saveFunctionToLocalStorage = async (id: string, customFunction: CustomFunction): Promise<boolean> => {
  try {
    // Use the same storage manager but with a different prefix for the key
    // The 'fu_' prefix will help distinguish functions from scenarios
    const prefixedId = id.startsWith('fu_') ? id : `fu_${id}`;
    
    // Extract the ID without the prefix for the storage manager
    const storageId = prefixedId.replace(/^fu_/, '');
    
    const result = await ExtensionStorageManager.saveAutomationScenario(storageId, customFunction as any);
    return result.success;
  } catch (e) {
    console.error('Error saving function to storage:', e);
    return false;
  }
};

/**
 * Adds a step to an existing scenario using ExtensionStorageManager
 * 
 * @param {string} scenarioId - The ID of the scenario to update
 * @param {ScenarioStep} step - The step to add to the scenario
 * @returns {Promise<boolean>} Promise that resolves to true if the update was successful, false otherwise
 */
export const addStepToScenario = async (scenarioId: string, step: ScenarioStep): Promise<boolean> => {
  try {
    // Extract the ID from the key if it has a prefix
    const id = scenarioId.replace(/^sc_/, '');
    
    // Add the step to the scenario
    const result = await ExtensionStorageManager.addStepToAutomationScenario(id, step);
    
    return result.success;
  } catch (e) {
    console.error('Error adding step to scenario:', e);
    return false;
  }
};