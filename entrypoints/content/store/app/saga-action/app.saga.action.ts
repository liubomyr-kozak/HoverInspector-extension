import { put, select } from "redux-saga/effects";

import PopupSettingModel from "@entrypoints/core/Models/PopupSettingModel.ts";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";
import { FreezeSelect } from "@entrypoints/core/services/FreezeSelect.ts";
import { sagaEnhancer } from "@entrypoints/core/libs/sagaEnhancer.ts";
import {
  clearAllActiveIcons,
  forceLauncherActiveIcon,
  setFeaturePopupPosition,
  setLauncherIconOrder,
  setLocalAppSetting,
  setMinimizedLauncherPosition,
  setViewType,
  syncSharedSettings,
  toggleFeatureMinimized,
  toggleFeatureVisibility,
  toggleLauncherActiveIcon,
  userEventHoverConfirm,
  userEventSelectConfirm,
} from "@entrypoints/content/store/app/app.slice.ts";
import { closeNoteForm } from "@entrypoints/content/store/notes/notes.slice";
import { closeElementCompare } from "@entrypoints/content/store/elementCompare/elementCompare.slice";
import { closeElementDetails } from "@entrypoints/content/store/elementDetails/elementDetails.slice";

const freezeSelect = new FreezeSelect();

export const onUpdateEventPreventDefaultWatcher = sagaEnhancer(function* updateEventPreventDefaultWatcher(data) {
  PopupSettingModel.setPreventDefault(data.payload.preventDefault);

  yield ExtensionStorageManager.changePreventDefault(data.payload.preventDefault);
});

export const onUpdateInspectorViewTypeWatcher = sagaEnhancer(function* updateInspectorViewTypeWatcher(data) {
  yield ExtensionStorageManager.changeViewType(data.payload);

  yield put(setViewType(data.payload));
});

export const onUpdateAppSettingWatcher = sagaEnhancer(function* updateAppSettingWatcherFn() {
  const { app } = yield select();

  const settings = yield ExtensionStorageManager.getState();
  yield ExtensionStorageManager.setState({
    ...(settings as any),
    user: app.user,
    settings: app.settings,
  });
});

export const onUserEventSelectWatcher = sagaEnhancer(function* userEventSelectWatcherFn({ type: userEventType }) {
  freezeSelect.precessFreeze(true);

  if (freezeSelect.isFreeze) {
    return;
  }

  const oldSelectedElement = DomNodeManager.get("selectedElement");
  let selectedElement;

  if (freezeSelect.isManualUnfreeze) {
    selectedElement = oldSelectedElement || DomNodeManager.get("candidateToSelectedElement");
    freezeSelect.manualFreeze();
  } else {
    selectedElement = DomNodeManager.get("candidateToSelectedElement");
  }

  DomNodeManager.setIsFirstNodeSelected(true);

  DomNodeManager.update({ selectedElement });
  yield put(userEventSelectConfirm());
  // update hover when select and freeze element
  DomNodeManager.update({ hoverElement: DomNodeManager.get("candidateToHoverElement") });
  yield put(userEventHoverConfirm());
});

export const onUserEventHoverWatcher = sagaEnhancer(function* userEventHoverWatcherFn({ type: userEventType }) {
  freezeSelect.precessFreeze(false);

  if (freezeSelect.isFreeze) {
    return;
  }

  DomNodeManager.update({ hoverElement: DomNodeManager.get("candidateToHoverElement") });
  yield put(userEventHoverConfirm());
  return;
});

export const onInitAppSetting = sagaEnhancer(function* initAppSettingFn() {
  const initData = yield ExtensionStorageManager.initInitialData();

  PopupSettingModel.setPreventDefault(!!initData.preventDefault);

  yield put(setLocalAppSetting(initData));
});

export const onChangeLauncherIconOrder = sagaEnhancer(function* changeLauncherIconOrderFn({
  payload,
}: {
  payload: string[];
}) {
  yield ExtensionStorageManager.changeLauncherIconOrder(payload);

  yield put(setLauncherIconOrder(payload));
});

export const onChangeFeaturePopupPosition = sagaEnhancer(function* changeFeaturePopupPositionFn({
  payload,
}: {
  payload: any;
}) {
  yield ExtensionStorageManager.changeFeaturePopupPosition(payload);

  yield put(setFeaturePopupPosition(payload));
});

export const onChangeLauncherActiveFeature = sagaEnhancer(function* changeLauncherActiveFeatureFn({
  payload,
}: {
  payload: any;
}) {
  const item = payload;

  if (!item.multipleView) {
    if (item.isActive) {
      yield put(toggleLauncherActiveIcon(item.id));
    } else {
      yield put(forceLauncherActiveIcon(item.id));
    }
  }

  if (item.multipleView) {
    yield put(toggleLauncherActiveIcon(item.id));
  }

  let state = yield select();

  yield ExtensionStorageManager.changeLauncherActiveFeature(state.app.launcher.activeIcons);

  // Check if feature popup goes out of window bounds and adjust position if needed
  const { featurePopupPosition } = state.app;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let adjustedPosition = { ...featurePopupPosition };
  let needsAdjustment = false;

  // Check if popup goes out of right boundary
  if (featurePopupPosition.x + featurePopupPosition.width > windowWidth) {
    adjustedPosition.x = Math.max(0, windowWidth - featurePopupPosition.width);
    needsAdjustment = true;
  }

  // Check if popup goes out of bottom boundary
  if (featurePopupPosition.y + featurePopupPosition.height > windowHeight) {
    adjustedPosition.y = Math.max(0, windowHeight - featurePopupPosition.height);
    needsAdjustment = true;
  }

  // Check if popup goes out of left boundary
  if (featurePopupPosition.x < 0) {
    adjustedPosition.x = 0;
    needsAdjustment = true;
  }

  // Check if popup goes out of top boundary
  if (featurePopupPosition.y < 0) {
    adjustedPosition.y = 0;
    needsAdjustment = true;
  }

  // If position needs adjustment, update both Redux state and localStorage
  if (needsAdjustment) {
    yield put(setFeaturePopupPosition(adjustedPosition));

    yield ExtensionStorageManager.changeFeaturePopupPosition(adjustedPosition);
  }
});

