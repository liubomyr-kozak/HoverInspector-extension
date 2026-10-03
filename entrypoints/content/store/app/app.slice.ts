import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { appSettingsInitial, migrateAppSettings } from "@entrypoints/core/initialData/app.ts";
import { ICON_ITEMS } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";

const USER_EVENT_SCROLL_CONFIRM = "USER_EVENT_SCROLL_CONFIRM";
const USER_EVENT_SELECT_CONFIRM = "USER_EVENT_SELECT_CONFIRM";
const USER_EVENT_HOVER_CONFIRM = "USER_EVENT_HOVER_CONFIRM";

const appSlice = createSlice({
  name: "app",
  initialState: appSettingsInitial,
  reducers: {
    //         case USER_EVENT_HOVER_CONFIRM:
    // case USER_EVENT_SELECT_CONFIRM:
    //     case USER_EVENT_SCROLL_CONFIRM:
    //     return {
    //         ...state,
    //         userAction: action
    //     };
    userEventHoverConfirm(state: any) {
      state.userAction = {
        type: USER_EVENT_HOVER_CONFIRM,
      };
    },
    userEventSelectConfirm(state: any) {
      state.userAction = {
        type: USER_EVENT_SELECT_CONFIRM,
      };
    },
    userEventScrollConfirm(state: any) {
      state.userAction = {
        type: USER_EVENT_SCROLL_CONFIRM,
      };
    },
    appInit(state) {
      return state;
    },
    setLocalAppSetting(state, action: PayloadAction<any>) {
      return {
        ...migrateAppSettings(action.payload),
        isActive: true,
      };
    },
    updateUserStatus(state: any, action: PayloadAction<any>) {
      state.user.status = action.payload;
    },
    updatePopupSetting(state: any, action: PayloadAction<any>) {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },
    setActiveApp(state: any) {
      state.isActive = true;
    },
    setDisableApp(state: any) {
      state.isActive = false;
    },

    setLauncherIconOrder(state, action: PayloadAction<string[]>) {
      return {
        ...state,
        launcher: {
          ...state.launcher,
          iconOrder: action.payload,
        },
      };
    },

    toggleLauncherActiveIcon(state, action: PayloadAction<string>) {
      const id = action.payload;

      if (state.launcher.activeIcons.includes(id)) {
        state.launcher.activeIcons = state.launcher.activeIcons.filter((i) => i !== id);
      } else {
        const includeNotMultipleView = state.launcher.activeIcons.filter((i) => {
          return ICON_ITEMS.find((feature) => feature.id === i)?.multipleView;
        });

        includeNotMultipleView.push(id);
        state.launcher.activeIcons = includeNotMultipleView;
      }
    },

    forceLauncherActiveIcon(state, action: PayloadAction<string>) {
      const id = action.payload;

      state.launcher.activeIcons = [id];
    },

    setFeaturePopupPosition(state, action: PayloadAction<any>) {
      state.featurePopupPosition = action.payload;
    },

    setPreventDefault(state, action: PayloadAction<any>) {
      state.preventDefault = action.payload;
    },

    setIsSingleSelect(state, action: PayloadAction<any>) {
      state.isSingleSelect = action.payload;
    },

    setShowAllBorders(state, action: PayloadAction<any>) {
      state.showAllBorders = action.payload;
    },

    setViewType(state, action: PayloadAction<any>) {
      state.viewType = action.payload;
    },

    setSelectedElementType(state, action: PayloadAction<any>) {
      state.selectedElementType = action.payload;
    },

    // A second click locks the hovered (target) element until the next click
    setTargetLocked(state: any, action: PayloadAction<boolean>) {
      state.isTargetLocked = action.payload;
    },

    hideSponsorMessage(state, action: PayloadAction<number>) {
      if (!state.sponsorMessage) {
        state.sponsorMessage = { hiddenUntil: 0 };
      }
      state.sponsorMessage.hiddenUntil = action.payload;
    },

    addColorToHistory(state, action: PayloadAction<string>) {
      // Most recent last, no duplicates, at most 20 colors
      const history = (state.colorHistory || []).filter((color) => color !== action.payload);
      history.push(action.payload);
      state.colorHistory = history.slice(-20);
    },

    setVisibleFeatures(state, action: PayloadAction<string[]>) {
      state.visibleFeatures = action.payload;
    },

    toggleFeatureVisibility(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.visibleFeatures.includes(id)) {
        state.visibleFeatures = state.visibleFeatures.filter((featureId) => featureId !== id);
      } else {
        state.visibleFeatures = [...state.visibleFeatures, id];
      }
    },

    setMinimizedFeatures(state, action: PayloadAction<string[]>) {
      state.minimizedFeatures = action.payload;
    },

    toggleFeatureMinimized(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.minimizedFeatures?.includes(id)) {
        state.minimizedFeatures = state.minimizedFeatures.filter((featureId) => featureId !== id);
      } else {
        state.minimizedFeatures = [...(state.minimizedFeatures || []), id];
      }
    },

    clearAllActiveIcons(state) {
      state.launcher.activeIcons = [];
    },

    /** Toolbar preferences changed in another tab */
    syncSharedSettings(state, action: PayloadAction<any>) {
      const stored = migrateAppSettings(action.payload);
      state.launcher.iconOrder = stored.launcher.iconOrder;
      state.visibleFeatures = stored.visibleFeatures;
      state.sponsorMessage = stored.sponsorMessage;
      state.colorHistory = stored.colorHistory;
    },

    setMinimizedLauncherPosition(state, action: PayloadAction<{ x: number; y: number }>) {
      state.launcher.minimizedPosition = action.payload;
    },
  },
});

export const {
  userEventHoverConfirm,
  userEventSelectConfirm,
  userEventScrollConfirm,
  setLocalAppSetting,
  setViewType,
  setActiveApp,
  setDisableApp,
  toggleLauncherActiveIcon,
  setLauncherIconOrder,
  forceLauncherActiveIcon,
  setFeaturePopupPosition,
  setPreventDefault,
  setIsSingleSelect,
  setShowAllBorders,
  setSelectedElementType,
  setTargetLocked,
  hideSponsorMessage,
  addColorToHistory,
  toggleFeatureVisibility,
  clearAllActiveIcons,
  toggleFeatureMinimized,
  setMinimizedLauncherPosition,
  syncSharedSettings,
} = appSlice.actions;

export default appSlice.reducer;

export const isActionTypeHover = (actionType: any) => {
  return actionType === USER_EVENT_HOVER_CONFIRM;
};

export const isActionTypeSelect = (actionType: any) => {
  return actionType === USER_EVENT_SELECT_CONFIRM;
};

export const isActionTypeScroll = (actionType: any) => {
  return actionType === USER_EVENT_SCROLL_CONFIRM;
};

export const selectAppActive = (state: any) => {
  return state.app.isActive;
};
