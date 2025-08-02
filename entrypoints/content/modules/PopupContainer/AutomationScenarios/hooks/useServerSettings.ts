import { useState, useEffect } from "react";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";

const SERVER_SETTINGS_KEY = "automation_server_settings";

interface ServerSettings {
  serverUrl: string;
  saveToBackend: boolean;
  syncScenarios: boolean;
  syncFunctions: boolean;
  syncSchedules: boolean;
  syncTriggers: boolean;
}

/**
 * Custom hook to get server settings, specifically to check if functions are synced
 */
export const useServerSettings = () => {
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const savedSettings = await ExtensionStorageManager.getAutomationScenario(SERVER_SETTINGS_KEY);

        if (savedSettings) {
          setSettings(savedSettings);
        } else {
          // Default settings
          setSettings({
            serverUrl: "",
            saveToBackend: false,
            syncScenarios: true,
            syncFunctions: true,
            syncSchedules: true,
            syncTriggers: true,
          });
        }
      } catch (error) {
        console.error("Error loading server settings:", error);
        // Set default settings on error
        setSettings({
          serverUrl: "",
          saveToBackend: false,
          syncScenarios: true,
          syncFunctions: true,
          syncSchedules: true,
          syncTriggers: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Only consider syncFunctions as true if both saveToBackend and syncFunctions are true
  const isSyncFunctionsEnabled = settings?.saveToBackend === true && settings?.syncFunctions === true;

  return {
    settings,
    loading,
    syncFunctions: isSyncFunctionsEnabled,
  };
};