export const onToggleLauncherActiveIcon = sagaEnhancer(function* onToggleLauncherActiveIconFn(action) {
  // After the icon is toggled in the Redux state, we need to persist the changes
  // Wait for the state to update with the new activeIcons
  const state = yield select();

  // Save the updated activeIcons to storage
  yield ExtensionStorageManager.changeLauncherActiveFeature(state.app.launcher.activeIcons);
});

export const onChangeVisibleFeatures = sagaEnhancer(function* changeVisibleFeaturesFn({
  payload,
}: {
  payload: string[];
}) {
  yield ExtensionStorageManager.changeVisibleFeatures(payload);
});

export const onToggleFeatureVisibility = sagaEnhancer(function* onToggleFeatureVisibilityFn(action) {
  yield put(toggleFeatureVisibility(action.payload as string));

  // After the feature visibility is toggled in the Redux state, persist the changes
  const state = yield select();
  // Save the updated visibleFeatures to storage
  yield ExtensionStorageManager.changeVisibleFeatures(state.app.visibleFeatures);
});

export const onChangeMinimizedFeatures = sagaEnhancer(function* changeMinimizedFeaturesFn({
  payload,
}: {
  payload: string[];
}) {
  yield ExtensionStorageManager.changeMinimizedFeatures(payload);
});

export const onToggleFeatureMinimized = sagaEnhancer(function* onToggleFeatureMinimizedFn({ payload }) {
  // payload: { featureKey: "automation", isMinimized: true/false }

  const currentState = yield select();
  const { featureKey } = payload;
  const isCurrentlyMinimized = currentState.app.minimizedFeatures?.includes(featureKey);

  if (!isCurrentlyMinimized) {
    // First click: Close current popup, minimize launcher, update storage
    // Clear all active icons (closes current popup)
    yield put(clearAllActiveIcons());
    // Add feature to minimized features
    yield put(toggleFeatureMinimized(featureKey));
  } else {
    // Second click: Close minimized, open feature popup and launcher, update storage
    // Remove feature from minimized features
    yield put(toggleFeatureMinimized(featureKey));
    // Activate the feature (open launcher and feature popup)
    yield put(forceLauncherActiveIcon(featureKey));
  }

  // After the feature minimized state is toggled in the Redux state, persist the changes
  const state = yield select();

  // Save both lists in one write so neither change can overwrite the other
  yield ExtensionStorageManager.changeMinimizedFeaturesAndActiveIcons(
    state.app.minimizedFeatures,
    state.app.launcher.activeIcons,
  );
});

export const onClearAllActiveIcons = sagaEnhancer(function* onClearAllActiveIconsFn(action) {
  yield put(clearAllActiveIcons());

  // Close all child popups when the main feature popup is closed
  yield put(closeNoteForm());
  yield put(closeElementCompare());
  yield put(closeElementDetails());

  // After the clearAllActiveIcons action is dispatched, we need to persist the changes
  // Wait for the state to update with the cleared activeIcons (empty array)
  const state = yield select();

  // Save the updated activeIcons (now empty) to storage
  yield ExtensionStorageManager.changeLauncherActiveFeature(state.app.launcher.activeIcons);
});

export const onChangeMinimizedLauncherPosition = sagaEnhancer(function* changeMinimizedLauncherPositionFn({
  payload,
}: {
  payload: { x: number; y: number };
}) {
  // Update Redux state first
  yield put(setMinimizedLauncherPosition(payload));

  // Then persist to storage
  yield ExtensionStorageManager.changeMinimizedLauncherPosition(payload);
});

/** Closes a minimized tool's pill without opening the tool */
export const onCloseMinimizedFeature = sagaEnhancer(function* onCloseMinimizedFeatureFn({ payload }) {
  const { featureKey } = payload as { featureKey: string };
  const current = yield select();
  if (!current.app.minimizedFeatures?.includes(featureKey)) return;

  yield put(toggleFeatureMinimized(featureKey));
  const state = yield select();
  yield ExtensionStorageManager.changeMinimizedFeatures(state.app.minimizedFeatures);
});

/**
 * Settings are one shared object, but each tab keeps its own copy. When a tab comes back into view,
 * pick up toolbar changes made in another tab; otherwise the next toggle here would write the stale
 * list back and undo them.
 */
export const onSyncSharedSettings = sagaEnhancer(function* onSyncSharedSettingsFn() {
  const stored = yield ExtensionStorageManager.getState();
  if (stored) yield put(syncSharedSettings(stored));
});
