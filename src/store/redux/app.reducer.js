import {
  APP_INIT,
  GET_APP_SETTING,
  RENDER_STATUS,
  UPDATE_POPUP_SETTING,
  UPDATE_USER_STATUS,
  USER_EVENT_HOVER_CONFIRM,
  USER_EVENT_SCROLL_CONFIRM,
  USER_EVENT_SELECT_CONFIRM
} from "../app.constant";
import { appInitial } from "../initialState";

export const app = (state = appInitial, action) => {
  switch (action.type) {
    case RENDER_STATUS: {
      return {
        ...state,
        renderStatus: {
          ...state.renderStatus,
          ...action.payload
        }
      };
    }

    case USER_EVENT_HOVER_CONFIRM:
    case USER_EVENT_SELECT_CONFIRM:
    case USER_EVENT_SCROLL_CONFIRM:
      return {
        ...state,
        userAction: action
      };

    case APP_INIT: {
      return state;
    }

    case GET_APP_SETTING: {
      return {
        ...action.payload,
        isActive: true,
      };
    }

    case UPDATE_USER_STATUS: {
      return {
        ...state,
        user: {
          ...state.user,
          status: action.payload
        }
      };
    }

    case UPDATE_POPUP_SETTING: {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
    }
    default:
      return state;
  }
};
