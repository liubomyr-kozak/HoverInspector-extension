import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Switch, message, Spin, Divider } from "antd";
import { IconServer } from "@tabler/icons-react";
import { debounce } from "lodash";

import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";
import { InfoCircleOutlined } from "@ant-design/icons";

const SERVER_SETTINGS_KEY = "automation_server_settings";

interface ServerSettings {
  serverUrl: string;
  saveToBackend: boolean;
  syncScenarios: boolean;
  syncFunctions: boolean;
  syncSchedules: boolean;
  syncTriggers: boolean;
}

const defaultSettings: ServerSettings = {
  serverUrl: "",
  saveToBackend: false,
  syncScenarios: true,
  syncFunctions: true,
  syncSchedules: true,
  syncTriggers: true,
};

interface ServerTabProps {
  /** Hides the Server tab (it is shown again by holding the S key for 2 seconds) */
  onHide?: () => void;
}

// Validates a URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const ServerTab: React.FC<ServerTabProps> = ({ onHide }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ServerSettings>(defaultSettings);
  const { serverUrl, saveToBackend, syncScenarios, syncFunctions, syncSchedules, syncTriggers } = settings;

  // The latest settings, for saves started by the debounced URL input
  const settingsRef = useRef<ServerSettings>(defaultSettings);
  settingsRef.current = settings;

  // Load the settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const stored = await ExtensionStorageManager.getAutomationScenario(SERVER_SETTINGS_KEY);
        if (stored) {
          setSettings({
            serverUrl: stored.serverUrl || "",
            saveToBackend: stored.saveToBackend || false,
            syncScenarios: stored.syncScenarios ?? true,
            syncFunctions: stored.syncFunctions ?? true,
            syncSchedules: stored.syncSchedules ?? true,
            syncTriggers: stored.syncTriggers ?? true,
          });
        }
      } catch (error) {
        console.error("Failed to load server settings:", error);
        message.error("Failed to load the server settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save the settings
  const saveSettings = async (newSettings: Partial<ServerSettings>) => {
    try {
      setSaving(true);

      const currentSettings: ServerSettings = { ...settingsRef.current, ...newSettings };

      await ExtensionStorageManager.saveAutomationScenario({
        id: SERVER_SETTINGS_KEY,
        scenario: currentSettings,
      });
    } catch (error) {
      console.error("Failed to save server settings:", error);
      message.error("Failed to save the server settings");
    } finally {
      setSaving(false);
    }
  };

  const saveSettingsRef = useRef(saveSettings);
  saveSettingsRef.current = saveSettings;

  // Save the URL once the user stopped typing
  const debouncedSaveUrl = useMemo(
    () =>
      debounce((url: string) => {
        if (url === "" || isValidUrl(url)) {
          saveSettingsRef.current({ serverUrl: url });
        }
      }, 1000),
    [],
  );

  useEffect(() => () => debouncedSaveUrl.flush(), [debouncedSaveUrl]);

  // Server URL change
  const handleServerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setSettings((current) => ({ ...current, serverUrl: newUrl }));
    debouncedSaveUrl(newUrl);
  };

  // "Save to backend" change
  const handleSaveToBackendChange = (checked: boolean) => {
    setSettings((current) => ({ ...current, saveToBackend: checked }));
    saveSettings({ saveToBackend: checked });
  };

  // Sync option change
  const handleSyncChange = (key: keyof ServerSettings, checked: boolean) => {
    setSettings((current) => ({ ...current, [key]: checked }));
    saveSettings({ [key]: checked });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <Spin tip="Loading server settings..." size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <IconServer size={20} className="mr-2" />
        <h2 className="text-lg font-medium">Server configuration</h2>
        {saving && <Spin size="small" className="ml-2" />}
        {onHide && (
          <Button size="small" type="text" className="ml-auto" onClick={onHide} title="Hold S for 2 seconds to show it again">
            Hide tab
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Server URL */}
        <div>
          <label className="flex items-center text-sm font-medium mb-2">
            Server URL
            <Tooltip title="The URL of the server automation data is synced with">
              <InfoCircleOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={handleServerUrlChange}
            placeholder="https://example.com/api/automation"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          {serverUrl && !isValidUrl(serverUrl) && (
            <p className="text-red-500 text-xs mt-1">Please enter a valid URL</p>
          )}
        </div>

        {/* Save to Backend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium">Save to backend</span>
            <Tooltip title="Save automation data on the backend server">
              <InfoCircleOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          </div>
          <Switch checked={saveToBackend} onChange={handleSaveToBackendChange} />
        </div>

        {/* Sync Options */}
        {saveToBackend && (
          <>
            <Divider orientation="left">Sync options</Divider>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm">Scenarios</span>
                  <Tooltip title="Sync scenarios with the server">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </div>
                <Switch
                  checked={syncScenarios}
                  onChange={(checked) => handleSyncChange("syncScenarios", checked)}
                  disabled={!saveToBackend}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm">Functions</span>
                  <Tooltip title="Sync functions with the server">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </div>
                <Switch
                  checked={syncFunctions}
                  onChange={(checked) => handleSyncChange("syncFunctions", checked)}
                  disabled={!saveToBackend}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm">Schedules</span>
                  <Tooltip title="Sync schedules with the server">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </div>
                <Switch
                  checked={syncSchedules}
                  onChange={(checked) => handleSyncChange("syncSchedules", checked)}
                  disabled={!saveToBackend}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm">Triggers</span>
                  <Tooltip title="Sync triggers with the server">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </div>
                <Switch
                  checked={syncTriggers}
                  onChange={(checked) => handleSyncChange("syncTriggers", checked)}
                  disabled={!saveToBackend}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ServerTab;
