export const AUTOMATION_SCENARIO_PREFIX = "AUTOMATION_SCENARIO_";
export const AUTOMATION_FUNCTION_PREFIX = AUTOMATION_SCENARIO_PREFIX;
export const AUTOMATION_NOTIFICATION_PREFIX = AUTOMATION_SCENARIO_PREFIX;
export const AUTOMATION_FOLDER_PREFIX = AUTOMATION_SCENARIO_PREFIX;
export const AUTOMATION_SCHEDULE_PREFIX = AUTOMATION_SCENARIO_PREFIX;
export const AUTOMATION_TRIGGER_PREFIX = AUTOMATION_SCENARIO_PREFIX;
export const AUTOMATION_EXECUTION_HISTORY_PREFIX = AUTOMATION_SCENARIO_PREFIX;

export const AUTOMATION_SCENARIO_KEY = (id: string) => {
  // Ensure id is not undefined or empty
  if (!id) {
    console.error("AUTOMATION_SCENARIO_KEY called with undefined or empty id");
    // Generate a fallback ID to prevent "AUTOMATION_SCENARIO_undefined" keys
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return `${AUTOMATION_SCENARIO_PREFIX}${fallbackId}`;
  }
  return `${AUTOMATION_SCENARIO_PREFIX}${id}`;
};

export const AUTOMATION_FUNCTION_KEY = (id: string) => {
  if (!id) {
    console.error("AUTOMATION_FUNCTION_KEY called with undefined or empty id");
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return `${AUTOMATION_FUNCTION_PREFIX}${fallbackId}`;
  }
  return `${AUTOMATION_FUNCTION_PREFIX}${id}`;
};

export const AUTOMATION_NOTIFICATION_KEY = (id: string) => {
  if (!id) {
    console.error("AUTOMATION_NOTIFICATION_KEY called with undefined or empty id");
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return `${AUTOMATION_NOTIFICATION_PREFIX}${fallbackId}`;
  }
  return `${AUTOMATION_NOTIFICATION_PREFIX}${id}`;
};

export const AUTOMATION_FOLDER_KEY = (id: string) => {
  if (!id) {
    console.error("AUTOMATION_FOLDER_KEY called with undefined or empty id");
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return `${AUTOMATION_FOLDER_PREFIX}${fallbackId}`;
  }
  return `${AUTOMATION_FOLDER_PREFIX}${id}`;
};

export const AUTOMATION_SCHEDULE_KEY = (id: string) => {
  if (!id) {
    console.error("AUTOMATION_SCHEDULE_KEY called with undefined or empty id");
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return `${AUTOMATION_SCHEDULE_PREFIX}${fallbackId}`;
  }
  return `${AUTOMATION_SCHEDULE_PREFIX}${id}`;
};

export const AUTOMATION_TRIGGER_KEY = (id: string) => {
  if (!id) {
    console.error("AUTOMATION_TRIGGER_KEY called with undefined or empty id");
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return `${AUTOMATION_TRIGGER_PREFIX}${fallbackId}`;
  }
  return `${AUTOMATION_TRIGGER_PREFIX}${id}`;
};

export const AUTOMATION_EXECUTION_HISTORY_KEY = (id: string) => {
  if (!id) {
    console.error("AUTOMATION_EXECUTION_HISTORY_KEY called with undefined or empty id");
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return `${AUTOMATION_EXECUTION_HISTORY_PREFIX}${fallbackId}`;
  }
  return `${AUTOMATION_EXECUTION_HISTORY_PREFIX}${id}`;
};

/** Live watching preferences (Automation → live watching); the background reads `enabled` */
export const LIVE_WATCH_SETTINGS_KEY = "automationLiveWatch";
