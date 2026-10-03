import AppStorageService from "@entrypoints/core/services/storage/AppStorageService.ts";
import LocalAPIServer from "@entrypoints/core/services/api/LocalAPIServer.ts";
import ScriptInjectionService from "@entrypoints/core/services/ScriptInjectionService.ts";
import { injectScript } from "@entrypoints/shared/utils/scriptInjection.ts";

export const automationActions = {
  getAllAutomationScenarios: async () => {
    return await AppStorageService.getAllAutomationScenarios();
  },

  getAutomationScenario: async (data) => {
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

        injectScript({
          downloadUrl: response.downloadUrl,
          filename: response.filename,
          groupPrefix: "functions_",
        });
        // await ScriptInjectionService.generateAndInjectCode({
        //   serverUrl: settings.serverUrl,
        // });
      } catch (error) {
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

  removeAutomationScenario: async ({ data }) => {
    // The id is the full prefixed key (sc_..., sch_..., tr_...), sent as { id }
    const id = typeof data === "string" ? data : data?.id;
    if (!id || typeof id !== "string") {
      return { success: false, error: "Missing id" };
    }

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

  injectGeneratedScript: async (data) => {
    // ExtensionLoader.loadStrategy.injectScript()
    await ScriptInjectionService.generateAndInjectCode(data);
  },
};
