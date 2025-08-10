import {
  addStepToAutomationScenario,
  changeCurrentWindowSize,
  changeFeaturePopupPosition,
  changeLauncherActiveFeature,
  changeLauncherIconOrder,
  changeMinimizedFeatures,
  changeMinimizedLauncherPosition,
  changeMinimizedFeaturesAndActiveIcons,
  changePreventDefault,
  changeViewType,
  changeVisibleFeatures,
  deactivateAppInTab,
  getAllAutomationScenarios,
  getAutomationScenario,
  getState,
  hideSponsorMessage,
  minimizedFeaturePopup,
  removeAutomationScenario,
  saveAutomationScenario,
  saveFunction,
  saveNotification,
  saveFolder,
  saveSchedule,
  saveTrigger,
  saveExecutionHistory,
  setupInitialState,
  injectGeneratedScript,
  // CSS Snapshot Actions
  getAllCSSSnapshots,
  getCSSSnapshot,
  saveCSSSnapshot,
  removeCSSSnapshot,
  // Element Details Storage Actions
  getAllSavedElementDetails,
  getSavedElementDetails,
  saveElementDetails,
  removeSavedElementDetails,
  // Element Details Panel Position Actions
  getElementDetailsPanelPosition,
  saveElementDetailsPanelPosition,
} from "@entrypoints/background/features/backgroundSlice.ts";
import { appSettingsInitial } from "@entrypoints/core/initialData/app.ts";

