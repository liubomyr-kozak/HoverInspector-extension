import {
  CLOSE_APP_POPUP,
  GET_APP_SETTING, RENDER_STATUS, UPDATE_APP_SETTING, UPDATE_POPUP_SETTING,
} from "./app.constant";
import ExtensionStorageManager from "../core/services/ExtensionStorageManager";
import PopupSettingModel from "../core/Models/PopupSettingModel";

export const initAppSetting = () => (dispatch) => {
  ExtensionStorageManager.getSettings()
    .then((initData) => {
      PopupSettingModel.setPreventDefault(!!initData.settings.preventDefault);
      dispatch({
        type: GET_APP_SETTING,
        payload: {
          settings: initData.settings,
          user: initData.user
        }
      });
    })
};

export const closeSettingPopup = () => (dispatch) => {
  dispatch({
    type: CLOSE_APP_POPUP,
    payload: {
      isOpenAppPopup: false
    }
  });
};

export const updatePopupSetting = (data) => (dispatch) => {
  dispatch({ type: UPDATE_POPUP_SETTING, payload: data });
};

export const updateAppSetting = () => (dispatch) => {
  dispatch({ type: UPDATE_APP_SETTING });
};


export const renderStatus = (data) => (dispatch) => {
  dispatch({ type: RENDER_STATUS, payload: data });
};
