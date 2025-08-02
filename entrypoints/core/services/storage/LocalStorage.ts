// @ts-nocheck
import { isDevelopment } from "@entrypoints/shared/helpers.ts";

const localStorageChrome = {
  getAllItems: async () => await browser.storage.local.get(),
  getItem: async (key) => (await browser.storage.local.get(key))[key],
  setItem: async (key, val) => await browser.storage.local.set({ [key]: val }),
  removeItem: async (keys) => await browser.storage.local.remove(keys),
};

const syncStorageChrome = {
  getAllItems: async () => await browser.storage.sync.get(),
  getItem: async (key) => (await browser.storage.sync.get(key))[key],
  setItem: async (key, val) => await browser.storage.sync.set({ [key]: val }),
  removeItem: async (keys) => await browser.storage.sync.remove(keys),
};

let localStorageModule;

if (self?.window?.localStorage && isDevelopment()) {
  localStorageModule = self.window.localStorage;
} else {
  localStorageModule = localStorageChrome;
}

if (self) {
  if (!self.app) {
    self.app = {};
  }

  if (process.env.NODE_ENV !== "production") {
    self.app.localStorageModule = localStorageModule;
  }
}

class LocalStorage {
  getAllItems = async function () {
    if (isDevelopment()) {
      const items = {};
      for (let i = 0; i < localStorageModule.length; i++) {
        const key = localStorageModule.key(i);
        if (key) {
          items[key] = localStorageModule.getItem(key);
        }
      }

      return items;
    }

    return await localStorageModule.getAllItems();
  };

  get = async function (key) {
    if ((await localStorageModule.getItem(key)) != null) {
      const value = await localStorageModule.getItem(key);
      const data = value ? JSON.parse(value) : value;

      return data;
    } else {
      return null;
    }
  };

  set = async function (key, data) {
    return await localStorageModule.setItem(key, JSON.stringify(data));
  };

  clearButLeft = async function (key) {
    await localStorageModule.setItem(key, "{}");
    return JSON.parse(await localStorageModule.getItem(key));
  };

  fullDestroy = async function (key) {
    await localStorageModule.removeItem(key);
  };

  update = async function (key, newData) {
    if (!(await localStorageModule.getItem(key))) {
      await localStorageModule.setItem(key, JSON.stringify({}));
    }

    const values = JSON.stringify(newData);
    return await localStorageModule.setItem(key, values);
  };
}

export default new LocalStorage();
