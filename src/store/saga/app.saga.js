import { call, put, select, takeEvery } from "redux-saga/effects";

import PopupSettingModel from "../../core/Models/PopupSettingModel";
import ExtensionStorageManager from "../../core/services/ExtensionStorageManager";
import DomNodeManager from "../../core/DomNodeManager";
import { FreezeSelect } from "../../core/services/FreezeSelect";

import {
  UPDATE_APP_SETTING,
  UPDATE_POPUP_SETTING,
  USER_EVENT_HOVER,
  USER_EVENT_HOVER_CONFIRM,
  USER_EVENT_SCROLL,
  USER_EVENT_SCROLL_CONFIRM,
  USER_EVENT_SELECT,
  USER_EVENT_SELECT_CONFIRM
} from "../app.constant";

// *************************************
// UPDATE_POPUP_SETTING
// *************************************

export function* updatePopupSettingSaga() {
  yield takeEvery(UPDATE_POPUP_SETTING, updatePopupSettingWatcher);
}

function* updatePopupSettingWatcher(data) {
  PopupSettingModel.setPreventDefault(data.payload.preventDefault);
  yield call(updateAppSettingWatcher);
}

// *************************************
// UPDATE_APP_SETTING
// *************************************

export function* updateAppSettingSaga() {
  yield takeEvery(UPDATE_APP_SETTING, updateAppSettingWatcher);
}

function* updateAppSettingWatcher() {
  const { app } = yield select();

  ExtensionStorageManager.getSettings()
    .then((settings) => {
      const storeSetting = {
        ...settings,
        user: app.user,
        settings: app.settings
      };
      ExtensionStorageManager.setSettings(storeSetting)
    });
}

// *************************************
// USER_EVENT_HOVER USER_EVENT_SCROLL USER_EVENT_SELECT
// *************************************

export function* userEventHoverSaga() {
  yield takeEvery(USER_EVENT_HOVER, userEventWatcher);
}

export function* userEventScrollSaga() {
  yield takeEvery(USER_EVENT_SCROLL, userEventWatcher);
}

export function* userEventSelectSaga() {
  yield takeEvery(USER_EVENT_SELECT, userEventWatcher);
}

const freezeSelect = new FreezeSelect();

function* userEventWatcher({ type: userEventType }) {
  if (userEventType === USER_EVENT_SCROLL) {
    yield put({ type: USER_EVENT_SCROLL_CONFIRM });
    return;
  }

  freezeSelect.precessFreeze(userEventType === USER_EVENT_SELECT);

  if (freezeSelect.isFreeze) {
    return;
  }

  if (userEventType === USER_EVENT_SELECT) {
    DomNodeManager.update({ selectedElement: DomNodeManager.get('candidateToSelectedElement') });
    yield put({ type: USER_EVENT_SELECT_CONFIRM });
    // update hover when select and freeze element
    DomNodeManager.update({ hoverElement: DomNodeManager.get('candidateToHoverElement') });
    yield put({ type: USER_EVENT_HOVER_CONFIRM });
    return;
  }


  if (userEventType === USER_EVENT_HOVER) {
    DomNodeManager.update({ hoverElement: DomNodeManager.get('candidateToHoverElement') });
    yield put({ type: USER_EVENT_HOVER_CONFIRM });
    return;
  }
}