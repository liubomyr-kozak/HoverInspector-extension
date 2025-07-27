import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { appSettingsInitial } from "@entrypoints/core/initialData/app.ts";
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
        ...action.payload,
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

    setMinimizedFeaturePopup(state, action: PayloadAction<any>) {
      state.featurePopupIsMinimized = action.payload;
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

    hideSponsorMessage(state, action: PayloadAction<number>) {
      if (!state.sponsorMessage) {
        state.sponsorMessage = { hiddenUntil: 0 };
      }
      state.sponsorMessage.hiddenUntil = action.payload;
    },

    addColorToHistory(state, action: PayloadAction<string>) {
      // Don't add duplicate colors
      if (!state.colorHistory.includes(action.payload)) {
        // Limit history to 10 colors (remove oldest if needed)
        if (state.colorHistory.length >= 10) {
          state.colorHistory = state.colorHistory.slice(1);
        }
        state.colorHistory.push(action.payload);
      }
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
  setMinimizedFeaturePopup,
  setPreventDefault,
  setIsSingleSelect,
  setShowAllBorders,
  setSelectedElementType,
  hideSponsorMessage,
  addColorToHistory,
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