import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import {
  CustomFunction,
  ExecutionHistoryEntry,
  ExecutionHistoryMap,
  FunctionMap,
  NotificationMessage,
  NotificationMessageMap,
  NotificationPreference,
  Scenario,
  ScenarioFolder,
  ScenarioFolderMap,
  ScenarioMap,
  ScenarioStep,
  ScheduleConfig,
  ScheduleMap,
  TriggerConfig,
  TriggerMap,
} from "../types.ts";
import LocalAPIServer from "@/entrypoints/core/services/api/LocalAPIServer.ts";

/**
 * Retrieves all automation scenarios from storage
 *
 * @returns {Promise<ScenarioMap>} Promise that resolves to a map of scenario IDs to scenario objects
 */
export const getAllScenariosFromLocalStorage = async (): Promise<ScenarioMap> => {
  try {
    const allItems = await ExtensionStorageManager.getAllAutomationScenarios();

    const scenarios: ScenarioMap = {};

    // Filter for items with 'sc_' prefix
    Object.keys(allItems).forEach((key) => {
      if (key.startsWith("sc_")) {
        scenarios[key] = allItems[key] as unknown as Scenario;
      }
    });

    return scenarios as ScenarioMap;
  } catch (e) {
    console.error("Error getting scenarios from storage:", e);
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
    const settings = await ExtensionStorageManager.getAutomationScenario("automation_server_settings");

    const serverSyncEnabled = settings?.serverUrl && settings?.saveToBackend && settings?.syncFunctions;

    // Get all local functions
    const allItems = await ExtensionStorageManager.getAllAutomationScenarios();
    const functions: FunctionMap = {};

    // Filter for items with 'fu_' prefix
    Object.keys(allItems).forEach((key) => {
      if (key.startsWith("fu_")) {
        functions[key] = allItems[key] as unknown as CustomFunction;
      }
    });

    // If server sync is enabled, try to get functions from server as well
    if (serverSyncEnabled) {
      try {
        const serverFunctions = await LocalAPIServer.getAllFunctionsFromServer();

        // Merge server functions with local functions
        // Server functions will override local functions if they have the same ID
        Object.keys(serverFunctions).forEach((key) => {
          functions[key] = serverFunctions[key];
        });
      } catch (serverError) {
        console.error("Error getting functions from server:", serverError);
        // Continue with local functions only
      }
    }

    return functions;
  } catch (e) {
    console.error("Error getting functions from storage:", e);
    return {};
  }
};

/**
 * Retrieves all scenario folders from storage
 *
 * @returns {Promise<ScenarioFolderMap>} Promise that resolves to a map of folder IDs to folder objects
 */
export const getAllFoldersFromLocalStorage = async (): Promise<ScenarioFolderMap> => {
  try {
    // Use the same storage manager but filter for folder keys (prefix 'fo_')
    const allItems = await ExtensionStorageManager.getAllAutomationScenarios();
    const folders: ScenarioFolderMap = {};

    // Filter for items with 'fo_' prefix
    Object.keys(allItems).forEach((key) => {
      if (key.startsWith("fo_")) {
        folders[key] = allItems[key] as unknown as ScenarioFolder;
      }
    });

    return folders;
  } catch (e) {
    console.error("Error getting folders from storage:", e);
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
    // const id = key.replace(/^sc_/, ""); //not used
    const result = await ExtensionStorageManager.removeAutomationScenario({ id: key });
    return result.success;
  } catch (e) {
    console.error("Error removing scenario from storage:", e);
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
    // const id = key.replace(/^fu_/, ""); //not used
    const result = await ExtensionStorageManager.removeAutomationScenario({ id: key });
    return result.success;
  } catch (e) {
    console.error("Error removing function from storage:", e);
    return false;
  }
};

/**
 * Removes a folder from storage
 *
 * @param {string} key - The key of the folder to remove
 * @returns {Promise<boolean>} Promise that resolves to true if the removal was successful, false otherwise
 */
