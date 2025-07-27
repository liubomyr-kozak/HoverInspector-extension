import { CLOSE_APP_POPUP, UPDATE_POPUP_SETTING } from "./app.constant.ts";

export const closeSettingPopup = () => (dispatch: any) => {
  dispatch({
    type: CLOSE_APP_POPUP,
    payload: {
      isOpenAppPopup: false,
    },
  });
};

export const updatePopupSetting = (data: any) => (dispatch: any) => {
  dispatch({ type: UPDATE_POPUP_SETTING, payload: data });
};
