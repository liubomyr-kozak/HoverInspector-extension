import AppStorageService from "@entrypoints/core/services/storage/AppStorageService.ts";
import { appSettingsInitial } from "@entrypoints/core/initialData/app.ts";
import ExtensionLoader from "@entrypoints/core/services/ExtensionLoader.ts";

/**
 * Every settings change is a read-modify-write of the whole settings object. Running them one at a
 * time keeps two quick changes (or two tabs) from overwriting each other.
 */
let settingsQueue: Promise<unknown> = Promise.resolve();
const updateAppState = (update: (setting: any) => any) => {
  const run = settingsQueue.then(async () => {
    const setting = (await AppStorageService.getAppState()) || appSettingsInitial;
    await AppStorageService.setAppState(update(setting));
  });
  settingsQueue = run.catch(() => undefined);
  return run;
};

export const appStateActions = {
  getState: async () => {
    return await AppStorageService.getAppState();
  },

  setState: async ({ data }) => {
    await updateAppState(() => data);
  },

  setupInitialState: async () => {
    await AppStorageService.setAppState(appSettingsInitial);

    return await AppStorageService.getAppState();
  },

  deactivateAppInTab: async (_request, sender?: chrome.runtime.MessageSender) => {
    await ExtensionLoader.loadStrategy.deactivate(sender?.tab?.id);
  },

  changeLauncherIconOrder: async ({ data: iconOrder }) => {
    await updateAppState((setting) => ({
      ...setting,
      launcher: {
        ...setting.launcher,
        iconOrder,
      },
    }));
  },

  changeFeaturePopupPosition: async ({ data: featurePopupPosition }) => {
    await updateAppState((setting) => ({
      ...setting,
      featurePopupPosition,
    }));
  },

  changeLauncherActiveFeature: async ({ data: activeIcons }) => {
    await updateAppState((setting) => ({
      ...setting,
      launcher: {
        ...setting.launcher,
        activeIcons,
      },
    }));
  },

  changeMinimizedLauncherPosition: async ({ data: minimizedPosition }) => {
    await updateAppState((setting) => ({
      ...setting,
      launcher: {
        ...setting.launcher,
        minimizedPosition,
      },
    }));
  },

  changeCurrentWindowSize: async ({ data: width }, sender?: chrome.runtime.MessageSender) => {
    const windowId = sender?.tab?.windowId ?? (await browser.windows.getCurrent()).id;
    if (windowId === undefined) return { success: false };

    try {
      // A maximized or fullscreen window ignores width changes
      await browser.windows.update(windowId, { state: "normal" });
      await browser.windows.update(windowId, { width: Math.round(width) });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  changeVisibleFeatures: async ({ data: visibleFeatures }) => {
    await updateAppState((setting) => ({
      ...setting,
      visibleFeatures,
    }));
  },

  changeMinimizedFeatures: async ({ data: minimizedFeatures }) => {
    await updateAppState((setting) => ({
      ...setting,
      minimizedFeatures,

    }));
  },

  changeMinimizedFeaturesAndActiveIcons: async ({ data: { minimizedFeatures, activeIcons } }) => {
    await updateAppState((setting) => ({
      ...setting,
      minimizedFeatures,
      launcher: {
        ...setting.launcher,
        activeIcons,
      },

    }));
  },

  changeColorHistory: async ({ data: colorHistory }) => {
    await updateAppState((setting) => ({
      ...setting,
      colorHistory,
    }));
  },

  changePreventDefault: async ({ data: preventDefault }) => {
    await updateAppState((setting) => ({
      ...setting,
      preventDefault,
    }));
  },

  changeViewType: async ({ data: viewType }) => {
    await updateAppState((setting) => ({
      ...setting,
      viewType,
    }));
  },

  hideSponsorMessage: async ({ data: hiddenUntil }) => {
    await updateAppState((setting) => ({
      ...setting,
      sponsorMessage: { ...setting.sponsorMessage, hiddenUntil },
    }));
  },
};