export const removeFolderFromLocalStorage = async (key: string): Promise<boolean> => {
  try {
    // Extract the ID from the key (remove the 'fo_' prefix)
    // const id = key.replace(/^fo_/, ""); //not used
    const result = await ExtensionStorageManager.removeAutomationScenario({ id: key });
    return result.success;
  } catch (e) {
    console.error("Error removing folder from storage:", e);
    return false;
  }
};

/**
 * Generates a unique ID for a new scenario, function, schedule, trigger or history entry.
 * The ID starts with a lowercase letter followed by random characters; callers add the type prefix (sc_, fu_ ...).
 *
 * @returns {Promise<string>} A Promise that resolves to a unique ID
 */
export const generateUniqueId = async (): Promise<string> => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const first = lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;

  return first + random.substring(0, 15);
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
    const result = await ExtensionStorageManager.saveAutomationScenario({
      id,
      scenario,
    });
    return result.success;
  } catch (e) {
    console.error("Error saving scenario to storage:", e);
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
    // Use the specialized function storage method
    // The 'fu_' prefix will help distinguish functions from scenarios in the UI
    const storageId = id.startsWith("fu_") ? id : `fu_${id}`;

    const result = await ExtensionStorageManager.saveFunction({
      id: storageId,
      func: customFunction,
    });
    return result.success;
  } catch (e) {
    console.error("Error saving function to storage:", e);
    return false;
  }
};

/**
 * Updates an existing folder using ExtensionStorageManager
 *
 * @param {string} id - The unique ID for the folder
 * @param {ScenarioFolder} folder - The folder object to save
 * @returns {Promise<boolean>} Promise that resolves to true if the save was successful, false otherwise
 */
export const updateFolderInLocalStorage = async (id: string, folder: ScenarioFolder): Promise<boolean> => {
  try {
    // Use the specialized folder storage method
    // The 'fo_' prefix will help distinguish folders from scenarios in the UI
    const prefixedId = id.startsWith("fo_") ? id : `fo_${id}`;

    // Extract the ID without the prefix for the storage manager
    const storageId = prefixedId.replace(/^fo_/, "");

    const result = await ExtensionStorageManager.saveFolder({
      id: storageId,
      folder,
    });
    return result.success;
  } catch (e) {
    console.error("Error updating folder in storage:", e);
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
    const id = scenarioId.replace(/^sc_/, "");

    // Add the step to the scenario
    const result = await ExtensionStorageManager.addStepToAutomationScenario(id, step);

    return result.success;
  } catch (e) {
    console.error("Error adding step to scenario:", e);
    return false;
  }
};

/**
 * Filters scenarios by search term (title or description)
 *
 * @param {ScenarioMap} scenarios - The scenarios to filter
 * @param {string} searchTerm - The search term to filter by
 * @returns {ScenarioMap} Filtered scenarios
 */
export const filterScenariosBySearchTerm = (scenarios: ScenarioMap, searchTerm: string): ScenarioMap => {
  if (!searchTerm) {
    return scenarios;
  }

  const filteredScenarios: ScenarioMap = {};
  const lowerSearchTerm = searchTerm.toLowerCase();

  Object.keys(scenarios).forEach((key) => {
    const scenario = scenarios[key];
    const title = scenario.title.toLowerCase();
    const description = scenario.description?.toLowerCase() || "";

    if (title.includes(lowerSearchTerm) || description.includes(lowerSearchTerm)) {
      filteredScenarios[key] = scenario;
    }
  });

  return filteredScenarios;
};

/**
 * Filters scenarios by tags
 *
 * @param {ScenarioMap} scenarios - The scenarios to filter
 * @param {string[]} tags - The tags to filter by
 * @returns {ScenarioMap} Filtered scenarios
 */
export const filterScenariosByTags = (scenarios: ScenarioMap, tags: string[]): ScenarioMap => {
  if (!tags || tags.length === 0) {
    return scenarios;
  }

  const filteredScenarios: ScenarioMap = {};

  Object.keys(scenarios).forEach((key) => {
    const scenario = scenarios[key];

    // If the scenario has tags and at least one of them matches the filter tags
    if (scenario.tags && scenario.tags.some((tag) => tags.includes(tag))) {
      filteredScenarios[key] = scenario;
    }
  });

  return filteredScenarios;
};