class ExtensionStorageManager {
  async initInitialData() {
    const appState = await getState();

    if (!appState) {
      return setupInitialState(appSettingsInitial);
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

    return appState;
  }

  async getState() {
    return getState();
  }

  async setState(data: any) {
    return getState(data);
  }

  async deactivateAppInTab() {
    deactivateAppInTab();
  }

  async changeLauncherIconOrder(launcherIconOrder: string[]) {
    changeLauncherIconOrder(launcherIconOrder);
  }

  async changeLauncherActiveFeature(launcherIconOrder: string[]) {
    changeLauncherActiveFeature(launcherIconOrder);
  }

  async changeFeaturePopupPosition(featurePopupPosition) {
    changeFeaturePopupPosition(featurePopupPosition);
  }

  async minimizedFeaturePopup(isMinimized: boolean) {
    minimizedFeaturePopup(isMinimized);
  }

  async changeCurrentWindowSize(featurePopupPosition) {
    changeCurrentWindowSize(featurePopupPosition);
  }

  async changePreventDefault(preventDefault) {
    changePreventDefault(preventDefault);
  }

  async changeViewType(preventDefault) {
    changeViewType(preventDefault);
  }

  async changeVisibleFeatures(visibleFeatures: string[]) {
    changeVisibleFeatures(visibleFeatures);
  }

  async changeMinimizedFeatures(minimizedFeatures: string[]) {
    changeMinimizedFeatures(minimizedFeatures);
  }

  async changeMinimizedFeaturesAndActiveIcons(minimizedFeatures: string[], activeIcons: string[]) {
    changeMinimizedFeaturesAndActiveIcons({ data: { minimizedFeatures, activeIcons } });
  }

  async changeMinimizedLauncherPosition(minimizedPosition: { x: number; y: number }) {
    changeMinimizedLauncherPosition(minimizedPosition);
  }

  // Automation Scenarios Methods

  /**
   * Get all automation scenarios
   * @returns {Promise<Object>} Object with scenario keys as keys and scenario objects as values
   */
  async getAllAutomationScenarios() {
    return await getAllAutomationScenarios();
  }

  /**
   * Get a specific automation scenario by ID
   * @param {string} id - The ID of the scenario to get
   * @returns {Promise<Object|null>} The scenario object or null if not found
   */
  async getAutomationScenario(id) {
    return await getAutomationScenario(id);
  }

  /**
   * Save an automation scenario
   * @param {string} id - The ID of the scenario to save
   * @param {Object} scenario - The scenario object to save
   * @returns {Promise<Object>} Object with success status and key
   */
  async saveAutomationScenario(data) {
    return await saveAutomationScenario(data);
  }

  /**
   * Remove an automation scenario
   * @param {string} id - The ID of the scenario to remove
   * @returns {Promise<Object>} Object with success status
   */
  async removeAutomationScenario(data) {
    return await removeAutomationScenario(data);
  }

  /**
   * Add a step to an existing automation scenario
   * @param {string} id - The ID of the scenario to update
   * @param {Object} step - The step to add to the scenario
   * @returns {Promise<Object>} Object with success status
   */
  async addStepToAutomationScenario(id, step) {
    return await addStepToAutomationScenario({ data: { id, step } });
  }

  /**
   * Hide sponsor message until specified timestamp
   * @param {number} hiddenUntil - Timestamp until which the sponsor message should be hidden
   * @returns {Promise<void>}
   */
  async hideSponsorMessage(hiddenUntil) {
    return await hideSponsorMessage({ data: hiddenUntil });
  }

  /**
   * Save a function
   * @param {Object} data - Object containing id and function
   * @returns {Promise<Object>} Object with success status and key
   */
  async saveFunction(data) {
    return await saveFunction(data);
  }

  /**
   * Save a notification
   * @param {Object} data - Object containing id and notification
   * @returns {Promise<Object>} Object with success status and key
   */
  async saveNotification(data) {
    return await saveNotification(data);
  }

  /**
   * Save a folder
   * @param {Object} data - Object containing id and folder
   * @returns {Promise<Object>} Object with success status and key
   */
  async saveFolder(data) {
    return await saveFolder(data);
  }

  /**
   * Save a schedule
   * @param {Object} data - Object containing id and schedule
   * @returns {Promise<Object>} Object with success status and key
   */
  async saveSchedule(data) {
    return await saveSchedule(data);
  }

  /**
   * Save a trigger
   * @param {Object} data - Object containing id and trigger
   * @returns {Promise<Object>} Object with success status and key
   */
  async saveTrigger(data) {
    return await saveTrigger(data);
  }

  /**
   * Save an execution history entry
   * @param {Object} data - Object containing id and execution history entry
   * @returns {Promise<Object>} Object with success status and key
   */
  async saveExecutionHistory(data) {
    return await saveExecutionHistory(data);
  }

  async injectGeneratedScript(data) {
    return await injectGeneratedScript(data);
  }

  /**
   * Get all CSS snapshots
   * @returns {Promise<Array>} Array of snapshot IDs
   */
  async getAllCSSSnapshots() {
    return await getAllCSSSnapshots();
  }

  /**
   * Get a specific CSS snapshot by ID
   * @param {string} id - The ID of the snapshot to get
   * @returns {Promise<Object|null>} The snapshot object or null if not found
   */
  async getCSSSnapshot(id) {
    return await getCSSSnapshot(id);
  }

  /**
   * Save a CSS snapshot
   * @param {string} id - The ID of the snapshot to save
   * @param {Object} snapshot - The snapshot object to save
   * @returns {Promise<Object>} Object with success status and key
   */
  async saveCSSSnapshot(id, snapshot) {
    return await saveCSSSnapshot({ id, snapshot });
  }

  /**
   * Remove a CSS snapshot
   * @param {string} id - The ID of the snapshot to remove
   * @returns {Promise<Object>} Object with success status
   */
  async removeCSSSnapshot(id) {
    return await removeCSSSnapshot(id);
  }

  /**
   * Get all saved element details
   * @returns {Promise<Array>} Array of saved element details IDs
   */
  async getAllSavedElementDetails() {
    return await getAllSavedElementDetails();
  }

  /**
   * Get specific saved element details by ID
   * @param {string} id - The ID of the element details to get
   * @returns {Promise<Object|null>} The element details object or null if not found
   */
  async getSavedElementDetails(id) {
    return await getSavedElementDetails(id);
  }

  /**
   * Save element details
   * @param {Object} data - Object containing id and element details
   * @returns {Promise<Object>} Object with success status and key
   */
  async saveElementDetails(data) {
    return await saveElementDetails(data);
  }

  /**
   * Remove saved element details
   * @param {string} id - The ID of the element details to remove
   * @returns {Promise<Object>} Object with success status
   */
  async removeSavedElementDetails(id) {
    return await removeSavedElementDetails(id);
  }

  /**
   * Get ElementDetails panel position and size
   * @returns {Promise<Object|null>} The panel position/size object or null if not found
   */
  async getElementDetailsPanelPosition() {
    return await getElementDetailsPanelPosition();
  }

  /**
   * Save ElementDetails panel position and size
   * @param {Object} position - Object containing x, y, width, height
   * @returns {Promise<Object>} Object with success status and key
   */
  async saveElementDetailsPanelPosition(position) {
    return await saveElementDetailsPanelPosition({ data: position });
  }
}

export default new ExtensionStorageManager();
