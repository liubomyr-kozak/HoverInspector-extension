import {
    changeCurrentWindowSize,
    changeFeaturePopupPosition,
    changeLauncherActiveFeature,
    changeLauncherIconOrder,
    changePreventDefault,
    changeViewType,
    deactivateAppInTab,
    getState,
    setupInitialState,
    minimizedFeaturePopup,
    getAllAutomationScenarios,
    getAutomationScenario,
    saveAutomationScenario,
    removeAutomationScenario,
    addStepToAutomationScenario,
    hideSponsorMessage
} from "@entrypoints/background/features/backgroundSlice.ts";
import {appSettingsInitial} from "@entrypoints/core/initialData/app.ts";

class ExtensionStorageManager {
    async initInitialData() {
        const appState = await getState()

        if (!appState) {
            return setupInitialState(appSettingsInitial)
        }

        // чи то якийсь кеш чи ще щось.... чи сам фреймоворк заглючив,
        // але інколи версія не співпадає, причому setupInitialState не визивається,
        // оставлю цей код поки що тут, якщо виникне знову така проблема, потрбіно буде преписати це місце,
        // так як конструктор AppLocalStorage має перевіряти версію даних і якщо вона не співпадає, то записувати нові дані,
        // наступного разу потрібно буде там перевірити
        if (appState.version !== appSettingsInitial.version) {
            // if need, need to save old data, or remap here
            return setupInitialState(appSettingsInitial);
        }

        return appState
    }

    async getState() {
        return getState()
    }

    async setState(data: any) {
        return getState(data)
    }

    async deactivateAppInTab() {
        deactivateAppInTab()
    }

    async changeLauncherIconOrder(launcherIconOrder: string[]) {
        changeLauncherIconOrder(launcherIconOrder)
    }

    async changeLauncherActiveFeature(launcherIconOrder: string[]) {
        changeLauncherActiveFeature(launcherIconOrder)
    }

    async changeFeaturePopupPosition(featurePopupPosition) {
        changeFeaturePopupPosition(featurePopupPosition)
    }

    async minimizedFeaturePopup(isMinimized: boolean) {
        minimizedFeaturePopup(isMinimized)
    }

    async changeCurrentWindowSize(featurePopupPosition) {
        changeCurrentWindowSize(featurePopupPosition)
    }

    async changePreventDefault(preventDefault) {
        changePreventDefault(preventDefault)
    }

    async changeViewType(preventDefault) {
        changeViewType(preventDefault)
    }

    // Automation Scenarios Methods
    
    /**
     * Get all automation scenarios
     * @returns {Promise<Object>} Object with scenario keys as keys and scenario objects as values
     */
    async getAllAutomationScenarios() {
        return await getAllAutomationScenarios()
    }
    
    /**
     * Get a specific automation scenario by ID
     * @param {string} id - The ID of the scenario to get
     * @returns {Promise<Object|null>} The scenario object or null if not found
     */
    async getAutomationScenario(id) {
        return await getAutomationScenario({ data: id })
    }
    
    /**
     * Save an automation scenario
     * @param {string} id - The ID of the scenario to save
     * @param {Object} scenario - The scenario object to save
     * @returns {Promise<Object>} Object with success status and key
     */
    async saveAutomationScenario(id, scenario) {
        return await saveAutomationScenario({ data: { id, scenario } })
    }
    
    /**
     * Remove an automation scenario
     * @param {string} id - The ID of the scenario to remove
     * @returns {Promise<Object>} Object with success status
     */
    async removeAutomationScenario(id) {
        return await removeAutomationScenario({ data: id })
    }
    
    /**
     * Add a step to an existing automation scenario
     * @param {string} id - The ID of the scenario to update
     * @param {Object} step - The step to add to the scenario
     * @returns {Promise<Object>} Object with success status
     */
    async addStepToAutomationScenario(id, step) {
        return await addStepToAutomationScenario({ data: { id, step } })
    }
    
    /**
     * Hide sponsor message until specified timestamp
     * @param {number} hiddenUntil - Timestamp until which the sponsor message should be hidden
     * @returns {Promise<void>}
     */
    async hideSponsorMessage(hiddenUntil) {
        return await hideSponsorMessage({ data: hiddenUntil })
    }
}


export default new ExtensionStorageManager()