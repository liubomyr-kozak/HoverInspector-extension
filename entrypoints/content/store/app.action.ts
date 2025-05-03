import {
    CLOSE_APP_POPUP,
    GET_APP_SETTING,
    REVERT_LAST_USER_ACTION,
    UPDATE_APP_SETTING,
    UPDATE_POPUP_SETTING,
} from "./app.constant.ts";


export const closeSettingPopup = () => (dispatch: any) => {
    dispatch({
        type: CLOSE_APP_POPUP,
        payload: {
            isOpenAppPopup: false
        }
    });
};

export const updatePopupSetting = (data: any) => (dispatch: any) => {
    dispatch({type: UPDATE_POPUP_SETTING, payload: data});
};