/**
 * Filters scenarios by category
 *
 * @param {ScenarioMap} scenarios - The scenarios to filter
 * @param {string} category - The category to filter by
 * @returns {ScenarioMap} Filtered scenarios
 */
export const filterScenariosByCategory = (scenarios: ScenarioMap, category: string): ScenarioMap => {
  if (!category) {
    return scenarios;
  }

  const filteredScenarios: ScenarioMap = {};

  Object.keys(scenarios).forEach((key) => {
    const scenario = scenarios[key];

    if (scenario.category === category) {
      filteredScenarios[key] = scenario;
    }
  });

  return filteredScenarios;
};

/**
 * Filters scenarios by folder
 *
 * @param {ScenarioMap} scenarios - The scenarios to filter
 * @param {string} folderId - The folder ID to filter by (null for root-level scenarios)
 * @returns {ScenarioMap} Filtered scenarios
 */
export const filterScenariosByFolder = (scenarios: ScenarioMap, folderId: string | null): ScenarioMap => {
  const filteredScenarios: ScenarioMap = {};

  Object.keys(scenarios).forEach((key) => {
    const scenario = scenarios[key];

    // If folderId is null, include scenarios without a folderId or with folderId explicitly set to null
    if (folderId === null) {
      if (!scenario.folderId || scenario.folderId === null) {
        filteredScenarios[key] = scenario;
      }
    } else if (scenario.folderId === folderId) {
      filteredScenarios[key] = scenario;
    }
  });

  return filteredScenarios;
};

/**
 * Retrieves all schedules from storage
 *
 * @returns {Promise<ScheduleMap>} Promise that resolves to a map of schedule IDs to schedule objects
 */
export const getAllSchedulesFromLocalStorage = async (): Promise<ScheduleMap> => {
  try {
    // Use the same storage manager but filter for schedule keys (prefix 'sch_')
    const allItems = await ExtensionStorageManager.getAllAutomationScenarios();
    const schedules: ScheduleMap = {};

    // Filter for items with 'sch_' prefix
    Object.keys(allItems).forEach((key) => {
      if (key.startsWith("sch_")) {
        schedules[key] = allItems[key] as unknown as ScheduleConfig;
      }
    });

    return schedules;
  } catch (e) {
    console.error("Error getting schedules from storage:", e);
    return {};
  }
};

/**
 * Saves a schedule using ExtensionStorageManager
 *
 * @param {string} id - The unique ID for the schedule
 * @param {ScheduleConfig} schedule - The schedule object to save
 * @returns {Promise<boolean>} Promise that resolves to true if the save was successful, false otherwise
 */
export const saveScheduleToLocalStorage = async (id: string, schedule: ScheduleConfig): Promise<boolean> => {
  try {
    // Use the specialized schedule storage method
    // The 'sch_' prefix will help distinguish schedules from scenarios in the UI
    const storageId = id.startsWith("sch_") ? id : `sch_${id}`;

    const result = await ExtensionStorageManager.saveSchedule({
      id: storageId,
      schedule,
    });
    return result.success;
  } catch (e) {
    console.error("Error saving schedule to storage:", e);
    return false;
  }
};

/**
 * Removes a schedule from storage
 *
 * @param {string} key - The key of the schedule to remove
 * @returns {Promise<boolean>} Promise that resolves to true if the removal was successful, false otherwise
 */
export const removeScheduleFromLocalStorage = async (key: string): Promise<boolean> => {
  try {
    // Storage keys keep the 'sch_' prefix (see the save function above)
    const id = key.startsWith("sch_") ? key : `sch_${key}`;
    const result = await ExtensionStorageManager.removeAutomationScenario({ id });
    return result.success;
  } catch (e) {
    console.error("Error removing schedule from storage:", e);
    return false;
  }
};

