import AppLocalStorage from "@entrypoints/core/services/storage/AppLocalStorage.ts";
import LocalStorage from "@entrypoints/core/services/storage/LocalStorage.ts";
import { AUTOMATION_SCENARIO_KEY, AUTOMATION_SCENARIO_PREFIX } from "@entrypoints/core/constants/automation.ts";


class AppStorageService {
    // незалежно від того чи юзер залогінений чи ні,
    // я завжди повертаю сетінги з локалстореджа
    // тут не має бути сайд ефекту який робить бере сетінги з сервера
    getAppState = async () => {
        return await AppLocalStorage.getAppState();
    };

    setAppState = async (data) => {
        await AppLocalStorage.setAppState(data);
    };

    initAppState = async () => {
        const appState = await AppLocalStorage.getAppState();

        return appState;
    };

    resetStateLocal = async () => {
        await AppLocalStorage.resetAppState();
    };
    
    // Automation Scenarios Methods
    
    /**
     * Get all automation scenarios
     * @returns {Promise<Object>} Object with scenario keys as keys and scenario objects as values
     */
    getAllAutomationScenarios = async () => {
        const allKeys = [];
        // Get all keys from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(AUTOMATION_SCENARIO_PREFIX)) {
                allKeys.push(key);
            }
        }
        
        // Get all scenarios
        const scenarios = {};
        for (const key of allKeys) {
            try{
                const data = await LocalStorage.get(key);
                if (data) {
                    scenarios[key] = data;
                }
            } catch (e) {
                console.log("1 AppStorageService::getAllAutomationScenarios -> e", e);
            }
        }

        debugger;
        
        return scenarios;
    };
    
    /**
     * Get a specific automation scenario by ID
     * @param {string} id - The ID of the scenario to get
     * @returns {Promise<Object|null>} The scenario object or null if not found
     */
    getAutomationScenario = async (id) => {
        const key = AUTOMATION_SCENARIO_KEY(id);
        return await LocalStorage.get(key);
    };
    
    /**
     * Save an automation scenario
     * @param {string} id - The ID of the scenario to save
     * @param {Object} scenario - The scenario object to save
     * @returns {Promise<Object>} Object with success status and key
     */
    saveAutomationScenario = async (id, scenario) => {
        const key = AUTOMATION_SCENARIO_KEY(id);
        await LocalStorage.set(key, scenario);
        
        // Also save to Chrome storage.sync for backward compatibility
        chrome.storage.sync.set({ [key]: scenario });
        
        return { success: true, key };
    };
    
    /**
     * Remove an automation scenario
     * @param {string} id - The ID of the scenario to remove
     * @returns {Promise<Object>} Object with success status
     */
    removeAutomationScenario = async (id) => {
        const key = AUTOMATION_SCENARIO_KEY(id);
        await LocalStorage.removeAll(key);
        
        // Also remove from Chrome storage.sync for backward compatibility
        chrome.storage.sync.remove(key);
        
        return { success: true };
    };
    
    /**
     * Add a step to an existing automation scenario
     * @param {string} id - The ID of the scenario to update
     * @param {Object} step - The step to add to the scenario
     * @returns {Promise<Object>} Object with success status
     */
    addStepToAutomationScenario = async (id, step) => {
        const key = AUTOMATION_SCENARIO_KEY(id);
        const scenario = await LocalStorage.get(key);
        
        if (!scenario) {
            return { success: false, error: `Scenario ${id} not found` };
        }
        
        // Add the step to the scenario
        scenario.data.push(step);
        
        // Save the updated scenario
        await LocalStorage.set(key, scenario);
        
        // Also update Chrome storage.sync for backward compatibility
        chrome.storage.sync.set({ [key]: scenario });
        
        return { success: true };
    };
}

export default new AppStorageService();
