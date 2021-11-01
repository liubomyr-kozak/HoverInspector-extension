import { call, put, select, takeEvery } from "redux-saga/effects";

import PopupSettingModel from "../../core/Models/PopupSettingModel";
import ExtensionStorageManager from "../../core/services/ExtensionStorageManager";
import DomNodeManager from "../../core/DomNodeManager";
import { FreezeSelect } from "../../core/services/FreezeSelect";

import {
  REVERT_LAST_USER_ACTION,
  UPDATE_APP_SETTING,
  UPDATE_POPUP_SETTING,
  USER_EVENT_HOVER,
  USER_EVENT_HOVER_CONFIRM,
  USER_EVENT_SCROLL,
  USER_EVENT_SCROLL_CONFIRM,
  USER_EVENT_SELECT,
  USER_EVENT_SELECT_CONFIRM
} from "../app.constant";

const freezeSelect = new FreezeSelect();

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

export function* revertLastUserActionSaga() {
  yield takeEvery(REVERT_LAST_USER_ACTION, revertLastUserActionWatcher);
}

function* revertLastUserActionWatcher() {
  const selectedElement = DomNodeManager.get('selectedElement');
  const hoverElement = DomNodeManager.get('hoverElement');

  if (selectedElement && hoverElement && freezeSelect.isFreeze) {
    DomNodeManager.remove('hoverElement');
    const candidateToHoverElement = DomNodeManager.get('candidateToHoverElement');
    if (candidateToHoverElement) {

      DomNodeManager.update({ 'hoverElement': candidateToHoverElement });
    }
    yield put({ type: USER_EVENT_HOVER_CONFIRM });
    freezeSelect.manualUnfreeze();
    return
  }

  if (selectedElement && !freezeSelect.isFreeze) {
    freezeSelect.reset();
    DomNodeManager.remove('selectedElement');
    yield put({ type: USER_EVENT_SELECT_CONFIRM });
    return
  }
}


// *************************************
// USER_EVENT_HOVER USER_EVENT_SCROLL USER_EVENT_SELECT
// *************************************


export function* userEventHoverSaga() {
  yield takeEvery(USER_EVENT_HOVER, userEventWatcher);
}

export function* userEventSelectSaga() {
  yield takeEvery(USER_EVENT_SELECT, userEventWatcher);
}

function* userEventWatcher({ type: userEventType }) {
  freezeSelect.precessFreeze(userEventType === USER_EVENT_SELECT);

  if (freezeSelect.isFreeze) {
    return;
  }

  if (userEventType === USER_EVENT_SELECT) {
    const oldSelectedElement = DomNodeManager.get('selectedElement');
    let selectedElement;

    if (freezeSelect.isManualUnfreeze) {
      selectedElement = oldSelectedElement || DomNodeManager.get('candidateToSelectedElement');
      freezeSelect.manualFreeze();
    } else {
      selectedElement = DomNodeManager.get('candidateToSelectedElement');
    }

    DomNodeManager.update({ selectedElement });
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