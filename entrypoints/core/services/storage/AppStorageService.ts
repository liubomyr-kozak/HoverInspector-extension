import AppLocalStorage from "@entrypoints/core/services/storage/AppLocalStorage.ts";
import LocalStorage from "@entrypoints/core/services/storage/LocalStorage.ts";
import {
  AUTOMATION_SCENARIO_KEY,
  AUTOMATION_SCENARIO_PREFIX,
  AUTOMATION_FUNCTION_KEY,
  AUTOMATION_NOTIFICATION_KEY,
  AUTOMATION_FOLDER_KEY,
  AUTOMATION_SCHEDULE_KEY,
  AUTOMATION_TRIGGER_KEY,
  AUTOMATION_EXECUTION_HISTORY_KEY,
} from "@entrypoints/core/constants/automation.ts";
import {
  CSS_SNAPSHOT_KEY,
  CSS_SNAPSHOT_PREFIX,
  CSS_SNAPSHOTS_LIST_KEY,
} from "@entrypoints/core/constants/cssSnapshot.ts";
import {
  ELEMENT_DETAILS_KEY,
  ELEMENT_DETAILS_PREFIX,
  ELEMENT_DETAILS_LIST_KEY,
  ELEMENT_DETAILS_PANEL_POSITION_KEY,
} from "@entrypoints/core/constants/elementDetails.ts";
import {
  NOTEFORM_PANEL_POSITION_KEY,
  NOTES_STORAGE_KEY,
} from "@entrypoints/core/constants/notes.ts";

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
    const allItems = await LocalStorage.getAllItems();
    const allKeys = [];

    for (const key of Object.keys(allItems)) {
      if (key.startsWith(AUTOMATION_SCENARIO_PREFIX)) {
        allKeys.push(key);
      }
    }

    // Get all scenarios
    const scenarios = {};

    for (const key of allKeys) {
      try {
        const data = await LocalStorage.get(key);
        if (data) {
          // Strip the prefix from the key to match the format expected by the UI
          // If the key starts with AUTOMATION_SCENARIO_sc_, we want to keep just sc_
          const strippedKey = (key as any)?.replace(AUTOMATION_SCENARIO_PREFIX, "");
          scenarios[strippedKey] = data;
        }
      } catch (e) {
        // Error handling - console.log removed\n
      }
    }

    return scenarios;
  };

  /**
   * Get a specific automation scenario by ID
   * @param {string} id - The ID of the scenario to get
   * @returns {Promise<Object|null>} The scenario object or null if not found
   */
  getAutomationScenario = async ({ data: id }) => {
    const key = AUTOMATION_SCENARIO_KEY(id);

    return await LocalStorage.get(key);
  };

  /**
   * Save an automation scenario
   * @param {string} id - The ID of the scenario to save
   * @param {Object} scenario - The scenario object to save
   * @returns {Promise<Object>} Object with success status and key
   */
  saveAutomationScenario = async ({ id, scenario }) => {
    const key = AUTOMATION_SCENARIO_KEY(id);
    await LocalStorage.set(key, scenario);

    // Also save to Chrome storage.sync for backward compatibility
    // chrome.storage.sync.set({ [key]: scenario });

    return { success: true, key };
  };

  /**
   * Remove an automation scenario
   * @param {string} id - The ID of the scenario to remove
   * @returns {Promise<Object>} Object with success status
   */
  removeAutomationScenario = async (id) => {
    const key = AUTOMATION_SCENARIO_KEY(id);
    await LocalStorage.fullDestroy(key);

    // Also remove from Chrome storage.sync for backward compatibility
    // chrome.storage.sync.remove(key);

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
    // chrome.storage.sync.set({ [key]: scenario });

    return { success: true };
  };

  /**
   * Save a function
   * @param {Object} data - Object containing id and function
   * @returns {Promise<Object>} Object with success status and key
   */
  saveFunction = async ({ id, func }) => {
    const key = AUTOMATION_FUNCTION_KEY(id);

    await LocalStorage.set(key, func);
    return { success: true, key };
  };

  /**
   * Save a notification
   * @param {Object} data - Object containing id and notification
   * @returns {Promise<Object>} Object with success status and key
   */
  saveNotification = async ({ id, notification }) => {
    const key = AUTOMATION_NOTIFICATION_KEY(id);
    await LocalStorage.set(key, notification);
    return { success: true, key };
  };

  /**
   * Save a folder
   * @param {Object} data - Object containing id and folder
   * @returns {Promise<Object>} Object with success status and key
   */
  saveFolder = async ({ id, folder }) => {
    const key = AUTOMATION_FOLDER_KEY(id);
    await LocalStorage.set(key, folder);
    return { success: true, key };
  };

  /**
   * Save a schedule
   * @param {Object} data - Object containing id and schedule
   * @returns {Promise<Object>} Object with success status and key
   */
  saveSchedule = async ({ id, schedule }) => {
    const key = AUTOMATION_SCHEDULE_KEY(id);
    await LocalStorage.set(key, schedule);
    return { success: true, key };
  };

  /**
   * Save a trigger
   * @param {Object} data - Object containing id and trigger
   * @returns {Promise<Object>} Object with success status and key
   */
  saveTrigger = async ({ id, trigger }) => {
    const key = AUTOMATION_TRIGGER_KEY(id);
    await LocalStorage.set(key, trigger);
    return { success: true, key };
  };

  /**
   * Save an execution history entry
   * @param {Object} data - Object containing id and execution history entry
   * @returns {Promise<Object>} Object with success status and key
   */
  saveExecutionHistory = async ({ id, executionHistory }) => {
    const key = AUTOMATION_EXECUTION_HISTORY_KEY(id);
    await LocalStorage.set(key, executionHistory);
    return { success: true, key };
  };

  /**
   * Get all CSS snapshots
   * @returns {Promise<Array>} Array of snapshot IDs
   */
  getAllCSSSnapshots = async () => {
    // Get the list of snapshot IDs
    const snapshotsList = await LocalStorage.get(CSS_SNAPSHOTS_LIST_KEY);
    // Ensure we always return an array
    return Array.isArray(snapshotsList) ? snapshotsList : [];
  };

  /**
   * Get a specific CSS snapshot by ID
   * @param {string} id - The ID of the snapshot to get
   * @returns {Promise<Object|null>} The snapshot object or null if not found
   */
  getCSSSnapshot = async (id) => {
    const key = CSS_SNAPSHOT_KEY(id);
    return await LocalStorage.get(key);
  };

  /**
   * Save a CSS snapshot
   * @param {string} id - The ID of the snapshot to save
   * @param {Object} snapshot - The snapshot object to save
   * @returns {Promise<Object>} Object with success status and key
   */
  saveCSSSnapshot = async ({ id, snapshot }) => {
    const key = CSS_SNAPSHOT_KEY(id);

    // Save the snapshot
    await LocalStorage.set(key, snapshot);

    // Update the list of snapshots
    const snapshotsList = await this.getAllCSSSnapshots();
    if (!snapshotsList.includes(id)) {
      snapshotsList.push(id);

      await LocalStorage.set(CSS_SNAPSHOTS_LIST_KEY, snapshotsList);
    }

    return { success: true, key };
  };

  /**
   * Remove a CSS snapshot
   * @param {string} id - The ID of the snapshot to remove
   * @returns {Promise<Object>} Object with success status
   */
  removeCSSSnapshot = async (id) => {
    const key = CSS_SNAPSHOT_KEY(id);

    // Remove the snapshot
    await LocalStorage.fullDestroy(key);

    // Update the list of snapshots
    const snapshotsList = await this.getAllCSSSnapshots();
    const updatedList = snapshotsList.filter((snapshotId) => snapshotId !== id);
    await LocalStorage.set(CSS_SNAPSHOTS_LIST_KEY, updatedList);

    return { success: true };
  };

  /**
   * Get all saved element details
   * @returns {Promise<Array>} Array of element details IDs
   */
  getAllSavedElementDetails = async () => {
    // Get the list of element details IDs
    const elementDetailsList = await LocalStorage.get(ELEMENT_DETAILS_LIST_KEY);
    // Ensure we always return an array
    return Array.isArray(elementDetailsList) ? elementDetailsList : [];
  };

  /**
   * Get specific saved element details by ID
   * @param {string} id - The ID of the element details to get
   * @returns {Promise<Object|null>} The element details object or null if not found
   */
  getSavedElementDetails = async (id) => {
    const key = ELEMENT_DETAILS_KEY(id);
    return await LocalStorage.get(key);
  };

  /**
   * Save element details
   * @param {Object} data - Object containing id and element details
   * @returns {Promise<Object>} Object with success status and key
   */
  saveElementDetails = async ({ id, elementDetails }) => {
    const key = ELEMENT_DETAILS_KEY(id);

    // Save the element details
    await LocalStorage.set(key, elementDetails);

    // Update the list of element details
    const elementDetailsList = await this.getAllSavedElementDetails();
    if (!elementDetailsList.includes(id)) {
      elementDetailsList.push(id);
      await LocalStorage.set(ELEMENT_DETAILS_LIST_KEY, elementDetailsList);
    }

    return { success: true, key };
  };

  /**
   * Remove saved element details
   * @param {string} id - The ID of the element details to remove
   * @returns {Promise<Object>} Object with success status
   */
  removeSavedElementDetails = async (id) => {
    const key = ELEMENT_DETAILS_KEY(id);

    // Remove the element details
    await LocalStorage.fullDestroy(key);

    // Update the list of element details
    const elementDetailsList = await this.getAllSavedElementDetails();
    const updatedList = elementDetailsList.filter((elementId) => elementId !== id);
    await LocalStorage.set(ELEMENT_DETAILS_LIST_KEY, updatedList);

    return { success: true };
  };

  /**
   * Get ElementDetails panel position and size
   * @returns {Promise<Object|null>} The panel position/size object or null if not found
   */
  getElementDetailsPanelPosition = async () => {
    return await LocalStorage.get(ELEMENT_DETAILS_PANEL_POSITION_KEY);
  };

  /**
   * Save ElementDetails panel position and size
   * @param {Object} position - Object containing x, y, width, height
   * @returns {Promise<Object>} Object with success status and key
   */
  saveElementDetailsPanelPosition = async (position) => {
    await LocalStorage.set(ELEMENT_DETAILS_PANEL_POSITION_KEY, position);
    return { success: true, key: ELEMENT_DETAILS_PANEL_POSITION_KEY };
  };

  /**
   * Get NoteForm panel position and size
   * @returns {Promise<Object|null>} The panel position/size object or null if not found
   */
  getNoteFormPanelPosition = async () => {
    return await LocalStorage.get(NOTEFORM_PANEL_POSITION_KEY);
  };

  /**
   * Save NoteForm panel position and size
   * @param {Object} position - Object containing x, y, width, height
   * @returns {Promise<Object>} Object with success status and key
   */
  saveNoteFormPanelPosition = async (position) => {
    await LocalStorage.set(NOTEFORM_PANEL_POSITION_KEY, position);
    return { success: true, key: NOTEFORM_PANEL_POSITION_KEY };
  };

  /**
   * Get notes data
   * @returns {Promise<Object|null>} The notes object containing notes, groups, search query, etc. or null if not found
   */
  getNotesData = async () => {
    const notesData = await LocalStorage.get(NOTES_STORAGE_KEY);
    // Return default structure if no data exists
    return notesData || { notes: [], groups: [], searchQuery: "", showOnlyCurrentDomain: false };
  };

  /**
   * Save notes data
   * @param {Object} notesData - Object containing notes, groups, searchQuery, showOnlyCurrentDomain, selectedNoteId, etc.
   * @returns {Promise<Object>} Object with success status and key
   */
  setNotesData = async (notesData) => {
    await LocalStorage.set(NOTES_STORAGE_KEY, notesData);
    return { success: true, key: NOTES_STORAGE_KEY };
  };
}

export default new AppStorageService();