/**
 * Updates the next execution time for a schedule
 *
 * @param {string} key - The key of the schedule to update
 * @param {string} nextExecution - The next execution time as an ISO date string
 * @returns {Promise<boolean>} Promise that resolves to true if the update was successful, false otherwise
 */
export const updateScheduleNextExecution = async (key: string, nextExecution: string): Promise<boolean> => {
  try {
    // Get the schedule
    const schedules = await getAllSchedulesFromLocalStorage();
    const schedule = schedules[key];

    if (!schedule) {
      console.error(`Schedule with ID ${key} not found`);
      return false;
    }

    // Update the next execution time
    schedule.nextExecution = nextExecution;

    // Save the updated schedule
    return await saveScheduleToLocalStorage(key, schedule);
  } catch (e) {
    console.error("Error updating schedule next execution time:", e);
    return false;
  }
};

/**
 * Updates the last executed time for a schedule
 *
 * @param {string} key - The key of the schedule to update
 * @param {string} lastExecuted - The last executed time as an ISO date string
 * @returns {Promise<boolean>} Promise that resolves to true if the update was successful, false otherwise
 */
export const updateScheduleLastExecuted = async (key: string, lastExecuted: string): Promise<boolean> => {
  try {
    // Get the schedule
    const schedules = await getAllSchedulesFromLocalStorage();
    const schedule = schedules[key];

    if (!schedule) {
      console.error(`Schedule with ID ${key} not found`);
      return false;
    }

    // Update the last executed time
    schedule.lastExecuted = lastExecuted;

    // Save the updated schedule
    return await saveScheduleToLocalStorage(key, schedule);
  } catch (e) {
    console.error("Error updating schedule last executed time:", e);
    return false;
  }
};

/**
 * Retrieves all triggers from storage
 *
 * @returns {Promise<TriggerMap>} Promise that resolves to a map of trigger IDs to trigger objects
 */
export const getAllTriggersFromLocalStorage = async (): Promise<TriggerMap> => {
  try {
    // Use the same storage manager but filter for trigger keys (prefix 'tr_')
    const allItems = await ExtensionStorageManager.getAllAutomationScenarios();
    const triggers: TriggerMap = {};

    // Filter for items with 'tr_' prefix
    Object.keys(allItems).forEach((key) => {
      if (key.startsWith("tr_")) {
        triggers[key] = allItems[key] as unknown as TriggerConfig;
      }
    });

    return triggers;
  } catch (e) {
    console.error("Error getting triggers from storage:", e);
    return {};
  }
};

/**
 * Saves a trigger using ExtensionStorageManager
 *
 * @param {string} id - The unique ID for the trigger
 * @param {TriggerConfig} trigger - The trigger object to save
 * @returns {Promise<boolean>} Promise that resolves to true if the save was successful, false otherwise
 */
export const saveTriggerToLocalStorage = async (id: string, trigger: TriggerConfig): Promise<boolean> => {
  try {
    // Use the specialized trigger storage method
    // The 'tr_' prefix will help distinguish triggers from scenarios in the UI
    const storageId = id.startsWith("tr_") ? id : `tr_${id}`;

    const result = await ExtensionStorageManager.saveTrigger({
      id: storageId,
      trigger,
    });
    return result.success;
  } catch (e) {
    console.error("Error saving trigger to storage:", e);
    return false;
  }
};

/**
 * Removes a trigger from storage
 *
 * @param {string} key - The key of the trigger to remove
 * @returns {Promise<boolean>} Promise that resolves to true if the removal was successful, false otherwise
 */
export const removeTriggerFromLocalStorage = async (key: string): Promise<boolean> => {
  try {
    // Storage keys keep the 'tr_' prefix (see the save function above)
    const id = key.startsWith("tr_") ? key : `tr_${key}`;
    const result = await ExtensionStorageManager.removeAutomationScenario({ id });
    return result.success;
  } catch (e) {
    console.error("Error removing trigger from storage:", e);
    return false;
  }
};

