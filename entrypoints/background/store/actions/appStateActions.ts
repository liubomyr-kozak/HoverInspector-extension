import AppStorageService from "@entrypoints/core/services/storage/AppStorageService.ts";
import { appSettingsInitial } from "@entrypoints/core/initialData/app.ts";
import ExtensionLoader from "@entrypoints/core/services/ExtensionLoader.ts";

export const appStateActions = {
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

    const newState = {
      ...setting,
      launcher: {
        ...setting.launcher,
        activeIcons,
      },
    };

    await AppStorageService.setAppState(newState);
  },

  changeMinimizedLauncherPosition: async ({ data: minimizedPosition }) => {
    const setting = await AppStorageService.getAppState();
    await AppStorageService.setAppState({
      ...setting,
      launcher: {
        ...setting.launcher,
        minimizedPosition,
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

  changeVisibleFeatures: async ({ data: visibleFeatures }) => {
    const setting = await AppStorageService.getAppState();
    await AppStorageService.setAppState({
      ...setting,
      visibleFeatures,
    });
  },

  changeMinimizedFeatures: async ({ data: minimizedFeatures }) => {
    const setting = await AppStorageService.getAppState();

    await AppStorageService.setAppState({
      ...setting,
      minimizedFeatures,
    });
  },

  changeMinimizedFeaturesAndActiveIcons: async ({ data: { minimizedFeatures, activeIcons } }) => {
    const setting = await AppStorageService.getAppState();

    await AppStorageService.setAppState({
      ...setting,
      minimizedFeatures,
      launcher: {
        ...setting.launcher,
        activeIcons,
      },
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

  hideSponsorMessage: async ({ data: hiddenUntil }) => {
    const setting = await AppStorageService.getAppState();
    if (!setting.sponsorMessage) {
      setting.sponsorMessage = { hiddenUntil: 0 };
    }
    setting.sponsorMessage.hiddenUntil = hiddenUntil;
    await AppStorageService.setAppState(setting);
  },
};
