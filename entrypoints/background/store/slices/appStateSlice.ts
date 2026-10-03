import { chromeActionsSlice } from "@entrypoints/core/libs/chromeActionsSlice.ts";
import { appStateActions } from "../actions/appStateActions.ts";

export const appStateSlice = chromeActionsSlice(appStateActions);

export const {
  getState,
  setState,
  setupInitialState,
  deactivateAppInTab,
  changeLauncherIconOrder,
  changeFeaturePopupPosition,
  changeLauncherActiveFeature,
  changeMinimizedLauncherPosition,
  changeCurrentWindowSize,
  changeVisibleFeatures,
  changeMinimizedFeatures,
  changeMinimizedFeaturesAndActiveIcons,
  changePreventDefault,
  changeViewType,
  hideSponsorMessage,
} = appStateSlice;
