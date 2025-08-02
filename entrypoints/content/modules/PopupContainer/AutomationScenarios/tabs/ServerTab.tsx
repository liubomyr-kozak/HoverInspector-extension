import React, { useState, useEffect } from "react";
import { Switch, message, Spin, Divider } from "antd";
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

const ServerTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [saveToBackend, setSaveToBackend] = useState(false);
  const [syncScenarios, setSyncScenarios] = useState(true);
  const [syncFunctions, setSyncFunctions] = useState(true);
  const [syncSchedules, setSyncSchedules] = useState(true);
  const [syncTriggers, setSyncTriggers] = useState(true);

  // Функція для валідації URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Завантаження налаштувань при ініціалізації
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await ExtensionStorageManager.getAutomationScenario(SERVER_SETTINGS_KEY);
        //localhost:5555
        http: if (settings) {
          setServerUrl(settings.serverUrl || "");
          setSaveToBackend(settings.saveToBackend || false);
          setSyncScenarios(settings.syncScenarios ?? true);
          setSyncFunctions(settings.syncFunctions ?? true);
          setSyncSchedules(settings.syncSchedules ?? true);
          setSyncTriggers(settings.syncTriggers ?? true);
        }
      } catch (error) {
        console.error("Failed to load server settings:", error);
        message.error("Не вдалося завантажити налаштування сервера");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Функція для збереження налаштувань
  const saveSettings = async (newSettings: Partial<ServerSettings>) => {
    try {
      setSaving(true);

      const currentSettings: ServerSettings = {
        serverUrl,
        saveToBackend,
        syncScenarios,
        syncFunctions,
        syncSchedules,
        syncTriggers,
        ...newSettings,
      };

      await ExtensionStorageManager.saveAutomationScenario({
        id: SERVER_SETTINGS_KEY,
        scenario: currentSettings,
      });
      message.success("Налаштування збережено");
    } catch (error) {
      console.error("Failed to save server settings:", error);
      message.error("Не вдалося зберегти налаштування");
    } finally {
      setSaving(false);
    }
  };

  const debouncedSaveUrl = debounce((url: string) => {
    if (url === "" || isValidUrl(url)) {
      saveSettings({ serverUrl: url });
    }
  }, 1000);

  // Обробник зміни URL сервера
  const handleServerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setServerUrl(newUrl);
    debouncedSaveUrl(newUrl);
  };

  // Обробник зміни опції "Save to Backend"
  const handleSaveToBackendChange = (checked: boolean) => {
    setSaveToBackend(checked);
    saveSettings({ saveToBackend: checked });
  };

  // Обробник зміни опцій синхронізації
  const handleSyncChange = (key: keyof ServerSettings, checked: boolean) => {
    const setters = {
      syncScenarios: setSyncScenarios,
      syncFunctions: setSyncFunctions,
      syncSchedules: setSyncSchedules,
      syncTriggers: setSyncTriggers,
    };

    const setter = setters[key as keyof typeof setters];
    if (setter) {
      setter(checked);
      saveSettings({ [key]: checked });
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <Spin tip="Завантаження налаштувань сервера..." size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <IconServer size={20} className="mr-2" />
        <h2 className="text-lg font-medium">Конфігурація сервера</h2>
        {saving && <Spin size="small" className="ml-2" />}
      </div>

      <div className="space-y-4">
        {/* Server URL */}
        <div>
          <label className="flex items-center text-sm font-medium mb-2">
            URL сервера
            <Tooltip title="Введіть URL для синхронізації даних автоматизації">
              <InfoCircleOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={handleServerUrlChange}
            placeholder="https://example.com/api/automation"
            disabled={saving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          {serverUrl && !isValidUrl(serverUrl) && (
            <p className="text-red-500 text-xs mt-1">Будь ласка, введіть дійсний URL</p>
          )}
        </div>

        {/* Save to Backend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium">Зберігати в бекенд</span>
            <Tooltip title="Увімкніть для збереження даних автоматизації на сервері бекенду">
              <InfoCircleOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          </div>
          <Switch checked={saveToBackend} onChange={handleSaveToBackendChange} disabled={saving} />
        </div>

        {/* Sync Options */}
        {saveToBackend && (
          <>
            <Divider orientation="left">Опції синхронізації</Divider>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm">Сценарії</span>
                  <Tooltip title="Увімкніть для синхронізації сценаріїв із сервером">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </div>
                <Switch
                  checked={syncScenarios}
                  onChange={(checked) => handleSyncChange("syncScenarios", checked)}
                  disabled={saving || !saveToBackend}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm">Функції</span>
                  <Tooltip title="Увімкніть для синхронізації функцій із сервером">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </div>
                <Switch
                  checked={syncFunctions}
                  onChange={(checked) => handleSyncChange("syncFunctions", checked)}
                  disabled={saving || !saveToBackend}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm">Розклади</span>
                  <Tooltip title="Увімкніть для синхронізації розкладів із сервером">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </div>
                <Switch
                  checked={syncSchedules}
                  onChange={(checked) => handleSyncChange("syncSchedules", checked)}
                  disabled={saving || !saveToBackend}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm">Тригери</span>
                  <Tooltip title="Увімкніть для синхронізації тригерів із сервером">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </div>
                <Switch
                  checked={syncTriggers}
                  onChange={(checked) => handleSyncChange("syncTriggers", checked)}
                  disabled={saving || !saveToBackend}
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