/**
 * Updates the last triggered time for a trigger
 *
 * @param {string} key - The key of the trigger to update
 * @param {string} lastTriggered - The last triggered time as an ISO date string
 * @returns {Promise<boolean>} Promise that resolves to true if the update was successful, false otherwise
 */
export const updateTriggerLastTriggered = async (key: string, lastTriggered: string): Promise<boolean> => {
  try {
    // Get the trigger
    const triggers = await getAllTriggersFromLocalStorage();
    const trigger = triggers[key];

    if (!trigger) {
      console.error(`Trigger with ID ${key} not found`);
      return false;
    }

    // Update the last triggered time
    trigger.lastTriggered = lastTriggered;

    // Save the updated trigger
    return await saveTriggerToLocalStorage(key, trigger);
  } catch (e) {
    console.error("Error updating trigger last triggered time:", e);
    return false;
  }
};

/**
 * Retrieves all execution history entries from storage
 *
 * @returns {Promise<ExecutionHistoryMap>} Promise that resolves to a map of execution history entry IDs to execution history entries
 */
export const getAllExecutionHistoryFromLocalStorage = async (): Promise<ExecutionHistoryMap> => {
  try {
    // Use the same storage manager but filter for execution history keys (prefix 'ex_hist_')
    const allItems = await ExtensionStorageManager.getAllAutomationScenarios();
    const executionHistory: ExecutionHistoryMap = {};

    // Filter for items with 'ex_hist_' prefix
    Object.keys(allItems).forEach((key) => {
      if (key.startsWith("ex_hist_")) {
        executionHistory[key] = allItems[key] as unknown as ExecutionHistoryEntry;
      }
    });

    return executionHistory;
  } catch (e) {
    console.error("Error getting execution history from storage:", e);
    return {};
  }
};

/**
 * Saves an execution history entry using ExtensionStorageManager
 *
 * @param {string} id - The unique ID for the execution history entry
 * @param {ExecutionHistoryEntry} executionHistoryEntry - The execution history entry to save
 * @returns {Promise<boolean>} Promise that resolves to true if the save was successful, false otherwise
 */
export const saveExecutionHistoryToLocalStorage = async (
  id: string,
  executionHistoryEntry: ExecutionHistoryEntry,
): Promise<boolean> => {
  try {
    // Use the specialized execution history storage method
    // The 'ex_hist_' prefix will help distinguish execution history entries from scenarios in the UI
    const key = id.startsWith("ex_hist_") ? id : `ex_hist_${id}`;


    const result = await ExtensionStorageManager.saveExecutionHistory({
      id: key,
      executionHistory: executionHistoryEntry,
    });
    return result.success;
  } catch (e) {
    console.error("Error saving execution history entry to storage:", e);
    return false;
  }
};

/**
 * Removes an execution history entry from storage
 *
 * @param {string} key - The key of the execution history entry to remove
 * @returns {Promise<boolean>} Promise that resolves to true if the removal was successful, false otherwise
 */
export const removeExecutionHistoryFromLocalStorage = async (key: string): Promise<boolean> => {
  try {
    // Storage keys keep the 'ex_hist_' prefix (see the save function above)
    const id = key.startsWith("ex_hist_") ? key : `ex_hist_${key}`;
    const result = await ExtensionStorageManager.removeAutomationScenario({ id });
    return result.success;
  } catch (e) {
    console.error("Error removing execution history entry from storage:", e);
    return false;
  }
};

/**
 * Retrieves notification preferences from storage
 *
 * @returns {Promise<NotificationPreference>} Promise that resolves to notification preferences
 */
export const getNotificationPreferencesFromLocalStorage = async (): Promise<NotificationPreference> => {
  try {
    // Use the same storage manager but with a specific key for notification preferences
    const result = await ExtensionStorageManager.getAutomationScenario("notification_preferences");

    if (result) {
      return result as unknown as NotificationPreference;
    }

    // Return default preferences if none are found
    return {
      enabled: true,
      showSuccess: true,
      showError: true,
      showWarning: true,
      showInfo: true,
      desktop: true,
      sound: true,
      soundVolume: 50,
    };
  } catch (e) {
    console.error("Error getting notification preferences from storage:", e);

    // Return default preferences on error
    return {
      enabled: true,
      showSuccess: true,
      showError: true,
      showWarning: true,
      showInfo: true,
      desktop: true,
      sound: true,
      soundVolume: 50,
    };
  }
};

