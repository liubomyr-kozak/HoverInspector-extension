import {
  CustomFunction,
  Scenario,
  ScheduleConfig,
  TriggerConfig,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types.ts";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";

/**
 * LocalAPIServer handles synchronization of automation scenarios, functions,
 * schedules and triggers with a remote backend server.
 */
class LocalAPIServer {
  private async getServerSettings() {
    const settings = await ExtensionStorageManager.getAutomationScenario("automation_server_settings");
    if (!settings?.serverUrl || !settings?.saveToBackend) {
      return null;
    }
    return settings;
  }

  generateCode = async () => {
    const settings = await this.getServerSettings();
    if (!settings || !settings.saveToBackend) return;

    try {
      const response = await fetch(`${settings.serverUrl}/generate-code`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      debugger;

      if (!response.ok) {
        console.error(`Failed to generate code: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error generating code:", error);
    }
  };

  /**
   * Syncs a scenario to the remote server
   * @param id The scenario ID
   * @param scenario The scenario data
   */
  public async syncScenario(id: string, scenario: Scenario): Promise<void> {
    const settings = await this.getServerSettings();
    if (!settings || !settings.syncScenarios) return;

    try {
      const response = await fetch(`${settings.serverUrl}/api/scenarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          scenario,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to sync scenario ${id} to server: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error syncing scenario ${id} to server:`, error);
    }
  }

  /**
   * Syncs a function to the remote server
   * @param id The function ID
   * @param func The function data
   */
  public async syncFunction(id: string, func: CustomFunction): Promise<void> {
    const settings = await this.getServerSettings();
    if (!settings || !settings.syncFunctions) return;

    debugger;

    try {
      const response = await fetch(`${settings.serverUrl}/api/functions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: id,
          value: func,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to sync function ${id} to server: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error syncing function ${id} to server:`, error);
    }
  }

  /**
   * Syncs a schedule to the remote server
   * @param id The schedule ID
   * @param schedule The schedule data
   */
  public async syncSchedule(id: string, schedule: ScheduleConfig): Promise<void> {
    const settings = await this.getServerSettings();
    if (!settings || !settings.syncSchedules) return;

    try {
      const response = await fetch(`${settings.serverUrl}/api/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          schedule,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to sync schedule ${id} to server: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error syncing schedule ${id} to server:`, error);
    }
  }

  /**
   * Syncs a trigger to the remote server
   * @param id The trigger ID
   * @param trigger The trigger data
   */
  public async syncTrigger(id: string, trigger: TriggerConfig): Promise<void> {
    const settings = await this.getServerSettings();
    if (!settings || !settings.syncTriggers) return;

    try {
      const response = await fetch(`${settings.serverUrl}/api/triggers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          trigger,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to sync trigger ${id} to server: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error syncing trigger ${id} to server:`, error);
    }
  }

  /**
   * Deletes a scenario from the remote server
   * @param id The scenario ID to delete
   */
  public async deleteScenario(id: string): Promise<void> {
    const settings = await this.getServerSettings();
    if (!settings || !settings.syncScenarios) return;

    try {
      const response = await fetch(`${settings.serverUrl}/api/scenarios/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error(`Failed to delete scenario ${id} from server: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting scenario ${id} from server:`, error);
    }
  }

  /**
   * Deletes a function from the remote server
   * @param id The scenario ID to delete
   */
  public async deleteFunction(id: string): Promise<void> {
    const settings = await this.getServerSettings();
    if (!settings || !settings.syncScenarios) return;

    try {
      const response = await fetch(`${settings.serverUrl}/api/functions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error(`Failed to delete Function ${id} from server: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting Function ${id} from server:`, error);
    }
  }

  /**
   * Fetches all functions from the remote server
   * @returns Promise resolving to the functions fetched from the server
   */
  public async getAllFunctionsFromServer(): Promise<Record<string, CustomFunction>> {
    const settings = await this.getServerSettings();
    if (!settings || !settings.syncFunctions) return {};

    try {
      const response = await fetch(`${settings.serverUrl}/api/functions`);

      if (!response.ok) {
        console.error(`Failed to fetch functions from server: ${response.statusText}`);
        return {};
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching functions from server:", error);
      return {};
    }
  }
}

export default new LocalAPIServer();
