import {
  onChangeFeaturePopupPosition,
  onChangeLauncherActiveFeature,
  onChangeLauncherIconOrder,
  onInitAppSetting,
  onMinimizedFeaturePopup,
  onToggleLauncherActiveIcon,
  onUpdateAppSettingWatcher,
  onUpdateEventPreventDefaultWatcher,
  onUpdateInspectorViewTypeWatcher,
  onUserEventHoverWatcher,
  onUserEventSelectWatcher,
} from "@entrypoints/content/store/app/saga-action/app.saga.action";
import { takeLatest } from "redux-saga/effects";

export function* appInit() {
  yield takeLatest(onUserEventSelectWatcher.actionType, onUserEventSelectWatcher);
  yield takeLatest(onUserEventHoverWatcher.actionType, onUserEventHoverWatcher);
  yield takeLatest(onInitAppSetting.actionType, onInitAppSetting);
  yield takeLatest(onUpdateEventPreventDefaultWatcher.actionType, onUpdateEventPreventDefaultWatcher);
  yield takeLatest(onUpdateInspectorViewTypeWatcher.actionType, onUpdateInspectorViewTypeWatcher);
  yield takeLatest(onUpdateAppSettingWatcher.actionType, onUpdateAppSettingWatcher);
  yield takeLatest(onChangeLauncherIconOrder.actionType, onChangeLauncherIconOrder);
  yield takeLatest(onChangeFeaturePopupPosition.actionType, onChangeFeaturePopupPosition);
  yield takeLatest(onChangeLauncherActiveFeature.actionType, onChangeLauncherActiveFeature);
  yield takeLatest(onMinimizedFeaturePopup.actionType, onMinimizedFeaturePopup);
  yield takeLatest(onToggleLauncherActiveIcon.actionType, onToggleLauncherActiveIcon);
}
