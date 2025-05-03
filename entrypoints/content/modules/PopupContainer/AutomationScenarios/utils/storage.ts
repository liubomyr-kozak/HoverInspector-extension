import ExtensionStorageManager from '@entrypoints/core/services/storage/ExtensionStorageManager.ts';
import { Scenario, ScenarioMap, ScenarioStep } from '../types.ts';

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
 * Generates a unique ID for a new scenario
 * This function creates a random string with a pattern of one lowercase letter
 * followed by 10 alphanumeric characters, similar to id_html in devtools.panels.js
 * 
 * @returns {Promise<string>} A Promise that resolves to a unique ID for the new scenario
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
  
  // Check if ID already exists in localStorage
  const scenarios = await getAllScenariosFromLocalStorage();
  const existingKeys = Object.keys(scenarios);
  
  // Check for both formats of keys for backward compatibility
  if (existingKeys.includes(`sc_${id}`) || existingKeys.includes(`AUTOMATION_SCENARIO_${id}`)) {
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