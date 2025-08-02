import { chromeActionsSlice } from "@entrypoints/core/libs/chromeActionsSlice.ts";
import AppStorageService from "@entrypoints/core/services/storage/AppStorageService.ts";
import { appSettingsInitial } from "@entrypoints/core/initialData/app.ts";
import ExtensionLoader from "@entrypoints/core/services/ExtensionLoader.ts";
import LocalAPIServer from "@entrypoints/core/services/api/LocalAPIServer.ts";
import ScriptInjectionService from "@entrypoints/core/services/ScriptInjectionService.ts";
import { injectScript } from "@entrypoints/shared/utils/scriptInjection.ts";

export const actionsContextSlice = chromeActionsSlice({
  getState: async () => {
    return await AppStorageService.getAppState();
  },

  setState: async (data) => {
    await AppStorageService.setAppState(data);
  },

  setupInitialState: async () => {
    await AppStorageService.setAppState(appSettingsInitial);

    return await AppStorageService.getAppState();
  },

  deactivateAppInTab: async () => {
    ExtensionLoader.loadStrategy.deactivate();
  },

  changeLauncherIconOrder: async ({ data: iconOrder }) => {
    const setting = await AppStorageService.getAppState();
    await AppStorageService.setAppState({
      ...setting,
      launcher: {
        ...setting.launcher,
        iconOrder,
      },
    });
  },

  changeFeaturePopupPosition: async ({ data: featurePopupPosition }) => {
    const setting = await AppStorageService.getAppState();
    await AppStorageService.setAppState({
      ...setting,
      featurePopupPosition,
    });
  },

  changeLauncherActiveFeature: async ({ data: activeIcons }) => {
    const setting = await AppStorageService.getAppState();
    await AppStorageService.setAppState({
      ...setting,
      launcher: {
        ...setting.launcher,
        activeIcons,
      },
    });
  },

  changeCurrentWindowSize: async ({ data: width }) => {
    if (browser?.windows?.getCurrent) {
      browser.windows.getCurrent({}, (win) => {
        if (win.id) {
          chrome.windows.update(win.id, {
            width,
          });
        }
      });
    }
  },

  minimizedFeaturePopup: async ({ data: featurePopupIsMinimized }) => {
    const setting = await AppStorageService.getAppState();
    await AppStorageService.setAppState({
      ...setting,
      featurePopupIsMinimized,
    });
  },

  changePreventDefault: async ({ data: preventDefault }) => {
    const setting = await AppStorageService.getAppState();
    await AppStorageService.setAppState({
      ...setting,
      preventDefault,
    });
  },

  changeViewType: async ({ data: viewType }) => {
    const setting = await AppStorageService.getAppState();
    await AppStorageService.setAppState({
      ...setting,
      viewType,
    });
  },

  // Automation Scenarios Actions
  getAllAutomationScenarios: async () => {
    return await AppStorageService.getAllAutomationScenarios();
  },

  getAutomationScenario: async (data) => {
    // const settings = await AppStorageService.getAutomationScenario({
    //   data: "automation_server_settings",
    // });
    // const serverScenariosSyncEnabled = settings?.serverUrl && settings?.saveToBackend && settings?.syncScenarios;
    // const serverSyncEnabled = settings?.serverUrl && settings?.saveToBackend && settings?.syncFunctions;
    //
    //

    return await AppStorageService.getAutomationScenario(data);
  },

  // test working
  saveAutomationScenario: async ({ data }) => {
    const settings = await AppStorageService.getAutomationScenario({
      data: "automation_server_settings",
    });

    const result = await AppStorageService.saveAutomationScenario(data);
    const serverSyncEnabled = settings?.serverUrl && settings?.saveToBackend && settings?.syncScenarios;

    // After successful save to local storage, sync with backend
    if (serverSyncEnabled && result.success && data.id && data.scenario) {
      await LocalAPIServer.syncScenario(data.id, data.scenario);
    }

    return result;
  },

  saveFunction: async ({ data }) => {
    const settings = await AppStorageService.getAutomationScenario({
      data: "automation_server_settings",
    });

    const result = await AppStorageService.saveFunction(data);
    const serverSyncEnabled = settings?.serverUrl && settings?.saveToBackend && settings?.syncFunctions;
    // After successful save to local storage, sync with backend

    if (serverSyncEnabled && result.success && data.id && data.func) {
      await LocalAPIServer.syncFunction(data.id, data.func);
      // Auto-inject generated script after successful function save and code generation
      try {
        const response: any = await fetch(`${settings.serverUrl}/generate-code`, {
          method: "GET",
          headers: { accept: "application/json", "Content-Type": "application/json" },
        });

        debugger;

        injectScript({
          downloadUrl: response.downloadUrl,
          filename: response.filename,
          groupPrefix: "functions_",
        });
        // await ScriptInjectionService.generateAndInjectCode({
        //   serverUrl: settings.serverUrl,
        // });
        console.log("Background: Auto-injected script after function save");
      } catch (error) {
        console.error("Background: Failed to auto-inject script after function save:", error);
        // Don't fail the function save if injection fails
      }
    }

    return result;
  },

  saveNotification: async ({ data }) => {
    return await AppStorageService.saveNotification(data);
  },

  saveFolder: async ({ data }) => {
    return await AppStorageService.saveFolder(data);
  },

  saveSchedule: async ({ data }) => {
    const settings = await AppStorageService.getAutomationScenario({
      data: "automation_server_settings",
    });

    const result = await AppStorageService.saveSchedule(data);
    const serverSyncEnabled = settings?.serverUrl && settings?.saveToBackend && settings?.syncSchedules;

    // After successful save to local storage, sync with backend
    if (serverSyncEnabled && result.success && data.id && data.schedule) {
      await LocalAPIServer.syncSchedule(data.id, data.schedule);
    }

    return result;
  },

  saveTrigger: async ({ data }) => {
    const settings = await AppStorageService.getAutomationScenario({
      data: "automation_server_settings",
    });

    const result = await AppStorageService.saveTrigger(data);

    const serverSyncEnabled = settings?.serverUrl && settings?.saveToBackend && settings?.syncTriggers;

    // After successful save to local storage, sync with backend
    if (serverSyncEnabled && result.success && data.id && data.trigger) {
      await LocalAPIServer.syncTrigger(data.id, data.trigger);
    }

    return result;
  },

  saveExecutionHistory: async ({ data }) => {
    return await AppStorageService.saveExecutionHistory(data);
  },

  removeAutomationScenario: async ({ data: { id } }) => {
    const settings = await AppStorageService.getAutomationScenario({
      data: "automation_server_settings",
    });

    const result = await AppStorageService.removeAutomationScenario(id);

    const serverSyncEnabled = settings?.serverUrl && settings?.saveToBackend;

    // After successful removal from local storage, remove from backend

    if (serverSyncEnabled && result.success) {
      if (id.startsWith("fu_")) {
        await LocalAPIServer.deleteFunction(id);
      } else {
        // await LocalAPIServer.deleteScenario(id);
      }
    }

    return result;
  },

  addStepToAutomationScenario: async ({ data: { id, step } }) => {
    return await AppStorageService.addStepToAutomationScenario(id, step);
  },

  hideSponsorMessage: async ({ data: hiddenUntil }) => {
    const setting = await AppStorageService.getAppState();
    if (!setting.sponsorMessage) {
      setting.sponsorMessage = { hiddenUntil: 0 };
    }
    setting.sponsorMessage.hiddenUntil = hiddenUntil;
    await AppStorageService.setAppState(setting);
  },

  injectGeneratedScript: async (data) => {
    // ExtensionLoader.loadStrategy.injectScript()
    debugger;
    await ScriptInjectionService.generateAndInjectCode(data);
  },

  // CSS Snapshot Actions
  getAllCSSSnapshots: async () => {
    return await AppStorageService.getAllCSSSnapshots();
  },

  getCSSSnapshot: async ({ data: id }) => {
    return await AppStorageService.getCSSSnapshot(id);
  },

  saveCSSSnapshot: async ({ data }) => {
    return await AppStorageService.saveCSSSnapshot(data);
  },

  removeCSSSnapshot: async ({ data: id }) => {
    return await AppStorageService.removeCSSSnapshot(id);
  },
});

export const {
  getState,
  setState,
  setupInitialState,
  deactivateAppInTab,
  changeLauncherIconOrder,
  changeFeaturePopupPosition,
  changeLauncherActiveFeature,
  changeCurrentWindowSize,
  minimizedFeaturePopup,
  changePreventDefault,
  changeViewType,
  getAllAutomationScenarios,
  getAutomationScenario,
  saveAutomationScenario,
  saveFunction,
  injectGeneratedScript,
  saveNotification,
  saveFolder,
  saveSchedule,
  saveTrigger,
  saveExecutionHistory,
  removeAutomationScenario,
  addStepToAutomationScenario,
  hideSponsorMessage,
  generateAndInjectCode,
  // CSS Snapshot Actions
  getAllCSSSnapshots,
  getCSSSnapshot,
  saveCSSSnapshot,
  removeCSSSnapshot,
} = actionsContextSlice;
