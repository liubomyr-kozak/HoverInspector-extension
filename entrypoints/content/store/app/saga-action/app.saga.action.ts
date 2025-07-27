import { put, select, takeLatest } from "redux-saga/effects";

import PopupSettingModel from "@entrypoints/core/Models/PopupSettingModel.ts";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";
import { FreezeSelect } from "@entrypoints/core/services/FreezeSelect.ts";
import { sagaEnhancer } from "@entrypoints/core/libs/sagaEnhancer.ts";
import {
  forceLauncherActiveIcon,
  setFeaturePopupPosition,
  setLauncherIconOrder,
  setLocalAppSetting,
  setMinimizedFeaturePopup,
  setViewType,
  toggleLauncherActiveIcon,
  userEventHoverConfirm,
  userEventSelectConfirm,
} from "@entrypoints/content/store/app/app.slice.ts";

const freezeSelect = new FreezeSelect();

export const onUpdateEventPreventDefaultWatcher = sagaEnhancer(function* updateEventPreventDefaultWatcher(data) {
  PopupSettingModel.setPreventDefault(data.payload.preventDefault);

  yield ExtensionStorageManager.changePreventDefault(data.payload.preventDefault);
});

export const onUpdateInspectorViewTypeWatcher = sagaEnhancer(function* updateInspectorViewTypeWatcher(data) {
  yield ExtensionStorageManager.changeViewType(data.payload);

  yield put(setViewType(data.payload));
});

function* updateAppSettingWatcher() {
  const { app } = yield select();

  ExtensionStorageManager.getState().then((settings) => {
    const storeSetting = {
      ...(settings as any),
      user: app.user,
      settings: app.settings,
    };
    ExtensionStorageManager.setState(storeSetting);
  });
}

export const onUpdateAppSettingWatcher = sagaEnhancer(updateAppSettingWatcher);

export const onUserEventSelectWatcher = sagaEnhancer(function* userEventSelectWatcher({ type: userEventType }) {
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

export const onUserEventHoverWatcher = sagaEnhancer(function* userEventHoverWatcher({ type: userEventType }) {
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

export const onChangeLauncherIconOrder = sagaEnhancer(function* changeLauncherIconOrder({
  payload,
}: {
  payload: string[];
}) {
  yield ExtensionStorageManager.changeLauncherIconOrder(payload);

  yield put(setLauncherIconOrder(payload));
});

export const onChangeFeaturePopupPosition = sagaEnhancer(function* changeFeaturePopupPosition({
  payload,
}: {
  payload: any;
}) {
  yield ExtensionStorageManager.changeFeaturePopupPosition(payload);

  yield put(setFeaturePopupPosition(payload));
});

export const onChangeLauncherActiveFeature = sagaEnhancer(function* changeLauncherActiveFeature({
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
});

export const onMinimizedFeaturePopup = sagaEnhancer(function* onMinimizedFeaturePopup({ payload }: { payload: any }) {
  yield ExtensionStorageManager.minimizedFeaturePopup(payload);

  yield put(setMinimizedFeaturePopup(payload));
});

export const onToggleLauncherActiveIcon = sagaEnhancer(function* onToggleLauncherActiveIcon(action) {
  // After the icon is toggled in the Redux state, we need to persist the changes
  // Wait for the state to update with the new activeIcons
  const state = yield select();

  // Save the updated activeIcons to storage
  yield ExtensionStorageManager.changeLauncherActiveFeature(state.app.launcher.activeIcons);
});

// Set the correct action type to match the Redux action
onToggleLauncherActiveIcon.actionType = "app/toggleLauncherActiveIcon";
