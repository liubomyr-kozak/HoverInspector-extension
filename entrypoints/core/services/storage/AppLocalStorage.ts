import { appSettingsInitial, migrateAppSettings } from "@entrypoints/core/initialData/app.ts";

import { APP_STORE_STATE } from "../../constants";
import LocalStorage from "./LocalStorage.ts";

class AppLocalStorage {
  localStorage: typeof LocalStorage;
  app_local_store_key: string;

  constructor() {
    this.localStorage = LocalStorage;
    this.app_local_store_key = APP_STORE_STATE;

    // create new data if it doesn't exist
    this.localStorage.get(this.app_local_store_key).then((data) => {
      if (!data || data.version !== appSettingsInitial.version) {
        this.localStorage.set(this.app_local_store_key, migrateAppSettings(data));
      }
    });
  }

  async getAppState(): Promise<any> {
    return await this.localStorage.get(this.app_local_store_key);
  }

  setAppState = async (newData: any): Promise<void> => {
    await this.localStorage.set(this.app_local_store_key, newData);
  };

  resetAppState = async (): Promise<void> => {
    await this.localStorage.set(this.app_local_store_key, appSettingsInitial);
  };
}

export default new AppLocalStorage();
