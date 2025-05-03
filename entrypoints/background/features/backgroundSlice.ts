import {chromeActionsSlice} from "@entrypoints/core/libs/chromeActionsSlice.ts";
import AppStorageService from "@entrypoints/core/services/storage/AppStorageService.ts";
import {appSettingsInitial} from "@entrypoints/core/initialData/app.ts";
import ExtensionLoader from "@entrypoints/core/services/ExtensionLoader.ts";
import LocalStorage from "@entrypoints/core/services/storage/LocalStorage.ts";
import {AUTOMATION_SCENARIO_KEY, AUTOMATION_SCENARIO_PREFIX} from "@entrypoints/core/constants/automation.ts";

export const actionsContextSlice = chromeActionsSlice({
    getState: async () => {
        return await AppStorageService.getAppState();
    },

    setState: async (data) => {
        await AppStorageService.setAppState(data);
    },

    setupInitialState: async () => {
        debugger;

        await AppStorageService.setAppState(appSettingsInitial);

        debugger;


        return await AppStorageService.getAppState();
    },

    deactivateAppInTab: async () => {
        ExtensionLoader.loadStrategy.deactivate()
    },

    changeLauncherIconOrder: async ({data: iconOrder}) => {
        const setting = await AppStorageService.getAppState();
        await AppStorageService.setAppState({
            ...setting,
            launcher: {
                ...setting.launcher,
                iconOrder
            }
        });
    },

    changeFeaturePopupPosition: async ({data: featurePopupPosition}) => {
        const setting = await AppStorageService.getAppState();
        await AppStorageService.setAppState({
            ...setting,
            featurePopupPosition,
        });
    },

    changeLauncherActiveFeature: async ({data: activeIcons}) => {
        const setting = await AppStorageService.getAppState();
        await AppStorageService.setAppState({
            ...setting,
            launcher: {
                ...setting.launcher,
                activeIcons
            }
        });
    },

    changeCurrentWindowSize: async ({data: width}) => {
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

    minimizedFeaturePopup: async ({data: featurePopupIsMinimized}) => {
        const setting = await AppStorageService.getAppState();
        await AppStorageService.setAppState({
            ...setting,
            featurePopupIsMinimized,
        });
    },

    changePreventDefault: async ({data: preventDefault}) => {
        const setting = await AppStorageService.getAppState();
        await AppStorageService.setAppState({
            ...setting,
            preventDefault,
        });
    },

    changeViewType: async ({data: viewType}) => {
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
    
    getAutomationScenario: async ({data: id}) => {
        return await AppStorageService.getAutomationScenario(id);
    },
    
    saveAutomationScenario: async ({data: {id, scenario}}) => {
        return await AppStorageService.saveAutomationScenario(id, scenario);
    },
    
    removeAutomationScenario: async ({data: id}) => {
        return await AppStorageService.removeAutomationScenario(id);
    },
    
    addStepToAutomationScenario: async ({data: {id, step}}) => {
        return await AppStorageService.addStepToAutomationScenario(id, step);
    },
    
    hideSponsorMessage: async ({data: hiddenUntil}) => {
        const setting = await AppStorageService.getAppState();
        if (!setting.sponsorMessage) {
            setting.sponsorMessage = { hiddenUntil: 0 };
        }
        setting.sponsorMessage.hiddenUntil = hiddenUntil;
        await AppStorageService.setAppState(setting);
    }
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
    removeAutomationScenario,
    addStepToAutomationScenario,
    hideSponsorMessage
} = actionsContextSlice;