/**
 * Saves notification preferences to storage
 *
 * @param {NotificationPreference} preferences - The notification preferences to save
 * @returns {Promise<boolean>} Promise that resolves to true if the save was successful, false otherwise
 */
export const saveNotificationPreferencesToLocalStorage = async (
  preferences: NotificationPreference,
): Promise<boolean> => {
  try {
    const result = await ExtensionStorageManager.saveNotification({
      id: "notification_preferences",
      notification: preferences,
    });
    return result.success;
  } catch (e) {
    console.error("Error saving notification preferences to storage:", e);
    return false;
  }
};

/**
 * Retrieves all notification messages from storage
 *
 * @returns {Promise<NotificationMessageMap>} Promise that resolves to a map of notification message IDs to notification messages
 */
export const getAllNotificationMessagesFromLocalStorage = async (): Promise<NotificationMessageMap> => {
  try {
    // Use the same storage manager but filter for notification message keys (prefix 'notification_')
    const allItems = await ExtensionStorageManager.getAllAutomationScenarios();
    const notificationMessages: NotificationMessageMap = {};

    // Filter for items with 'notification_' prefix
    Object.keys(allItems).forEach((key) => {
      if (key.startsWith("notification_") && key !== "notification_preferences") {
        notificationMessages[key] = allItems[key] as unknown as NotificationMessage;
      }
    });

    return notificationMessages;
  } catch (e) {
    console.error("Error getting notification messages from storage:", e);
    return {};
  }
};

/**
 * Saves a notification message to storage
 *
 * @param {string} id - The unique ID for the notification message
 * @param {NotificationMessage} message - The notification message to save
 * @returns {Promise<boolean>} Promise that resolves to true if the save was successful, false otherwise
 */
export const saveNotificationMessageToLocalStorage = async (
  id: string,
  message: NotificationMessage,
): Promise<boolean> => {
  try {
    // Use the specialized notification storage method
    // The 'notification_' prefix will help distinguish notification messages from scenarios in the UI
    const storageId = id.startsWith("notification_") ? id : `notification_${id}`;

    const result = await ExtensionStorageManager.saveNotification({
      id: storageId,
      notification: message,
    });
    return result.success;
  } catch (e) {
    console.error("Error saving notification message to storage:", e);
    return false;
  }
};

/**
 * Removes a notification message from storage
 *
 * @param {string} key - The key of the notification message to remove
 * @returns {Promise<boolean>} Promise that resolves to true if the removal was successful, false otherwise
 */
export const removeNotificationMessageFromLocalStorage = async (key: string): Promise<boolean> => {
  try {
    // Storage keys keep the 'notification_' prefix (see the save function above)
    const id = key.startsWith("notification_") ? key : `notification_${key}`;
    const result = await ExtensionStorageManager.removeAutomationScenario({ id });
    return result.success;
  } catch (e) {
    console.error("Error removing notification message from storage:", e);
    return false;
  }
};

/**
 * Clears all notification messages from storage
 *
 * @returns {Promise<boolean>} Promise that resolves to true if the clear was successful, false otherwise
 */
export const clearAllNotificationMessagesFromLocalStorage = async (): Promise<boolean> => {
  try {
    const notificationMessages = await getAllNotificationMessagesFromLocalStorage();

    // Remove each notification message
    const promises = Object.keys(notificationMessages).map((key) => removeNotificationMessageFromLocalStorage(key));

    // Wait for all removals to complete
    const results = await Promise.all(promises);

    // Return true if all removals were successful
    return results.every((result) => result);
  } catch (e) {
    console.error("Error clearing notification messages from storage:", e);
    return false;
  }
};
